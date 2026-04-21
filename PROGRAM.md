# Program 项目进度总结

更新时间：2026-04-21

## 1. 当前目标
- 项目定位：药店门店员工会员办卡对练系统（顾客Agent + 数字人）。
- 当前阶段目标：先确保“手机端网页可用”，尤其语音输入可稳定使用；企业微信 JS-SDK 主链路待正式上线前改造。

## 2. 已完成进度

### 2.1 后端能力
- 已新增 `POST /api/scenario-init`（场景初始化）。
- 已新增 `POST /api/customer-turn`（顾客回合，两步式：规则决策 + LLM表达）。
- 已升级 `POST /api/score` 为结构化行为评估。
- 已新增 `POST /api/transcribe`（语音转写），并支持 ASR Provider 切换：
  - `xfyun`（讯飞，默认）
  - `glm`（兼容回退）
  - 当讯飞凭据未配置时，自动回退 `glm-fallback`，保障手机端可用

### 2.2 前端能力
- AI 对练流程已接新接口（scenario-init / customer-turn / score）。
- 数字顾客头像支持情绪切换。
- 顾客提示从“数值条”改为“大白话提醒”：
  - 顾客此刻在想什么
  - 当前疑虑
  - 店员下一句建议
- 语音输入已改为“双通道”：
  - 优先：浏览器内置 SpeechRecognition（可用则用）
  - 兜底：`getUserMedia + AudioContext` 录音，上传后端转写（适配内嵌 WebView）

### 2.3 对话体验优化
- 顾客回复已做去重和多样化处理，避免连续重复“还有别的优惠吗？”
- 已补充更多顾客意图分流（规则追问、门槛确认、分享需求、离场意图等）。

## 3. 已解决问题
- 端口占用导致服务起不来（EADDRINUSE）已定位处理。
- IAB/内嵌环境访问本地回环地址不稳定，已确认局域网地址可访问。
- 顾客提示表达不业务化（数值难懂）已替换为业务话术提示。
- 顾客回复重复问题已修复。

## 4. 当前风险与局限
- 企业微信工作台正式环境尚未接入 JS-SDK 语音主链路（上线前必须做）。
- 讯飞 ASR 依赖凭据配置（`XFYUN_APPID/API_KEY/API_SECRET`），未配置时会失败。
- 药店专有词识别准确率仍需用真实门店语料做评测和热词优化。

## 5. 下一步计划
1. 用真实门店语音样本做 100+ 条转写评测（药品名、会员话术、数字金额）。
2. 完成 ASR 质量对比（讯飞 vs GLM）并确定主引擎。
3. 在正式上线前接入企业微信 JS-SDK 录音主链路（当前已明确延后）。
4. 增加顾客画像库（5类典型顾客）并接入场景配置。

## 6. 运行与配置说明（当前）
- 启动命令示例：

```bash
GLM_API_KEY=xxx \
XFYUN_APPID=xxx \
XFYUN_API_KEY=xxx \
XFYUN_API_SECRET=xxx \
ASR_PROVIDER=xfyun \
node server.js
```

- 关键环境变量：
  - `GLM_API_KEY`：顾客回复/评分能力
  - `XFYUN_APPID`、`XFYUN_API_KEY`、`XFYUN_API_SECRET`：讯飞语音转写
  - `ASR_PROVIDER`：`xfyun` 或 `glm`

## 7. 协作约定（Git同步）
- 从本次起，每次代码提交到 Git 前，必须同步更新本文件（`PROGRAM.md`）：
  - 本次完成项
  - 已解决问题
  - 下一步计划
- 保证代码状态与项目进度文档一致，便于验收与回溯。
