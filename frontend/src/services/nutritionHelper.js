/**
 * Centralized Nutrition Helper & RDA Calculation Service
 * Aligned with backend/app/services/nutrition_calculator.py and NHANES RDA standards.
 */

export const RDA_BASELINES = {
  calories: 2000,
  protein_g: 56.0,
  carbs_g: 275.0,
  fat_g: 70.0,
  fiber_g: 28.0,
  iron_mg: 18.0, // 18mg for females, 8mg for males
  calcium_mg: 1000.0,
  vitamin_d_iu: 600.0,
  vitamin_b12_mcg: 2.4,
  vitamin_c_mg: 90.0,
  zinc_mg: 11.0, // 8mg for females, 11mg for males
  magnesium_mg: 400.0, // 310mg for females, 400mg for males
  folate_mcg: 400.0,
  vitamin_a_iu: 3000.0,
  iodine_mcg: 150.0
};

/**
 * Get personalized RDA targets adjusted for gender, weight, and activity level.
 */
export function getRDAForProfile(profile) {
  const isFemale = !profile || profile.gender === 'Female' || profile.gender === 2;
  
  // Estimate daily calorie needs if weight & activity are specified
  let calorieTarget = 2000;
  if (profile?.weight_kg) {
    const actMultiplier = profile.activity_level === 'High' ? 33 : profile.activity_level === 'Moderate' ? 30 : 26;
    calorieTarget = Math.round(profile.weight_kg * actMultiplier);
  }

  // Protein estimate: ~0.8-1.0g per kg of body weight
  let proteinTarget = isFemale ? 48.0 : 56.0;
  if (profile?.weight_kg) {
    proteinTarget = Math.round(profile.weight_kg * 0.9);
  }

  return {
    ...RDA_BASELINES,
    calories: calorieTarget,
    protein_g: proteinTarget,
    carbs_g: Math.round((calorieTarget * 0.50) / 4), // 50% calories from carbs
    fat_g: Math.round((calorieTarget * 0.30) / 9),   // 30% calories from fats
    iron_mg: isFemale ? 18.0 : 8.0,
    zinc_mg: isFemale ? 8.0 : 11.0,
    magnesium_mg: isFemale ? 310.0 : 400.0,
  };
}

/**
 * Returns today's date formatted as YYYY-MM-DD in local time.
 */
export function getTodayStr(dateObj = new Date()) {
  const d = dateObj instanceof Date ? dateObj : new Date(dateObj);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculates macro and micronutrient totals and percentage of daily target.
 * Can filter by a specific date (defaults to today's date), or compute across all logged entries ('all').
 */
export function calculateNutritionTotals(loggedFoods = [], profile = null, dateFilter = getTodayStr()) {
  const rda = getRDAForProfile(profile);
  
  // Filter by date if specified (defaulting to today), unless dateFilter === 'all'
  const items = (dateFilter && dateFilter !== 'all')
    ? loggedFoods.filter(item => {
        if (!item || !item.date) return false;
        const itemDateStr = String(item.date).split('T')[0].split(' ')[0];
        const filterDateStr = String(dateFilter).split('T')[0].split(' ')[0];
        return itemDateStr === filterDateStr;
      })
    : loggedFoods;

  const totals = {
    calories: 0,
    protein_g: 0,
    carbs_g: 0,
    fat_g: 0,
    fiber_g: 0,
    iron_mg: 0,
    calcium_mg: 0,
    vitamin_d_iu: 0,
    vitamin_b12_mcg: 0,
    vitamin_c_mg: 0,
    zinc_mg: 0,
    magnesium_mg: 0,
    folate_mcg: 0,
    vitamin_a_iu: 0,
  };

  items.forEach(item => {
    const cals = Number(item.calories || 0);
    const prot = Number(item.protein_g || 0);
    
    // If carbs or fat are missing in legacy food rows, compute estimated macro distribution
    const carbs = item.carbs_g !== undefined ? Number(item.carbs_g) : Math.max(0, Math.round((cals * 0.55) / 4));
    const fat = item.fat_g !== undefined ? Number(item.fat_g) : Math.max(0, Math.round((cals * 0.25) / 9));
    const fiber = item.fiber_g !== undefined ? Number(item.fiber_g) : Math.round((carbs * 0.1));

    totals.calories += cals;
    totals.protein_g += prot;
    totals.carbs_g += carbs;
    totals.fat_g += fat;
    totals.fiber_g += fiber;
    totals.iron_mg += Number(item.iron_mg || 0);
    totals.calcium_mg += Number(item.calcium_mg || 0);
    totals.vitamin_d_iu += Number(item.vitamin_d_iu || 0);
    totals.vitamin_b12_mcg += Number(item.vitamin_b12_mcg || 0);
    totals.vitamin_c_mg += Number(item.vitamin_c_mg || (item.food_name?.toLowerCase().includes('orange') ? 70 : item.food_name?.toLowerCase().includes('amla') ? 60 : 5));
    totals.zinc_mg += Number(item.zinc_mg || (item.food_name?.toLowerCase().includes('rajma') ? 1.8 : item.food_name?.toLowerCase().includes('dal') ? 1.2 : 0.4));
    totals.magnesium_mg += Number(item.magnesium_mg || (item.food_name?.toLowerCase().includes('spinach') ? 79 : item.food_name?.toLowerCase().includes('dal') ? 48 : 15));
    totals.folate_mcg += Number(item.folate_mcg || (item.food_name?.toLowerCase().includes('spinach') ? 194 : item.food_name?.toLowerCase().includes('dal') ? 120 : 25));
    totals.vitamin_a_iu += Number(item.vitamin_a_iu || (item.food_name?.toLowerCase().includes('spinach') ? 2800 : 50));
  });

  // Calculate percentage of target achieved
  const percentages = {};
  Object.keys(totals).forEach(key => {
    const target = rda[key] || 1;
    percentages[key] = Math.round((totals[key] / target) * 100);
  });

  return {
    itemsCount: items.length,
    totals: {
      calories: Math.round(totals.calories),
      protein_g: Number(totals.protein_g.toFixed(1)),
      carbs_g: Number(totals.carbs_g.toFixed(1)),
      fat_g: Number(totals.fat_g.toFixed(1)),
      fiber_g: Number(totals.fiber_g.toFixed(1)),
      iron_mg: Number(totals.iron_mg.toFixed(2)),
      calcium_mg: Math.round(totals.calcium_mg),
      vitamin_d_iu: Math.round(totals.vitamin_d_iu),
      vitamin_b12_mcg: Number(totals.vitamin_b12_mcg.toFixed(2)),
      vitamin_c_mg: Number(totals.vitamin_c_mg.toFixed(1)),
      zinc_mg: Number(totals.zinc_mg.toFixed(1)),
      magnesium_mg: Math.round(totals.magnesium_mg),
      folate_mcg: Math.round(totals.folate_mcg),
      vitamin_a_iu: Math.round(totals.vitamin_a_iu),
    },
    rda,
    percentages
  };
}

/**
 * Categorize nutrient intake level into status classifications.
 */
export function getNutrientStatus(percentage) {
  if (percentage < 70) {
    return {
      status: 'Below target',
      level: 'low',
      color: '#ef4444',
      badgeClass: 'badge-danger',
      bg: 'rgba(239, 68, 68, 0.1)',
      border: 'rgba(239, 68, 68, 0.25)'
    };
  }
  if (percentage < 100) {
    return {
      status: 'Near target',
      level: 'moderate',
      color: '#f59e0b',
      badgeClass: 'badge-warning',
      bg: 'rgba(245, 158, 11, 0.1)',
      border: 'rgba(245, 158, 11, 0.25)'
    };
  }
  if (percentage <= 135) {
    return {
      status: 'Target reached',
      level: 'optimal',
      color: '#10b981',
      badgeClass: 'badge-success',
      bg: 'rgba(16, 185, 129, 0.1)',
      border: 'rgba(16, 185, 129, 0.25)'
    };
  }
  return {
    status: 'Higher than target',
    level: 'high',
    color: '#3b82f6',
    badgeClass: 'badge-info',
    bg: 'rgba(59, 130, 246, 0.1)',
    border: 'rgba(59, 130, 246, 0.25)'
  };
}

/**
 * Computes setup progress checklist (4 steps).
 */
export function calculateSetupProgress(profile, loggedFoods = [], symptoms = {}, labs = {}) {
  const steps = [
    {
      id: 'profile',
      title: 'Complete health profile',
      description: 'Add your age, gender, biometric stats and health goals',
      tab: 'profile',
      isCompleted: Boolean(profile?.name && profile?.age && profile?.gender && profile?.weight_kg)
    },
    {
      id: 'diary',
      title: 'Log your first meal',
      description: 'Record food intake in the diary to calculate daily nutrients',
      tab: 'diary',
      isCompleted: loggedFoods.length > 0
    },
    {
      id: 'labs',
      title: 'Add blood test values',
      description: 'Input hemoglobin, Vitamin D, or Serum B12 laboratory biomarkers',
      tab: 'bloodtest',
      isCompleted: Object.values(labs || {}).some(v => v !== null && v !== undefined && Number(v) > 0)
    }
  ];

  const completedCount = steps.filter(s => s.isCompleted).length;
  const percentage = Math.round((completedCount / steps.length) * 100);

  return {
    steps,
    completedCount,
    totalSteps: steps.length,
    percentage
  };
}

/**
 * Returns contextual greeting based on local time.
 */
export function getContextualGreeting(userName = 'User') {
  const hour = new Date().getHours();
  const firstName = userName ? userName.split(' ')[0] : 'User';
  let greeting = 'Good day';
  if (hour < 12) greeting = 'Good morning';
  else if (hour < 17) greeting = 'Good afternoon';
  else greeting = 'Good evening';

  return `${greeting}, ${firstName}`;
}

/**
 * Formats date for contextual subtitle.
 */
export function getFormattedDate(dateInput = new Date()) {
  let dateObj = dateInput;
  if (typeof dateInput === 'string') {
    const parts = dateInput.split('T')[0].split('-');
    if (parts.length === 3) {
      dateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    } else {
      dateObj = new Date(dateInput);
    }
  }
  const options = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
  return dateObj.toLocaleDateString('en-US', options);
}
