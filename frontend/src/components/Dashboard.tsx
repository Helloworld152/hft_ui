import React, { useState, useEffect } from 'react';
import { LayoutDashboard, History, FileText, Activity, Send, ChevronDown, Wifi, WifiOff } from 'lucide-react';
import EquityChart from './EquityChart';
import { fetchTrades, fetchOrders, fetchPositions, placeOrder, cancelOrder, fetchAccount, fetchAccountsList, fetchAccountStatus } from '../services/api';

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [trades, setTrades] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [account, setAccount] = useState<any>({ balance: 0, available: 0, margin: 0, pnl: 0 });
  const [orderForm, setOrderForm] = useState({ symbol: '', direction: 'B', offset: 'O', price: 0, volume: 1 });
  
  const [accounts, setAccounts] = useState<string[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [accountStatuses, setAccountStatuses] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<{id: number, type: 'success' | 'error', message: string}[]>([]);

  const addNotification = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };

  const refreshData = async () => {
    if (!selectedAccount) return;
    
    // 仪表盘只显示最近10笔，历史标签页显示最近100笔
    const limit = (activeTab === 'trades' || activeTab === 'orders') ? 100 : 10;
    
    fetchTrades(limit, selectedAccount).then(data => setTrades(Array.isArray(data) ? data : [])).catch(e => console.error('Trades error', e));
    fetchOrders(limit, selectedAccount).then(data => setOrders(Array.isArray(data) ? data : [])).catch(e => console.error('Orders error', e));
    fetchPositions(selectedAccount).then(data => setPositions(Array.isArray(data) ? data : [])).catch(e => console.error('Positions error', e));
    fetchAccount(selectedAccount).then(setAccount).catch(e => console.error('Account error', e));
    fetchAccountStatus(selectedAccount).then(setAccountStatuses).catch(e => console.error('Status error', e));
  };

  useEffect(() => {
    // Initial load of accounts
    fetchAccountsList().then(list => {
      if (Array.isArray(list) && list.length > 0) {
        setAccounts(list);
        setSelectedAccount(list[0]);
      }
    }).catch(e => console.error('Accounts list error', e));
  }, []);

  useEffect(() => {
    if (selectedAccount) {
      refreshData();
      const timer = setInterval(refreshData, 3000);
      return () => clearInterval(timer);
    }
  }, [selectedAccount, activeTab]);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await placeOrder({ ...orderForm, account_id: selectedAccount });
      addNotification('报单已发送', 'success');
      refreshData();
    } catch (err) {
      addNotification('下单失败', 'error');
    }
  };

  const handleCancelOrder = async (symbol: string, clientId: string, account_id?: string) => {
    try {
      await cancelOrder({ symbol, client_id: clientId, account_id });
      addNotification('撤单请求已发送', 'success');
      refreshData();
    } catch (err) {
      addNotification('撤单失败', 'error');
    }
  };

  const formatCurrency = (val: number) => {
    if (val === undefined || val === null) return '¥0.00';
    return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(val);
  };

  const formatDateTime = (timestamp: any) => {
    if (!timestamp) return '-';
    // 处理可能的毫秒时间戳
    const date = new Date(typeof timestamp === 'number' ? timestamp : parseInt(timestamp));
    if (isNaN(date.getTime())) return timestamp.toString(); // 如果不是时间戳则返回原样
    
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).replace(/\//g, '-');
  };

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden relative">
      {/* Notifications Toast */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        {notifications.map(n => (
          <div key={n.id} className={`px-4 py-3 rounded-lg shadow-lg border text-sm font-medium animate-in fade-in slide-in-from-right-4 duration-300 ${
            n.type === 'success' ? 'bg-zinc-900 border-green-500/50 text-green-500' : 'bg-zinc-900 border-red-500/50 text-red-500'
          }`}>
            {n.message}
          </div>
        ))}
      </div>

      {/* Sidebar */}
      <aside className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col">
        <div className="p-6">
          <h1 className="text-xl font-bold text-blue-500">HFT-UI</h1>
          <div className="mt-4">
            <label className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">Account</label>
            <div className="relative">
              <select 
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 text-white text-xs rounded p-2 appearance-none outline-none focus:border-blue-500"
              >
                {accounts.length === 0 ? <option>Loading...</option> : accounts.map(acc => (
                  <option key={acc} value={acc}>{acc}</option>
                ))}
              </select>
              <div className="absolute right-2 top-2.5 pointer-events-none text-zinc-400">
                <ChevronDown size={12} />
              </div>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          {[
            { id: 'dashboard', name: '仪表盘', icon: LayoutDashboard },
            { id: 'trades', name: '成交历史', icon: History },
            { id: 'orders', name: '报单审计', icon: FileText },
            { id: 'equity', name: '权益曲线', icon: Activity },
          ].map(item => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-all ${
                activeTab === item.id ? 'bg-blue-600/10 text-blue-500' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.name}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-8">
        {activeTab === 'dashboard' && (
          <>
            <header className="flex justify-between items-center mb-8">
              <div className="flex items-center space-x-4">
                <h2 className="text-2xl font-semibold">交易概览</h2>
                <div className="flex items-center space-x-2">
                  {accountStatuses.map((s, idx) => {
                    const isOnline = s.code === '0' || s.code === '3';
                    return (
                      <div key={idx} className={`flex items-center space-x-1 px-2 py-1 rounded text-[10px] border ${isOnline ? 'bg-green-500/10 border-green-500/50 text-green-500' : 'bg-red-500/10 border-red-500/50 text-red-500'}`} title={s.msg}>
                        {isOnline ? <Wifi size={10} /> : <WifiOff size={10} />}
                        <span>{s.source}: {isOnline ? '在线' : '离线'} ({s.code})</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="flex items-center space-x-2 bg-zinc-900 px-3 py-1.5 rounded-full border border-zinc-800">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-[10px] text-zinc-400 font-bold uppercase">Engine Online</span>
              </div>
            </header>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
                <p className="text-zinc-500 text-xs uppercase mb-1">当日盈亏</p>
                <p className={`text-2xl font-bold ${account.pnl >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {account.pnl >= 0 ? '+' : ''}{formatCurrency(account.pnl)}
                </p>
              </div>
              <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
                <p className="text-zinc-500 text-xs uppercase mb-1">账户权益</p>
                <p className="text-2xl font-bold">{formatCurrency(account.balance)}</p>
              </div>
              <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
                <p className="text-zinc-500 text-xs uppercase mb-1">可用资金</p>
                <p className="text-2xl font-bold text-blue-400">{formatCurrency(account.available)}</p>
              </div>
              <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
                <p className="text-zinc-500 text-xs uppercase mb-1">占用保证金</p>
                <p className="text-2xl font-bold text-orange-400">{formatCurrency(account.margin)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8">
              {/* Quick Trade */}
              <div className="lg:col-span-1 bg-zinc-900 p-6 rounded-xl border border-zinc-800">
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                  <Send size={18} /> 快捷下单
                </h3>
                <form onSubmit={handlePlaceOrder} className="space-y-4">
                  <div>
                    <label className="block text-[10px] text-zinc-500 mb-1 uppercase">合约代码</label>
                    <input 
                      className="w-full bg-black border border-zinc-800 rounded p-2 text-sm focus:border-blue-500 outline-none" 
                      value={orderForm.symbol} 
                      onChange={e => setOrderForm({...orderForm, symbol: e.target.value})}
                      placeholder="e.g. ag2606"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setOrderForm({...orderForm, direction: 'B'})}
                      className={`flex-1 p-2 rounded text-xs font-bold ${orderForm.direction === 'B' ? 'bg-red-600' : 'bg-zinc-800 text-zinc-500'}`}>买入</button>
                    <button type="button" onClick={() => setOrderForm({...orderForm, direction: 'S'})}
                      className={`flex-1 p-2 rounded text-xs font-bold ${orderForm.direction === 'S' ? 'bg-green-600' : 'bg-zinc-800 text-zinc-500'}`}>卖出</button>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setOrderForm({...orderForm, offset: 'O'})}
                      className={`flex-1 p-1.5 rounded text-[10px] border ${orderForm.offset === 'O' ? 'border-blue-500 text-blue-500' : 'border-transparent bg-zinc-800'}`}>开仓</button>
                    <button type="button" onClick={() => setOrderForm({...orderForm, offset: 'C'})}
                      className={`flex-1 p-1.5 rounded text-[10px] border ${orderForm.offset === 'C' ? 'border-blue-500 text-blue-500' : 'border-transparent bg-zinc-800'}`}>平仓</button>
                    <button type="button" onClick={() => setOrderForm({...orderForm, offset: 'T'})}
                      className={`flex-1 p-1.5 rounded text-[10px] border ${orderForm.offset === 'T' ? 'border-blue-500 text-blue-500' : 'border-transparent bg-zinc-800'}`}>平今</button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] text-zinc-500 mb-1 uppercase">价格</label>
                      <input type="number" step="0.001" className="w-full bg-black border border-zinc-800 rounded p-2 text-sm" 
                        value={orderForm.price} onChange={e => setOrderForm({...orderForm, price: parseFloat(e.target.value)})}/>
                    </div>
                    <div>
                      <label className="block text-[10px] text-zinc-500 mb-1 uppercase">数量</label>
                      <input type="number" className="w-full bg-black border border-zinc-800 rounded p-2 text-sm" 
                        value={orderForm.volume} onChange={e => setOrderForm({...orderForm, volume: parseInt(e.target.value)})}/>
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-bold text-sm transition-all mt-2">
                    确认报单
                  </button>
                </form>
              </div>

              {/* Positions */}
              <div className="lg:col-span-3 bg-zinc-900 p-6 rounded-xl border border-zinc-800">
                <h3 className="text-lg font-medium mb-4">实时持仓</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-zinc-500 border-b border-zinc-800">
                        <th className="text-left py-2">合约</th>
                        <th className="text-right py-2">方向</th>
                        <th className="text-right py-2">总仓</th>
                        <th className="text-right py-2">今/昨</th>
                        <th className="text-right py-2">均价</th>
                        <th className="text-right py-2">盈亏</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                      {positions.length === 0 ? (
                        <tr><td colSpan={6} className="py-8 text-center text-zinc-600">暂无持仓</td></tr>
                      ) : positions.flatMap((pos, idx) => {
                        const rows = [];
                        if (pos.long_total > 0) {
                          rows.push(
                            <tr key={`${idx}-l`} className="hover:bg-zinc-800/30">
                              <td className="py-2.5 font-bold text-blue-400">{pos.symbol}</td>
                              <td className="text-right text-red-500 font-bold">多</td>
                              <td className="text-right font-mono">{pos.long_total}</td>
                              <td className="text-right text-[10px] text-zinc-500 font-mono">{pos.long_td}/{pos.long_yd}</td>
                              <td className="text-right font-mono text-zinc-400">{pos.long_price?.toFixed(3) || '-'}</td>
                              <td className={`text-right font-bold font-mono ${pos.long_pnl >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                                {pos.long_pnl?.toFixed(2)}
                              </td>
                            </tr>
                          );
                        }
                        if (pos.short_total > 0) {
                          rows.push(
                            <tr key={`${idx}-s`} className="hover:bg-zinc-800/30">
                              <td className="py-2.5 font-bold text-blue-400">{pos.symbol}</td>
                              <td className="text-right text-green-500 font-bold">空</td>
                              <td className="text-right font-mono">{pos.short_total}</td>
                              <td className="text-right text-[10px] text-zinc-500 font-mono">{pos.short_td}/{pos.short_yd}</td>
                              <td className="text-right font-mono text-zinc-400">{pos.short_price?.toFixed(3) || '-'}</td>
                              <td className={`text-right font-bold font-mono ${pos.short_pnl >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                                {pos.short_pnl?.toFixed(2)}
                              </td>
                            </tr>
                          );
                        }
                        return rows;
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Dashboard Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Orders */}
              <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">最新报单</h3>
                  <button onClick={() => setActiveTab('orders')} className="text-blue-500 text-xs hover:underline">查看全部</button>
                </div>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-zinc-500 border-b border-zinc-800">
                      <th className="text-left py-2">ID</th>
                      <th className="text-left py-2">合约</th>
                      <th className="text-center py-2">操作</th>
                      <th className="text-right py-2">价格</th>
                      <th className="text-right py-2">数量</th>
                      <th className="text-right py-2">状态</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {orders.slice(0, 10).map((o, i) => (
                      <tr key={i} className="hover:bg-zinc-800/20">
                        <td className="py-2 font-mono text-zinc-500">{o.client_id}</td>
                        <td className="py-2 font-bold">{o.symbol}</td>
                        <td className={`py-2 text-center font-bold ${o.direction === 'B' ? 'text-red-500' : 'text-green-500'}`}>
                          {o.direction === 'B' ? '买' : '卖'}{o.offset === 'O' ? '开' : o.offset === 'T' ? '平今' : '平'}
                        </td>
                        <td className="py-2 text-right font-mono">{o.limit_price !== undefined ? parseFloat(Number(o.limit_price).toFixed(3)) : '-'}</td>
                        <td className="py-2 text-right font-mono text-zinc-400">{o.volume_traded}/{o.volume_total}</td>
                        <td className="py-2 text-right font-bold text-[10px]">
                          {o.status === '0' ? <span className="text-green-500">已成交</span> : 
                           o.status === '3' ? <span className="text-blue-400">已报入</span> :
                           o.status === '5' ? <span className="text-zinc-500">已撤单</span> : 
                           <span className="text-orange-500">待成交</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Recent Trades */}
              <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">最新成交</h3>
                  <button onClick={() => setActiveTab('trades')} className="text-blue-500 text-xs hover:underline">查看全部</button>
                </div>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-zinc-500 border-b border-zinc-800">
                      <th className="text-left py-2">时间</th>
                      <th className="text-left py-2">合约</th>
                      <th className="text-center py-2">操作</th>
                      <th className="text-right py-2">价格</th>
                      <th className="text-right py-2">数量</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {trades.slice(0, 10).map((t, i) => (
                      <tr key={i} className="hover:bg-zinc-800/20">
                        <td className="py-2 text-zinc-500 font-mono text-[10px]">{formatDateTime(t.trade_time)}</td>
                        <td className="py-2 font-bold">{t.symbol}</td>
                        <td className={`py-2 text-center font-bold ${t.direction === 'B' ? 'text-red-500' : 'text-green-500'}`}>
                          {t.direction === 'B' ? '买' : '卖'}{t.offset === 'O' ? '开' : t.offset === 'T' ? '平今' : '平'}
                        </td>
                        <td className="py-2 text-right font-mono">{t.price !== undefined ? parseFloat(Number(t.price).toFixed(3)) : '-'}</td>
                        <td className="py-2 text-right font-mono">{t.volume}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === 'equity' && (
          <div className="h-full flex flex-col">
            <header className="mb-8 text-2xl font-semibold">权益分析</header>
            <div className="flex-1 bg-zinc-900 p-8 rounded-2xl border border-zinc-800 min-h-[500px]">
               <EquityChart accountId={selectedAccount} />
            </div>
          </div>
        )}

        {activeTab === 'trades' && (
          <div>
            <header className="mb-8 text-2xl font-semibold">历史成交</header>
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
               <table className="w-full text-sm">
                  <thead className="bg-zinc-800 text-zinc-400">
                    <tr>
                      <th className="p-4 text-left">成交时间</th>
                      <th className="p-4 text-left">合约</th>
                      <th className="p-4 text-center">操作</th>
                      <th className="p-4 text-right">成交价</th>
                      <th className="p-4 text-right">数量</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {trades.map((t, i) => (
                      <tr key={i} className="hover:bg-zinc-800/50">
                        <td className="p-4 text-zinc-500 font-mono text-xs">{formatDateTime(t.trade_time)}</td>
                        <td className="p-4 font-bold">{t.symbol}</td>
                        <td className={`p-4 text-center font-bold ${t.direction === 'B' ? 'text-red-500' : 'text-green-500'}`}>
                          {t.direction === 'B' ? '买' : '卖'}{t.offset === 'O' ? '开' : t.offset === 'T' ? '平今' : '平'}
                        </td>
                        <td className="p-4 text-right font-mono">{t.price !== undefined ? parseFloat(Number(t.price).toFixed(3)) : '-'}</td>
                        <td className="p-4 text-right font-mono">{t.volume}</td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div>
            <header className="mb-8 text-2xl font-semibold">报单审计</header>
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
               <table className="w-full text-sm">
                  <thead className="bg-zinc-800 text-zinc-400">
                    <tr>
                      <th className="p-4 text-left">委托时间</th>
                      <th className="p-4 text-left">Client ID</th>
                      <th className="p-4 text-left">合约</th>
                      <th className="p-4 text-center">操作</th>
                      <th className="p-4 text-right">委托价格</th>
                      <th className="p-4 text-right">数量</th>
                      <th className="p-4 text-right">状态</th>
                      <th className="p-4 text-left">备注</th>
                      <th className="p-4 text-center">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {orders.map((o, i) => (
                      <tr key={i} className="hover:bg-zinc-800/50">
                        <td className="p-4 text-zinc-500 font-mono text-xs">{formatDateTime(o.insert_time)}</td>
                        <td className="p-4 text-xs font-mono">{o.client_id}</td>
                        <td className="p-4 font-bold">{o.symbol}</td>
                        <td className={`p-4 text-center font-bold ${o.direction === 'B' ? 'text-red-500' : 'text-green-500'}`}>
                          {o.direction === 'B' ? '买' : '卖'}{o.offset === 'O' ? '开' : o.offset === 'T' ? '平今' : '平'}
                        </td>
                        <td className="p-4 text-right font-mono">{o.limit_price !== undefined ? parseFloat(Number(o.limit_price).toFixed(3)) : '-'}</td>
                        <td className="p-4 text-right font-mono text-zinc-400">{o.volume_traded}/{o.volume_total}</td>
                        <td className="p-4 text-right uppercase text-[10px] font-bold">
                          {o.status === '0' ? 'Done' : o.status === '3' ? 'Sent' : o.status === '5' ? 'Canceled' : 'Pending'}
                        </td>
                        <td className="p-4 text-zinc-500 text-xs italic">{o.msg}</td>
                        <td className="p-4 text-center">
                          {['0', '5'].includes(o.status) ? (
                            <span className="text-zinc-600 text-xs">-</span>
                          ) : (
                            <button 
                              onClick={() => handleCancelOrder(o.symbol, o.client_id, o.account_id)}
                              className="text-red-500 hover:text-red-400 text-xs underline"
                            >
                              撤单
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
