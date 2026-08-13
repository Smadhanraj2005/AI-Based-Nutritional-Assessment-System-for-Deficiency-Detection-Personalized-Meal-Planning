import React from 'react';
import { Activity, ShieldCheck, HeartPulse, Sparkles, User, Calendar, BarChart3, LogIn, LogOut, ChevronDown } from 'lucide-react';

export default function Header({ activeTab, setActiveTab, healthScore, currentUser, onOpenAuth, onLogout }) {
  return (
    <header className="glass-card" style={{
      borderRadius: 0,
      borderTop: 'none',
      borderLeft: 'none',
      borderRight: 'none',
      padding: '14px 24px',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>

        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)'
          }}>
            <HeartPulse size={26} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              NutriAI
              <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: 4, background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                ML Engine v1.0
              </span>
            </h1>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
              AI Nutritional Deficiency Detection & Meal Planning
            </p>
          </div>
        </div>

        {/* Navigation Tabs — only shown when logged in */}
        {currentUser && (
          <nav style={{ display: 'flex', gap: 6, background: 'rgba(15, 23, 42, 0.6)', padding: 4, borderRadius: 12, border: '1px solid var(--border-glass)' }}>
            {[
              { id: 'dashboard', icon: <Activity size={15} />, label: 'Dashboard' },
              { id: 'diary', icon: <Calendar size={15} />, label: 'Diary' },
              { id: 'mealplan', icon: <Sparkles size={15} />, label: 'Meal Plan' },
              { id: 'analytics', icon: <BarChart3 size={15} />, label: 'Progress' },
              { id: 'profile', icon: <User size={15} />, label: 'Profile' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.85rem', padding: '8px 14px' }}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </nav>
        )}

        {/* Right: Health Score + Auth */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Health score badge — shown after assessment */}
          {currentUser && healthScore !== null && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'rgba(16, 185, 129, 0.1)',
              padding: '7px 14px', borderRadius: 12,
              border: '1px solid rgba(16, 185, 129, 0.2)'
            }}>
              <ShieldCheck size={20} color="#10b981" />
              <div>
                

              </div>
            </div>
          )}

          {/* Auth section */}
          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* User Avatar Chip */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'rgba(255,255,255,0.06)',
                padding: '7px 14px', borderRadius: 30,
                border: '1px solid var(--border-glass)'
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6366f1, #818cf8)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.8rem', fontWeight: 700, color: '#fff'
                }}>
                  {currentUser.name?.charAt(0).toUpperCase()}
                </div>
                <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 500 }}>
                  {currentUser.name?.split(' ')[0]}
                </span>
              </div>

              {/* Logout button */}
              <button
                onClick={onLogout}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border-glass)',
                  color: 'var(--text-muted)',
                  padding: '8px 12px',
                  borderRadius: 10,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: '0.82rem',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#fca5a5'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-glass)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
              >
                <LogOut size={15} /> Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={() => onOpenAuth('login')}
              className="btn-primary"
              style={{ padding: '9px 20px', display: 'flex', alignItems: 'center', gap: 7, fontSize: '0.9rem' }}
            >
              <LogIn size={16} /> Sign In
            </button>
          )}
        </div>

      </div>
    </header>
  );
}
