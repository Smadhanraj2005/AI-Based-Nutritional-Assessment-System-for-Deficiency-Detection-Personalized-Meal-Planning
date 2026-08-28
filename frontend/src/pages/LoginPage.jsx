import React, { useState } from 'react';
import {
  HeartPulse, Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles,
  AlertCircle, CheckCircle2, ShieldCheck, Activity, Utensils, TrendingUp
} from 'lucide-react';
import { loginUser } from '../services/api';
import logoImg from '../assets/logo.png';

export default function LoginPage({ onAuthSuccess, onGoToRegister, onGoToLanding }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await loginUser(email, password);
      onAuthSuccess(data.user, data.token);
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const data = await loginUser('alex@nutriai.com', 'password123');
      onAuthSuccess(data.user, data.token);
    } catch (err) {
      setError('Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: <Activity size={20} />,
      title: 'AI Deficiency Assessment',
      desc: 'Ensemble model trained to analyze intake averages and detect micronutrient deficiency risks.'
    },
    {
      icon: <Utensils size={20} />,
      title: 'Personalized Meal Schedule',
      desc: 'Algorithmic meal plans targeting focus nutrients while respecting vegetarian & allergy filters.'
    },
    {
      icon: <ShieldCheck size={20} />,
      title: 'Smart Dietary Diary',
      desc: 'Log daily foods with an Indian food database to track daily micronutrient and macro intake.'
    },
    {
      icon: <TrendingUp size={20} />,
      title: 'Longitudinal Analytics',
      desc: 'Track risk reduction curves and health score improvements across weeks of plan adherence.'
    }
  ];

  return (
    <div className="login-grid-container" style={{
      minHeight: '100vh',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      background: 'var(--bg-dark)',
      overflow: 'hidden'
    }}>
      {/* ────────────── LEFT PANEL ────────────── */}
      <div style={{
        position: 'relative',
        padding: '48px 56px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: 'linear-gradient(145deg, rgba(16,185,129,0.12) 0%, rgba(99,102,241,0.08) 100%)',
        borderRight: '1px solid var(--border-glass)',
        overflow: 'hidden'
      }}>
        {/* Background Orbs */}
        <div style={{ position: 'absolute', top: -120, left: -80, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.18) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -100, right: -60, width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 65%)', pointerEvents: 'none' }} />

        {/* Logo */}
        <div
          onClick={onGoToLanding}
          style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative', cursor: onGoToLanding ? 'pointer' : 'default' }}
          title="Return to Landing Page"
        >
          <img
            src={logoImg}
            alt="NutriAI Logo"
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              objectFit: 'cover',
              boxShadow: '0 6px 24px rgba(16, 185, 129, 0.45)',
              border: '1px solid rgba(16, 185, 129, 0.3)'
            }}
          />
          <div>
            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)' }}>NutriAI</h2>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Deficiency Assessment Engine</span>
          </div>
        </div>

        {/* Unified Body Wrapper to control spacing between hero text and features list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 36, position: 'relative', margin: '24px 0 0' }}>
          {/* Hero Text */}
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', marginBottom: 16 }}>
              <Sparkles size={13} color="#10b981" />
              <span style={{ fontSize: '0.74rem', color: 'var(--primary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI-Powered Nutritional Health</span>
            </div>
            <h1 style={{ fontSize: '2.6rem', fontWeight: 800, color: 'linear-gradient(90deg, #10b981, #6366f1)', lineHeight: 1.2, margin: '0 0 16px' }}>
              Detect Deficiencies.<br />
              <span style={{ background: 'linear-gradient(90deg, #10b981, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Eat Smarter.
              </span>
            </h1>
          </div>

          {/* Features List with increased gap for breathing room */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22, position: 'relative' }}>
            {features.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#10b981'
                }}>
                  {f.icon}
                </div>
                <div>
                  <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)', display: 'block' }}>{f.title}</strong>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{f.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ────────────── RIGHT PANEL: Login Form ────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 56px', position: 'relative' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>

          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: '1.85rem', fontWeight: 700, color: "var(--text-main)", margin: '0 0 6px' }}>Welcome back</h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>
              Sign in to continue your nutritional assessment journey.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div style={{
              padding: '10px 14px', marginBottom: 18,
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 10, color: '#fca5a5',
              fontSize: '0.83rem', display: 'flex', alignItems: 'center', gap: 8
            }}>
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Email */}
            <div>
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={17} color="var(--text-muted)" style={{ position: 'absolute', left: 14, top: 14, pointerEvents: 'none' }} />
                <input
                  type="email"
                  required
                  className="form-input"
                  style={{ paddingLeft: 42 }}
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={17} color="var(--text-muted)" style={{ position: 'absolute', left: 14, top: 14, pointerEvents: 'none' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="form-input"
                  style={{ paddingLeft: 42, paddingRight: 44 }}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  style={{ position: 'absolute', right: 14, top: 13, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: '0.95rem', marginTop: 4 }}
            >
              {loading ? 'Signing in…' : 'Sign In to NutriAI'} <ArrowRight size={17} />
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border-glass)' }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>OR</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border-glass)' }} />
          </div>



          {/* Switch to Register */}
          <p style={{ textAlign: 'center', marginTop: 24, fontSize: '0.87rem', color: 'var(--text-muted)' }}>
            Don't have an account?{' '}
            <button
              type="button"
              onClick={onGoToRegister}
              style={{ background: 'none', border: 'none', color: '#10b981', fontWeight: 600, cursor: 'pointer', fontSize: '0.87rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              Create account <ArrowRight size={14} />
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
