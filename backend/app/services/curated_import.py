import os
import json
import sqlite3
from app.db.database import get_db

def import_curated_foods() -> int:
    """
    Ensures curated regional Indian foods and common household dishes from food_database.json are imported into food_items.
    """
    json_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "food_database.json")
    if not os.path.exists(json_path):
        print(f"food_database.json not found at {json_path}")
        return 0

    with open(json_path, "r", encoding="utf-8") as f:
        foods = json.load(f)

    imported_count = 0
    with get_db() as conn:
        cursor = conn.cursor()
        for food in foods:
            name = food.get("name")
            if not name:
                continue
            cursor.execute("SELECT id FROM food_items WHERE name = ?", (name,))
            if cursor.fetchone():
                continue

            category = food.get("category", "Curated Indian")
            tags = json.dumps(["curated", "indian", category.lower()])
            calories = food.get("calories", 0)
            protein = food.get("protein_g", 0)
            iron = food.get("iron_mg", 0)
            calcium = food.get("calcium_mg", 0)
            vit_d_iu = food.get("vitamin_d_iu", 0)
            vit_d_mcg = vit_d_iu / 40.0
            vit_b12 = food.get("vitamin_b12_mcg", 0)
            folate = food.get("folate_mcg", 0)
            vit_a_iu = food.get("vitamin_a_iu", 0)
            vit_a_mcg = vit_a_iu / 3.33
            vit_c = food.get("vitamin_c_mg", 0)
            magnesium = food.get("magnesium_mg", 0)
            zinc = food.get("zinc_mg", 0)

            cursor.execute(
                """
                INSERT INTO food_items 
                (name, tags, calories_kcal, protein_g, iron_mg, calcium_mg, vitamin_d_mcg, vitamin_b12_mcg, 
                 folate_mcg, vitamin_a_mcg, vitamin_c_mg, magnesium_mg, zinc_mg, is_vegetarian, is_vegan, data_type)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, 'curated')
                """,
                (name, tags, calories, protein, iron, calcium, vit_d_mcg, vit_b12, folate, vit_a_mcg, vit_c, magnesium, zinc)
            )
            imported_count += 1

        cursor.execute("SELECT COUNT(*) FROM food_items WHERE data_type = 'curated'")
        total = cursor.fetchone()[0]
        print(f"Curated Indian food items in database: {total} (New imported: {imported_count})")
        return total
