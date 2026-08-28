import React from 'react';
import { TestTube2, AlertTriangle, Info } from 'lucide-react';

export default function SymptomLabForm({ labs, setLabs, onRunAssessment, isLoading, assessmentError }) {
  const handleLabChange = (e) => {
    const { name, value } = e.target;
    const numVal = value === '' ? null : Number(value);
    setLabs(prev => ({
      ...prev,
      [name]: numVal,
      ...(name === 'vit_d_ng_ml' ? { serum_vitamin_d: numVal } : {}),
      ...(name === 'vit_b12_pg_ml' ? { vitamin_b12: numVal } : {}),
      ...(name === 'calcium_mg_dl' ? { calcium: numVal } : {}),
    }));
  };

  return (
    <div className="glass-card" style={{ padding: 28, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', marginBottom: 20, borderBottom: '1px solid var(--border-glass)', paddingBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
          <TestTube2 size={24} color="var(--primary)" style={{ flexShrink: 0 }} />
          <div>
            <h1 style={{ color: 'var(--text-main)', margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Clinical Blood Test Assessment</h1>
          </div>
        </div>
        <button className="btn-primary" onClick={onRunAssessment} disabled={isLoading} style={{ padding: '10px 22px', fontSize: '0.9rem', flexShrink: 0 }}>
          {isLoading ? 'Running ML Engine...' : 'Save Labs'}
        </button>
      </div>

      {/* Assessment Error Banner */}
      {assessmentError && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 18px',
          marginBottom: 20,
          borderRadius: 12,
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#fca5a5',
          fontSize: '0.9rem'
        }}>
          <AlertTriangle size={20} color="#ef4444" style={{ flexShrink: 0 }} />
          <div>
            <strong>Assessment Requirement:</strong> {assessmentError}
          </div>
        </div>
      )}

      {/* Lab Values Form */}
      <div>
        <div style={{ padding: 14, background: 'rgba(99, 102, 241, 0.1)', borderRadius: 10, border: '1px solid rgba(99, 102, 241, 0.2)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.85rem', color: '#a5b4fc' }}>
          <Info size={20} />
          <span>Adding actual blood test values allows the system to recalibrate deficiency risk scores.</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
          {/* Hemoglobin */}
          <div className="form-group">
            <label className="form-label">Hemoglobin (g/dL)</label>
            <input className="form-input" type="number" step="0.1" name="hemoglobin_g_dl" value={labs.hemoglobin_g_dl || ''} onChange={handleLabChange} placeholder="e.g. 10.5 (Ref: 12-16)" />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Optimal: 12.0 - 15.5 g/dL</span>
          </div>

          {/* Vitamin D 25-OH */}
          <div className="form-group">
            <label className="form-label">Vitamin D 25-OH (ng/mL)</label>
            <input className="form-input" type="number" step="0.1" name="vit_d_ng_ml" value={labs.vit_d_ng_ml || ''} onChange={handleLabChange} placeholder="e.g. 18.2 (Ref: 30-80)" />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Optimal: 30.0 - 80.0 ng/mL</span>
          </div>

          {/* Vitamin B12 */}
          <div className="form-group">
            <label className="form-label">Serum Vitamin B12 (pg/mL)</label>
            <input className="form-input" type="number" name="vit_b12_pg_ml" value={labs.vit_b12_pg_ml || ''} onChange={handleLabChange} placeholder="e.g. 195 (Ref: 200-900)" />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Optimal: 200 - 900 pg/mL</span>
          </div>

          {/* Serum Iron */}
          <div className="form-group">
            <label className="form-label">Serum Iron (mcg/dL)</label>
            <input className="form-input" type="number" name="serum_iron_mcg_dl" value={labs.serum_iron_mcg_dl || ''} onChange={handleLabChange} placeholder="e.g. 45 (Ref: 60-170)" />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Optimal: 60 - 170 mcg/dL</span>
          </div>

          {/* Serum Ferritin */}
          <div className="form-group">
            <label className="form-label">Serum Ferritin (ng/mL)</label>
            <input className="form-input" type="number" step="0.1" name="ferritin" value={labs.ferritin || ''} onChange={handleLabChange} placeholder="e.g. 25.0 (Ref: 30-300)" />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Optimal: 30.0 - 300.0 ng/mL</span>
          </div>

          {/* Serum Calcium */}
          <div className="form-group">
            <label className="form-label">Serum Calcium (mg/dL)</label>
            <input className="form-input" type="number" step="0.1" name="calcium_mg_dl" value={labs.calcium_mg_dl || ''} onChange={handleLabChange} placeholder="e.g. 8.8 (Ref: 8.6-10.3)" />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Optimal: 8.6 - 10.3 mg/dL</span>
          </div>
        </div>
      </div>

    </div>
  );
}
