import React from 'react';
import { User, Activity, AlertCircle, CheckCircle2, Target, ShieldCheck } from 'lucide-react';

export default function ProfileForm({ profile, setProfile, currentUser, onSave }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleArrayToggle = (category, item) => {
    setProfile(prev => {
      const current = prev[category] || [];
      const updated = current.includes(item)
        ? current.filter(i => i !== item)
        : [...current, item];
      return { ...prev, [category]: updated };
    });
  };

  const dietaryOptions = ["Vegan", "Vegetarian", "Gluten-Free", "Dairy-Free", "Halal", "Keto", "Nut-Free"];
  const healthGoalsOptions = ["Address Fatigue", "Improve Bone Density", "Optimize Energy", "Boost Immunity", "Manage Weight", "Muscle Recovery"];

  return (
    <div className="glass-card" style={{ padding: 28, maxWidth: 900, margin: '0 auto' }}>
      {/* Logged in User Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
        borderBottom: '1px solid var(--border-glass)',
        paddingBottom: 16
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 'bold',
            fontSize: '1.2rem'
          }}>
            {(profile?.name || currentUser?.name || 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 style={{ fontSize: '1.4rem', color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              {profile?.name || currentUser?.name || 'User Profile'}
              <span className="badge badge-success" style={{ fontSize: '0.75rem', padding: '2px 8px' }}>
                <ShieldCheck size={12} style={{ display: 'inline', marginRight: 4 }} /> Logged In
              </span>
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              {currentUser?.email ? currentUser.email : 'Personalized Health Profile'}
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
        {/* Full Name */}
        <div className="form-group">
          <label className="form-label">Full Name</label>
          <input className="form-input" type="text" name="name" value={profile?.name || ''} onChange={handleChange} placeholder="Full Name" />
        </div>

        {/* Age */}
        <div className="form-group">
          <label className="form-label">Age (Years)</label>
          <input className="form-input" type="number" name="age" value={profile?.age || ''} onChange={handleChange} placeholder="e.g. 28" />
        </div>

        {/* Gender */}
        <div className="form-group">
          <label className="form-label">Gender</label>
          <select className="form-select" name="gender" value={profile?.gender || 'Female'} onChange={handleChange}>
            <option value="Female">Female</option>
            <option value="Male">Male</option>
          </select>
        </div>

        {/* Weight */}
        <div className="form-group">
          <label className="form-label">Weight (kg)</label>
          <input className="form-input" type="number" name="weight_kg" value={profile?.weight_kg || ''} onChange={handleChange} placeholder="e.g. 62" />
        </div>

        {/* Height */}
        <div className="form-group">
          <label className="form-label">Height (cm)</label>
          <input className="form-input" type="number" name="height_cm" value={profile?.height_cm || ''} onChange={handleChange} placeholder="e.g. 168" />
        </div>

        {/* Activity Level */}
        <div className="form-group">
          <label className="form-label">Activity Level</label>
          <select className="form-select" name="activity_level" value={profile?.activity_level || 'Moderate'} onChange={handleChange}>
            <option value="Sedentary">Sedentary (Little or no exercise)</option>
            <option value="Moderate">Moderate (Exercise 3-5 days/wk)</option>
            <option value="Active">Active (Heavy exercise 6-7 days/wk)</option>
          </select>
        </div>
      </div>

      {/* Dietary Restrictions */}
      <div style={{ marginTop: 28 }}>
        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <AlertCircle size={16} color="var(--warning)" /> Dietary Restrictions & Allergies
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 8 }}>
          {dietaryOptions.map(opt => {
            const isSelected = (profile?.dietary_restrictions || []).includes(opt);
            return (
              <button
                key={opt}
                type="button"
                onClick={() => handleArrayToggle('dietary_restrictions', opt)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 20,
                  fontSize: '0.85rem',
                  border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-glass)',
                  background: isSelected ? 'var(--primary-glow)' : 'rgba(255,255,255,0.03)',
                  color: isSelected ? '#10b981' : 'var(--text-muted)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {isSelected ? '✓ ' : '+ '}{opt}
              </button>
            );
          })}
        </div>
      </div>

      {/* Health Goals */}
      <div style={{ marginTop: 28 }}>
        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Target size={16} color="var(--secondary)" /> Health & Wellness Goals
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 8 }}>
          {healthGoalsOptions.map(goal => {
            const isSelected = (profile?.health_goals || []).includes(goal);
            return (
              <button
                key={goal}
                type="button"
                onClick={() => handleArrayToggle('health_goals', goal)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 20,
                  fontSize: '0.85rem',
                  border: isSelected ? '1px solid var(--secondary)' : '1px solid var(--border-glass)',
                  background: isSelected ? 'var(--secondary-glow)' : 'rgba(255,255,255,0.03)',
                  color: isSelected ? '#818cf8' : 'var(--text-muted)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {isSelected ? '✓ ' : '+ '}{goal}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ marginTop: 32, display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn-primary" onClick={onSave}>
          <CheckCircle2 size={18} /> Save & Apply Health Profile
        </button>
      </div>
    </div>
  );
}
