import React, { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Utensils, Zap, Calendar, Sunrise, Sun, Moon, Apple, Lightbulb } from 'lucide-react';
import { searchFoods, logDiaryEntry, deleteDiaryEntry } from '../services/api';
import { getTodayStr } from '../services/nutritionHelper';

export default function DietaryDiary({ loggedFoods, setLoggedFoods, currentUser }) {
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

  const handleAddFood = async (food) => {
    if (isFutureDate) {
      setNotification('Cannot log food for future dates.');
      setTimeout(() => setNotification(''), 3000);
      return;
    }

    if (!food || !food.id) {
      setNotification('Invalid food item.');
      setTimeout(() => setNotification(''), 3000);
      return;
    }

    const portion = Number(selectedServing);
    if (isNaN(portion) || portion <= 0) {
      setNotification('Please enter a valid portion size greater than 0.');
      setTimeout(() => setNotification(''), 3000);
      return;
    }

    const userId = currentUser?.id || 1;

    try {
      const response = await logDiaryEntry(food.id, selectedDate, selectedMeal, portion, userId);
      if (response && response.status === 'ok') {
        const scale = portion / 100;
        const newItem = {
          id: response.id,
          user_id: userId,
          food_id: String(food.id),
          food_name: food.name,
          serving_g: portion,
          meal_type: selectedMeal,
          calories: Math.round((food.calories || food.calories_kcal || 0) * scale),
          protein_g: ((food.protein_g || 0) * scale).toFixed(1),
          carbs_g: ((food.carbs_g !== undefined ? food.carbs_g : Math.max(0, ((food.calories || 0) * 0.55) / 4)) * scale).toFixed(1),
          fat_g: ((food.fat_g !== undefined ? food.fat_g : Math.max(0, ((food.calories || 0) * 0.25) / 9)) * scale).toFixed(1),
          fiber_g: ((food.fiber_g || 0) * scale).toFixed(1),
          iron_mg: ((food.iron_mg || 0) * scale).toFixed(2),
          vitamin_d_iu: Math.round((food.vitamin_d_iu || (food.vitamin_d_mcg ? food.vitamin_d_mcg * 40 : 0)) * scale),
          vitamin_d_mcg: Number(((food.vitamin_d_mcg || (food.vitamin_d_iu ? food.vitamin_d_iu / 40 : 0)) * scale).toFixed(2)),
          vitamin_b12_mcg: ((food.vitamin_b12_mcg || 0) * scale).toFixed(2),
          calcium_mg: Math.round((food.calcium_mg || 0) * scale),
          vitamin_c_mg: Number(((food.vitamin_c_mg || 0) * scale).toFixed(1)),
          zinc_mg: Number(((food.zinc_mg || 0) * scale).toFixed(1)),
          magnesium_mg: Math.round((food.magnesium_mg || 0) * scale),
          folate_mcg: Math.round((food.folate_mcg || 0) * scale),
          date: selectedDate,
        };

        setLoggedFoods([...loggedFoods, newItem]);
        setNotification('Meal logged.');
        setTimeout(() => setNotification(''), 3000);
      } else {
        setNotification('Failed to save meal. Please try again.');
        setTimeout(() => setNotification(''), 3000);
      }
    } catch (err) {
      console.error('Error logging diary entry:', err);
      setNotification('Failed to save meal. Please try again.');
      setTimeout(() => setNotification(''), 3000);
    }
  };

  const handleRemoveFood = async (itemToRemove) => {
    if (!itemToRemove || !itemToRemove.id) {
      setNotification('Invalid item.');
      setTimeout(() => setNotification(''), 3000);
      return;
    }
    const userId = currentUser?.id || 1;
    try {
      const response = await deleteDiaryEntry(itemToRemove.id, userId);
      if (response && response.status === 'deleted') {
        setLoggedFoods(loggedFoods.filter(item => item.id !== itemToRemove.id));
      } else {
        setNotification('Failed to delete meal. Please try again.');
        setTimeout(() => setNotification(''), 3000);
      }
    } catch (err) {
      console.error('Error deleting diary entry:', err);
      setNotification('Failed to delete meal. Please try again.');
      setTimeout(() => setNotification(''), 3000);
    }
  };

  // Filter foods for the currently selected date (Future dates will automatically have 0 items)
  const displayFoods = loggedFoods.filter(item => item.date === selectedDate);

  // Compute stats for current selected date
  const totalCals = displayFoods.reduce((acc, f) => acc + (f.calories || 0), 0);
  const totalProtein = displayFoods.reduce((acc, f) => acc + Number(f.protein_g || 0), 0);
  const totalIron = displayFoods.reduce((acc, f) => acc + Number(f.iron_mg || 0), 0);
  const totalCalcium = displayFoods.reduce((acc, f) => acc + Number(f.calcium_mg || 0), 0);
  const totalVitD = displayFoods.reduce((acc, f) => acc + Number(f.vitamin_d_iu || 0), 0);
  const totalVitB12 = displayFoods.reduce((acc, f) => acc + Number(f.vitamin_b12_mcg || 0), 0);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24 }}>

      {/* Left Column: Nutrients Overview & Log Meal */}
      <div>
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ color: 'var(--text-main)', fontSize: '1.5rem', margin: 0 }}>Dietary Diary</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 4 }}>
            Selected Date: <strong style={{ color: '#6366f1' }}>{selectedDate}</strong> {isToday ? '(Today)' : isFutureDate ? '(Future Date)' : '(Past Date)'}
          </p>
        </div>

        {/* Nutrient Intake Overview */}
        <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, gap: 16, flexWrap: 'wrap' }}>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)', margin: 0 }}>
              Nutrient Intake Overview
            </h3>

          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 20 }}>
            {/* Iron */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 6 }}>
                <span style={{ color: 'var(--text-muted)' }}>Iron (RDA: 18 mg)</span>
                <strong style={{ color: 'var(--text-main)' }}>{totalIron.toFixed(1)} mg ({Math.min(100, Math.round((totalIron / 18) * 100))}%)</strong>
              </div>
              <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(100, (totalIron / 18) * 100)}%`, background: '#ef4444', transition: 'width 0.3s ease' }} />
              </div>
            </div>

            {/* Calcium */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 6 }}>
                <span style={{ color: 'var(--text-muted)' }}>Calcium (RDA: 1000 mg)</span>
                <strong style={{ color: 'var(--text-main)' }}>{totalCalcium.toFixed(1)} mg ({Math.min(100, Math.round((totalCalcium / 1000) * 100))}%)</strong>
              </div>
              <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(100, (totalCalcium / 1000) * 100)}%`, background: '#3b82f6', transition: 'width 0.3s ease' }} />
              </div>
            </div>

            {/* Vit D */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 6 }}>
                <span style={{ color: 'var(--text-muted)' }}>Vitamin D (RDA: 600 IU)</span>
                <strong style={{ color: 'var(--text-main)' }}>{totalVitD.toFixed(0)} IU ({Math.min(100, Math.round((totalVitD / 600) * 100))}%)</strong>
              </div>
              <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(100, (totalVitD / 600) * 100)}%`, background: '#f59e0b', transition: 'width 0.3s ease' }} />
              </div>
            </div>

            {/* Vit B12 */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 6 }}>
                <span style={{ color: 'var(--text-muted)' }}>Vitamin B12 (RDA: 2.4 mcg)</span>
                <strong style={{ color: 'var(--text-main)' }}>{totalVitB12.toFixed(1)} mcg ({Math.min(100, Math.round((totalVitB12 / 2.4) * 100))}%)</strong>
              </div>
              <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(100, (totalVitB12 / 2.4) * 100)}%`, background: '#10b981', transition: 'width 0.3s ease' }} />
              </div>
            </div>

            {/* Protein */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 6 }}>
                <span style={{ color: 'var(--text-muted)' }}>Protein (RDA: 56 g)</span>
                <strong style={{ color: 'var(--text-main)' }}>{totalProtein.toFixed(1)} g ({Math.min(100, Math.round((totalProtein / 56) * 100))}%)</strong>
              </div>
              <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(100, (totalProtein / 56) * 100)}%`, background: '#6366f1', transition: 'width 0.3s ease' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Log Meal / Search Header */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Utensils size={24} color="var(--primary)" />
              <h2 style={{ fontSize: '1.25rem', color: 'var(--text-main)', margin: 0 }}>Log Meal</h2>
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
                  style={{ padding: '8px 10px', fontSize: '0.85rem', width: 145, color: 'var(--text-main)', cursor: 'pointer' }}
                />
              </div>
            </div>

            {/* Meal type selector */}
            <select className="form-select" value={selectedMeal} onChange={(e) => setSelectedMeal(e.target.value)} style={{ width: 135 }}>
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
          <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12, maxHeight: 160, overflowY: 'auto', paddingRight: 4 }}>
            {searchResults.map(food => (
              <div key={food.id} className="glass-card" style={{ padding: 14, background: 'rgba(15, 23, 42, 0.4)', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ fontSize: '0.92rem', color: 'var(--text-main)', margin: 0 }}>{food.name}</h4>
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


      </div>

      {/* Right Column: Logged Daily Meals for Selected Date */}
      <div className="glass-card" style={{ padding: 24, height: 'fit-content' }}>
        <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Entries on {selectedDate} ({displayFoods.length} items)</span>
          <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>Total: {totalCals} kcal</span>
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            { type: 'Breakfast', icon: <Sunrise size={18} color="#f59e0b" /> },
            { type: 'Lunch', icon: <Sun size={18} color="#eab308" /> },
            { type: 'Dinner', icon: <Moon size={18} color="#818cf8" /> },
            { type: 'Snack', icon: <Apple size={18} color="#10b981" /> },
          ].map(({ type, icon }) => {
            const mealFoods = displayFoods.filter(
              (item) => (item.meal_type || '').toLowerCase() === type.toLowerCase()
            );
            const mealCals = mealFoods.reduce((acc, f) => acc + (f.calories || 0), 0);

            return (
              <div
                key={type}
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: 12,
                  padding: 16,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: mealFoods.length > 0 ? 12 : 0,
                  }}
                >
                  <span style={{ fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    {icon} {type}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {mealCals} kcal
                  </span>
                </div>

                {mealFoods.length === 0 ? (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    No items logged for {type.toLowerCase()}
                  </span>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {mealFoods.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '8px 12px',
                          background: 'rgba(0,0,0,0.2)',
                          borderRadius: 8,
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
                          <strong style={{ fontSize: '0.85rem', color: '#fff', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.food_name || item.name}
                          </strong>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {item.serving_g}g · {item.calories} kcal
                          </span>
                        </div>
                        <button
                          onClick={() => handleRemoveFood(item)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--danger)',
                            cursor: 'pointer',
                            padding: 4,
                            flexShrink: 0
                          }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
