import React from 'react';
import { Network, TrendingUp, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function ShapExplanationView({ shapExplanations }) {
  if (!shapExplanations || Object.keys(shapExplanations).length === 0) {
    return null;
  }

  return (
    <div className="glass-card" style={{ padding: 28, marginTop: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <Network size={26} color="var(--secondary)" />
        <div>
          <h3 style={{ fontSize: '1.25rem', color: '#fff', margin: 0 }}>SHAP Model Explainability & Feature Importance</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>Understand the exact physiological, dietary, and laboratory drivers behind each deficiency diagnosis.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        {Object.entries(shapExplanations).map(([deficiency, factors]) => (
          <div key={deficiency} style={{ background: 'rgba(15, 23, 42, 0.5)', padding: 18, borderRadius: 12, border: '1px solid var(--border-glass)' }}>
            <h4 style={{ fontSize: '1rem', color: '#818cf8', marginBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 8 }}>
              {deficiency}
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {factors.map((factor, fIdx) => {
                const isPositive = factor.type !== 'protective';
                return (
                  <div key={fIdx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.83rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ 
                        width: 8, 
                        height: 8, 
                        borderRadius: '50%', 
                        background: isPositive ? '#ef4444' : '#10b981' 
                      }} />
                      <strong style={{ color: '#fff' }}>{factor.feature}</strong>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{factor.value}</span>
                      <span style={{ 
                        fontWeight: 700, 
                        color: isPositive ? '#ef4444' : '#10b981',
                        background: isPositive ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                        padding: '2px 8px',
                        borderRadius: 6
                      }}>
                        {factor.impact}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
