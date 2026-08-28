import os
import json
import sqlite3
from typing import List, Dict, Any, Optional

from app.db.database import get_db
from app.utils import is_usda_noise, food_to_schema

# ── Step 3: Nutrient to Column & Label Mapping per PDF Spec ──
NUTRIENT_MAPPING = {
    "iron": {"col": "iron_mg", "label": "Fe", "unit": "mg", "full_name": "Iron Deficiency (Anemia)"},
    "calcium": {"col": "calcium_mg", "label": "Ca", "unit": "mg", "full_name": "Calcium Deficiency"},
    "vitamin_b12": {"col": "vitamin_b12_mcg", "label": "B12", "unit": "mcg", "full_name": "Vitamin B12 Deficiency"},
    "folate": {"col": "folate_mcg", "label": "Folate", "unit": "mcg", "full_name": "Folate (Vitamin B9) Deficiency"},
    "vitamin_a": {"col": "vitamin_a_mcg", "label": "Vit A", "unit": "mcg", "full_name": "Vitamin A Deficiency"},
    "vitamin_c": {"col": "vitamin_c_mg", "label": "Vit C", "unit": "mg", "full_name": "Vitamin C Deficiency"},
    "magnesium": {"col": "magnesium_mg", "label": "Mg", "unit": "mg", "full_name": "Magnesium Deficiency"},
    "zinc": {"col": "zinc_mg", "label": "Zn", "unit": "mg", "full_name": "Zinc Deficiency"},
    "vitamin_d": {"col": "vitamin_d_mcg", "label": "Vit D", "unit": "mcg", "full_name": "Vitamin D Deficiency"},
    "protein": {"col": "protein_g", "label": "Protein", "unit": "g", "full_name": "Protein Deficiency"}
}

# Reverse lookup dictionary to map UI/schema names to standard nutrient keys
DEFICIENCY_TO_KEY = {
    "iron deficiency (anemia)": "iron",
    "iron": "iron",
    "calcium deficiency": "calcium",
    "calcium": "calcium",
    "vitamin b12 deficiency": "vitamin_b12",
    "vitamin_b12": "vitamin_b12",
    "folate (vitamin b9) deficiency": "folate",
    "folate": "folate",
    "vitamin a deficiency": "vitamin_a",
    "vitamin_a": "vitamin_a",
    "vitamin c deficiency": "vitamin_c",
    "vitamin_c": "vitamin_c",
    "magnesium deficiency": "magnesium",
    "magnesium": "magnesium",
    "zinc deficiency": "zinc",
    "zinc": "zinc",
    "vitamin d deficiency": "vitamin_d",
    "vitamin_d": "vitamin_d",
    "protein deficiency": "protein",
    "protein": "protein"
}

# ── Step 4: Parse diet settings into boolean flags ──
def diet_flags(diet_restrictions: List[str]) -> Dict[str, bool]:
    """
    Turns user diet_restrictions JSON list into boolean flags per PDF Spec.
    """
    flags = {
        "vegan": False,
        "vegetarian": False,
        "gluten_free": False,
        "dairy_free": False,
        "nut_allergy": False
    }
    if not diet_restrictions:
        return flags

    normalized = [str(r).lower().strip() for r in diet_restrictions if r]
    
    for r in normalized:
        if "vegan" in r:
            flags["vegan"] = True
            flags["vegetarian"] = True
            flags["dairy_free"] = True
        elif any(w in r for w in ["vegetarian", "veg", "pure veg"]):
            flags["vegetarian"] = True
        elif any(w in r for w in ["gluten", "wheat", "celiac"]):
            flags["gluten_free"] = True
        elif any(w in r for w in ["dairy", "lactose", "milk"]):
            flags["dairy_free"] = True
        elif any(w in r for w in ["nut", "peanut"]):
            flags["nut_allergy"] = True

    return flags

# ── Step 5 & 6: Keyword filters & candidate validation ──
GLUTEN_KEYWORDS = [
    "wheat", "gluten", "bread", "atta", "maida", "seitan", "barley", "rye", 
    "pasta", "noodle", "biscuit", "chapati", "roti", "paratha", "semolina", 
    "vermicelli", "bulgur", "cracker"
]

DAIRY_KEYWORDS = [
    "milk", "cheese", "yogurt", "yoghurt", "curd", "dahi", "paneer", "butter", 
    "ghee", "cream", "whey", "casein", "lassi"
]

NUT_KEYWORDS = [
    "almond", "peanut", "cashew", "walnut", "pistachio", "hazelnut", 
    "pecan", "groundnut", "tree nut", "nuts", "nut"
]

NON_VEG_KEYWORDS = [
    "beef", "liver", "chicken", "salmon", "cod", "fish", "meat", "pork", 
    "mutton", "turkey", "sardine", "sardines", "seafood", "shrimp", "prawn", 
    "tuna", "bacon", "lamb", "anchovy", "crab", "lobster", "tikka", "tandoori"
]

def food_allowed(food_row: Dict[str, Any], flags: Dict[str, bool]) -> bool:
    """
    Section 5 — Layer 2 (Python keyword filters):
    - USDA noise names are dropped first (babyfood, candies, snacks, etc.).
    - Vegan / vegetarian keyword checks run as a safety net (SQL Layer 1 already
      pre-filtered via is_vegan / is_vegetarian columns).
    - Gluten-free, dairy-free, and nut allergy are Python-only keyword filters
      since the DB has no dedicated boolean columns for these restrictions.
    - The first 6 foods that survive both layers are returned for that nutrient.
    """
    name = food_row.get("name", "")
    if is_usda_noise(name):
        return False

    name_lower = name.lower()
    
    tags = food_row.get("tags", [])
    tags_str = ""
    if isinstance(tags, str):
        tags_str = tags.lower()
    elif isinstance(tags, list):
        tags_str = " ".join([str(t).lower() for t in tags])

    full_text = f"{name_lower} {tags_str}"

    # Vegan safety-net (SQL already filtered is_vegan=1, this catches keyword leaks)
    if flags.get("vegan"):
        if any(w in full_text for w in NON_VEG_KEYWORDS + DAIRY_KEYWORDS + ["egg", "honey"]):
            return False

    # Vegetarian safety-net (SQL already filtered is_vegetarian=1, this catches keyword leaks)
    if flags.get("vegetarian") and not flags.get("vegan"):
        if any(w in full_text for w in NON_VEG_KEYWORDS):
            return False

    # Gluten-free keyword filter (Python-only, no DB column)
    if flags.get("gluten_free"):
        if "gluten-free" not in full_text and "gluten free" not in full_text:
            if any(w in full_text for w in GLUTEN_KEYWORDS):
                return False

    # Dairy-free keyword filter (Python-only, no DB column)
    if flags.get("dairy_free"):
        is_plant_milk = any(x in name_lower for x in ["soy milk", "almond milk", "oat milk", "coconut milk", "rice milk", "hemp milk"])
        dairy_check = [w for w in DAIRY_KEYWORDS if w != "milk"] if is_plant_milk else DAIRY_KEYWORDS
        if any(w in full_text for w in dairy_check):
            return False

    # Nut allergy keyword filter (Python-only, no DB column)
    if flags.get("nut_allergy"):
        if any(w in full_text for w in NUT_KEYWORDS):
            if not any(ok in name_lower for ok in ["coconut", "chestnut", "nut-free"]):
                return False

    return True

# ── Step 3: Choose high-risk nutrients (prob >= 0.45) ──
def high_risk_nutrients(detected_deficiencies: List[Dict[str, Any]], cutoff: float = 0.45) -> List[Dict[str, Any]]:
    """
    Step 3: keeps every nutrient where probability >= 0.45.
    Order is identical to risks_json (highest risk first).
    """
    results = []
    if not detected_deficiencies:
        return results

    for d in detected_deficiencies:
        if not isinstance(d, dict):
            continue
        def_name = d.get("deficiency", "")
        prob = float(d.get("probability", 0.0))
        
        key = DEFICIENCY_TO_KEY.get(def_name.lower().strip())
        if key and key in NUTRIENT_MAPPING and prob >= cutoff:
            info = NUTRIENT_MAPPING[key]
            results.append({
                "nutrient": key,
                "deficiency": info["full_name"],
                "probability": prob,
                "col": info["col"],
                "label": info["label"],
                "unit": info["unit"]
            })
            
    return results

# ── Step 5 & 6: Query DB & return recommendations ──
def get_recommendations_for_assessment(
    detected_deficiencies: List[Dict[str, Any]], 
    diet_restrictions: List[str] = None, 
    limit: int = 6,
    cutoff: float = 0.45
) -> List[Dict[str, Any]]:
    """
    Implements Steps 3 to 7 of the NutriSense PDF Specification:
    1. Filter high risk nutrients (probability >= cutoff).
    2. Parse diet settings into boolean flags.
    3. Query food_items catalog ORDER BY source_priority ASC, nutrient_col DESC.
    4. Filter out USDA noise and non-compliant foods.
    5. Return top 6 foods per high-risk nutrient block.
    """
    high_risks = high_risk_nutrients(detected_deficiencies, cutoff=cutoff)
    if not high_risks:
        # Fallback if no probability >= 0.45: pick top 2 highest risk items
        sorted_defs = sorted(
            [d for d in detected_deficiencies if isinstance(d, dict)],
            key=lambda x: float(x.get("probability", 0.0)),
            reverse=True
        )
        for d in sorted_defs[:2]:
            key = DEFICIENCY_TO_KEY.get(d.get("deficiency", "").lower().strip())
            if key and key in NUTRIENT_MAPPING:
                info = NUTRIENT_MAPPING[key]
                high_risks.append({
                    "nutrient": key,
                    "deficiency": info["full_name"],
                    "probability": float(d.get("probability", 0.0)),
                    "col": info["col"],
                    "label": info["label"],
                    "unit": info["unit"]
                })

    flags = diet_flags(diet_restrictions)
    candidate_pool_limit = max(limit * 8, 48)
    
    recommendation_blocks = []

    with get_db() as conn:
        cursor = conn.cursor()
        
        for hr in high_risks:
            nut_key = hr["nutrient"]
            nut_col = hr["col"]
            nut_unit = hr["unit"]
            nut_label = hr["label"]
            
            # ── Section 5: Two-layer diet filtering ──
            # Layer 1 (SQL): Pre-filter vegan / vegetarian using DB columns
            #   when those diets are on. This reduces candidate pool before Python.
            # Layer 2 (Python): keyword filters for gluten-free, dairy-free, nut allergy
            #   are applied after SQL via food_allowed().
            
            where_clauses = [f"{nut_col} IS NOT NULL", f"{nut_col} > 0"]
            
            if flags.get("vegan"):
                where_clauses.append("is_vegan = 1")
            elif flags.get("vegetarian"):
                where_clauses.append("is_vegetarian = 1")
            
            where_sql = " AND ".join(where_clauses)
            
            sql = f"""
                SELECT *,
                       CASE 
                           WHEN LOWER(COALESCE(data_type, '')) = 'curated' THEN 0
                           WHEN LOWER(COALESCE(data_type, '')) = 'ifct2017' THEN 1
                           ELSE 2
                       END AS catalog_rank
                FROM food_items
                WHERE {where_sql}
                ORDER BY catalog_rank ASC, {nut_col} DESC
                LIMIT ?
            """
            cursor.execute(sql, (candidate_pool_limit,))
            rows = cursor.fetchall()
            
            filtered_foods = []
            seen_names = set()

            for r in rows:
                food_dict = dict(r)
                fname = food_dict.get("name", "").strip()
                
                # Deduplicate by normalized name
                norm_name = fname.lower()
                if norm_name in seen_names:
                    continue

                if food_allowed(food_dict, flags):
                    seen_names.add(norm_name)
                    formatted_schema = food_to_schema(food_dict, nutrient_key=nut_key, nutrient_col=nut_col, label=nut_label, unit=nut_unit)
                    filtered_foods.append(formatted_schema)
                    
                    if len(filtered_foods) >= limit:
                        break
            
            recommendation_blocks.append({
                "nutrient": nut_key,
                "nutrient_name": hr["deficiency"],
                "display_label": nut_label,
                "unit": nut_unit,
                "risk_probability": hr["probability"],
                "risk_percentage": f"{int(hr['probability'] * 100)}%",
                "foods": filtered_foods
            })

    return recommendation_blocks

# ── Legacy wrapper compatibility ──
def get_dietary_recommendations(detected_deficiencies, dietary_restrictions=None):
    """
    Backwards compatible wrapper returning dictionary mapping deficiency name to details.
    """
    blocks = get_recommendations_for_assessment(detected_deficiencies, dietary_restrictions, limit=6, cutoff=0.0)
    recommendations = {}
    
    current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    recipes_path = os.path.join(current_dir, "data", "recipes.json")
    deficiency_map_path = os.path.join(current_dir, "data", "deficiency_food_map.json")

    recipes = []
    deficiency_map = {}
    if os.path.exists(recipes_path):
        with open(recipes_path, "r", encoding="utf-8") as f:
            recipes = json.load(f)
    if os.path.exists(deficiency_map_path):
        with open(deficiency_map_path, "r", encoding="utf-8") as f:
            deficiency_map = json.load(f)

    for block in blocks:
        def_name = block["nutrient_name"]
        foods = block["foods"]
        
        data = deficiency_map.get(def_name, {
            "dietary_notes": f"High quality sources of {block['display_label']}.",
            "supplements": []
        })

        matching_recipes = [
            r for r in recipes if def_name in r.get("target_deficiencies", [])
        ]

        recommendations[def_name] = {
            "risk_level": "High" if block["risk_probability"] >= 0.66 else "Moderate",
            "confidence": f"{int(block['risk_probability'] * 100)}%",
            "recommended_foods": [f["name"] for f in foods],
            "recommended_foods_detailed": [
                {
                    "food_id": f["id"],
                    "food_name": f["name"],
                    "nutrient_value": f["amount"],
                    "nutrient_unit": f["unit"],
                    "nutrient_label": block["display_label"]
                }
                for f in foods
            ],
            "dietary_notes": data.get("dietary_notes", ""),
            "supplements": data.get("supplements", []),
            "suggested_recipes": matching_recipes[:2] if matching_recipes else recipes[:2]
        }

    return recommendations
