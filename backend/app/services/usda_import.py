import os
import json
import csv
import sqlite3
from typing import Optional
from app.db.database import get_db

USDA_RAW_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data", "usda_raw")

def import_foods(include_branded: bool = False, limit: Optional[int] = None, replace: bool = True) -> int:
    """
    Imports USDA FoodData Central raw CSV dataset into SQLite food_items table if raw CSV files exist.
    """
    food_csv = os.path.join(USDA_RAW_DIR, "food.csv")
    nutrient_csv = os.path.join(USDA_RAW_DIR, "food_nutrient.csv")
    
    if not os.path.exists(food_csv):
        print(f"USDA raw CSV directory ({USDA_RAW_DIR}) does not contain food.csv. Run scripts/download_usda.sh first.")
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM food_items WHERE data_type IN ('sr_legacy_food', 'foundation_food')")
            existing = cursor.fetchone()[0]
            print(f"Existing USDA food items in nutrisense.db: {existing}")
            return existing

    print("Parsing USDA CSVs for ingestion into nutrisense.db...")
    # Read food items from CSV
    imported_count = 0
    with get_db() as conn:
        cursor = conn.cursor()
        if replace:
            cursor.execute("DELETE FROM food_items WHERE data_type IN ('sr_legacy_food', 'foundation_food')")
        
        with open(food_csv, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                if limit and imported_count >= limit:
                    break
                fdc_id = row.get("fdc_id")
                description = row.get("description", "")
                data_type = row.get("data_type", "sr_legacy_food")
                if not include_branded and data_type == "branded_food":
                    continue
                
                cursor.execute(
                    """
                    INSERT INTO food_items 
                    (name, tags, calories_kcal, protein_g, iron_mg, calcium_mg, vitamin_d_mcg, vitamin_b12_mcg, 
                     folate_mcg, vitamin_a_mcg, vitamin_c_mg, magnesium_mg, zinc_mg, is_vegetarian, is_vegan, fdc_id, data_type)
                    VALUES (?, ?, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, ?, ?)
                    """,
                    (description, json.dumps([data_type]), fdc_id, data_type)
                )
                imported_count += 1
                
    print(f"Successfully imported {imported_count} USDA foods.")
    return imported_count
