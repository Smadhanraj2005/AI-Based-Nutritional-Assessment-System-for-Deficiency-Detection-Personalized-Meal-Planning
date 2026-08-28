import React, { useState, useEffect } from 'react';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Header from './components/Header';
import ProfileForm from './components/ProfileForm';
import DietaryDiary from './components/DietaryDiary';
import SymptomLabForm from './components/SymptomLabForm';
import DeficiencyScoreCards from './components/DeficiencyScoreCards';
import ShapExplanationView from './components/ShapExplanationView';
import MealPlanViewer from './components/MealPlanViewer';
import RecipeModal from './components/RecipeModal';
import IntakeCharts from './components/IntakeCharts';
import LongitudinalTracker from './components/LongitudinalTracker';
import DashboardView from './components/DashboardView';
import ProgressView from './components/ProgressView';

import Sidebar from './components/Sidebar';
import MobileHeader from './components/MobileHeader';
import { ShieldCheck, TestTube2, AlertTriangle, Calendar, ClipboardList, ArrowRight, Activity, Zap } from 'lucide-react';

import { runDeficiencyAssessment, generateMealPlan, fetchRecipes, fetchLatestAssessment, fetchDiaryEntries, saveProfile, fetchProfile, fetchLabs } from './services/api';

const normalizeDiaryEntry = (entry) => {
  const vit_d_mcg = entry.vitamin_d_mcg !== undefined && entry.vitamin_d_mcg !== null && floatVal(entry.vitamin_d_mcg) > 0
    ? floatVal(entry.vitamin_d_mcg)
    : (entry.vitamin_d_iu ? floatVal(entry.vitamin_d_iu) / 40.0 : 0);
  const vit_d_iu = entry.vitamin_d_iu !== undefined && entry.vitamin_d_iu !== null && floatVal(entry.vitamin_d_iu) > 0
    ? Math.round(floatVal(entry.vitamin_d_iu))
    : Math.round(vit_d_mcg * 40);

  return {
    id: entry.id,
    user_id: entry.user_id,
    date: entry.entry_date,
    meal_type: entry.meal_type,
    food_id: String(entry.food_id),
    food_name: entry.food_name,
    serving_g: entry.portion_grams,
    calories: entry.calories_kcal,
    protein_g: entry.protein_g,
    iron_mg: entry.iron_mg,
    calcium_mg: entry.calcium_mg,
    vitamin_d_mcg: vit_d_mcg,
    vitamin_d_iu: vit_d_iu,
    vitamin_b12_mcg: entry.vitamin_b12_mcg,
    folate_mcg: entry.folate_mcg,
    vitamin_a_mcg: entry.vitamin_a_mcg,
    vitamin_a_iu: Math.round((entry.vitamin_a_mcg || 0) * 3.333),
    vitamin_c_mg: entry.vitamin_c_mg,
    magnesium_mg: entry.magnesium_mg,
    zinc_mg: entry.zinc_mg,
  };
};

const floatVal = (v) => {
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
};

const THEME_KEY = 'nutriai_theme';
const SESSION_KEY = 'nutriai_session';

export default function App() {
  // ── Auth state ──────────────────────────────────────────
  const [authPage, setAuthPage] = useState('landing');     // 'landing' | 'login' | 'register'
  const [currentUser, setCurrentUser] = useState(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [authToken, setAuthToken] = useState(null);

  // ── Theme state ─────────────────────────────────────────
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem(THEME_KEY) || 'dark'; } catch (_) { return 'dark'; }
  });

  // Apply data-theme attribute to <html> whenever theme changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem(THEME_KEY, theme); } catch (_) {}
  }, [theme]);

  const handleThemeToggle = () =>
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));

  // Restore session from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) {
        const { user, token } = JSON.parse(stored);
        setCurrentUser(user);
        setAuthToken(token);
      }
    } catch (_) { }
  }, []);

  // Load user-specific profile when currentUser changes
  useEffect(() => {
    if (!currentUser) return;
    const loadProfile = async () => {
      const userKey = `profile_${currentUser.email || currentUser.id || 'default'}`;
      try {
        const dbProfile = await fetchProfile(currentUser.id);
        if (dbProfile) {
          setProfile(dbProfile);
          localStorage.setItem(userKey, JSON.stringify(dbProfile));
          return;
        }
      } catch (err) {
        console.error('Failed to fetch profile from DB:', err);
      }
      
      try {
        const storedProfile = localStorage.getItem(userKey);
        if (storedProfile) {
          setProfile(JSON.parse(storedProfile));
        } else {
          // Fallback or setup initial profile from currentUser auth payload
          const initial = {
            name: currentUser.name || 'User',
            age: currentUser.age || 25,
            gender: currentUser.gender || 'Female',
            weight_kg: currentUser.weight_kg || 60,
            height_cm: currentUser.height_cm || 165,
            activity_level: currentUser.activity_level || 'Moderate',
            medical_conditions: currentUser.medical_conditions || [],
            dietary_restrictions: currentUser.dietary_restrictions || [],
            health_goals: currentUser.health_goals || ['Improve energy'],
          };
          setProfile(initial);
          localStorage.setItem(userKey, JSON.stringify(initial));
        }
      } catch (_) { }
    };
    
    loadProfile();
  }, [currentUser]);

  const handleAuthSuccess = (user, token) => {
    setCurrentUser(user);
    setAuthToken(token);
    localStorage.setItem(SESSION_KEY, JSON.stringify({ user, token }));
    // Assessment runs only when user explicitly clicks the button
  };

  const handleSaveProfile = async (updatedProfile) => {
    if (currentUser) {
      const userKey = `profile_${currentUser.email || currentUser.id || 'default'}`;
      try {
        const response = await saveProfile(updatedProfile, currentUser.id);
        if (response && response.status === 'saved') {
          setProfile(updatedProfile);
          localStorage.setItem(userKey, JSON.stringify(updatedProfile));
          if (response.user) {
            setCurrentUser(response.user);
            localStorage.setItem(SESSION_KEY, JSON.stringify({ user: response.user, token: authToken }));
          }
          return response;
        } else {
          throw new Error('Failed to save profile');
        }
      } catch (err) {
        console.error('Failed to save profile to DB:', err);
        throw err;
      }
    }
    return { status: 'saved' };
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAuthToken(null);
    localStorage.removeItem(SESSION_KEY);
    setAssessmentResult(null);
    setMealPlanData(null);
    setAuthPage('landing');
  };

  // ── App state ────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(false);

  const [profile, setProfile] = useState({
    name: 'Alex Morgan',
    age: 28,
    gender: 'Female',
    weight_kg: 62.0,
    height_cm: 168.0,
    activity_level: 'Moderate',
    medical_conditions: ['Thyroid Sensitivity'],
    dietary_restrictions: ['Gluten-Free'],
    health_goals: ['Address Fatigue', 'Improve Bone Density'],
  });

  const [loggedFoods, setLoggedFoods] = useState([]);

  const [symptoms, setSymptoms] = useState({
    fatigue: false,
    hair_loss: false,
    pale_skin: false,
    muscle_weakness: false,
    mood_changes: false,
    brittle_nails: false,
    bleeding_gums: false,
    dry_skin: false,
    cold_intolerance: false,
    slow_healing: false,
  });

  const [labs, setLabs] = useState({
    hemoglobin_g_dl: 0,
    vit_d_ng_ml: 0,
    vit_b12_pg_ml: 0,
    serum_iron_mcg_dl: 0,
    ferritin: 0,
    calcium_mg_dl: 0,
  });

  const DEFAULT_ASSESSMENT_RESULT = {
    overall_health_score: 52,
    detected_deficiencies: [
      { deficiency: "Iron Deficiency (Anemia)", probability: 0.98, risk_level: "High", confidence: "98%" },
      { deficiency: "Vitamin B12 Deficiency", probability: 0.98, risk_level: "High", confidence: "98%" },
      { deficiency: "Vitamin D Deficiency", probability: 0.94, risk_level: "High", confidence: "94%" },
      { deficiency: "Magnesium Deficiency", probability: 0.68, risk_level: "High", confidence: "68%" },
      { deficiency: "Zinc Deficiency", probability: 0.67, risk_level: "High", confidence: "67%" },
      { deficiency: "Protein Deficiency", probability: 0.55, risk_level: "Moderate", confidence: "55%" },
      { deficiency: "Calcium Deficiency", probability: 0.53, risk_level: "Moderate", confidence: "53%" },
      { deficiency: "Folate (Vitamin B9) Deficiency", probability: 0.43, risk_level: "Moderate", confidence: "43%" },
      { deficiency: "Vitamin C Deficiency", probability: 0.37, risk_level: "Moderate", confidence: "37%" },
      { deficiency: "Vitamin A Deficiency", probability: 0.15, risk_level: "Low", confidence: "15%" }
    ],
    bayesian_lab_updates: {
      "Iron Deficiency (Anemia)": "Hemoglobin level of 10.5 g/dl is below standard threshold (12.0 g/dl). Likelihood ratio 5.0x applied.",
      "Vitamin B12 Deficiency": "Serum Vitamin B12 level is 195.0 pg/ml (Deficient < 200 pg/ml). Likelihood ratio 5.0x applied.",
      "Vitamin D Deficiency": "Vitamin 25-OH is 18.2 ng/ml (Deficient/Insufficient < 30 ng/ml). Likelihood ratio 4.5x applied."
    },
    recommendations: {
      "Iron Deficiency (Anemia)": {
        recommended_foods: ["Spinach (Raw)", "Lentils (Cooked)", "Pumpkin Seeds (Roasted)", "Beef Liver (Pan-fried)", "Almonds (Raw)"],
        dietary_notes: "Combine plant-based iron (non-heme) with Vitamin C rich foods like oranges or sweet potatoes to boost absorption by up to 300%. Avoid tea or coffee with iron-rich meals.",
        supplements: ["Ferrous Sulfate (325mg elemental iron Daily with Vit C)"],
        suggested_recipes: [{ id: "rec_1", title: "Iron-Rich Spinach Lentil Curry", prep_time_mins: 25, calories: 340 }]
      },
      "Vitamin B12 Deficiency": {
        recommended_foods: ["Salmon (Grilled)", "Beef Liver (Pan-fried)", "Eggs (Whole, Boiled)", "Greek Yogurt (Plain, Whole)", "Fortified Soy Milk"],
        dietary_notes: "Essential for nerve function and RBC formation. Plant-based individuals must consume fortified plant milks, nutritional yeast, or sublingual B12.",
        supplements: ["Methylcobalamin B12 (1000 mcg sublingual Daily)"],
        suggested_recipes: [{ id: "rec_2", title: "Grilled Salmon with Wild Rice", prep_time_mins: 20, calories: 420 }]
      },
      "Vitamin D Deficiency": {
        recommended_foods: ["Salmon (Grilled)", "Eggs (Whole, Boiled)", "Fortified Soy Milk", "Cod Fish (Baked)", "Greek Yogurt (Plain, Whole)"],
        dietary_notes: "Vitamin D is fat-soluble. Consume with healthy fats like olive oil, avocado, or nuts to optimize intestinal absorption.",
        supplements: ["Vitamin D3 (2000-5000 IU Daily taken with meals)"],
        suggested_recipes: [{ id: "rec_3", title: "Egg & Spinach Breakfast Skillet", prep_time_mins: 15, calories: 290 }]
      },
      "Magnesium Deficiency": {
        recommended_foods: ["Pumpkin Seeds (Roasted)", "Almonds (Raw)", "Spinach (Raw)", "Lentils (Cooked)", "Cod Fish (Baked)"],
        dietary_notes: "Regulates muscle relaxation, mood, and over 300 enzymatic pathways. High stress increases magnesium excretion.",
        supplements: ["Magnesium Glycinate or Citrate (300-400 mg at night)"],
        suggested_recipes: [{ id: "rec_4", title: "Roasted Pumpkin Seed & Quinoa Bowl", prep_time_mins: 20, calories: 380 }]
      },
      "Zinc Deficiency": {
        recommended_foods: ["Pumpkin Seeds (Roasted)", "Beef Liver (Pan-fried)", "Almonds (Raw)", "Lentils (Cooked)", "Eggs (Whole, Boiled)"],
        dietary_notes: "Supports immune defenses and gut integrity. Soak seeds and legumes to neutralize phytates that bind zinc.",
        supplements: ["Zinc Picolinate or Gluconate (15-30 mg Daily)"],
        suggested_recipes: [{ id: "rec_5", title: "Zinc-Boosted Seed & Nut Mix", prep_time_mins: 10, calories: 220 }]
      },
      "Iodine Deficiency": {
        recommended_foods: ["Cod Fish (Baked)", "Greek Yogurt (Plain, Whole)", "Eggs (Whole, Boiled)", "Salmon (Grilled)"],
        dietary_notes: "Essential for thyroid hormone production (T3/T4) and metabolic regulation. Use iodized salt or sea vegetables.",
        supplements: ["Potassium Iodide (150 mcg Daily)"],
        suggested_recipes: [{ id: "rec_6", title: "Baked Cod with Herb Butter", prep_time_mins: 20, calories: 310 }]
      },
      "Calcium Deficiency": {
        recommended_foods: ["Greek Yogurt (Plain, Whole)", "Almonds (Raw)", "Fortified Soy Milk", "Spinach (Raw)", "Eggs (Whole, Boiled)"],
        dietary_notes: "Crucial for bone density and muscle contractions. Pair with Vitamin D for optimal bone deposition.",
        supplements: ["Calcium Citrate (500mg twice Daily with meals)"],
        suggested_recipes: [{ id: "rec_7", title: "Greek Yogurt Parfait with Almonds", prep_time_mins: 10, calories: 250 }]
      },
      "Folate (Vitamin B9) Deficiency": {
        recommended_foods: ["Spinach (Raw)", "Lentils (Cooked)", "Pumpkin Seeds (Roasted)", "Sweet Potato (Baked)", "Almonds (Raw)"],
        dietary_notes: "Key for cellular synthesis and neural tube prevention. Steam greens lightly to prevent thermal destruction of folate.",
        supplements: ["L-Methylfolate (400-800 mcg Daily)"],
        suggested_recipes: [{ id: "rec_8", title: "Lentil & Sweet Potato Salad", prep_time_mins: 25, calories: 330 }]
      },
      "Vitamin C Deficiency": {
        recommended_foods: ["Oranges (Fresh)", "Spinach (Raw)", "Sweet Potato (Baked)", "Pumpkin Seeds (Roasted)"],
        dietary_notes: "Powerful antioxidant supporting collagen synthesis and iron uptake. Heat degrades Vit C, so consume fresh fruits raw.",
        supplements: ["Ascorbic Acid or Liposomal Vitamin C (500-1000 mg Daily)"],
        suggested_recipes: [{ id: "rec_9", title: "Fresh Citrus & Spinach Detox Salad", prep_time_mins: 12, calories: 180 }]
      },
      "Vitamin A Deficiency": {
        recommended_foods: ["Beef Liver (Pan-fried)", "Sweet Potato (Baked)", "Spinach (Raw)", "Eggs (Whole, Boiled)", "Greek Yogurt (Plain, Whole)"],
        dietary_notes: "Vital for vision, immunity, and skin barrier health. Beta-carotene in sweet potato converts to active Retinol in body.",
        supplements: ["Cod Liver Oil or Vitamin A Palmitate (5000 IU Daily)"],
        suggested_recipes: [{ id: "rec_10", title: "Baked Sweet Potato & Spinach Medley", prep_time_mins: 20, calories: 260 }]
      }
    },
    shap_explanations: {
      "Iron Deficiency (Anemia)": [
        { feature: "Daily Iron Intake", pct: "15.2% RDA", impact: "+42%" },
        { feature: "Hemoglobin Lab Value", pct: "10.5", impact: "+36%" },
        { feature: "Fatigue & Low Energy", pct: "Present", impact: "+20%" },
        { feature: "Brittle Nails", pct: "Present", impact: "+20%" }
      ],
      "Vitamin D Deficiency": [
        { feature: "Daily Vitamin D Intake", pct: "0.0% RDA", impact: "+46%" },
        { feature: "Serum Vitamin D 25-OH", pct: "18.2", impact: "+36%" },
        { feature: "Mood Swings / Low Mood", pct: "Present", impact: "+20%" },
        { feature: "Chronic Fatigue", pct: "Present", impact: "+20%" }
      ],
      "Vitamin B12 Deficiency": [
        { feature: "Daily Vitamin B12 Intake", pct: "0.0% RDA", impact: "+46%" },
        { feature: "Serum B12 Test", pct: "195.0", impact: "+36%" },
        { feature: "Fatigue & Weakness", pct: "Present", impact: "+20%" },
        { feature: "Neurological / Mood Symptoms", pct: "Present", impact: "+20%" }
      ],
      "Calcium Deficiency": [
        { feature: "Daily Calcium Intake", pct: "18.9% RDA", impact: "+42%" },
        { feature: "Brittle Nails", pct: "Present", impact: "+20%" }
      ],
      "Folate (Vitamin B9) Deficiency": [
        { feature: "Daily Folate Intake", pct: "52.3% RDA", impact: "+20%" },
        { feature: "Fatigue", pct: "Present", impact: "+20%" },
        { feature: "Hair Thinning", pct: "Present", impact: "+20%" }
      ],
      "Zinc Deficiency": [
        { feature: "Daily Zinc Intake", pct: "22% RDA", impact: "+46%" },
        { feature: "Hair Loss", pct: "Present", impact: "+20%" },
        { feature: "Nail Dystrophy", pct: "Present", impact: "+20%" }
      ],
      "Vitamin A Deficiency": [
        { feature: "Daily Vitamin A Intake", pct: "323.3% RDA", impact: "-15%" }
      ],
      "Vitamin C Deficiency": [
        { feature: "Daily Vitamin C Intake", pct: "112.2% RDA", impact: "-15%" }
      ],
      "Magnesium Deficiency": [
        { feature: "Daily Magnesium Intake", pct: "30.3% RDA", impact: "+36%" },
        { feature: "Anxiety / Mood Alterations", pct: "Present", impact: "+20%" }
      ],
      "Iodine Deficiency": [
        { feature: "Daily Iodine Intake", pct: "3.2% RDA", impact: "+46%" },
        { feature: "Lethargy & Fatigue", pct: "Present", impact: "+20%" }
      ]
    },
    nutritional_intake_summary: {
      percentages: {
        iron_mg_pct: 15.2,
        vitamin_d_iu_pct: 0.0,
        vitamin_b12_mcg_pct: 0.0,
        calcium_mg_pct: 18.9,
        folate_mcg_pct: 52.3,
        zinc_mg_pct: 22.0,
        vitamin_c_mg_pct: 112.2,
        magnesium_mg_pct: 30.3
      }
    }
  };

  const [assessmentResult, setAssessmentResult] = useState(null);
  const [assessmentError, setAssessmentError] = useState('');
  const [mealPlanData, setMealPlanData] = useState(null);
  const [recipesList, setRecipesList] = useState([]);
  const [selectedRecipeModal, setSelectedRecipeModal] = useState(null);

  useEffect(() => {
    fetchRecipes().then(setRecipesList);
    // Restore latest saved assessment on load
    const userId = currentUser?.id || 1;
    fetchLatestAssessment(userId).then(data => {
      if (data && data.risks && Array.isArray(data.risks) && data.risks.length > 0) {
        setAssessmentResult({
          overall_health_score: data.overall_score,
          distinct_diary_days: data.distinct_diary_days || data.diary_days_used,
          detected_deficiencies: data.risks,
          feature_vector: data.features,
          bayesian_lab_updates: {},
          shap_explanations: {}
        });
      }
    });
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) {
      setLoggedFoods([]);
      return;
    }
    const loadUserData = async () => {
      try {
        const entries = await fetchDiaryEntries(currentUser.id);
        const normalized = entries.map(normalizeDiaryEntry);
        setLoggedFoods(normalized);
      } catch (err) {
        console.error('Failed to load diary entries:', err);
      }

      try {
        const userLabs = await fetchLabs(currentUser.id);
        if (userLabs && Object.keys(userLabs).length > 0) {
          setLabs(prev => ({ ...prev, ...userLabs }));
        }
      } catch (err) {
        console.error('Failed to load user labs:', err);
      }
    };
    loadUserData();
  }, [currentUser]);

  const handleRunAssessment = async () => {
    setIsLoading(true);
    setAssessmentError('');
    try {
      const distinctDays = new Set(loggedFoods.map(f => f.date).filter(Boolean)).size;
      if (distinctDays < 4) {
        setAssessmentError(`You must log food items for a minimum of 4 distinct days before running the AI Deficiency Diagnosis. Currently logged: ${distinctDays} / 4 days. Please add meals for more distinct days in the Dietary Diary tab first.`);
        setIsLoading(false);
        return;
      }

      const userId = currentUser?.id || 1;
      const payload = { profile, logged_foods: loggedFoods, symptoms, labs };
      const [result, mpResult] = await Promise.allSettled([
        runDeficiencyAssessment(payload, userId),
        generateMealPlan(payload, userId),
      ]);
      
      if (result.status === 'fulfilled' && result.value && result.value.detected_deficiencies) {
        setAssessmentResult(result.value);
        setAssessmentError('');
      } else if (result.status === 'rejected') {
        const errorMsg = result.reason?.message || 'Assessment execution failed.';
        setAssessmentError(errorMsg);
      }
      
      if (mpResult.status === 'fulfilled' && mpResult.value) {
        setMealPlanData(mpResult.value);
      }
    } catch (err) {
      console.error('Assessment failed:', err);
      setAssessmentError(err.message || 'Assessment execution failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateMealPlan = async () => {
    setIsLoading(true);
    setAssessmentError('');
    try {
      const userId = currentUser?.id || 1;
      const payload = { profile, logged_foods: loggedFoods, symptoms, labs };
      const data = await generateMealPlan(payload, userId);
      setMealPlanData(data);
    } catch (err) {
      console.error('Failed to generate meal plan:', err);
      setAssessmentError(err.message || 'Meal plan generation failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Render: Auth pages (unauthenticated) ─────────────────
  if (!currentUser) {
    if (authPage === 'landing') {
      return (
        <LandingPage
          onGoToLogin={() => setAuthPage('login')}
          onGoToRegister={() => setAuthPage('register')}
        />
      );
    }
    if (authPage === 'register') {
      return (
        <RegisterPage
          onAuthSuccess={handleAuthSuccess}
          onGoToLogin={() => setAuthPage('login')}
        />
      );
    }
    return (
      <LoginPage
        onAuthSuccess={handleAuthSuccess}
        onGoToRegister={() => setAuthPage('register')}
        onGoToLanding={() => setAuthPage('landing')}
      />
    );
  }

  // ── Render: Authenticated main app ───────────────────────
  return (
    <div className="app-container app-with-sidebar">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onLogout={handleLogout}
        theme={theme}
        onThemeToggle={handleThemeToggle}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
      />

      <MobileHeader
        onToggleSidebar={() => setIsMobileSidebarOpen(v => !v)}
        activeTab={activeTab}
        currentUser={currentUser}
      />

      <main className="main-content">
        {activeTab === 'dashboard' && (
          <DashboardView
            profile={profile}
            loggedFoods={loggedFoods}
            symptoms={symptoms}
            labs={labs}
            assessmentResult={assessmentResult}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'assessment' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Assessment Top Action Banner */}
            <div className="glass-card" style={{ padding: '24px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <ShieldCheck size={26} color="var(--primary)" />
                  AI Deficiency Assessment
                </h1>
                
              </div>

              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <button
                  onClick={() => setActiveTab('bloodtest')}
                  className="btn-secondary"
                  style={{ padding: '10px 18px', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <TestTube2 size={16} color="var(--primary)" /> Enter Lab Tests
                </button>
                <button
                  className="btn-primary"
                  onClick={handleRunAssessment}
                  disabled={isLoading}
                  style={{ padding: '10px 22px', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Zap size={16} /> {isLoading ? 'Running ML Engine...' : 'Run AI Deficiency Diagnosis'}
                </button>
              </div>
            </div>

            {/* Assessment Error Banner */}
            {assessmentError && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px 20px',
                borderRadius: 12,
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#fca5a5',
                fontSize: '0.9rem'
              }}>
                <AlertTriangle size={20} color="#ef4444" style={{ flexShrink: 0 }} />
                <div>
                  <strong>Assessment Requirement:</strong> {assessmentError}
                </div>
              </div>
            )}

            {/* Assessment Scorecards & Explainability */}
            <DeficiencyScoreCards
              assessmentResult={assessmentResult}
              loggedFoods={loggedFoods}
              onSelectRecipe={r => setSelectedRecipeModal(r)}
              setActiveTab={setActiveTab}
            />
            {assessmentResult && <ShapExplanationView shapExplanations={assessmentResult.shap_explanations} />}
            {assessmentResult && <IntakeCharts nutritionSummary={assessmentResult.nutritional_intake_summary} />}
          </div>
        )}

        {activeTab === 'bloodtest' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <SymptomLabForm
              labs={labs}
              setLabs={setLabs}
              onRunAssessment={handleRunAssessment}
              isLoading={isLoading}
              assessmentError={assessmentError}
              currentUser={currentUser}
            />
          </div>
        )}

        {activeTab === 'diary' && (
          <DietaryDiary loggedFoods={loggedFoods} setLoggedFoods={setLoggedFoods} currentUser={currentUser} />
        )}

        {activeTab === 'mealplan' && (
          <MealPlanViewer
            assessmentResult={assessmentResult}
            mealPlanData={mealPlanData}
            onGenerateMealPlan={handleGenerateMealPlan}
            onSelectRecipe={r => setSelectedRecipeModal(r)}
            setActiveTab={setActiveTab}
            isLoading={isLoading}
            profile={profile}
          />
        )}

        {activeTab === 'analytics' && (
          <ProgressView loggedFoods={loggedFoods} profile={profile} />
        )}

        {activeTab === 'profile' && (
          <ProfileForm
            profile={profile}
            setProfile={setProfile}
            currentUser={currentUser}
            onSave={() => handleSaveProfile(profile)}
            theme={theme}
            onThemeToggle={handleThemeToggle}
          />
        )}


      </main>

      {selectedRecipeModal && (
        <RecipeModal
          recipe={selectedRecipeModal}
          recipesList={recipesList}
          onClose={() => setSelectedRecipeModal(null)}
        />
      )}
    </div>
  );
}
