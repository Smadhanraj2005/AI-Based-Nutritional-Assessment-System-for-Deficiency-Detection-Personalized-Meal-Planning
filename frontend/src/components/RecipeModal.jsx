import React from 'react';
import { X, Clock, Users, Flame, Sparkles, Check } from 'lucide-react';

export default function RecipeModal({ recipe, recipesList, onClose }) {
  if (!recipe) return null;

  // Find detailed recipe object if passed by id or partial name
  const detailedRecipe = recipesList.find(r => r.id === recipe.id || r.name.toLowerCase() === recipe.name.toLowerCase()) || recipesList[0];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20
    }}>
      <div className="glass-card" style={{ maxWidth: 700, width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: 32, position: 'relative' }}>
        
        {/* Close button */}
        <button 
          onClick={onClose} 
          style={{ position: 'absolute', right: 20, top: 20, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          <X size={24} />
        </button>

        {/* Title */}
        <span className="badge badge-success" style={{ marginBottom: 10, display: 'inline-block' }}>Deficiency Corrective Recipe</span>
        <h2 style={{ fontSize: '1.6rem', color: '#fff', marginBottom: 12 }}>{detailedRecipe.name}</h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: 20 }}>{detailedRecipe.description}</p>

        {/* Stats bar */}
        <div style={{ display: 'flex', gap: 24, padding: '14px 20px', background: 'rgba(15, 23, 42, 0.6)', borderRadius: 12, marginBottom: 24, border: '1px solid var(--border-glass)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.88rem' }}>
            <Clock size={18} color="var(--primary)" />
            <span>Prep: <strong>{detailedRecipe.prep_time_mins} mins</strong></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.88rem' }}>
            <Flame size={18} color="var(--warning)" />
            <span>Energy: <strong>{detailedRecipe.calories_per_serving} kcal</strong></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.88rem' }}>
            <Users size={18} color="var(--secondary)" />
            <span>Servings: <strong>{detailedRecipe.servings}</strong></span>
          </div>
        </div>

        {/* Ingredients Checklist */}
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: 12 }}>🛒 Required Ingredients</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
            {detailedRecipe.ingredients.map((ing, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.88rem', color: 'var(--text-main)', background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: 8 }}>
                <Check size={16} color="#10b981" /> {ing}
              </div>
            ))}
          </div>
        </div>

        {/* Cooking Instructions */}
        <div>
          <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: 12 }}>👨‍🍳 Preparation Steps</h3>
          <ol style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 12, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            {detailedRecipe.instructions.map((step, idx) => (
              <li key={idx} style={{ lineHeight: 1.5 }}>
                <strong style={{ color: '#fff' }}>Step {idx + 1}:</strong> {step}
              </li>
            ))}
          </ol>
        </div>

      </div>
    </div>
  );
}
