# COGNIS V9 · GitHub Pages + OpenAI Responses API

这一版已完成可部署的前端、Node.js 网关、OpenAI Responses API、结构化输出、SSE 流式对话、业务模块映射和受控试用保护。仓库不包含任何真实密钥；只有在云平台 Secret 中设置 `OPENAI_API_KEY` 后才会发起收费模型调用。

2026-11-23 审查后已增加：生产环境默认强制访问码、代理 IP 识别、分钟/每日/并发三层限制、安全响应头、模型超时与上游错误分类、连接地址严格校验，以及 AI 失败后明确切换离线标识。

## 文件组成

- `index.html`：V8.11 学生端原型保留原有页面与功能，新增模型连接弹窗、流式策略对话、历史/成长/实践/教师端 AI 辅助入口。
- `server.mjs`：Node.js 20+ 后端，调用 OpenAI **Responses API**，密钥仅通过服务器环境变量获取。无第三方运行时依赖。
- `API_CONTRACT.md`：各任务接口、输入输出与模型接入映射。
- `DEPLOY_GITHUB_PAGES.md`：GitHub Pages + Render 的逐步部署指南。
- `.env.example`：服务器环境变量模板，**不是实际密钥文件**。
- `render.yaml`：Render Blueprint 可选配置。
- `tests/`：模拟 OpenAI 接口和自动化联调脚本。
- `.nojekyll`：GitHub Pages 禁止 Jekyll 处理。

## 先看本地演示

双击 `index.html`，在没有模型服务时可以保留离线样例体验。默认首页仍然是“怎么使用 / 开始探索 / 历史探索 / 成长回顾”。

在有模型服务的情况下，网页点击导航状态 “**离线演示 · 点击连接 AI**” 或首页/对话的 “**更多 → 连接 AI 服务**”，填写 **后端 URL**，例如 `https://your-api.onrender.com`。不要填 `https://api.openai.com`，也不要把 GPT 密钥写入这个页面。

## 本地真 API 开发

```bash
# 终端中仅在本机设置（切勿提交）
export OPENAI_API_KEY='你的真实密钥'
export OPENAI_MODEL='你有权限使用的模型 ID'
export CORS_ALLOWED_ORIGINS='http://localhost:3000'
export DEMO_ACCESS_CODE='仅分享给测试者的长随机字符串'
node server.mjs
```

浏览器访问 `http://localhost:3000`。这时前端与后端同域，默认无需填写服务地址。可以调用真实模型。当前模型默认配置为 `gpt-4.1-mini`，可修改为自己项目中支持 Responses API 的型号。

## 线上架构

```
学生/教师浏览器
     │ 访问静态 HTML/CSS/JS
     ▼
 GitHub Pages (https://用户名.github.io/仓库/)
     │ HTTPS POST（只发送必要的用户记录，不包含 GPT 密钥）
     ▼
 Node.js API 网关（Render 等支持 Node 的平台）
     │ 服务器环境变量 OPENAI_API_KEY
     ▼
 OpenAI Responses API
```

**GitHub Pages 不运行后端。** 必须另行部署 Node 服务器。请参考 `DEPLOY_GITHUB_PAGES.md`。

## 重要产品边界

1. **个人讨论记录仍保存在当前浏览器 localStorage**。这是科研训练原型，跨设备同步、账号体系、学生身份鉴别、真实教师审核必须后续实现。
2. 模型返回的“论证证据、知识缺口、实践建议、成长变化”是辅助建议，不能自动视为已证实的实验成果或课程掌握证明。
3. 老师工作台上的 AI 反馈属于可编辑草稿，不代表真实教师已批准。
4. 浏览器端不会收集或显示 GPT API 密钥；后端也不将其回传。
5. **生产环境默认要求 `DEMO_ACCESS_CODE`**。只有已在外部配置正式认证与配额网关时，才可显式设置 `ALLOW_PUBLIC_API=1`。访问码仍不能代替正式账号认证与分布式限流。
6. 不要未经同意上传保密课题、未发表论文、含个人信息的实验材料。模型提供者会收到用于完成请求的内容；请按学校数据管理要求评估。
7. 本次没有真实 OpenAI 账户密钥，测试通过的是模拟 OpenAI Responses API 的端到端调用，不代表真实供应商已验证。

## 测试

```bash
npm test
```

测试会自动启动本地模拟 Responses API 与 COGNIS 网关，验证流式、结构化、综合分析、CORS、访问码及错误保护，不产生模型费用。浏览器测试在 `tests/test_browser.py` 中，按需运行。

**本地文件注意：** `file://` 双击打开仅保证离线体验；生产网关默认拒绝来源为 `null` 的跨域请求。测试真实 GPT 时请从 `http://localhost:3000` 或正式的 HTTPS GitHub Pages 页面访问，不要为正式部署设置 `ALLOW_LOCAL_FILE=1`。
