# HFT-UI

C++ 交易引擎 (hft_eb) 的可视化与数据持久化中台。

## 架构

- **C++ Engine**：极速交易执行
- **Python Backend (FastAPI)**：与引擎通信、数据清洗入库、REST API
- **MongoDB**：成交、报单、权益快照
- **React Frontend**：暗黑仪表盘、实时行情与下单

技术栈：FastAPI / Motor / WebSockets | React 18 / Vite / Tailwind / Recharts

## 环境要求

- Python 3.12+
- Node.js 18+
- MongoDB 6.0+

## 快速启动

### 1. 后端

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

在 `backend/app/core/config.json` 中配置（可参考以下示例新建）：

```json
{
  "PROJECT_NAME": "HFT-UI",
  "MONGODB_URL": "mongodb://localhost:27017",
  "DATABASE_NAME": "hft_db",
  "ENGINE_WS_URL": "ws://localhost:8877"
}
```

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8866
```

### 2. 前端

```bash
cd frontend
npm install
npm run dev
```

### 3. 一键启动（生产模式）

```bash
./dev.sh
```

后端：8866 | 前端：5173

## API

- `GET /api/trades` - 成交历史
- `GET /api/orders` - 报单审计
- `GET /api/equity` - 权益曲线
- `GET /api/positions` - 持仓
- `GET /api/account` - 账户信息

## 其他脚本

- `check_db.py` - 数据库检查
- `clean_db.py` - 清理数据库
- `clean_default.py` - 清理默认数据
