import React, { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Utensils, Zap, Calendar } from 'lucide-react';
import { searchFoods } from '../services/api';

export default function DietaryDiary({ loggedFoods, setLoggedFoods }) {
  const getTodayStr = () => new Date().toISOString().split('T')[0];

  const [selectedDate, setSelectedDate] = useState(getTodayStr());
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedServing, setSelectedServing] = useState(100);
  const [selectedMeal, setSelectedMeal] = useState('Breakfast');
  const [notification, setNotification] = useState('');

  const todayStr = getTodayStr();
  const isFutureDate = selectedDate > todayStr;
  const isToday = selectedDate === todayStr;

  useEffect(() => {
    handleSearch('');
  }, []);

  const handleSearch = async (term) => {
    setQuery(term);
    const results = await searchFoods(term);
    setSearchResults(results);
  };

  const handleAddFood = (food) => {
    if (isFutureDate) {
      setNotification('Cannot log food for future dates.');
      setTimeout(() => setNotification(''), 3000);
      return;
    }

    const newItem = {
      food_id: food.id,
      food_name: food.name,
      serving_g: Number(selectedServing),
      meal_type: selectedMeal,
      calories: Math.round((food.calories * selectedServing) / 100),
      protein_g: ((food.protein_g * selectedServing) / 100).toFixed(1),
      iron_mg: ((food.iron_mg * selectedServing) / 100).toFixed(2),
      vitamin_d_iu: Math.round((food.vitamin_d_iu * selectedServing) / 100),
      vitamin_b12_mcg: ((food.vitamin_b12_mcg * selectedServing) / 100).toFixed(2),
      calcium_mg: Math.round((food.calcium_mg * selectedServing) / 100),
      date: selectedDate,
    };

    setLoggedFoods([...loggedFoods, newItem]);
    setNotification('Meal logged.');
    setTimeout(() => setNotification(''), 3000);
  };

  const handleRemoveFood = (itemToRemove) => {
    setLoggedFoods(loggedFoods.filter(item => item !== itemToRemove));
  };

  // Filter foods for the currently selected date (Future dates will automatically have 0 items)
  const displayFoods = loggedFoods.filter(item => item.date === selectedDate);

  // Compute stats for current selected date
  const totalCals = displayFoods.reduce((acc, f) => acc + (f.calories || 0), 0);
  const totalProtein = displayFoods.reduce((acc, f) => acc + Number(f.protein_g || 0), 0);
  const totalIron = displayFoods.reduce((acc, f) => acc + Number(f.iron_mg || 0), 0);
  const totalVitD = displayFoods.reduce((acc, f) => acc + Number(f.vitamin_d_iu || 0), 0);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24 }}>

      {/* Left Column: Search & Logged Diary */}
      <div>
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ color: '#fff', fontSize: '1.5rem', margin: 0 }}>Dietary Diary</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 4 }}>
            Selected Date: <strong style={{ color: '#6366f1' }}>{selectedDate}</strong> {isToday ? '(Today)' : isFutureDate ? '(Future Date)' : '(Past Date)'}
          </p>
        </div>

        {/* Log Meal / Search Header */}
        <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Utensils size={24} color="var(--primary)" />
              <h2 style={{ fontSize: '1.25rem', color: '#fff', margin: 0 }}>Log Meal</h2>
            </div>
            {notification && (
              <span style={{ fontSize: '0.85rem', color: '#10b981', background: 'rgba(16, 185, 129, 0.15)', padding: '4px 12px', borderRadius: 6, border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                {notification}
              </span>
            )}
          </div>

          {/* Search bar + Date picker & serving controls */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
              <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: 14, top: 14 }} />
              <input
                className="form-input"
                style={{ paddingLeft: 42 }}
                type="text"
                placeholder="Search food items (e.g. Spinach, Eggs, Yogurt)..."
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>

            {/* Date Field placed on right side of search food items bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Calendar size={18} color="var(--primary)" />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <input
                  type="date"
                  className="form-input"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  style={{ padding: '8px 10px', fontSize: '0.85rem', width: 145, color: '#fff', cursor: 'pointer' }}
                />
              </div>
            </div>

            {/* Meal type selector */}
            <select className="form-select" value={selectedMeal} onChange={(e) => setSelectedMeal(e.target.value)} style={{ width: 120 }}>
              <option value="Breakfast">Breakfast</option>
              <option value="Lunch">Lunch</option>
              <option value="Dinner">Dinner</option>
              <option value="Snack">Snack</option>
            </select>

            {/* Serving size input */}
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <input
                className="form-input"
                type="number"
                value={selectedServing}
                onChange={(e) => setSelectedServing(e.target.value)}
                style={{ width: 75 }}
                placeholder="Grams"
              />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>g</span>
            </div>
          </div>

          {/* Search Results List */}
          <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12, maxHeight: 280, overflowY: 'auto', paddingRight: 4 }}>
            {searchResults.map(food => (
              <div key={food.id} className="glass-card" style={{ padding: 14, background: 'rgba(15, 23, 42, 0.4)', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ fontSize: '0.92rem', color: '#fff', margin: 0 }}>{food.name}</h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{food.category} • {food.calories} kcal / 100g</span>
                  <div style={{ fontSize: '0.72rem', color: 'var(--primary)', marginTop: 2 }}>
                    Iron: {food.iron_mg}mg | Vit D: {food.vitamin_d_iu}IU | B12: {food.vitamin_b12_mcg}mcg
                  </div>
                </div>
                <button
                  className="btn-primary"
                  style={{ padding: '6px 12px', fontSize: '0.8rem', opacity: isFutureDate ? 0.5 : 1, cursor: isFutureDate ? 'not-allowed' : 'pointer' }}
                  onClick={() => handleAddFood(food)}
                  title={isFutureDate ? 'Cannot add food to future dates' : 'Add food to diary'}
                >
                  <Plus size={14} /> Add
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Logged Daily Meals for Selected Date */}
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Entries on {selectedDate} ({displayFoods.length} items)</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--primary)' }}>Total Energy: {totalCals} kcal</span>
          </h3>

          {displayFoods.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
              <Utensils size={36} style={{ opacity: 0.3, marginBottom: 12 }} />
              <p>
                {isFutureDate
                  ? `Future date selected (${selectedDate}). Diary entries for future dates are empty.`
                  : `No meals logged for ${selectedDate} yet. Use the search bar above to log your daily food entries!`}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {displayFoods.map((item, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: 10
                }}>
                  <div>
                    <span className="badge badge-success" style={{ marginRight: 8, textTransform: 'lowercase' }}>{item.meal_type}</span>
                    <strong style={{ color: '#fff', fontSize: '0.95rem' }}>{item.food_name}</strong>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginLeft: 8 }}>({item.serving_g}g)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{item.calories} kcal</span>
                    <span style={{ fontSize: '0.82rem', color: '#10b981' }}>Fe {item.iron_mg}mg</span>
                    <button onClick={() => handleRemoveFood(item)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.7 }} title="Remove item">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Live RDA Summary Widget */}
      <div className="glass-card" style={{ padding: 24, height: 'fit-content' }}>
        <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Zap size={20} color="var(--warning)" /> Daily RDA Progress ({selectedDate})
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Iron */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 6 }}>
              <span style={{ color: 'var(--text-muted)' }}>Iron (RDA: 18 mg)</span>
              <strong style={{ color: '#fff' }}>{totalIron.toFixed(1)} mg ({Math.min(100, Math.round((totalIron / 18) * 100))}%)</strong>
            </div>
            <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.min(100, (totalIron / 18) * 100)}%`, background: totalIron < 9 ? '#ef4444' : '#10b981', transition: 'width 0.3s ease' }} />
            </div>
          </div>

          {/* Vitamin D */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 6 }}>
              <span style={{ color: 'var(--text-muted)' }}>Vitamin D (RDA: 600 IU)</span>
              <strong style={{ color: '#fff' }}>{totalVitD} IU ({Math.min(100, Math.round((totalVitD / 600) * 100))}%)</strong>
            </div>
            <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.min(100, (totalVitD / 600) * 100)}%`, background: totalVitD < 300 ? '#ef4444' : '#10b981', transition: 'width 0.3s ease' }} />
            </div>
          </div>

          {/* Protein */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 6 }}>
              <span style={{ color: 'var(--text-muted)' }}>Protein (RDA: 56 g)</span>
              <strong style={{ color: '#fff' }}>{totalProtein.toFixed(1)} g ({Math.min(100, Math.round((totalProtein / 56) * 100))}%)</strong>
            </div>
            <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.min(100, (totalProtein / 56) * 100)}%`, background: '#6366f1', transition: 'width 0.3s ease' }} />
            </div>
          </div>
        </div>

        <div style={{ marginTop: 24, padding: 14, background: 'rgba(59, 130, 246, 0.1)', borderRadius: 10, border: '1px solid rgba(59, 130, 246, 0.2)', fontSize: '0.8rem', color: '#93c5fd' }}>
          💡 Logged food items populate real-time macro & micronutrient intake percentages directly into the ML Deficiency Classifier.
        </div>
      </div>

    </div>
  );
}
