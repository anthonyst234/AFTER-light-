import React, { useState } from 'react';
import { 
  UserAccount, 
  loginPlayer, 
  loginMasterAdmin, 
  registerPlayerWithCode, 
  verifyEmailCode, 
  loginGuest, 
  MASTER_ADMIN_EMAIL,
  getAdmin2FACode 
} from '../game/auth';
import { sound } from '../game/audio';
import { 
  KeyRound, User, Lock, Mail, Globe, Zap, ArrowRight, ShieldCheck, ShieldAlert, Sparkles, AlertCircle, CheckCircle2, Shield
} from 'lucide-react';

interface AuthModalProps {
  onAuthenticated: (user: UserAccount) => void;
  onClose?: () => void;
  isMandatory?: boolean;
}

const COUNTRIES = [
  { code: 'US', flag: '🇺🇸', name: 'United States' },
  { code: 'JP', flag: '🇯🇵', name: 'Japan' },
  { code: 'DE', flag: '🇩🇪', name: 'Germany' },
  { code: 'GB', flag: '🇬🇧', name: 'United Kingdom' },
  { code: 'FR', flag: '🇫🇷', name: 'France' },
  { code: 'BR', flag: '🇧🇷', name: 'Brazil' },
  { code: 'CA', flag: '🇨🇦', name: 'Canada' },
  { code: 'KR', flag: '🇰🇷', name: 'South Korea' },
  { code: 'AU', flag: '🇦🇺', name: 'Australia' },
  { code: 'ES', flag: '🇪🇸', name: 'Spain' },
];

export const AuthModal: React.FC<AuthModalProps> = ({
  onAuthenticated,
  onClose,
  isMandatory = false,
}) => {
  const [activePortal, setActivePortal] = useState<'PLAYER' | 'ADMIN'>('PLAYER');
  const [playerTab, setPlayerTab] = useState<'LOGIN' | 'SIGNUP' | 'VERIFY'>('LOGIN');

  // Player Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [country, setCountry] = useState('US');
  const [verificationCode, setVerificationCode] = useState('');
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState('');
  const [simulatedDispatchCode, setSimulatedDispatchCode] = useState<string | null>(null);

  // Admin Form states
  const [adminEmail, setAdminEmail] = useState(MASTER_ADMIN_EMAIL);
  const [adminPassword, setAdminPassword] = useState('');
  const [admin2FACode, setAdmin2FACode] = useState('');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // 1. Regular Player Login
  const handlePlayerLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const res = loginPlayer(email, password);
    if (res.success && res.user) {
      sound.playCoin();
      setSuccessMessage(`Welcome back, ${res.user.displayName}!`);
      setTimeout(() => {
        onAuthenticated(res.user!);
      }, 300);
    } else if (res.requiresVerification && res.user) {
      sound.playClick();
      setPendingVerificationEmail(res.user.email);
      setSimulatedDispatchCode(res.user.verificationCode || '123456');
      setPlayerTab('VERIFY');
      setErrorMessage('Please enter the 6-digit email verification code to activate your account.');
    } else {
      sound.playCollision();
      setErrorMessage(res.error || 'Login failed. Please check your credentials.');
    }
  };

  // 2. Regular Player Sign Up (initiates Email Code Verification)
  const handlePlayerSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const res = registerPlayerWithCode(email, password, displayName, country);
    if (res.success && res.user) {
      sound.playRevival();
      setPendingVerificationEmail(res.user.email);
      setSimulatedDispatchCode(res.code || '123456');
      setPlayerTab('VERIFY');
      setSuccessMessage(`Verification code sent to ${res.user.email}!`);
    } else {
      sound.playCollision();
      setErrorMessage(res.error || 'Failed to register account.');
    }
  };

  // 3. Confirm 6-Digit Email Verification Code
  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const res = verifyEmailCode(pendingVerificationEmail, verificationCode);
    if (res.success && res.user) {
      sound.playLevelUp();
      setSuccessMessage(`Email verified successfully! Welcome to Afterlight, ${res.user.displayName}!`);
      setTimeout(() => {
        onAuthenticated(res.user!);
      }, 400);
    } else {
      sound.playCollision();
      setErrorMessage(res.error || 'Invalid code. Please try again.');
    }
  };

  // 4. Master Admin Login (Requires Admin Email + Password + 2FA Security Code)
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const res = loginMasterAdmin(adminEmail, adminPassword, admin2FACode);
    if (res.success && res.user) {
      sound.playCoin();
      setSuccessMessage('Master Admin Dual-Factor Identity Verified. Welcome, Anthony.');
      setTimeout(() => {
        onAuthenticated(res.user!);
      }, 350);
    } else {
      sound.playCollision();
      setErrorMessage(res.error || 'Master Admin access denied.');
    }
  };

  // 5. Instant Guest Run
  const handleGuestPlay = () => {
    sound.playClick();
    const guest = loginGuest();
    onAuthenticated(guest);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 font-sans select-none overflow-y-auto">
      {/* Background CRT scanlines */}
      <div className="scanlines absolute inset-0 pointer-events-none opacity-30" />

      <div className="relative w-full max-w-lg bg-slate-950 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto">
        
        {/* Top Header & Portal Switcher */}
        <div className="bg-slate-900 border-b border-slate-800 p-4 sm:p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center text-slate-950 font-bold shadow-md">
                <Zap className="w-4 h-4 fill-current" />
              </div>
              <div>
                <h2 className="font-pixel text-xs sm:text-sm text-white tracking-wider">
                  AFTERLIGHT ACCESS GATE
                </h2>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  Secure Player Registry · 2FA Code Protection
                </p>
              </div>
            </div>

            {!isMandatory && onClose && (
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Portal Switcher: Player Portal vs Admin Portal */}
          <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono font-bold">
            <button
              onClick={() => {
                sound.playClick();
                setActivePortal('PLAYER');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all cursor-pointer ${
                activePortal === 'PLAYER'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>PLAYER PORTAL</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                setActivePortal('ADMIN');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all cursor-pointer ${
                activePortal === 'ADMIN'
                  ? 'bg-gradient-to-r from-amber-500 to-red-500 text-white shadow-md shadow-amber-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>ADMIN ACCESS ONLY</span>
            </button>
          </div>
        </div>

        {/* Error / Success Notifications */}
        {errorMessage && (
          <div className="mx-5 mt-4 p-2.5 bg-red-950/80 border border-red-500/60 rounded-xl flex items-center gap-2 text-xs text-red-200 font-mono">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mx-5 mt-4 p-2.5 bg-emerald-950/80 border border-emerald-500/60 rounded-xl flex items-center gap-2 text-xs text-emerald-200 font-mono">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* --- PORTAL 1: REGULAR PLAYERS --- */}
        {activePortal === 'PLAYER' && (
          <div className="p-5 flex flex-col gap-4">
            
            {/* Tabs: LOGIN vs SIGNUP vs VERIFY */}
            <div className="flex border-b border-slate-800 text-xs font-mono">
              <button
                onClick={() => {
                  sound.playClick();
                  setPlayerTab('LOGIN');
                  setErrorMessage(null);
                }}
                className={`pb-2.5 px-4 font-bold transition-all cursor-pointer border-b-2 ${
                  playerTab === 'LOGIN'
                    ? 'border-cyan-400 text-cyan-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                LOG IN
              </button>
              <button
                onClick={() => {
                  sound.playClick();
                  setPlayerTab('SIGNUP');
                  setErrorMessage(null);
                }}
                className={`pb-2.5 px-4 font-bold transition-all cursor-pointer border-b-2 ${
                  playerTab === 'SIGNUP'
                    ? 'border-cyan-400 text-cyan-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                CREATE ACCOUNT
              </button>
              {playerTab === 'VERIFY' && (
                <button
                  className="pb-2.5 px-4 font-bold border-b-2 border-amber-400 text-amber-400"
                >
                  VERIFY CODE
                </button>
              )}
            </div>

            {/* A. PLAYER LOGIN FORM */}
            {playerTab === 'LOGIN' && (
              <form onSubmit={handlePlayerLogin} className="flex flex-col gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">
                    EMAIL OR PHONE NUMBER OR CALL SIGN
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="runner@grid.net or +1 (555) 234-5678"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">
                    PASSWORD
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="mt-2 w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-slate-950 font-pixel text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md shadow-cyan-500/20"
                >
                  ENTER THE RUN
                </button>
              </form>
            )}

            {/* B. PLAYER SIGN UP FORM */}
            {playerTab === 'SIGNUP' && (
              <form onSubmit={handlePlayerSignUp} className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 mb-1">
                      CALL SIGN (NAME)
                    </label>
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="NeoRunner"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 mb-1">
                      COUNTRY FLAG
                    </label>
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono cursor-pointer"
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c.code} value={c.code} className="bg-slate-900">
                          {c.flag} {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">
                    EMAIL OR PHONE NUMBER
                  </label>
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="courier@cyber.io or +1 (555) 234-5678"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">
                    PASSWORD
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 4 characters"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                  />
                </div>

                <button
                  type="submit"
                  className="mt-2 w-full py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 active:scale-95 text-slate-950 font-pixel text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md shadow-cyan-500/20"
                >
                  SEND VERIFICATION CODE
                </button>
              </form>
            )}

            {/* C. EMAIL / PHONE CODE VERIFICATION STEP (Codes sent to device, not revealed on screen) */}
            {playerTab === 'VERIFY' && (
              <form onSubmit={handleVerifyCode} className="flex flex-col gap-3">
                {/* Security Dispatch Notice without revealing code on screen */}
                <div className="p-3 bg-cyan-950/70 border border-cyan-500/50 rounded-xl flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5 text-cyan-300 font-mono text-[11px] font-bold">
                    <Shield className="w-3.5 h-3.5 text-cyan-400" />
                    <span>DISPATCHED TO: {pendingVerificationEmail}</span>
                  </div>
                  <p className="text-[11px] text-slate-300 font-mono leading-relaxed">
                    A 6-digit authentication code has been sent directly to your mobile phone via SMS or email inbox. Please check your SMS messages and enter the code below.
                  </p>
                  <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono mt-0.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>SMS / Email Dispatch Sent Successfully</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">
                    ENTER 6-DIGIT VERIFICATION CODE
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="e.g. 482915"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-center font-mono text-base tracking-widest text-amber-300 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <button
                  type="submit"
                  className="mt-1 w-full py-2.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-pixel text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md shadow-amber-500/20"
                >
                  VERIFY & ACTIVATE ACCOUNT
                </button>
              </form>
            )}

            {/* Quick Guest Play Button */}
            <div className="pt-2 border-t border-slate-800/80 flex flex-col items-center">
              <button
                type="button"
                onClick={handleGuestPlay}
                className="w-full py-2 bg-slate-900/90 hover:bg-slate-800/90 active:scale-95 border border-slate-700/80 text-slate-300 hover:text-white rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>QUICK PLAY AS GUEST (NO LOGIN REQUIRED)</span>
              </button>
              <span className="text-[10px] text-slate-500 font-mono mt-1.5 text-center">
                All players have their own isolated high scores & storage.
              </span>
            </div>
          </div>
        )}

        {/* --- PORTAL 2: MASTER ADMIN (ANTHONY ONLY) --- */}
        {activePortal === 'ADMIN' && (
          <div className="p-5 flex flex-col gap-4">
            <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-xl flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-pixel text-[11px] text-red-300 font-bold">
                  RESTRICTED TO OWNER ONLY (ANTHONY)
                </h4>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  Dual-factor authenticated terminal. Grants access to player storage inspection, economy controls, and leaderboard moderation.
                </p>
              </div>
            </div>

            <form onSubmit={handleAdminLogin} className="flex flex-col gap-3">
              {/* 1. Admin Email */}
              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">
                  MASTER ADMIN EMAIL
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-amber-400" />
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-amber-300 font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* 2. Admin Password */}
              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">
                  MASTER ADMIN PASSWORD
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-amber-400" />
                  <input
                    type="password"
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Enter personal admin password"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                  Default Password: <code className="text-amber-400">admin</code> (or PIN: <code className="text-amber-400">7799</code>)
                </p>
              </div>

              {/* 3. Master 2FA Security Code */}
              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">
                  2FA SECURITY CODE / MASTER AUTHORIZATION PIN
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-2.5 w-4 h-4 text-amber-400" />
                  <input
                    type="text"
                    required
                    value={admin2FACode}
                    onChange={(e) => setAdmin2FACode(e.target.value)}
                    placeholder="Enter 2FA Code"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-amber-300 font-mono focus:outline-none focus:border-amber-400 tracking-wider"
                  />
                </div>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                  Default Master 2FA Code: <code className="text-amber-400">779900</code>
                </p>
              </div>

              <button
                type="submit"
                className="mt-2 w-full py-2.5 bg-gradient-to-r from-red-600 via-amber-600 to-amber-500 hover:from-red-500 hover:to-amber-400 active:scale-95 text-white font-pixel text-xs font-bold rounded-xl transition-all cursor-pointer shadow-lg shadow-red-950 flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-white" />
                <span>AUTHENTICATE MASTER ADMIN DASHBOARD</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
