/**
 * Cloudflare Worker — Store Practice API
 * 代理 Anthropic Claude API，避免前端暴露 API Key
 *
 * Routes:
 *   POST /api/chat   — 流式对话（AI 顾客角色扮演）
 *   POST /api/score  — 对话完成后结构化评分
 */

const CLAUDE_API = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-haiku-4-5-20251001';

// ──────────────────────────────────────────────
// CORS 工具
// ──────────────────────────────────────────────
function corsHeaders(origin, env) {
  const allowed = [
    env.ALLOWED_ORIGIN,
    'http://localhost:8899',
    'http://localhost:3000',
    'http://127.0.0.1:8899',
  ].filter(Boolean);

  const o = allowed.includes(origin) ? origin : allowed[0];
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

    // Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin, env) });
    }

    if (request.method !== 'POST') {
      return jsonResp({ error: 'Method not allowed' }, 405, origin, env);
    }

    try {
      if (url.pathname === '/api/chat') {
        return handleChat(request, origin, env);
      }
      if (url.pathname === '/api/score') {
        return handleScore(request, origin, env);
      }
      return jsonResp({ error: 'Not found' }, 404, origin, env);
    } catch (err) {
      console.error(err);
      return jsonResp({ error: err.message }, 500, origin, env);
    }
  },
};

// ──────────────────────────────────────────────
// POST /api/chat  — 流式 AI 顾客对话
// ──────────────────────────────────────────────
async function handleChat(request, origin, env) {
  const body = await request.json();
  const { messages = [], scenario = '收银·会员引导', customerName = '王阿姨' } = body;

  const systemPrompt = `你是门店员工培训系统中的AI顾客，扮演${customerName}。

场景：${scenario}

角色设定：
- 你是一位50岁左右的普通女性顾客，说话简短直接
- 根据店员的表现自然地调整情绪：
  - 店员热情专业 → 你变得友好、有兴趣
  - 店员模糊不清 → 你追问或表示疑惑
  - 店员拖沓啰嗦 → 你不耐烦
- 回复必须简短（15字以内），用日常口语

格式要求：
每条回复末尾必须附加情绪标签（不要换行），格式：[EMO:情绪]
情绪值只能是：neutral / curious / interested / happy / annoyed
示例：没有，办卡有啥好处？[EMO:curious]

只扮演顾客，不要解释、不要跳出角色。`;

  // 把前端传来的 messages 转换成 Claude 格式
  const claudeMessages = messages.map(m => ({
    role: m.role === 'clerk' ? 'user' : m.role === 'customer' ? 'assistant' : m.role,
    content: m.content,
  }));

  const payload = {
    model: MODEL,
    max_tokens: 200,
    system: systemPrompt,
    messages: claudeMessages,
    stream: true,
  };

  const upstream = await fetch(CLAUDE_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(payload),
  });

  if (!upstream.ok) {
    const err = await upstream.text();
    throw new Error(`Claude API error ${upstream.status}: ${err}`);
  }

  // 透传流式响应
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
// POST /api/score  — 结构化评分
// ──────────────────────────────────────────────
async function handleScore(request, origin, env) {
  const body = await request.json();
  const { conversation = [], keyPoints = [], scenario = '收银·会员引导' } = body;

  // 只取店员的对话用于评分参考，顾客对话提供上下文
  const dialogText = conversation
    .filter(m => m.who === 'clerk' || m.who === 'customer')
    .map(m => `【${m.who === 'clerk' ? '店员' : '顾客'}】${m.text}`)
    .join('\n');

  const keyPointsList = keyPoints.map((p, i) => `${i + 1}. ${p.label}（${p.tip}）`).join('\n');

  const scoringPrompt = `你是一位专业的门店销售培训评估专家。请评估以下对练记录中店员的表现。

场景：${scenario}

需要覆盖的关键话术要点：
${keyPointsList}

对话记录：
${dialogText}

请严格按照以下 JSON 格式返回评分结果（不要输出其他内容）：
{
  "score": <0到100的整数，综合评分>,
  "stars": <1到3的整数，1=需改进，2=不错，3=优秀>,
  "covered": [<已覆盖的要点label数组>],
  "missed": [<遗漏的要点label数组>],
  "feedback_good": "<15字以内，做得好的一句话>",
  "feedback_improve": "<15字以内，最需改进的一句话>",
  "per_message": [
    <只对店员的每条消息评估，格式如下：>
    {
      "text": "<店员原话>",
      "tag": <"good"|"great"|"warn"|"bad"|null>,
      "note": <"15字以内的点评"|null>
    }
  ]
}

评分标准：
- good：话术正确，表达清晰
- great：超出预期，特别出色（如量化收益、主动预见顾客疑虑）
- warn：内容基本对但漏掉了关键信息
- bad：话术有误或可能引起顾客反感
- null：普通过渡语，无需点评`;

  const payload = {
    model: MODEL,
    max_tokens: 1500,
    messages: [{ role: 'user', content: scoringPrompt }],
  };

  const resp = await fetch(CLAUDE_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Claude API error ${resp.status}: ${err}`);
  }

  const data = await resp.json();
  const raw = data.content?.[0]?.text || '{}';

  // 提取 JSON（Claude 有时会在外面加文字）
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Score JSON not found in response');

  const scoreData = JSON.parse(match[0]);
  return jsonResp(scoreData, 200, origin, env);
}
