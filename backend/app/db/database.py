import os
import json
import sqlite3
from typing import List, Dict, Any, Optional
from contextlib import contextmanager

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data", "nutrisense.db")

@contextmanager
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def search_food_items(query: Optional[str] = None, limit: int = 100) -> List[Dict[str, Any]]:
    with get_db() as conn:
        cursor = conn.cursor()
        if not query:
            cursor.execute(
                """
                SELECT * FROM food_items 
                ORDER BY 
                    CASE WHEN data_type IN ('curated', 'ifct2017') THEN 0 ELSE 1 END,
                    name ASC 
                LIMIT ?
                """, 
                (limit,)
            )
        else:
            q = query.strip()
            exact_start   = f"{q}%"          # name starts with query
            word_boundary = f"% {q}%"        # word boundary (space before)
            pattern       = f"%{q}%"         # fallback substring

            cursor.execute(
                """
                SELECT * FROM food_items
                WHERE name LIKE ? OR name LIKE ? OR name LIKE ?
                ORDER BY
                    CASE
                        WHEN LOWER(name) LIKE LOWER(?)                    THEN 0
                        WHEN data_type IN ('curated','ifct2017')           THEN 1
                        WHEN LOWER(name) LIKE LOWER(?)                    THEN 2
                        ELSE                                                   3
                    END,
                    name ASC
                LIMIT ?
                """,
                (exact_start, word_boundary, pattern,
                 exact_start, word_boundary,
                 limit)
            )
        rows = cursor.fetchall()
        result = []
        for r in rows:
            d = dict(r)
            # Normalize field names to match schema & frontend expectations
            d["category"] = d.get("category") or d.get("data_type", "food")
            d["calories"] = d.get("calories") if d.get("calories") is not None else d.get("calories_kcal", 0)
            d["calories_kcal"] = d["calories"]
            d["protein_g"] = d.get("protein_g", 0)
            d["iron_mg"] = d.get("iron_mg", 0)
            d["calcium_mg"] = d.get("calcium_mg", 0)
            d["vitamin_d_iu"] = d.get("vitamin_d_iu", int(d.get("vitamin_d_mcg", 0) * 40))
            d["vitamin_b12_mcg"] = d.get("vitamin_b12_mcg", 0)
            d["tags"] = json.loads(d["tags"]) if isinstance(d["tags"], str) and d["tags"].startswith("[") else [d.get("data_type", "")]
            result.append(d)
        return result

def get_food_by_id(food_id: str) -> Optional[Dict[str, Any]]:
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM food_items WHERE id = ?", (food_id,))
        row = cursor.fetchone()
        if row:
            d = dict(row)
            d["category"] = d.get("data_type", "food")
            d["tags"] = json.loads(d["tags"]) if isinstance(d["tags"], str) and d["tags"].startswith("[") else [d.get("data_type", "")]
            return d
        return None

def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE LOWER(email) = LOWER(?)", (email.strip(),))
        row = cursor.fetchone()
        return dict(row) if row else None

def get_user_by_id(user_id: int) -> Optional[Dict[str, Any]]:
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        row = cursor.fetchone()
        return dict(row) if row else None

def create_user(email: str, password_hash: str, full_name: str) -> Dict[str, Any]:
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO users (email, password_hash, full_name, created_at) VALUES (?, ?, ?, datetime('now'))",
            (email.lower().strip(), password_hash, full_name)
        )
        user_id = cursor.lastrowid
        return {"id": user_id, "email": email.lower().strip(), "full_name": full_name}

def get_health_profile(user_id: int) -> Optional[Dict[str, Any]]:
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM health_profiles WHERE user_id = ?", (user_id,))
        row = cursor.fetchone()
        if row:
            d = dict(row)
            d["diet_restrictions"] = json.loads(d["diet_restrictions"]) if d["diet_restrictions"].startswith("[") else []
            d["conditions"] = json.loads(d["conditions"]) if d["conditions"].startswith("[") else []
            return d
        return None

def upsert_health_profile(user_id: int, age: int, gender: int, height: float, weight: float, activity: str, goal: str, diet: List[str], conds: List[str]):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO health_profiles (user_id, age_years, gender, height_cm, weight_kg, activity_level, health_goal, diet_restrictions, conditions)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET
                age_years=excluded.age_years, gender=excluded.gender, height_cm=excluded.height_cm,
                weight_kg=excluded.weight_kg, activity_level=excluded.activity_level, health_goal=excluded.health_goal,
                diet_restrictions=excluded.diet_restrictions, conditions=excluded.conditions
            """,
            (user_id, age, gender, height, weight, activity, goal, json.dumps(diet), json.dumps(conds))
        )

def get_progress_snapshots(user_id: int) -> List[Dict[str, Any]]:
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM progress_snapshots WHERE user_id = ? ORDER BY created_at ASC", (user_id,))
        return [dict(r) for r in cursor.fetchall()]

def add_diary_entry(user_id: int, entry_date: str, meal_type: str, food_id: str, portion_grams: float) -> Dict[str, Any]:
    food = get_food_by_id(food_id)
    if not food:
        # Fallback: look up from the JSON food database (Indian foods not in SQLite)
        _json_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "food_database.json")
        try:
            with open(_json_path, "r", encoding="utf-8") as _f:
                _json_foods = json.load(_f)
            food = next((item for item in _json_foods if str(item.get("id")) == str(food_id)), None)
        except Exception:
            food = None
    if not food:
        raise ValueError(f"Food item with id {food_id} not found")

    # Normalize calorie field: JSON uses 'calories', DB uses 'calories_kcal'
    calories_per_100 = food.get("calories_kcal") if food.get("calories_kcal") is not None else food.get("calories", 0.0)
    # Normalize vitamin D: JSON uses 'vitamin_d_iu', DB stores 'vitamin_d_mcg' (1 IU = 0.025 mcg)
    if food.get("vitamin_d_mcg") is not None:
        vitamin_d_mcg_per_100 = food.get("vitamin_d_mcg", 0.0)
    else:
        vitamin_d_mcg_per_100 = (food.get("vitamin_d_iu") or 0.0) * 0.025

    # Scale nutrients by portion size (always stored per 100g)
    scale = portion_grams / 100.0
    calories = (calories_per_100 or 0.0) * scale
    protein = (food.get("protein_g") or 0.0) * scale
    iron = (food.get("iron_mg") or 0.0) * scale
    calcium = (food.get("calcium_mg") or 0.0) * scale
    vitamin_d = vitamin_d_mcg_per_100 * scale
    vitamin_b12 = (food.get("vitamin_b12_mcg") or 0.0) * scale
    folate = (food.get("folate_mcg") or 0.0) * scale
    vitamin_a = (food.get("vitamin_a_mcg") or food.get("vitamin_a_iu", 0.0) or 0.0) * scale
    vitamin_c = (food.get("vitamin_c_mg") or 0.0) * scale
    magnesium = (food.get("magnesium_mg") or 0.0) * scale
    zinc = (food.get("zinc_mg") or 0.0) * scale

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO diary_entries (
                user_id, entry_date, meal_type, food_id, food_name, portion_grams,
                calories_kcal, protein_g, iron_mg, calcium_mg, vitamin_d_mcg,
                vitamin_b12_mcg, folate_mcg, vitamin_a_mcg, vitamin_c_mg,
                magnesium_mg, zinc_mg, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
            """,
            (
                user_id, entry_date, meal_type, food_id, food.get("name"), portion_grams,
                calories, protein, iron, calcium, vitamin_d,
                vitamin_b12, folate, vitamin_a, vitamin_c,
                magnesium, zinc
            )
        )
        entry_id = cursor.lastrowid
        return {"id": entry_id, "food_name": food.get("name")}

def get_diary_entries(user_id: int, start_date: str = None, end_date: str = None) -> List[Dict[str, Any]]:
    with get_db() as conn:
        cursor = conn.cursor()
        if start_date and end_date:
            cursor.execute(
                "SELECT * FROM diary_entries WHERE user_id = ? AND entry_date BETWEEN ? AND ? ORDER BY entry_date ASC, id ASC",
                (user_id, start_date, end_date)
            )
        else:
            cursor.execute(
                "SELECT * FROM diary_entries WHERE user_id = ? ORDER BY entry_date ASC, id ASC",
                (user_id,)
            )
        return [dict(row) for row in cursor.fetchall()]

def delete_diary_entry(user_id: int, entry_id: int):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM diary_entries WHERE id = ? AND user_id = ?", (entry_id, user_id))

def get_symptom_response(user_id: int) -> Optional[Dict[str, Any]]:
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM symptom_responses WHERE user_id = ?", (user_id,))
        row = cursor.fetchone()
        if row:
            d = dict(row)
            d["responses"] = json.loads(d["responses"]) if isinstance(d["responses"], str) else {}
            return d
        return None

def upsert_symptom_response(user_id: int, responses: Dict[str, Any]):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO symptom_responses (user_id, responses, updated_at)
            VALUES (?, ?, datetime('now'))
            ON CONFLICT(user_id) DO UPDATE SET
                responses=excluded.responses, updated_at=excluded.updated_at
            """,
            (user_id, json.dumps(responses))
        )

def get_lab_results(user_id: int) -> Optional[Dict[str, Any]]:
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM lab_results WHERE user_id = ?", (user_id,))
        row = cursor.fetchone()
        return dict(row) if row else None

def upsert_lab_results(user_id: int, hemoglobin_g_dl: float = None, serum_vitamin_d: float = None, ferritin: float = None, vitamin_b12: float = None, calcium: float = None):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO lab_results (user_id, hemoglobin_g_dl, serum_vitamin_d, ferritin, vitamin_b12, calcium, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
            ON CONFLICT(user_id) DO UPDATE SET
                hemoglobin_g_dl=excluded.hemoglobin_g_dl,
                serum_vitamin_d=excluded.serum_vitamin_d,
                ferritin=excluded.ferritin,
                vitamin_b12=excluded.vitamin_b12,
                calcium=excluded.calcium,
                updated_at=excluded.updated_at
            """,
            (user_id, hemoglobin_g_dl, serum_vitamin_d, ferritin, vitamin_b12, calcium)
        )

def save_assessment(user_id: int, diary_days_used: int, features_json: str, risks_json: str, overall_score: float) -> int:
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO assessments (user_id, diary_days_used, features_json, risks_json, overall_score, created_at)
            VALUES (?, ?, ?, ?, ?, datetime('now'))
            """,
            (user_id, diary_days_used, features_json, risks_json, overall_score)
        )
        assessment_id = cursor.lastrowid
        risks = json.loads(risks_json) if isinstance(risks_json, str) else risks_json
        
        iron_risk = 0.0
        vit_d_risk = 0.0
        avg_risk = 0.0
        if isinstance(risks, list):
            for r in risks:
                if r.get("deficiency") == "Iron Deficiency (Anemia)":
                    iron_risk = r.get("probability", 0.0)
                elif r.get("deficiency") == "Vitamin D Deficiency":
                    vit_d_risk = r.get("probability", 0.0)
            avg_risk = sum(r.get("probability", 0.0) for r in risks) / len(risks) if risks else 0.0
        
        cursor.execute(
            """
            INSERT INTO progress_snapshots (user_id, assessment_id, avg_risk, iron_risk, vitamin_d_risk, created_at)
            VALUES (?, ?, ?, ?, ?, datetime('now'))
            """,
            (user_id, assessment_id, avg_risk, iron_risk, vit_d_risk)
        )
        return assessment_id

def get_latest_assessment(user_id: int) -> Optional[Dict[str, Any]]:
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM assessments WHERE user_id = ? ORDER BY id DESC LIMIT 1", (user_id,))
        row = cursor.fetchone()
        return dict(row) if row else None

def save_meal_plan(user_id: int, assessment_id: Optional[int], focus_nutrients: List[str], diet_filter: List[str], plan_json: str) -> int:
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO meal_plans (user_id, assessment_id, focus_nutrients, diet_filter, plan_json, is_active, created_at)
            VALUES (?, ?, ?, ?, ?, 1, datetime('now'))
            """,
            (user_id, assessment_id, json.dumps(focus_nutrients), json.dumps(diet_filter), plan_json)
        )
        return cursor.lastrowid

def get_latest_meal_plan(user_id: int) -> Optional[Dict[str, Any]]:
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM meal_plans WHERE user_id = ? ORDER BY id DESC LIMIT 1", (user_id,))
        row = cursor.fetchone()
        if row:
            d = dict(row)
            d["focus_nutrients"] = json.loads(d["focus_nutrients"]) if d["focus_nutrients"] else []
            d["diet_filter"] = json.loads(d["diet_filter"]) if d["diet_filter"] else []
            d["plan_json"] = json.loads(d["plan_json"]) if d["plan_json"] else []
            return d
        return None

