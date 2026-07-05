import { useState, useEffect } from 'react';
import type { Order, FileData } from '../types';

const API_URL = 'https://caps-mbmi.onrender.com';

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API_URL}/api/orders`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (error) {
      console.error('Failed to fetch orders', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteOrder = async (id: string) => {
    if (!confirm('Are you sure you want to delete this order?')) return;
    try {
      await fetch(`${API_URL}/api/orders/${id}`, { method: 'DELETE' });
      fetchOrders();
    } catch (error) {
      alert('Failed to delete order');
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await fetch(`${API_URL}/api/orders/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      fetchOrders();
    } catch (error) {
      alert('Failed to update status');
    }
  };

  if (loading) return <div className="text-center py-20 text-slate-500">Loading orders...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Admin Dashboard</h2>
        <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100 text-sm font-medium text-slate-600">
          Total Orders: <span className="text-brand-600 ml-1">{orders.length}</span>
        </div>
      </div>

      <div className="glass-panel rounded-3xl overflow-hidden shadow-xl border border-white/40">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/60 text-slate-500 text-xs uppercase tracking-wider">
                <th className="p-4 font-semibold">Order</th>
                <th className="p-4 font-semibold">Date</th>
                <th className="p-4 font-semibold">Settings</th>
                <th className="p-4 font-semibold">Files</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/50">
              {orders.map(order => (
                <tr key={order.id} className="hover:bg-white/40 transition-colors">
                  <td className="p-4">
                    <p className="font-mono font-bold text-slate-800 text-lg">{order.orderNumber}</p>
                    {order.customerDetails && <p className="text-xs text-slate-500 mt-1">{order.customerDetails}</p>}
                  </td>
                  <td className="p-4 text-sm text-slate-600">
                    {new Date(order.createdAt).toLocaleString()}
                  </td>
                  <td className="p-4">
                    <div className="text-sm">
                      <span className="font-medium text-slate-700">{(order as any).paperSize}</span> &bull; {(order as any).colorMode}
                      <p className="text-xs text-slate-500 mt-1">Copies: {(order as any).copies}</p>
                      {(order as any).instructions && <p className="text-xs text-brand-600 mt-1 italic max-w-xs truncate">"{(order as any).instructions}"</p>}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex -space-x-2">
                      {order.files?.map((f: FileData, i: number) => (
                        <div key={i} className="w-8 h-8 rounded-lg bg-indigo-100 border-2 border-white flex items-center justify-center text-xs font-bold text-indigo-600" title={f.originalName}>
                          {f.originalName.split('.').pop()?.toUpperCase()}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="p-4">
                    <select 
                      value={order.status}
                      onChange={e => updateStatus(order.id, e.target.value)}
                      className="bg-white border border-slate-200 text-sm rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-brand-500 font-medium text-slate-700"
                    >
                      <option value="Waiting">Waiting</option>
                      <option value="Ready to Print">Ready to Print</option>
                      <option value="Printing">Printing</option>
                      <option value="Printed">Printed</option>
                      <option value="Failed">Failed</option>
                    </select>
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => deleteOrder(order.id)}
                      className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                      title="Delete Order"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
