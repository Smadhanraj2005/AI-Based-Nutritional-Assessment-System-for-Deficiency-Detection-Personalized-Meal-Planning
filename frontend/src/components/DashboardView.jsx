import React, { useState } from 'react';
import {
  Utensils,
  Sparkles,
  CheckCircle2,
  Circle,
  Flame,
  Dumbbell,
  Wheat,
  Droplet,
  ShieldCheck,
  Calendar,
  Stethoscope,
  TestTube2,
  ArrowRight,
  ChevronRight,
  TrendingUp,
  Activity,
  Plus
} from 'lucide-react';
import {
  calculateNutritionTotals,
  calculateSetupProgress,
  getNutrientStatus,
  getContextualGreeting,
  getFormattedDate,
  getTodayStr
} from '../services/nutritionHelper';

export default function DashboardView({
  profile,
  loggedFoods,
  symptoms,
  labs,
  assessmentResult,
  setActiveTab
}) {
  const todayStr = getTodayStr();
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const isToday = selectedDate === todayStr;

  // ── Calculate nutritional data for selected date ────────────
  const { totals, rda, percentages, itemsCount } = calculateNutritionTotals(loggedFoods, profile, selectedDate);
  const setupProgress = calculateSetupProgress(profile, loggedFoods, symptoms, labs);
  const greeting = getContextualGreeting(profile?.name || 'User');
  const formattedDate = getFormattedDate(selectedDate);

  // ── Setup Circular Progress Ring ────────────────────────────
  const ringRadius = 28;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringFilled = ringCircumference * (setupProgress.percentage / 100);
  const ringGap = ringCircumference - ringFilled;

  // ── Key Micronutrients List ─────────────────────────────────
  const micronutrients = [
    { name: 'Iron', key: 'iron_mg', current: totals.iron_mg, target: rda.iron_mg, unit: 'mg', pct: percentages.iron_mg },
    { name: 'Calcium', key: 'calcium_mg', current: totals.calcium_mg, target: rda.calcium_mg, unit: 'mg', pct: percentages.calcium_mg },
    { name: 'Vitamin D', key: 'vitamin_d_iu', current: totals.vitamin_d_iu, target: rda.vitamin_d_iu, unit: 'IU', pct: percentages.vitamin_d_iu },
    { name: 'Vitamin B12', key: 'vitamin_b12_mcg', current: totals.vitamin_b12_mcg, target: rda.vitamin_b12_mcg, unit: 'mcg', pct: percentages.vitamin_b12_mcg },
    { name: 'Vitamin C', key: 'vitamin_c_mg', current: totals.vitamin_c_mg, target: rda.vitamin_c_mg, unit: 'mg', pct: percentages.vitamin_c_mg },
    { name: 'Zinc', key: 'zinc_mg', current: totals.zinc_mg, target: rda.zinc_mg, unit: 'mg', pct: percentages.zinc_mg },
    { name: 'Magnesium', key: 'magnesium_mg', current: totals.magnesium_mg, target: rda.magnesium_mg, unit: 'mg', pct: percentages.magnesium_mg },
    { name: 'Folate (B9)', key: 'folate_mcg', current: totals.folate_mcg, target: rda.folate_mcg, unit: 'mcg', pct: percentages.folate_mcg },
    { name: 'Dietary Fiber', key: 'fiber_g', current: totals.fiber_g, target: rda.fiber_g, unit: 'g', pct: percentages.fiber_g },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28, maxWidth: 1200, margin: '0 auto' }}>

      {/* ────────────────────────────────────────────────────────
          A. DASHBOARD HEADER
          Personalized greeting, date subtitle, primary actions
      ──────────────────────────────────────────────────────── */}
      <div className="glass-card" style={{ padding: '26px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
        <div>
          <h1 style={{ fontSize: 'clamp(1.3rem, 4.5vw, 1.75rem)', fontWeight: 800, color: 'var(--text-main)', margin: 0, letterSpacing: '-0.015em', lineHeight: 1.25 }}>
            {greeting}
          </h1>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: '6px 0 0 0', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#10b981', flexShrink: 0 }}></span>
            Nutritional overview · <strong style={{ color: 'var(--text-main)', fontWeight: 600 }}>{formattedDate}</strong>
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Log a Meal Button */}
          <button
            onClick={() => setActiveTab('diary')}
            className="btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', fontSize: '0.92rem' }}
          >
            <Plus size={18} /> Log a Meal
          </button>

          {/* Assessment Shortcut Button */}
          <button
            onClick={() => setActiveTab('assessment')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 18px',
              fontSize: '0.92rem',
              background: 'rgba(99, 102, 241, 0.15)',
              color: '#818cf8',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: 10,
              cursor: 'pointer',
              fontWeight: 600,
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.25)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)'}
          >
            <Sparkles size={17} /> Run Assessment
          </button>
        </div>
      </div>


      {/* ────────────────────────────────────────────────────────
          B. SETUP / COMPLETION PROGRESS SECTION
          Card near top: Circular indicator, "[X] of 4 steps done", 4 checklist items
      ──────────────────────────────────────────────────────── */}
      <div className="glass-card" style={{ padding: '24px 28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 20, borderBottom: '1px solid var(--border-glass)', paddingBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* Circular completion percentage ring */}
            <div style={{ position: 'relative', width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="64" height="64" viewBox="0 0 64 64" style={{ transform: 'rotate(-90deg)' }}>
                <circle
                  cx="32"
                  cy="32"
                  r={ringRadius}
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth="5"
                  fill="transparent"
                />
                <circle
                  cx="32"
                  cy="32"
                  r={ringRadius}
                  stroke={setupProgress.percentage === 100 ? '#10b981' : '#6366f1'}
                  strokeWidth="5"
                  strokeDasharray={`${ringFilled} ${ringGap}`}
                  strokeLinecap="round"
                  fill="transparent"
                  style={{ transition: 'stroke-dasharray 0.6s ease' }}
                />
              </svg>
              <span style={{ position: 'absolute', fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {setupProgress.percentage}%
              </span>
            </div>

            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                Complete your setup
              </h2>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: '3px 0 0 0' }}>
                <strong style={{ color: setupProgress.percentage === 100 ? '#10b981' : '#818cf8' }}>
                  {setupProgress.completedCount} of {setupProgress.totalSteps} steps done
                </strong> — complete your health profile and diagnostics for optimal assessment accuracy.
              </p>
            </div>
          </div>

          {setupProgress.percentage === 100 && (
            <span style={{ fontSize: '0.78rem', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '6px 14px', borderRadius: 20, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={14} color="#10b981" /> All Steps Complete
            </span>
          )}
        </div>

        {/* 4 Setup Checklist Items */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
          {setupProgress.steps.map((step, idx) => (
            <div
              key={step.id}
              onClick={() => setActiveTab(step.tab)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                padding: '14px 16px',
                borderRadius: 12,
                background: step.isCompleted ? 'rgba(16, 185, 129, 0.06)' : 'rgba(255, 255, 255, 0.03)',
                border: step.isCompleted ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid var(--border-glass)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.borderColor = step.isCompleted ? '#10b981' : '#6366f1';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = step.isCompleted ? 'rgba(16, 185, 129, 0.25)' : 'var(--border-glass)';
              }}
            >
              <div style={{ marginTop: 2, flexShrink: 0 }}>
                {step.isCompleted ? (
                  <CheckCircle2 size={20} color="#10b981" />
                ) : (
                  <Circle size={20} color="var(--text-muted)" />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: 600, color: step.isCompleted ? 'var(--text-main)' : 'var(--text-muted)' }}>
                    {idx + 1}. {step.title}
                  </span>
                  <ChevronRight size={14} color="var(--text-muted)" />
                </div>
                <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: '4px 0 0 0', lineHeight: 1.3 }}>
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>


      {/* ────────────────────────────────────────────────────────
          C. DAILY MACRONUTRIENT SUMMARY CARDS (HORIZONTAL GRID)
          Calories, Protein, Carbohydrates, Fat with Progress Bars
      ──────────────────────────────────────────────────────── */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', color: 'var(--text-main)', margin: 0, fontWeight: 700 }}>
              Daily Macronutrient Intake
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              Real-time consumption for <strong style={{ color: 'var(--text-main)' }}>{isToday ? 'Today' : selectedDate}</strong> computed from food diary entries vs target.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255, 255, 255, 0.04)', padding: '6px 12px', borderRadius: 10, border: '1px solid var(--border-glass)' }}>
              <Calendar size={16} color="var(--primary)" />
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-main)',
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              />
              {!isToday && (
                <button
                  onClick={() => setSelectedDate(todayStr)}
                  style={{
                    background: 'rgba(99, 102, 241, 0.2)',
                    border: 'none',
                    color: '#818cf8',
                    borderRadius: 4,
                    padding: '3px 8px',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  Reset to Today
                </button>
              )}
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', background: 'rgba(255, 255, 255, 0.04)', padding: '7px 14px', borderRadius: 10, border: '1px solid var(--border-glass)' }}>
              <strong style={{ color: 'var(--primary)' }}>{itemsCount}</strong> logged {itemsCount === 1 ? 'item' : 'items'}
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 18 }}>

          {/* Card 1: Calories */}
          <div className="glass-card" style={{ padding: '20px 22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(239, 68, 68, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Flame size={18} color="#ef4444" />
                </div>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>Calories</span>
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ef4444' }}>
                {percentages.calories}%
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: '10px 0 6px' }}>
              <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {totals.calories}
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>kcal</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6 }}>
              <span>Target: {rda.calories} kcal</span>
              <span>{Math.max(0, rda.calories - totals.calories)} kcal left</span>
            </div>

            {/* Progress Bar */}
            <div style={{ width: '100%', height: 7, borderRadius: 10, background: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${Math.min(percentages.calories, 100)}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #f87171, #ef4444)',
                  borderRadius: 10,
                  transition: 'width 0.6s ease'
                }}
              />
            </div>
          </div>

          {/* Card 2: Protein */}
          <div className="glass-card" style={{ padding: '20px 22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(16, 185, 129, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Dumbbell size={18} color="#10b981" />
                </div>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>Protein</span>
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#10b981' }}>
                {percentages.protein_g}%
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: '10px 0 6px' }}>
              <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {totals.protein_g}
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>g</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6 }}>
              <span>Target: {rda.protein_g} g</span>
              <span>{percentages.protein_g >= 100 ? 'Goal Met' : `${(rda.protein_g - totals.protein_g).toFixed(1)} g left`}</span>
            </div>

            {/* Progress Bar */}
            <div style={{ width: '100%', height: 7, borderRadius: 10, background: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${Math.min(percentages.protein_g, 100)}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #34d399, #10b981)',
                  borderRadius: 10,
                  transition: 'width 0.6s ease'
                }}
              />
            </div>
          </div>

          {/* Card 3: Carbohydrates */}
          <div className="glass-card" style={{ padding: '20px 22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(245, 158, 11, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Wheat size={18} color="#f59e0b" />
                </div>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>Carbs</span>
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f59e0b' }}>
                {percentages.carbs_g}%
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: '10px 0 6px' }}>
              <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {totals.carbs_g}
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>g</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6 }}>
              <span>Target: {rda.carbs_g} g</span>
              <span>{Math.max(0, rda.carbs_g - totals.carbs_g)} g left</span>
            </div>

            {/* Progress Bar */}
            <div style={{ width: '100%', height: 7, borderRadius: 10, background: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${Math.min(percentages.carbs_g, 100)}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #fbbf24, #f59e0b)',
                  borderRadius: 10,
                  transition: 'width 0.6s ease'
                }}
              />
            </div>
          </div>

          {/* Card 4: Fat */}
          <div className="glass-card" style={{ padding: '20px 22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(99, 102, 241, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Droplet size={18} color="#818cf8" />
                </div>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>Fat</span>
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#818cf8' }}>
                {percentages.fat_g}%
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: '10px 0 6px' }}>
              <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {totals.fat_g}
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>g</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6 }}>
              <span>Target: {rda.fat_g} g</span>
              <span>{Math.max(0, rda.fat_g - totals.fat_g)} g left</span>
            </div>

            {/* Progress Bar */}
            <div style={{ width: '100%', height: 7, borderRadius: 10, background: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${Math.min(percentages.fat_g, 100)}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #a5b4fc, #6366f1)',
                  borderRadius: 10,
                  transition: 'width 0.6s ease'
                }}
              />
            </div>
          </div>

        </div>
      </div>


      {/* ────────────────────────────────────────────────────────
          D. KEY MICRONUTRIENTS SECTION
          "Key Micronutrients" · "Today's intake vs. daily targets"
          Iron, Calcium, Vit D, B12, Vit C, Zinc, Magnesium, Folate, Fiber
      ──────────────────────────────────────────────────────── */}
      <div className="glass-card" style={{ padding: '24px 28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', color: 'var(--text-main)', margin: 0, fontWeight: 700 }}>
              Key Micronutrients
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '3px 0 0 0' }}>
              Intake on <strong style={{ color: 'var(--text-main)' }}>{isToday ? 'Today' : selectedDate}</strong> vs. daily targets (RDA)
            </p>
          </div>

          <div style={{ display: 'flex', gap: 12, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }}></span> Below (&lt;70%)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }}></span> Near (70-99%)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }}></span> Optimal (100%+)
            </span>
          </div>
        </div>

        {/* Micronutrients Progress Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
          {micronutrients.map(item => {
            const statusInfo = getNutrientStatus(item.pct);
            return (
              <div
                key={item.name}
                style={{
                  padding: '14px 18px',
                  borderRadius: 12,
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-glass)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ fontSize: '0.92rem', color: 'var(--text-main)' }}>{item.name}</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 8 }}>
                      {item.current} / {item.target} {item.unit}
                    </span>
                  </div>

                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: 6,
                      color: statusInfo.color,
                      background: statusInfo.bg,
                      border: `1px solid ${statusInfo.border}`
                    }}
                  >
                    {item.pct}% · {statusInfo.status}
                  </span>
                </div>

                {/* Progress bar */}
                <div style={{ width: '100%', height: 6, borderRadius: 10, background: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${Math.min(item.pct, 100)}%`,
                      height: '100%',
                      background: statusInfo.color,
                      borderRadius: 10,
                      transition: 'width 0.5s ease'
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>


      {/* ────────────────────────────────────────────────────────
          E. DAILY SUMMARY / QUICK NAVIGATION CARDS
          Compact clickable shortcut cards for important daily information
      ──────────────────────────────────────────────────────── */}
      <div>
        <h2 style={{ fontSize: '1.25rem', color: 'var(--text-main)', margin: '0 0 14px 0', fontWeight: 700 }}>
          Daily Summary &amp; Quick Links
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>

          {/* Card 1: Today's Summary */}
          <div
            className="glass-card"
            onClick={() => setActiveTab('diary')}
            style={{ padding: '20px 22px', cursor: 'pointer', transition: 'all 0.2s ease', border: '1px solid var(--border-glass)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.4)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-glass)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(16, 185, 129, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Calendar size={19} color="#10b981" />
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Daily Log</span>
                <strong style={{ fontSize: '0.92rem', color: 'var(--text-main)', display: 'block' }}>{formattedDate.split(',')[0]}, {formattedDate.split(',')[1]}</strong>
              </div>
            </div>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-main)', margin: '8px 0 10px 0' }}>
              <strong style={{ color: '#10b981' }}>{itemsCount} items</strong> · <strong style={{ color: 'var(--text-main)' }}>{totals.calories} kcal</strong> consumed
            </p>
            <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              Food Diary <ArrowRight size={14} />
            </span>
          </div>


          {/* Card 3: Lab Results Biomarkers */}
          <div
            className="glass-card"
            onClick={() => setActiveTab('bloodtest')}
            style={{ padding: '20px 22px', cursor: 'pointer', transition: 'all 0.2s ease', border: '1px solid var(--border-glass)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.4)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-glass)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(59, 130, 246, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TestTube2 size={19} color="#3b82f6" />
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Laboratory</span>
                <strong style={{ fontSize: '0.92rem', color: 'var(--text-main)', display: 'block' }}>Lab Biomarkers</strong>
              </div>
            </div>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-main)', margin: '8px 0 10px 0' }}>
              {Object.values(labs || {}).some(v => v !== null && v !== undefined && Number(v) > 0) ? (
                <span><strong style={{ color: '#3b82f6' }}>{Object.values(labs).filter(v => v !== null && v !== undefined && Number(v) > 0).length} blood values</strong> active</span>
              ) : (
                <span style={{ color: 'var(--text-muted)' }}>Add test values to boost ML accuracy</span>
              )}
            </p>
            <span style={{ fontSize: '0.8rem', color: '#3b82f6', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              Enter Lab Tests <ArrowRight size={14} />
            </span>
          </div>

          {/* Card 4: AI Deficiency Assessment */}
          <div
            className="glass-card"
            onClick={() => setActiveTab('assessment')}
            style={{ padding: '20px 22px', cursor: 'pointer', transition: 'all 0.2s ease', border: '1px solid var(--border-glass)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-glass)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(99, 102, 241, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheck size={19} color="#818cf8" />
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Diagnosis</span>
                <strong style={{ fontSize: '0.92rem', color: 'var(--text-main)', display: 'block' }}>Wellness Index</strong>
              </div>
            </div>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-main)', margin: '8px 0 10px 0' }}>
              {assessmentResult ? (
                <span>Wellness Score: <strong style={{ color: '#10b981' }}>{assessmentResult.overall_health_score} / 100</strong></span>
              ) : (
                <span style={{ color: 'var(--text-muted)' }}>Pending diagnosis run</span>
              )}
            </p>
            <span style={{ fontSize: '0.8rem', color: '#818cf8', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              View Diagnosis <ArrowRight size={14} />
            </span>
          </div>

        </div>
      </div>

    </div>
  );
}
