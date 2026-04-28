const fs = require('fs');
const path = require('path');

const MEMBERSHIP_FACTS = {
  cardName: '会员新人券',
  bundleName: '15元套券（3张）',
  couponCount: 3,
  threshold: '满9.9元减5元',
  effectiveTime: '领取后次日生效',
  expiry: '每张券有效期1个月',
  scope: '全场通用',
  process: [
    '询问是否有会员卡',
    '出示工牌二维码引导添加企业微信健康顾问',
    '顾客扫码添加好友',
    '系统推送小程序卡片',
    '顾客点击卡片手机号授权并办卡',
  ],
};

const CONCERN_LABEL = {
  benefit: '权益是否划算',
  time: '流程是否耽误时间',
  risk: '有没有隐形条件或风险',
  convenience: '操作是否方便',
};

const ANNOYANCE_TRIGGER_TERMS = [
  /必须/,
  /一定要/,
  /赶紧办/,
  /立刻办/,
  /不办就亏/,
  /你就办吧/,
  /别问了/,
  /别磨叽/,
  /爱办不办/,
  /不懂就算了/,
];

const SLOT_TABLE = [
  { key: 'member_asked', label: '已询问会员状态', description: '店员是否已确认顾客是否有会员卡' },
  { key: 'member_status_known', label: '会员状态已明确', description: '顾客是否明确表达有卡/无卡' },
  { key: 'benefit_intro', label: '已介绍会员权益', description: '是否已介绍立减或新人券价值' },
  { key: 'rule_threshold', label: '门槛已说明', description: '是否说明满9.9减5规则' },
  { key: 'rule_effective_time', label: '生效时间已说明', description: '是否说明次日生效' },
  { key: 'rule_expiry', label: '有效期已说明', description: '是否说明一个月有效期' },
  { key: 'rule_scope', label: '适用范围已说明', description: '是否说明全场通用' },
  { key: 'process_intro', label: '办理流程已说明', description: '是否说明扫码加企微+小程序授权办卡' },
  { key: 'time_pressure', label: '时间压力', description: '顾客是否表现出赶时间信号' },
  { key: 'annoyance_triggered', label: '反感触发', description: '是否触发强推或压迫式话术' },
  { key: 'repeat_risk', label: '重复追问风险', description: '顾客是否连续重复同类问题' },
];

const DECISION_RULE_TABLE = [
  { id: 'R01', name: '低耐心先止损', when: '耐心过低/反感过高', intent: 'want_leave' },
  { id: 'R02', name: '先回答有没有会员', when: '店员询问会员且顾客未表态', intent: 'answer_member_status' },
  { id: 'R03', name: '未讲价值先问办卡意义', when: '只问办卡未讲权益', intent: 'ask_join_benefit' },
  { id: 'R04', name: '重复追问触发防御', when: '连续追问会员未给价值', intent: 'raise_objection' },
  { id: 'R05', name: '权益后追问规则细节', when: '已讲优惠但规则未完整', intent: 'ask_rule_detail' },
  { id: 'R06', name: '规则清楚后问流程', when: '价值规则都清楚但流程未说明', intent: 'ask_process' },
  { id: 'R07', name: '流程明确后接受办理', when: '信任兴趣达标且异议低', intent: 'ready_join' },
  { id: 'R08', name: '强推语气先异议', when: '出现压迫式表达', intent: 'raise_objection' },
  { id: 'R09', name: '兴趣不足先要量化价值', when: '尚未感知到本单收益', intent: 'ask_benefit_amount' },
  { id: 'R10', name: '窗口打开补充需求', when: '店员探需且顾客信任可对话', intent: 'share_needs' },
];

const BUILTIN_CUSTOMER_PERSONAS = {
  price_sensitive: {
    id: 'price_sensitive',
    label: '价格敏感型',
    customerName: '王阿姨',
    customerProfile: '50岁左右，强价格敏感。只对能立刻省钱的权益感兴趣，不喜欢空泛推荐。',
    openingLine: '先帮我结账，今天有没有实在优惠？',
    concernPriority: ['benefit', 'time', 'risk', 'convenience'],
    memberStatusDefault: 'no_card',
    defaultState: { trust: 44, patience: 68, interest: 42, budgetSensitivity: 82, objectionLevel: 56 },
    typicalObjections: ['办会员到底能省多少', '优惠券是不是当天不能用', '会不会有使用门槛'],
    visual: { skin: '#F6C8A5', hair: '#3E2F2B', outfit: '#8EA0B6', accent: '#FF9E44' },
  },
  chronic_repurchase: {
    id: 'chronic_repurchase',
    label: '慢病复购型',
    customerName: '陈叔',
    customerProfile: '55岁左右，长期慢病复购。关注长期省钱、稳定供药、会员复购权益。',
    openingLine: '我这药每月都买，会员长期能省多少？',
    concernPriority: ['benefit', 'risk', 'convenience', 'time'],
    memberStatusDefault: 'has_card',
    defaultState: { trust: 52, patience: 74, interest: 55, budgetSensitivity: 64, objectionLevel: 46 },
    typicalObjections: ['长期买药能持续省吗', '活动会不会很快失效', '慢病药是不是也能用券'],
    visual: { skin: '#E8B88E', hair: '#4B4B4B', outfit: '#7D98A6', accent: '#4E7BFF' },
  },
  young_white_collar: {
    id: 'young_white_collar',
    label: '年轻白领型',
    customerName: '小林',
    customerProfile: '28岁白领，节奏快，关注效率。反感冗长介绍，愿意听清晰结论。',
    openingLine: '我赶时间，你一句话说重点吧。',
    concernPriority: ['time', 'benefit', 'convenience', 'risk'],
    memberStatusDefault: 'no_card',
    defaultState: { trust: 46, patience: 52, interest: 38, budgetSensitivity: 58, objectionLevel: 54 },
    typicalObjections: ['别讲太久，直接说能省多少', '办卡要不要下载很多东西', '今天立刻能操作完吗'],
    visual: { skin: '#F2C7A8', hair: '#2E2A2A', outfit: '#5E7B93', accent: '#7B61FF' },
  },
  mom_with_kid: {
    id: 'mom_with_kid',
    label: '带娃妈妈型',
    customerName: '李妈妈',
    customerProfile: '32岁宝妈，购买频次高。关注儿童用品实用性、活动门槛和使用便利。',
    openingLine: '我还要接孩子，能快点说清楚吗？',
    concernPriority: ['benefit', 'time', 'convenience', 'risk'],
    memberStatusDefault: 'no_card',
    defaultState: { trust: 47, patience: 58, interest: 45, budgetSensitivity: 72, objectionLevel: 52 },
    typicalObjections: ['今天这单到底能省多少', '下次给孩子买药也能用吗', '步骤太多我怕来不及'],
    visual: { skin: '#F5C5AA', hair: '#5A3A31', outfit: '#C18A75', accent: '#14B87A' },
  },
  hurry_checkout: {
    id: 'hurry_checkout',
    label: '着急结账型',
    customerName: '赵先生',
    customerProfile: '35岁，时间紧迫。对冗长沟通耐受低，只接受简洁且立即可执行的信息。',
    openingLine: '我赶时间，能不能快点结完？',
    concernPriority: ['time', 'benefit', 'risk', 'convenience'],
    memberStatusDefault: 'no_card',
    defaultState: { trust: 42, patience: 45, interest: 34, budgetSensitivity: 62, objectionLevel: 61 },
    typicalObjections: ['能不能10秒说完重点', '办卡会不会耽误排队', '别绕，直接说办不办值不值'],
    visual: { skin: '#E2B38C', hair: '#2C2C2C', outfit: '#6A748C', accent: '#FF6A5F' },
  },
};

let CUSTOMER_PERSONAS = { ...BUILTIN_CUSTOMER_PERSONAS };
let PERSONA_IDS = Object.keys(CUSTOMER_PERSONAS);

const EMOTION_LIST = ['neutral', 'curious', 'interested', 'happy', 'annoyed'];
const STAGE_LIST = ['opening', 'probing', 'value', 'objection', 'closing', 'done'];
const MEMBER_STATUS_LIST = ['unknown', 'has_card', 'no_card'];
const CONCERN_LIST = ['benefit', 'time', 'risk', 'convenience'];
const INTENT_TYPES = ['value', 'time', 'risk'];
const INTENT_LABEL = {
  value: '价值意图',
  time: '时间意图',
  risk: '风险意图',
};

const BASE_INTENT_ENGINE_CONFIG = {
  version: 'v2-intent-engine',
  acceptThresholds: { value: 32, time: 30, risk: 34 },
  initialScores: { value: 70, time: 56, risk: 54 },
  maxKeywordPerIntent: 24,
  signalWeight: {
    value: {
      quantifiesBenefit: -18,
      explainsThreshold: -8,
      mentionsCoupon: -6,
      vaguePitch: +8,
      repeatedMemberAskNoValue: +10,
      asksMemberWithoutValue: +7,
    },
    time: {
      mentionsProcess: -16,
      longWinded: +10,
      timePressure: +10,
      conciseClose: -8,
      repeatedMemberAskNoValue: +6,
    },
    risk: {
      hardSell: +16,
      unclearOrNegative: +12,
      annoyanceTriggered: +10,
      explainsRules: -9,
      hasEmpathy: -8,
      privacyAssure: -12,
      nationwideAssure: -7,
    },
  },
  surveySeeds: {
    value: ['优惠', '立减', '减5', '券', '会员价', '折', '积分', '礼品', '省钱', '满减', '代金券', '活动力度'],
    time: ['赶时间', '快', '先结账', '流程', '扫码', '一分钟', '10秒', '不耽误', '马上', '现在', '下次再办'],
    risk: ['骚扰', '泄露', '隐私', '强推', '不想办', '不需要', '套路', '担心', '靠谱吗', '不打扰', '全国通用', '上市公司'],
  },
};

// 店长调研语料（节选结构化）：
// 来源：你提供的门店调研原始回复，按“真实一线话术”沉淀为种子语料。
const STORE_MANAGER_SURVEY_SNIPPETS = [
  '新会员送15元券，满9.9减5',
  '新办会员有3张5元券',
  '会员积分可以兑换礼品',
  '会员全国通用',
  '如果不办也没关系先结账',
  '顾客怕骚扰电话',
  '顾客担心信息泄露',
  '免费办卡立减5元',
  '次日生效，一个月有效',
  '会员日88折，双倍积分',
  '扫码一分钟完成办理',
  '不耽误您时间，很快',
  '买药享会员价还可以积分',
  '顾客问券具体怎么用',
  '顾客说优惠力度小',
  '顾客说不常来，不想办',
  '顾客赶时间先结账',
  '顾客怕打电话推销',
  '办卡免费，无额外费用',
  '可升级至尊会员，优惠更大',
  '当次立减，下次继续可用',
  '先问是否有会员卡',
  '未办卡就先讲本单能省多少',
  '规则讲清：门槛、生效、有效期、范围',
  '反感场景要礼貌结束邀约',
  '顾客拒绝后可轻提醒下次办理',
  '全国连锁都能用',
  '今天先不办，改天再说',
  '买得多积分越多',
  '会员权益不只首单',
  '新会员立减3元，次月减5元',
  '办卡步骤简化，扫一扫',
  '手机号授权即可',
  '不要连续强推',
  '先共情再解释',
  '可以帮顾客算账',
  '本单省几元最关键',
  '顾客问是不是全场能用',
  '顾客问当天能不能用券',
  '顾客问有效期多久',
  '礼貌结束：好的先帮您结账',
  '顾客说怕验证码泄露',
  '顾客说怕短信骚扰',
  '不住附近也可以全国通用',
  '不常买药也可长期受益',
  '积分可当钱花',
  '有会员日赠券和礼品',
  '会员卡免费全国连锁通用',
  '本次优惠力度实在',
  '流程明确：扫码加企微点小程序',
  '先收银后补邀约',
  '顾客急着用药',
  '需要一句话重点',
  '表达啰嗦顾客会不耐烦',
  '门店高频异议：优惠小、没时间、怕骚扰',
  '高频异议：不想透露电话',
  '高频异议：已经有别的会员卡',
  '高频异议：下次再办',
  '店员建议：先讲本单再讲长期权益',
  '店员建议：不要死追一个问题',
];

function splitSurveySegments(text = '') {
  return String(text || '')
    .split(/[，,。；;！!？?\n\r、\t ]+/)
    .map((x) => firstText(x))
    .filter((x) => x && /[\u4e00-\u9fa5]/.test(x) && x.length >= 2 && x.length <= 14);
}

function buildIntentKeywordMapFromSurvey(snippets = [], config = INTENT_ENGINE_CONFIG) {
  const seedMap = config.surveySeeds || {};
  const counter = {
    value: new Map(),
    time: new Map(),
    risk: new Map(),
  };
  const add = (intent, token, weight = 1) => {
    if (!counter[intent] || !token) return;
    counter[intent].set(token, (counter[intent].get(token) || 0) + weight);
  };

  INTENT_TYPES.forEach((intent) => {
    (seedMap[intent] || []).forEach((seed) => add(intent, seed, 4));
  });

  (snippets || []).forEach((line) => {
    const segments = splitSurveySegments(line);
    segments.forEach((seg) => {
      INTENT_TYPES.forEach((intent) => {
        const hit = (seedMap[intent] || []).some((seed) => seg.includes(seed) || seed.includes(seg));
        if (hit) add(intent, seg, Math.max(1, Math.floor(seg.length / 3)));
      });
    });
  });

  const result = {};
  INTENT_TYPES.forEach((intent) => {
    result[intent] = [...counter[intent].entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, config.maxKeywordPerIntent || 24)
      .map(([token]) => token);
  });
  return result;
}

let INTENT_ENGINE_CONFIG = JSON.parse(JSON.stringify(BASE_INTENT_ENGINE_CONFIG));
let AUTO_INTENT_KEYWORDS = buildIntentKeywordMapFromSurvey(STORE_MANAGER_SURVEY_SNIPPETS, INTENT_ENGINE_CONFIG);
let EXTERNAL_AGENT_CONFIG_META = null;
let EXTERNAL_SCORING_RUBRIC = null;
let EXTERNAL_SLOT_CONSTRAINTS = null;

function initIntentScores(persona = {}) {
  const base = { ...(INTENT_ENGINE_CONFIG.initialScores || { value: 70, time: 56, risk: 54 }) };
  const pri = Array.isArray(persona.concernPriority) ? persona.concernPriority : [];
  const mapToIntent = {
    benefit: 'value',
    convenience: 'time',
    time: 'time',
    risk: 'risk',
  };
  pri.forEach((item, idx) => {
    const intent = mapToIntent[item];
    if (!intent) return;
    const bump = idx === 0 ? 10 : idx === 1 ? 6 : idx === 2 ? 3 : 0;
    base[intent] = Math.min(100, base[intent] + bump);
  });
  return base;
}

function normalizeIntentScores(input = {}, persona = {}) {
  const base = initIntentScores(persona);
  return {
    value: clamp(toInt(input.value, base.value), 0, 100),
    time: clamp(toInt(input.time, base.time), 0, 100),
    risk: clamp(toInt(input.risk, base.risk), 0, 100),
  };
}

function pickMainIntent(scores = {}) {
  const arr = INTENT_TYPES.map((intent) => ({ intent, score: toInt(scores[intent], 0) }));
  arr.sort((a, b) => b.score - a.score);
  return arr[0]?.intent || 'value';
}

function isIntentAccepted(scores = {}, thresholds = INTENT_ENGINE_CONFIG.acceptThresholds) {
  return INTENT_TYPES.every((intent) => toInt(scores[intent], 100) <= toInt(thresholds[intent], 35));
}

function resolveIntentFlags(scores = {}, thresholds = INTENT_ENGINE_CONFIG.acceptThresholds) {
  return INTENT_TYPES.reduce((acc, intent) => {
    acc[intent] = toInt(scores[intent], 100) <= toInt(thresholds[intent], 35);
    return acc;
  }, {});
}

function detectIntentKeywordHits(text = '', keywordMap = AUTO_INTENT_KEYWORDS) {
  const t = firstText(text);
  const hit = {
    value: [],
    time: [],
    risk: [],
  };
  INTENT_TYPES.forEach((intent) => {
    (keywordMap[intent] || []).forEach((token) => {
      if (token && t.includes(token)) hit[intent].push(token);
    });
  });
  return hit;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function toInt(n, fallback = 0) {
  const v = Number(n);
  return Number.isFinite(v) ? Math.round(v) : fallback;
}

function firstText(input = '') {
  return String(input || '').replace(/\s+/g, ' ').trim();
}

function pickRandom(arr = []) {
  if (!arr.length) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

function uniqStrings(list = []) {
  const seen = new Set();
  const out = [];
  (list || []).forEach((item) => {
    const text = firstText(item);
    if (!text || seen.has(text)) return;
    seen.add(text);
    out.push(text);
  });
  return out;
}

function toConcernPriority(initialIntents = {}) {
  const ranked = [
    { key: 'value', score: toInt(initialIntents.value, 0), concern: 'benefit' },
    { key: 'time', score: toInt(initialIntents.time, 0), concern: 'time' },
    { key: 'risk', score: toInt(initialIntents.risk, 0), concern: 'risk' },
  ].sort((a, b) => b.score - a.score);
  const concerns = ranked.map((x) => x.concern);
  if (!concerns.includes('convenience')) concerns.push('convenience');
  return concerns;
}

function hashAccentColor(seed = '') {
  const palette = ['#FF9E44', '#4E7BFF', '#14B87A', '#7B61FF', '#FF6A5F', '#F97316', '#0EA5E9'];
  const raw = firstText(seed);
  if (!raw) return palette[0];
  let hash = 0;
  for (let i = 0; i < raw.length; i += 1) hash = (hash * 31 + raw.charCodeAt(i)) >>> 0;
  return palette[hash % palette.length];
}

function normalizeReplyPolicy(policy = {}) {
  const map = {};
  const pick = (key) => (Array.isArray(policy[key]) ? uniqStrings(policy[key]).slice(0, 4) : []);
  if (pick('when_value_high').length) map.ask_benefit_amount = pick('when_value_high');
  if (pick('when_time_high').length) map.ask_process = pick('when_time_high');
  if (pick('when_risk_high').length) map.raise_objection = pick('when_risk_high');
  if (pick('when_value_resolved').length) map.delay_decision = pick('when_value_resolved');
  if (pick('when_time_resolved').length) map.delay_decision = [...(map.delay_decision || []), ...pick('when_time_resolved')];
  if (pick('when_risk_resolved').length) map.delay_decision = [...(map.delay_decision || []), ...pick('when_risk_resolved')];
  if (map.delay_decision) map.delay_decision = uniqStrings(map.delay_decision).slice(0, 4);
  return map;
}

function buildPersonaFromExternalAgent(agent = {}, idx = 0) {
  const agentId = firstText(agent.agent_id || `external_agent_${idx + 1}`);
  const agentName = firstText(agent.agent_name || `顾客画像${idx + 1}`);
  const lines = Array.isArray(agent?.customer_profile?.initial_customer_lines)
    ? agent.customer_profile.initial_customer_lines
    : [];
  const traits = Array.isArray(agent?.customer_profile?.typical_traits) ? agent.customer_profile.typical_traits : [];
  const objections = Array.isArray(agent.primary_objections) ? agent.primary_objections : [];
  const concerns = toConcernPriority(agent.initial_intents || {});
  const state = agent.initial_state || {};
  const trust = clamp(toInt(state.trust, 45), 0, 100);
  const resistance = clamp(toInt(state.resistance, 58), 0, 100);
  const timeBias = clamp(toInt(agent?.initial_intents?.time, 45), 0, 100);
  const valueBias = clamp(toInt(agent?.initial_intents?.value, 60), 0, 100);
  const budgetSensitivity = clamp(Math.round(45 + valueBias * 0.55), 35, 95);
  const patience = clamp(Math.round(78 - timeBias * 0.45), 30, 85);
  const interest = clamp(Math.round(95 - resistance * 0.55), 20, 80);
  const opening = firstText(lines[0] || '');
  const profileText = [agentName, ...traits, ...objections].filter(Boolean).join('；');
  const replyOverride = normalizeReplyPolicy(agent.next_reply_policy || {});
  const accent = hashAccentColor(agentId);

  return {
    id: agentId,
    label: agentName,
    customerName: `顾客${idx + 1}`,
    customerProfile: profileText || agentName,
    openingLine: opening || '先帮我结账。',
    concernPriority: concerns,
    memberStatusDefault: 'no_card',
    defaultState: {
      trust,
      patience,
      interest,
      budgetSensitivity,
      objectionLevel: resistance,
    },
    typicalObjections: uniqStrings(objections).slice(0, 6),
    intentReplyOverrides: replyOverride,
    visual: { skin: '#F2C7A8', hair: '#3E2F2B', outfit: '#7D98A6', accent },
    source: agent.source || 'external_agent_config',
  };
}

function applyExternalAgentConfig(raw = {}, sourcePath = '') {
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.agents) || !raw.agents.length) return false;

  const mappedPersonas = {};
  raw.agents.forEach((agent, idx) => {
    const persona = buildPersonaFromExternalAgent(agent, idx);
    mappedPersonas[persona.id] = persona;
  });
  const nextIds = Object.keys(mappedPersonas);
  if (!nextIds.length) return false;

  CUSTOMER_PERSONAS = mappedPersonas;
  PERSONA_IDS = nextIds;

  const extIntent = raw.intent_engine || {};
  const extThresholds = extIntent.thresholds || {};
  const acceptBelow = clamp(toInt(extThresholds.accept_all_below, 35), 20, 50);
  const resolved = clamp(toInt(extThresholds.resolved, 30), 20, acceptBelow);
  INTENT_ENGINE_CONFIG = {
    ...JSON.parse(JSON.stringify(BASE_INTENT_ENGINE_CONFIG)),
    version: firstText(raw.version || BASE_INTENT_ENGINE_CONFIG.version || 'external'),
    acceptThresholds: { value: acceptBelow, time: acceptBelow, risk: acceptBelow },
    initialScores: {
      value: clamp(Math.max(acceptBelow + 20, 68), resolved + 8, 95),
      time: clamp(Math.max(acceptBelow + 18, 60), resolved + 8, 90),
      risk: clamp(Math.max(acceptBelow + 18, 60), resolved + 8, 90),
    },
  };

  const extKeywords = extIntent.keyword_map || {};
  const hasExtKeywords = INTENT_TYPES.every((k) => Array.isArray(extKeywords[k]) && extKeywords[k].length);
  AUTO_INTENT_KEYWORDS = hasExtKeywords
    ? {
      value: uniqStrings(extKeywords.value).slice(0, INTENT_ENGINE_CONFIG.maxKeywordPerIntent),
      time: uniqStrings(extKeywords.time).slice(0, INTENT_ENGINE_CONFIG.maxKeywordPerIntent),
      risk: uniqStrings(extKeywords.risk).slice(0, INTENT_ENGINE_CONFIG.maxKeywordPerIntent),
    }
    : buildIntentKeywordMapFromSurvey(STORE_MANAGER_SURVEY_SNIPPETS, INTENT_ENGINE_CONFIG);

  EXTERNAL_SLOT_CONSTRAINTS = raw.slot_constraints || null;
  EXTERNAL_SCORING_RUBRIC = raw.scoring_rubric || null;
  EXTERNAL_AGENT_CONFIG_META = {
    sourcePath,
    scenarioId: firstText(raw.scenario_id),
    scenarioName: firstText(raw.scenario_name),
    generatedBasis: firstText(raw.generated_basis),
    designPrinciple: firstText(raw.design_principle),
    version: firstText(raw.version),
    agentCount: nextIds.length,
  };
  return true;
}

function loadExternalAgentConfig() {
  const preferred = firstText(process.env.CUSTOMER_AGENTS_FILE);
  const candidates = [
    preferred,
    path.join(__dirname, 'data', 'customer_agents.json'),
    path.join(__dirname, 'data', 'customer_agents.generated.json'),
  ].filter(Boolean);

  for (const filePath of candidates) {
    try {
      if (!fs.existsSync(filePath)) continue;
      const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if (applyExternalAgentConfig(raw, filePath)) return;
    } catch {}
  }
}

loadExternalAgentConfig();

function resolvePersona(input = {}) {
  const personaId = typeof input === 'string' ? input : String(input.personaId || '');
  const customerName = typeof input === 'string' ? '' : firstText(input.customerName);
  const firstPersona = PERSONA_IDS[0] ? CUSTOMER_PERSONAS[PERSONA_IDS[0]] : null;

  if (personaId && CUSTOMER_PERSONAS[personaId]) return CUSTOMER_PERSONAS[personaId];

  if (customerName) {
    const byName = PERSONA_IDS
      .map((id) => CUSTOMER_PERSONAS[id])
      .find((p) => p.customerName === customerName);
    if (byName) return byName;
  }

  return CUSTOMER_PERSONAS[pickRandom(PERSONA_IDS)] || firstPersona || BUILTIN_CUSTOMER_PERSONAS.price_sensitive;
}

function buildInitialCustomerState(personaInput = {}) {
  const persona = resolvePersona(personaInput);
  const intentScores = initIntentScores(persona);
  const intentResolved = resolveIntentFlags(intentScores);
  const base = {
    trust: 45,
    patience: 72,
    interest: 38,
    budgetSensitivity: 76,
    objectionLevel: 58,
    emotion: 'neutral',
    stage: 'opening',
    turn: 0,
    memberStatus: persona.memberStatusDefault || 'unknown',
    ruleAwareness: 20,
    annoyance: 22,
    currentConcern: persona.concernPriority?.[0] || 'benefit',
    intentHistory: [],
    mainIntent: pickMainIntent(intentScores),
    intentScores,
    intentResolved,
    acceptanceReady: isIntentAccepted(intentScores),
    intentDelta: { value: 0, time: 0, risk: 0 },
    intentKeywordHits: { value: [], time: [], risk: [] },
    slotProgress: {},
  };
  return {
    ...base,
    ...(persona.defaultState || {}),
  };
}

function normalizeCustomerState(input = {}, personaInput = {}) {
  const base = buildInitialCustomerState(personaInput);
  const rawSlot = input.slotProgress && typeof input.slotProgress === 'object' ? input.slotProgress : {};
  const slotProgress = SLOT_TABLE.reduce((acc, item) => {
    acc[item.key] = Boolean(rawSlot[item.key]);
    return acc;
  }, {});

  const intentHistory = Array.isArray(input.intentHistory)
    ? input.intentHistory
      .map((x) => firstText(x))
      .filter(Boolean)
      .slice(-4)
    : [];

  const intentScores = normalizeIntentScores(input.intentScores || {}, resolvePersona(personaInput));
  const intentResolved = resolveIntentFlags(intentScores);
  const mainIntent = INTENT_TYPES.includes(input.mainIntent) ? input.mainIntent : pickMainIntent(intentScores);

  return {
    trust: clamp(toInt(input.trust, base.trust), 0, 100),
    patience: clamp(toInt(input.patience, base.patience), 0, 100),
    interest: clamp(toInt(input.interest, base.interest), 0, 100),
    budgetSensitivity: clamp(toInt(input.budgetSensitivity, base.budgetSensitivity), 0, 100),
    objectionLevel: clamp(toInt(input.objectionLevel, base.objectionLevel), 0, 100),
    emotion: EMOTION_LIST.includes(input.emotion) ? input.emotion : base.emotion,
    stage: STAGE_LIST.includes(input.stage) ? input.stage : base.stage,
    turn: Math.max(0, toInt(input.turn, base.turn)),
    memberStatus: MEMBER_STATUS_LIST.includes(input.memberStatus) ? input.memberStatus : base.memberStatus,
    ruleAwareness: clamp(toInt(input.ruleAwareness, base.ruleAwareness), 0, 100),
    annoyance: clamp(toInt(input.annoyance, base.annoyance), 0, 100),
    currentConcern: CONCERN_LIST.includes(input.currentConcern) ? input.currentConcern : base.currentConcern,
    intentHistory,
    mainIntent,
    intentScores,
    intentResolved,
    acceptanceReady: typeof input.acceptanceReady === 'boolean' ? input.acceptanceReady : isIntentAccepted(intentScores),
    intentDelta: {
      value: toInt(input?.intentDelta?.value, 0),
      time: toInt(input?.intentDelta?.time, 0),
      risk: toInt(input?.intentDelta?.risk, 0),
    },
    intentKeywordHits: {
      value: Array.isArray(input?.intentKeywordHits?.value) ? input.intentKeywordHits.value.slice(0, 6) : [],
      time: Array.isArray(input?.intentKeywordHits?.time) ? input.intentKeywordHits.time.slice(0, 6) : [],
      risk: Array.isArray(input?.intentKeywordHits?.risk) ? input.intentKeywordHits.risk.slice(0, 6) : [],
    },
    slotProgress,
  };
}

function inferEmotion(state) {
  if (state.annoyance > 70 || state.patience < 25 || state.trust < 30) return 'annoyed';
  if (state.interest > 78 && state.trust > 72 && state.objectionLevel < 35) return 'happy';
  if (state.interest > 60 && state.trust > 55) return 'interested';
  if (state.interest > 42) return 'curious';
  return 'neutral';
}

function analyzeClerkBehavior(text = '') {
  const t = firstText(text);
  const annoyanceWordsHit = ANNOYANCE_TRIGGER_TERMS.filter((re) => re.test(t)).map((re) => re.source.replace(/\\/g, ''));
  return {
    hasGreeting: /你好|您好|欢迎|光临|辛苦了/.test(t),
    asksNeed: /平时|经常|主要|需求|方便问|您一般|用不用|常买/.test(t),
    asksMember: /会员|会员卡|积分|权益|开卡|办卡/.test(t),
    quantifiesBenefit: /(立减|直减|省)\s*\d|减\s*\d+\s*元|\d+\s*张|满\s*\d|会员价.*\d|优惠券.*\d/.test(t),
    explainsRules: /次日|明天|生效|有效期|门槛|使用|到账|可用|全场/.test(t),
    explainsThreshold: /满\s*9\.?9|九点九|门槛|减5|5元/.test(t),
    explainsEffective: /次日|明天.*生效|第二天/.test(t),
    explainsExpiry: /一个月|30天|有效期/.test(t),
    explainsScope: /全场|通用|都能用/.test(t),
    hasEmpathy: /理解|明白|担心|放心|我帮您|别着急|不着急/.test(t),
    mentionsProcess: /扫码|企业微信|加好友|小程序|手机号|授权|二维码/.test(t),
    triesClose: /现在|这会|帮您办|开通|扫码|确认|要不要办|我给您办/.test(t),
    hardSell: /必须|一定要|赶紧|立刻办|你就办吧|不办就亏/.test(t),
    vaguePitch: /很划算|很值|很优惠|特别好(?!.*\d)/.test(t),
    unclearOrNegative: /不知道|不清楚|随便|算了|自己看/.test(t),
    longWinded: t.length > 58,
    mentionsGift: /礼品|赠品|免费送|花茶/.test(t),
    mentionsCoupon: /券|优惠券/.test(t),
    mentionsCheckout: /一共|合计|收您|结账|付款|支付|微信|支付宝|现金|刷卡|买单/.test(t),
    checkoutAcknowledge: /好的|好|行|可以|收到|明白|那我给您结账|先帮您结账/.test(t),
    annoyanceWordsHit,
  };
}

function inferMemberStatusByText(text = '') {
  const t = firstText(text);
  if (/有会员|有卡|有会员卡|已经是会员/.test(t)) return 'has_card';
  if (/没会员|没有会员|没办|不是会员|还没办/.test(t)) return 'no_card';
  return 'unknown';
}

function classifyCustomerIntentByText(text = '') {
  const t = firstText(text);
  if (!t) return 'unknown';
  if (/付款|支付|微信|支付宝|先把这单结了|先结这单|先不聊办卡/.test(t)) return 'topic_switch';
  if (/没会员|没有会员|不是会员|有会员|有卡/.test(t)) return 'answer_member_status';
  if (/怎么用|门槛|满多少|减5|9\.9/.test(t)) return 'ask_coupon_rule';
  if (/当天|次日|明天|生效/.test(t)) return 'ask_effective_time';
  if (/一个月|有效期|过期/.test(t)) return 'ask_expiry';
  if (/全场|通用|哪些能用|适用范围/.test(t)) return 'ask_scope';
  if (/怎么操作|怎么办|怎么开通|扫|流程/.test(t)) return 'ask_process';
  if (/先不用|改天|赶时间|先结账/.test(t)) return 'want_leave';
  if (/帮我办|现在办|开通吧|行，那办/.test(t)) return 'ready_join';
  if (/省多少|划算|值不值|除了立减/.test(t)) return 'ask_benefit_amount';
  if (/担心|隐藏|风险|靠谱吗/.test(t)) return 'raise_objection';
  return 'unknown';
}

function deriveScenarioSlots(history = [], currentClerkText = '', signal = {}, prevState = {}, personaInput = {}) {
  const persona = resolvePersona(personaInput);
  const clerkLines = [];
  const customerLines = [];

  (history || []).forEach((m) => {
    const text = firstText(m?.text);
    if (!text) return;
    if (m?.who === 'clerk') clerkLines.push(text);
    if (m?.who === 'customer') customerLines.push(text);
  });
  const currentLine = firstText(currentClerkText);
  if (currentLine) {
    const lastClerkLine = clerkLines[clerkLines.length - 1] || '';
    if (lastClerkLine !== currentLine) clerkLines.push(currentLine);
  }

  const memberAskedCount = clerkLines.filter((line) => /会员|会员卡|办卡|积分/.test(line)).length;
  const benefitIntroCount = clerkLines.filter((line) => /(立减|减\s*5|5\s*元|优惠券|3\s*张|三张|15元)/.test(line)).length;
  const processIntroCount = clerkLines.filter((line) => /扫码|企业微信|加好友|小程序|授权|手机号|二维码/.test(line)).length;

  const ruleFacts = {
    threshold: clerkLines.some((line) => /满\s*9\.?9|九点九|减\s*5|5\s*元/.test(line)),
    effectiveTime: clerkLines.some((line) => /次日|明天.*生效|第二天/.test(line)),
    expiry: clerkLines.some((line) => /一个月|30天|有效期/.test(line)),
    scope: clerkLines.some((line) => /全场|通用|都能用/.test(line)),
  };

  let memberStatus = MEMBER_STATUS_LIST.includes(prevState.memberStatus) ? prevState.memberStatus : 'unknown';
  for (let i = customerLines.length - 1; i >= 0; i -= 1) {
    const inferred = inferMemberStatusByText(customerLines[i]);
    if (inferred !== 'unknown') {
      memberStatus = inferred;
      break;
    }
  }

  const recentCustomerIntents = customerLines
    .slice(-4)
    .map((text) => classifyCustomerIntentByText(text))
    .filter((x) => x !== 'unknown');
  const allCustomerIntents = customerLines
    .map((text) => classifyCustomerIntentByText(text))
    .filter((x) => x !== 'unknown');

  const lastCustomerIntent = recentCustomerIntents[recentCustomerIntents.length - 1] || 'unknown';
  const prevCustomerIntent = recentCustomerIntents[recentCustomerIntents.length - 2] || 'unknown';
  const repeatRisk = !!(
    lastCustomerIntent !== 'unknown'
    && lastCustomerIntent === prevCustomerIntent
    && ['ask_benefit_amount', 'ask_coupon_rule', 'ask_effective_time', 'ask_scope', 'ask_process'].includes(lastCustomerIntent)
  );

  const timePressure = customerLines.some((line) => /赶时间|快点|先结账|着急/.test(line))
    || /赶时间|快点|排队/.test(currentLine)
    || (persona.concernPriority?.[0] === 'time' && prevState.turn <= 1);

  const annoyanceTriggered = Boolean(signal.hardSell || signal.unclearOrNegative || (signal.annoyanceWordsHit || []).length);

  const missingRuleFacts = Object.entries(ruleFacts)
    .filter(([, done]) => !done)
    .map(([key]) => key);

  const benefitIntroduced = benefitIntroCount > 0 || signal.quantifiesBenefit || signal.mentionsCoupon;
  const processExplained = processIntroCount > 0 || signal.mentionsProcess;

  const concernPriority = Array.isArray(persona.concernPriority) && persona.concernPriority.length
    ? persona.concernPriority
    : ['benefit', 'time', 'risk', 'convenience'];

  const customerAsked = {
    benefit: allCustomerIntents.includes('ask_join_benefit') || allCustomerIntents.includes('ask_benefit_amount'),
    effectiveTime: allCustomerIntents.includes('ask_effective_time'),
    scope: allCustomerIntents.includes('ask_scope'),
    process: allCustomerIntents.includes('ask_process'),
    objection: allCustomerIntents.includes('raise_objection'),
  };
  const processStageEntered = customerAsked.process || recentCustomerIntents.includes('ask_process');
  const coreValueQuestionsCovered = benefitIntroduced && ruleFacts.threshold && ruleFacts.effectiveTime;

  return {
    memberAsked: memberAskedCount > 0,
    memberAskedCount,
    memberStatus,
    memberStatusKnown: memberStatus !== 'unknown',
    benefitIntroduced,
    valueQuantified: signal.quantifiesBenefit || ruleFacts.threshold,
    ruleFacts,
    missingRuleFacts,
    ruleFactCoverage: Object.values(ruleFacts).filter(Boolean).length,
    processExplained,
    processIntroCount,
    timePressure,
    annoyanceTriggered,
    repeatRisk,
    lastCustomerIntent,
    repeatedMemberAskNoValue: memberAskedCount >= 2 && !benefitIntroduced,
    concernPriority,
    customerAsked,
    processStageEntered,
    coreValueQuestionsCovered,
  };
}

function inferCurrentConcern(state, slots, persona) {
  if (state.mainIntent === 'value') return 'benefit';
  if (state.mainIntent === 'time') return 'time';
  if (state.mainIntent === 'risk') return 'risk';
  if (slots.timePressure && state.patience < 55) return 'time';
  if (slots.annoyanceTriggered || state.objectionLevel > 62) return 'risk';
  if (!slots.benefitIntroduced || !slots.valueQuantified) return 'benefit';
  if (!slots.processExplained && state.interest >= 55) return 'convenience';
  const order = Array.isArray(persona.concernPriority) && persona.concernPriority.length
    ? persona.concernPriority
    : ['benefit', 'time', 'risk', 'convenience'];
  return order[0] || 'benefit';
}

function evaluateIntentEngine({
  prevState = {},
  signal = {},
  slots = {},
  persona = {},
  clerkText = '',
}) {
  const prevScores = normalizeIntentScores(prevState.intentScores || {}, persona);
  const keywordHits = detectIntentKeywordHits(clerkText);
  const delta = { value: 0, time: 0, risk: 0 };
  const notes = [];
  const w = INTENT_ENGINE_CONFIG.signalWeight || {};

  function bump(intent, amount, note) {
    delta[intent] += amount;
    if (note) notes.push(note);
  }

  const hasNewBusinessInfo = Boolean(
    signal.quantifiesBenefit
    || signal.explainsRules
    || signal.explainsThreshold
    || signal.explainsEffective
    || signal.explainsExpiry
    || signal.explainsScope
    || signal.mentionsProcess
  );

  if (signal.quantifiesBenefit) bump('value', w.value?.quantifiesBenefit || -18, '量化优惠降低价值疑虑');
  if (signal.explainsThreshold) bump('value', w.value?.explainsThreshold || -8, '门槛明确降低价值疑虑');
  if (signal.mentionsCoupon) bump('value', w.value?.mentionsCoupon || -6, '优惠券信息降低价值疑虑');
  if (signal.vaguePitch) bump('value', w.value?.vaguePitch || 8, '空泛表达提高价值疑虑');
  if (slots.repeatedMemberAskNoValue) bump('value', w.value?.repeatedMemberAskNoValue || 10, '未给价值反复追问，价值疑虑上升');
  if (signal.asksMember && !slots.benefitIntroduced) bump('value', w.value?.asksMemberWithoutValue || 7, '只问办卡未讲价值');

  if (signal.mentionsProcess) bump('time', w.time?.mentionsProcess || -16, '流程清楚降低时间焦虑');
  if (signal.longWinded) bump('time', w.time?.longWinded || 10, '话术冗长增加时间焦虑');
  if (slots.timePressure) bump('time', w.time?.timePressure || 10, '顾客赶时间，时间焦虑上升');
  if (/一分钟|10秒|很快|不耽误/.test(firstText(clerkText))) bump('time', w.time?.conciseClose || -8, '强调效率降低时间焦虑');
  if (slots.repeatedMemberAskNoValue) bump('time', w.time?.repeatedMemberAskNoValue || 6, '重复邀约增加时间焦虑');

  if (signal.hardSell) bump('risk', w.risk?.hardSell || 16, '强推提升风险疑虑');
  if (signal.unclearOrNegative) bump('risk', w.risk?.unclearOrNegative || 12, '表述不清提升风险疑虑');
  if (slots.annoyanceTriggered) bump('risk', w.risk?.annoyanceTriggered || 10, '反感信号提升风险疑虑');
  if (signal.explainsRules) bump('risk', w.risk?.explainsRules || -9, '规则讲清降低风险疑虑');
  if (signal.hasEmpathy) bump('risk', w.risk?.hasEmpathy || -8, '共情降低风险疑虑');
  if (/不泄露|隐私|不会打扰|不骚扰/.test(firstText(clerkText))) bump('risk', w.risk?.privacyAssure || -12, '隐私承诺降低风险疑虑');
  if (/全国通用|全国连锁|上市公司/.test(firstText(clerkText))) bump('risk', w.risk?.nationwideAssure || -7, '品牌与通用性降低风险疑虑');

  INTENT_TYPES.forEach((intent) => {
    const hitCount = (keywordHits[intent] || []).length;
    if (hitCount > 0) {
      bump(intent, -Math.min(14, hitCount * 3), `${INTENT_LABEL[intent]}关键词命中，疑虑下降`);
    }
  });

  const lastIntent = Array.isArray(prevState.intentHistory) ? prevState.intentHistory[prevState.intentHistory.length - 1] : '';
  if ((lastIntent === 'delay_decision' || lastIntent === 'want_leave') && !hasNewBusinessInfo) {
    bump('time', 8, '顾客已想结束，未给新信息时时间焦虑上升');
    bump('value', 4, '未给新增价值时价值疑虑回升');
  }

  const nextScores = {
    value: clamp(prevScores.value + delta.value, 0, 100),
    time: clamp(prevScores.time + delta.time, 0, 100),
    risk: clamp(prevScores.risk + delta.risk, 0, 100),
  };
  const mainIntent = pickMainIntent(nextScores);
  const intentResolved = resolveIntentFlags(nextScores);
  const acceptanceReady = isIntentAccepted(nextScores);

  return {
    previousScores: prevScores,
    nextScores,
    delta,
    keywordHits,
    mainIntent,
    intentResolved,
    acceptanceReady,
    notes,
  };
}

function applyStateRules(prevStateInput, signal, slots, personaInput = {}, context = {}) {
  const persona = resolvePersona(personaInput);
  const prevState = normalizeCustomerState(prevStateInput, persona);
  const next = { ...prevState, turn: prevState.turn + 1 };

  const delta = {
    trust: 0,
    patience: 0,
    interest: 0,
    objectionLevel: 0,
  };
  const reasons = [];

  function bump(key, value, reason) {
    if (!Object.prototype.hasOwnProperty.call(delta, key)) return;
    delta[key] += value;
    if (reason) reasons.push(reason);
  }

  if (signal.hasGreeting) {
    bump('trust', 6, '开场礼貌提升信任');
    bump('patience', 4, '顾客愿意继续听');
  }
  if (signal.asksNeed) {
    bump('trust', 4, '先问需求更像顾问');
    bump('interest', 5, '顾客感到被关注');
  }
  if (slots.memberAsked && slots.memberStatus === 'unknown') {
    bump('interest', 3, '进入会员主题');
  }
  if (slots.valueQuantified) {
    bump('interest', 11, '价值被量化，兴趣上升');
    bump('trust', 4, '信息更具体可信');
    bump('objectionLevel', -7, '价格异议下降');
  }
  if (slots.ruleFactCoverage >= 2) {
    bump('trust', 8, '规则说明更完整');
    bump('objectionLevel', -6, '不确定性下降');
  }
  if (slots.processExplained) {
    bump('interest', 5, '流程清楚降低门槛');
    bump('trust', 4, '执行路径明确');
  }
  if (signal.hasEmpathy) {
    bump('trust', 6, '顾客情绪被接住');
    bump('patience', 7, '对话耐心回升');
    bump('objectionLevel', -5, '防御心理缓和');
  }
  if (slots.repeatedMemberAskNoValue) {
    bump('patience', -10, '反复追问会员导致不耐烦');
    bump('trust', -7, '顾客感受被推销');
    bump('objectionLevel', 9, '异议上升');
  }
  if (signal.vaguePitch) {
    bump('trust', -6, '空泛描述降低可信度');
    bump('interest', -4, '价值感下降');
  }
  if (signal.longWinded || slots.timePressure) {
    bump('patience', -7, '时间压力下冗长表达扣分');
  }
  if (signal.hardSell || slots.annoyanceTriggered) {
    bump('patience', -13, '压迫式话术引发反感');
    bump('trust', -10, '压迫沟通损伤信任');
    bump('objectionLevel', 12, '防御心理明显上升');
  }
  if (signal.unclearOrNegative) {
    bump('trust', -12, '专业感不足');
    bump('interest', -8, '沟通意愿下降');
    bump('objectionLevel', 9, '顾客疑虑上升');
  }

  next.trust = clamp(next.trust + delta.trust, 0, 100);
  next.patience = clamp(next.patience + delta.patience, 0, 100);
  next.interest = clamp(next.interest + delta.interest, 0, 100);
  next.objectionLevel = clamp(next.objectionLevel + delta.objectionLevel, 0, 100);

  const awarenessBump = slots.ruleFactCoverage * 8 + (slots.processExplained ? 4 : 0) - (slots.benefitIntroduced && slots.missingRuleFacts.length ? 3 : 0);
  next.ruleAwareness = clamp(prevState.ruleAwareness + awarenessBump, 0, 100);

  const annoyanceBump =
    (signal.hardSell ? 16 : 0)
    + (slots.annoyanceTriggered ? 10 : 0)
    + (slots.repeatedMemberAskNoValue ? 8 : 0)
    + (signal.longWinded && slots.timePressure ? 6 : 0)
    - (signal.hasEmpathy ? 8 : 0);
  next.annoyance = clamp(prevState.annoyance + annoyanceBump, 0, 100);

  if (next.turn <= 1) next.stage = 'opening';
  else if (!slots.benefitIntroduced) next.stage = 'probing';
  else if (slots.benefitIntroduced && slots.missingRuleFacts.length > 0) next.stage = 'value';
  else if (slots.annoyanceTriggered || next.objectionLevel >= 62) next.stage = 'objection';
  else if (slots.processExplained || signal.triesClose) next.stage = 'closing';

  if (next.interest >= 78 && next.trust >= 72 && next.objectionLevel <= 35 && (slots.processExplained || signal.triesClose)) {
    next.stage = 'closing';
  }

  const intentOutcome = evaluateIntentEngine({
    prevState,
    signal,
    slots,
    persona,
    clerkText: context.clerkText || '',
  });

  next.intentScores = intentOutcome.nextScores;
  next.mainIntent = intentOutcome.mainIntent;
  next.intentResolved = intentOutcome.intentResolved;
  next.acceptanceReady = intentOutcome.acceptanceReady;
  next.intentDelta = intentOutcome.delta;
  next.intentKeywordHits = intentOutcome.keywordHits;

  if (next.acceptanceReady) {
    next.stage = 'done';
    reasons.push('三类顾客意图疑虑均降到阈值以下');
  }

  next.memberStatus = slots.memberStatus;
  next.currentConcern = inferCurrentConcern(next, slots, persona);
  next.slotProgress = {
    member_asked: slots.memberAsked,
    member_status_known: slots.memberStatusKnown,
    benefit_intro: slots.benefitIntroduced,
    rule_threshold: slots.ruleFacts.threshold,
    rule_effective_time: slots.ruleFacts.effectiveTime,
    rule_expiry: slots.ruleFacts.expiry,
    rule_scope: slots.ruleFacts.scope,
    process_intro: slots.processExplained,
    time_pressure: slots.timePressure,
    annoyance_triggered: slots.annoyanceTriggered,
    repeat_risk: slots.repeatRisk,
  };
  next.emotion = inferEmotion(next);

  return { nextState: next, delta, reasons, intentOutcome };
}

function mapMissingFactToIntent(missing = []) {
  if (missing.includes('threshold')) return 'ask_coupon_rule';
  if (missing.includes('effectiveTime')) return 'ask_effective_time';
  if (missing.includes('scope')) return 'ask_scope';
  if (missing.includes('expiry')) return 'ask_expiry';
  return 'ask_coupon_rule';
}

function buildDecision(ruleId, intent, action, keyConcern, reason, emotion) {
  return { ruleId, intent, action, keyConcern, reason, emotion };
}

function buildDecisionMetaByIntent(intent, prev = {}) {
  const map = {
    answer_member_status_no_card: { action: 'continue_talk', keyConcern: '先确认会员身份', emotion: 'neutral' },
    answer_member_status_has_card: { action: 'continue_talk', keyConcern: '先确认会员身份', emotion: 'neutral' },
    ask_join_benefit: { action: 'question', keyConcern: CONCERN_LABEL.benefit, emotion: 'curious' },
    ask_benefit_amount: { action: 'question', keyConcern: CONCERN_LABEL.benefit, emotion: 'neutral' },
    ask_coupon_rule: { action: 'question', keyConcern: '优惠规则细节', emotion: 'curious' },
    ask_effective_time: { action: 'question', keyConcern: '优惠规则细节', emotion: 'curious' },
    ask_scope: { action: 'question', keyConcern: '优惠规则细节', emotion: 'curious' },
    ask_expiry: { action: 'question', keyConcern: '优惠规则细节', emotion: 'curious' },
    ask_process: { action: 'question', keyConcern: CONCERN_LABEL.convenience, emotion: 'interested' },
    interrupt_time: { action: 'question', keyConcern: CONCERN_LABEL.time, emotion: 'annoyed' },
    interrupt_risk: { action: 'question', keyConcern: CONCERN_LABEL.risk, emotion: 'annoyed' },
    topic_switch: { action: 'continue_talk', keyConcern: '顾客临时换话题', emotion: 'neutral' },
    raise_objection: { action: 'question', keyConcern: CONCERN_LABEL.risk, emotion: 'annoyed' },
    delay_decision: { action: 'hesitate', keyConcern: CONCERN_LABEL.risk, emotion: 'neutral' },
    ready_join: { action: 'accept', keyConcern: '办理效率', emotion: 'happy' },
    want_leave: { action: 'reject', keyConcern: '时间成本', emotion: 'annoyed' },
    share_needs: { action: 'continue_talk', keyConcern: '结合自身购药习惯', emotion: 'interested' },
  };
  return {
    action: prev.action || map[intent]?.action || 'question',
    keyConcern: prev.keyConcern || map[intent]?.keyConcern || CONCERN_LABEL.benefit,
    emotion: prev.emotion || map[intent]?.emotion || 'neutral',
  };
}

function switchDecisionIntent(decision, nextIntent, reasonSuffix) {
  const meta = buildDecisionMetaByIntent(nextIntent, {});
  return {
    ...decision,
    intent: nextIntent,
    action: meta.action,
    keyConcern: meta.keyConcern,
    emotion: meta.emotion,
    reason: `${decision.reason}${reasonSuffix || ''}`,
  };
}

function avoidRepeatIntent(decision, state, slots) {
  const history = (state.intentHistory || []).filter(Boolean);
  const recent = history.slice(-4);
  const lastIntent = recent[recent.length - 1] || slots.lastCustomerIntent;
  const loopSensitiveIntents = [
    'ask_join_benefit',
    'ask_benefit_amount',
    'ask_coupon_rule',
    'ask_effective_time',
    'ask_scope',
    'ask_expiry',
    'ask_process',
    'interrupt_time',
    'interrupt_risk',
    'raise_objection',
  ];
  const shouldAvoid = loopSensitiveIntents.includes(decision.intent) && recent.includes(decision.intent);
  if (!lastIntent || !shouldAvoid) return decision;

  const replacementChain = {
    ask_join_benefit: ['ask_benefit_amount', 'ask_coupon_rule', 'ask_process', 'delay_decision'],
    ask_benefit_amount: [mapMissingFactToIntent(slots.missingRuleFacts), 'ask_coupon_rule', 'ask_effective_time', 'ask_scope', 'share_needs', 'delay_decision'],
    ask_coupon_rule: ['ask_effective_time', 'ask_scope', 'ask_expiry', 'ask_process', 'delay_decision'],
    ask_effective_time: ['ask_scope', 'ask_process', 'raise_objection', 'delay_decision'],
    ask_scope: ['ask_process', 'raise_objection', 'delay_decision'],
    ask_expiry: ['ask_scope', 'ask_process', 'delay_decision'],
    ask_process: ['delay_decision', 'share_needs', 'want_leave'],
    interrupt_time: ['ask_process', 'delay_decision', 'want_leave'],
    interrupt_risk: ['raise_objection', 'ask_scope', 'delay_decision'],
    raise_objection: ['delay_decision', 'ask_process', 'want_leave'],
  }[decision.intent] || [];

  const fallback = ['delay_decision', 'share_needs', 'want_leave'];
  const candidatePool = [...replacementChain, ...fallback].filter(Boolean);
  const replacement = candidatePool.find((intent) => !recent.includes(intent)) || candidatePool[0];

  if (!replacement || replacement === decision.intent) return decision;
  return switchDecisionIntent(decision, replacement, '（避免重复追问）');
}

function decideCustomerAction({ state, signal, slots, personaInput = {} }) {
  const persona = resolvePersona(personaInput);
  const recentIntents = Array.isArray(state.intentHistory) ? state.intentHistory.slice(-4) : [];
  const lastIntent = recentIntents[recentIntents.length - 1] || slots.lastCustomerIntent;
  const checkoutOnlyLine = Boolean(
    signal.mentionsCheckout
    && !signal.asksMember
    && !signal.mentionsCoupon
    && !signal.explainsRules
    && !signal.explainsThreshold
    && !signal.explainsEffective
    && !signal.explainsExpiry
    && !signal.explainsScope
    && !signal.mentionsProcess
  );
  const hasNewBusinessInfo = !checkoutOnlyLine && Boolean(
    signal.quantifiesBenefit
    || signal.explainsRules
    || signal.explainsThreshold
    || signal.explainsEffective
    || signal.explainsExpiry
    || signal.explainsScope
    || signal.mentionsProcess
  );

  const intentScores = normalizeIntentScores(state.intentScores || {}, persona);
  const mainIntent = INTENT_TYPES.includes(state.mainIntent) ? state.mainIntent : pickMainIntent(intentScores);
  const acceptanceReady = state.acceptanceReady || isIntentAccepted(intentScores);
  const processStageLock = Boolean(
    slots.processStageEntered
    && slots.processExplained
    && slots.coreValueQuestionsCovered
    && !signal.hardSell
    && !signal.unclearOrNegative
    && !slots.annoyanceTriggered
    && state.objectionLevel < 65
  );

  let decision;
  if (acceptanceReady) {
    decision = buildDecision('R00', 'ready_join', 'accept', '办理效率', '价值/时间/风险三类意图均已被解决。', 'happy');
  } else if (state.patience < 22 || state.annoyance > 78) {
    decision = buildDecision('R01', 'want_leave', 'reject', '时间成本', '耐心过低，倾向先结束对话。', 'annoyed');
  } else if (lastIntent === 'topic_switch' && !hasNewBusinessInfo) {
    decision = buildDecision('R01E', 'topic_switch', 'continue_talk', '先完成结账', '顾客已切换到收银主线，维持支付确认语义。', 'neutral');
  } else if ((lastIntent === 'delay_decision' || lastIntent === 'want_leave') && !hasNewBusinessInfo) {
    if (signal.mentionsCheckout) {
      decision = buildDecision('R01D', 'topic_switch', 'continue_talk', '先完成结账', '顾客已明确暂不办卡，当前进入收银支付流程。', 'neutral');
    } else {
      decision = buildDecision('R01B', 'delay_decision', 'hesitate', '先完成结账', '顾客已明确先结账，当前未出现新增价值信息。', 'neutral');
    }
  } else if (signal.longWinded && slots.timePressure) {
    decision = buildDecision('R01C', 'interrupt_time', 'question', CONCERN_LABEL.time, '顾客打断并要求更高沟通效率。', 'annoyed');
  } else if (signal.hardSell || slots.annoyanceTriggered) {
    decision = buildDecision('R08', 'interrupt_risk', 'question', CONCERN_LABEL.risk, '顾客对推销感敏感，先进入防御模式。', 'annoyed');
  } else if (processStageLock) {
    if (signal.mentionsCheckout) {
      decision = buildDecision('R13C', 'topic_switch', 'continue_talk', '先完成结账', '顾客已进入流程咨询后转入支付环节，不再重复拒绝。', 'neutral');
    } else if (slots.timePressure || state.patience < 45) {
      decision = buildDecision('R13B', 'want_leave', 'reject', '先完成结账', '顾客已问办理流程，但当前更倾向先完成结账。', 'neutral');
    } else {
      decision = buildDecision('R13', 'delay_decision', 'hesitate', '办理效率', '顾客已进入办理咨询阶段，默认不回跳到旧价值异议。', 'neutral');
    }
  } else if (slots.memberAsked && !slots.memberStatusKnown) {
    const isHasCard = (persona.memberStatusDefault || 'no_card') === 'has_card';
    decision = buildDecision(
      'R02',
      isHasCard ? 'answer_member_status_has_card' : 'answer_member_status_no_card',
      'continue_talk',
      '先确认会员身份',
      '店员问会员时先明确有无会员卡，避免跳题。',
      'neutral'
    );
  } else {
    if (mainIntent === 'value') {
      if (!slots.benefitIntroduced) {
        decision = buildDecision('R03', 'ask_join_benefit', 'question', CONCERN_LABEL.benefit, '主意图=价值，优先确认办卡是否真的划算。', 'curious');
      } else if (!slots.ruleFacts.threshold) {
        decision = buildDecision('R05', 'ask_coupon_rule', 'question', '优惠规则细节', '主意图=价值，先确认优惠门槛。', 'curious');
      } else if (intentScores.value >= 48) {
        decision = buildDecision('R09', 'ask_benefit_amount', 'question', CONCERN_LABEL.benefit, '主意图=价值，仍需要量化本单收益。', 'neutral');
      } else if (!slots.processExplained) {
        decision = buildDecision('R06', 'ask_process', 'question', CONCERN_LABEL.convenience, '价值已基本认可，转向办理便利性。', 'interested');
      } else {
        decision = buildDecision('R07V', 'delay_decision', 'hesitate', '办理效率', '价值疑虑已低，但仍需同时确认时间与风险顾虑。', 'neutral');
      }
    } else if (mainIntent === 'time') {
      if (slots.timePressure && state.patience < 50 && !hasNewBusinessInfo) {
        decision = buildDecision('R11', 'want_leave', 'reject', CONCERN_LABEL.time, '主意图=时间，顾客倾向先结账离场。', 'annoyed');
      } else if (!slots.processExplained) {
        decision = buildDecision('R06', 'ask_process', 'question', CONCERN_LABEL.time, '主意图=时间，优先问流程快不快。', 'interested');
      } else if (signal.longWinded) {
        decision = buildDecision('R11B', 'interrupt_time', 'question', CONCERN_LABEL.time, '主意图=时间，顾客打断要求说重点。', 'annoyed');
      } else if (intentScores.time <= 38 && !acceptanceReady) {
        decision = buildDecision('R11D', 'delay_decision', 'hesitate', CONCERN_LABEL.time, '时间疑虑已降低，但仍需确认价值与风险再决定。', 'neutral');
      } else {
        decision = buildDecision('R11C', 'delay_decision', 'hesitate', CONCERN_LABEL.time, '主意图=时间，仍想先快速结账。', 'neutral');
      }
    } else {
      if (!slots.ruleFacts.effectiveTime) {
        decision = buildDecision('R12', 'ask_effective_time', 'question', CONCERN_LABEL.risk, '主意图=风险，先确认生效时间。', 'curious');
      } else if (!slots.ruleFacts.scope) {
        decision = buildDecision('R12B', 'ask_scope', 'question', CONCERN_LABEL.risk, '主意图=风险，继续确认适用范围。', 'curious');
      } else if (!slots.ruleFacts.expiry) {
        decision = buildDecision('R12C', 'ask_expiry', 'question', CONCERN_LABEL.risk, '主意图=风险，确认是否容易过期浪费。', 'curious');
      } else if (signal.hardSell || state.objectionLevel > 62) {
        decision = buildDecision('R08', 'raise_objection', 'question', CONCERN_LABEL.risk, '主意图=风险，防御心理上升。', 'annoyed');
      } else if (intentScores.risk <= 36 && slots.processExplained && !acceptanceReady) {
        decision = buildDecision('R12D', 'delay_decision', 'hesitate', CONCERN_LABEL.risk, '风险疑虑已降低，但仍需确认其他意图是否解决。', 'neutral');
      } else {
        decision = buildDecision('R12E', 'delay_decision', 'hesitate', CONCERN_LABEL.risk, '主意图=风险，但未触发新风险信号，先不回跳异议。', 'neutral');
      }
    }
  }

  return avoidRepeatIntent(decision, state, slots);
}

function getLastCustomerUtterance(history = []) {
  const last = [...history].reverse().find((m) => m?.who === 'customer' && m?.text);
  return last ? firstText(last.text) : '';
}

function pickReplyVariant(options, recentReplies = [], seed = 0) {
  const list = (options || []).map((t) => firstText(t)).filter(Boolean);
  if (!list.length) return '你再说详细一点。';
  const recent = new Set((recentReplies || []).map((x) => firstText(x)).filter(Boolean));
  const pool = list.filter((item) => !recent.has(item));
  const target = pool.length ? pool : list;
  return target[Math.abs(toInt(seed, 0)) % target.length];
}

function buildReplyOptionsByPersona(intent, persona, slots) {
  const personaSpecific = {
    price_sensitive: {
      ask_benefit_amount: ['我这单到底能省多少？', '不办这次会差多少钱？', '你直接说现在能省几块。'],
      share_needs: ['我主要看这次能不能立减。', '我平时就买常备药，优惠要实在。'],
    },
    chronic_repurchase: {
      share_needs: ['我每个月都来买慢病药。', '长期买药，会员是不是更划算？'],
      ask_scope: ['慢病药也都能用券吗？', '常买的药都能参加吗？'],
    },
    young_white_collar: {
      ask_process: ['流程几步？能快点吗？', '怎么操作最省时间？'],
      want_leave: ['我赶时间，先不用了。', '先结账，下次再说吧。', '嗯先结账，今天就不办了。'],
    },
    mom_with_kid: {
      ask_scope: ['儿童用品也能用这券吗？', '给孩子买药也可以抵扣吗？'],
      share_needs: ['我家里孩子用药多，想看长期省不省。', '我买儿童常备药比较频繁。'],
    },
    hurry_checkout: {
      ask_process: ['你说最短流程，几步办完？', '别绕，怎么最快办好？'],
      want_leave: ['我赶时间，先结账。', '今天先不办，太着急了。', '先把账结了，办卡改天。'],
    },
  };

  const common = {
    answer_member_status_no_card: ['我还没办会员。', '我没有会员卡。', '还不是会员呢。'],
    answer_member_status_has_card: ['我有会员卡，你帮我看看有券吗？', '我有会员，能查下优惠吗？'],
    ask_join_benefit: ['我没会员，办了这单能省多少？', '现在办卡能立刻有什么优惠？', '先说清楚办卡值不值。'],
    ask_benefit_amount: ['我今天这单到底能省多少？', '办会员对我这次有什么好处？', '你给我算下本单能省多少钱。'],
    ask_coupon_rule: ['这个券怎么用？', '满9.9减5是每张都这样吗？', '这个优惠券有啥门槛？'],
    ask_effective_time: ['这个券是当天就能用吗？', '次日生效是明天开始吗？', '今天办卡，今天能减吗？'],
    ask_expiry: ['这券多久会过期？', '一个月后就不能用了是吗？', '有效期从哪天开始算？'],
    ask_scope: ['全场都能用吗？', '是不是所有商品都能抵扣？', '有没有不能用券的品类？'],
    ask_process: ['那具体怎么操作办卡？', '是扫码加微信就行吗？', '办卡流程几步能完成？'],
    interrupt_time: ['您说重点，我有点赶时间。', '能简短点吗？我先结账。', '先说一句最关键的优惠。'],
    interrupt_risk: ['您别急着推，我先确认清楚。', '我担心有隐形条件，先说规则。', '先别催办卡，我想听明白。'],
    topic_switch: ['先把这单结了吧，我微信支付。', '这次先结账，会员下次再办。', '好，先付款，会员我先不办。'],
    raise_objection: ['我主要担心信息会不会泄露。', '办了会不会总给我发骚扰信息？', '先说清楚隐私和打扰问题。'],
    delay_decision: ['我再想想，先把账结了。', '先不急，我再确认下。'],
    ready_join: ['行，那你帮我办一下吧。', '可以，现在就开通。', '那就办吧，你带我操作。'],
    want_leave: ['我赶时间，先不用了。', '今天先不办，先结账。', '嗯，先把账结了。'],
    share_needs: ['我平时买常备药比较多。', '我主要是给家里备药。', '我来店里买药频次还挺高。'],
  };

  const personaMap = personaSpecific[persona.id] || {};
  const externalMap = persona.intentReplyOverrides && typeof persona.intentReplyOverrides === 'object'
    ? persona.intentReplyOverrides
    : {};
  if (intent === 'ask_coupon_rule' && slots.missingRuleFacts.includes('effectiveTime')) {
    return common.ask_effective_time;
  }
  return externalMap[intent] || personaMap[intent] || common[intent] || ['你再说详细一点。'];
}

function buildTemplateCustomerReply(decision, context = {}) {
  const recentReplies = (context.history || [])
    .filter((m) => m?.who === 'customer' && m?.text)
    .map((m) => firstText(m.text))
    .filter(Boolean)
    .slice(-4);
  const seed = (context.state?.turn || 0) + (context.history?.length || 0);
  const persona = resolvePersona(context.persona || context.personaId || {});
  const slots = context.slots || { missingRuleFacts: [] };

  const options = buildReplyOptionsByPersona(decision.intent, persona, slots);
  return {
    reply: pickReplyVariant(options, recentReplies, seed),
    emotion: EMOTION_LIST.includes(decision.emotion) ? decision.emotion : 'neutral',
    action: decision.action || 'question',
  };
}

function concernToLabel(concern = '') {
  return CONCERN_LABEL[concern] || '是否划算';
}

function buildCoachHint(decision, state, slots) {
  const map = {
    answer_member_status_no_card: {
      customerMindset: '顾客先在确认身份，还没进入办卡价值讨论。',
      clerkTip: '下一句建议：先肯定“没关系”，再直接讲本单可省金额。',
    },
    answer_member_status_has_card: {
      customerMindset: '顾客已有会员，期待你快速查券并兑现优惠。',
      clerkTip: '下一句建议：直接报可用券和本单可省金额，别重复问办卡。',
    },
    ask_join_benefit: {
      customerMindset: '顾客在问“为什么要办”，核心是本单收益。',
      clerkTip: '下一句建议：一句话量化“本单减几元+后续3张券价值”。',
    },
    ask_benefit_amount: {
      customerMindset: '顾客还没被说服，想听到可量化收益。',
      clerkTip: '下一句建议：把“满9.9减5”换算到当前小票。',
    },
    ask_coupon_rule: {
      customerMindset: '顾客进入规则核对阶段，想确认门槛。',
      clerkTip: '下一句建议：明确“满9.9减5，每张都这样”。',
    },
    ask_effective_time: {
      customerMindset: '顾客担心今天办了不能马上用。',
      clerkTip: '下一句建议：讲清“领取后次日生效”。',
    },
    ask_expiry: {
      customerMindset: '顾客在确认权益是否会浪费。',
      clerkTip: '下一句建议：明确“每张券一个月有效”。',
    },
    ask_scope: {
      customerMindset: '顾客在核对适用范围，避免踩坑。',
      clerkTip: '下一句建议：直接说“全场通用”，并举一类常买商品。',
    },
    ask_process: {
      customerMindset: '顾客对价值基本认可，卡在办理便捷性。',
      clerkTip: '下一句建议：按“扫码-加企微-点卡片授权”三步说完。',
    },
    interrupt_time: {
      customerMindset: '顾客打断你了，核心诉求是“快、短、可执行”。',
      clerkTip: '下一句建议：用一句话先讲“本单省多少”，再给最短流程。',
    },
    interrupt_risk: {
      customerMindset: '顾客出现防御打断，核心诉求是“先安心再决定”。',
      clerkTip: '下一句建议：先降压共情，再讲隐私与规则边界。',
    },
    topic_switch: {
      customerMindset: '顾客临时切到结账主线，说明办卡窗口在收缩。',
      clerkTip: '下一句建议：先完成收银，再留一句后续办理入口。',
    },
    raise_objection: {
      customerMindset: '顾客防御升高，担心被强推。',
      clerkTip: '下一句建议：先共情，再给事实，不要连续催办卡。',
    },
    delay_decision: {
      customerMindset: '顾客想缓一缓，信任还未完全建立。',
      clerkTip: '下一句建议：补一条关键信息后轻收口，不强压。',
    },
    ready_join: {
      customerMindset: '顾客已准备办理，等你明确动作引导。',
      clerkTip: '下一句建议：直接引导扫码并说明30秒内完成。',
    },
    want_leave: {
      customerMindset: '顾客强烈时间压力，优先结束对话。',
      clerkTip: '下一句建议：先放行，留一句“下次结账前可先领券”。',
    },
    share_needs: {
      customerMindset: '顾客愿意分享场景，沟通窗口打开。',
      clerkTip: '下一句建议：顺着需求匹配权益，讲“对你有什么用”。',
    },
  };

  const base = map[decision.intent] || map.ask_benefit_amount;
  const mainIntentLabel = INTENT_LABEL[state.mainIntent] || '价值意图';
  if (slots.annoyanceTriggered || state.annoyance > 70) {
    return {
      customerMindset: '顾客反感在上升，继续硬推会直接流失。',
      clerkTip: '下一句建议：先道歉降压，再用一句事实恢复信任。',
      keyConcern: concernToLabel('risk'),
      mainIntent: mainIntentLabel,
    };
  }
  return {
    ...base,
    keyConcern: concernToLabel(state.currentConcern || decision.keyConcern),
    mainIntent: mainIntentLabel,
  };
}

function buildSlotSummary(slots = {}) {
  const summary = [];
  if (slots.memberAsked) summary.push('已问会员状态');
  if (slots.memberStatusKnown) summary.push(`顾客会员状态:${slots.memberStatus === 'has_card' ? '有卡' : '无卡'}`);
  if (slots.benefitIntroduced) summary.push('已介绍优惠权益');
  if (slots.ruleFacts?.threshold) summary.push('已讲门槛');
  if (slots.ruleFacts?.effectiveTime) summary.push('已讲次日生效');
  if (slots.ruleFacts?.expiry) summary.push('已讲有效期');
  if (slots.ruleFacts?.scope) summary.push('已讲适用范围');
  if (slots.processExplained) summary.push('已讲办理流程');
  if (slots.timePressure) summary.push('顾客赶时间');
  if (slots.annoyanceTriggered) summary.push('触发反感信号');
  return summary.join('；') || '尚未形成明确槽位进展';
}

function buildCustomerExpressionPrompt({
  scenario,
  customerName,
  customerProfile,
  clerkText,
  state,
  decision,
  history,
  persona,
  slots,
}) {
  const lastCustomer = getLastCustomerUtterance(history) || '（无）';
  const historyText = (history || [])
    .slice(-8)
    .map((m) => `${m.who === 'clerk' ? '店员' : '顾客'}：${m.text}`)
    .join('\n');

  const slotSummary = buildSlotSummary(slots);

  return `你是门店员工培训系统的顾客Agent，请基于“决策结果”输出一句真实口语回复。

场景：${scenario}
顾客：${customerName}
画像：${customerProfile}
画像关注优先级：${(persona.concernPriority || ['benefit', 'time', 'risk', 'convenience']).map((c) => CONCERN_LABEL[c] || c).join(' > ')}

会员权益事实（必须遵守）：
- 新人券：15元套券（3张）
- 每张券：满9.9元减5元
- 生效：领取后次日生效
- 有效期：每张券1个月
- 使用范围：全场通用

当前槽位进度：${slotSummary}

当前状态：
- trust: ${state.trust}
- patience: ${state.patience}
- interest: ${state.interest}
- objectionLevel: ${state.objectionLevel}
- stage: ${state.stage}
- emotion: ${state.emotion}
- mainIntent: ${INTENT_LABEL[state.mainIntent] || state.mainIntent}
- intentScores: value=${state?.intentScores?.value}, time=${state?.intentScores?.time}, risk=${state?.intentScores?.risk}

本轮店员话术：${clerkText}

顾客决策（必须遵循）：
- ruleId: ${decision.ruleId}
- intent: ${decision.intent}
- action: ${decision.action}
- keyConcern: ${decision.keyConcern}
- emotion: ${decision.emotion}
- reason: ${decision.reason}

上一轮顾客原话：${lastCustomer}
最近对话：
${historyText || '（无）'}

禁止项：
1) 不要重复上一轮顾客原话。
2) 若当前 intent 是“回答会员状态”，禁止跳去追问优惠规则。
3) 若槽位中 benefitIntroduced=false，禁止问“券怎么用/还有什么优惠”。
4) 顾客发言必须由“主意图 + 槽位限制”共同决定，不可机械按槽位顺序提问。
5) 不要编造新权益，不要跳出顾客身份。

请严格输出 JSON（不要输出其他内容）：
{
  "reply": "<顾客一句话，18字以内，口语化>",
  "emotion": "<neutral|curious|interested|happy|annoyed>",
  "action": "<question|accept|reject|hesitate|continue_talk>"
}`;
}

function isReplyAlignedWithIntent(replyInput, intent) {
  const reply = firstText(replyInput);
  if (!reply) return false;

  const checker = {
    answer_member_status_no_card: /(没会员|没有会员|不是会员|没办)/,
    answer_member_status_has_card: /(有会员|有卡|已经是会员)/,
    ask_join_benefit: /(省多少|值不值|优惠|好处)/,
    ask_benefit_amount: /(省多少|多少钱|划算|好处)/,
    ask_coupon_rule: /(怎么用|门槛|满9\.9|减5)/,
    ask_effective_time: /(当天|次日|明天|生效)/,
    ask_expiry: /(多久|有效期|过期|一个月)/,
    ask_scope: /(全场|都能|范围|哪些)/,
    ask_process: /(怎么|流程|扫码|操作|授权)/,
    interrupt_time: /(快点|简短|重点|先结账|赶时间)/,
    interrupt_risk: /(别急|先确认|隐形条件|先说清楚|别催)/,
    topic_switch: /(先结账|金额|收银|先不聊办卡|付款|支付|微信|支付宝)/,
    raise_objection: /(担心|隐藏|别急|推销|靠谱不)/,
    delay_decision: /(再想想|先结账|先不急|改天)/,
    ready_join: /(帮我办|现在办|开通|行，那办)/,
    want_leave: /(先不用|赶时间|先结账|改天)/,
  };

  const re = checker[intent];
  return re ? re.test(reply) : true;
}

function pushIntentHistory(stateInput, intent) {
  const state = { ...(stateInput || {}) };
  const current = Array.isArray(state.intentHistory) ? state.intentHistory : [];
  state.intentHistory = [...current, firstText(intent)].filter(Boolean).slice(-4);
  return state;
}

function evaluateIntentResolution(conversation = [], personaInput = {}) {
  const persona = resolvePersona(personaInput);
  let state = buildInitialCustomerState(persona);
  const startScores = { ...(state.intentScores || initIntentScores(persona)) };
  const history = [];
  const mainIntentFlow = [];

  (conversation || []).forEach((msg) => {
    const who = msg?.who;
    const text = firstText(msg?.text);
    if (!text || (who !== 'clerk' && who !== 'customer')) return;

    if (who === 'clerk') {
      const signal = analyzeClerkBehavior(text);
      const slots = deriveScenarioSlots(history, text, signal, state, persona);
      const outcome = applyStateRules(state, signal, slots, persona, { clerkText: text, history });
      state = outcome.nextState;
      mainIntentFlow.push({
        turn: state.turn,
        main_intent: state.mainIntent,
        scores: { ...state.intentScores },
      });
    }
    history.push({ who, text });
  });

  const endScores = { ...(state.intentScores || initIntentScores(persona)) };
  const thresholds = INTENT_ENGINE_CONFIG.acceptThresholds;
  const resolved = resolveIntentFlags(endScores, thresholds);
  const details = INTENT_TYPES.reduce((acc, intent) => {
    acc[intent] = {
      start: toInt(startScores[intent], 0),
      end: toInt(endScores[intent], 0),
      threshold: toInt(thresholds[intent], 35),
      solved: !!resolved[intent],
      delta: toInt(startScores[intent], 0) - toInt(endScores[intent], 0),
    };
    return acc;
  }, {});
  const solvedCount = INTENT_TYPES.filter((intent) => resolved[intent]).length;

  return {
    summary: `已解决${solvedCount}/3类顾客意图`,
    start_scores: startScores,
    end_scores: endScores,
    resolved,
    details,
    solved_count: solvedCount,
    all_resolved: solvedCount === INTENT_TYPES.length,
    main_intent_flow: mainIntentFlow.slice(-10),
  };
}

function buildPlaybook() {
  return {
    membershipFacts: MEMBERSHIP_FACTS,
    slotTable: SLOT_TABLE,
    decisionRules: DECISION_RULE_TABLE,
    slotConstraints: EXTERNAL_SLOT_CONSTRAINTS || null,
    scoringRubric: EXTERNAL_SCORING_RUBRIC || null,
    intentEngine: {
      intents: INTENT_TYPES.map((k) => ({ key: k, label: INTENT_LABEL[k] })),
      acceptThresholds: INTENT_ENGINE_CONFIG.acceptThresholds,
      keywordMap: AUTO_INTENT_KEYWORDS,
      keywordSourceStats: {
        surveySnippetCount: STORE_MANAGER_SURVEY_SNIPPETS.length,
        generatedKeywordCount: INTENT_TYPES.reduce((acc, k) => acc + (AUTO_INTENT_KEYWORDS[k] || []).length, 0),
      },
    },
    surveyDataSample: STORE_MANAGER_SURVEY_SNIPPETS.slice(0, 24),
    annoyanceTriggers: ANNOYANCE_TRIGGER_TERMS.map((re) => re.source.replace(/\\/g, '')),
    externalConfig: EXTERNAL_AGENT_CONFIG_META,
    personas: PERSONA_IDS.map((id) => {
      const p = CUSTOMER_PERSONAS[id];
      return {
        id: p.id,
        label: p.label,
        customerName: p.customerName,
        openingLine: p.openingLine,
        source: p.source || 'builtin',
        concernPriority: p.concernPriority,
        concernPriorityLabel: p.concernPriority.map((c) => CONCERN_LABEL[c] || c),
        typicalObjections: p.typicalObjections,
      };
    }),
  };
}

module.exports = {
  MEMBERSHIP_FACTS,
  SLOT_TABLE,
  DECISION_RULE_TABLE,
  ANNOYANCE_TRIGGER_TERMS,
  INTENT_ENGINE_CONFIG,
  INTENT_TYPES,
  INTENT_LABEL,
  AUTO_INTENT_KEYWORDS,
  CUSTOMER_PERSONAS,
  resolvePersona,
  buildInitialCustomerState,
  normalizeCustomerState,
  analyzeClerkBehavior,
  deriveScenarioSlots,
  applyStateRules,
  decideCustomerAction,
  buildTemplateCustomerReply,
  buildCoachHint,
  buildCustomerExpressionPrompt,
  isReplyAlignedWithIntent,
  pushIntentHistory,
  evaluateIntentResolution,
  buildPlaybook,
};
