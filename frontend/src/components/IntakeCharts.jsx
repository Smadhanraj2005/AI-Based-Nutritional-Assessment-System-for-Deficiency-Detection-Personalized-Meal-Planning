import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { PieChart, Activity } from 'lucide-react';

export default function IntakeCharts({ nutritionSummary }) {
  if (!nutritionSummary || !nutritionSummary.percentages) return null;

  const pcts = nutritionSummary.percentages;
  const totals = nutritionSummary.totals;

  const chartData = [
    { name: 'Iron', pct: pcts.iron_mg_pct || 0, target: 100 },
    { name: 'Vit D', pct: pcts.vitamin_d_iu_pct || 0, target: 100 },
    { name: 'B12', pct: pcts.vitamin_b12_mcg_pct || 0, target: 100 },
    { name: 'Calcium', pct: pcts.calcium_mg_pct || 0, target: 100 },
    { name: 'Folate', pct: pcts.folate_mcg_pct || 0, target: 100 },
    { name: 'Zinc', pct: pcts.zinc_mg_pct || 0, target: 100 },
    { name: 'Vit C', pct: pcts.vitamin_c_mg_pct || 0, target: 100 },
    { name: 'Magnesium', pct: pcts.magnesium_mg_pct || 0, target: 100 }
  ];

  return (
    <div className="glass-card" style={{ padding: 24, marginTop: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <Activity size={24} color="var(--primary)" />
        <div>
          <h3 style={{ fontSize: '1.2rem', color: '#fff', margin: 0 }}>Nutrient Intake vs. Recommended Daily Allowance (RDA)</h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>Percentage of daily target achieved based on logged meals.</p>
        </div>
      </div>

      <div style={{ width: '100%', height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} />
            <YAxis stroke="#9ca3af" fontSize={12} unit="%" domain={[0, 150]} />
            <Tooltip 
              contentStyle={{ background: '#1e293b', borderColor: 'rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }} 
              formatter={(val) => [`${val}% RDA`, 'Intake Level']}
            />
            <Bar dataKey="pct" radius={[6, 6, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.pct < 50 ? '#ef4444' : entry.pct < 80 ? '#f59e0b' : '#10b981'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
