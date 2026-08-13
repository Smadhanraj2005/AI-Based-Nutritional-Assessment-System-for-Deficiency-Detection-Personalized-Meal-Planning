const API_BASE_URL = '/api';

export async function searchFoods(query) {
  try {
    const res = await fetch(`${API_BASE_URL}/foods/search?q=${encodeURIComponent(query || '')}`);
    if (!res.ok) throw new Error('Failed to search foods');
    return await res.json();
  } catch (err) {
    console.error('API Error (searchFoods):', err);
    return [];
  }
}

export async function runDeficiencyAssessment(payload) {
  try {
    const res = await fetch(`${API_BASE_URL}/assessment/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Assessment request failed');
    return await res.json();
  } catch (err) {
    console.error('API Error (runDeficiencyAssessment):', err);
    throw err;
  }
}

export async function generateMealPlan(payload) {
  try {
    const res = await fetch(`${API_BASE_URL}/meal-plan/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Meal plan generation failed');
    return await res.json();
  } catch (err) {
    console.error('API Error (generateMealPlan):', err);
    throw err;
  }
}

export async function fetchRecipes() {
  try {
    const res = await fetch(`${API_BASE_URL}/recipes`);
    if (!res.ok) throw new Error('Failed to fetch recipes');
    return await res.json();
  } catch (err) {
    console.error('API Error (fetchRecipes):', err);
    return [];
  }
}

export async function fetchLongitudinalProgress() {
  try {
    const res = await fetch(`${API_BASE_URL}/longitudinal-progress`);
    if (!res.ok) throw new Error('Failed to fetch progress');
    return await res.json();
  } catch (err) {
    console.error('API Error (fetchLongitudinalProgress):', err);
    return null;
  }
}

export async function loginUser(email, password) {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) {
    const errData = await res.json();
    throw new Error(errData.detail || 'Login failed');
  }
  return await res.json();
}

export async function registerUser(payload) {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const errData = await res.json();
    throw new Error(errData.detail || 'Registration failed');
  }
  return await res.json();
}
