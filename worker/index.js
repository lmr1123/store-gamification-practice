/**
 * Cloudflare Worker — Store Practice API
 * 代理智谱 GLM API（OpenAI 兼容格式），避免前端暴露 API Key
 *
 * Routes:
 *   POST /api/chat   — 流式对话（AI 顾客角色扮演）
 *   POST /api/score  — 对话完成后结构化评分
 *   POST /api/transcribe — 语音转文字（麦克风录音）
 */

const GLM_API = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
const GLM_ASR_API = 'https://open.bigmodel.cn/api/paas/v4/audio/transcriptions';
const MODEL_CHAT  = 'glm-4-flash';   // 免费，速度快，对话用
const MODEL_SCORE = 'glm-4-flash';   // 评分也用 flash，够用
const MODEL_ASR   = 'glm-asr-2512';

// ──────────────────────────────────────────────
// CORS
// ──────────────────────────────────────────────
function corsHeaders(origin, env) {
  const allowed = [
    env.ALLOWED_ORIGIN,
    'http://localhost:8899',
    'http://localhost:3000',
    'http://127.0.0.1:8899',
  ].filter(Boolean);
  const o = allowed.includes(origin) ? origin : (allowed[0] || '*');
  return {
    'Access-Control-Allow-Origin': o,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function jsonResp(data, status = 200, origin = '', env = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin, env) },
  });
}

// ──────────────────────────────────────────────
// 主入口
// ──────────────────────────────────────────────
export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin, env) });
    }
    if (request.method !== 'POST') {
      return jsonResp({ error: 'Method not allowed' }, 405, origin, env);
    }

    try {
      if (url.pathname === '/api/chat')  return handleChat(request, origin, env);
      if (url.pathname === '/api/score') return handleScore(request, origin, env);
      if (url.pathname === '/api/transcribe') return handleTranscribe(request, origin, env);
      return jsonResp({ error: 'Not found' }, 404, origin, env);
    } catch (err) {
      console.error(err);
      return jsonResp({ error: err.message }, 500, origin, env);
    }
  },
};

// ──────────────────────────────────────────────
// POST /api/chat — 流式 AI 顾客对话
// ──────────────────────────────────────────────
async function handleChat(request, origin, env) {
  const body = await request.json();
  const { messages = [], scenario = '收银·会员引导', customerName = '王阿姨' } = body;

  const systemPrompt = `你是门店员工培训系统中的AI顾客，扮演${customerName}。

场景：${scenario}

角色设定：
- 你是一位50岁左右的普通女性顾客，说话简短直接
- 根据店员的表现自然调整情绪：
  - 店员热情专业 → 你变得友好、有兴趣
  - 店员模糊不清 → 你追问或表示疑惑
  - 店员拖沓啰嗦 → 你不耐烦
- 回复必须简短（15字以内），用日常口语

格式要求：
每条回复末尾必须附加情绪标签（不换行），格式：[EMO:情绪]
情绪值只能是：neutral / curious / interested / happy / annoyed
示例：没有，办卡有啥好处？[EMO:curious]

只扮演顾客，不要解释，不要跳出角色。`;

  const payload = {
    model: MODEL_CHAT,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages,
    ],
    stream: true,
    max_tokens: 150,
    temperature: 0.8,
  };

  const upstream = await fetch(GLM_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.GLM_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  if (!upstream.ok) {
    const err = await upstream.text();
    throw new Error(`GLM API error ${upstream.status}: ${err}`);
  }

  // 透传流式 SSE（GLM 和 OpenAI 格式相同，直接透传）
  const { readable, writable } = new TransformStream();
  upstream.body.pipeTo(writable);

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      ...corsHeaders(origin, env),
    },
  });
}

// ──────────────────────────────────────────────
// POST /api/transcribe — 语音转文字
// ──────────────────────────────────────────────
async function handleTranscribe(request, origin, env) {
  const body = await request.json();
  const audioBase64 = String(body?.audioBase64 || '').replace(/^data:audio\/[^;]+;base64,/, '').trim();
  const hotwords = Array.isArray(body?.hotwords) ? body.hotwords : [];

  if (!audioBase64) return jsonResp({ error: 'audioBase64 required' }, 400, origin, env);

  const form = new FormData();
  form.set('model', MODEL_ASR);
  form.set('stream', 'false');
  form.set('file_base64', audioBase64);
  if (hotwords.length) form.set('prompt', `热词：${hotwords.slice(0, 50).join('、')}`);

  const resp = await fetch(GLM_ASR_API, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.GLM_API_KEY}`,
    },
    body: form,
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`GLM ASR error ${resp.status}: ${err}`);
  }

  const data = await resp.json();
  return jsonResp({ text: data?.text || '' }, 200, origin, env);
}

// ──────────────────────────────────────────────
// POST /api/score — 结构化评分
// ──────────────────────────────────────────────
async function handleScore(request, origin, env) {
  const body = await request.json();
  const { conversation = [], keyPoints = [], scenario = '收银·会员引导' } = body;

  const dialogText = conversation
    .filter(m => m.who === 'clerk' || m.who === 'customer')
    .map(m => `【${m.who === 'clerk' ? '店员' : '顾客'}】${m.text}`)
    .join('\n');

  const keyPointsList = keyPoints.map((p, i) => `${i + 1}. ${p.label}（${p.tip}）`).join('\n');

  const scoringPrompt = `你是门店销售培训评估专家。评估以下对练记录中店员的表现。

场景：${scenario}
关键话术要点：
${keyPointsList}

对话记录：
${dialogText}

严格按以下JSON格式返回（不输出其他内容）：
{
  "score": <0-100整数>,
  "stars": <1-3整数，85+为3星，65+为2星，其余1星>,
  "covered": [<已覆盖的要点label列表>],
  "missed": [<遗漏的要点label列表>],
  "feedback_good": "<15字内，做得好的一句话>",
  "feedback_improve": "<15字内，最需改进的一句话>",
  "per_message": [
    {
      "text": "<店员原话>",
      "tag": <"good"|"great"|"warn"|"bad"|null>,
      "note": <"15字内点评"|null>
    }
  ]
}

评分标准：good=话术正确 great=特别出色 warn=漏了关键信息 bad=话术有误 null=普通过渡`;

  const payload = {
    model: MODEL_SCORE,
    messages: [
      { role: 'user', content: scoringPrompt },
    ],
    temperature: 0.3,
    max_tokens: 1500,
  };

  const resp = await fetch(GLM_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.GLM_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`GLM API error ${resp.status}: ${err}`);
  }

  const data = await resp.json();
  const raw = data.choices?.[0]?.message?.content || '{}';

  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Score JSON not found in response');

  const scoreData = JSON.parse(match[0]);
  return jsonResp(scoreData, 200, origin, env);
}
