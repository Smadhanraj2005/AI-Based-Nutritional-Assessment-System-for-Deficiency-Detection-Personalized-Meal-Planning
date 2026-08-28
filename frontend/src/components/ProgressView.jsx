import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  LineChart,
  Line,
  CartesianGrid,
  Cell
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Flame,
  Activity,
  PieChart,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Layers,
  Award
} from 'lucide-react';
import { calculateNutritionTotals, getNutrientStatus, getRDAForProfile, getTodayStr, getFormattedDate } from '../services/nutritionHelper';
import { fetchLongitudinalProgress } from '../services/api';

export default function ProgressView({ loggedFoods, profile }) {
  const todayStr = getTodayStr();
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [longitudinalData, setLongitudinalData] = useState(null);

  const isToday = selectedDate === todayStr;

  // ── Compute current nutritional metrics for selected date ──
  const { totals, rda, percentages, itemsCount } = calculateNutritionTotals(loggedFoods, profile, selectedDate);

  // ── Fetch longitudinal tracking data (historical progress) ──
  useEffect(() => {
    async function loadLongitudinal() {
      try {
        const data = await fetchLongitudinalProgress();
        if (data) setLongitudinalData(data);
      } catch (err) {
        console.error('Failed to load longitudinal progress:', err);
      }
    }
    loadLongitudinal();
  }, []);

  // ── Calorie Progress Ring Calculations ───────────────────────
  const calPercent = percentages.calories || 0;
  const ringRadius = 52;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringFilled = ringCircumference * (Math.min(calPercent, 100) / 100);
  const ringGap = ringCircumference - ringFilled;

  // ── B. Macronutrient Bar Chart Data (Protein, Carbs, Fat, Fiber) ──
  const macroChartData = [
    {
      name: 'Protein',
      'Current Intake': totals.protein_g,
      'Daily Target': rda.protein_g,
      unit: 'g',
      pct: percentages.protein_g
    },
    {
      name: 'Carbohydrates',
      'Current Intake': totals.carbs_g,
      'Daily Target': rda.carbs_g,
      unit: 'g',
      pct: percentages.carbs_g
    },
    {
      name: 'Fat',
      'Current Intake': totals.fat_g,
      'Daily Target': rda.fat_g,
      unit: 'g',
      pct: percentages.fat_g
    },
    {
      name: 'Fiber',
      'Current Intake': totals.fiber_g,
      'Daily Target': rda.fiber_g,
      unit: 'g',
      pct: percentages.fiber_g
    }
  ];

  // ── C. Micronutrient Radar Chart Data (Percentage of RDA) ────
  const radarChartData = [
    { nutrient: 'Iron', pct: percentages.iron_mg, fullMark: 100 },
    { nutrient: 'Calcium', pct: percentages.calcium_mg, fullMark: 100 },
    { nutrient: 'Vitamin D', pct: percentages.vitamin_d_iu, fullMark: 100 },
    { nutrient: 'Vitamin B12', pct: percentages.vitamin_b12_mcg, fullMark: 100 },
    { nutrient: 'Vitamin C', pct: percentages.vitamin_c_mg, fullMark: 100 },
    { nutrient: 'Zinc', pct: percentages.zinc_mg, fullMark: 100 },
    { nutrient: 'Magnesium', pct: percentages.magnesium_mg, fullMark: 100 },
    { nutrient: 'Folate', pct: percentages.folate_mcg, fullMark: 100 },
    { nutrient: 'Fiber', pct: percentages.fiber_g, fullMark: 100 },
  ];

  // ── Detailed Nutrients Breakdown Table ───────────────────────
  const detailedNutrients = [
    { name: 'Calories', current: totals.calories, target: rda.calories, unit: 'kcal', pct: percentages.calories, category: 'Macro' },
    { name: 'Protein', current: totals.protein_g, target: rda.protein_g, unit: 'g', pct: percentages.protein_g, category: 'Macro' },
    { name: 'Carbohydrates', current: totals.carbs_g, target: rda.carbs_g, unit: 'g', pct: percentages.carbs_g, category: 'Macro' },
    { name: 'Fat', current: totals.fat_g, target: rda.fat_g, unit: 'g', pct: percentages.fat_g, category: 'Macro' },
    { name: 'Dietary Fiber', current: totals.fiber_g, target: rda.fiber_g, unit: 'g', pct: percentages.fiber_g, category: 'Macro' },
    { name: 'Iron', current: totals.iron_mg, target: rda.iron_mg, unit: 'mg', pct: percentages.iron_mg, category: 'Micro' },
    { name: 'Calcium', current: totals.calcium_mg, target: rda.calcium_mg, unit: 'mg', pct: percentages.calcium_mg, category: 'Micro' },
    { name: 'Vitamin D', current: totals.vitamin_d_iu, target: rda.vitamin_d_iu, unit: 'IU', pct: percentages.vitamin_d_iu, category: 'Micro' },
    { name: 'Vitamin B12', current: totals.vitamin_b12_mcg, target: rda.vitamin_b12_mcg, unit: 'mcg', pct: percentages.vitamin_b12_mcg, category: 'Micro' },
    { name: 'Vitamin C', current: totals.vitamin_c_mg, target: rda.vitamin_c_mg, unit: 'mg', pct: percentages.vitamin_c_mg, category: 'Micro' },
    { name: 'Zinc', current: totals.zinc_mg, target: rda.zinc_mg, unit: 'mg', pct: percentages.zinc_mg, category: 'Micro' },
    { name: 'Magnesium', current: totals.magnesium_mg, target: rda.magnesium_mg, unit: 'mg', pct: percentages.magnesium_mg, category: 'Micro' },
    { name: 'Folate (B9)', current: totals.folate_mcg, target: rda.folate_mcg, unit: 'mcg', pct: percentages.folate_mcg, category: 'Micro' },
  ];

  // Group nutrients by status for Progress Interpretation
  const belowTarget = detailedNutrients.filter(n => n.pct < 70);
  const nearTarget = detailedNutrients.filter(n => n.pct >= 70 && n.pct < 100);
  const targetReached = detailedNutrients.filter(n => n.pct >= 100 && n.pct <= 135);
  const higherThanTarget = detailedNutrients.filter(n => n.pct > 135);

  // ── Longitudinal Trend Formatting (if data exists) ──────────
  const lineChartData = longitudinalData ? longitudinalData.weeks.map((week, idx) => ({
    week,
    'Deficiency Risk Index': longitudinalData.overall_risk_index[idx],
    'Iron Anemia Risk': longitudinalData.deficiency_trends[0]?.data[idx] || 0,
    'Vitamin D Risk': longitudinalData.deficiency_trends[1]?.data[idx] || 0,
    'B12 Risk': longitudinalData.deficiency_trends[2]?.data[idx] || 0,
    'Diet Plan Compliance %': longitudinalData.compliance_rate_pct[idx]
  })) : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28, maxWidth: 1200, margin: '0 auto' }}>

      {/* ────────────────────────────────────────────────────────
          A. PROGRESS PAGE HEADER
          Title, date/time-period context, short description
      ──────────────────────────────────────────────────────── */}
      <div className="glass-card" style={{ padding: '26px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
        <div>
          <span className="badge badge-success" style={{ marginBottom: 8, display: 'inline-block' }}>
            Nutritional Analytics
          </span>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, letterSpacing: '-0.02em' }}>
            Nutrition Progress
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Detailed nutritional breakdown, daily targets, and long-term deficiency risk trajectory.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255, 255, 255, 0.04)', padding: '8px 14px', borderRadius: 12, border: '1px solid var(--border-glass)' }}>
            <Calendar size={16} color="var(--primary)" />
            <input
              type="date"
              value={selectedDate === 'all' ? '' : selectedDate}
              onChange={e => setSelectedDate(e.target.value || 'all')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-main)',
                fontSize: '0.86rem',
                cursor: 'pointer',
                outline: 'none'
              }}
            />
            <button
              onClick={() => setSelectedDate(selectedDate === 'all' ? todayStr : 'all')}
              style={{
                background: selectedDate === 'all' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                color: selectedDate === 'all' ? '#10b981' : 'var(--text-muted)',
                borderRadius: 6,
                padding: '4px 10px',
                fontSize: '0.78rem',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              {selectedDate === 'all' ? 'Showing All' : 'Show All'}
            </button>
          </div>
          <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '10px 18px', borderRadius: 12, border: '1px solid rgba(99, 102, 241, 0.2)', textAlign: 'right' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>Active Tracking</span>
            <strong style={{ fontSize: '1.1rem', color: '#818cf8' }}>{itemsCount} Logged Foods</strong>
          </div>
        </div>
      </div>


      {/* ────────────────────────────────────────────────────────
          B. DAILY CALORIE PROGRESS CARD
          Circular progress ring, calories consumed, target, % achieved, items logged
      ──────────────────────────────────────────────────────── */}
      <div className="glass-card" style={{ padding: '26px 30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>

          {/* Left: Ring and Big Numbers */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap' }}>

            {/* Circular Progress Ring */}
            <div style={{ position: 'relative', width: 124, height: 124, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="124" height="124" viewBox="0 0 124 124" style={{ transform: 'rotate(-90deg)' }}>
                {/* Track */}
                <circle
                  cx="62"
                  cy="62"
                  r={ringRadius}
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth="10"
                  fill="transparent"
                />
                {/* Progress Arc */}
                <circle
                  cx="62"
                  cy="62"
                  r={ringRadius}
                  stroke={calPercent >= 90 && calPercent <= 110 ? '#10b981' : calPercent < 90 ? '#f59e0b' : '#3b82f6'}
                  strokeWidth="10"
                  strokeDasharray={`${ringFilled} ${ringGap}`}
                  strokeLinecap="round"
                  fill="transparent"
                  style={{ transition: 'stroke-dasharray 0.8s ease' }}
                />
              </svg>
              <div style={{ position: 'absolute', textAlign: 'center' }}>
                <Flame size={20} color="#f59e0b" style={{ margin: '0 auto 2px' }} />
                <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', display: 'block', lineHeight: 1 }}>
                  {calPercent}%
                </span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Target</span>
              </div>
            </div>

            {/* Metric Labels */}
            <div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                Daily Energy Intake
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, margin: '4px 0 6px 0' }}>
                <h2 style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  {totals.calories} <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>kcal</span>
                </h2>
                <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                  / {rda.calories} kcal
                </span>
              </div>
              <p style={{ fontSize: '0.9rem', color: '#10b981', margin: 0, fontWeight: 600 }}>
                {calPercent}% of daily target achieved
              </p>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4, display: 'inline-block' }}>
                Based on <strong style={{ color: 'var(--text-main)' }}>{itemsCount} food items</strong> logged in diary
              </span>
            </div>

          </div>

          {/* Right: Quick Calorie Breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, minWidth: 260 }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px 16px', borderRadius: 10, border: '1px solid var(--border-glass)' }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Remaining</span>
              <strong style={{ fontSize: '1.15rem', color: 'var(--text-main)', display: 'block', marginTop: 2 }}>
                {Math.max(0, rda.calories - totals.calories)} kcal
              </strong>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px 16px', borderRadius: 10, border: '1px solid var(--border-glass)' }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Status</span>
              <strong style={{ fontSize: '1.05rem', color: calPercent < 70 ? '#ef4444' : calPercent < 100 ? '#f59e0b' : '#10b981', display: 'block', marginTop: 2 }}>
                {getNutrientStatus(calPercent).status}
              </strong>
            </div>
          </div>

        </div>
      </div>


      {/* ────────────────────────────────────────────────────────
          C & D. CHARTS GRID (2 COLUMNS)
          - C. Macronutrient Bar Chart (Protein, Carbs, Fat, Fiber)
          - D. Micronutrient Radar Chart (Coverage vs RDA)
      ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: 24 }}>

        {/* ── C. Macronutrients Bar Chart ── */}
        <div className="glass-card" style={{ padding: '24px 26px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: '1.2rem', color: 'var(--text-main)', margin: 0, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <PieChart size={20} color="var(--primary)" />
                Macronutrient Intake vs Daily Targets
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Current intake vs. daily target in grams (g)
              </p>
            </div>
          </div>

          <div style={{ width: '100%', height: 290 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={macroChartData} margin={{ top: 15, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} />
                <YAxis stroke="#9ca3af" fontSize={12} unit="g" />
                <Tooltip
                  contentStyle={{ background: '#1e293b', borderColor: 'rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }}
                  formatter={(val, name, item) => [`${val} g (${item.payload.pct}% of goal)`, name]}
                />
                <Legend wrapperStyle={{ paddingTop: 8 }} />
                <Bar dataKey="Current Intake" fill="#10b981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Daily Target" fill="rgba(255, 255, 255, 0.15)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── D. Micronutrient Coverage Radar Chart ── */}
        <div className="glass-card" style={{ padding: '24px 26px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: '1.2rem', color: '#fff', margin: 0, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <PieChart size={20} color="#818cf8" /> Micronutrient Coverage
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Nutritional coverage represented as % of Recommended Daily Allowance (RDA)
              </p>
            </div>
          </div>

          <div style={{ width: '100%', height: 290 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="72%" data={radarChartData}>
                <PolarGrid stroke="rgba(255, 255, 255, 0.1)" />
                <PolarAngleAxis dataKey="nutrient" stroke="#9ca3af" fontSize={11} />
                <PolarRadiusAxis angle={30} domain={[0, 150]} stroke="rgba(255, 255, 255, 0.2)" fontSize={10} />
                <Radar name="% RDA Achieved" dataKey="pct" stroke="#6366f1" fill="#6366f1" fillOpacity={0.4} />
                <Tooltip
                  contentStyle={{ background: '#1e293b', borderColor: 'rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }}
                  formatter={(val) => [`${val}% RDA`, '% of Daily Target']}
                />
                <Legend wrapperStyle={{ paddingTop: 4 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>


      {/* ────────────────────────────────────────────────────────
          E & F. DETAILED NUTRITIONAL METRICS & PROGRESS INTERPRETATION
          Helps user understand: Below target, Near target, Target reached, Higher than target
      ──────────────────────────────────────────────────────── */}
      <div className="glass-card" style={{ padding: '26px 28px' }}>
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: '1.25rem', color: 'var(--text-main)', margin: 0, fontWeight: 700 }}>
            Progress Interpretation &amp; Status Breakdown
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Comprehensive evaluation of daily intake versus standard clinical requirements.
          </p>
        </div>

        {/* 4 Status Summary Pill Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 24 }}>

          <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }}></span>
              <strong style={{ fontSize: '0.85rem', color: '#f87171' }}>Below Target (&lt;70%)</strong>
            </div>
            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>{belowTarget.length}</span>
            <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              {belowTarget.map(n => n.name).join(', ') || 'None'}
            </p>
          </div>

          <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }}></span>
              <strong style={{ fontSize: '0.85rem', color: '#fbbf24' }}>Near Target (70-99%)</strong>
            </div>
            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>{nearTarget.length}</span>
            <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              {nearTarget.map(n => n.name).join(', ') || 'None'}
            </p>
          </div>

          <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }}></span>
              <strong style={{ fontSize: '0.85rem', color: '#34d399' }}>Target Reached (100-135%)</strong>
            </div>
            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>{targetReached.length}</span>
            <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              {targetReached.map(n => n.name).join(', ') || 'None'}
            </p>
          </div>

          <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6' }}></span>
              <strong style={{ fontSize: '0.85rem', color: '#60a5fa' }}>Higher Than Target (&gt;135%)</strong>
            </div>
            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>{higherThanTarget.length}</span>
            <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              {higherThanTarget.map(n => n.name).join(', ') || 'None'}
            </p>
          </div>

        </div>

        {/* Detailed Metrics Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-muted)', textAlign: 'left' }}>
                <th style={{ padding: '10px 14px' }}>Nutrient</th>
                <th style={{ padding: '10px 14px' }}>Type</th>
                <th style={{ padding: '10px 14px' }}>Current Intake</th>
                <th style={{ padding: '10px 14px' }}>Daily Target (RDA)</th>
                <th style={{ padding: '10px 14px' }}>% Achieved</th>
                <th style={{ padding: '10px 14px' }}>Deficit / Surplus</th>
                <th style={{ padding: '10px 14px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {detailedNutrients.map((item, idx) => {
                const status = getNutrientStatus(item.pct);
                const diff = Number((item.current - item.target).toFixed(1));
                return (
                  <tr
                    key={item.name}
                    style={{
                      borderBottom: idx < detailedNutrients.length - 1 ? '1px solid rgba(255, 255, 255, 0.04)' : 'none',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text-main)' }}>{item.name}</td>
                    <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>{item.category}</td>
                    <td style={{ padding: '12px 14px', color: 'var(--text-main)' }}>{item.current} {item.unit}</td>
                    <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>{item.target} {item.unit}</td>
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: status.color }}>{item.pct}%</td>
                    <td style={{ padding: '12px 14px', color: diff >= 0 ? '#10b981' : '#ef4444' }}>
                      {diff > 0 ? `+${diff}` : diff} {item.unit}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span
                        style={{
                          fontSize: '0.74rem',
                          fontWeight: 600,
                          padding: '3px 10px',
                          borderRadius: 20,
                          color: status.color,
                          background: status.bg,
                          border: `1px solid ${status.border}`
                        }}
                      >
                        {status.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>


      {/* ────────────────────────────────────────────────────────
          HISTORICAL LONGITUDINAL TRAJECTORY (PRESERVED FUNCTIONALITY)
          Line chart of risk reduction trajectory over time
      ──────────────────────────────────────────────────────── */}
      {lineChartData.length > 0 && (
        <div className="glass-card" style={{ padding: '24px 28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h2 style={{ fontSize: '1.2rem', color: 'var(--text-main)', margin: 0, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <TrendingDown size={20} color="#10b981" /> Long-Term Deficiency Risk Trajectory
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Monitors simulated and measured risk score reduction across 4, 8, and 12-week adherence cycles (Lower is better).
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <span className="badge badge-success">82% Overall Risk Reduction</span>
            </div>
          </div>

          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="week" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} domain={[0, 100]} />
                <Tooltip contentStyle={{ background: '#1e293b', borderColor: 'rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }} />
                <Legend wrapperStyle={{ paddingTop: 10 }} />
                <Line type="monotone" dataKey="Deficiency Risk Index" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="Iron Anemia Risk" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 4" />
                <Line type="monotone" dataKey="Vitamin D Risk" stroke="#3b82f6" strokeWidth={2} strokeDasharray="4 4" />
                <Line type="monotone" dataKey="Diet Plan Compliance %" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

    </div>
  );
}
