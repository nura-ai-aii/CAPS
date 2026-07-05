import { useState, useRef, ChangeEvent, FormEvent } from 'react';

const PAPER_SIZES = ['Passport Size', '4x6', '5x7', 'A5', 'A4', 'Letter', 'Legal', 'Custom'];

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default function UploadForm({ onOrderSubmitted }: { onOrderSubmitted: () => void }) {
  const [files, setFiles] = useState<File[]>([]);
  const [paperSize, setPaperSize] = useState('A4');
  const [colorMode, setColorMode] = useState('Color');
  const [copies, setCopies] = useState(1);
  const [instructions, setInstructions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files as FileList)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (files.length === 0) return alert('Please upload at least one file.');
    
    setIsSubmitting(true);
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    formData.append('paperSize', paperSize);
    formData.append('colorMode', colorMode);
    formData.append('copies', copies.toString());
    formData.append('instructions', instructions);

    try {
      const res = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setOrderNumber(data.orderNumber);
      } else {
        alert('Error: ' + data.error);
      }
    } catch (err) {
      alert('Failed to connect to the server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (orderNumber) {
    return (
      <div className="glass-panel p-8 rounded-2xl max-w-lg mx-auto text-center animate-fade-in">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Order Submitted!</h2>
        <p className="text-slate-600 mb-6">Your order has been sent directly to our printing queue.</p>
        <div className="bg-slate-100 p-4 rounded-xl mb-6">
          <p className="text-sm text-slate-500 mb-1">Your Order Number</p>
          <p className="text-3xl font-mono font-bold text-brand-600 tracking-wider">{orderNumber}</p>
        </div>
        <button 
          onClick={onOrderSubmitted}
          className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-3 rounded-xl transition-colors shadow-lg shadow-brand-500/30"
        >
          Track My Order
        </button>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-5 gap-8">
      <div className="md:col-span-3 space-y-6">
        <div className="glass-panel p-8 rounded-3xl">
          <h2 className="text-2xl font-bold text-slate-800 mb-1">Upload Files</h2>
          <p className="text-slate-500 text-sm mb-6">Select photos or PDF documents for printing.</p>
          
          <div 
            className="border-2 border-dashed border-brand-200 bg-brand-50/50 hover:bg-brand-50 rounded-2xl p-10 text-center cursor-pointer transition-colors flex flex-col items-center justify-center min-h-[240px]"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm text-brand-500 mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
            </div>
            <p className="font-medium text-slate-700">Click to browse or drag & drop</p>
            <p className="text-sm text-slate-500 mt-2">Supports JPG, PNG, PDF</p>
            <input 
              type="file" 
              multiple 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileChange}
              accept=".jpg,.jpeg,.png,.pdf"
            />
          </div>

          {files.length > 0 && (
            <div className="mt-8">
              <h3 className="font-medium text-slate-700 mb-4">Selected Files ({files.length})</h3>
              <div className="space-y-3">
                {files.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-100 shadow-sm group">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-10 h-10 bg-brand-100 text-brand-600 rounded-lg flex items-center justify-center shrink-0">
                        {file.type.includes('pdf') ? 'PDF' : 'IMG'}
                      </div>
                      <div className="truncate">
                        <p className="text-sm font-medium text-slate-700 truncate">{file.name}</p>
                        <p className="text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => removeFile(idx)}
                      className="text-slate-400 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="md:col-span-2">
        <form onSubmit={handleSubmit} className="glass-panel p-6 rounded-3xl sticky top-24">
          <h2 className="text-xl font-bold text-slate-800 mb-6">Print Settings</h2>
          
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Paper Size</label>
              <select 
                value={paperSize} 
                onChange={e => setPaperSize(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700 focus:ring-2 focus:ring-brand-500 outline-none"
              >
                {PAPER_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Color Mode</label>
              <div className="flex gap-2">
                {['Color', 'Black and White'].map(mode => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setColorMode(mode)}
                    className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${colorMode === mode ? 'border-brand-500 bg-brand-50 text-brand-700 shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Copies: {copies}</label>
              <input 
                type="range" 
                min="1" max="100" 
                value={copies} 
                onChange={e => setCopies(parseInt(e.target.value))}
                className="w-full accent-brand-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Special Instructions</label>
              <textarea 
                value={instructions} 
                onChange={e => setInstructions(e.target.value)}
                placeholder="E.g., glossy paper, print first page only..."
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 focus:ring-2 focus:ring-brand-500 outline-none resize-none h-24"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting || files.length === 0}
            className="w-full mt-8 bg-brand-600 hover:bg-brand-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium py-3.5 rounded-xl transition-colors shadow-lg shadow-brand-500/30 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75"></path></svg>
                Processing...
              </>
            ) : (
              'Submit Order'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
