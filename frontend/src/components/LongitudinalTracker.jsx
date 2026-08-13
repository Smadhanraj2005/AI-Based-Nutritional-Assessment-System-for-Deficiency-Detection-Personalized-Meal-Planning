import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { TrendingDown, ShieldCheck, Award, CalendarCheck } from 'lucide-react';
import { fetchLongitudinalProgress } from '../services/api';

export default function LongitudinalTracker() {
  const [progressData, setProgressData] = useState(null);

  useEffect(() => {
    async function loadData() {
      const data = await fetchLongitudinalProgress();
      if (data) setProgressData(data);
    }
    loadData();
  }, []);

  if (!progressData) return null;

  // Format data for Recharts
  const chartData = progressData.weeks.map((week, idx) => ({
    week,
    'Overall Deficiency Risk Index': progressData.overall_risk_index[idx],
    'Iron Anemia Risk': progressData.deficiency_trends[0].data[idx],
    'Vitamin D Risk': progressData.deficiency_trends[1].data[idx],
    'B12 Risk': progressData.deficiency_trends[2].data[idx],
    'Plan Compliance %': progressData.compliance_rate_pct[idx]
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Header Widget */}
      <div className="glass-card" style={{ padding: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
        <div>
          <span className="badge badge-success" style={{ marginBottom: 8, display: 'inline-block' }}>Nutritional Health Trend</span>
          <h2 style={{ fontSize: '1.4rem', color: '#fff', margin: 0 }}>Deficiency Risk Trends</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>Monitors nutritional risk score reduction as eating habits evolve over time.</p>
        </div>

        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '12px 20px', borderRadius: 12, border: '1px solid rgba(16, 185, 129, 0.2)', textAlign: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>Risk Reduction</span>
            <strong style={{ fontSize: '1.4rem', color: '#10b981' }}>-82%</strong>
          </div>
          <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '12px 20px', borderRadius: 12, border: '1px solid rgba(99, 102, 241, 0.2)', textAlign: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>12-Wk Compliance</span>
            <strong style={{ fontSize: '1.4rem', color: '#818cf8' }}>95%</strong>
          </div>
        </div>
      </div>

      {/* Main Longitudinal Trend Chart */}
      <div className="glass-card" style={{ padding: 24 }}>
        <h3 style={{ fontSize: '1.15rem', color: '#fff', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <TrendingDown size={22} color="#10b981" /> Micronutrient Risk Score Trajectory (Lower is Better)
        </h3>

        <div style={{ width: '100%', height: 340 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="week" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} domain={[0, 100]} />
              <Tooltip contentStyle={{ background: '#1e293b', borderColor: 'rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }} />
              <Legend wrapperStyle={{ paddingTop: 10 }} />

              <Line type="monotone" dataKey="Overall Deficiency Risk Index" stroke="#ef4444" strokeWidth={3} dot={{ r: 5 }} />
              <Line type="monotone" dataKey="Iron Anemia Risk" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" />
              <Line type="monotone" dataKey="Vitamin D Risk" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" />
              <Line type="monotone" dataKey="Plan Compliance %" stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
