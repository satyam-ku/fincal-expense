import React, { useState } from 'react';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();

  // 'login' | 'signup' | 'otp'
  const [mode, setMode] = useState('login');

  // Shared fields
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPass, setShowPass]         = useState(false);

  // Sign-up only fields
  const [name, setName]                 = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // OTP step
  const [otp, setOtp]                   = useState('');

  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const [shake, setShake]               = useState(false);

  const triggerShake = () => { setShake(true); setTimeout(() => setShake(false), 400); };
  const setErr = (msg) => { setError(msg); triggerShake(); };
  const clearError = () => setError('');

  const switchMode = (m) => {
    setMode(m);
    setError('');
    setOtp('');
    setPassword('');
    setConfirmPassword('');
    setShowPass(false);
    setShowConfirmPass(false);
  };

  // ── LOGIN: Email + Password ──────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true); clearError();
    try {
      const res = await API.post('/auth/login-password', { email: email.trim(), password });
      login(res.data.user, res.data.token);
    } catch (err) {
      setErr(err.response?.data?.message || 'Login failed. Check your credentials.');
      setPassword('');
    } finally { setLoading(false); }
  };

  // ── SIGN UP: Validate → Send OTP ─────────────────────────────────────────
  const handleSignup = async (e) => {
    e.preventDefault();
    if (!email.trim() || !name.trim() || !password) return;
    if (password.length < 6) return setErr('Password must be at least 6 characters');
    if (password !== confirmPassword) return setErr('Passwords do not match');

    setLoading(true); clearError();
    try {
      const res = await API.post('/auth/send-otp', { email: email.trim(), name: name.trim() });

      // Email already registered with password → redirect to login
      if (res.data.isExistingUser) {
        switchMode('login');
        setErr('This email is already registered. Please login with your password.');
        return;
      }

      setMode('otp');
    } catch (err) {
      const data = err.response?.data;
      setErr(data?.message || 'Could not send OTP. Try again.');
    } finally { setLoading(false); }
  };

  // ── OTP: Verify → Save Password → Login ──────────────────────────────────
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) return;
    setLoading(true); clearError();
    try {
      const res = await API.post('/auth/verify-otp', { email: email.trim(), otp, password });
      login(res.data.user, res.data.token);
    } catch (err) {
      const msg = err.response?.data?.message || 'Verification failed';
      setErr(msg);
      if (msg.toLowerCase().includes('otp')) setOtp('');
    } finally { setLoading(false); }
  };

  const handleResendOTP = async () => {
    setLoading(true); clearError();
    try {
      const res = await API.post('/auth/send-otp', { email: email.trim(), name: name.trim() });
      if (res.data.isExistingUser) {
        switchMode('login');
        setErr('This email is already registered. Please login.');
        return;
      }
      setError('✅ OTP resent! Check your inbox.');
    } catch (err) {
      setErr(err.response?.data?.message || 'Failed to resend OTP. Try again.');
    } finally { setLoading(false); }
  };

  // ── EYE BUTTON ─────────────────────────────────────────────────────────
  const EyeBtn = ({ show, toggle }) => (
    <button type="button" onClick={toggle}
      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors z-10">
      <i className={`fa-solid ${show ? 'fa-eye-slash' : 'fa-eye'} text-sm`}></i>
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#020202] overflow-y-auto">

      {/* Ambient glows */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neonBlue/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neonPink/5 rounded-full blur-[120px]"></div>
      </div>

      <div className="glass-panel w-full max-w-sm rounded-[32px] overflow-hidden animate-pop-in relative my-auto">
        {/* Top accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-neonBlue via-white to-neonPink opacity-60"></div>

        <div className="p-8 pt-10">
          {/* Logo */}
          <div className="text-center mb-8">
            <h1 className="text-5xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-white via-neonBlue to-neonPink leading-none mb-1">
              FinCaL
            </h1>
            <p className="text-[10px] uppercase tracking-[0.45em] text-gray-600">Financial Operating System</p>
          </div>

          {/* ── LOGIN / SIGNUP TABS ── */}
          {mode !== 'otp' && (
            <div className="flex bg-white/5 rounded-2xl p-1 mb-8 border border-white/5">
              <button
                onClick={() => switchMode('login')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-200
                  ${mode === 'login'
                    ? 'bg-neonBlue text-black shadow-[0_0_12px_rgba(0,243,255,0.4)]'
                    : 'text-gray-500 hover:text-white'}`}>
                Login
              </button>
              <button
                onClick={() => switchMode('signup')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-200
                  ${mode === 'signup'
                    ? 'bg-white text-black shadow-[0_0_12px_rgba(255,255,255,0.2)]'
                    : 'text-gray-500 hover:text-white'}`}>
                Sign Up
              </button>
            </div>
          )}

          {/* ════════════════════════════════════════
              LOGIN FORM
          ════════════════════════════════════════ */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-2 ml-1">Email</label>
                <div className="relative">
                  <i className="fa-solid fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 text-sm"></i>
                  <input
                    type="email" value={email}
                    onChange={e => { setEmail(e.target.value); clearError(); }}
                    placeholder="your@email.com"
                    className={`w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-white text-sm
                      focus:outline-none focus:border-neonBlue focus:bg-white/8 transition-all
                      ${shake ? 'animate-shake' : ''}`}
                    autoFocus
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-2 ml-1">Password</label>
                <div className="relative">
                  <i className="fa-solid fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 text-sm"></i>
                  <input
                    type={showPass ? 'text' : 'password'} value={password}
                    onChange={e => { setPassword(e.target.value); clearError(); }}
                    placeholder="Enter your password"
                    className={`w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-11 pr-11 text-white text-sm
                      focus:outline-none focus:border-neonBlue focus:bg-white/8 transition-all
                      ${shake ? 'animate-shake' : ''}`}
                  />
                  <EyeBtn show={showPass} toggle={() => setShowPass(p => !p)} />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                  <i className="fa-solid fa-circle-exclamation text-red-400 text-xs"></i>
                  <p className="text-red-400 text-xs">{error}</p>
                </div>
              )}

              <button type="submit" disabled={loading || !email.trim() || !password}
                className="w-full bg-gradient-to-r from-neonBlue to-blue-600 text-black font-black py-4 rounded-xl
                  text-sm tracking-widest uppercase hover:scale-[1.01] transition-transform
                  disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100
                  shadow-[0_0_20px_rgba(0,243,255,0.2)] mt-2">
                {loading
                  ? <span className="flex items-center justify-center gap-2"><i className="fa-solid fa-circle-notch animate-spin"></i> Signing in...</span>
                  : 'Login →'}
              </button>

              <p className="text-center text-[11px] text-gray-600 mt-3">
                Don't have an account?{' '}
                <button type="button" onClick={() => switchMode('signup')}
                  className="text-neonBlue hover:text-white transition-colors font-bold">
                  Sign Up
                </button>
              </p>
            </form>
          )}

          {/* ════════════════════════════════════════
              SIGN UP FORM
          ════════════════════════════════════════ */}
          {mode === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-2 ml-1">Full Name</label>
                <div className="relative">
                  <i className="fa-solid fa-user absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 text-sm"></i>
                  <input
                    type="text" value={name} maxLength={20}
                    onChange={e => { setName(e.target.value); clearError(); }}
                    placeholder="Your name"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-white text-sm
                      focus:outline-none focus:border-white focus:bg-white/8 transition-all"
                    autoFocus
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-2 ml-1">Email</label>
                <div className="relative">
                  <i className="fa-solid fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 text-sm"></i>
                  <input
                    type="email" value={email}
                    onChange={e => { setEmail(e.target.value); clearError(); }}
                    placeholder="your@email.com"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-white text-sm
                      focus:outline-none focus:border-white focus:bg-white/8 transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-2 ml-1">Password</label>
                <div className="relative">
                  <i className="fa-solid fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 text-sm"></i>
                  <input
                    type={showPass ? 'text' : 'password'} value={password}
                    onChange={e => { setPassword(e.target.value); clearError(); }}
                    placeholder="Min. 6 characters"
                    className={`w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-11 pr-11 text-white text-sm
                      focus:outline-none focus:border-white focus:bg-white/8 transition-all
                      ${shake ? 'animate-shake' : ''}`}
                  />
                  <EyeBtn show={showPass} toggle={() => setShowPass(p => !p)} />
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-2 ml-1">Confirm Password</label>
                <div className="relative">
                  <i className="fa-solid fa-lock-open absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 text-sm"></i>
                  <input
                    type={showConfirmPass ? 'text' : 'password'} value={confirmPassword}
                    onChange={e => { setConfirmPassword(e.target.value); clearError(); }}
                    placeholder="Re-enter password"
                    className={`w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-11 pr-11 text-white text-sm
                      focus:outline-none focus:border-white focus:bg-white/8 transition-all
                      ${shake ? 'animate-shake' : ''}`}
                  />
                  <EyeBtn show={showConfirmPass} toggle={() => setShowConfirmPass(p => !p)} />
                </div>
                {/* Password match indicator */}
                {confirmPassword && (
                  <p className={`text-[10px] mt-1.5 ml-1 ${password === confirmPassword ? 'text-neonGreen' : 'text-red-400'}`}>
                    <i className={`fa-solid ${password === confirmPassword ? 'fa-check' : 'fa-xmark'} mr-1`}></i>
                    {password === confirmPassword ? 'Passwords match' : 'Passwords do not match'}
                  </p>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                  <i className="fa-solid fa-circle-exclamation text-red-400 text-xs"></i>
                  <p className="text-red-400 text-xs">{error}</p>
                </div>
              )}

              <p className="text-[10px] text-gray-600 text-center leading-relaxed">
                <i className="fa-solid fa-shield-halved text-gray-600 mr-1"></i>
                An OTP will be sent to your email to verify your account.
              </p>

              <button type="submit"
                disabled={loading || !email.trim() || !name.trim() || password.length < 6 || password !== confirmPassword}
                className="w-full bg-white text-black font-black py-4 rounded-xl
                  text-sm tracking-widest uppercase hover:scale-[1.01] transition-transform
                  disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100
                  shadow-[0_0_20px_rgba(255,255,255,0.1)] mt-2">
                {loading
                  ? <span className="flex items-center justify-center gap-2"><i className="fa-solid fa-circle-notch animate-spin"></i> Sending OTP...</span>
                  : 'Create Account →'}
              </button>

              <p className="text-center text-[11px] text-gray-600 mt-3">
                Already have an account?{' '}
                <button type="button" onClick={() => switchMode('login')}
                  className="text-neonBlue hover:text-white transition-colors font-bold">
                  Login
                </button>
              </p>
            </form>
          )}

          {/* ════════════════════════════════════════
              OTP VERIFICATION (after sign up form)
          ════════════════════════════════════════ */}
          {mode === 'otp' && (
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              {/* Back button */}
              <button type="button" onClick={() => switchMode('signup')}
                className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-xs uppercase tracking-widest">
                <i className="fa-solid fa-arrow-left text-xs"></i> Back
              </button>

              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-neonBlue/10 border border-neonBlue/20 mx-auto flex items-center justify-center mb-5">
                  <i className="fa-solid fa-envelope-open-text text-3xl text-neonBlue"></i>
                </div>
                <h3 className="text-base font-bold text-white uppercase tracking-widest mb-1">Check your inbox</h3>
                <p className="text-xs text-gray-500">OTP sent to</p>
                <p className="text-neonBlue font-bold text-sm mt-0.5">{email}</p>
              </div>

              {/* OTP Input — type=text so leading zeros kept & e/+/- blocked */}
              <div>
                <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-2 ml-1 text-center">Enter 6-digit OTP</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={otp}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, ''); // digits only
                    if (val.length <= 6) { setOtp(val); clearError(); }
                  }}
                  placeholder="• • • • • •"
                  maxLength={6}
                  className={`input-glow input-glow-center w-full p-4 rounded-2xl font-mono text-3xl tracking-[0.5em] text-neonBlue
                    ${shake ? 'animate-shake' : ''}`}
                  autoFocus
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                  <i className="fa-solid fa-circle-exclamation text-red-400 text-xs"></i>
                  <p className="text-red-400 text-xs">{error}</p>
                </div>
              )}

              <button type="submit" disabled={loading || otp.length !== 6}
                className="w-full bg-gradient-to-r from-neonGreen to-green-600 text-black font-black py-4 rounded-xl
                  text-sm tracking-widest uppercase hover:scale-[1.01] transition-transform
                  disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100
                  shadow-[0_0_20px_rgba(0,255,157,0.2)]">
                {loading
                  ? <span className="flex items-center justify-center gap-2"><i className="fa-solid fa-circle-notch animate-spin"></i> Verifying...</span>
                  : '✓ Verify & Create Account'}
              </button>

              <div className="text-center">
                <p className="text-[11px] text-gray-600 mb-1">Didn't receive the OTP?</p>
                <button type="button" onClick={handleResendOTP} disabled={loading}
                  className="text-[11px] text-neonBlue hover:text-white transition-colors font-bold uppercase tracking-widest">
                  Resend OTP
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Bottom brand tag */}
        <div className="pb-6 text-center">
          <p className="text-[9px] text-gray-700 uppercase tracking-[0.4em]">Secure · Private · Yours</p>
        </div>
      </div>
    </div>
  );
}
