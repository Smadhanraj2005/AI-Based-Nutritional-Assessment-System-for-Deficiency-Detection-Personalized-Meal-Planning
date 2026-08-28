import React from 'react';
import { User, Activity, AlertCircle, CheckCircle2, Target, ShieldCheck, Sun, Moon, Check, Plus } from 'lucide-react';

export default function ProfileForm({ profile, setProfile, currentUser, onSave, theme = 'dark', onThemeToggle }) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [isEditing, setIsEditing] = React.useState(false);
  const [profileBackup, setProfileBackup] = React.useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleArrayToggle = (category, item) => {
    if (!isEditing) return;
    setProfile(prev => {
      const current = prev[category] || [];
      const updated = current.includes(item)
        ? current.filter(i => i !== item)
        : [...current, item];
      return { ...prev, [category]: updated };
    });
  };

  const handleStartEdit = () => {
    setProfileBackup(JSON.parse(JSON.stringify(profile)));
    setIsEditing(true);
    setSuccess('');
    setError('');
  };

  const handleCancelEdit = () => {
    if (profileBackup) {
      setProfile(profileBackup);
    }
    setIsEditing(false);
    setConfirmPassword('');
    setError('');
  };

  const handleSaveClick = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      if (!profile?.name || !profile.name.trim()) {
        throw new Error('Full Name is required.');
      }
      if (!profile?.email || !profile.email.trim()) {
        throw new Error('Email Address is required.');
      }
      if (!/\S+@\S+\.\S+/.test(profile.email)) {
        throw new Error('Please enter a valid email address.');
      }
      if (profile?.password && profile.password.length < 6) {
        throw new Error('Password must be at least 6 characters long.');
      }
      if (profile?.password && profile.password !== confirmPassword) {
        throw new Error('New Password and Confirm Password do not match.');
      }

      await onSave(profile);
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      
      // Clear password field after successful save
      if (profile?.password) {
        setProfile(prev => ({ ...prev, password: '' }));
      }
      setConfirmPassword('');
    } catch (err) {
      setError(err.message || 'Failed to save profile.');
    } finally {
      setLoading(false);
    }
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

      {/* Error banner */}
      {error && (
        <div style={{
          padding: '12px 16px',
          marginBottom: 20,
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 10,
          color: '#fca5a5',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Success banner */}
      {success && (
        <div style={{
          padding: '12px 16px',
          marginBottom: 20,
          background: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: 10,
          color: '#a7f3d0',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <CheckCircle2 size={16} /> {success}
        </div>
      )}

      {/* Account Settings */}
      <h3 style={{ fontSize: '1.05rem', color: '#fff', marginTop: 12, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
        <User size={18} color="var(--primary)" /> Account Information
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 28 }}>
        {/* Full Name */}
        <div className="form-group">
          <label className="form-label">Full Name</label>
          <input className="form-input" type="text" name="name" value={profile?.name || ''} onChange={handleChange} placeholder="Full Name" disabled={!isEditing} />
        </div>

        {/* Email */}
        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input className="form-input" type="email" name="email" value={profile?.email || ''} onChange={handleChange} placeholder="Email Address" disabled={!isEditing} />
        </div>
      </div>

      {/* Health Metrics */}
      <h3 style={{ fontSize: '1.05rem', color: '#fff', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
        <Activity size={18} color="var(--secondary)" /> Health Metrics
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
        {/* Age */}
        <div className="form-group">
          <label className="form-label">Age (Years)</label>
          <input className="form-input" type="number" name="age" value={profile?.age || ''} onChange={handleChange} placeholder="e.g. 28" disabled={!isEditing} />
        </div>

        {/* Gender */}
        <div className="form-group">
          <label className="form-label">Gender</label>
          <select className="form-select" name="gender" value={profile?.gender || 'Female'} onChange={handleChange} disabled={!isEditing}>
            <option value="Female">Female</option>
            <option value="Male">Male</option>
          </select>
        </div>

        {/* Weight */}
        <div className="form-group">
          <label className="form-label">Weight (kg)</label>
          <input className="form-input" type="number" name="weight_kg" value={profile?.weight_kg || ''} onChange={handleChange} placeholder="e.g. 62" disabled={!isEditing} />
        </div>

        {/* Height */}
        <div className="form-group">
          <label className="form-label">Height (cm)</label>
          <input className="form-input" type="number" name="height_cm" value={profile?.height_cm || ''} onChange={handleChange} placeholder="e.g. 168" disabled={!isEditing} />
        </div>

        {/* Activity Level */}
        <div className="form-group">
          <label className="form-label">Activity Level</label>
          <select className="form-select" name="activity_level" value={profile?.activity_level || 'Moderate'} onChange={handleChange} disabled={!isEditing}>
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
                  padding: '6px 14px',
                  borderRadius: 20,
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  border: isSelected ? '1px solid #10b981' : '1px solid var(--border-glass)',
                  background: isSelected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.03)',
                  color: isSelected ? '#10b981' : 'var(--text-muted)',
                  cursor: isEditing ? 'pointer' : 'default',
                  pointerEvents: isEditing ? 'auto' : 'none',
                  opacity: isEditing ? 1 : 0.75,
                  transition: 'all 0.2s ease',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                {isSelected ? <Check size={14} /> : <Plus size={14} />}{opt}
              </button>
            );
          })}
        </div>
      </div>

      {/* Health Goals */}
      <div style={{ marginTop: 28 }}>
        <label className="form-label" style={{ marginBottom: 10, display: 'block' }}>
          Health & Wellness Goals
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {healthGoalsOptions.map(goal => {
            const isSelected = (profile?.health_goals || []).includes(goal);
            return (
              <button
                key={goal}
                type="button"
                onClick={() => handleArrayToggle('health_goals', goal)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 20,
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  border: isSelected ? '1px solid #6366f1' : '1px solid var(--border-glass)',
                  background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.03)',
                  color: isSelected ? '#818cf8' : 'var(--text-muted)',
                  cursor: isEditing ? 'pointer' : 'default',
                  pointerEvents: isEditing ? 'auto' : 'none',
                  opacity: isEditing ? 1 : 0.75,
                  transition: 'all 0.2s ease',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                {isSelected ? <Check size={14} /> : <Plus size={14} />}{goal}
              </button>
            );
          })}
        </div>
      </div>

      {/* Change Password */}
      <h3 style={{ fontSize: '1.05rem', color: '#fff', marginTop: 28, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
        <ShieldCheck size={18} color="var(--primary)" /> Change Password
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 400, marginBottom: 28 }}>
        {/* Password */}
        <div className="form-group">
          <label className="form-label">New Password (leave blank to keep current)</label>
          <input className="form-input" type="password" name="password" value={profile?.password || ''} onChange={handleChange} placeholder="New Password" disabled={!isEditing} />
        </div>

        {/* Confirm Password */}
        <div className="form-group">
          <label className="form-label">Confirm New Password</label>
          <input className="form-input" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm Password" disabled={!isEditing} />
        </div>
      </div>

      {/* Theme Preferences */}
      <h3 style={{ fontSize: '1.05rem', color: 'var(--text-main)', marginTop: 28, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
        {theme === 'dark' ? <Moon size={18} color="var(--secondary)" /> : <Sun size={18} color="var(--warning)" />} Theme Preferences
      </h3>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 24px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-glass)',
        background: 'var(--bg-card-hover)',
        maxWidth: 420,
        marginBottom: 28,
        transition: 'all 0.3s ease'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: theme === 'dark'
              ? 'linear-gradient(135deg, #1e293b, #334155)'
              : 'linear-gradient(135deg, #fef9c3, #fde68a)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: theme === 'dark' ? '0 0 12px rgba(99,102,241,0.3)' : '0 0 12px rgba(245,158,11,0.3)',
            transition: 'all 0.35s ease'
          }}>
            {theme === 'dark'
              ? <Moon size={22} color="#818cf8" />
              : <Sun size={22} color="#d97706" />}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
              {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: 2 }}>
              {theme === 'dark' ? 'Easy on the eyes at night' : 'Clean & bright clinical look'}
            </div>
          </div>
        </div>

        {/* Toggle switch */}
        <button
          type="button"
          onClick={onThemeToggle}
          aria-label="Toggle theme"
          style={{
            width: 58, height: 30,
            borderRadius: 999,
            border: 'none',
            cursor: 'pointer',
            padding: 3,
            background: theme === 'dark'
              ? 'linear-gradient(135deg, #6366f1, #4f46e5)'
              : 'linear-gradient(135deg, #10b981, #059669)',
            boxShadow: theme === 'dark'
              ? '0 0 10px rgba(99,102,241,0.4)'
              : '0 0 10px rgba(16,185,129,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: theme === 'dark' ? 'flex-end' : 'flex-start',
            transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
            flexShrink: 0
          }}
        >
          <div style={{
            width: 24, height: 24, borderRadius: '50%', background: '#fff',
            boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.35s ease'
          }}>
            {theme === 'dark'
              ? <Moon size={13} color="#4f46e5" />
              : <Sun size={13} color="#059669" />}
          </div>
        </button>
      </div>

      <div style={{ marginTop: 32, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
        {!isEditing ? (
          <button className="btn-primary" onClick={handleStartEdit} type="button">
            <User size={18} style={{ marginRight: 6 }} /> Edit Profile
          </button>
        ) : (
          <>
            <button className="btn-secondary" onClick={handleCancelEdit} type="button" disabled={loading} style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
              Cancel
            </button>
            <button className="btn-primary" onClick={handleSaveClick} disabled={loading} type="button">
              {loading ? 'Saving Health Profile...' : (
                <>
                  <CheckCircle2 size={18} style={{ marginRight: 6 }} /> Save & Apply Health Profile
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
