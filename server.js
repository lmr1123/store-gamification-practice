/**
 * 本地一体化服务器
 * - 静态文件服务（替代 python3 -m http.server）
 * - /api/* 代理到 GLM API（无需 Cloudflare）
 *
 * 启动：node server.js
 * 访问：http://localhost:8899
 */

const http  = require('http');
const https = require('https');
const fs    = require('fs');
const path  = require('path');
const url   = require('url');

// ── 配置 ──────────────────────────────────────
const PORT    = 8899;
const GLM_API = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
const MODEL   = 'glm-4-flash';

// 从环境变量读取 Key（安全，不写进代码）
const GLM_KEY = process.env.GLM_API_KEY || '';

// ── MIME 类型 ──────────────────────────────────
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.jsx':  'application/javascript; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.json': 'application/json',
};

// ── 系统 prompt（顾客角色扮演） ──────────────
function buildSystemPrompt(scenario, customerName) {
  return `你是门店员工培训系统中的AI顾客，扮演${customerName}。

场景：${scenario}

角色设定：
- 你是一位50岁左右的普通女性顾客，说话简短直接
- 根据店员的表现自然调整情绪：
  - 店员热情专业 → 你变得友好、有兴趣
  - 店员模糊不清 → 你追问或表示疑惑
  - 店员拖沓啰嗦 → 你不耐烦
- 回复必须简短（15字以内），用日常口语

格式要求：
每条回复末尾附加情绪标签（不换行），格式：[EMO:情绪]
情绪值只能是：neutral / curious / interested / happy / annoyed
示例：没有，办卡有啥好处？[EMO:curious]

只扮演顾客，不解释，不跳出角色。`;
}

// ── 评分 prompt ────────────────────────────────
function buildScorePrompt(conversation, keyPoints, scenario) {
  const dialog = conversation
    .filter(m => m.who === 'clerk' || m.who === 'customer')
    .map(m => `【${m.who === 'clerk' ? '店员' : '顾客'}】${m.text}`)
    .join('\n');

  const kpList = keyPoints.map((p, i) => `${i+1}. ${p.label}（${p.tip}）`).join('\n');

  return `你是门店销售培训评估专家。评估以下对练记录中店员的表现。

场景：${scenario}
关键话术要点：
${kpList}

对话记录：
${dialog}

严格按以下JSON格式返回（不输出其他内容）：
{
  "score": <0-100整数>,
  "stars": <1-3整数，85+为3星，65+为2星，其余1星>,
  "covered": [<已覆盖的要点label列表>],
  "missed": [<遗漏的要点label列表>],
  "feedback_good": "<15字内，做得好的一句话>",
  "feedback_improve": "<15字内，最需改进的一句话>",
  "per_message": [
    {"text":"<店员原话>","tag":<"good"|"great"|"warn"|"bad"|null>,"note":<"15字内点评"|null>}
  ]
}`;
}

// ── GLM 调用（流式） ───────────────────────────
function glmStream(messages, res) {
  const body = JSON.stringify({
    model: MODEL,
    messages,
    stream: true,
    max_tokens: 150,
    temperature: 0.8,
  });

  const options = {
    hostname: 'open.bigmodel.cn',
    path: '/api/paas/v4/chat/completions',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GLM_KEY}`,
      'Content-Length': Buffer.byteLength(body),
    },
  };

  const req = https.request(options, (upstream) => {
    res.writeHead(upstream.statusCode, {
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
function glmSync(messages, callback) {
  const body = JSON.stringify({
    model: MODEL,
    messages,
    temperature: 0.3,
    max_tokens: 1500,
  });

  const options = {
    hostname: 'open.bigmodel.cn',
    path: '/api/paas/v4/chat/completions',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GLM_KEY}`,
      'Content-Length': Buffer.byteLength(body),
    },
  };

  let data = '';
  const req = https.request(options, (res) => {
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        callback(null, json.choices?.[0]?.message?.content || '{}');
      } catch(e) {
        callback(e);
      }
    });
  });

  req.on('error', callback);
  req.write(body);
  req.end();
}

// ── HTTP 服务器 ────────────────────────────────
const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname;

  // CORS 预检
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    return res.end();
  }

  // ── API 路由 ──────────────────────────────────

  if (req.method === 'POST' && pathname === '/api/chat') {
    let body = '';
    req.on('data', d => body += d);
    req.on('end', () => {
      if (!GLM_KEY) {
        res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        return res.end(JSON.stringify({ error: 'GLM_API_KEY not set' }));
      }
      try {
        const { messages = [], scenario = '收银·会员引导', customerName = '王阿姨' } = JSON.parse(body);
        const systemMsg = { role: 'system', content: buildSystemPrompt(scenario, customerName) };
        glmStream([systemMsg, ...messages], res);
      } catch(e) {
        res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  if (req.method === 'POST' && pathname === '/api/score') {
    let body = '';
    req.on('data', d => body += d);
    req.on('end', () => {
      if (!GLM_KEY) {
        res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        return res.end(JSON.stringify({ error: 'GLM_API_KEY not set' }));
      }
      try {
        const { conversation = [], keyPoints = [], scenario = '收银·会员引导' } = JSON.parse(body);
        const prompt = buildScorePrompt(conversation, keyPoints, scenario);
        glmSync([{ role: 'user', content: prompt }], (err, content) => {
          if (err) {
            res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            return res.end(JSON.stringify({ error: err.message }));
          }
          const match = content.match(/\{[\s\S]*\}/);
          const scoreData = match ? JSON.parse(match[0]) : { score: 75, stars: 2, covered: [], missed: [], feedback_good: '表现不错', feedback_improve: '继续加油', per_message: [] };
          res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
          res.end(JSON.stringify(scoreData));
        });
      } catch(e) {
        res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // ── 静态文件服务 ──────────────────────────────
  let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);

  // 去掉 URL 参数（如 ?v=7）
  filePath = filePath.split('?')[0];

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      return res.end('Not found');
    }
    const ext  = path.extname(filePath);
    const mime = MIME[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  });
});

server.listen(PORT, () => {
  if (!GLM_KEY) {
    console.log('\x1b[33m⚠️  GLM_API_KEY 未设置，AI 对话将使用 demo 模式\x1b[0m');
    console.log('设置方法：GLM_API_KEY=你的key node server.js\n');
  } else {
    console.log('\x1b[32m✅ GLM API 已就绪\x1b[0m\n');
  }
  console.log(`🚀 服务已启动：http://localhost:${PORT}`);
});
