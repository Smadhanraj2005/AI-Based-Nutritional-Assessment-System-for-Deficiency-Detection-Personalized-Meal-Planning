import React, { useState } from 'react';
import { Stethoscope, TestTube2, AlertTriangle, CheckSquare, Square, Info } from 'lucide-react';

export default function SymptomLabForm({ symptoms, setSymptoms, labs, setLabs, onRunAssessment, isLoading }) {
  const [activeSubTab, setActiveSubTab] = useState('symptoms');

  const symptomList = [
    { key: 'fatigue', label: 'Fatigue & Low Energy', desc: 'Persistent tiredness unrelated to sleep' },
    { key: 'hair_loss', label: 'Hair Loss & Thinning', desc: 'Excessive hair shedding or slow growth' },
    { key: 'pale_skin', label: 'Pale Skin (Pallor)', desc: 'Unusual paleness of skin or inner eyelids' },
    { key: 'muscle_weakness', label: 'Muscle Weakness & Cramps', desc: 'Unexplained weakness or twitching' },
    { key: 'mood_changes', label: 'Mood Swings & Anxiety', desc: 'Irritability or low mood episodes' },
    { key: 'brittle_nails', label: 'Brittle / Ridged Nails', desc: 'Nails splitting or breaking easily' },
    { key: 'bleeding_gums', label: 'Bleeding Gums', desc: 'Gums bleeding during routine brushing' },
    { key: 'dry_skin', label: 'Severe Dry Skin', desc: 'Flaky or xerotic skin patches' },
    { key: 'cold_intolerance', label: 'Sensitivity to Cold', desc: 'Cold hands and feet constantly' },
    { key: 'slow_healing', label: 'Slow Wound Healing', desc: 'Minor cuts taking long to heal' }
  ];

  const handleSymptomToggle = (key) => {
    setSymptoms(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleLabChange = (e) => {
    const { name, value } = e.target;
    setLabs(prev => ({ ...prev, [name]: value === '' ? null : Number(value) }));
  };

  return (
    <div className="glass-card" style={{ padding: 28, margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, borderBottom: '1px solid var(--border-glass)', paddingBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Stethoscope size={28} color="var(--primary)" />
          <div>
            <h2 style={{ fontSize: '1.35rem', color: '#fff', margin: 0 }}>Symptom & Clinical Blood Test Assessment</h2>
          </div>
        </div>

        <button className="btn-primary" onClick={onRunAssessment} disabled={isLoading} style={{ padding: '12px 28px', fontSize: '1rem' }}>
          {isLoading ? 'Running ML Engine...' : '⚡ Run AI Deficiency Diagnosis'}
        </button>
      </div>

      {/* Sub Tabs */}
      <div className="tabs-header" style={{ marginBottom: 20 }}>
        <button 
          className={`tab-btn ${activeSubTab === 'symptoms' ? 'active' : ''}`} 
          onClick={() => setActiveSubTab('symptoms')}
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <Stethoscope size={18} /> Reported Symptoms ({Object.values(symptoms).filter(Boolean).length})
        </button>
        <button 
          className={`tab-btn ${activeSubTab === 'labs' ? 'active' : ''}`} 
          onClick={() => setActiveSubTab('labs')}
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <TestTube2 size={18} /> Blood Test Lab Values 
        </button>
      </div>

      {/* Symptoms Tab */}
      {activeSubTab === 'symptoms' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {symptomList.map(item => {
            const isChecked = symptoms[item.key];
            return (
              <div 
                key={item.key}
                onClick={() => handleSymptomToggle(item.key)}
                style={{
                  padding: 16,
                  borderRadius: 12,
                  background: isChecked ? 'rgba(16, 185, 129, 0.1)' : 'rgba(15, 23, 42, 0.4)',
                  border: isChecked ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border-glass)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12
                }}
              >
                <div style={{ marginTop: 2, color: isChecked ? '#10b981' : 'var(--text-muted)' }}>
                  {isChecked ? <CheckSquare size={20} /> : <Square size={20} />}
                </div>
                <div>
                  <strong style={{ display: 'block', fontSize: '0.92rem', color: isChecked ? '#fff' : 'var(--text-main)' }}>
                    {item.label}
                  </strong>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginTop: 2 }}>
                    {item.desc}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lab Values Tab */}
      {activeSubTab === 'labs' && (
        <div>
          <div style={{ padding: 14, background: 'rgba(99, 102, 241, 0.1)', borderRadius: 10, border: '1px solid rgba(99, 102, 241, 0.2)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.85rem', color: '#a5b4fc' }}>
            <Info size={20} />
            <span>Adding actual blood test values invokes the to recalibrate model confidence scores.</span>
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

            {/* Serum Calcium */}
            <div className="form-group">
              <label className="form-label">Serum Calcium (mg/dL)</label>
              <input className="form-input" type="number" step="0.1" name="calcium_mg_dl" value={labs.calcium_mg_dl || ''} onChange={handleLabChange} placeholder="e.g. 8.8 (Ref: 8.6-10.3)" />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Optimal: 8.6 - 10.3 mg/dL</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
