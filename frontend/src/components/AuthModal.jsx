import React, { useState } from 'react';
import { X, Lock, Mail, User, ShieldCheck, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { loginUser, registerUser } from '../services/api';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Login Form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register Form
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regAge, setRegAge] = useState(28);
  const [regGender, setRegGender] = useState('Female');
  const [selectedRestrictions, setSelectedRestrictions] = useState(['Gluten-Free']);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      const data = await loginUser(loginEmail, loginPassword);
      onAuthSuccess(data.user, data.token);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setErrorMsg('');
    setLoading(true);
    try {
      const data = await loginUser('alex@nutriai.com', 'password123');
      onAuthSuccess(data.user, data.token);
      onClose();
    } catch (err) {
      setErrorMsg('Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      const payload = {
        name: regName,
        email: regEmail,
        password: regPassword,
        age: Number(regAge),
        gender: regGender,
        dietary_restrictions: selectedRestrictions
      };
      const data = await registerUser(payload);
      onAuthSuccess(data.user, data.token);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const toggleRestriction = (res) => {
    setSelectedRestrictions(prev => 
      prev.includes(res) ? prev.filter(r => r !== res) : [...prev, res]
    );
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(10px)',
      zIndex: 1100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20
    }}>
      <div className="glass-card" style={{ maxWidth: 480, width: '100%', padding: 32, position: 'relative', borderRadius: 20 }}>
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          style={{ position: 'absolute', right: 20, top: 20, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          <X size={22} />
        </button>

        {/* Modal Brand */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 6px 20px rgba(16, 185, 129, 0.4)', marginBottom: 12
          }}>
            <ShieldCheck size={28} color="#fff" />
          </div>
          <h2 style={{ fontSize: '1.45rem', color: '#fff', margin: 0 }}>
            {mode === 'login' ? 'Welcome Back to NutriAI' : 'Create NutriAI Account'}
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>
            {mode === 'login' ? 'Sign in to access your multi-modal dietary profile.' : 'Join the AI-powered nutritional health platform.'}
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="tabs-header" style={{ justifyContent: 'center', marginBottom: 20 }}>
          <button 
            className={`tab-btn ${mode === 'login' ? 'active' : ''}`}
            onClick={() => { setMode('login'); setErrorMsg(''); }}
            style={{ fontSize: '0.92rem' }}
          >
            Sign In
          </button>
          <button 
            className={`tab-btn ${mode === 'register' ? 'active' : ''}`}
            onClick={() => { setMode('register'); setErrorMsg(''); }}
            style={{ fontSize: '0.92rem' }}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div style={{ padding: 12, background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 10, color: '#fca5a5', fontSize: '0.82rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={16} /> {errorMsg}
          </div>
        )}

        {/* LOGIN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} color="var(--text-muted)" style={{ position: 'absolute', left: 14, top: 13 }} />
                <input 
                  type="email" 
                  required 
                  className="form-input" 
                  style={{ paddingLeft: 42 }}
                  placeholder="alex@nutriai.com" 
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} color="var(--text-muted)" style={{ position: 'absolute', left: 14, top: 13 }} />
                <input 
                  type="password" 
                  required 
                  className="form-input" 
                  style={{ paddingLeft: 42 }}
                  placeholder="••••••••" 
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 12, padding: 12 }}>
              {loading ? 'Authenticating...' : 'Sign In'} <ArrowRight size={16} />
            </button>

            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <button 
                type="button"
                onClick={handleDemoLogin}
                style={{ background: 'none', border: 'none', color: '#818cf8', fontSize: '0.83rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Sparkles size={14} /> Quick Demo Login (Alex Morgan)
              </button>
            </div>
          </form>
        )}

        {/* CREATE ACCOUNT FORM */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={18} color="var(--text-muted)" style={{ position: 'absolute', left: 14, top: 13 }} />
                <input 
                  type="text" 
                  required 
                  className="form-input" 
                  style={{ paddingLeft: 42 }}
                  placeholder="e.g. Jane Doe" 
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} color="var(--text-muted)" style={{ position: 'absolute', left: 14, top: 13 }} />
                <input 
                  type="email" 
                  required 
                  className="form-input" 
                  style={{ paddingLeft: 42 }}
                  placeholder="jane@example.com" 
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} color="var(--text-muted)" style={{ position: 'absolute', left: 14, top: 13 }} />
                <input 
                  type="password" 
                  required 
                  className="form-input" 
                  style={{ paddingLeft: 42 }}
                  placeholder="••••••••" 
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Age</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={regAge} 
                  onChange={(e) => setRegAge(e.target.value)} 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Gender</label>
                <select 
                  className="form-select" 
                  value={regGender} 
                  onChange={(e) => setRegGender(e.target.value)}
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Dietary Restrictions</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {["Vegan", "Vegetarian", "Gluten-Free", "Dairy-Free", "Halal"].map(res => {
                  const active = selectedRestrictions.includes(res);
                  return (
                    <button
                      key={res}
                      type="button"
                      onClick={() => toggleRestriction(res)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 14,
                        fontSize: '0.75rem',
                        border: active ? '1px solid #10b981' : '1px solid var(--border-glass)',
                        background: active ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                        color: active ? '#10b981' : 'var(--text-muted)',
                        cursor: 'pointer'
                      }}
                    >
                      {active ? '✓ ' : '+ '}{res}
                    </button>
                  );
                })}
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 8, padding: 12 }}>
              {loading ? 'Creating Account...' : 'Create Account & Access Dashboard'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
