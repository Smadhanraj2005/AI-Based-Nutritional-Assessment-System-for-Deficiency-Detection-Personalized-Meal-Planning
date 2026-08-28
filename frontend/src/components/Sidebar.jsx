import React, { useState } from 'react';
import {
  Activity,
  Calendar,
  TestTube2,
  ShieldCheck,
  Sparkles,
  BarChart3,
  User,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  ChevronRight
} from 'lucide-react';
import logoImg from '../assets/logo.png';

export default function Sidebar({
  activeTab,
  setActiveTab,
  currentUser,
  onLogout,
  theme,
  onThemeToggle,
  isMobileOpen,
  setIsMobileOpen
}) {
  const navItems = [
    { id: 'dashboard', icon: <Activity size={18} />, label: 'Dashboard' },
    { id: 'diary', icon: <Calendar size={18} />, label: 'Food Diary' },
    { id: 'bloodtest', icon: <TestTube2 size={18} />, label: 'Lab Results' },
    { id: 'assessment', icon: <ShieldCheck size={18} />, label: 'AI Assessment' },
    { id: 'mealplan', icon: <Sparkles size={18} />, label: 'Meal Schedule' },
    { id: 'analytics', icon: <BarChart3 size={18} />, label: 'Progress Tracking' },
    { id: 'profile', icon: <User size={18} />, label: 'Health Profile' }
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 990
          }}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`app-sidebar ${isMobileOpen ? 'mobile-open' : ''}`}
        style={{
          width: 260,
          background: 'var(--bg-card-solid)',
          backdropFilter: 'blur(20px)',
          borderRight: '1px solid var(--border-glass)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '20px 16px',
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: 0,
          zIndex: 1000,
          transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          boxShadow: 'var(--shadow-md)'
        }}
      >
        <div>
          {/* Brand Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, padding: '0 6px' }}>
            <div
              style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
              onClick={() => { setActiveTab('dashboard'); setIsMobileOpen(false); }}
            >
              <img
                src={logoImg}
                alt="NutriAI Logo"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  objectFit: 'cover',
                  boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)',
                  border: '1px solid rgba(16, 185, 129, 0.3)'
                }}
              />
              <div>
                <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 4 }}>
                  Nutri<span style={{ color: 'var(--primary)' }}>AI</span>
                </h1>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>Deficiency Engine</span>
              </div>
            </div>

            {/* Close Button on Mobile Drawer */}
            <button
              className="sidebar-close-btn"
              onClick={() => setIsMobileOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: 4,
                display: 'none'
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation Links */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 10px 8px' }}>
              Core Navigation
            </span>

            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: isActive ? '1px solid var(--border-glass-active)' : '1px solid transparent',
                    background: isActive
                      ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.18), rgba(5, 150, 105, 0.25))'
                      : 'transparent',
                    color: isActive ? '#34d399' : 'var(--text-muted)',
                    fontFamily: 'var(--font-heading)',
                    fontSize: '0.88rem',
                    fontWeight: isActive ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isActive ? '0 4px 14px rgba(16, 185, 129, 0.18)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                      e.currentTarget.style.color = 'var(--text-main)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--text-muted)';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {item.icon}
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '2px 7px',
                      borderRadius: 10,
                      background: isActive ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.08)',
                      color: isActive ? '#34d399' : 'var(--text-muted)'
                    }}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer User Chip & Theme Toggle */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, borderTop: '1px solid var(--border-glass)', paddingTop: 16 }}>
          {currentUser && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 12px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: 12,
              border: '1px solid var(--border-glass)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
                <div style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6366f1, #818cf8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  color: '#fff',
                  flexShrink: 0
                }}>
                  {currentUser.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <strong style={{ fontSize: '0.84rem', color: 'var(--text-main)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {currentUser.name}
                  </strong>

                </div>
              </div>

              <button
                onClick={onLogout}
                title="Sign Out"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ef4444',
                  cursor: 'pointer',
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'transform 0.15s ease, opacity 0.15s ease',
                  opacity: 0.8
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.15)';
                  e.currentTarget.style.opacity = '1';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.opacity = '0.8';
                }}
              >
                <LogOut size={16} />
              </button>
            </div>
          )}

          {/* Theme Toggle Switch */}
          {onThemeToggle && (
            <button
              onClick={onThemeToggle}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '9px 12px',
                borderRadius: 10,
                background: theme === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(15, 118, 110, 0.05)',
                border: '1px solid var(--border-glass)',
                color: 'var(--text-main)',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = theme === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(15, 118, 110, 0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = theme === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(15, 118, 110, 0.05)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {theme === 'dark' ? <Moon size={16} color="#f59e0b" /> : <Sun size={16} color="#f59e0b" />}
                <span>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
              </div>

              {/* Premium Switch Slider */}
              <div style={{
                width: 36,
                height: 20,
                borderRadius: 10,
                background: theme === 'dark' ? 'var(--primary)' : 'rgba(15, 118, 110, 0.3)',
                border: theme === 'dark' ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(15, 118, 110, 0.15)',
                position: 'relative',
                transition: 'background 0.2s ease, border-color 0.2s ease',
                flexShrink: 0
              }}>
                <div style={{
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  background: '#fff',
                  position: 'absolute',
                  top: 2,
                  left: theme === 'dark' ? 18 : 2,
                  transition: 'left 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                }} />
              </div>
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
