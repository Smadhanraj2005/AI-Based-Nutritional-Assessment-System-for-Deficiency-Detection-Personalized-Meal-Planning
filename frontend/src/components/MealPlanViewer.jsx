import React, { useState } from 'react';
import { Calendar, Sparkles, Utensils, CheckCircle2, ChevronRight, Clock } from 'lucide-react';

export default function MealPlanViewer({ mealPlanData, onSelectRecipe }) {
  const [selectedDay, setSelectedDay] = useState(0);

  if (!mealPlanData || !mealPlanData.meal_plan) {
    return (
      <div className="glass-card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
        <Calendar size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
        <h3>No Meal Plan Generated Yet</h3>
        <p>Run the AI assessment or click "Generate 7-Day Meal Plan" to create your custom meal schedule.</p>
      </div>
    );
  }

  const { meal_plan, targeted_deficiencies } = mealPlanData;
  const currentDayPlan = meal_plan[selectedDay] || meal_plan[0];

  return (
    <div>
      {/* Plan Header */}
      <div className="glass-card" style={{ padding: 24, marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <span className="badge badge-success" style={{ marginBottom: 8, display: 'inline-block' }}>AI Personalized 7-Day Protocol</span>
          <h2 style={{ fontSize: '1.4rem', color: '#fff', margin: 0 }}>Targeted Deficiency Corrective Schedule</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
            Addressing: {targeted_deficiencies.join(', ') || 'General Nutrient Support'}
          </p>
        </div>
      </div>

      {/* Day Selector Buttons */}
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 12, marginBottom: 24 }}>
        {meal_plan.map((dayItem, idx) => (
          <button
            key={idx}
            onClick={() => setSelectedDay(idx)}
            style={{
              flex: '1 0 130px',
              padding: '14px 16px',
              borderRadius: 12,
              border: selectedDay === idx ? '1px solid #10b981' : '1px solid var(--border-glass)',
              background: selectedDay === idx ? 'var(--primary-glow)' : 'rgba(15, 23, 42, 0.5)',
              color: selectedDay === idx ? '#10b981' : 'var(--text-main)',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s ease'
            }}
          >
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block' }}>Day {idx + 1}</span>
            <strong style={{ fontSize: '1.05rem', display: 'block' }}>{dayItem.day}</strong>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{dayItem.total_calories} kcal</span>
          </button>
        ))}
      </div>

      {/* Meals Breakdown for Selected Day */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
        {['breakfast', 'lunch', 'dinner', 'snack'].map((mealKey) => {
          const meal = currentDayPlan.meals[mealKey];
          const titlesMap = { breakfast: '🌅 Breakfast', lunch: '☀️ Lunch', dinner: '🌙 Dinner', snack: '🍎 Healthy Snack' };

          return (
            <div key={mealKey} className="glass-card" style={{ padding: 22, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h4 style={{ fontSize: '1rem', color: '#10b981', margin: 0 }}>{titlesMap[mealKey]}</h4>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{meal.calories} kcal</span>
                </div>

                <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: 8 }}>{meal.title}</h3>

                <div style={{ background: 'rgba(255,255,255,0.03)', padding: 10, borderRadius: 8, fontSize: '0.8rem', color: '#93c5fd', border: '1px solid rgba(255,255,255,0.05)', marginBottom: 14 }}>
                  ✨ <strong>Benefit:</strong> {meal.focus}
                </div>
              </div>

              {meal.recipe_id && (
                <button 
                  className="btn-primary" 
                  style={{ width: '100%', justifyContent: 'center', padding: '10px', fontSize: '0.85rem' }}
                  onClick={() => onSelectRecipe({ id: meal.recipe_id, name: meal.title })}
                >
                  <Sparkles size={16} /> View Recipe & Preparation
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
