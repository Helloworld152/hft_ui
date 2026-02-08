# HFT-UI 任务进度表

## ✅ 已完成
- [x] 后端 FastAPI 基础骨架搭建
- [x] MongoDB 异步驱动配置与数据建模
- [x] 前端 Vite + React 19 + TypeScript 初始化
- [x] Tailwind CSS v4 配置与暗黑模式基础样式
- [x] 仪表盘核心布局与权益曲线图表组件
- [x] 前端 API 请求封装
- [x] 多账户支持 (后端模型、API、前端适配)
- [x] 完善报单撤单功能 (支持 account_id)

## 🛠 待办事项
- [ ] **WebSocket 实时推送**：目前前端使用轮询，需打通后端到前端的 WebSocket 转发。
- [ ] **MongoDB 索引优化**：为 `client_id` 和 `timestamp` 添加索引。
- [ ] **前端路由**：实现成交历史和报单审计的独立页面。
- [ ] **环境变量配置**：完善 `.env` 文件处理后端 URL 和数据库连接串。
- [ ] **部署方案**：编写 Dockerfile 和 docker-compose.yml。

## ⚠️ 发现的问题
- 前端 React 19 与某些旧版依赖可能存在兼容性隐患，需持续观察。
- 尚未实现用户认证（如果需要公网访问，这是必须的）。