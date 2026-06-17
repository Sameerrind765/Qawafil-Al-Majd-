import React, { useState } from 'react';
import { useLang } from '../context/LangContext';
import { Mail, Phone, MapPin, Compass, MessageSquare, Send, CheckCircle2 } from 'lucide-react';

export default function Contact() {
  const { lang, t } = useLang();
  
  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    setTimeout(() => {
      setSubmitting(false);
      setSuccess(true);
    }, 1200);
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setSubject('');
    setMessage('');
    setSuccess(false);
  };

  const whatsappNumber = "966501234567";
  const getWhatsAppURL = () => {
    const msg = lang === 'en'
      ? `Ahlalan Qawafil Al Majd Operations Desk! I have submitted a contact inquiry:\n\n- *Name:* ${name}\n- *Email:* ${email}\n- *Topic:* ${subject}\n- *Details:* ${message}`
      : `السلام عليكم قوافل المجد! لقد قمت بإرسال طلب استفسار عبر الموقع:\n\n- *الاسم:* ${name}\n- *البريد:* ${email}\n- *عنوان الطلب:* ${subject}\n- *التفاصيل:* ${message}`;
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`;
  };

  return (
    <div className="flex-1 py-12 bg-white font-sans select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title structure */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 bg-brand-primary/10 border border-brand-primary/20 py-1.5 px-3.5 rounded-full text-brand-primary font-bold text-xs uppercase tracking-wider mb-4">
            <Compass className="w-4 h-4" />
            <span>HQ Operations Command Desk</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight" id="contact-page-title">
            {t.contactTitle}
          </h2>

          <p className="text-slate-500 text-xs sm:text-sm font-semibold leading-relaxed max-w-xl mx-auto mt-2">
            {t.contactSub}
          </p>
        </div>

        {/* Dynamic split view */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
          
          {/* Left panel: Controlled feedback form */}
          <div className="bg-rose-50/20 border border-rose-100 rounded-2xl p-6 sm:p-8" id="contact-form-container">
            {success ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-650 mx-auto mb-5 animate-bounce">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                </div>
                <h4 className="text-base font-extrabold text-slate-900 mb-2">
                  {lang === 'en' ? 'Inquiry Sent Successfully!' : 'تم تقديم الاستفسار بنجاح!'}
                </h4>
                <p className="text-xs text-slate-500 font-semibold mb-6 max-w-sm mx-auto">
                  {lang === 'en' 
                    ? 'Our logistics dispatcher will respond to your registered email or phone within 10 minutes.' 
                    : 'سيتواصل معك ضابط العمليات المناوب فور مراجعة طلبك عبر البريد أو الهاتف خلال دقائق.'
                  }
                </p>

                <div className="space-y-3">
                  <a
                    href={getWhatsAppURL()}
                    target="_blank"
                    referrerPolicy="no-referrer"
                    className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-3.5 px-4 rounded-xl shadow transition-colors decoration-transparent"
                    id="contact-whatsapp-confirm"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>{lang === 'en' ? 'Puff Dispatch on WhatsApp' : 'إرسال إشارة عبر وتساب'}</span>
                  </a>

                  <button
                    type="button"
                    onClick={resetForm}
                    className="w-full bg-slate-150 hover:bg-slate-200 text-slate-750 font-bold text-xs py-2.5 rounded-xl transition-colors"
                  >
                    {lang === 'en' ? 'Submit New Ticket' : 'إرسال طلب جديد'}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="space-y-5" id="contact-actual-form">
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide mb-2">
                  {lang === 'en' ? 'Operational Message Ticket' : 'بطاقة استفسار وتنسيق'}
                </h3>

                {/* Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 block uppercase">
                    {lang === 'en' ? 'Full Name' : 'الاسم الكريم'}
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Yahya"
                    className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold text-slate-850 outline-none focus:border-brand-primary"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 block uppercase">
                    {lang === 'en' ? 'Email Address' : 'البريد الإلكتروني'}
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g., active@company.com"
                    className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold text-slate-850 outline-none focus:border-brand-primary text-left"
                    dir="ltr"
                  />
                </div>

                {/* Subject */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 block uppercase">
                    {t.formLabelSubject}
                  </label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g., Fleet Reservation"
                    className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold text-slate-850 outline-none focus:border-brand-primary"
                  />
                </div>

                {/* Body Message */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 block uppercase">
                    {t.formLabelMessage}
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="..."
                    className="w-full bg-white border border-slate-200 rounded-xl p-4 text-xs font-bold text-slate-850 outline-none focus:border-brand-primary resize-none"
                  />
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-brand-primary hover:bg-brand-dark text-white font-extrabold text-xs py-3.5 rounded-xl shadow-lg shadow-brand-primary/2 w-full flex items-center justify-center gap-2 cursor-pointer transition-colors duration-200"
                  id="contact-form-submit-btn"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? t.loading : t.formBtnSubmit}</span>
                </button>
              </form>
            )}
          </div>

          {/* Right panel: Static headquarters metadata */}
          <div className="space-y-8 flex flex-col justify-between" id="contact-hq-info">
            <div className="space-y-6">
              <h3 className="text-base font-black text-slate-900 border-b border-rose-100 pb-3 uppercase tracking-wide">
                {t.hqTitle}
              </h3>

              <div className="space-y-4">
                <div className="flex items-start gap-3 text-xs font-semibold text-slate-600">
                  <div className="bg-rose-50 p-2.5 rounded-xl border border-rose-100 mt-0.5 shrink-0">
                    <MapPin className="w-5 h-5 text-brand-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 uppercase tracking-wider mb-0.5">
                      {lang === 'en' ? 'Physical HQ Address' : 'موقع المقر الفعلي'}
                    </p>
                    <p className="leading-relaxed mt-0.5">{t.hqAddress}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-xs font-semibold text-slate-600">
                  <div className="bg-rose-50 p-2.5 rounded-xl border border-rose-100 mt-0.5 shrink-0">
                    <Phone className="w-5 h-5 text-brand-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 uppercase tracking-wider mb-0.5">
                      {lang === 'en' ? 'Direct Hotline Link' : 'رقم الخط الساخن والعمليات'}
                    </p>
                    <p className="leading-relaxed font-mono mt-0.5">{t.hqPhone}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-xs font-semibold text-slate-600">
                  <div className="bg-rose-50 p-2.5 rounded-xl border border-rose-100 mt-0.5 shrink-0">
                    <Mail className="w-5 h-5 text-brand-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 uppercase tracking-wider mb-0.5">
                      {lang === 'en' ? 'Corporate Correspondence Email' : 'البريد الرسمي المكتبي'}
                    </p>
                    <p className="leading-relaxed font-mono mt-0.5">{t.hqEmail}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Live duty dispatch note */}
            <div className="bg-slate-900 text-white rounded-2xl p-6 relative overflow-hidden select-none shadow-md">
              <span className="text-7xl absolute -right-4 -bottom-6 opacity-5">📡</span>
              <div className="relative z-10">
                <h4 className="text-xs uppercase font-extrabold text-brand-primary tracking-widest mb-1">
                  {lang === 'en' ? 'Operations Duty Status: Live' : 'حالة مركز التنسيق والعمليات'}
                </h4>
                <p className="text-xs font-bold text-slate-300 leading-relaxed">
                  {t.hqWorkingHours}
                </p>
                <p className="text-[10px] text-slate-400 font-semibold mt-3 leading-relaxed">
                  {lang === 'en'
                    ? 'Our telecommunications unit handles continuous GPS coordinates feedback from all active caravans to guarantee absolute safety.'
                    : 'ترتبط المركبات الميدانية ببروتوكول اتصالات مستمر مع نظام تحديد المواقع العالمي (GPS) لضمان تفويج سليم تحت إشراف ضابط السلامة.'
                  }
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
