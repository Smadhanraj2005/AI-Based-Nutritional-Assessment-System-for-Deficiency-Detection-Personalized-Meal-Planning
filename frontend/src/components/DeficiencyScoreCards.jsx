import React from 'react';
import { AlertOctagon, CheckCircle2, ShieldAlert, Sparkles, Utensils, Pill } from 'lucide-react';

export default function DeficiencyScoreCards({ assessmentResult, onSelectRecipe }) {
  if (!assessmentResult || !assessmentResult.detected_deficiencies) {
    return (
      <div className="glass-card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
        <ShieldAlert size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
        <h3>No Diagnosis Executed Yet</h3>
        <p>Log your food diary or report symptoms and click "Run AI Deficiency Diagnosis" to generate risk cards.</p>
      </div>
    );
  }

  const { detected_deficiencies, bayesian_lab_updates, recommendations } = assessmentResult;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            AI Deficiency Risk Detection Cards ({detected_deficiencies.length} Detected)
          </h2>
        </div>
      </div>

      {detected_deficiencies.length === 0 ? (
        <div className="glass-card" style={{ padding: 32, textAlign: 'center', color: '#10b981' }}>
          <CheckCircle2 size={40} style={{ marginBottom: 12 }} />
          <h3>Optimal Micronutrient Balance</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No high or moderate risk deficiencies detected based on current dietary log and symptoms.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
          {detected_deficiencies.map((def, idx) => {
            const defName = def.deficiency;
            const rec = recommendations[defName] || {};
            const isHigh = def.risk_level === 'High';
            const bayesBoost = bayesian_lab_updates[defName];

            return (
              <div 
                key={idx} 
                className="glass-card" 
                style={{ 
                  padding: 24, 
                  borderLeft: isHigh ? '4px solid #ef4444' : '4px solid #f59e0b',
                  display: 'flex',
                  flexDirection: 'column',
                  justify: 'space-between'
                }}
              >
                <div>
                  {/* Card Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <span className={isHigh ? 'badge badge-danger' : 'badge badge-warning'}>
                        {def.risk_level} Risk • {def.confidence} Confidence
                      </span>
                      <h3 style={{ fontSize: '1.15rem', color: '#fff', marginTop: 8, marginBottom: 0 }}>{defName}</h3>
                    </div>
                    <div style={{ 
                      fontSize: '1.4rem', 
                      fontWeight: 800, 
                      color: isHigh ? '#ef4444' : '#f59e0b',
                      background: isHigh ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                      padding: '4px 12px',
                      borderRadius: 8
                    }}>
                      {int(def.probability * 100)}%
                    </div>
                  </div>

                  {/* Bayesian Lab Boost Alert */}
                  {bayesBoost && (
                    <div style={{ padding: '8px 12px', background: 'rgba(99, 102, 241, 0.12)', borderRadius: 8, border: '1px solid rgba(99, 102, 241, 0.25)', fontSize: '0.78rem', color: '#a5b4fc', marginBottom: 14 }}>
                      🧪 <strong>Bayesian Update:</strong> {bayesBoost}
                    </div>
                  )}

                  {/* Recommended Foods */}
                  {rec.recommended_foods && (
                    <div style={{ marginBottom: 14 }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                        <Utensils size={14} color="#10b981" /> Corrective Target Foods:
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {rec.recommended_foods.map((food, fIdx) => (
                          <span key={fIdx} style={{ fontSize: '0.78rem', padding: '3px 10px', borderRadius: 12, background: 'rgba(16, 185, 129, 0.12)', color: '#6ee7b7', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                            {food}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Dietary Synergy Advice */}
                  {rec.dietary_notes && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 14, background: 'rgba(255,255,255,0.02)', padding: 10, borderRadius: 8 }}>
                      💡 {rec.dietary_notes}
                    </div>
                  )}
                </div>

                {/* Supplement & Recipe Action */}
                <div style={{ borderTop: '1px solid var(--border-glass)', pt: 14, marginTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {rec.supplements && rec.supplements.length > 0 && (
                    <span style={{ fontSize: '0.76rem', color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Pill size={13} /> {rec.supplements[0]}
                    </span>
                  )}
                  {rec.suggested_recipes && rec.suggested_recipes.length > 0 && (
                    <button 
                      onClick={() => onSelectRecipe(rec.suggested_recipes[0])}
                      style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      <Sparkles size={14} /> View Recipe
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function int(val) {
  return Math.round(val);
}
