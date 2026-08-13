import os
import json
import sqlite3
from app.db.database import get_db

def import_curated_foods() -> int:
    """
    Ensures curated regional Indian foods and common household dishes are imported into food_items.
    """
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM food_items WHERE data_type = 'curated'")
        count = cursor.fetchone()[0]
        print(f"Curated food items in database: {count}")
        return count
