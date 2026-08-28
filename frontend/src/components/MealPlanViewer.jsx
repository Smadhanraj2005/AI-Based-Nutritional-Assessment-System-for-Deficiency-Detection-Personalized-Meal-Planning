import React, { useState } from 'react';
import { Calendar, Sparkles, Utensils, CheckCircle2, ChevronRight, Clock, AlertTriangle, Apple, Sunrise, Sun, Moon, RefreshCw, Zap, Lightbulb } from 'lucide-react';

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

export default function MealPlanViewer({ assessmentResult, mealPlanData, onGenerateMealPlan, onSelectRecipe, setActiveTab, isLoading, profile }) {
  const [selectedDay, setSelectedDay] = useState(0);

  // STEP 1: If no assessment exists, show that an assessment is required
  if (!assessmentResult) {
    return (
      <div className="glass-card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', maxWidth: 600, margin: '40px auto' }}>
        <AlertTriangle size={56} color="var(--primary)" style={{ opacity: 0.8, marginBottom: 20, strokeWidth: 1.5 }} />
        <h2 style={{ color: '#fff', marginBottom: 12, fontSize: '1.4rem' }}>Assessment Required</h2>
        <p style={{ fontSize: '0.92rem', lineHeight: 1.6, marginBottom: 24 }}>
          Before we can construct a personalized 7-day meal plan, you must complete an AI nutritional health assessment. This allows the system to analyze your diet logs, symptoms, and lab values to target your specific deficiencies.
        </p>
        <button
          className="btn-primary"
          onClick={() => setActiveTab('assessment')}
          style={{ padding: '12px 28px', fontSize: '0.95rem', display: 'inline-flex', alignItems: 'center', gap: 8, margin: '0 auto' }}
        >
          <Zap size={18} /> Go to Assessment Tab
        </button>
      </div>
    );
  }

  // STEP 2: Extract top deficiencies & recommended foods from the assessment
  const deficiencies = assessmentResult.detected_deficiencies || [];

  // Top deficiencies (High or Moderate risk)
  const topDeficiencies = deficiencies.filter(d => d.risk_level === 'High' || d.risk_level === 'Moderate');
  const displayDeficiencies = topDeficiencies.length > 0 ? topDeficiencies : deficiencies.slice(0, 2);

  // Extract recommended foods mapping & active dietary restrictions
  const recommendations = assessmentResult.recommendations || {};
  const activeRestrictions = profile?.dietary_restrictions || assessmentResult.profile?.dietary_restrictions || mealPlanData?.dietary_restrictions || [];

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* STEP 3: Meal Plan Generation Call-to-Action or Schedule Display */}
      {!mealPlanData || !mealPlanData.meal_plan ? (
        <div className="glass-card" style={{ padding: 48, textAlign: 'center' }}>
          <Sparkles size={48} color="var(--primary)" style={{ opacity: 0.8, marginBottom: 16 }} />
          <h3 style={{ color: 'var(--text-main)', fontSize: '1.2rem', marginBottom: 10 }}>Personalized Meal Plan Ready to Generate</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: 500, margin: '0 auto 24px', lineHeight: 1.5 }}>
            Generate a targeted, 7-day culinary schedule tailored to address your deficiencies and respect your dietary restrictions.
          </p>
          <button
            className="btn-primary"
            onClick={onGenerateMealPlan}
            disabled={isLoading}
            style={{ padding: '12px 30px', fontSize: '0.95rem', fontWeight: 600, margin: '0 auto', display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            <Zap size={18} /> {isLoading ? 'Compiling Nutrient Schedule...' : 'Generate 7-Day Meal Plan'}
          </button>
        </div>
      ) : (
        <div>
          {/* Plan Header (PDF Section 6) */}
          <div className="glass-card" style={{ padding: 24, marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
                <span className="badge badge-success">Active 7-Day Meal Plan</span>
              </div>
              <h2 style={{ fontSize: '1.4rem', color: 'var(--text-main)', margin: 0 }}>Targeted Deficiency Corrective Schedule</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--primary-dark)', margin: '6px 0 0 0', fontWeight: 600 }}>
                Meal plan linked to Assessment ID #{assessmentResult.assessment_id || 1} • Diet filter: {activeRestrictions.length > 0 ? activeRestrictions.join(', ') : 'Standard (No restriction)'}
              </p>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                <strong>Focus nutrients:</strong> {mealPlanData.targeted_deficiencies?.join(', ') || 'calcium, vitamin_b12, vitamin_a, vitamin_d'}
              </p>
            </div>
            {onGenerateMealPlan && (
              <button
                className="btn-primary"
                onClick={onGenerateMealPlan}
                disabled={isLoading}
                style={{ padding: '8px 16px', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} /> {isLoading ? 'Recalibrating...' : 'Regenerate Plan'}
              </button>
            )}
          </div>

          {/* Day Selector Buttons */}
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 12, marginBottom: 24 }}>
            {mealPlanData.meal_plan.map((dayItem, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedDay(idx)}
                style={{
                  flex: '1 0 130px',
                  padding: '14px 16px',
                  borderRadius: 12,
                  border: selectedDay === idx ? '1px solid var(--primary)' : '1px solid var(--border-glass)',
                  background: selectedDay === idx ? 'var(--primary-glow)' : 'var(--bg-card-solid)',
                  color: selectedDay === idx ? 'var(--primary-dark)' : 'var(--text-main)',
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
              const currentDayPlan = mealPlanData.meal_plan[selectedDay] || mealPlanData.meal_plan[0];
              const meal = currentDayPlan.meals[mealKey];
              const titlesMap = {
                breakfast: { label: 'Breakfast', icon: <Sunrise size={18} color="#f59e0b" /> },
                lunch: { label: 'Lunch', icon: <Sun size={18} color="#eab308" /> },
                dinner: { label: 'Dinner', icon: <Moon size={18} color="#818cf8" /> },
                snack: { label: 'Healthy Snack', icon: <Apple size={18} color="#10b981" /> }
              };

              if (!meal) return null;
              const mealMeta = titlesMap[mealKey];

              return (
                <div key={mealKey} className="glass-card" style={{ padding: 22, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <h4 style={{ fontSize: '1rem', color: 'var(--primary-dark)', margin: 0, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                        {mealMeta.icon} {mealMeta.label}
                      </h4>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{meal.calories} kcal</span>
                    </div>

                    <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)', marginBottom: 8 }}>{meal.title}</h3>

                    <div style={{ background: 'var(--primary-soft)', padding: 10, borderRadius: 8, fontSize: '0.8rem', color: 'var(--primary-dark)', border: '1px solid var(--border-glass-active)', marginBottom: 12, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Sparkles size={14} color="#10b981" /> <strong>Benefit:</strong> {meal.focus}
                    </div>

                    {((meal.replacements && meal.replacements.length > 0) || (meal.replacement_foods && meal.replacement_foods.length > 0)) && (
                      <div style={{
                        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.09) 0%, rgba(99, 102, 241, 0.09) 100%)',
                        border: '1px solid rgba(16, 185, 129, 0.35)',
                        borderRadius: 10,
                        padding: '12px 14px',
                        marginBottom: 16
                      }}>
                        <div style={{
                          color: '#10b981',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: '0.86rem',
                          fontWeight: 700,
                          marginBottom: 8
                        }}>
                          <RefreshCw size={14} color="#10b981" /> Alternative Food Options:
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {(() => {
                            const rawReps = meal.replacements || meal.replacement_foods || [];
                            const titleLower = (meal.title || '').toLowerCase();

                            // Exclude any replacement option that repeats the main food item in the meal title
                            const filteredReps = rawReps.filter(repItem => {
                              const repName = String(repItem).split(' (')[0].toLowerCase().trim();
                              if (!repName) return true;
                              const mainFoodCore = titleLower.replace(/breakfast special|lunch|dinner|snack|special|nutrient-rich|hearty/gi, '').trim();
                              if (mainFoodCore && (titleLower.includes(repName) || repName.includes(mainFoodCore))) {
                                return false;
                              }
                              return true;
                            });

                            const displayReps = filteredReps.length > 0 ? filteredReps : rawReps.slice(1);

                            return displayReps.map((repItem, rIdx) => (
                              <div
                                key={rIdx}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 8,
                                  background: 'rgba(0, 0, 0, 0.25)',
                                  border: '1px solid rgba(170, 158, 158, 0.12)',
                                  borderRadius: 8,
                                  padding: '7px 10px',
                                  fontSize: '0.86rem',
                                  color: '#000000ff',
                                  fontWeight: 500
                                }}
                              >
                                <Utensils size={13} color="#34d399" style={{ flexShrink: 0 }} />
                                <span>{repItem}</span>
                              </div>
                            ));
                          })()}
                        </div>
                      </div>
                    )}
                  </div>


                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
