import React, { useState, useEffect } from 'react';

const API_BASE = 'http://127.0.0.1:8000';

// ==========================================
// 1. CINEMATIC SPLASH LOADER
// ==========================================
function SplashLoader({ onComplete }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 400);
    const t2 = setTimeout(() => setPhase(2), 1100);
    const t3 = setTimeout(() => setPhase(3), 2000);
    const t4 = setTimeout(() => onComplete(), 2500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onComplete]);

  return (
    <div className={`fixed inset-0 z-50 bg-[#0b0612] flex flex-col items-center justify-center overflow-hidden transition-opacity duration-700 ${
      phase === 3 ? 'opacity-0 pointer-events-none' : 'opacity-100'
    }`}>
      <div className="absolute w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-[#d9b3d0]/15 via-[#3a203b]/25 to-[#f3dcb5]/10 blur-[130px] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      <div className={`relative z-10 flex flex-col items-center transition-all duration-700 ease-in-out ${
        phase === 3 ? '-translate-x-28 opacity-0 blur-[2px]' : 'translate-x-0 opacity-100'
      }`}>
        <div className="flex items-baseline justify-center select-none">
          <span className={`text-5xl sm:text-7xl font-extrabold tracking-tight text-[#f3dcb5] transition-all duration-600 ease-out ${
            phase === 0 
              ? 'scale-125 drop-shadow-[0_0_40px_rgba(243,220,181,0.6)]' 
              : 'scale-100 drop-shadow-[0_0_20px_rgba(243,220,181,0.25)]'
          }`}>
            V
          </span>

          <div className={`overflow-hidden transition-all duration-700 ease-out flex items-baseline ${
            phase >= 1 ? 'max-w-[480px] opacity-100' : 'max-w-0 opacity-0'
          }`}>
            <span className="text-5xl sm:text-7xl font-extrabold tracking-tight text-white whitespace-nowrap">
              entureLink<span className="text-[#d9b3d0]">.</span>
            </span>
          </div>
        </div>

        <div className={`mt-4 flex flex-col items-center transition-all duration-500 ease-out ${
          phase >= 2 && phase < 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
        }`}>
          <p className="text-[11px] sm:text-xs uppercase tracking-[0.3em] text-[#d9b3d0] font-bold">
            Micro-Venture Escrow Infrastructure
          </p>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 2. AUTHENTICATION MODAL (WITH TERMS & CONDITIONS CHECKBOX & MODAL)
// ==========================================
function AuthModal({ mode, role, onClose, onSwitchMode, onRoleChange, onAuthenticate }) {
  const isSignUp = mode === 'SIGNUP';
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMsg('Please enter your email address.');
      return;
    }

    if (isSignUp && !fullName.trim()) {
      setErrorMsg('Please enter your full name to register.');
      return;
    }

    if (isSignUp && !agreeTerms) {
      setErrorMsg('You must agree to the VentureLink Terms & Conditions to register.');
      return;
    }

    const isStealthAdmin = cleanEmail === 'admin@venturelink.in' || cleanEmail === 'namit@venturelink.in' || role === 'ADMIN';

    // Only send fullName if signing up; on Login, send empty string so backend keeps saved DB name
    const submittedName = isStealthAdmin
      ? 'Namit Mahure (Master Admin)'
      : isSignUp
      ? fullName.trim()
      : '';

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: submittedName,
          email: cleanEmail,
          password: password,
          role: isStealthAdmin ? 'ADMIN' : role,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        setErrorMsg(err.detail || 'Authentication failed');
        return;
      }
      const userData = await res.json();
      onAuthenticate(userData);
    } catch (err) {
      setErrorMsg('Backend server unreachable. Make sure FastAPI is running on port 8000.');
    }
  };
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-xl overflow-y-auto"
      onClick={onClose}
    >
      {/* FULL TERMS & CONDITIONS POPUP MODAL */}
      {showTermsModal && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          onClick={() => setShowTermsModal(false)}
        >
          <div 
            className="w-full max-w-lg bg-[#140c1d] border border-[#f3dcb5]/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-lg font-bold text-white">VentureLink Terms & Conditions</h3>
              <button 
                onClick={() => setShowTermsModal(false)}
                className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer"
              >
                &times;
              </button>
            </div>
            
            <div className="space-y-3 text-xs text-zinc-300 font-mono leading-relaxed">
              <p><strong>1. Section 42 Compliance:</strong> All private syndicates hosted on VentureLink strictly adhere to Indian Companies Act Section 42, limiting participation to a maximum of 199 accredited private backers per syndicate.</p>
              <p><strong>2. RBI Trustee Escrow Protection:</strong> Capital committed by investors is locked in a regulated escrow vault and disbursed to founders in 3 milestone tranches conditional upon verifiable GSTN invoice telemetry.</p>
              <p><strong>3. Adaptive Revenue Share & Grace Period:</strong> Monthly POS payouts are subject to automated account aggregator feeds. In the event of zero revenue, a grace period applies with zero default penalty.</p>
              <p><strong>4. Platform Liability:</strong> VentureLink acts solely as a technological intermediary connecting accredited founders and investors. All legal contracts are binding between participating parties.</p>
            </div>

            <button
              onClick={() => setShowTermsModal(false)}
              className="w-full py-3 rounded-xl bg-[#f3dcb5] text-black font-bold text-xs uppercase tracking-wider cursor-pointer mt-2"
            >
              I Understand & Agree →
            </button>
          </div>
        </div>
      )}

      <div 
        className="relative w-full max-w-[440px] my-auto rounded-[28px] p-[1px] bg-gradient-to-b from-[#f3dcb5]/30 via-[#d9b3d0]/15 to-white/5 shadow-[0_0_80px_rgba(217,179,208,0.18)] max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative bg-[#11091a]/95 rounded-[27px] p-6 sm:p-8 overflow-y-auto max-h-[92vh]">
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-56 h-28 bg-gradient-to-r from-[#d9b3d0]/25 to-[#f3dcb5]/20 blur-3xl pointer-events-none" />

          <button 
            onClick={onClose}
            className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-all text-lg cursor-pointer z-20"
          >
            &times;
          </button>

          <div className="mb-6 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#f3dcb5]" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-300">
                {role === 'INVESTOR' ? 'Investor Syndicate Portal' : 'Founder Studio Portal'}
              </span>
            </div>
            <h2 className="text-3xl font-bold text-white tracking-tight">
              {isSignUp ? (
                <>Create your <span className="font-serif-luxury italic font-normal text-[#f3dcb5] text-4xl">Account.</span></>
              ) : (
                <>Welcome <span className="font-serif-luxury italic font-normal text-[#f3dcb5] text-4xl">Back.</span></>
              )}
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-1.5 p-1.5 bg-black/50 border border-white/10 rounded-2xl mb-5 relative z-10">
            <button
              type="button"
              onClick={() => onRoleChange('INVESTOR')}
              className={`py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                role === 'INVESTOR'
                  ? 'bg-gradient-to-r from-[#f3dcb5] to-[#e7c896] text-black shadow-[0_0_20px_rgba(243,220,181,0.25)] font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Investor Account
            </button>
            <button
              type="button"
              onClick={() => onRoleChange('FOUNDER')}
              className={`py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                role === 'FOUNDER'
                  ? 'bg-gradient-to-r from-[#f3dcb5] to-[#e7c896] text-black shadow-[0_0_20px_rgba(243,220,181,0.25)] font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Founder Account
            </button>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-300 font-mono">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5 relative z-10">
            {isSignUp && (
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 block mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <input 
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={role === 'INVESTOR' ? "e.g. Aarav Mehta" : "e.g. Rohan Baruah"}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white text-sm focus:border-[#f3dcb5]/70 focus:bg-white/[0.05] focus:outline-none transition-all placeholder:text-zinc-600"
                  />
                  <svg className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
            )}

            <div>
              <label className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 block mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white text-sm focus:border-[#f3dcb5]/70 focus:bg-white/[0.05] focus:outline-none transition-all placeholder:text-zinc-600"
                />
                <svg className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 block mb-1.5">
                Password
              </label>
              <div className="relative">
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white text-sm focus:border-[#f3dcb5]/70 focus:bg-white/[0.05] focus:outline-none transition-all placeholder:text-zinc-600"
                />
                <svg className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            </div>

            {/* TERMS & CONDITIONS CHECKBOX & MORE LINK */}
            {isSignUp && (
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input 
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="w-4 h-4 rounded accent-[#f3dcb5] cursor-pointer"
                  />
                  <span className="text-xs text-zinc-300">I agree to Terms & Conditions</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowTermsModal(true)}
                  className="text-xs font-semibold text-[#f3dcb5] hover:underline cursor-pointer"
                >
                  View More →
                </button>
              </div>
            )}

            <button 
              type="submit"
              className="w-full mt-3 py-3.5 rounded-xl bg-gradient-to-r from-[#f3dcb5] via-[#edd0a3] to-[#f3dcb5] text-black font-bold text-xs uppercase tracking-widest hover:brightness-105 transition-all hover:scale-[1.01] shadow-[0_0_30px_rgba(243,220,181,0.25)] cursor-pointer"
            >
              {isSignUp 
                ? `Register & Open ${role === 'INVESTOR' ? 'Investor' : 'Founder'} Page →` 
                : `Enter ${role === 'INVESTOR' ? 'Investor' : 'Founder'} Page →`}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400 relative z-10">
            <span>
              {isSignUp ? 'Already registered?' : 'New to VentureLink?'}
            </span>
            <button 
              onClick={() => onSwitchMode(isSignUp ? 'LOGIN' : 'SIGNUP')}
              className="text-[#f3dcb5] font-semibold hover:underline cursor-pointer"
            >
              {isSignUp ? 'Sign In →' : 'Create Account →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
// ==========================================
// 3. DEAL DETAILS & 1-MIN PITCH VIDEO MODAL
// ==========================================
function DealDetailsModal({ deal, onClose, onOpenSimulator }) {
  const [showVideo, setShowVideo] = useState(false);
  if (!deal) return null;
  const isRevShare = deal.structure === 'REVENUE_SHARE';
  const formatMoney = (val) => `₹${Math.round(val || 0).toLocaleString('en-IN')}`;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-xl overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-2xl my-auto bg-[#140c1d] border border-white/20 rounded-[28px] p-8 sm:p-10 shadow-[0_0_90px_rgba(0,0,0,0.8)] overflow-y-auto max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-all text-lg cursor-pointer z-20"
        >
          &times;
        </button>

        <div className="flex flex-wrap items-center gap-2.5 mb-4">
          <span className="px-3.5 py-1 text-[11px] font-semibold tracking-wider uppercase rounded-full bg-white/5 border border-white/10 text-zinc-300">
            {deal.category}
          </span>
          <span className={`px-3 py-1 text-[11px] font-bold tracking-wider uppercase rounded-full border ${
            isRevShare ? 'bg-[#f3dcb5]/10 border-[#f3dcb5]/30 text-[#f3dcb5]' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
          }`}>
            {isRevShare ? 'Revenue Share' : 'Milestone SAFE'}
          </span>
          {deal.subscription_tier === 'SCALE_VIP' && (
            <span className="px-3 py-1 text-[10px] font-mono font-bold uppercase rounded-full bg-amber-400/15 border border-amber-400/40 text-amber-300">
              ⚡ VIP Growth Concierge
            </span>
          )}
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">{deal.title}</h2>
        <p className="text-xs text-zinc-400 mb-5 flex items-center gap-1.5 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          Founder: {deal.founder_name || 'Verified Founder'} • {deal.location} • Section 42 Compliant
        </p>

        <div className="mb-6">
          {!showVideo ? (
            <button
              onClick={() => setShowVideo(true)}
              className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-[#3a203b]/60 to-[#1f1124] border border-[#d9b3d0]/30 flex items-center justify-between hover:border-[#f3dcb5] transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-[#f3dcb5] text-black flex items-center justify-center font-bold text-xs">▶</span>
                <div className="text-left">
                  <span className="text-xs font-bold text-white block">Watch 1-Minute Founder Video Pitch</span>
                  <span className="text-[10px] font-mono text-[#d9b3d0]">Verified Founder Story & Storefront Walkthrough</span>
                </div>
              </div>
              <span className="text-xs font-mono text-[#f3dcb5] font-bold">Play Video →</span>
            </button>
          ) : (
            <div className="rounded-2xl overflow-hidden border border-[#f3dcb5]/40 bg-black">
              <video
                src={deal.pitch_video_url || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"}
                controls
                autoPlay
                className="w-full max-h-64 object-cover"
              />
            </div>
          )}
        </div>

        <p className="text-sm text-zinc-300 leading-relaxed mb-6 bg-black/30 p-4 rounded-xl border border-white/5">
          {deal.description}
        </p>

        <div className="grid grid-cols-3 gap-3 mb-6 text-center bg-black/40 p-4 rounded-2xl border border-white/10">
          <div>
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">Target Raise</span>
            <span className="text-sm font-bold text-white font-mono">{formatMoney(deal.targetAmountINR)}</span>
          </div>
          <div className="border-x border-white/10">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">Return Cap</span>
            <span className="text-sm font-bold text-[#f3dcb5] font-mono">{isRevShare ? `${deal.returnCapMultiple}x Multiple` : 'SAFE Equity'}</span>
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">Monthly Yield</span>
            <span className="text-sm font-bold text-emerald-400 font-mono">{isRevShare ? `${deal.royaltyPercent}% Royalty` : 'Milestone SAFE'}</span>
          </div>
        </div>

        {deal.compliance_items && deal.compliance_items.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xs uppercase font-bold tracking-widest text-[#f3dcb5] mb-2.5">
              Verified India Compliance (PAN • Udyam • Bank • GST)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {deal.compliance_items.slice(0, 4).map((c, i) => (
                <div key={i} className="p-2.5 rounded-xl bg-black/40 border border-white/10 text-xs flex items-center justify-between">
                  <span className="text-zinc-200 font-medium truncate pr-2">{c.step}</span>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold shrink-0">✓ {c.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mb-8">
          <h3 className="text-xs uppercase font-bold tracking-widest text-zinc-400 mb-3">
            3-Stage Escrow Vault Milestone Status
          </h3>
          <div className="space-y-2.5">
            {deal.tranches.map((t, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">{t.name} ({t.share}%)</span>
                  <span className="text-[11px] text-zinc-400 font-mono">Audit: {t.proof}</span>
                </div>
                <span className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase ${
                  t.status === 'RELEASED' ? 'bg-emerald-500/20 text-emerald-400' : t.status === 'IN_ESCROW' ? 'bg-amber-500/20 text-amber-300' : 'bg-zinc-800 text-zinc-400'
                }`}>
                  {t.status.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>

        <button 
          onClick={() => { onOpenSimulator(deal); onClose(); }}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-[#f3dcb5] via-[#edd0a3] to-[#f3dcb5] text-black font-bold text-xs uppercase tracking-widest hover:brightness-105 transition-all shadow-[0_0_25px_rgba(243,220,181,0.25)] cursor-pointer"
        >
          Select Deal in Yield Simulator →
        </button>
      </div>
    </div>
  );
}

// ==========================================
// 4. LUXURY DEAL CARD
// ==========================================
function DealCard({ deal, onSelectDeal, actionLabel }) {
  const raised = deal?.raisedAmountINR || 0;
  const target = Math.max(deal?.targetAmountINR || 1, 1);
  const progressPercent = Math.min((raised / target) * 100, 100);
  const isRevShare = deal.structure === 'REVENUE_SHARE';
  const isVip = deal.subscription_tier === 'SCALE_VIP';

  const formatMoney = (valINR) => `₹${Math.round(valINR || 0).toLocaleString('en-IN')}`;

  return (
    <div className={`group relative bg-[#130b1c]/90 border rounded-2xl p-7 transition-all duration-300 hover:border-[#d9b3d0]/40 hover:shadow-[0_0_30px_rgba(217,179,208,0.1)] flex flex-col justify-between ${
      isVip ? 'border-[#f3dcb5]/40' : 'border-white/10'
    }`}>
      <div>
        <div className="flex justify-between items-center mb-4">
          <span className="px-3 py-1 text-[10px] font-semibold tracking-wider uppercase rounded-full bg-white/5 border border-white/10 text-zinc-300">
            {deal.category}
          </span>
          <span className={`px-3 py-1 text-[10px] font-bold tracking-wider uppercase rounded-full border ${
            isVip
              ? 'bg-amber-400/15 border-amber-400/40 text-[#f3dcb5]'
              : isRevShare
              ? 'bg-[#f3dcb5]/10 border-[#f3dcb5]/30 text-[#f3dcb5]'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
          }`}>
            {isVip ? '⚡ VIP Accelerated' : isRevShare ? 'Revenue Share' : 'Milestone SAFE'}
          </span>
        </div>

        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#d9b3d0] transition-colors leading-snug">
          {deal.title}
        </h3>
        
        <p className="text-xs text-zinc-400 mb-3 flex items-center gap-1.5 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          {deal.location} • {deal.founder_name || 'Verified Founder'}
        </p>

        <p className="text-sm text-zinc-400 line-clamp-2 mb-7 leading-relaxed font-normal">
          {deal.description}
        </p>
      </div>

      <div>
        <div className="mb-5">
          <div className="flex justify-between text-xs font-semibold mb-2">
            <span className="text-white font-mono">{formatMoney(raised)} <span className="text-zinc-500 font-sans font-normal">funded</span></span>
            <span className="text-zinc-400 font-mono">{Math.round(progressPercent)}%</span>
          </div>
          <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
            <div 
              className="h-full bg-gradient-to-r from-[#d9b3d0] to-[#f3dcb5] rounded-full transition-all duration-700"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 py-3.5 border-t border-white/10 text-center bg-black/30 rounded-xl mb-5">
          <div>
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-semibold mb-0.5">Backers</span>
            <span className="text-xs font-bold text-white font-mono">{deal.backers}/199</span>
          </div>
          <div className="border-x border-white/10">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-semibold mb-0.5">Cap</span>
            <span className="text-xs font-bold text-white font-mono">{isRevShare ? `${deal.returnCapMultiple}x` : 'Equity'}</span>
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-semibold mb-0.5">Royalty</span>
            <span className="text-xs font-bold text-white font-mono">{isRevShare ? `${deal.royaltyPercent}%` : 'SAFE'}</span>
          </div>
        </div>

        <button 
          onClick={() => onSelectDeal(deal)}
          className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-zinc-200 hover:bg-[#f3dcb5] hover:text-black hover:border-transparent transition-all duration-200 text-xs font-bold tracking-wide uppercase cursor-pointer"
        >
          {actionLabel || 'View Deal & 1-Min Pitch →'}
        </button>
      </div>
    </div>
  );
}

// ==========================================
// 5. INVESTOR SYNDICATE PORTAL
// ==========================================
function InvestorPage({ user, deals, onCommitCapital }) {
  const [selectedDeal, setSelectedDeal] = useState(deals[0] || null);
  const [detailModalDeal, setDetailModalDeal] = useState(null);
  const [pledgeAmount, setPledgeAmount] = useState(25000);
  const [monthlyRevSim, setMonthlyRevSim] = useState(375000);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (deals.length > 0) {
      const updated = deals.find(d => selectedDeal && d.id === selectedDeal.id) || deals[0];
      setSelectedDeal(updated);
    }
  }, [deals]);

  const formatMoney = (valINR) => `₹${Math.round(valINR || 0).toLocaleString('en-IN')}`;
const allInvestments = deals.flatMap(d =>
    (d.investments || []).map(inv => ({
      dealId: d.id,
      title: d.title,
      investorName: inv.investor_name,
      investorEmail: (inv.investor_email || '').toLowerCase(),
      investedINR: inv.amount_inr,
      returnCapINR: inv.expected_return_inr,
      royaltiesEarnedINR: inv.repaid_amount_inr,
      royaltyRate: d.structure === 'REVENUE_SHARE' ? `${d.royaltyPercent}%` : 'SAFE Equity',
      nextPayoutDate: "Nov 05, 2026",
      escrowStatus: `${d.tranches?.filter(t => t.status === 'RELEASED').length || 0}/3 Tranches Released`,
    }))
  );

  // Filter strictly by the logged-in investor's email or name
  const myPortfolio = allInvestments.filter(
    inv => inv.investorEmail === (user.email || '').toLowerCase() || inv.investorName === user.name
  );
  const totalDeployed = myPortfolio.reduce((acc, item) => acc + item.investedINR, 0);
  const totalEarned = myPortfolio.reduce((acc, item) => acc + item.royaltiesEarnedINR, 0);
  const totalExpectedReturn = myPortfolio.reduce((acc, item) => acc + item.returnCapINR, 0);

  if (!selectedDeal) return null;

  const isRevShare = selectedDeal.structure === 'REVENUE_SHARE';
  const returnMultiple = isRevShare ? selectedDeal.returnCapMultiple : 1.5;
  const projectedReturn = pledgeAmount * returnMultiple;
  const projectedProfit = Math.max(projectedReturn - pledgeAmount, 0);

  const monthlyRoyaltyPool = monthlyRevSim * ((selectedDeal.royaltyPercent || 6) / 100);
  const estMonths = monthlyRoyaltyPool > 0
    ? Math.ceil((selectedDeal.targetAmountINR * returnMultiple) / monthlyRoyaltyPool)
    : null;

  const filteredDeals = deals.filter((deal) => {
    if (activeFilter === 'REVENUE_SHARE') return deal.structure === 'REVENUE_SHARE';
    if (activeFilter === 'SAFE_EQUITY') return deal.structure === 'SAFE_EQUITY';
    return true;
  });

  const handleInvest = async () => {
    await onCommitCapital(selectedDeal.id, pledgeAmount, user.name, user.email);
    setToast(`Committed ${formatMoney(pledgeAmount)} to ${selectedDeal.title} Escrow Vault!`);
    setTimeout(() => setToast(null), 4000);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 lg:px-12 pt-6 pb-32 w-full">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-6 py-4 rounded-2xl bg-[#160d22] border border-[#f3dcb5] text-white shadow-[0_0_40px_rgba(243,220,181,0.25)] flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-bold tracking-wide">{toast}</span>
        </div>
      )}

      {detailModalDeal && (
        <DealDetailsModal 
          deal={detailModalDeal} 
          onClose={() => setDetailModalDeal(null)} 
          onOpenSimulator={(deal) => setSelectedDeal(deal)}
        />
      )}

      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 pb-6 border-b border-white/10 gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f3dcb5]/10 border border-[#f3dcb5]/30 text-[#f3dcb5] text-[10px] font-mono uppercase tracking-widest mb-3">
            Investor Syndicate Portal • Section 42 Accredited
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white">
            Investor Portfolio, <span className="font-serif-luxury italic font-normal text-[#f3dcb5]">{user.name}</span>
          </h1>
        </div>
        <div className="flex items-center gap-3 bg-white/[0.03] border border-white/10 px-5 py-3 rounded-2xl">
          <div className="text-right">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 block">Escrow Wallet Balance</span>
            <span className="text-sm font-bold text-white font-mono">₹2,50,000 Available</span>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-14">
        <div className="p-6 rounded-2xl bg-[#130b1c]/90 border border-white/10">
          <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block mb-2">Total Syndicate Capital</span>
          <span className="text-3xl font-bold text-white font-mono">{formatMoney(totalDeployed)}</span>
          <span className="text-[11px] text-emerald-400 block mt-2">Across {myPortfolio.length} active position(s)</span>
        </div>

        <div className="p-6 rounded-2xl bg-[#130b1c]/90 border border-white/10">
          <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block mb-2">Royalties Collected</span>
          <span className="text-3xl font-bold text-[#f3dcb5] font-mono">{formatMoney(totalEarned)}</span>
          <span className="text-[11px] text-zinc-400 block mt-2">Auto-debited via POS / GSTN</span>
        </div>

        <div className="p-6 rounded-2xl bg-[#130b1c]/90 border border-white/10">
          <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block mb-2">Contracted Return Cap</span>
          <span className="text-3xl font-bold text-[#d9b3d0] font-mono">{formatMoney(totalExpectedReturn)}</span>
          <span className="text-[11px] text-zinc-400 block mt-2">1.4x – 1.5x Multiple Target</span>
        </div>

        <div className="p-6 rounded-2xl bg-[#130b1c]/90 border border-white/10">
          <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block mb-2">Escrow Vault Protection</span>
          <span className="text-3xl font-bold text-emerald-400 font-mono">100%</span>
          <span className="text-[11px] text-zinc-400 block mt-2">RBI Trustee Milestone Gated</span>
        </div>
      </div>

      <div className="bg-[#140c1d] border border-[#f3dcb5]/30 rounded-3xl p-8 lg:p-10 shadow-2xl mb-16">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 mb-8 border-b border-white/10 gap-4">
          <div>
            <span className="text-xs uppercase tracking-widest text-[#f3dcb5] font-bold block mb-1">
              Interactive Yield & Zero-Division Escrow Simulator
            </span>
            <h2 className="text-2xl lg:text-3xl font-extrabold text-white">
              {selectedDeal.title}
            </h2>
          </div>
          <span className="px-3.5 py-1.5 rounded-full text-xs font-mono font-bold bg-white/5 border border-white/10 text-[#d9b3d0]">
            {selectedDeal.backers}/199 Sec 42 Slots Filled
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs uppercase font-bold tracking-wider text-zinc-400">
                  1. Select Your Pledge Amount
                </label>
                <span className="text-2xl font-extrabold text-[#f3dcb5] font-mono">
                  {formatMoney(pledgeAmount)}
                </span>
              </div>
              <input 
                type="range" 
                min="5000" 
                max="100000" 
                step="5000"
                value={pledgeAmount}
                onChange={(e) => setPledgeAmount(Number(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#f3dcb5]"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs uppercase font-bold tracking-wider text-zinc-400">
                  2. Simulate Monthly Shop Sales (Test ₹0 Grace Period)
                </label>
                <span className="text-lg font-bold text-[#d9b3d0] font-mono">
                  {formatMoney(monthlyRevSim)}/mo
                </span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="1000000" 
                step="25000"
                value={monthlyRevSim}
                onChange={(e) => setMonthlyRevSim(Number(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#d9b3d0]"
              />
              {monthlyRevSim === 0 && (
                <p className="text-xs font-mono text-amber-300 mt-2 bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-xl">
                  ✓ Zero-Revenue Grace Mode Active: ₹0 Royalty Due This Month. Zero Default Penalty!
                </p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              {selectedDeal.tranches.map((t, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-black/40 border border-white/10">
                  <span className="text-[10px] font-mono text-[#d9b3d0] block mb-1">{t.share}% Tranche</span>
                  <p className="text-xs font-bold text-white truncate mb-1">{t.name}</p>
                  <span className="text-[11px] font-mono text-zinc-400">{formatMoney((pledgeAmount * t.share) / 100)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 p-6 rounded-2xl bg-black/50 border border-white/10 space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-zinc-400">Total Maturity Payout</span>
              <span className="font-mono font-bold text-white text-lg">{formatMoney(projectedReturn)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-zinc-400">Net Projected Profit</span>
              <span className="font-mono font-bold text-emerald-400 text-lg">+{formatMoney(projectedProfit)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-zinc-400">Est. Payback Speed</span>
              <span className="font-mono font-bold text-[#d9b3d0]">
                {estMonths ? `~${estMonths} Months` : 'Paused (Grace Mode)'}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm pb-4 border-b border-white/10">
              <span className="text-zinc-400">Revenue Share Royalty</span>
              <span className="font-mono font-bold text-[#f3dcb5]">{isRevShare ? `${selectedDeal.royaltyPercent}% Monthly` : 'SAFE Conversion'}</span>
            </div>

            <button 
              onClick={handleInvest}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-[#f3dcb5] via-[#edd0a3] to-[#f3dcb5] text-black font-bold text-xs uppercase tracking-widest hover:brightness-105 transition-all shadow-[0_0_25px_rgba(243,220,181,0.25)] cursor-pointer"
            >
              Commit {formatMoney(pledgeAmount)} to Escrow Vault →
            </button>
          </div>
        </div>
      </div>

      <div>
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Verified Private Deals</h2>
            <p className="text-xs text-zinc-400 mt-1">Click any card to watch the 1-Min Founder Pitch & inspect escrow proofs</p>
          </div>
          <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
            <button 
              onClick={() => setActiveFilter('ALL')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeFilter === 'ALL' ? 'bg-[#f3dcb5] text-black shadow' : 'text-zinc-400 hover:text-white'
              }`}
            >
              All ({deals.length})
            </button>
            <button 
              onClick={() => setActiveFilter('REVENUE_SHARE')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeFilter === 'REVENUE_SHARE' ? 'bg-[#f3dcb5] text-black shadow' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Revenue Share
            </button>
            <button 
              onClick={() => setActiveFilter('SAFE_EQUITY')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeFilter === 'SAFE_EQUITY' ? 'bg-[#f3dcb5] text-black shadow' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Milestone SAFE
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
          {filteredDeals.map((deal) => (
            <DealCard 
              key={deal.id} 
              deal={deal} 
              onSelectDeal={(d) => setDetailModalDeal(d)}
              actionLabel="Watch Pitch & View Escrow →"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 6. FOUNDER STUDIO (WITH AI COMPLIANCE LAUNCHPAD & VIP TIERS)
// ==========================================
function FounderPage({ user, deals, onUnlockTranche, onCreateDeal, onSimulateMonth }) {
  const [selectedDealId, setSelectedDealId] = useState(deals[0]?.id);
  const founderDeal = deals.find(d => d.id === selectedDealId) || deals[0];

  const [showNewPitch, setShowNewPitch] = useState(false);
  const [rawIdea, setRawIdea] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Physical Retail');
  const [newLocation, setNewLocation] = useState('Guwahati, Assam');
  const [newTarget, setNewTarget] = useState('600000');
  const [newRoyalty, setNewRoyalty] = useState('7.0');
  const [newTier, setNewTier] = useState('SCALE_VIP');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [aiBlueprint, setAiBlueprint] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [toast, setToast] = useState(null);

  if (!founderDeal) return null;

  const formatMoney = (valINR) => `₹${Math.round(valINR || 0).toLocaleString('en-IN')}`;

  const releasedShare = founderDeal.tranches
    .filter(t => t.status === 'RELEASED')
    .reduce((sum, t) => sum + t.share, 0);
  
  const unlockedCapital = (founderDeal.raisedAmountINR * releasedShare) / 100;
  const lockedCapital = Math.max(0, founderDeal.raisedAmountINR - unlockedCapital);

  const handleRunAiCoach = async () => {
    if (!rawIdea.trim()) {
      alert("Type your raw business or startup idea first!");
      return;
    }
    setLoadingAi(true);
    try {
      const res = await fetch(`${API_BASE}/api/ai/coach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          raw_idea: rawIdea,
          location: newLocation,
          target_amount_inr: Number(newTarget) || 500000,
          subscription_tier: newTier,
        }),
      });
      const data = await res.json();
      setAiBlueprint(data);
      setNewTitle(data.suggested_title || rawIdea.slice(0, 35));
      setNewCategory(data.category === 'Digital' ? 'Digital SaaS' : 'Physical Retail');
      setNewRoyalty(String(data.recommended_royalty_percent || 6.5));
      setToast("✨ AI Generated PAN/GST Compliance Roadmap & 60s Pitch Script!");
      setTimeout(() => setToast(null), 4000);
    } catch (e) {
      alert("Could not reach AI Coach endpoint.");
    } finally {
      setLoadingAi(false);
    }
  };

  const handleVerifyTranche = async (idx) => {
    await onUnlockTranche(founderDeal.id, idx);
    setToast(`Tranche #${idx + 1} GST Invoice Verified! Funds disbursed to operating account.`);
    setTimeout(() => setToast(null), 4000);
  };

  const handleLaunchCampaign = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    await onCreateDeal({
      title: newTitle,
      founder_name: user.name,
      category: newCategory,
      domain: aiBlueprint?.domain || newCategory,
      location: newLocation,
      structure_type: "ROYALTY",
      subscription_tier: newTier,
      target_amount_inr: Number(newTarget) || 500000,
      royalty_percent: Number(newRoyalty) || 6.5,
      return_cap_multiple: aiBlueprint?.recommended_return_cap || 1.4,
      est_monthly_revenue_inr: aiBlueprint?.est_monthly_revenue_inr || 300000,
      pitch_video_url: newVideoUrl || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      pitch_script_summary: aiBlueprint?.pitch_script_60s || "Founder-launched regional growth syndicate with 3-stage RBI trustee escrow protection.",
      compliance_items: aiBlueprint?.compliance_checklist || [],
      challenges_items: aiBlueprint?.challenges || [],
      growth_playbook_items: aiBlueprint?.growth_playbook || [],
      milestones: aiBlueprint?.recommended_milestones || [],
    });
    setShowNewPitch(false);
    setNewTitle('');
    setRawIdea('');
    setAiBlueprint(null);
    setToast("New Syndicate Campaign Launched to Marketplace!");
    setTimeout(() => setToast(null), 4000);
  };

  const handleSimulateMonthlyPOS = async () => {
    await onSimulateMonth(founderDeal.id, 420000);
    setToast("Simulated ₹4,20,000 POS Revenue! Monthly Royalties auto-distributed to backers.");
    setTimeout(() => setToast(null), 4000);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 lg:px-12 pt-6 pb-32 w-full">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-6 py-4 rounded-2xl bg-[#160d22] border border-emerald-400 text-white shadow-[0_0_40px_rgba(16,185,129,0.25)] flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-bold tracking-wide">{toast}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 pb-6 border-b border-white/10 gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d9b3d0]/10 border border-[#d9b3d0]/30 text-[#d9b3d0] text-[10px] font-mono uppercase tracking-widest mb-3">
            Founder Studio • AI Readiness & GSTN Oracle Connected
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white">
            Founder Studio, <span className="font-serif-luxury italic font-normal text-[#f3dcb5]">{user.name}</span>
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={founderDeal.id}
            onChange={(e) => setSelectedDealId(Number(e.target.value))}
            className="px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-xs font-bold text-white focus:outline-none"
          >
            {deals.map(d => (
              <option key={d.id} value={d.id} className="bg-[#140c1d] text-white">
                Manage: {d.title}
              </option>
            ))}
          </select>
          <button 
            onClick={() => setShowNewPitch(!showNewPitch)}
            className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#f3dcb5] to-[#e7c896] text-black font-bold text-xs uppercase tracking-wider hover:scale-[1.02] transition-all cursor-pointer shadow-[0_0_25px_rgba(243,220,181,0.25)]"
          >
            {showNewPitch ? 'Close AI Launchpad' : '+ AI Idea-to-Deal Launchpad'}
          </button>
        </div>
      </div>

      {showNewPitch && (
        <form onSubmit={handleLaunchCampaign} className="mb-12 p-8 rounded-3xl bg-[#150c21] border border-[#f3dcb5]/40 shadow-2xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#f3dcb5] block">
                Step 1: Zero-Knowledge Founder Incubator
              </span>
              <h3 className="text-2xl font-bold text-white">AI Startup Readiness, Indian Law & Pitch Architect</h3>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
              PAN • Udyam • Bank • GST • 60s Pitch
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-[#f3dcb5] block">
              Have a raw idea but don't know the legal/business process? Describe it below:
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={rawIdea}
                onChange={(e) => setRawIdea(e.target.value)}
                placeholder="e.g. I want to open an artisan cold-brew coffee cart near my college in Pune needing ₹4 Lakh..."
                className="flex-1 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/15 text-white text-sm focus:border-[#f3dcb5] focus:outline-none"
              />
              <button
                type="button"
                onClick={handleRunAiCoach}
                disabled={loadingAi}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#d9b3d0] to-[#f3dcb5] text-black font-extrabold text-xs uppercase tracking-wider cursor-pointer shrink-0"
              >
                {loadingAi ? 'Analyzing Idea...' : '✨ Generate AI Guide & Pitch'}
              </button>
            </div>
          </div>

          {aiBlueprint && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 p-5 rounded-2xl bg-black/50 border border-[#f3dcb5]/30">
              <div className="space-y-2.5">
                <h4 className="text-xs font-mono uppercase tracking-widest text-[#f3dcb5] font-bold">
                  ✓ Mandatory Indian Legal Checklist Before Approaching Investors
                </h4>
                {aiBlueprint.compliance_checklist.map((item, i) => (
                  <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs">
                    <div className="flex justify-between font-bold text-white mb-0.5">
                      <span>{item.step}</span>
                      <span className="text-[10px] font-mono text-emerald-400">{item.authority}</span>
                    </div>
                    <p className="text-zinc-400 text-[11px]">{item.detail}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-mono uppercase tracking-widest text-[#d9b3d0] font-bold mb-2">
                    🎤 AI-Generated 60-Second Video Pitch Script
                  </h4>
                  <p className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs text-zinc-200 italic leading-relaxed">
                    "{aiBlueprint.pitch_script_60s}"
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-mono uppercase tracking-widest text-amber-300 font-bold mb-2">
                    ⚠️ Key Challenges & How VentureLink Protects You
                  </h4>
                  <div className="space-y-2">
                    {aiBlueprint.challenges.map((ch, i) => (
                      <div key={i} className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-[11px]">
                        <span className="font-bold text-white">{ch.risk}: </span>
                        <span className="text-zinc-400">{ch.solution}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-[11px] font-mono uppercase text-zinc-400 block mb-1.5">Venture Title</label>
              <input 
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Brahmaputra Artisan Tea Co."
                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white text-sm"
              />
            </div>
            <div>
              <label className="text-[11px] font-mono uppercase text-zinc-400 block mb-1.5">Target Raise (INR)</label>
              <input 
                type="number"
                required
                value={newTarget}
                onChange={(e) => setNewTarget(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white text-sm font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] font-mono uppercase text-zinc-400 block mb-1.5">Monthly Royalty (%)</label>
              <input 
                type="number"
                step="0.5"
                required
                value={newRoyalty}
                onChange={(e) => setNewRoyalty(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white text-sm font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] font-mono uppercase text-[#f3dcb5] block mb-1.5">Growth Tier Plan</label>
              <select
                value={newTier}
                onChange={(e) => setNewTier(e.target.value)}
                className="w-full px-3 py-3 rounded-xl bg-black/60 border border-[#f3dcb5]/40 text-white text-xs font-bold"
              >
                <option value="STARTER">Starter (₹0 • 2.5% Fee)</option>
                <option value="GROWTH_PRO">Growth Pro (₹1,999 • 2.0% Fee)</option>
                <option value="SCALE_VIP">⚡ Scale-Up VIP (₹9,999 • Hands-On Growth Help)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-mono uppercase text-zinc-400 block mb-1.5">
              1-Minute Founder Pitch Video URL (MP4 / Loom / YouTube Shorts)
            </label>
            <input
              type="text"
              value={newVideoUrl}
              onChange={(e) => setNewVideoUrl(e.target.value)}
              placeholder="Leave blank to attach default demo pitch video"
              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-mono"
            />
          </div>

          <button type="submit" className="px-8 py-4 rounded-xl bg-gradient-to-r from-[#f3dcb5] to-[#e7c896] text-black font-bold text-xs uppercase tracking-widest cursor-pointer shadow-lg">
            Deploy 3-Stage Escrow Contract & Publish Deal →
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-14">
        <div className="p-6 rounded-2xl bg-[#130b1c]/90 border border-white/10">
          <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block mb-2">Total Syndicate Raised</span>
          <span className="text-3xl font-bold text-white font-mono">{formatMoney(founderDeal.raisedAmountINR)}</span>
          <span className="text-[11px] text-zinc-400 block mt-2">Target: {formatMoney(founderDeal.targetAmountINR)}</span>
        </div>

        <div className="p-6 rounded-2xl bg-[#130b1c]/90 border border-white/10">
          <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block mb-2">Disbursed to Bank</span>
          <span className="text-3xl font-bold text-emerald-400 font-mono">{formatMoney(unlockedCapital)}</span>
          <span className="text-[11px] text-emerald-400/80 block mt-2">{releasedShare}% Milestone Verified</span>
        </div>

        <div className="p-6 rounded-2xl bg-[#130b1c]/90 border border-white/10">
          <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block mb-2">Held in Escrow Vault</span>
          <span className="text-3xl font-bold text-[#f3dcb5] font-mono">{formatMoney(lockedCapital)}</span>
          <span className="text-[11px] text-zinc-400 block mt-2">Unlocks on invoice upload</span>
        </div>

        <div className="p-6 rounded-2xl bg-[#130b1c]/90 border border-white/10">
          <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block mb-2">Section 42 Cap</span>
          <span className="text-3xl font-bold text-[#d9b3d0] font-mono">{founderDeal.backers}/199</span>
          <span className="text-[11px] text-zinc-400 block mt-2">{199 - founderDeal.backers} Private Slots Remaining</span>
        </div>
      </div>

      <div className="bg-[#140c1d] border border-white/15 rounded-3xl p-8 lg:p-10 shadow-2xl mb-14">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 mb-8 border-b border-white/10 gap-4">
          <div>
            <span className="text-xs uppercase tracking-widest text-[#d9b3d0] font-bold block mb-1">
              RBI Trustee Escrow Engine (Simulated)
            </span>
            <h2 className="text-2xl lg:text-3xl font-extrabold text-white">
              {founderDeal.title} — Milestone Releases
            </h2>
          </div>
          <span className="px-3.5 py-1.5 rounded-full text-xs font-mono font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            Zero-Dilution Revenue Share ({founderDeal.royaltyPercent}%)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {founderDeal.tranches.map((tranche, idx) => {
            const trancheINR = (founderDeal.raisedAmountINR * tranche.share) / 100;
            const isReleased = tranche.status === 'RELEASED';

            return (
              <div key={idx} className={`p-6 rounded-2xl border flex flex-col justify-between ${
                isReleased 
                  ? 'bg-emerald-950/15 border-emerald-500/30' 
                  : 'bg-black/40 border-white/10'
              }`}>
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono font-bold text-zinc-300">STAGE 0{idx + 1} ({tranche.share}%)</span>
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      isReleased 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {tranche.status.replace('_', ' ')}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-1">{tranche.name}</h3>
                  <p className="text-2xl font-bold font-mono text-[#f3dcb5] mb-3">{formatMoney(trancheINR)}</p>
                  <p className="text-xs text-zinc-400 font-mono mb-6">
                    Audit Status: {tranche.proof}
                  </p>
                </div>

                {isReleased ? (
                  <div className="w-full py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center text-xs font-mono font-bold text-emerald-400">
                    ✓ Disbursed to Operating Account
                  </div>
                ) : (
                  <button 
                    onClick={() => handleVerifyTranche(idx)}
                    className="w-full py-3 rounded-xl bg-[#f3dcb5] text-black font-bold text-xs uppercase tracking-wider hover:bg-[#e5cca3] transition-all cursor-pointer shadow-md"
                  >
                    Upload GST Invoice & Unlock →
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-8 rounded-3xl bg-[#130b1c]/90 border border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-white">Automated Monthly Royalty Ledger (GSTN / POS Linked)</h3>
            <p className="text-xs text-zinc-400">Simulated India Stack Account Aggregator sales feed</p>
          </div>
          <button
            onClick={handleSimulateMonthlyPOS}
            className="px-5 py-2.5 rounded-xl bg-white/10 border border-[#f3dcb5]/40 text-[#f3dcb5] hover:bg-[#f3dcb5] hover:text-black text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
          >
            + Simulate Next Month POS Sales (₹4.2L)
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-4 rounded-xl bg-black/40 border border-white/5">
            <span className="text-zinc-500 block mb-1">LATEST GROSS POS SALES</span>
            <span className="text-base font-bold text-white">{formatMoney(founderDeal.est_monthly_revenue_inr || 375000)}</span>
          </div>
          <div className="p-4 rounded-xl bg-black/40 border border-white/5">
            <span className="text-zinc-500 block mb-1">{founderDeal.royaltyPercent}% ROYALTY DISTRIBUTED</span>
            <span className="text-base font-bold text-[#f3dcb5]">{formatMoney(founderDeal.total_repaid_inr || 24375)} Total Paid</span>
          </div>
          <div className="p-4 rounded-xl bg-black/40 border border-white/5">
            <span className="text-zinc-500 block mb-1">REMAINING {founderDeal.returnCapMultiple}x CAP BALANCE</span>
            <span className="text-base font-bold text-emerald-400">{formatMoney(founderDeal.remaining_obligation_inr || 500625)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 7. MASTER ADMIN CONTROL CENTER (STEALTH GOD MODE + CLICKABLE DRILLDOWN CARDS)
// ==========================================
function AdminPage({ user, onRefreshGlobal }) {
  const [overview, setOverview] = useState(null);
  const [toast, setToast] = useState(null);
  const [activeDrilldown, setActiveDrilldown] = useState(null);

  const fetchAdminOverview = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/overview`);
      const data = await res.json();
      setOverview(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchAdminOverview();
  }, []);

  const showNotice = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const handleDeleteUser = async (userId, name) => {
    await fetch(`${API_BASE}/api/admin/users/${userId}`, { method: 'DELETE' });
    await fetchAdminOverview();
    showNotice(`Removed user account: ${name}`);
  };

  const handleDeleteInvestment = async (invId, investorName, amount) => {
    await fetch(`${API_BASE}/api/admin/investments/${invId}`, { method: 'DELETE' });
    await fetchAdminOverview();
    await onRefreshGlobal();
    showNotice(`Refunded & deleted ₹${amount.toLocaleString('en-IN')} pledge from ${investorName}`);
  };

  const handleDeleteDeal = async (dealId, title) => {
    await fetch(`${API_BASE}/api/admin/deals/${dealId}`, { method: 'DELETE' });
    await fetchAdminOverview();
    await onRefreshGlobal();
    showNotice(`Deleted syndicate campaign: ${title}`);
  };

  const handleResetDatabase = async () => {
    await fetch(`${API_BASE}/api/reset-demo`, { method: 'POST' });
    await fetchAdminOverview();
    await onRefreshGlobal();
    showNotice("Database reset to clean hackathon seed state!");
  };

  const formatMoney = (val) => `₹${Math.round(val || 0).toLocaleString('en-IN')}`;

  if (!overview) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-20 text-center font-mono text-zinc-400">
        Loading Master Admin Command Center...
      </div>
    );
  }

  const { platform_revenue, users, investments, deals } = overview;
  const totalRoyaltyAndAudit = platform_revenue.royalty_fees_inr + platform_revenue.audit_fees_inr;

  return (
    <div className="max-w-6xl mx-auto px-6 lg:px-12 pt-6 pb-32 w-full space-y-12">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-6 py-4 rounded-2xl bg-[#160d22] border border-[#f3dcb5] text-white shadow-2xl flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-ping" />
          <span className="text-xs font-bold tracking-wide">{toast}</span>
        </div>
      )}

      {activeDrilldown && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
          onClick={() => setActiveDrilldown(null)}
        >
          <div 
            className="w-full max-w-xl bg-[#140c1d] border border-[#f3dcb5]/40 rounded-3xl p-8 shadow-2xl space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#f3dcb5] block">
                  Live Unit Economics Audit Trail
                </span>
                <h3 className="text-xl font-bold text-white">
                  {activeDrilldown === 'TOTAL' && 'Total VentureLink Revenue Breakdown'}
                  {activeDrilldown === 'SAAS' && 'VIP & Pro SaaS Subscription Breakdown'}
                  {activeDrilldown === 'ESCROW' && 'Escrow Structuring Fee Breakdown'}
                  {activeDrilldown === 'ROYALTY' && 'Royalty Routing & Audit Fee Breakdown'}
                </h3>
              </div>
              <button 
                onClick={() => setActiveDrilldown(null)}
                className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer"
              >
                &times;
              </button>
            </div>

            {activeDrilldown === 'TOTAL' && (
              <div className="space-y-4 text-xs font-mono">
                <p className="text-zinc-300 font-sans leading-relaxed">
                  VentureLink operates a diversified neo-fintech monetization model combining SaaS subscription tiers with transaction-gated escrow structuring fees and automated monthly royalty routing.
                </p>
                <div className="space-y-2.5">
                  <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex justify-between items-center">
                    <span className="text-zinc-400">1. SaaS Subscriptions (Scale VIP + Growth Pro)</span>
                    <span className="text-white font-bold">{formatMoney(platform_revenue.saas_revenue_inr)}</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex justify-between items-center">
                    <span className="text-zinc-400">2. Escrow Structuring Fees (1.5% - 2.5%)</span>
                    <span className="text-emerald-400 font-bold">{formatMoney(platform_revenue.escrow_fees_inr)}</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex justify-between items-center">
                    <span className="text-zinc-400">3. Monthly Royalty Routing (1% fee) & Audits</span>
                    <span className="text-[#d9b3d0] font-bold">{formatMoney(totalRoyaltyAndAudit)}</span>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-[#f3dcb5]/10 border border-[#f3dcb5]/30 flex justify-between items-center text-sm font-bold">
                  <span className="text-[#f3dcb5]">Total Net Platform Revenue:</span>
                  <span className="text-white">{formatMoney(platform_revenue.total_revenue_inr)}</span>
                </div>
              </div>
            )}

            {activeDrilldown === 'SAAS' && (
              <div className="space-y-4 text-xs font-mono">
                <p className="text-zinc-300 font-sans leading-relaxed">
                  Founders select a monthly growth tier when publishing their syndicate campaign. Fees are collected upfront upon contract deployment.
                </p>
                <div className="space-y-2.5">
                  <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex justify-between items-center">
                    <div>
                      <span className="text-white font-bold block">Scale-Up VIP Tier (₹9,999/mo)</span>
                      <span className="text-[10px] text-zinc-400">Includes AI compliance coach & growth concierge</span>
                    </div>
                    <span className="text-[#f3dcb5] font-bold">₹9,999</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex justify-between items-center">
                    <div>
                      <span className="text-white font-bold block">Growth Pro Tier (₹1,999/mo)</span>
                      <span className="text-[10px] text-zinc-400">Includes automated GSTN oracle feeds</span>
                    </div>
                    <span className="text-emerald-400 font-bold">₹1,999</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex justify-between items-center">
                    <div>
                      <span className="text-white font-bold block">Starter Tier (₹0/mo)</span>
                      <span className="text-[10px] text-zinc-400">Basic 3-stage escrow vault</span>
                    </div>
                    <span className="text-zinc-500 font-bold">₹0</span>
                  </div>
                </div>
              </div>
            )}

            {activeDrilldown === 'ESCROW' && (
              <div className="space-y-4 text-xs font-mono">
                <p className="text-zinc-300 font-sans leading-relaxed">
                  Unlike traditional lump-sum crowdfunding, VentureLink locks capital in an RBI trustee escrow vault. When founders upload verified GST invoices, a minor structuring fee is deducted upon tranche release:
                </p>
                <div className="space-y-2.5">
                  {deals.map(d => {
                    const releasedTranches = (d.tranches || []).filter(t => t.status === 'RELEASED');
                    const feePct = d.escrow_fee_percent || 2.5;
                    const dealEscrowFee = releasedTranches.reduce((acc, t) => acc + (t.amount_inr * (feePct / 100)), 0);
                    return (
                      <div key={d.id} className="p-3 rounded-xl bg-black/40 border border-white/10 flex justify-between items-center">
                        <div>
                          <span className="text-white font-bold block">{d.title}</span>
                          <span className="text-[10px] text-zinc-400">{feePct}% Fee on {releasedTranches.length} Released Tranches</span>
                        </div>
                        <span className="text-emerald-400 font-bold">{formatMoney(dealEscrowFee)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeDrilldown === 'ROYALTY' && (
              <div className="space-y-4 text-xs font-mono">
                <p className="text-zinc-300 font-sans leading-relaxed">
                  Every time a founder simulates monthly POS sales, VentureLink automatically routes the monthly gross revenue share to backers, retaining a 1% protocol routing fee plus a one-time ₹999 compliance audit fee.
                </p>
                <div className="space-y-2.5">
                  <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex justify-between items-center">
                    <span className="text-zinc-400">1% Monthly Royalty Routing Fees</span>
                    <span className="text-[#f3dcb5] font-bold">{formatMoney(platform_revenue.royalty_fees_inr)}</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex justify-between items-center">
                    <span className="text-zinc-400">One-Time Compliance Audit Fees</span>
                    <span className="text-[#d9b3d0] font-bold">{formatMoney(platform_revenue.audit_fees_inr)}</span>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => setActiveDrilldown(null)}
              className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              Close Audit Modal
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-end justify-between pb-6 border-b border-white/10 gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[10px] font-mono uppercase tracking-widest mb-3">
            ⚡ Master Admin Command Center • SQLite Database (`venturelink.db`)
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white">
            Platform Control, <span className="font-serif-luxury italic font-normal text-[#f3dcb5]">{user.name}</span>
          </h1>
        </div>
        <button
          onClick={handleResetDatabase}
          className="px-5 py-3 rounded-xl bg-white/5 border border-white/15 hover:border-[#f3dcb5] text-xs font-mono font-bold text-[#f3dcb5] cursor-pointer transition-all"
        >
          ↻ Reset Demo Database to Seed State
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div 
          onClick={() => setActiveDrilldown('TOTAL')}
          className="p-6 rounded-2xl bg-[#130b1c]/90 border border-[#f3dcb5]/40 hover:border-[#f3dcb5] hover:scale-[1.02] cursor-pointer transition-all group shadow-xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#f3dcb5]/5 rounded-bl-full pointer-events-none transition-all group-hover:bg-[#f3dcb5]/10" />
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 group-hover:text-[#f3dcb5] transition-colors block mb-2">
            Total VentureLink Revenue ▾
          </span>
          <span className="text-3xl font-bold text-[#f3dcb5] font-mono">{formatMoney(platform_revenue.total_revenue_inr)}</span>
          <span className="text-[11px] text-emerald-400 block mt-2">Click to view audit breakdown</span>
        </div>

        <div 
          onClick={() => setActiveDrilldown('SAAS')}
          className="p-6 rounded-2xl bg-[#130b1c]/90 border border-white/10 hover:border-[#f3dcb5]/60 hover:scale-[1.02] cursor-pointer transition-all group shadow-xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-bl-full pointer-events-none transition-all group-hover:bg-white/10" />
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 group-hover:text-white transition-colors block mb-2">
            VIP & Pro SaaS Subscriptions ▾
          </span>
          <span className="text-2xl font-bold text-white font-mono">{formatMoney(platform_revenue.saas_revenue_inr)}</span>
          <span className="text-[11px] text-zinc-400 block mt-2">Click to view tier breakdown</span>
        </div>

        <div 
          onClick={() => setActiveDrilldown('ESCROW')}
          className="p-6 rounded-2xl bg-[#130b1c]/90 border border-white/10 hover:border-[#f3dcb5]/60 hover:scale-[1.02] cursor-pointer transition-all group shadow-xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-bl-full pointer-events-none transition-all group-hover:bg-white/10" />
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 group-hover:text-white transition-colors block mb-2">
            Escrow Structuring Fees ▾
          </span>
          <span className="text-2xl font-bold text-emerald-400 font-mono">{formatMoney(platform_revenue.escrow_fees_inr)}</span>
          <span className="text-[11px] text-zinc-400 block mt-2">Click to view tranche breakdown</span>
        </div>

        <div 
          onClick={() => setActiveDrilldown('ROYALTY')}
          className="p-6 rounded-2xl bg-[#130b1c]/90 border border-white/10 hover:border-[#f3dcb5]/60 hover:scale-[1.02] cursor-pointer transition-all group shadow-xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-bl-full pointer-events-none transition-all group-hover:bg-white/10" />
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 group-hover:text-white transition-colors block mb-2">
            Royalty Routing & Setup ▾
          </span>
          <span className="text-2xl font-bold text-[#d9b3d0] font-mono">
            {formatMoney(totalRoyaltyAndAudit)}
          </span>
          <span className="text-[11px] text-zinc-400 block mt-2">Click to view routing math</span>
        </div>
      </div>

      <div className="bg-[#140c1d] border border-white/15 rounded-3xl p-8">
        <h2 className="text-xl font-bold text-white mb-1">Registered User & Investor Accounts ({users.length})</h2>
        <p className="text-xs text-zinc-400 mb-6">Stored in `venturelink.db` (`user_accounts` table). Admin can inspect or permanently delete any Founder or Investor.</p>

        <div className="space-y-3">
          {users.map((u) => (
            <div key={u.id} className="p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="text-sm font-bold text-white">{u.name}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                    u.role === 'ADMIN'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : u.role === 'INVESTOR'
                      ? 'bg-[#f3dcb5]/15 text-[#f3dcb5] border border-[#f3dcb5]/30'
                      : 'bg-[#d9b3d0]/15 text-[#d9b3d0] border border-[#d9b3d0]/30'
                  }`}>
                    {u.role}
                  </span>
                </div>
                <span className="text-xs font-mono text-zinc-400">{u.email} • Status: {u.status}</span>
              </div>

              <button
                onClick={() => handleDeleteUser(u.id, u.name)}
                className="px-4 py-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 hover:bg-rose-500 hover:text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                Delete User
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#140c1d] border border-white/15 rounded-3xl p-8">
        <h2 className="text-xl font-bold text-white mb-1">Active Investor Escrow Pledges ({investments.length})</h2>
        <p className="text-xs text-zinc-400 mb-6">Deleting an investor pledge automatically refunds the escrow balance and frees up a Section 42 slot.</p>

        <div className="space-y-3">
          {investments.map((inv) => (
            <div key={inv.id} className="p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-sm font-bold text-white block">{inv.investor_name} ({inv.investor_email})</span>
                <span className="text-xs font-mono text-zinc-400">
                  Syndicate: <strong className="text-[#f3dcb5]">{inv.deal_title}</strong> • Pledged: <strong className="text-emerald-400">{formatMoney(inv.amount_inr)}</strong> • Target Return: {formatMoney(inv.expected_return_inr)}
                </span>
              </div>

              <button
                onClick={() => handleDeleteInvestment(inv.id, inv.investor_name, inv.amount_inr)}
                className="px-4 py-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 hover:bg-rose-500 hover:text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0"
              >
                Revoke & Refund Pledge
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#140c1d] border border-white/15 rounded-3xl p-8">
        <h2 className="text-xl font-bold text-white mb-1">All Marketplace Syndicate Campaigns ({deals.length})</h2>
        <p className="text-xs text-zinc-400 mb-6">Full administrative control to remove non-compliant deals.</p>

        <div className="space-y-3">
          {deals.map((d) => (
            <div key={d.id} className="p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-sm font-bold text-white block">{d.title} ({d.subscription_tier})</span>
                <span className="text-xs font-mono text-zinc-400">
                  Founder: {d.founder_name} • Raised: {formatMoney(d.raisedAmountINR)} / {formatMoney(d.targetAmountINR)} • {d.backers}/199 Backers
                </span>
              </div>

              <button
                onClick={() => handleDeleteDeal(d.id, d.title)}
                className="px-4 py-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 hover:bg-rose-500 hover:text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0"
              >
                Delete Deal
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 8. MAIN APPLICATION CONTROLLER
// ==========================================
export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [authModal, setAuthModal] = useState(null);
  const [authRole, setAuthRole] = useState('INVESTOR');
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('venturelink_user');
    return saved ? JSON.parse(saved) : null;
  });

  const handleSetUser = (userData) => {
    setCurrentUser(userData);
    if (userData) {
      localStorage.setItem('venturelink_user', JSON.stringify(userData));
    } else {
      localStorage.removeItem('venturelink_user');
    }
  };
  const [deals, setDeals] = useState([]);

  const fetchDeals = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/deals`);
      if (res.ok) {
        const data = await res.json();
        setDeals(data);
      }
    } catch (e) {
      console.error("Failed to fetch deals from backend:", e);
    }
  };

  useEffect(() => {
    fetchDeals();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.shiftKey && e.altKey && (e.key === 'A' || e.key === 'a' || e.code === 'KeyA')) {
        const pass = window.prompt("Stealth Admin Access — Enter Master Passcode:");
        if (pass === 'admin123') {
          setCurrentUser({
            name: 'Namit Mahure (Master Admin)',
            email: 'admin@venturelink.in',
            role: 'ADMIN',
          });
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleOpenSignUp = (role) => {
    setAuthRole(role);
    setAuthModal('SIGNUP');
  };

  const handleCommitCapital = async (dealId, amountINR, investorName, investorEmail) => {
    try {
      const res = await fetch(`${API_BASE}/api/deals/${dealId}/pledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          investor_name: investorName || 'Aarav Mehta',
          investor_email: investorEmail || 'aarav@venturelink.in',
          amount_inr: Number(amountINR),
        }),
      });
      if (res.ok) {
        await fetchDeals();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUnlockTranche = async (dealId, trancheIndex) => {
    try {
      const res = await fetch(`${API_BASE}/api/deals/${dealId}/tranches/${trancheIndex}/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proof_type: 'GST_INVOICE',
          proof_reference: `GSTN Invoice #AS-${9042 + trancheIndex} Verified`,
        }),
      });
      if (res.ok) {
        await fetchDeals();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateDeal = async (newDealPayload) => {
    try {
      const res = await fetch(`${API_BASE}/api/deals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDealPayload),
      });
      if (res.ok) {
        await fetchDeals();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSimulateMonth = async (dealId, revenueINR) => {
    try {
      const res = await fetch(`${API_BASE}/api/deals/${dealId}/royalties/simulate-month`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month_label: 'November 2026',
          reported_revenue_inr: Number(revenueINR),
        }),
      });
      if (res.ok) {
        await fetchDeals();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0612] text-white selection:bg-[#f3dcb5] selection:text-black relative overflow-x-hidden flex flex-col">
      
      {showSplash && <SplashLoader onComplete={() => setShowSplash(false)} />}

      {authModal && (
        <AuthModal 
          mode={authModal}
          role={authRole}
          onClose={() => setAuthModal(null)}
          onSwitchMode={(nextMode) => setAuthModal(nextMode)}
          onRoleChange={(newRole) => setAuthRole(newRole)}
          onAuthenticate={(userData) => {
            setCurrentUser(userData);
            setAuthModal(null);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}

      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-b from-[#d9b3d0]/18 via-[#3a203b]/15 to-transparent blur-[140px] pointer-events-none" />
      <div className="absolute top-60 left-1/4 w-[350px] h-[350px] bg-[#f3dcb5]/8 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff06_1px,transparent_1px),linear-gradient(to_bottom,#ffffff06_1px,transparent_1px)] bg-[size:4.5rem_4.5rem] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_25%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="relative z-10 flex flex-col flex-1 min-h-screen">
        <nav className="flex items-center justify-between px-6 lg:px-16 py-7 bg-transparent sticky top-0 z-40">
          <div 
            onClick={() => setCurrentUser(null)}
            className="flex items-center select-none cursor-pointer"
            title="Return to Landing Page"
          >
            <span className="text-2xl font-extrabold tracking-tight text-white">
              <span className="text-[#f3dcb5]">V</span>entureLink<span className="text-[#d9b3d0]">.</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            {currentUser ? (
              <>
                <span className="hidden sm:inline-block px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono text-[#f3dcb5]">
                  {currentUser.name} ({currentUser.role})
                </span>
                <button 
                  onClick={() => setCurrentUser(null)}
                  className="px-5 py-2.5 rounded-full bg-white/[0.04] backdrop-blur-md border border-white/15 text-xs font-bold text-zinc-300 hover:bg-white/10 hover:text-white transition-all tracking-wider uppercase cursor-pointer"
                >
                  Log Out
                </button>
              </>
            ) : (
              <button 
                onClick={() => { setAuthRole('INVESTOR'); setAuthModal('LOGIN'); }}
                className="px-6 py-2.5 rounded-full bg-white/[0.04] backdrop-blur-md border border-white/15 text-xs font-bold text-zinc-200 hover:bg-[#f3dcb5] hover:text-black hover:border-transparent transition-all duration-300 tracking-widest uppercase cursor-pointer"
              >
                Login
              </button>
            )}
          </div>
        </nav>

        {currentUser?.role === 'ADMIN' ? (
          <AdminPage
            user={currentUser}
            onRefreshGlobal={fetchDeals}
          />
        ) : currentUser?.role === 'INVESTOR' ? (
          <InvestorPage 
            user={currentUser} 
            deals={deals} 
            onCommitCapital={handleCommitCapital} 
          />
        ) : currentUser?.role === 'FOUNDER' ? (
          <FounderPage 
            user={currentUser} 
            deals={deals} 
            onUnlockTranche={handleUnlockTranche}
            onCreateDeal={handleCreateDeal}
            onSimulateMonth={handleSimulateMonth}
          />
        ) : (
          <main className="relative flex-1 flex flex-col items-center justify-center text-center px-4 max-w-6xl mx-auto pb-20 w-full">
            <h1 className="text-5xl sm:text-7xl md:text-[5.5rem] font-bold tracking-tight leading-[1.04] mb-12 max-w-4xl">
              Where Ambitious <br />
              Founders Meet{' '}
              <span className="font-serif-luxury italic font-normal text-6xl sm:text-8xl md:text-[6.4rem] bg-gradient-to-r from-[#f3dcb5] via-[#e3bfdc] to-[#d9b3d0] bg-clip-text text-transparent pr-2 drop-shadow-[0_0_35px_rgba(243,220,181,0.18)]">
                Direct Capital.
              </span>
            </h1>

            <div className="flex flex-col sm:flex-row items-center gap-5">
              <button 
                onClick={() => handleOpenSignUp('INVESTOR')}
                className="group relative px-9 py-4 rounded-2xl bg-gradient-to-r from-[#f3dcb5] via-[#ebd0a4] to-[#f3dcb5] text-black font-bold text-sm tracking-wide hover:scale-[1.03] transition-all duration-300 shadow-[0_0_35px_rgba(243,220,181,0.3)] cursor-pointer flex items-center gap-2.5"
              >
                <span>Register as Investor</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </button>
              <button 
                onClick={() => handleOpenSignUp('FOUNDER')}
                className="px-9 py-4 rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/15 text-white font-semibold text-sm tracking-wide hover:bg-white/[0.09] hover:border-[#d9b3d0]/40 hover:scale-[1.03] transition-all duration-300 cursor-pointer"
              >
                Register as Founder
              </button>
            </div>
          </main>
        )}
      </div>
    </div>
  );
}