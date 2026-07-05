import { useState } from 'react';
import UploadForm from './components/UploadForm';
import TrackOrder from './components/TrackOrder';
import AdminDashboard from './components/AdminDashboard';

function App() {
  const [currentView, setCurrentView] = useState<'upload' | 'track' | 'admin'>('upload');

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-slate-50">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-200/50 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-200/50 rounded-full blur-3xl" />

      <header className="relative z-10 glass-panel border-b border-white/40 sticky top-0">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentView('upload')}>
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-brand-500/30">
              P
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-600 to-indigo-600">
              PrintCloud
            </h1>
          </div>
          <nav className="flex gap-4">
            <button 
              onClick={() => setCurrentView('upload')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${currentView === 'upload' ? 'bg-white shadow-md text-brand-600' : 'text-slate-600 hover:bg-white/50'}`}
            >
              New Order
            </button>
            <button 
              onClick={() => setCurrentView('track')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${currentView === 'track' ? 'bg-white shadow-md text-brand-600' : 'text-slate-600 hover:bg-white/50'}`}
            >
              Track Order
            </button>
            <button 
              onClick={() => setCurrentView('admin')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${currentView === 'admin' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-600 hover:bg-white/50'}`}
            >
              Admin
            </button>
          </nav>
        </div>
      </header>

      <main className="relative z-10 flex-grow max-w-6xl mx-auto w-full px-4 py-8">
        {currentView === 'upload' && <UploadForm onOrderSubmitted={() => setCurrentView('track')} />}
        {currentView === 'track' && <TrackOrder />}
        {currentView === 'admin' && <AdminDashboard />}
      </main>
      
      <footer className="relative z-10 text-center py-6 text-slate-500 text-sm">
        &copy; {new Date().getFullYear()} PrintCloud System. All rights reserved.
      </footer>
    </div>
  );
}

export default App;
