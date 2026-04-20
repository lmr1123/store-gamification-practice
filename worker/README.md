# Store Practice API — Cloudflare Worker

代理 Anthropic Claude API，为前端提供 AI 对练和评分接口。

## 部署步骤（5 分钟）

### 1. 安装 wrangler CLI
```bash
npm install -g wrangler
```

### 2. 登录 Cloudflare
```bash
npx wrangler login
```
浏览器会打开 Cloudflare 登录页，授权即可。

### 3. 设置 API Key（只需一次，加密存储）
```bash
cd worker
npx wrangler secret put ANTHROPIC_API_KEY
# 粘贴你的 Anthropic API Key，回车确认
```

### 4. 修改允许的域名
编辑 `wrangler.toml`，把 `ALLOWED_ORIGIN` 改为你的 GitHub Pages 地址：
```toml
[vars]
ALLOWED_ORIGIN = "https://你的用户名.github.io"
```

### 5. 部署
```bash
npx wrangler deploy
```

部署成功后会显示 Worker URL，格式类似：
```
https://store-practice-api.你的账号.workers.dev
```

### 6. 更新前端配置
打开 `screen-ai-practice.jsx`，把顶部的 `WORKER_URL` 改为上面的地址：
```js
const WORKER_URL = 'https://store-practice-api.你的账号.workers.dev';
```

然后把 `index.html` 里所有 JSX 的版本号 `?v=4` 改为 `?v=5`，让浏览器刷新缓存。

## API 接口

### POST /api/chat
流式对话接口（Server-Sent Events）

请求体：
```json
{
  "messages": [
    { "role": "user", "content": "欢迎光临！一共68元。" },
    { "role": "assistant", "content": "没有会员卡。[EMO:neutral]" }
  ],
  "scenario": "收银·会员引导",
  "customerName": "王阿姨"
}
```

### POST /api/score
对话评分接口（同步返回 JSON）

请求体：
```json
{
  "conversation": [
    { "who": "clerk", "text": "欢迎光临！" },
    { "who": "customer", "text": "帮我结账。" }
  ],
  "keyPoints": [
    { "label": "打招呼", "tip": "主动友好" }
  ],
  "scenario": "收银·会员引导"
}
```

## 成本估算
- Cloudflare Workers 免费额度：每天 10 万次请求
- Claude Haiku API：约 $0.001/次对话，50人团队每天 ¥1-5
