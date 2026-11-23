# COGNIS 部署教程：GitHub Pages + GPT API

> **不要把 `OPENAI_API_KEY` 放到 HTML、浏览器 localStorage、GitHub Secrets 后再让浏览器直接发给 OpenAI**。GitHub Pages 是静态托管，任何前端内容都可以被访客读取。

## 第一步：发布静态网页

1. 在 GitHub 创建一个新仓库，例如 `cognis-research`。
2. 将本包的 `index.html` 和 `.nojekyll` 放在仓库根目录；也可以将整个源码包上传（不要上传 `.env`）。
3. 在仓库 **Settings → Pages**，选择 **Deploy from a branch → main → /(root)**，保存。
4. GitHub Pages 发布成功后，得到类似 `https://YOUR_USERNAME.github.io/cognis-research/` 的地址。这个 URL 后面的仓库名称不会影响 JS 资源，因为 HTML 已包含主要图片。

## 第二步：部署后端（Node.js）

以下以支持 Node.js 的托管平台为例，Render 是其中一种选项：

1. 在 Render 创建一个 Web Service，连接刚才的 GitHub 仓库。
2. Runtime 选择 Node.js，Start Command 设为 `node server.mjs`。本项目无必须安装的 NPM 依赖。
3. 在服务环境变量中填写以下值：

| 变量 | 示例及说明 |
|---|---|
| `OPENAI_API_KEY` | 真实 OpenAI 平台密钥，仅填写到部署服务的 Secrets/Environment |
| `OPENAI_MODEL` | 你实际有权限使用的 Responses API 模型，例如 `gpt-4.1-mini` |
| `CORS_ALLOWED_ORIGINS` | `https://YOUR_USERNAME.github.io`。**只含协议 + 域名，不含仓库名路径** |
| `DEMO_ACCESS_CODE` | 试用访问码，建议启用并私下分享，切勿写到仓库源码 |
| `DAILY_REQUEST_LIMIT` | 单 IP 在当前进程内每天最多调用次数，例如 120；此机制不是分布式强认证 |
| `MINUTE_REQUEST_LIMIT` | 单 IP 每分钟请求上限，建议 30 |
| `MAX_CONCURRENT_REQUESTS` | 单实例并发模型调用上限，建议 4 |
| `TRUST_PROXY` | Render 等反向代理平台设为 `1`，用于按真实客户端 IP 限流 |
| `OPENAI_BASE_URL` | 不填时默认 `https://api.openai.com/v1` |
| `HOST` | `0.0.0.0` |

4. 部署后测试 `https://your-service.onrender.com/api/health`，若 `aiReady:true` 表示服务端具备模型调用条件。`authVerified:false` 表示尚未提供或未验证试用码，不代表模型失效。
5. 请在 OpenAI 平台设置项目费用预算与可用额度，监测计费。ChatGPT 订阅和 API 计费是不同服务。

## 第三步：在 GitHub Pages 连接

1. 打开 GitHub Pages 公开网页，选择 **更多 → 连接 AI 服务**（或桌面端点击顶部状态）。
2. 在 **AI 服务地址** 中填写 `https://your-service.onrender.com`，只填域名，不加 `/api`。
3. 如果后端设置了 `DEMO_ACCESS_CODE`，在访问码输入框填写它。该输入框**不是 GPT 密钥输入框**。
4. 点击 **保存并测试连接**。看到 “服务已连接” 后，点击 **开始探索** 输入真实问题。
5. 先试三种不同输入：“我还没确定研究问题”“实验结果与预期相反”“我准备设计对照实验”，验证不同 AI 角色、追问内容均由模型生成。

## 常见问题

- **网页正常但只出现预设答复**：确认顶部是“AI 已连接”；检查配置的 URL 和服务端 `aiReady`。
- **403**：GitHub Pages 的 Origin 没有加入 `CORS_ALLOWED_ORIGINS`，或者设置成带仓库路径的 URL。
- **401**：后端启用了体验码，但浏览器没有填写正确的访问码。
- **429**：触发网关限流/当天限额，或模型厂商的额度限制。
- **503**：后端缺少密钥/模型，生产环境没有配置访问码，或服务没有部署成功。
- **AI 断线**：当前页面会明确提示失败，不会把离线模板伪装成真实模型回答。
- **GitHub Pages 与本机数据不互通**：目前记录保存在每台设备的浏览器里。跨设备需要正式的用户账号与数据库。
- **部分长回答未完成**：可能是网络中断、输出上限或模型提供者返回错误。前端会提示重试。

## 公开开放前的必做项

在没有正式用户认证、访问额度、持久化数据库、日志脱敏和数据安全评估之前，请将本系统作为**限制人数的公开可访问体验**，不要向无限量公众开放付费模型调用。`DEMO_ACCESS_CODE` 属于可共享的试用访问码，并不是安全的正式登录系统。

**本地文件注意：** `file://` 双击打开仅保证离线体验；生产网关默认拒绝来源为 `null` 的跨域请求。测试真实 GPT 时请从 `http://localhost:3000` 或正式的 HTTPS GitHub Pages 页面访问，不要为正式部署设置 `ALLOW_LOCAL_FILE=1`。
