import React, { useState } from 'react';
import { Activity, ShieldCheck, TestTube2, HeartPulse, Sparkles, User, Calendar, BarChart3, LogIn, LogOut, ChevronDown, Mail } from 'lucide-react';
import logoImg from '../assets/logo.png';

export default function Header({ activeTab, setActiveTab, healthScore, currentUser, onOpenAuth, onLogout }) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <header className="glass-card header-root" style={{
      borderRadius: 0,
      borderTop: 'none',
      borderLeft: 'none',
      borderRight: 'none',
      padding: '12px 24px',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div className="header-top-wrapper" style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>

        {/* Brand Bar (Contains Brand logo + user menu on right in mobile) */}
        <div className="header-brand-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => setActiveTab && setActiveTab('dashboard')}>
            <img
              src={logoImg}
              alt="NutriAI Logo"
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                objectFit: 'cover',
                boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)',
                border: '1px solid rgba(16, 185, 129, 0.3)'
              }}
            />
            <div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: 6, letterSpacing: '-0.02em' }}>
                Nutri<span style={{ color: 'var(--primary)' }}>AI</span>
              </h1>
              <p className="header-subtitle" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                Deficiency Assessment Engine
              </p>
            </div>
          </div>

          {/* User Chip for Mobile Top Right */}
          <div className="header-user-mobile">
            {currentUser && (
              <div
                style={{ position: 'relative' }}
                onClick={() => setShowMenu(v => !v)}
              >
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'rgba(255,255,255,0.06)',
                  padding: '4px 10px', borderRadius: 30,
                  border: '1px solid var(--border-glass)',
                  cursor: 'pointer'
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6366f1, #818cf8)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.85rem', fontWeight: 700, color: '#fff'
                  }}>
                    {currentUser.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-main)', fontWeight: 600 }}>
                    {currentUser.name?.split(' ')[0]}
                  </span>
                  <ChevronDown size={13} color="var(--text-muted)" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Tabs — single-row touch scroll on mobile */}
        {currentUser && (
          <nav className="header-nav-container">
            {[
              { id: 'dashboard', icon: <Activity size={14} />, label: 'Dashboard' },
              { id: 'diary', icon: <Calendar size={14} />, label: 'Diary' },
              { id: 'bloodtest', icon: <TestTube2 size={14} />, label: 'Lab Results' },
              { id: 'assessment', icon: <ShieldCheck size={14} />, label: 'Assessment' },
              { id: 'mealplan', icon: <Sparkles size={14} />, label: 'Meal Plan' },
              { id: 'analytics', icon: <BarChart3 size={14} />, label: 'Progress' },
              { id: 'profile', icon: <User size={14} />, label: 'Profile' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.82rem', padding: '7px 13px', flexShrink: 0 }}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </nav>
        )}

        {/* Right: Desktop User Avatar & Popover Dropdown */}
        <div className="header-user-desktop">
          {currentUser ? (
            <div
              style={{ position: 'relative' }}
              onMouseEnter={() => setShowMenu(true)}
              onMouseLeave={() => setShowMenu(false)}
            >
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'rgba(255,255,255,0.06)',
                padding: '6px 12px', borderRadius: 30,
                border: '1px solid var(--border-glass)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6366f1, #818cf8)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.9rem', fontWeight: 700, color: '#fff',
                  boxShadow: '0 2px 8px rgba(99, 102, 241, 0.4)'
                }}>
                  {currentUser.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 600 }}>
                  {currentUser.name?.split(' ')[0]}
                </span>
                <ChevronDown size={14} color="var(--text-muted)" />
              </div>

              {/* Hover Popover Dropdown displaying Name, Email, Sign Out */}
              {showMenu && (
                <div style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  marginTop: 6,
                  width: 240,
                  background: 'rgba(15, 23, 42, 0.95)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: 14,
                  padding: 16,
                  boxShadow: '0 12px 30px rgba(0, 0, 0, 0.6)',
                  zIndex: 200,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: '50%',
                      background: 'linear-gradient(135deg, #6366f1, #818cf8)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.1rem', fontWeight: 700, color: '#fff',
                      flexShrink: 0
                    }}>
                      {currentUser.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#fff', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {currentUser.name}
                      </h4>
                      <p style={{ margin: '3px 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Mail size={12} /> {currentUser.email}
                      </p>
                    </div>
                  </div>

                  <div style={{ height: 1, background: 'var(--border-glass)', width: '100%' }} />

                  <button
                    onClick={onLogout}
                    style={{
                      background: 'rgba(239, 68, 68, 0.12)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#fca5a5',
                      padding: '9px 12px',
                      borderRadius: 10,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justify: 'center',
                      gap: 8,
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      transition: 'all 0.2s ease',
                      width: '100%'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)'; e.currentTarget.style.color = '#ef4444'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)'; e.currentTarget.style.color = '#fca5a5'; }}
                  >
                    <LogOut size={15} /> Sign Out
                  </button>
                </div>
              )}
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
