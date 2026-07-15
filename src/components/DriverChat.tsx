import React, { useState } from 'react';
import { Vehicle } from '../types';
import { TRANSLATIONS } from '../data';
import { Navigation, Clock, ShieldAlert, Send } from 'lucide-react';
import { motion } from 'motion/react';

interface DriverChatProps {
  vehicles: Vehicle[];
  selectedVehicle: Vehicle | null;
  lang: 'en' | 'ar';
}

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
  isDispatch: boolean;
}

export default function DriverChat({ vehicles, selectedVehicle, lang }: DriverChatProps) {
  const t = TRANSLATIONS[lang];
  const [msgInput, setMsgInput] = useState('');
  const [chatHistory, setChatHistory] = useState<Record<string, ChatMessage[]>>({
    'QMF-101': [
      { id: '1', sender: 'Dispatch Office', text: 'Muhammad, please update your ETA for the King Salman road deliverable.', timestamp: '14:20', isDispatch: true },
      { id: '2', sender: 'Mohammed Al-Sharif', text: 'Copy that. Delayed at exit 8 customs checkpoint, moving in 10 minutes.', timestamp: '14:24', isDispatch: false }
    ],
    'QMF-103': [
      { id: '1', sender: 'Dispatch Office', text: 'Osama, heavy traffic expected near Mecca bypass. Reroute via highway 40.', timestamp: '13:00', isDispatch: true },
      { id: '2', sender: 'Osama Ibrahim', text: 'Rerouting now. Nav lock active.', timestamp: '13:05', isDispatch: false }
    ]
  });

  const activeVehicle = selectedVehicle || vehicles[0];
  const activeHistory = activeVehicle ? (chatHistory[activeVehicle.id] || []) : [];

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgInput.trim() || !activeVehicle) return;

    const newMsg: ChatMessage = {
      id: String(Date.now()),
      sender: lang === 'en' ? 'Dispatch Main Office' : 'مكتب التوجيه المركزي',
      text: msgInput,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isDispatch: true
    };

    const targetId = activeVehicle.id;

    // Append user message
    setChatHistory(prev => ({
      ...prev,
      [targetId]: [...(prev[targetId] || []), newMsg]
    }));

    setMsgInput('');

    // Trigger driver auto simulation reply in 2.5 seconds to feel fully interactive!
    setTimeout(() => {
      const responses = lang === 'en' ? [
        "Status acknowledged. On the road.",
        "Potable water pressure normal. Arriving soon.",
        "Traffic cleared, cargo is secure.",
        "Understood dispatch, following path lock."
      ] : [
        "تم الاستلام، في الطريق حالياً.",
        "ضغط ناقلة المياه مستقر، نقترب من الموقع.",
        "الطريق سالك والشحنة مؤمنة بالكامل.",
        "علم، متبع المسار المخطط."
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];

      const driverReply: ChatMessage = {
        id: String(Date.now() + 1),
        sender: activeVehicle.driverName,
        text: randomResponse,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isDispatch: false
      };

      setChatHistory(prev => ({
        ...prev,
        [targetId]: [...(prev[targetId] || []), driverReply]
      }));
    }, 2500);
  };

  if (!activeVehicle) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-slate-400 font-semibold text-xs shadow-sm">
        {lang === 'en' ? 'No vehicles registered for comms.' : 'لا توجد مركبات مسجلة للتواصل الحالي.'}
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col h-[400px]">
      {/* Target Driver info header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-xs font-mono font-bold text-slate-800 uppercase">{activeVehicle.id} Terminal</span>
        </div>
        <span className="text-[11px] text-brand-primary font-bold font-mono">{activeVehicle.driverName}</span>
      </div>

      {/* Message history */}
      <div className="flex-1 overflow-y-auto space-y-3 p-3 bg-slate-50 border border-slate-100 rounded-xl mb-3 scrollbar-thin">
        {activeHistory.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <ShieldAlert className="w-8 h-8 text-slate-200 mb-2" />
            <p className="text-[11px] text-slate-400 uppercase tracking-widest font-mono font-bold">
              {lang === 'en' ? 'SECURE VHF CHAT ESTABLISHED' : 'قناة اتصال لاسلكي مؤمنة'}
            </p>
          </div>
        ) : (
          activeHistory.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col max-w-[85%] ${m.isDispatch ? 'ml-auto items-end' : 'mr-auto items-start'}`}
            >
              <span className="text-[9px] text-slate-400 font-bold mb-0.5 px-1">
                {m.sender} • <span className="font-mono">{m.timestamp}</span>
              </span>
              <div className={`rounded-xl px-3 py-1.5 text-xs font-semibold leading-relaxed ${
                m.isDispatch 
                  ? 'bg-brand-primary text-white rounded-tr-none' 
                  : 'bg-white text-slate-800 border border-slate-200 shadow-sm rounded-tl-none'
              }`}>
                {m.text}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Send Input */}
      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={msgInput}
          onChange={(e) => setMsgInput(e.target.value)}
          placeholder={t.chatPlaceholder}
          className="flex-1 bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30 placeholder-slate-400 font-semibold"
        />
        <button
          type="submit"
          className="bg-brand-primary hover:bg-brand-dark text-white p-2.5 rounded-xl transition-all duration-200 cursor-pointer shadow-sm"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
