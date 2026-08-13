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
            cursor.execute("SELECT * FROM food_items ORDER BY name ASC LIMIT ?", (limit,))
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
                        WHEN data_type IN ('ifct2017','curated')           THEN 1
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
            # Normalize field names to match schema expectations
            d["category"] = d.get("data_type", "food")
            d["tags"] = json.loads(d["tags"]) if isinstance(d["tags"], str) and d["tags"].startswith("[") else [d.get("data_type", "")]
            result.append(d)
        return result

def get_food_by_id(food_id: int) -> Optional[Dict[str, Any]]:
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
