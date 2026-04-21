/**
 * 本地一体化服务器
 * - 静态文件服务
 * - AI 对练接口（场景初始化、顾客回合、行为评分）
 *
 * 启动：node server.js
 * 访问：http://localhost:8899
 */

const http = require('http');
const https = require('https');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const url = require('url');

// ── 配置 ──────────────────────────────────────
const PORT = 8899;
const MODEL = 'glm-4-flash';
const MODEL_ASR = 'glm-asr-2512';
const GLM_KEY = process.env.GLM_API_KEY || '';
const ASR_PROVIDER_DEFAULT = String(process.env.ASR_PROVIDER || 'xfyun').toLowerCase();
const XFYUN_APPID = process.env.XFYUN_APPID || '';
const XFYUN_API_KEY = process.env.XFYUN_API_KEY || '';
const XFYUN_API_SECRET = process.env.XFYUN_API_SECRET || '';
const XFYUN_WS_HOST = 'iat-api.xfyun.cn';
const XFYUN_WS_PATH = '/v2/iat';

const DEFAULT_SCENARIO = {
  name: '收银场景·会员引导',
  intro: '王阿姨把68元商品放在收银台，准备结账。',
  customerName: '王阿姨',
  customerProfile: '50岁左右，价格敏感，愿意听实在好处，不喜欢被强推。',
};

// ── MIME 类型 ──────────────────────────────────
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.jsx': 'application/javascript; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
};

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function toInt(n, fallback = 0) {
  const v = Number(n);
  return Number.isFinite(v) ? Math.round(v) : fallback;
}

function safeJSONParse(str, fallback = {}) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

function extractJSONObject(raw) {
  if (!raw) return null;
  const direct = safeJSONParse(raw, null);
  if (direct && typeof direct === 'object') return direct;
  const m = String(raw).match(/\{[\s\S]*\}/);
  return m ? safeJSONParse(m[0], null) : null;
}

function readJsonBody(req, cb) {
  let body = '';
  req.on('data', (d) => {
    body += d;
    if (body.length > 2 * 1024 * 1024) req.destroy();
  });
  req.on('end', () => {
    const parsed = safeJSONParse(body || '{}', null);
    if (!parsed) return cb(new Error('Invalid JSON'));
    cb(null, parsed);
  });
}

function writeJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(JSON.stringify(data));
}

// ── 顾客状态（结构） ────────────────────────────
function buildInitialCustomerState() {
  return {
    trust: 45,
    patience: 72,
    interest: 38,
    budgetSensitivity: 76,
    objectionLevel: 58,
    emotion: 'neutral',
    stage: 'opening',
    turn: 0,
  };
}

function normalizeCustomerState(input = {}) {
  const base = buildInitialCustomerState();
  return {
    trust: clamp(toInt(input.trust, base.trust), 0, 100),
    patience: clamp(toInt(input.patience, base.patience), 0, 100),
    interest: clamp(toInt(input.interest, base.interest), 0, 100),
    budgetSensitivity: clamp(toInt(input.budgetSensitivity, base.budgetSensitivity), 0, 100),
    objectionLevel: clamp(toInt(input.objectionLevel, base.objectionLevel), 0, 100),
    emotion: ['neutral', 'curious', 'interested', 'happy', 'annoyed'].includes(input.emotion) ? input.emotion : base.emotion,
    stage: ['opening', 'probing', 'value', 'objection', 'closing', 'done'].includes(input.stage) ? input.stage : base.stage,
    turn: Math.max(0, toInt(input.turn, base.turn)),
  };
}

function inferEmotion(state) {
  if (state.patience < 25 || state.trust < 30) return 'annoyed';
  if (state.interest > 78 && state.trust > 72 && state.objectionLevel < 35) return 'happy';
  if (state.interest > 58 && state.trust > 55) return 'interested';
  if (state.interest > 42) return 'curious';
  return 'neutral';
}

// ── 规则驱动：识别店员行为信号 ───────────────────
function analyzeClerkBehavior(text = '') {
  const t = String(text).trim();
  return {
    hasGreeting: /你好|您好|欢迎|光临|辛苦了/.test(t),
    asksNeed: /平时|经常|主要|需求|方便问|您一般|用不用/.test(t),
    asksMember: /会员|会员卡|积分|权益|开卡|办卡/.test(t),
    quantifiesBenefit: /(立减|直减|省)\s*\d+|减\s*\d+\s*元|\d+\s*元|\d+\s*张|\d+\s*折|满\s*\d+/.test(t),
    explainsRules: /次日|明天|生效|有效期|门槛|使用|到账|可用/.test(t),
    hasEmpathy: /理解|明白|担心|放心|我帮您|别着急|不着急/.test(t),
    triesClose: /现在|这会|帮您办|开通|扫码|确认|要不要办|我给您办/.test(t),
    hardSell: /必须|一定要|赶紧|立刻办|你就办吧/.test(t),
    vaguePitch: /很划算|很值|很优惠|特别好(?!.*\d)/.test(t),
    unclearOrNegative: /不知道|不清楚|随便|算了|自己看/.test(t),
    longWinded: t.length > 58,
    mentionsGift: /礼品|赠品|免费送|花茶/.test(t),
    mentionsCoupon: /券|优惠券/.test(t),
  };
}

// ── 规则驱动：更新顾客状态 ───────────────────────
function applyStateRules(prevState, signal) {
  const next = { ...prevState, turn: prevState.turn + 1 };
  const delta = {
    trust: 0,
    patience: 0,
    interest: 0,
    objectionLevel: 0,
  };
  const reasons = [];

  function bump(key, value, reason) {
    if (!delta[key] && delta[key] !== 0) return;
    delta[key] += value;
    if (reason) reasons.push(reason);
  }

  if (signal.hasGreeting) {
    bump('trust', 7, '开场礼貌提升信任');
    bump('patience', 4, '顾客更愿意继续听');
  }
  if (signal.asksNeed) {
    bump('trust', 5, '主动了解需求');
    bump('interest', 6, '问题贴近顾客场景');
  }
  if (signal.asksMember) {
    bump('interest', 5, '话题进入会员权益');
  }
  if (signal.quantifiesBenefit) {
    bump('interest', 12, '量化优惠提升兴趣');
    bump('trust', 4, '信息更具体');
    bump('objectionLevel', -9, '对价格异议下降');
  }
  if (signal.explainsRules) {
    bump('trust', 8, '关键规则讲清楚');
    bump('objectionLevel', -7, '不确定性下降');
  }
  if (signal.hasEmpathy) {
    bump('trust', 6, '情绪被接住');
    bump('patience', 7, '顾客更愿意听下去');
    bump('objectionLevel', -5, '异议缓和');
  }
  if (signal.triesClose && next.interest > 58) {
    bump('interest', 4, '收口动作促进成交');
  }
  if (signal.vaguePitch) {
    bump('trust', -7, '话术空泛，可信度下降');
    bump('interest', -4, '价值不够具体');
    bump('objectionLevel', 6, '顾客疑虑上升');
  }
  if (signal.hardSell) {
    bump('patience', -13, '强推引发反感');
    bump('trust', -10, '压迫式表达降低信任');
    bump('objectionLevel', 12, '防御心理上升');
  }
  if (signal.unclearOrNegative) {
    bump('trust', -12, '专业感不足');
    bump('interest', -8, '对话动机下降');
    bump('objectionLevel', 9, '异议上升');
  }
  if (signal.longWinded) {
    bump('patience', -8, '表达偏长，耐心下降');
  }

  next.trust = clamp(next.trust + delta.trust, 0, 100);
  next.patience = clamp(next.patience + delta.patience, 0, 100);
  next.interest = clamp(next.interest + delta.interest, 0, 100);
  next.objectionLevel = clamp(next.objectionLevel + delta.objectionLevel, 0, 100);

  if (next.turn <= 1) next.stage = 'opening';
  else if (signal.quantifiesBenefit || signal.mentionsCoupon) next.stage = 'value';
  else if (next.objectionLevel >= 60) next.stage = 'objection';
  else if (signal.triesClose && next.interest >= 60) next.stage = 'closing';
  else if (next.stage === 'opening') next.stage = 'probing';

  if (next.interest >= 80 && next.trust >= 75 && next.objectionLevel <= 30) {
    next.stage = 'done';
  }

  next.emotion = inferEmotion(next);
  return { nextState: next, delta, reasons };
}

// ── 两步式对话：第一步决策 ───────────────────────
function decideCustomerAction(state, signal) {
  if (state.patience < 24) {
    return {
      intent: 'want_leave',
      action: 'reject',
      emotion: 'annoyed',
      keyConcern: '时间和耐心不足',
      reason: '耐心过低，倾向尽快结束。',
    };
  }
  if (state.stage === 'done') {
    return {
      intent: 'ready_join',
      action: 'accept',
      emotion: 'happy',
      keyConcern: '办理流程是否方便',
      reason: '兴趣和信任已达成转化阈值。',
    };
  }
  if (signal.hardSell && state.patience < 45) {
    return {
      intent: 'raise_objection',
      action: 'question',
      emotion: 'annoyed',
      keyConcern: '被推销感过强',
      reason: '顾客感受到压力，需要先安抚情绪。',
    };
  }
  if (signal.quantifiesBenefit && !signal.explainsRules) {
    return {
      intent: 'ask_rule',
      action: 'question',
      emotion: state.emotion === 'annoyed' ? 'curious' : state.emotion,
      keyConcern: '优惠具体怎么用',
      reason: '顾客听到优惠后会追问规则。',
    };
  }
  if (signal.quantifiesBenefit && signal.explainsRules && state.interest >= 52) {
    return {
      intent: 'confirm_threshold',
      action: 'question',
      emotion: state.emotion,
      keyConcern: '门槛和适用范围',
      reason: '顾客开始确认细节，接近成交前核对。',
    };
  }
  if (state.objectionLevel > 62) {
    return {
      intent: 'raise_objection',
      action: 'question',
      emotion: state.emotion,
      keyConcern: '成本和实际收益',
      reason: '异议仍高，需要再次消除顾虑。',
    };
  }
  if (signal.triesClose && state.trust < 55) {
    return {
      intent: 'delay_decision',
      action: 'hesitate',
      emotion: 'curious',
      keyConcern: '再确认是否靠谱',
      reason: '收口过早，顾客倾向先观望。',
    };
  }
  if (signal.asksNeed && state.trust >= 58 && state.interest >= 48) {
    return {
      intent: 'share_needs',
      action: 'continue_talk',
      emotion: state.emotion === 'annoyed' ? 'neutral' : state.emotion,
      keyConcern: '是否匹配自己购药习惯',
      reason: '顾客愿意补充个人使用场景。',
    };
  }
  if (state.interest < 42) {
    return {
      intent: 'doubt_value',
      action: 'question',
      emotion: 'neutral',
      keyConcern: '办卡到底能省多少',
      reason: '兴趣偏低，需要更具体价值。',
    };
  }
  if (state.turn >= 3 && state.interest >= 62 && state.objectionLevel <= 45) {
    return {
      intent: 'ready_join',
      action: 'accept',
      emotion: 'interested',
      keyConcern: '办理流程是否便捷',
      reason: '对话轮次足够，顾客已具备办理意向。',
    };
  }

  return {
    intent: 'ask_detail',
    action: 'question',
    emotion: state.emotion,
    keyConcern: '权益是否划算',
    reason: '顾客仍在比较价值。',
  };
}

function getLastCustomerUtterance(history = []) {
  const last = [...history].reverse().find((m) => m?.who === 'customer' && m?.text);
  return last ? String(last.text).trim() : '';
}

function pickReplyVariant(options, lastReply, seed = 0) {
  const base = (options || []).map((t) => String(t || '').trim()).filter(Boolean);
  if (!base.length) return '你再说详细一点。';
  const last = String(lastReply || '').trim();
  const pool = base.filter((item) => item !== last);
  const target = pool.length ? pool : base;
  return target[Math.abs(toInt(seed, 0)) % target.length];
}

function buildTemplateCustomerReply(decision, context = {}) {
  const lastReply = getLastCustomerUtterance(context.history || []);
  const seed = (context.state?.turn || 0) + (context.history?.length || 0);
  const map = {
    ready_join: { options: ['行，那你帮我办一下吧。', '可以，现在开通吧。', '那就办一张，怎么操作？'], emotion: 'happy' },
    want_leave: { options: ['我赶时间，先不用了。', '今天先不办，改天再说。'], emotion: 'annoyed' },
    ask_rule: { options: ['这券具体怎么用啊？', '优惠是当天就能用吗？', '这个活动有门槛吗？'], emotion: 'curious' },
    confirm_threshold: { options: ['满多少能用这个券？', '是不是全场都能用？', '哪些药也能参加？'], emotion: 'curious' },
    raise_objection: { options: ['办卡后会不会不划算？', '听着不错，但真能省吗？', '会不会有隐藏条件？'], emotion: 'curious' },
    delay_decision: { options: ['我再想想，先结账吧。', '先别急，我再确认下。'], emotion: 'neutral' },
    doubt_value: { options: ['办会员到底能省多少？', '我今天这单能省多少钱？', '不办是不是也差不多？'], emotion: 'neutral' },
    share_needs: { options: ['我平时买慢病药比较多。', '我主要给家里孩子买药。', '我经常临时来买感冒药。'], emotion: 'interested' },
    ask_detail: { options: ['除了立减，还有啥权益？', '听着可以，会员还有什么好处？', '这个卡平时能用在哪些地方？'], emotion: 'curious' },
  };
  const selected = map[decision.intent] || { options: ['你再说详细一点。'], emotion: decision.emotion || 'neutral' };
  return {
    reply: pickReplyVariant(selected.options, lastReply, seed),
    emotion: selected.emotion || decision.emotion || 'neutral',
  };
}

function buildCoachHint(decision, state, signal) {
  const hintMap = {
    ready_join: {
      customerMindset: '顾客已经基本接受，正在等你引导完成办理。',
      clerkTip: '下一句建议：直接给办理动作指令，如“我帮您扫一下码，30秒就好”。',
    },
    want_leave: {
      customerMindset: '顾客赶时间，优先想结束对话。',
      clerkTip: '下一句建议：先共情时间压力，再用一句话讲“当下能省多少钱”。',
    },
    ask_rule: {
      customerMindset: '顾客核心疑虑是“优惠规则会不会麻烦”。',
      clerkTip: '下一句建议：用一句话讲清门槛、有效期、是否次日生效。',
    },
    confirm_threshold: {
      customerMindset: '顾客在核对细节，离成交只差规则确认。',
      clerkTip: '下一句建议：先回答适用范围，再补一句“您这单就能省X元”。',
    },
    raise_objection: {
      customerMindset: '顾客防御心态上升，担心被推销。',
      clerkTip: '下一句建议：先说“我理解您担心”，再给具体事实，不要继续强推。',
    },
    delay_decision: {
      customerMindset: '顾客还没完全信任，想先观望。',
      clerkTip: '下一句建议：补一条可信信息（生效时间/使用门槛），再轻收口。',
    },
    doubt_value: {
      customerMindset: '顾客还没感知到真实收益。',
      clerkTip: '下一句建议：把优惠换算到这单和下次复购，讲具体金额。',
    },
    share_needs: {
      customerMindset: '顾客愿意说自己的购药习惯，沟通窗口打开了。',
      clerkTip: '下一句建议：顺着顾客场景推荐对应会员权益，建立“对我有用”。',
    },
    ask_detail: {
      customerMindset: '顾客处于比较阶段，愿意继续听但还没下决心。',
      clerkTip: '下一句建议：少讲概念，多讲“今天立减+后续券怎么用”。',
    },
  };

  const base = hintMap[decision.intent] || hintMap.ask_detail;
  if (signal.hardSell || state.patience < 30) {
    return {
      customerMindset: '顾客出现反感苗头，耐心在下降。',
      clerkTip: '下一句建议：先降语速和语气，先共情再解释，不要连续追问办卡。',
    };
  }
  return base;
}

// ── 旧版 prompt（兼容 /api/chat） ────────────────
function buildLegacySystemPrompt(scenario, customerName) {
  return `你是门店员工培训系统中的AI顾客，扮演${customerName}。

场景：${scenario}

规则：
- 回复必须口语化、简短（15字内）
- 只输出顾客一句话
- 结尾追加情绪标签：[EMO:neutral|curious|interested|happy|annoyed]
- 不解释规则，不跳出角色`;
}

// ── 第二步：基于决策生成自然表达 ─────────────────
function buildCustomerExpressionPrompt({
  scenario,
  customerName,
  customerProfile,
  clerkText,
  state,
  decision,
  history,
}) {
  const lastCustomer = getLastCustomerUtterance(history) || '（无）';
  const historyText = (history || [])
    .slice(-6)
    .map((m) => `${m.who === 'clerk' ? '店员' : '顾客'}：${m.text}`)
    .join('\n');

  return `你是门店员工培训系统的顾客Agent，请基于“顾客决策”输出自然口语。

场景：${scenario}
顾客：${customerName}
人物画像：${customerProfile}

当前状态：
- trust: ${state.trust}
- patience: ${state.patience}
- interest: ${state.interest}
- objectionLevel: ${state.objectionLevel}
- stage: ${state.stage}
- emotion: ${state.emotion}

本轮店员话术：${clerkText}

顾客决策（必须遵循）：
- intent: ${decision.intent}
- action: ${decision.action}
- keyConcern: ${decision.keyConcern}
- emotion: ${decision.emotion}
- reason: ${decision.reason}

上一轮顾客原话：${lastCustomer}

最近对话：
${historyText || '（无）'}

请严格输出 JSON（不要输出其他内容）：
{
  "reply": "<顾客一句话，18字以内，口语化>",
  "emotion": "<neutral|curious|interested|happy|annoyed>",
  "action": "<question|accept|reject|hesitate|continue_talk>"
}

额外要求：
- 不要重复“上一轮顾客原话”
- 若上一轮已问过“优惠还有什么”，本轮优先改问门槛/生效/办理流程。`;
}

// ── 行为评分：prompt（结构化） ────────────────────
function buildBehaviorScorePrompt(conversation, scenario) {
  const dialog = (conversation || [])
    .filter((m) => m.who === 'clerk' || m.who === 'customer')
    .map((m) => `【${m.who === 'clerk' ? '店员' : '顾客'}】${m.text}`)
    .join('\n');

  return `你是门店销售训练评估专家。请对店员做“行为评估”，而不是只看关键词命中。

场景：${scenario}
对话记录：
${dialog}

严格输出 JSON（不要输出其它内容）：
{
  "score": <0-100整数>,
  "stars": <1-3整数，85+为3星，65+为2星>,
  "feedback_good": "<15字内>",
  "feedback_improve": "<15字内>",
  "covered": ["打招呼","询问会员","立减 5 元","优惠券","次日生效","免费礼品"],
  "missed": ["..."],
  "behavior_scores": [
    {"dimension":"关系建立","score":<0-100>,"evidence":["<引用一句店员原话>"],"advice":"<12字内建议>"},
    {"dimension":"需求探询","score":<0-100>,"evidence":["..."],"advice":"..."},
    {"dimension":"价值表达","score":<0-100>,"evidence":["..."],"advice":"..."},
    {"dimension":"异议处理","score":<0-100>,"evidence":["..."],"advice":"..."},
    {"dimension":"成交推进","score":<0-100>,"evidence":["..."],"advice":"..."}
  ],
  "behavior_summary": {
    "strengths": ["<行为层优势>"],
    "risks": ["<行为层风险>"],
    "next_actions": ["<下一轮可执行动作>"]
  },
  "per_message": [
    {"text":"<店员原话>","tag":"good|great|warn|bad|null","note":"<15字内点评|null>"}
  ]
}`;
}

// ── GLM 调用（流式） ───────────────────────────
function glmStream(messages, res) {
  const body = JSON.stringify({
    model: MODEL,
    messages,
    stream: true,
    max_tokens: 160,
    temperature: 0.75,
  });

  const req = https.request({
    hostname: 'open.bigmodel.cn',
    path: '/api/paas/v4/chat/completions',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GLM_KEY}`,
      'Content-Length': Buffer.byteLength(body),
    },
  }, (upstream) => {
    res.writeHead(upstream.statusCode || 200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*',
    });
    upstream.pipe(res);
  });

  req.on('error', (e) => {
    console.error('GLM stream error:', e);
    res.end();
  });
  req.write(body);
  req.end();
}

// ── GLM 调用（同步） ───────────────────────────
function glmSync(messages, callback, opts = {}) {
  const body = JSON.stringify({
    model: MODEL,
    messages,
    temperature: opts.temperature ?? 0.35,
    max_tokens: opts.max_tokens ?? 900,
  });

  const req = https.request({
    hostname: 'open.bigmodel.cn',
    path: '/api/paas/v4/chat/completions',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GLM_KEY}`,
      'Content-Length': Buffer.byteLength(body),
    },
  }, (resp) => {
    let data = '';
    resp.on('data', (chunk) => { data += chunk; });
    resp.on('end', () => {
      try {
        const json = JSON.parse(data);
        callback(null, json.choices?.[0]?.message?.content || '');
      } catch (e) {
        callback(e);
      }
    });
  });

  req.on('error', callback);
  req.write(body);
  req.end();
}

function generateCustomerExpression(input, callback) {
  const fallback = buildTemplateCustomerReply(input.decision, input);
  if (!GLM_KEY) return callback(null, fallback);

  const prompt = buildCustomerExpressionPrompt(input);
  glmSync([{ role: 'user', content: prompt }], (err, content) => {
    if (err) return callback(null, fallback);
    const parsed = extractJSONObject(content);
    if (!parsed || !parsed.reply) return callback(null, fallback);
    const lastCustomer = getLastCustomerUtterance(input.history || []);
    let reply = String(parsed.reply).replace(/\s+/g, ' ').trim();
    if (!reply || reply === lastCustomer) {
      reply = fallback.reply;
    }
    if (/还有.*优惠/.test(reply) && /还有.*优惠/.test(lastCustomer)) {
      reply = fallback.reply;
    }
    const emotion = ['neutral', 'curious', 'interested', 'happy', 'annoyed'].includes(parsed.emotion)
      ? parsed.emotion
      : fallback.emotion;
    callback(null, {
      reply,
      emotion,
      action: parsed.action || input.decision.action,
    });
  }, { temperature: 0.55, max_tokens: 180 });
}

function glmTranscribe(fileBase64, hotwords = [], callback) {
  const boundary = `----CodexBoundary${Math.random().toString(16).slice(2)}`;
  const safeBase64 = String(fileBase64 || '').replace(/^data:audio\/[^;]+;base64,/, '');
  const hotwordPrompt = Array.isArray(hotwords) && hotwords.length
    ? `热词：${hotwords.slice(0, 50).join('、')}`
    : '';

  const parts = [
    `--${boundary}\r\nContent-Disposition: form-data; name="model"\r\n\r\n${MODEL_ASR}\r\n`,
    `--${boundary}\r\nContent-Disposition: form-data; name="stream"\r\n\r\nfalse\r\n`,
    `--${boundary}\r\nContent-Disposition: form-data; name="file_base64"\r\n\r\n${safeBase64}\r\n`,
  ];
  if (hotwordPrompt) {
    parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="prompt"\r\n\r\n${hotwordPrompt}\r\n`);
  }
  parts.push(`--${boundary}--\r\n`);
  const body = parts.join('');

  const req = https.request({
    hostname: 'open.bigmodel.cn',
    path: '/api/paas/v4/audio/transcriptions',
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GLM_KEY}`,
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': Buffer.byteLength(body),
    },
  }, (resp) => {
    let data = '';
    resp.on('data', (chunk) => { data += chunk; });
    resp.on('end', () => {
      try {
        const json = JSON.parse(data || '{}');
        const text =
          (typeof json.text === 'string' && json.text) ||
          (typeof json?.result?.text === 'string' && json.result.text) ||
          (typeof json?.data?.text === 'string' && json.data.text) ||
          (Array.isArray(json?.segments) ? json.segments.map((s) => s?.text || '').join('') : '') ||
          '';
        callback(null, String(text).trim());
      } catch (e) {
        callback(e);
      }
    });
  });

  req.on('error', callback);
  req.write(body);
  req.end();
}

function buildXfyunWsUrl() {
  const date = new Date().toUTCString();
  const requestLine = `GET ${XFYUN_WS_PATH} HTTP/1.1`;
  const signatureOrigin = `host: ${XFYUN_WS_HOST}\ndate: ${date}\n${requestLine}`;
  const signature = crypto
    .createHmac('sha256', XFYUN_API_SECRET)
    .update(signatureOrigin)
    .digest('base64');
  const authorizationOrigin = `api_key="${XFYUN_API_KEY}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`;
  const authorization = Buffer.from(authorizationOrigin).toString('base64');
  return `wss://${XFYUN_WS_HOST}${XFYUN_WS_PATH}?authorization=${encodeURIComponent(authorization)}&date=${encodeURIComponent(date)}&host=${encodeURIComponent(XFYUN_WS_HOST)}`;
}

function extractWavData(buffer) {
  if (!buffer || buffer.length < 44) return null;
  if (buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WAVE') return null;

  let offset = 12;
  let channels = 1;
  let sampleRate = 16000;
  let bitsPerSample = 16;
  let pcmData = null;

  while (offset + 8 <= buffer.length) {
    const chunkId = buffer.toString('ascii', offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);
    const dataStart = offset + 8;
    const dataEnd = dataStart + chunkSize;
    if (dataEnd > buffer.length) break;

    if (chunkId === 'fmt ') {
      channels = buffer.readUInt16LE(dataStart + 2);
      sampleRate = buffer.readUInt32LE(dataStart + 4);
      bitsPerSample = buffer.readUInt16LE(dataStart + 14);
    } else if (chunkId === 'data') {
      pcmData = buffer.subarray(dataStart, dataEnd);
    }
    offset = dataEnd + (chunkSize % 2);
  }

  if (!pcmData) return null;
  if (bitsPerSample !== 16) throw new Error('Only 16-bit PCM WAV is supported');

  // 多声道时降为单声道（取左声道）
  if (channels > 1) {
    const frameBytes = channels * 2;
    const mono = Buffer.alloc(Math.floor(pcmData.length / frameBytes) * 2);
    for (let i = 0, j = 0; i + frameBytes <= pcmData.length; i += frameBytes, j += 2) {
      mono[j] = pcmData[i];
      mono[j + 1] = pcmData[i + 1];
    }
    return { pcm: mono, sampleRate };
  }
  return { pcm: pcmData, sampleRate };
}

function parseAudioToPCM(base64Audio) {
  const safe = String(base64Audio || '').replace(/^data:audio\/[^;]+;base64,/, '').trim();
  const raw = Buffer.from(safe, 'base64');
  const wav = extractWavData(raw);
  if (wav) return wav;
  return { pcm: raw, sampleRate: 16000 };
}

function xfyunTranscribe(fileBase64, callback) {
  if (!XFYUN_APPID || !XFYUN_API_KEY || !XFYUN_API_SECRET) {
    return callback(new Error('XFYUN credentials are missing'));
  }

  let parsedAudio;
  try {
    parsedAudio = parseAudioToPCM(fileBase64);
  } catch (e) {
    return callback(e);
  }

  const WebSocketClient = globalThis.WebSocket;
  if (!WebSocketClient) return callback(new Error('Runtime WebSocket is not available'));

  const wsUrl = buildXfyunWsUrl();
  const ws = new WebSocketClient(wsUrl);
  const pcm = parsedAudio.pcm || Buffer.alloc(0);
  const sampleRate = parsedAudio.sampleRate || 16000;
  const frameSize = 1280;
  let offset = 0;
  let transcript = '';
  let done = false;
  let timer = null;
  let sendTimer = null;

  function finish(err, text = '') {
    if (done) return;
    done = true;
    if (timer) clearTimeout(timer);
    if (sendTimer) clearInterval(sendTimer);
    try { ws.close(); } catch {}
    callback(err || null, String(text || '').trim());
  }

  function extractText(msg) {
    const wsArr = msg?.data?.result?.ws;
    if (!Array.isArray(wsArr)) return '';
    return wsArr
      .map((item) => (item?.cw || []).map((c) => c?.w || '').join(''))
      .join('');
  }

  function sendFrame(status, chunkBuf) {
    const payload = {
      common: { app_id: XFYUN_APPID },
      business: {
        language: 'zh_cn',
        domain: 'iat',
        accent: 'mandarin',
        vad_eos: 1800,
      },
      data: {
        status,
        format: `audio/L16;rate=${sampleRate}`,
        encoding: 'raw',
        audio: (chunkBuf || Buffer.alloc(0)).toString('base64'),
      },
    };
    ws.send(JSON.stringify(payload));
  }

  ws.onopen = () => {
    timer = setTimeout(() => finish(new Error('XFYUN ASR timeout')), 25000);
    if (pcm.length === 0) {
      sendFrame(2, Buffer.alloc(0));
      return;
    }
    const first = pcm.subarray(0, frameSize);
    offset = first.length;
    sendFrame(0, first);
    sendTimer = setInterval(() => {
      if (offset < pcm.length) {
        const chunk = pcm.subarray(offset, Math.min(offset + frameSize, pcm.length));
        offset += chunk.length;
        sendFrame(1, chunk);
      } else {
        clearInterval(sendTimer);
        sendTimer = null;
        sendFrame(2, Buffer.alloc(0));
      }
    }, 40);
  };

  ws.onmessage = (event) => {
    try {
      const raw = typeof event?.data === 'string' ? event.data : String(event?.data || '');
      const msg = JSON.parse(raw || '{}');
      if (msg.code && msg.code !== 0) {
        return finish(new Error(`XFYUN error ${msg.code}: ${msg.message || msg.msg || 'unknown'}`));
      }
      const chunkText = extractText(msg);
      if (chunkText) {
        if (!transcript.endsWith(chunkText)) transcript += chunkText;
      }
      if (msg?.data?.status === 2) {
        return finish(null, transcript);
      }
      return null;
    } catch (e) {
      return finish(e);
    }
  };

  ws.onerror = () => finish(new Error('XFYUN websocket error'));
  ws.onclose = () => {
    if (!done) finish(null, transcript);
  };
}

// ── 本地行为评估（无 Key 或解析失败时） ────────────
function deriveLineReview(text, signal) {
  if (signal.unclearOrNegative || signal.hardSell) {
    return { tag: 'bad', note: '表达生硬，顾客防御上升' };
  }
  if (signal.quantifiesBenefit && (signal.explainsRules || signal.mentionsCoupon)) {
    return { tag: 'great', note: '价值具体，推动决策' };
  }
  if (signal.quantifiesBenefit || signal.hasEmpathy || signal.hasGreeting) {
    return { tag: 'good', note: '沟通方向正确' };
  }
  if (signal.vaguePitch || signal.longWinded) {
    return { tag: 'warn', note: '建议更短更具体' };
  }
  return { tag: null, note: null };
}

function buildLocalBehaviorScore(conversation = []) {
  const clerkLines = conversation.filter((m) => m.who === 'clerk').map((m) => m.text || '');
  const perMessage = clerkLines.map((line) => {
    const signal = analyzeClerkBehavior(line);
    const review = deriveLineReview(line, signal);
    return { text: line, tag: review.tag, note: review.note };
  });

  let greeting = 0;
  let need = 0;
  let value = 0;
  let objection = 0;
  let closing = 0;
  let penalty = 0;

  clerkLines.forEach((line) => {
    const s = analyzeClerkBehavior(line);
    if (s.hasGreeting) greeting += 1;
    if (s.asksNeed || s.asksMember) need += 1;
    if (s.quantifiesBenefit || s.mentionsCoupon || s.mentionsGift) value += 1;
    if (s.explainsRules || s.hasEmpathy) objection += 1;
    if (s.triesClose) closing += 1;
    if (s.hardSell || s.unclearOrNegative) penalty += 1;
  });

  const scores = {
    rapport: clamp(45 + greeting * 20 + objection * 6 - penalty * 10, 20, 100),
    discovery: clamp(40 + need * 22 - penalty * 8, 20, 100),
    value: clamp(42 + value * 20 - penalty * 8, 20, 100),
    objection: clamp(38 + objection * 20 - penalty * 10, 20, 100),
    closing: clamp(40 + closing * 20 + Math.max(0, value - 1) * 6 - penalty * 8, 20, 100),
  };
  const score = Math.round(
    scores.rapport * 0.2 +
    scores.discovery * 0.2 +
    scores.value * 0.25 +
    scores.objection * 0.2 +
    scores.closing * 0.15
  );

  const covered = [];
  if (clerkLines.some((t) => /你好|您好|欢迎|光临/.test(t))) covered.push('打招呼');
  if (clerkLines.some((t) => /会员|会员卡|积分|办卡/.test(t))) covered.push('询问会员');
  if (clerkLines.some((t) => /(立减|减)\s*5|省\s*5|5\s*元/.test(t))) covered.push('立减 5 元');
  if (clerkLines.some((t) => /券|优惠券|3\s*张/.test(t))) covered.push('优惠券');
  if (clerkLines.some((t) => /次日|明天.*生效|明日.*生效|生效/.test(t))) covered.push('次日生效');
  if (clerkLines.some((t) => /礼品|赠品|免费送|花茶/.test(t))) covered.push('免费礼品');

  const allPoints = ['打招呼', '询问会员', '立减 5 元', '优惠券', '次日生效', '免费礼品'];
  const missed = allPoints.filter((p) => !covered.includes(p));

  const behaviorScores = [
    { dimension: '关系建立', score: scores.rapport, evidence: clerkLines.slice(0, 1), advice: '开场先建立信任' },
    { dimension: '需求探询', score: scores.discovery, evidence: clerkLines.filter((t) => /平时|需求|会员/.test(t)).slice(0, 1), advice: '多问一轮使用场景' },
    { dimension: '价值表达', score: scores.value, evidence: clerkLines.filter((t) => /(立减|券|礼品|省|元)/.test(t)).slice(0, 1), advice: '把收益量化到本单' },
    { dimension: '异议处理', score: scores.objection, evidence: clerkLines.filter((t) => /理解|担心|次日|生效|使用/.test(t)).slice(0, 1), advice: '先共情再解释规则' },
    { dimension: '成交推进', score: scores.closing, evidence: clerkLines.filter((t) => /帮您办|扫码|确认|现在/.test(t)).slice(0, 1), advice: '收口动作更明确' },
  ].map((i) => ({ ...i, evidence: i.evidence.length ? i.evidence : ['未体现明显证据'] }));

  const top = behaviorScores.reduce((a, b) => (b.score > a.score ? b : a), behaviorScores[0]);
  const low = behaviorScores.reduce((a, b) => (b.score < a.score ? b : a), behaviorScores[0]);

  return {
    score,
    stars: score >= 85 ? 3 : score >= 65 ? 2 : 1,
    covered,
    missed,
    feedback_good: `${top.dimension}表现较稳`,
    feedback_improve: `优先补强${low.dimension}`,
    behavior_scores: behaviorScores,
    behavior_summary: {
      strengths: [`${top.dimension}得分最高`],
      risks: [`${low.dimension}可能影响转化`],
      next_actions: ['先问需求再量化收益', '异议点用一句话讲清规则'],
    },
    per_message: perMessage,
  };
}

function normalizeScorePayload(raw, fallback) {
  const score = clamp(toInt(raw.score, fallback.score), 0, 100);
  const stars = score >= 85 ? 3 : score >= 65 ? 2 : 1;
  return {
    score,
    stars,
    covered: Array.isArray(raw.covered) ? raw.covered : fallback.covered,
    missed: Array.isArray(raw.missed) ? raw.missed : fallback.missed,
    feedback_good: raw.feedback_good || fallback.feedback_good,
    feedback_improve: raw.feedback_improve || fallback.feedback_improve,
    behavior_scores: Array.isArray(raw.behavior_scores) ? raw.behavior_scores : fallback.behavior_scores,
    behavior_summary: raw.behavior_summary && typeof raw.behavior_summary === 'object'
      ? raw.behavior_summary
      : fallback.behavior_summary,
    per_message: Array.isArray(raw.per_message) ? raw.per_message : fallback.per_message,
  };
}

// ── HTTP 服务器 ────────────────────────────────
const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname;

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    return res.end();
  }

  // ── API: 场景初始化 ───────────────────────────
  if (req.method === 'POST' && pathname === '/api/scenario-init') {
    return readJsonBody(req, (err, body) => {
      if (err) return writeJSON(res, 400, { error: err.message });

      const scenario = String(body.scenario || DEFAULT_SCENARIO.name);
      const customerName = String(body.customerName || DEFAULT_SCENARIO.customerName);
      const customerState = buildInitialCustomerState();
      const openingLine = '帮我结一下账，顺便快一点哈。';

      return writeJSON(res, 200, {
        scenario,
        sceneIntro: DEFAULT_SCENARIO.intro,
        customerName,
        customerProfile: DEFAULT_SCENARIO.customerProfile,
        openingLine,
        customerState,
      });
    });
  }

  // ── API: 顾客回合（规则决策 + LLM表达）──────────
  if (req.method === 'POST' && pathname === '/api/customer-turn') {
    return readJsonBody(req, (err, body) => {
      if (err) return writeJSON(res, 400, { error: err.message });

      const scenario = String(body.scenario || DEFAULT_SCENARIO.name);
      const customerName = String(body.customerName || DEFAULT_SCENARIO.customerName);
      const clerkText = String(body.clerkText || '').trim();
      const history = Array.isArray(body.history) ? body.history : [];

      if (!clerkText) return writeJSON(res, 400, { error: 'clerkText required' });

      const prevState = normalizeCustomerState(body.customerState || {});
      const signal = analyzeClerkBehavior(clerkText);
      const stateOutcome = applyStateRules(prevState, signal);
      const decision = decideCustomerAction(stateOutcome.nextState, signal);
      const coachHint = buildCoachHint(decision, stateOutcome.nextState, signal);

      return generateCustomerExpression({
        scenario,
        customerName,
        customerProfile: DEFAULT_SCENARIO.customerProfile,
        clerkText,
        state: stateOutcome.nextState,
        decision,
        history,
      }, (_genErr, expr) => {
        const nextState = {
          ...stateOutcome.nextState,
          emotion: expr?.emotion || stateOutcome.nextState.emotion,
        };
        writeJSON(res, 200, {
          customerReply: expr?.reply || '你再说详细一点。',
          emotion: nextState.emotion,
          customerState: nextState,
          coachHint,
          decisionTrace: {
            intent: decision.intent,
            action: expr?.action || decision.action,
            keyConcern: decision.keyConcern,
            reason: decision.reason,
            coachHint,
            ruleNotes: stateOutcome.reasons.slice(0, 4),
            behaviorSignals: signal,
            delta: stateOutcome.delta,
          },
        });
      });
    });
  }

  // ── API: 语音转写（企业微信/移动端麦克风链路）───
  if (req.method === 'POST' && pathname === '/api/transcribe') {
    return readJsonBody(req, (err, body) => {
      if (err) return writeJSON(res, 400, { error: err.message });
      const audioBase64 = String(body.audioBase64 || '').trim();
      const provider = String(body.provider || ASR_PROVIDER_DEFAULT).toLowerCase();
      const hotwords = Array.isArray(body.hotwords) ? body.hotwords : [];
      if (!audioBase64) return writeJSON(res, 400, { error: 'audioBase64 required' });
      let providerUsed = provider;
      const xfyunReady = !!(XFYUN_APPID && XFYUN_API_KEY && XFYUN_API_SECRET);

      const transcribeFn = (cb) => {
        if (provider === 'xfyun') {
          if (xfyunReady) return xfyunTranscribe(audioBase64, cb);
          if (!GLM_KEY) return cb(new Error('XFYUN credentials are missing, and GLM fallback is unavailable'));
          providerUsed = 'glm-fallback';
          return glmTranscribe(audioBase64, hotwords, cb);
        }
        if (!GLM_KEY) return cb(new Error('GLM_API_KEY not set'));
        providerUsed = 'glm';
        return glmTranscribe(audioBase64, hotwords, cb);
      };

      return transcribeFn((asrErr, text) => {
        if (asrErr) {
          console.error('ASR error:', asrErr);
          return writeJSON(res, 500, { error: `ASR failed (${provider})`, detail: asrErr.message || '' });
        }
        return writeJSON(res, 200, { text, provider: providerUsed });
      });
    });
  }

  // ── API: 兼容旧流式对话 ───────────────────────
  if (req.method === 'POST' && pathname === '/api/chat') {
    return readJsonBody(req, (err, body) => {
      if (err) return writeJSON(res, 400, { error: err.message });
      if (!GLM_KEY) return writeJSON(res, 500, { error: 'GLM_API_KEY not set' });

      const { messages = [], scenario = DEFAULT_SCENARIO.name, customerName = DEFAULT_SCENARIO.customerName } = body;
      const systemMsg = { role: 'system', content: buildLegacySystemPrompt(scenario, customerName) };
      return glmStream([systemMsg, ...(Array.isArray(messages) ? messages : [])], res);
    });
  }

  // ── API: 行为评分（结构化）─────────────────────
  if (req.method === 'POST' && pathname === '/api/score') {
    return readJsonBody(req, (err, body) => {
      if (err) return writeJSON(res, 400, { error: err.message });

      const conversation = Array.isArray(body.conversation) ? body.conversation : [];
      const scenario = String(body.scenario || DEFAULT_SCENARIO.name);
      const fallback = buildLocalBehaviorScore(conversation);

      if (!GLM_KEY) {
        return writeJSON(res, 200, fallback);
      }

      const prompt = buildBehaviorScorePrompt(conversation, scenario);
      return glmSync([{ role: 'user', content: prompt }], (glmErr, content) => {
        if (glmErr) {
          return writeJSON(res, 200, fallback);
        }
        const parsed = extractJSONObject(content);
        if (!parsed) {
          return writeJSON(res, 200, fallback);
        }
        const normalized = normalizeScorePayload(parsed, fallback);
        return writeJSON(res, 200, normalized);
      }, { temperature: 0.2, max_tokens: 1600 });
    });
  }

  // ── 静态文件服务 ──────────────────────────────
  let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);
  filePath = filePath.split('?')[0];

  fs.readFile(filePath, (readErr, data) => {
    if (readErr) {
      res.writeHead(404);
      return res.end('Not found');
    }
    const ext = path.extname(filePath);
    const mime = MIME[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime });
    return res.end(data);
  });
});

server.listen(PORT, () => {
  if (GLM_KEY) {
    console.log('\x1b[32m✅ GLM API 已就绪\x1b[0m\n');
  } else {
    console.log('\x1b[33m⚠️  GLM_API_KEY 未设置，顾客回复与评分将走本地规则引擎\x1b[0m');
    console.log('设置方法：GLM_API_KEY=你的key node server.js\n');
  }
  if (XFYUN_APPID && XFYUN_API_KEY && XFYUN_API_SECRET) {
    console.log('\x1b[32m✅ 讯飞 ASR 已就绪\x1b[0m');
  } else {
    console.log('\x1b[33m⚠️  讯飞 ASR 凭据未完整设置（XFYUN_APPID/API_KEY/API_SECRET）\x1b[0m');
  }
  console.log(`🚀 服务已启动：http://localhost:${PORT}`);
});
