import { useState } from 'react';
import type { FormEvent } from 'react';
import type { Order, FileData } from '../types';

const API_URL = 'https://caps-mbmi.onrender.com';

export default function TrackOrder() {
  const [orderNumber, setOrderNumber] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTrack = async (e: FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim()) return;

    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/orders/${orderNumber.toUpperCase()}`);
      if (!res.ok) {
        throw new Error('Order not found');
      }
      const data = await res.json();
      setOrder(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch order');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Waiting': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Ready to Print': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Printing': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Printed': return 'bg-green-100 text-green-700 border-green-200';
      case 'Failed': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="glass-panel p-8 rounded-3xl text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Track Your Order</h2>
        <p className="text-slate-500 text-sm mb-6">Enter the 6-character order number you received after submission.</p>
        
        <form onSubmit={handleTrack} className="flex max-w-md mx-auto gap-3">
          <input 
            type="text" 
            placeholder="e.g. A7X9K2"
            value={orderNumber}
            onChange={e => setOrderNumber(e.target.value.toUpperCase())}
            maxLength={6}
            className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-center text-xl font-mono font-bold text-slate-700 uppercase tracking-widest focus:ring-2 focus:ring-brand-500 outline-none placeholder:font-sans placeholder:text-base placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400"
          />
          <button 
            type="submit"
            disabled={loading || orderNumber.length < 6}
            className="bg-brand-600 hover:bg-brand-700 disabled:bg-slate-300 text-white font-medium px-6 py-3 rounded-xl transition-colors shadow-lg shadow-brand-500/30"
          >
            {loading ? '...' : 'Track'}
          </button>
        </form>
        {error && <p className="text-red-500 mt-4 text-sm font-medium">{error}</p>}
      </div>

      {order && (
        <div className="glass-panel p-8 rounded-3xl animate-slide-up">
          <div className="flex items-center justify-between border-b border-slate-100 pb-6 mb-6">
            <div>
              <p className="text-sm text-slate-500 mb-1">Order Number</p>
              <h3 className="text-2xl font-bold font-mono text-slate-800">{order.orderNumber}</h3>
            </div>
            <div className={`px-4 py-2 rounded-full border text-sm font-bold shadow-sm ${getStatusColor(order.status)}`}>
              {order.status}
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Print Settings</h4>
              <ul className="space-y-3">
                <li className="flex justify-between">
                  <span className="text-slate-500">Paper Size</span>
                  <span className="font-medium text-slate-700">{order.settings?.paperSize || (order as any).paperSize}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-500">Color Mode</span>
                  <span className="font-medium text-slate-700">{order.settings?.colorMode || (order as any).colorMode}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-500">Copies</span>
                  <span className="font-medium text-slate-700">{order.settings?.copies || (order as any).copies}</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Files ({order.files?.length || 0})</h4>
              <ul className="space-y-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                {order.files?.map((f: FileData) => (
                  <li key={f.id} className="text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded-lg truncate border border-slate-100">
                    {f.originalName}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
