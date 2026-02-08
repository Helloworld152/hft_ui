# HFT-UI 交易中台与可视化系统

## 1. 系统架构 (Architecture)

本系统作为 C++ 交易引擎 (hft_eb) 的可视化与数据持久化外挂，采用三层架构：

- **C++ Engine**: 负责极速交易执行，不负责数据持久化。
- **Python Backend (FastAPI)**:
    - **Gateway**: 维护与 C++ 引擎的长连接，转发指令。
    - **Data Pipeline**: 将流式数据（Tick, Trade, Order）清洗并存入数据库。
    - **API Layer**: 为前端提供状态查询与实时推送。
- **MongoDB**: 存储历史成交、报单审计日志及权益曲线快照。
- **React Frontend**: 暗黑模式仪表盘，实时行情与快捷下单。

## 2. 数据存储设计 (MongoDB Collections)
2
### 2.1 trades (成交历史)
- symbol: string
- direction: char ('B'/'S')
- offset: char ('O'/'C'/'T')
- price: double
- volume: int
- trade_time: datetime
- order_ref: string

### 2.2 orders (报单审计)
- order_ref: string (Unique Index)
- symbol: string
- status: char
- limit_price: double
- volume_total: int
- volume_traded: int
- insert_time: datetime

### 2.3 equity_snapshots (权益曲线)
- timestamp: datetime
- total_pnl: double
- positions: array

## 3. 技术栈 (Technology Stack)

- 后端: FastAPI, WebSockets, Motor (MongoDB Async Driver)
- 前端: React 18, Vite, Tailwind CSS, Recharts
- 数据库: MongoDB 6.0+
