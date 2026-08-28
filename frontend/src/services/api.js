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

export async function runDeficiencyAssessment(payload, userId = 1) {
  const url = `${API_BASE_URL}/assess?user_id=${userId}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    let errDetail = 'Assessment request failed';
    try {
      const errJson = await res.json();
      if (Array.isArray(errJson.detail)) {
        errDetail = errJson.detail.map(d => `${d.loc.join(' -> ')}: ${d.msg}`).join(' | ');
      } else {
        errDetail = errJson.detail || errDetail;
      }
    } catch (_) {}
    throw new Error(errDetail);
  }
  return await res.json();
}

export async function fetchLatestAssessment(userId = 1) {
  try {
    const res = await fetch(`${API_BASE_URL}/assessment/latest?user_id=${userId}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('API Error (fetchLatestAssessment):', err);
    return null;
  }
}

export async function fetchRecommendations(assessmentId, userId = 1) {
  try {
    const params = new URLSearchParams({ user_id: userId });
    if (assessmentId) params.append('assessment_id', assessmentId);
    const res = await fetch(`${API_BASE_URL}/recommendations?${params.toString()}`);
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.error('API Error (fetchRecommendations):', err);
    return [];
  }
}

export async function fetchAssessmentHistory(userId = 1) {
  try {
    const res = await fetch(`${API_BASE_URL}/assessment/history?user_id=${userId}`);
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.error('API Error (fetchAssessmentHistory):', err);
    return [];
  }
}

export async function generateMealPlan(payload, userId = 1) {
  try {
    const res = await fetch(`${API_BASE_URL}/meal-plan/generate?user_id=${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Meal plan generation failed');
    return await res.json();
  } catch (err) {
    console.warn('API Warning (generateMealPlan): Falling back to default meal plan simulation.', err);
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
    let message = 'Login failed';
    try {
      const errData = await res.json();
      message = errData.detail || message;
    } catch (_) {
      // Response body was empty or not valid JSON (e.g. backend unreachable)
      message = res.statusText || 'Server is unreachable. Please try again later.';
    }
    throw new Error(message);
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
    let message = 'Registration failed';
    try {
      const errData = await res.json();
      message = errData.detail || message;
    } catch (_) {
      message = res.statusText || 'Server is unreachable. Please try again later.';
    }
    throw new Error(message);
  }
  return await res.json();
}

// ─── Diary CRUD ────────────────────────────────────────
export async function logDiaryEntry(foodId, entryDate, mealType, portionGrams, userId = 1) {
  try {
    const params = new URLSearchParams({
      food_id: foodId,
      entry_date: entryDate,
      meal_type: mealType,
      portion_grams: portionGrams,
      user_id: userId
    });
    const res = await fetch(`${API_BASE_URL}/diary?${params.toString()}`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to log diary entry');
    return await res.json();
  } catch (err) {
    console.error('API Error (logDiaryEntry):', err);
    return null;
  }
}

export async function fetchDiaryEntries(userId = 1, startDate, endDate) {
  try {
    const params = new URLSearchParams({ user_id: userId });
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    const res = await fetch(`${API_BASE_URL}/diary?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch diary entries');
    return await res.json();
  } catch (err) {
    console.error('API Error (fetchDiaryEntries):', err);
    return [];
  }
}

export async function deleteDiaryEntry(entryId, userId = 1) {
  try {
    const res = await fetch(`${API_BASE_URL}/diary/${entryId}?user_id=${userId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete diary entry');
    return await res.json();
  } catch (err) {
    console.error('API Error (deleteDiaryEntry):', err);
    return null;
  }
}

// ─── Symptoms CRUD ─────────────────────────────────────
export async function saveSymptoms(responses, userId = 1) {
  try {
    const params = new URLSearchParams({ user_id: userId });
    const res = await fetch(`${API_BASE_URL}/symptoms?${params.toString()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(responses)
    });
    if (!res.ok) throw new Error('Failed to save symptoms');
    return await res.json();
  } catch (err) {
    console.error('API Error (saveSymptoms):', err);
    return null;
  }
}

export async function fetchSymptoms(userId = 1) {
  try {
    const res = await fetch(`${API_BASE_URL}/symptoms?user_id=${userId}`);
    if (!res.ok) throw new Error('Failed to fetch symptoms');
    return await res.json();
  } catch (err) {
    console.error('API Error (fetchSymptoms):', err);
    return { responses: {} };
  }
}

// ─── Labs CRUD ─────────────────────────────────────────
export async function saveLabs(labValues, userId = 1) {
  try {
    const params = new URLSearchParams({ user_id: userId });
    Object.entries(labValues).forEach(([k, v]) => {
      if (v !== null && v !== undefined && v !== '') params.append(k, v);
    });
    const res = await fetch(`${API_BASE_URL}/labs?${params.toString()}`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to save labs');
    return await res.json();
  } catch (err) {
    console.error('API Error (saveLabs):', err);
    return null;
  }
}

export async function fetchLabs(userId = 1) {
  try {
    const res = await fetch(`${API_BASE_URL}/labs?user_id=${userId}`);
    if (!res.ok) throw new Error('Failed to fetch labs');
    return await res.json();
  } catch (err) {
    console.error('API Error (fetchLabs):', err);
    return {};
  }
}

export async function saveProfile(payload, userId = 1) {
  const res = await fetch(`${API_BASE_URL}/profile?user_id=${userId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    let errDetail = 'Failed to save profile';
    try {
      const errJson = await res.json();
      errDetail = errJson.detail || errDetail;
    } catch (_) {}
    throw new Error(errDetail);
  }
  return await res.json();
}

export async function fetchProfile(userId = 1) {
  try {
    const res = await fetch(`${API_BASE_URL}/profile?user_id=${userId}`);
    if (!res.ok) throw new Error('Failed to fetch profile');
    return await res.json();
  } catch (err) {
    console.error('API Error (fetchProfile):', err);
    return null;
  }
}


