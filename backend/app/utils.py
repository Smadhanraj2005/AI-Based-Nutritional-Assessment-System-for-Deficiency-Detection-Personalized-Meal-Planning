import re
import json

USDA_SKIP_KEYWORDS = [
    "babyfood", "baby food", "candies", "candy", "snacks", "snack", 
    "pie", "pies", "puddings", "pudding", "salad dressing", 
    "refrigerated dough", "food distribution program", "artificial flavor", 
    "beverage", "beverages", "formulated bar", "infant formula"
]

def is_usda_noise(food_name: str) -> bool:
    """
    Returns True if the food name matches USDA noise categories (babyfood, candies, snacks, etc.).
    Per NutriSense PDF specification (Section 4).
    """
    if not food_name:
        return False
    name_lower = food_name.lower().strip()
    return any(kw in name_lower for kw in USDA_SKIP_KEYWORDS)

def food_to_schema(food_row: dict, nutrient_key: str = None, nutrient_col: str = None, label: str = "", unit: str = "") -> dict:
    """
    Formats a raw food_items DB row into the standard API FoodOut schema per Section 3 & 4 of PDF.
    
    Catalog preference sort rank (Section 4):
    - 0: curated (data/seed_foods.json - familiar Indian names)
    - 1: ifct2017 (IFCT 2017 ~542 Indian foods, NIN Hyderabad)
    - 2: anything else (USDA FoodData Central fallback)
    """
    if not food_row:
        return {}
    
    tags = food_row.get("tags", [])
    if isinstance(tags, str) and tags.startswith("["):
        try:
            tags = json.loads(tags)
        except Exception:
            tags = [tags]
    elif not isinstance(tags, list):
        tags = [str(tags)] if tags else []

    # Section 4 catalog preference rank calculation
    data_type = str(food_row.get("data_type", "")).lower().strip()
    if data_type == "curated":
        source_priority = 0
    elif data_type == "ifct2017":
        source_priority = 1
    else:
        source_priority = food_row.get("source_priority") if food_row.get("source_priority") is not None else 2

    amount_val = 0.0
    if nutrient_col and nutrient_col in food_row and food_row[nutrient_col] is not None:
        amount_val = float(food_row[nutrient_col])

    # Format amount value nicely (e.g. 975 instead of 975.0, 8.5 instead of 8.50)
    formatted_amount = int(amount_val) if (isinstance(amount_val, float) and amount_val.is_integer()) else round(amount_val, 1)

    # Build UI label example string matching Section 3 table (e.g., "Fe 8.5", "Ca 975", "B12 0", "Protein 21g")
    ui_label = f"{label} {formatted_amount}" if label else f"{formatted_amount} {unit}".strip()
    if label == "Protein":
        ui_label = f"Protein {formatted_amount}g"

    display_name = food_row.get("name", "")
    
    return {
        "id": food_row.get("id"),
        "name": display_name,
        "display_name": display_name,
        "data_type": data_type or "curated",
        "source_priority": source_priority,
        "nutrient_key": nutrient_key,
        "nutrient_column": nutrient_col,
        "amount": formatted_amount,
        "unit": unit,
        "label": label,
        "ui_label": ui_label,
        "calories_kcal": food_row.get("calories_kcal", 0),
        "protein_g": food_row.get("protein_g", 0),
        "iron_mg": food_row.get("iron_mg", 0),
        "calcium_mg": food_row.get("calcium_mg", 0),
        "vitamin_d_mcg": food_row.get("vitamin_d_mcg", 0),
        "vitamin_b12_mcg": food_row.get("vitamin_b12_mcg", 0),
        "folate_mcg": food_row.get("folate_mcg", 0),
        "vitamin_a_mcg": food_row.get("vitamin_a_mcg", 0),
        "vitamin_c_mg": food_row.get("vitamin_c_mg", 0),
        "magnesium_mg": food_row.get("magnesium_mg", 0),
        "zinc_mg": food_row.get("zinc_mg", 0),
        "is_vegan": bool(food_row.get("is_vegan", 0)),
        "is_vegetarian": bool(food_row.get("is_vegetarian", 0)),
        "tags": tags
    }
