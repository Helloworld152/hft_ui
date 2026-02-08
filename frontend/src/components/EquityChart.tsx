import React, { useEffect, useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { fetchEquityHistory } from '../services/api';

interface EquityChartProps {
  accountId?: string;
}

const EquityChart: React.FC<EquityChartProps> = ({ accountId }) => {
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const data = await fetchEquityHistory(100, accountId);
        if (Array.isArray(data)) {
          // 转换数据格式供图表使用
          const formatted = data.map(d => ({
            time: new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            balance: d.balance,
            fullTime: new Date(d.timestamp).toLocaleString()
          }));
          setHistory(formatted);
        }
      } catch (err) {
        console.error('Failed to load equity history', err);
      }
    };

    loadHistory();
    const timer = setInterval(loadHistory, 10000); // 10秒刷新一次曲线
    return () => clearInterval(timer);
  }, [accountId]);

  return (
    <div className="w-full h-full min-h-[250px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={history}>
          <defs>
            <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
          <XAxis 
            dataKey="time" 
            stroke="#71717a" 
            fontSize={10} 
            tickLine={false} 
            axisLine={false} 
          />
          <YAxis 
            stroke="#71717a" 
            fontSize={10} 
            tickLine={false} 
            axisLine={false}
            domain={['auto', 'auto']}
            tickFormatter={(value) => `${(value / 10000).toFixed(1)}w`}
          />
          <Tooltip 
            labelStyle={{ color: '#71717a' }}
            contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
            itemStyle={{ color: '#3b82f6' }}
            labelFormatter={(_, payload) => payload[0]?.payload?.fullTime}
          />
          <Area 
            type="monotone" 
            dataKey="balance" 
            stroke="#3b82f6" 
            fillOpacity={1} 
            fill="url(#colorBalance)" 
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default EquityChart;