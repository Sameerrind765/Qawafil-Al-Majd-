import React, { useState } from 'react';
import { useLang } from '../context/LangContext';
import { Mail, Phone, MapPin, MessageSquare, Send, CheckCircle2, Headphones, Clock } from 'lucide-react';

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
    }, 1000);
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setSubject('');
    setMessage('');
    setSuccess(false);
  };

  const whatsappNumber = "966542049512";
  const getWhatsAppURL = () => {
    const msg = lang === 'en'
      ? `Ahlalan Qawafil Al Majd Al Misaliya! I am reaching out via your website contact form:\n\n- *Name:* ${name}\n- *Email:* ${email}\n- *Subject:* ${subject}\n- *Message:* ${message}`
      : `السلام عليكم قوافل المجد المثالية! أتواصل معكم عبر نموذج التواصل في الموقع:\n\n- *الاسم:* ${name}\n- *البريد:* ${email}\n- *الموضوع:* ${subject}\n- *الرسالة:* ${message}`;
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`;
  };

  return (
    <div className="flex-1 py-10 sm:py-16 bg-[#f8f9fa] font-sans select-none">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 bg-emerald-100/80 border border-emerald-200 py-1.5 px-4 rounded-full text-[#0d6b46] font-extrabold text-xs uppercase tracking-wider mb-3.5 shadow-xs">
            <Headphones className="w-4 h-4 text-[#0d6b46]" />
            <span>{lang === 'en' ? 'Customer Support & Inquiries' : 'خدمة العملاء والاستفسارات'}</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight" id="contact-page-title">
            {t.contactTitle}
          </h2>

          <p className="text-slate-500 text-xs sm:text-sm font-semibold leading-relaxed max-w-xl mx-auto mt-2.5">
            {t.contactSub}
          </p>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 max-w-5xl mx-auto items-start">
          
          {/* Left panel: Contact Form */}
          <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-[24px] p-6 sm:p-8 shadow-sm" id="contact-form-container">
            {success ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mx-auto mb-4">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                </div>
                
                <h4 className="text-lg font-black text-slate-900 mb-2">
                  {lang === 'en' ? 'Message Sent Successfully!' : 'تم إرسال رسالتك بنجاح!'}
                </h4>
                
                <p className="text-xs sm:text-sm text-slate-600 font-semibold mb-6 max-w-md mx-auto leading-relaxed">
                  {lang === 'en' 
                    ? 'Thank you for reaching out to Qawafil Al Majd Al Misaliya. Our customer support team will review your message and reply promptly.' 
                    : 'شكراً لتواصلك مع قوافل المجد المثالية. سيقوم فريق خدمة العملاء بمراجعة رسالتك والرد عليك في أقرب وقت.'
                  }
                </p>

                <div className="space-y-3 max-w-xs mx-auto">
                  <a
                    href={getWhatsAppURL()}
                    target="_blank"
                    referrerPolicy="no-referrer"
                    className="w-full flex items-center justify-center gap-2.5 bg-[#058a58] hover:bg-[#04774b] text-white font-extrabold text-xs py-3.5 px-4 rounded-xl shadow transition-colors decoration-transparent"
                    id="contact-whatsapp-confirm"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>{lang === 'en' ? 'Chat directly on WhatsApp' : 'التواصل المباشر عبر الواتساب'}</span>
                  </a>

                  <button
                    type="button"
                    onClick={resetForm}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-3 rounded-xl transition-colors cursor-pointer"
                  >
                    {lang === 'en' ? 'Send Another Message' : 'إرسال رسالة أخرى'}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="space-y-4" id="contact-actual-form">
                <div className="border-b border-slate-100 pb-3 mb-2">
                  <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                    {lang === 'en' ? 'Send Us a Message' : 'أرسل لنا رسالة'}
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    {lang === 'en' ? 'Fill out the form below and we will get back to you.' : 'يسعدنا استقبال استفساراتك واقتراحاتك في أي وقت.'}
                  </p>
                </div>

                {/* Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    {lang === 'en' ? 'Full Name' : 'الاسم الكامل'}
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={lang === 'en' ? 'e.g. Mohammed Ali' : 'مثال: محمد علي'}
                    className="w-full bg-slate-50/80 border border-slate-200 rounded-xl py-3 px-4 text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:border-[#055c3c] transition-colors"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    {lang === 'en' ? 'Email Address' : 'البريد الإلكتروني'}
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-slate-50/80 border border-slate-200 rounded-xl py-3 px-4 text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:border-[#055c3c] transition-colors text-left"
                    dir="ltr"
                  />
                </div>

                {/* Subject */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    {t.formLabelSubject}
                  </label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder={lang === 'en' ? 'e.g. Booking Inquiry / Special Request' : 'مثال: استفسار عن حجز / طلب خاص'}
                    className="w-full bg-slate-50/80 border border-slate-200 rounded-xl py-3 px-4 text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:border-[#055c3c] transition-colors"
                  />
                </div>

                {/* Message */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    {t.formLabelMessage}
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={lang === 'en' ? 'Write your message details here...' : 'اكتب تفاصيل رسالتك هنا...'}
                    className="w-full bg-slate-50/80 border border-slate-200 rounded-xl p-4 text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:border-[#055c3c] transition-colors resize-none"
                  />
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#055c3c] hover:bg-[#04482f] text-white font-extrabold text-xs py-3.5 rounded-xl shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99] mt-2"
                  id="contact-form-submit-btn"
                >
                  <Send className="w-4 h-4" />
                  <span>{submitting ? t.loading : t.formBtnSubmit}</span>
                </button>
              </form>
            )}
          </div>

          {/* Right panel: Office Info & Quick Contact */}
          <div className="lg:col-span-5 space-y-6" id="contact-hq-info">
            
            {/* Contact Details Card */}
            <div className="bg-white border border-slate-200/90 rounded-[24px] p-6 sm:p-7 shadow-sm space-y-5">
              <h3 className="text-base font-black text-slate-900 border-b border-slate-100 pb-3">
                {t.hqTitle}
              </h3>

              <div className="space-y-4">
                {/* Address */}
                <div className="flex items-start gap-3 text-xs font-semibold text-slate-600">
                  <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-100/80 mt-0.5 shrink-0 text-[#0d6b46]">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-xs mb-0.5">
                      {lang === 'en' ? 'Office Location' : 'موقع المكتب الرئيسي'}
                    </p>
                    <p className="leading-relaxed text-slate-600">{t.hqAddress}</p>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-start gap-3 text-xs font-semibold text-slate-600">
                  <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-100/80 mt-0.5 shrink-0 text-[#0d6b46]">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-xs mb-0.5">
                      {lang === 'en' ? 'Phone & WhatsApp' : 'الهاتف والواتساب'}
                    </p>
                    <a href="tel:+966542049512" className="leading-relaxed font-mono text-slate-700 hover:text-emerald-700 transition-colors block decoration-transparent">
                      {t.hqPhone}
                    </a>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-3 text-xs font-semibold text-slate-600">
                  <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-100/80 mt-0.5 shrink-0 text-[#0d6b46]">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-xs mb-0.5">
                      {lang === 'en' ? 'Email Support' : 'البريد الإلكتروني'}
                    </p>
                    <a href="mailto:Info@qawafilalmajdalmisaliya.com" className="leading-relaxed font-mono text-slate-700 hover:text-emerald-700 transition-colors block decoration-transparent">
                      {t.hqEmail}
                    </a>
                  </div>
                </div>

                {/* Working Hours */}
                <div className="flex items-start gap-3 text-xs font-semibold text-slate-600">
                  <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-100/80 mt-0.5 shrink-0 text-[#0d6b46]">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-xs mb-0.5">
                      {lang === 'en' ? 'Working Hours' : 'ساعات العمل'}
                    </p>
                    <p className="leading-relaxed text-emerald-700 font-bold">{t.hqWorkingHours}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick 24/7 Support Banner */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-[24px] p-6 relative overflow-hidden shadow-md">
              <div className="relative z-10 space-y-2">
                <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 font-extrabold text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full border border-emerald-500/30">
                  <Headphones className="w-3.5 h-3.5" />
                  <span>{lang === 'en' ? '24/7 Always Here for You' : 'خدمة مستمرة 24/7'}</span>
                </div>

                <h4 className="text-sm font-black text-white pt-1">
                  {lang === 'en' ? 'Need Immediate Assistance?' : 'تحتاج مساعدة فورية؟'}
                </h4>

                <p className="text-xs text-slate-300 font-semibold leading-relaxed">
                  {lang === 'en'
                    ? 'Whether you need help with private chauffeured cars, airport transfers, or guided Ziyarat tours, our customer care team is ready to assist.'
                    : 'سواء كنت بحاجة لمساعدة في حجز سيارة خاصة مع سائق، توصيل المطار، أو رحلات الزيارة الشريفة، فريقنا متواجد دائماً لخدمتك.'
                  }
                </p>

                <div className="pt-2">
                  <a
                    href={`https://wa.me/${whatsappNumber}`}
                    target="_blank"
                    referrerPolicy="no-referrer"
                    className="inline-flex items-center gap-2 text-xs font-black text-emerald-400 hover:text-emerald-300 transition-colors decoration-transparent"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>{lang === 'en' ? 'Instant WhatsApp Support →' : 'تواصل فورياً عبر الواتساب ←'}</span>
                  </a>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
