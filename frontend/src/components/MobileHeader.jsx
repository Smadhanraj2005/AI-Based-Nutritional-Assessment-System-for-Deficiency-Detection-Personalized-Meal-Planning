import React from 'react';
import { Menu, ShieldCheck, HeartPulse } from 'lucide-react';
import logoImg from '../assets/logo.png';

export default function MobileHeader({ onToggleSidebar, activeTab, currentUser }) {
  const tabTitles = {
    dashboard: 'Dashboard',
    diary: 'Food Diary',
    bloodtest: 'Lab Results',
    assessment: 'AI Assessment',
    mealplan: 'Meal Schedule',
    analytics: 'Progress Analytics',
    profile: 'Health Profile'
  };

  return (
    <header
      className="mobile-topbar glass-card"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 900,
        padding: '10px 16px',
        display: 'none',
        alignItems: 'center',
        justify: 'space-between',
        borderRadius: 0,
        borderTop: 'none',
        borderLeft: 'none',
        borderRight: 'none',
        background: 'var(--bg-card-solid)',
        backdropFilter: 'blur(16px)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, overflow: 'hidden' }}>
        <button
          onClick={onToggleSidebar}
          style={{
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid var(--border-glass)',
            color: 'var(--text-main)',
            borderRadius: 8,
            padding: '6px 8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justify: 'center',
            flexShrink: 0
          }}
        >
          <Menu size={19} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
          <img
            src={logoImg}
            alt="NutriAI Logo"
            style={{ width: 28, height: 28, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
          />
          <h2 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {tabTitles[activeTab] || 'NutriAI'}
          </h2>
        </div>
      </div>

      {currentUser && (
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: 'linear-gradient(135deg, #6366f1, #818cf8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.8rem', fontWeight: 700, color: '#fff',
          flexShrink: 0,
          marginLeft: 8
        }}>
          {currentUser.name?.charAt(0).toUpperCase() || 'U'}
        </div>
      )}
    </header>
  );
}
