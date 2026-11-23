# COGNIS AI 接口与业务模块映射

所有接口都在服务器的 `/api` 下；使用 JSON 请求和 JSON 响应，流式接口为 SSE。前端只能访问自行部署的服务网关，不直接调用 OpenAI。

| 业务能力 | 接口 | 前端关联 | 模型调用方式 |
|---|---|---|---|
| 服务可用性 | `GET /api/health` | 顶部 AI 连接状态、连接弹窗 | 不触发模型调用 |
| 多智能体策略选择 | `POST /api/strategy` | 原始结构化路由 | Responses JSON |
| **真实流式对话** | `POST /api/strategy/stream` | **学生端主对话** | 策略 JSON + **真正模型文本流** |
| 多角色提示 | `POST /api/stream` | 原有深入训练的学伴/方法助手/导师视角 | Responses SSE |
| 科研论证结构 | `POST /api/analyze-argument` | 主张、证据、假设、推理与未知项 | Responses JSON + 原文核验 |
| 教学追问 | `POST /api/coach` | 深入训练中的连续追问 | Responses JSON |
| 两级提示 | `POST /api/scaffold` | 方向提示、方法支架 | Responses JSON |
| 早期候选诊断 | `POST /api/diagnose` | 旧版诊断入口 | Responses JSON |
| 迁移练习生成 | `POST /api/practice-task` | 主对话的“换个问题练习” | Responses JSON |
| 深入迁移案例 | `POST /api/generate-case` | 后续训练阶段 | Responses JSON + 独立审题模型调用 |
| 回答评价 | `POST /api/evaluate` | 训练修正与迁移题 | Responses JSON |
| 历史关联检查 | `POST /api/precheck` | 历史认知问题提醒 | Responses JSON |
| 争议复核建议 | `POST /api/review` | 认知历史判定异议 | Responses JSON（非教师裁决） |
| **历史讨论梳理** | `POST /api/history-summary` | **历史探索、对话整理** | Responses JSON |
| **思考变化梳理** | `POST /api/growth-insights` | **成长回顾** | Responses JSON |
| **实践证据自查** | `POST /api/practice-review` | **科研实践记录** | Responses JSON |
| **教师参考反馈** | `POST /api/teacher-assist` | **教师工作台** | Responses JSON（教师需确认） |

### 流式策略对话协议

`POST /api/strategy/stream` 输入示例：

```json
{
  "topic": "多星协同定位是否一定更准确？",
  "researchStage": "实验",
  "currentStep": 1,
  "conversation": [
    {"role": "student", "agent": "student", "text": "我发现三星方案误差更大，还没有控制同步偏差。"}
  ]
}
```

成功响应使用 `text/event-stream`，按以下事件顺序输出：

```text
event: meta
data: {"agent":"evidence","step":2}

event: delta
data: {"text":"你目前"}

event: delta
data: {"text":"怎样做对照？"}

event: artifact
data: {"kind":"evidence","title":"待核查证据","text":"...","quote":"学生原文片段"}

event: done
data: {"ok":true}
```

`artifact` 仅在模型生成了能够回指学生真实原文的依据时出现。`event:error` 表示中断，前端不应把离线答案冒充为模型结果。

### 数据与安全限制

- 请求体最多 120 KB；对话历史、学术证据与评估条目在服务端截取有限长度，不直接无限传入模型。
- CORS 域名白名单、试用访问码、单进程按 IP 的分钟和每天限额已配置；**不是正式多租户权限系统**。
- 不把 GPT key 写到 HTML、GitHub 仓库，也不把模型输出以不安全的 HTML 注入。
- AI 反馈、成长结论与教师建议均只作为参考，不能因模型说“已掌握”就形成真实能力评级。
- 目前只支持文本，不自带真实文献检索/课程知识图谱/数据库/RAG；如后续接入课程资源，应另做权限检索与来源引用。
