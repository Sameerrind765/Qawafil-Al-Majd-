import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut
} from 'firebase/auth';
import { auth } from '../firebase';
import { Truck, Globe, Mail, Lock, Eye, EyeOff, RefreshCcw } from 'lucide-react';

interface AuthScreenProps {
  lang: 'en' | 'ar';
  setLang: React.Dispatch<React.SetStateAction<'en' | 'ar'>>;
  onSuccess: () => void;
  unverifiedUserEmail?: string | null;
  onLogout?: () => void;
  initialErrorMessage?: string | null;
}

const authT = {
  en: {
    signIn: "Sign In",
    email: "Email Address",
    password: "Password",
    emailPlaceholder: "dispatcher@qawafil.com",
    passwordPlaceholder: "••••••••",
    signingIn: "Signing in...",
    welcomeBack: "Operations Terminal Portal",
    subtextSignIn: "Access the live telematics & fleet logistics control room.",
    brandName: "Qawafil Al Majd Al Mithaliya",
    brandSub: "Perfect Caravans of Glory - Transport & Contracting Logistics Hub",
  },
  ar: {
    signIn: "تسجيل الدخول",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    emailPlaceholder: "dispatcher@qawafil.com",
    passwordPlaceholder: "••••••••",
    signingIn: "جاري الدخول...",
    welcomeBack: "منصة غرف العمليات والتحكم",
    subtextSignIn: "الولوج إلى الراصد الملاحي وغرفة العمليات لوجستيات النقل.",
    brandName: "قوافل المجد المثالية",
    brandSub: "قوافل المجد المثالية للمقاولات والخدمات واللوجستيات",
  }
};

export default function AuthScreen({ lang, setLang, onSuccess, unverifiedUserEmail, onLogout, initialErrorMessage }: AuthScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(initialErrorMessage || '');

  const t = authT[lang];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    
    if (!email || !password) {
      setErrorMessage(lang === 'en' ? 'Please fill in all fields' : 'يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    setLoading(true);

    try {
      // Sign In Flow Only
      await signInWithEmailAndPassword(auth, email, password);
      onSuccess();
    } catch (error: any) {
      console.error("Firebase auth logic error:", error);
      setErrorMessage(
        lang === 'en'
          ? "Email or password is incorrect"
          : "البريد الإلكتروني أو كلمة المرور غير صحيحة"
      );
    } finally {
      setLoading(false);
    }
  };

  const activeVerificationEmail = unverifiedUserEmail;

  if (activeVerificationEmail) {
    return (
      <div className={`min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between font-sans transition-all duration-300 ${lang === 'ar' ? 'rtl' : 'ltr'}`}>
        
        {/* Top Banner similar to Dashboard */}
        <header className="bg-white border-b border-slate-200 shadow-sm px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-primary flex items-center justify-center text-white font-bold border border-brand-primary shadow-lg shadow-brand-primary/10">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-slate-800 font-display uppercase">
                {t.brandName}
              </h1>
              <p className="text-[11px] text-brand-primary font-semibold tracking-wide">
                {t.brandSub}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setLang(prev => prev === 'en' ? 'ar' : 'en')}
            className="flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-brand-primary text-xs font-bold px-4 py-2 rounded-xl transition-all duration-300 cursor-pointer shadow-sm"
            id="lang-toggle-btn"
          >
            <Globe className="w-4 h-4 text-brand-primary" />
            {lang === 'en' ? 'بالعربية' : 'English UI'}
          </button>
        </header>

        {/* Verification Screen */}
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="bg-white border border-slate-200 shadow-xl rounded-2xl p-8 max-w-md w-full text-center" id="verification-card">
            <div className="mx-auto w-16 h-16 rounded-full bg-brand-light flex items-center justify-center text-brand-primary mb-6 border border-brand-primary/20 shadow-sm animate-pulse">
              <Mail className="w-8 h-8" />
            </div>
            
            <h2 className="text-xl font-extrabold text-slate-850 tracking-tight mb-4">
              {lang === 'en' ? 'Please Verify Your Email' : 'يرجى تأكيد البريد الإلكتروني'}
            </h2>
            
            <p className="text-sm text-slate-600 font-medium leading-relaxed mb-6" id="verification-message">
              {lang === 'en' 
                ? `We have sent you a verification email to ${activeVerificationEmail}. Please verify it and log in.`
                : `لقد أرسلنا بريداً إلكترونياً لتأكيد الحساب إلى ${activeVerificationEmail}. يرجى تأكيده وتفعيل الحساب ثم تسجيل الدخول.`
              }
            </p>

            <button
              type="button"
              onClick={async () => {
                if (onLogout) {
                  onLogout();
                } else {
                  await signOut(auth);
                }
                setEmail('');
                setPassword('');
                setErrorMessage('');
              }}
              className="w-full bg-brand-primary hover:bg-brand-dark text-white font-bold text-xs rounded-xl py-3 px-4 transition-colors duration-200 cursor-pointer shadow-md"
              id="verification-login-btn"
            >
              {lang === 'en' ? 'Login' : 'تسجيل الدخول'}
            </button>
          </div>
        </main>

        {/* Footer copyright */}
        <footer className="bg-white border-t border-slate-200 px-6 py-6 text-center text-xs text-slate-500 font-medium">
          <p className="font-sans font-bold uppercase tracking-wider mb-2 text-slate-700">
            {lang === 'en' ? 'Qawafil Al Majd Al Mithaliya Integrated Portal' : 'البوابة اللوجستية المتكاملة لقوافل المجد المثالية'}
          </p>
          <p>© 2026 Qawafil Al Majd Al Mithaliya Contracting & Services Co. All rights reserved.</p>
        </footer>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between font-sans transition-all duration-300 ${lang === 'ar' ? 'rtl' : 'ltr'}`}>
      
      {/* Top Banner similar to Dashboard */}
      <header className="bg-white border-b border-slate-200 shadow-sm px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-primary flex items-center justify-center text-white font-bold border border-brand-primary shadow-lg shadow-brand-primary/10">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight text-slate-800 font-display uppercase">
              {t.brandName}
            </h1>
            <p className="text-[11px] text-brand-primary font-semibold tracking-wide">
              {t.brandSub}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setLang(prev => prev === 'en' ? 'ar' : 'en')}
          className="flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-brand-primary text-xs font-bold px-4 py-2 rounded-xl transition-all duration-300 cursor-pointer shadow-sm"
          id="lang-toggle-btn"
        >
          <Globe className="w-4 h-4 text-brand-primary" />
          {lang === 'en' ? 'بالعربية' : 'English UI'}
        </button>
      </header>

      {/* Main Login Form Stage */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="bg-white border border-slate-200 shadow-xl rounded-2xl p-8 max-w-md w-full" id="auth-card">
          <div className="text-center mb-6">
            <h2 className="text-xl font-extrabold text-slate-850 tracking-tight">
              {t.welcomeBack}
            </h2>
            <p className="text-xs text-slate-500 mt-2 font-medium">
              {t.subtextSignIn}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" id="auth-form">
            {/* Error Message Alert */}
            {errorMessage && (
              <div 
                className="bg-rose-50 border-l-4 border-rose-500 text-rose-800 p-3.5 rounded-r-lg text-xs font-bold shadow-sm" 
                id="auth-error-alert"
              >
                {errorMessage}
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block font-mono uppercase">
                {t.email}
              </label>
              <div className="relative">
                <span className={`absolute inset-y-0 ${lang === 'ar' ? 'right-3' : 'left-3'} flex items-center pointer-events-none text-slate-400`}>
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  id="auth-email-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.emailPlaceholder}
                  className={`w-full bg-white border border-slate-200 rounded-xl py-2.5 ${lang === 'ar' ? 'pr-9.5 pl-4' : 'pl-9.5 pr-4'} text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30 focus:ring-1 focus:ring-brand-primary/40 font-semibold`}
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block font-mono uppercase">
                {t.password}
              </label>
              <div className="relative">
                <span className={`absolute inset-y-0 ${lang === 'ar' ? 'right-3' : 'left-3'} flex items-center pointer-events-none text-slate-400`}>
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  id="auth-password-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t.passwordPlaceholder}
                  className={`w-full bg-white border border-slate-200 rounded-xl py-2.5 ${lang === 'ar' ? 'pr-9.5 pl-10' : 'pl-9.5 pr-10'} text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30 focus:ring-1 focus:ring-brand-primary/40 font-semibold`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute inset-y-0 ${lang === 'ar' ? 'left-3' : 'right-3'} flex items-center text-slate-400 hover:text-slate-600 cursor-pointer`}
                  id="toggle-password-visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <button
              type="submit"
              disabled={loading}
              className="w-full hover:bg-red-800 text-white font-bold text-xs rounded-xl py-3 px-4 transition-colors duration-200 cursor-pointer shadow-md flex items-center justify-center gap-2"
              id="auth-submit-btn"
              style={{ backgroundColor: '#C0272D' }}
            >
              {loading && <RefreshCcw className="w-4 h-4 animate-spin" />}
              {loading ? t.signingIn : t.signIn}
            </button>
          </form>
        </div>
      </main>

      {/* Footer copyright */}
      <footer className="bg-white border-t border-slate-200 px-6 py-6 text-center text-xs text-slate-500 font-medium">
        <p className="font-sans font-bold uppercase tracking-wider mb-2 text-slate-700">
          {lang === 'en' ? 'Qawafil Al Majd Al Mithaliya Integrated Portal' : 'البوابة اللوجستية المتكاملة لقوافل المجد المثالية'}
        </p>
        <p>© 2026 Qawafil Al Majd Al Mithaliya Contracting & Services Co. All rights reserved.</p>
      </footer>
    </div>
  );
}
