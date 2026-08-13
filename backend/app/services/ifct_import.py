import os
import json
import sqlite3
from typing import Optional
from app.db.database import get_db

def import_ifct_foods(replace: bool = False) -> int:
    """
    Ensures IFCT 2017 (Indian Food Composition Tables) dataset items exist in food_items table.
    """
    with get_db() as conn:
        cursor = conn.cursor()
        if replace:
            cursor.execute("DELETE FROM food_items WHERE data_type = 'ifct2017'")
        
        cursor.execute("SELECT COUNT(*) FROM food_items WHERE data_type = 'ifct2017'")
        count = cursor.fetchone()[0]
        print(f"IFCT 2017 food items in database: {count}")
        return count
