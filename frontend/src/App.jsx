import React, { useState, useEffect } from 'react';
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


import { runDeficiencyAssessment, generateMealPlan, fetchRecipes } from './services/api';

const SESSION_KEY = 'nutriai_session';

export default function App() {
  // ── Auth state ──────────────────────────────────────────
  const [authPage, setAuthPage] = useState('login');      // 'login' | 'register'
  const [currentUser, setCurrentUser] = useState(null);
  const [authToken, setAuthToken] = useState(null);

  // Restore session from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) {
        const { user, token } = JSON.parse(stored);
        setCurrentUser(user);
        setAuthToken(token);
      }
    } catch (_) {}
  }, []);

  // Load user-specific profile when currentUser changes
  useEffect(() => {
    if (!currentUser) return;
    const userKey = `profile_${currentUser.email || currentUser.id || 'default'}`;
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
    } catch (_) {}
  }, [currentUser]);

  const handleAuthSuccess = (user, token) => {
    setCurrentUser(user);
    setAuthToken(token);
    localStorage.setItem(SESSION_KEY, JSON.stringify({ user, token }));
    handleRunAssessment();
  };

  const handleSaveProfile = (updatedProfile) => {
    setProfile(updatedProfile);
    if (currentUser) {
      const userKey = `profile_${currentUser.email || currentUser.id || 'default'}`;
      localStorage.setItem(userKey, JSON.stringify(updatedProfile));
    }
    handleRunAssessment();
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAuthToken(null);
    localStorage.removeItem(SESSION_KEY);
    setAssessmentResult(null);
    setMealPlanData(null);
    setAuthPage('login');
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

  const [loggedFoods, setLoggedFoods] = useState([
    { food_id: 'food_1', food_name: 'Pillsbury Golden Layer Buttermilk Biscuits', serving_g: 50, meal_type: 'Breakfast', calories: 154, protein_g: 3.0, iron_mg: 1.06, vitamin_d_iu: 0, vitamin_b12_mcg: 0, calcium_mg: 40, date: '2026-08-11' },
    { food_id: 'food_2', food_name: 'Amla (Indian gooseberry)', serving_g: 50, meal_type: 'Snack', calories: 22, protein_g: 0.5, iron_mg: 0.15, vitamin_d_iu: 0, vitamin_b12_mcg: 0, calcium_mg: 25, date: '2026-08-11' },
    { food_id: 'food_3', food_name: 'Lentil dal', serving_g: 180, meal_type: 'Dinner', calories: 580, protein_g: 18.0, iron_mg: 12.71, vitamin_d_iu: 0, vitamin_b12_mcg: 0, calcium_mg: 60, date: '2026-08-11' },
    { food_id: 'food_4', food_name: 'Rajma (kidney beans), cooked', serving_g: 150, meal_type: 'Lunch', calories: 191, protein_g: 13.4, iron_mg: 4.35, vitamin_d_iu: 0, vitamin_b12_mcg: 0, calcium_mg: 50, date: '2026-08-11' },
    { food_id: 'food_5', food_name: 'Whole wheat roti', serving_g: 80, meal_type: 'Breakfast', calories: 238, protein_g: 7.2, iron_mg: 2.88, vitamin_d_iu: 0, vitamin_b12_mcg: 0, calcium_mg: 30, date: '2026-08-11' },
    { food_id: 'food_6', food_name: 'Spinach (Raw)', serving_g: 100, meal_type: 'Breakfast', calories: 23, protein_g: 2.9, iron_mg: 2.71, vitamin_d_iu: 0, vitamin_b12_mcg: 0, calcium_mg: 99, date: '2026-08-12' },
    { food_id: 'food_7', food_name: 'Oranges (Fresh)', serving_g: 150, meal_type: 'Snack', calories: 70, protein_g: 1.3, iron_mg: 0.15, vitamin_d_iu: 0, vitamin_b12_mcg: 0, calcium_mg: 60, date: '2026-08-12' },
  ]);

  const [symptoms, setSymptoms] = useState({
    fatigue: true,
    hair_loss: true,
    pale_skin: false,
    muscle_weakness: false,
    mood_changes: true,
    brittle_nails: true,
    bleeding_gums: false,
    dry_skin: false,
    cold_intolerance: false,
    slow_healing: false,
  });

  const [labs, setLabs] = useState({
    hemoglobin_g_dl: 10.5,
    vit_d_ng_ml: 18.2,
    vit_b12_pg_ml: 195.0,
    serum_iron_mcg_dl: 45.0,
    calcium_mg_dl: 8.8,
  });

  const [assessmentResult, setAssessmentResult] = useState(null);
  const [mealPlanData, setMealPlanData] = useState(null);
  const [recipesList, setRecipesList] = useState([]);
  const [selectedRecipeModal, setSelectedRecipeModal] = useState(null);

  useEffect(() => { fetchRecipes().then(setRecipesList); }, []);

  const handleRunAssessment = async () => {
    setIsLoading(true);
    try {
      const payload = { profile, logged_foods: loggedFoods, symptoms, labs };
      const [result, mpResult] = await Promise.all([
        runDeficiencyAssessment(payload),
        generateMealPlan(payload),
      ]);
      setAssessmentResult(result);
      setMealPlanData(mpResult);
    } catch (err) {
      console.error('Assessment failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Render: Auth pages (unauthenticated) ─────────────────
  if (!currentUser) {
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
      />
    );
  }

  // ── Render: Authenticated main app ───────────────────────
  return (
    <div className="app-container">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        healthScore={assessmentResult ? assessmentResult.overall_health_score : null}
        currentUser={currentUser}
        onOpenAuth={() => {}}
        onLogout={handleLogout}
      />

      <main className="main-content">
        {activeTab === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <SymptomLabForm
              symptoms={symptoms}
              setSymptoms={setSymptoms}
              labs={labs}
              setLabs={setLabs}
              onRunAssessment={handleRunAssessment}
              isLoading={isLoading}
            />
            <DeficiencyScoreCards
              assessmentResult={assessmentResult}
              onSelectRecipe={r => setSelectedRecipeModal(r)}
            />
            {assessmentResult && <ShapExplanationView shapExplanations={assessmentResult.shap_explanations} />}
            {assessmentResult && <IntakeCharts nutritionSummary={assessmentResult.nutritional_intake_summary} />}
          </div>
        )}

        {activeTab === 'diary' && (
          <DietaryDiary loggedFoods={loggedFoods} setLoggedFoods={setLoggedFoods} />
        )}

        {activeTab === 'mealplan' && (
          <MealPlanViewer
            mealPlanData={mealPlanData}
            onSelectRecipe={r => setSelectedRecipeModal(r)}
          />
        )}

        {activeTab === 'analytics' && <LongitudinalTracker />}

        {activeTab === 'profile' && (
          <ProfileForm
            profile={profile}
            setProfile={setProfile}
            currentUser={currentUser}
            onSave={() => handleSaveProfile(profile)}
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
