import React, { useState } from 'react';
import {
  HeartPulse, Mail, Lock, Eye, EyeOff, User, ArrowRight, ArrowLeft,
  AlertCircle, CheckCircle2, ChevronDown
} from 'lucide-react';
import { registerUser } from '../services/api';
import logoImg from '../assets/logo.png';

const dietaryOptions = ['Vegetarian', 'Vegan', 'Gluten-free', 'Dairy-free', 'Nut allergy'];
const activityLevels = ['Sedentary', 'Lightly active', 'Moderately active', 'Very active'];

const passwordStrength = (pw) => {
  if (!pw) return { label: '', color: 'transparent', width: '0%' };
  const score = [pw.length >= 8, /[A-Z]/.test(pw), /[0-9]/.test(pw), /[^A-Za-z0-9]/.test(pw)].filter(Boolean).length;
  const levels = [
    { label: 'Too short', color: '#ef4444', width: '20%' },
    { label: 'Weak', color: '#ef4444', width: '30%' },
    { label: 'Fair', color: '#f59e0b', width: '55%' },
    { label: 'Good', color: '#10b981', width: '80%' },
    { label: 'Strong', color: '#6366f1', width: '100%' },
  ];
  return levels[Math.min(score, 4)];
};

export default function RegisterPage({ onAuthSuccess, onGoToLogin }) {
  const [step, setStep] = useState(1); // 1 = Account, 2 = Profile
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1 fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');

  // Step 2 fields
  const [age, setAge] = useState(25);
  const [gender, setGender] = useState('Female');
  const [height, setHeight] = useState(165);
  const [weight, setWeight] = useState(60);
  const [activityLevel, setActivityLevel] = useState('Lightly active');
  const [healthGoal, setHealthGoal] = useState('Improve energy');
  const [restrictions, setRestrictions] = useState([]);

  const pwStrength = passwordStrength(password);

  const toggleRestriction = (item) => {
    setRestrictions(prev => prev.includes(item) ? prev.filter(r => r !== item) : [...prev, item]);
  };

  const handleStep1Next = (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setStep(2);
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await registerUser({
        name, email, password,
        age: Number(age),
        gender,
        height_cm: Number(height),
        weight_kg: Number(weight),
        activity_level: activityLevel,
        health_goals: [healthGoal],
        dietary_restrictions: restrictions,
      });
      onAuthSuccess(data.user, data.token);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-dark)',
      padding: '40px 20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Ambient background orbs */}
      <div style={{ position: 'fixed', top: -200, left: -200, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 60%)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: -200, right: -100, width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 60%)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 540, position: 'relative' }}>

        {/* Logo header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img
            src={logoImg}
            alt="NutriAI Logo"
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              margin: '0 auto 12px',
              objectFit: 'cover',
              boxShadow: '0 8px 28px rgba(16, 185, 129, 0.45)',
              border: '1px solid rgba(16, 185, 129, 0.3)'
            }}
          />
          <h1 style={{ fontSize: '1.9rem', fontWeight: 800, color: "var(--text-main)", margin: '0 0 4px' }}>Create your account</h1>
          <p style={{ fontSize: '0.87rem', color: 'var(--text-muted)', margin: 0 }}>
            Join NutriAI and start your personalized deficiency assessment today.
          </p>
        </div>

        {/* Step Progress Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
          {[1, 2].map((s) => (
            <React.Fragment key={s}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, flex: 1,
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.82rem', fontWeight: 700,
                  background: step > s
                    ? '#10b981'
                    : step === s
                      ? 'linear-gradient(135deg, #10b981, #059669)'
                      : 'rgba(255,255,255,0.06)',
                  border: step === s ? '2px solid #10b981' : step < s ? '2px solid rgba(255,255,255,0.1)' : 'none',
                  color: step >= s ? '#fff' : 'var(--text-muted)',
                  boxShadow: step === s ? '0 0 12px rgba(16,185,129,0.4)' : 'none',
                  transition: 'all 0.3s ease'
                }}>
                  {step > s ? <CheckCircle2 size={17} /> : s}
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: step >= s ? "var(--text-main)" : 'var(--text-muted)' }}>
                    {s === 1 ? 'Account Details' : 'Health Profile'}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                    {s === 1 ? 'Name, email & password' : 'Age, gender & diet prefs'}
                  </div>
                </div>
              </div>
              {s < 2 && (
                <div style={{ height: 2, flex: 0.3, background: step > s ? '#10b981' : 'rgba(255,255,255,0.08)', borderRadius: 2, transition: 'background 0.3s ease' }} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Card */}
        <div className="glass-card" style={{ padding: '32px 36px', borderRadius: 20 }}>

          {/* Error banner */}
          {error && (
            <div style={{
              padding: '10px 14px', marginBottom: 20,
              background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 10, color: '#fca5a5', fontSize: '0.83rem',
              display: 'flex', alignItems: 'center', gap: 8
            }}>
              <AlertCircle size={15} /> {error}
            </div>
          )}

          {/* ── STEP 1: Account ── */}
          {step === 1 && (
            <form onSubmit={handleStep1Next} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <h3 style={{ fontSize: '1.15rem', color: "var(--text-main)", margin: '0 0 4px' }}>Account Details</h3>

              <div>
                <label className="form-label">Full Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={17} color="var(--text-muted)" style={{ position: 'absolute', left: 14, top: 14, pointerEvents: 'none' }} />
                  <input type="text" required className="form-input" style={{ paddingLeft: 42 }}
                    placeholder="e.g. Jane Doe"
                    value={name} onChange={e => setName(e.target.value)} />
                </div>
              </div>

              <div>
                <label className="form-label">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={17} color="var(--text-muted)" style={{ position: 'absolute', left: 14, top: 14, pointerEvents: 'none' }} />
                  <input type="email" required className="form-input" style={{ paddingLeft: 42 }}
                    placeholder="jane@example.com"
                    value={email} onChange={e => setEmail(e.target.value)}
                    autoComplete="email" />
                </div>
              </div>

              <div>
                <label className="form-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={17} color="var(--text-muted)" style={{ position: 'absolute', left: 14, top: 14, pointerEvents: 'none' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required className="form-input" style={{ paddingLeft: 42, paddingRight: 44 }}
                    placeholder="Minimum 6 characters"
                    value={password} onChange={e => setPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowPassword(v => !v)}
                    style={{ position: 'absolute', right: 14, top: 13, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {/* Strength bar */}
                {password && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: pwStrength.width, background: pwStrength.color, transition: 'all 0.3s ease', borderRadius: 2 }} />
                    </div>
                    <span style={{ fontSize: '0.72rem', color: pwStrength.color, marginTop: 4, display: 'block' }}>
                      {pwStrength.label}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="form-label">Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={17} color="var(--text-muted)" style={{ position: 'absolute', left: 14, top: 14, pointerEvents: 'none' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required className="form-input" style={{ paddingLeft: 42 }}
                    placeholder="Re-enter password"
                    value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  {confirmPassword && (
                    <span style={{ position: 'absolute', right: 14, top: 13 }}>
                      {confirmPassword === password
                        ? <CheckCircle2 size={18} color="#10b981" />
                        : <AlertCircle size={18} color="#ef4444" />}
                    </span>
                  )}
                </div>
              </div>

              <button type="submit" className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: '0.95rem', marginTop: 4 }}>
                Continue to Health Profile <ArrowRight size={17} />
              </button>
            </form>
          )}

          {/* ── STEP 2: Health Profile ── */}
          {step === 2 && (
            <form onSubmit={handleFinalSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ marginBottom: 4 }}>
                <h3 style={{ fontSize: '1.3rem', color: '#fff', margin: '0 0 6px', fontWeight: 700 }}>Your health profile</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                  We use this to personalize RDA targets and meal filters.
                </p>
              </div>

              {/* Age & Sex */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label className="form-label">Age</label>
                  <input type="number" min="10" max="100" className="form-input"
                    value={age} onChange={e => setAge(e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Sex</label>
                  <select className="form-select" value={gender} onChange={e => setGender(e.target.value)}>
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                  </select>
                </div>
              </div>

              {/* Height & Weight */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label className="form-label">Height (cm)</label>
                  <input type="number" min="50" max="250" className="form-input"
                    value={height} onChange={e => setHeight(e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Weight (kg)</label>
                  <input type="number" min="20" max="300" className="form-input"
                    value={weight} onChange={e => setWeight(e.target.value)} />
                </div>
              </div>

              {/* Activity level */}
              <div>
                <label className="form-label">Activity level</label>
                <select className="form-select" value={activityLevel} onChange={e => setActivityLevel(e.target.value)}>
                  {activityLevels.map(lvl => (
                    <option key={lvl} value={lvl}>{lvl}</option>
                  ))}
                </select>
              </div>

              {/* Health goal */}
              <div>
                <label className="form-label">Health goal</label>
                <input type="text" className="form-input"
                  placeholder="e.g. Improve energy"
                  value={healthGoal} onChange={e => setHealthGoal(e.target.value)} />
              </div>

              {/* Dietary restrictions */}
              <div>
                <label className="form-label" style={{ marginBottom: 10, display: 'block' }}>
                  Dietary restrictions
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {dietaryOptions.map(opt => {
                    const active = restrictions.includes(opt);
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => toggleRestriction(opt)}
                        style={{
                          padding: '7px 16px', borderRadius: 20,
                          fontSize: '0.82rem', fontWeight: 500,
                          border: active ? '1px solid #10b981' : '1px solid var(--border-glass)',
                          background: active ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.04)',
                          color: active ? '#10b981' : '#000000ff',
                          cursor: 'pointer', transition: 'all 0.2s ease'
                        }}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => { setStep(1); setError(''); }}
                  className="btn-secondary"
                  style={{ flex: 1, padding: '12px', justifyContent: 'center', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <ArrowLeft size={16} /> Back
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                  style={{ flex: 2, justifyContent: 'center', padding: '12px', fontSize: '0.95rem' }}
                >
                  {loading ? 'Saving…' : 'Save & go to dashboard'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Switch to Login */}
        <p style={{ textAlign: 'center', marginTop: 22, fontSize: '0.87rem', color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <button
            type="button"
            onClick={onGoToLogin}
            style={{ background: 'none', border: 'none', color: '#10b981', fontWeight: 600, cursor: 'pointer', fontSize: '0.87rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}
          >
            Sign in <ArrowRight size={14} />
          </button>
        </p>

      </div>
    </div>
  );
}
