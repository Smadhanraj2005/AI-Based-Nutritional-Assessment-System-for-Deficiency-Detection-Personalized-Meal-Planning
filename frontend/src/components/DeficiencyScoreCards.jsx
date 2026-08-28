import React from 'react';
import { AlertOctagon, CheckCircle2, ShieldAlert, Pill, Zap, BarChart2, Lightbulb } from 'lucide-react';

const deficiencyNutrientMap = {
  "Iron Deficiency (Anemia)": { key: "iron_mg", label: "Iron", unit: "mg" },
  "Vitamin D Deficiency": { key: "vitamin_d_iu", label: "Vitamin D", unit: "IU" },
  "Vitamin B12 Deficiency": { key: "vitamin_b12_mcg", label: "Vitamin B12", unit: "mcg" },
  "Calcium Deficiency": { key: "calcium_mg", label: "Calcium", unit: "mg" },
  "Folate (Vitamin B9) Deficiency": { key: "folate_mcg", label: "Folate", unit: "mcg" },
  "Zinc Deficiency": { key: "zinc_mg", label: "Zinc", unit: "mg" },
  "Vitamin A Deficiency": { key: "vitamin_a_iu", label: "Vitamin A", unit: "IU" },
  "Vitamin C Deficiency": { key: "vitamin_c_mg", label: "Vitamin C", unit: "mg" },
  "Magnesium Deficiency": { key: "magnesium_mg", label: "Magnesium", unit: "mg" },
  "Protein Deficiency": { key: "protein_g", label: "Protein", unit: "g" },
  "Iodine Deficiency": { key: "iodine_mcg", label: "Iodine", unit: "mcg" }
};

const shortNutrientLabels = {
  "Iron Deficiency (Anemia)": "Fe",
  "Vitamin D Deficiency": "Vit D",
  "Vitamin B12 Deficiency": "B12",
  "Calcium Deficiency": "Ca",
  "Folate (Vitamin B9) Deficiency": "B9",
  "Zinc Deficiency": "Zn",
  "Vitamin A Deficiency": "Vit A",
  "Vitamin C Deficiency": "Vit C",
  "Magnesium Deficiency": "Mg",
  "Protein Deficiency": "Protein",
  "Iodine Deficiency": "I"
};

export default function DeficiencyScoreCards({ assessmentResult, loggedFoods = [], onSelectRecipe, setActiveTab, profile }) {
  const loggedDistinctDays = new Set((loggedFoods || []).map(f => f.date).filter(Boolean)).size;
  const distinctDays = (assessmentResult && assessmentResult.distinct_diary_days !== undefined && assessmentResult.distinct_diary_days !== null)
    ? assessmentResult.distinct_diary_days
    : loggedDistinctDays;

  // Extract active dietary restrictions
  const activeRestrictions = profile?.dietary_restrictions || assessmentResult?.profile?.dietary_restrictions || [];

  const isFoodCompatibleClient = (foodName = '', restrictions = []) => {
    if (!restrictions || restrictions.length === 0) return true;
    const fLower = foodName.toLowerCase();
    const isPlantMilk = ["soy milk", "almond milk", "oat milk", "coconut milk", "rice milk"].some(x => fLower.includes(x));
    const nonVegWords = ["beef", "liver", "chicken", "salmon", "cod", "fish", "meat", "pork", "mutton", "turkey", "seafood", "anchovy", "tuna", "sardine", "sardines", "prawn", "prawns", "lamb", "bacon", "ham", "crab", "lobster", "tikka", "tandoori"];
    const dairyWords = ["yogurt", "paneer", "whey", "dairy", "cheese", "butter", "ghee", "cream", "curd", "curds", "dahi", "lassi", "buttermilk", "shrikhand", "cottage cheese", "khoya", "malai", "rabri"];
    if (!isPlantMilk) dairyWords.push("milk");

    for (const r of restrictions) {
      const rLower = String(r).toLowerCase().trim();
      if (!rLower || ["none", "null"].includes(rLower)) continue;

      if (["vegetarian", "veg", "pure veg"].some(w => rLower.includes(w))) {
        if (nonVegWords.some(w => fLower.includes(w))) return false;
      }
      if (rLower.includes("vegan")) {
        if ([...nonVegWords, ...dairyWords, "egg", "honey"].some(w => fLower.includes(w))) return false;
      }
      if (["dairy", "lactose", "milk"].some(w => rLower.includes(w))) {
        if (dairyWords.some(w => fLower.includes(w))) return false;
      }
      if (["gluten", "wheat", "celiac"].some(w => rLower.includes(w))) {
        if (["wheat", "roti", "biscuit", "flour", "barley", "rye", "semolina", "atta", "maida", "bread", "pasta", "naan"].some(w => fLower.includes(w)) && !fLower.includes("gluten-free")) return false;
      }
      if (["nut", "peanut"].some(w => rLower.includes(w))) {
        if (["almond", "peanut", "cashew", "walnut", "pecan", "hazelnut", "pistachio", "macadamia"].some(w => fLower.includes(w)) && !fLower.includes("coconut")) return false;
      }
    }
    return true;
  };

  const summaryCards = (
    <div style={{
      display: 'flex',
      gap: 20,
      marginBottom: 20,
      flexWrap: 'wrap'
    }}>
      {/* Wellness Score Card */}
      <div className="glass-card" style={{
        flex: '1 1 240px',
        padding: '24px 20px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-card)'
      }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Wellness Score
        </span>
        <div style={{
          fontSize: '2.4rem',
          fontWeight: 800,
          color: 'var(--text-main)',
          margin: '8px 0',
          fontFamily: 'var(--font-heading)'
        }}>
          {assessmentResult && assessmentResult.overall_health_score !== undefined && assessmentResult.overall_health_score !== null
            ? assessmentResult.overall_health_score
            : '--'} <span style={{ fontSize: '1.1rem', color: 'var(--text-muted)', fontWeight: 400 }}>%</span>
        </div>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          wellness = (1 − avg risk) × 100
        </span>
      </div>

      {/* Food Diary Coverage Card */}
      <div className="glass-card" style={{
        flex: '1 1 240px',
        padding: '24px 20px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-card)'
      }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Assessment Coverage
        </span>
        <div style={{
          fontSize: '2.4rem',
          fontWeight: 800,
          color: 'var(--text-main)',
          margin: '8px 0',
          fontFamily: 'var(--font-heading)'
        }}>
          {distinctDays > 0 ? `${distinctDays} Days` : 'No Days'}
        </div>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          {distinctDays > 0 ? `Based on ${distinctDays} distinct diary days` : 'Based on no distinct diary days'}
        </span>
      </div>

      {/* Counts Breakdown Card */}
      <div className="glass-card" style={{
        flex: '1 1 280px',
        padding: '24px 20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        background: 'var(--bg-card)'
      }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, textAlign: 'center' }}>
          Deficiency Breakdown
        </span>
        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ef4444' }}>
              {assessmentResult && assessmentResult.detected_deficiencies
                ? assessmentResult.detected_deficiencies.filter(d => d.risk_level === 'High').length
                : 0}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>High Risk</span>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f59e0b' }}>
              {assessmentResult && assessmentResult.detected_deficiencies
                ? assessmentResult.detected_deficiencies.filter(d => d.risk_level === 'Moderate').length
                : 0}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Mod Risk</span>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981' }}>
              {assessmentResult && assessmentResult.detected_deficiencies
                ? assessmentResult.detected_deficiencies.filter(d => d.risk_level === 'Low').length
                : 0}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Low Risk</span>
          </div>
        </div>
      </div>
    </div>
  );

  if (!assessmentResult || !assessmentResult.detected_deficiencies) {
    return (
      <div>
        {summaryCards}
        <div className="glass-card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
          <ShieldAlert size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
          <h3 style={{ color: 'var(--text-main)', margin: '0 0 8px 0' }}>No Diagnosis Executed Yet</h3>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>
            Please log food items for a minimum of <strong>4 distinct days</strong> in the Dietary Diary tab and click <strong>"Run AI Deficiency Diagnosis"</strong> to generate your health risk report.
          </p>
        </div>
      </div>
    );
  }

  const { detected_deficiencies, bayesian_lab_updates = {}, recommendations = {}, daily_averages = {}, counts = {} } = assessmentResult;

  // Food suitability helper
  const getSuitabilityFlags = (foodName = '') => {
    const fLower = foodName.toLowerCase();
    const nonVeg = ["beef", "liver", "chicken", "salmon", "cod", "fish", "meat", "pork", "mutton", "turkey"];
    const nonVegan = [...nonVeg, "egg", "yogurt", "paneer", "whey", "cheese", "dairy"];
    const isVeg = !nonVeg.some(w => fLower.includes(w));
    const isVegan = !nonVegan.some(w => fLower.includes(w));
    return { isVeg, isVegan };
  };

  return (
    <div>
      {/* Wellness Score & Assessment Coverage Summary Cards */}
      {summaryCards}

      {/* Average Daily Intake Used by Model Table (PDF Section 3) */}
      {daily_averages && Object.keys(daily_averages).length > 0 && (
        <div className="glass-card" style={{ padding: '20px 24px', marginBottom: 24 }}>
          <h3 style={{ fontSize: '1.05rem', color: 'var(--text-main)', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart2 size={18} color="var(--primary)" /> Average Daily Intake Used by the Model ({assessmentResult.distinct_diary_days || 3} days)
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem', color: 'var(--text-main)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-glass)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '8px 12px' }}>Nutrient</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right' }}>Daily Average</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "Calories", key: "calories_kcal", unit: "kcal" },
                  { label: "Protein", key: "protein_g", unit: "g" },
                  { label: "Iron", key: "iron_mg", unit: "mg" },
                  { label: "Calcium", key: "calcium_mg", unit: "mg" },
                  { label: "Vitamin D", key: "vitamin_d_mcg", unit: "mcg" },
                  { label: "Vitamin B12", key: "vitamin_b12_mcg", unit: "mcg" },
                  { label: "Folate (B9)", key: "folate_mcg", unit: "mcg" },
                  { label: "Vitamin A", key: "vitamin_a_mcg", unit: "mcg" },
                  { label: "Vitamin C", key: "vitamin_c_mg", unit: "mg" },
                  { label: "Magnesium", key: "magnesium_mg", unit: "mg" },
                  { label: "Zinc", key: "zinc_mg", unit: "mg" },
                ].map((n, i) => (
                  <tr key={n.key} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '6px 12px', color: 'var(--text-main)', fontWeight: 500 }}>{n.label}</td>
                    <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: 600, color: 'var(--primary)' }}>
                      {Number(daily_averages[n.key] || 0).toFixed(2)} {n.unit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {detected_deficiencies.length === 0 ? (
        <div className="glass-card" style={{ padding: 32, textAlign: 'center', color: '#10b981', marginTop: 20 }}>
          <CheckCircle2 size={40} style={{ marginBottom: 12 }} />
          <h3>Optimal Micronutrient Balance</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No high or moderate risk deficiencies detected based on current dietary log and symptoms.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 24, marginTop: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {/* Left Column: Deficiency Risks */}
          <div style={{ flex: '3 1 600px', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ marginBottom: 4 }}>
              <h2 style={{ fontSize: '1.35rem', color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                Deficiency risks
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {detected_deficiencies.map((def, idx) => {
                const defName = def.deficiency;
                const rec = recommendations[defName] || {};
                const bayesianNote = bayesian_lab_updates[defName];
                const isHigh = def.risk_level === 'High';
                const isModerate = def.risk_level === 'Moderate';

                const borderColor = isHigh ? '#ef4444' : isModerate ? '#f59e0b' : '#10b981';
                const badgeClass = isHigh ? 'badge badge-danger' : isModerate ? 'badge badge-warning' : 'badge badge-success';
                const bgHover = isHigh ? 'rgba(239, 68, 68, 0.12)' : isModerate ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)';

                // Fetch intake metrics
                const nutrientInfo = deficiencyNutrientMap[defName];
                let intakeExplanation = "Intake information not available for this analysis.";
                let intakePct = 0;
                let intakeTotal = 0;
                let rdaTarget = 0;

                if (nutrientInfo && assessmentResult.nutritional_intake_summary) {
                  const summary = assessmentResult.nutritional_intake_summary;
                  const pctKey = `${nutrientInfo.key}_pct`;

                  intakePct = (summary.percentages && summary.percentages[pctKey] !== undefined)
                    ? summary.percentages[pctKey]
                    : 0;

                  intakeTotal = (summary.totals && summary.totals[nutrientInfo.key] !== undefined)
                    ? summary.totals[nutrientInfo.key]
                    : 0;

                  rdaTarget = (summary.rda_baselines && summary.rda_baselines[nutrientInfo.key] !== undefined)
                    ? summary.rda_baselines[nutrientInfo.key]
                    : 0;

                  intakeExplanation = `Average daily intake is ${intakePct}% of target RDA (${intakeTotal} / ${rdaTarget} ${nutrientInfo.unit}).`;
                }

                return (
                  <div
                    key={idx}
                    className="glass-card deficiency-card"
                    style={{
                      padding: 22,
                      borderLeft: `4px solid ${borderColor}`,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      borderRadius: 14,
                    }}
                  >
                    <div>
                      {/* Card Header: Badge + Big Confidence Score */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                        <div>
                          <span className={badgeClass} style={{ letterSpacing: '0.04em' }}>
                            {def.risk_level.toUpperCase()} RISK • {def.confidence} CONFIDENCE
                          </span>
                          <h3 style={{ fontSize: '1.15rem', color: '#fff', marginTop: 8, marginBottom: 0, fontWeight: 700 }}>{defName}</h3>
                        </div>
                        <div style={{
                          fontSize: '1.35rem',
                          fontWeight: 800,
                          color: borderColor,
                          background: bgHover,
                          padding: '4px 12px',
                          borderRadius: 8,
                          border: `1px solid ${borderColor}33`
                        }}>
                          {Math.round(def.probability * 100)}%
                        </div>
                      </div>

                      {/* Deficiency Risk Level Progress Bar */}
                      <div style={{ marginBottom: 18 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                          <span>Deficiency Risk Level:</span>
                          <span style={{ fontWeight: 600, color: borderColor }}>{Math.round(def.probability * 100)}%</span>
                        </div>
                        <div style={{ width: '100%', height: 6, borderRadius: 10, background: 'rgba(255, 255, 255, 0.06)', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${Math.round(def.probability * 100)}%`,
                              height: '100%',
                              background: borderColor,
                              borderRadius: 10,
                              transition: 'width 0.5s ease'
                            }}
                          />
                        </div>
                      </div>

                      {/* Bayesian Lab Update Highlight Box */}
                      {bayesianNote && (
                        <div style={{
                          fontSize: '0.78rem',
                          color: '#38bdf8',
                          background: 'rgba(56, 189, 248, 0.08)',
                          border: '1px solid rgba(56, 189, 248, 0.25)',
                          padding: '8px 12px',
                          borderRadius: 8,
                          marginBottom: 14,
                          lineHeight: '1.4',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 6
                        }}>
                          <Zap size={14} color="#38bdf8" style={{ marginTop: 2, flexShrink: 0 }} />
                          <div>
                            <strong style={{ color: '#7dd3fc' }}>Nutritional Update:</strong> {bayesianNote}
                          </div>
                        </div>
                      )}

                      {/* Dietary Synergy Advice */}
                      {rec.dietary_notes && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', padding: 10, borderRadius: 8, lineHeight: '1.45', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Lightbulb size={16} color="var(--primary)" style={{ flexShrink: 0 }} /> {rec.dietary_notes}
                        </div>
                      )}
                    </div>

                    {/* Supplement Action Footer */}
                    {rec.supplements && rec.supplements.length > 0 && (
                      <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: 14, marginTop: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: '0.76rem', color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Pill size={13} color="var(--warning)" /> {rec.supplements[0]}
                        </span>
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Recommended Foods (PDF Section 5) */}
          <div className="glass-card" style={{ flex: '2 1 400px', padding: 24, position: 'sticky', top: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)', margin: 0, fontWeight: 700 }}>
                Recommended foods
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '6px 0 0 0', lineHeight: 1.4 }}>
                Targeted food sources per 100g serving for all identified nutrient areas, filtered by your dietary preferences.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {detected_deficiencies.map((def, idx) => {
                const defName = def.deficiency;
                const rec = recommendations[defName] || {};

                let detailedFoods = [];
                if (rec.recommended_foods_detailed && rec.recommended_foods_detailed.length > 0) {
                  detailedFoods = rec.recommended_foods_detailed;
                } else if (rec.recommended_foods && rec.recommended_foods.length > 0) {
                  const label = shortNutrientLabels[defName] || "";
                  detailedFoods = rec.recommended_foods.map(foodName => ({
                    food_name: foodName,
                    nutrient_label: label,
                    nutrient_value: ""
                  }));
                }

                // Filter detailedFoods against user active dietary restrictions
                detailedFoods = detailedFoods.filter(f => isFoodCompatibleClient(f.food_name, activeRestrictions));

                const headerName = defName.split(" Deficiency")[0].split(" (Anemia)")[0];

                return (
                  <div key={idx} style={{
                    background: 'var(--bg-page-secondary)',
                    border: '1px solid var(--border-soft)',
                    borderRadius: 12,
                    padding: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12
                  }}>
                    <h4 style={{ fontSize: '1.05rem', color: 'var(--secondary)', margin: 0, fontWeight: 700 }}>
                      {headerName}
                    </h4>

                    {detailedFoods.length === 0 ? (
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                        <p style={{ margin: '0 0 6px 0', color: 'var(--danger)' }}>
                          No compatible food recommendations for current diet filters.
                        </p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {detailedFoods.map((food, fIdx) => {
                          const flags = getSuitabilityFlags(food.food_name);
                          return (
                            <div key={fIdx} style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              paddingBottom: fIdx < detailedFoods.length - 1 ? '8px' : '0px',
                              borderBottom: fIdx < detailedFoods.length - 1 ? '1px solid var(--border-soft)' : 'none',
                              fontSize: '0.88rem'
                            }}>
                              <div>
                                <span style={{ color: 'var(--text-main)', fontWeight: 500, display: 'block' }}>{food.food_name}</span>
                                <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>

                                </div>
                              </div>
                              <span style={{ color: 'var(--primary)', fontSize: '0.82rem', fontWeight: 600 }}>
                                {food.nutrient_label} {food.nutrient_value}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


