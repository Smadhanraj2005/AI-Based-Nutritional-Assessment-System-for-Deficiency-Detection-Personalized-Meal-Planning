import os
import json
from app.services.recommendation_service import (
    NUTRIENT_MAPPING,
    DEFICIENCY_TO_KEY,
    food_allowed,
    diet_flags,
)
from app.db.database import get_db


def is_food_compatible(food_obj, dietary_restrictions):
    """Wrapper that bridges the meal_planner call-signature to food_allowed + diet_flags."""
    flags = diet_flags(dietary_restrictions or [])
    return food_allowed(food_obj, flags)

def high_risk_nutrients(detected_deficiencies, cutoff=0.45):
    """
    Step 3 (PDF Spec): Keep every nutrient whose probability is 45% (0.45) or higher.
    Returns list of nutrient deficiency dicts sorted by highest risk first.
    """
    valid_nutrients = []
    if not detected_deficiencies:
        return ["Calcium Deficiency", "Vitamin B12 Deficiency", "Vitamin A Deficiency", "Vitamin D Deficiency"]

    for d in detected_deficiencies:
        if isinstance(d, dict):
            prob = d.get("probability", 0.0)
            if prob >= cutoff:
                valid_nutrients.append(d.get("deficiency"))
    
    if not valid_nutrients:
        # Fallback to top 3 if none reach 45%
        for d in detected_deficiencies[:3]:
            if isinstance(d, dict) and "deficiency" in d:
                valid_nutrients.append(d["deficiency"])
                
    if not valid_nutrients:
        valid_nutrients = ["Calcium Deficiency", "Vitamin B12 Deficiency", "Vitamin A Deficiency", "Vitamin D Deficiency"]
        
    return valid_nutrients

def generate_7day_meal_plan(detected_deficiencies, dietary_restrictions=None):
    """
    Generates a personalized 7-day meal schedule per NutriSense PDF specification (Section 6):
    - Identifies focus nutrients with risk probability >= 0.45.
    - Applies strict user dietary restrictions & allergy filters (Vegan, Veg, Dairy-free, Gluten-free, Nut allergy).
    - Selects primary meals and 2 to 3 diet-compliant replacement food items for every meal each day.
    - Preserves exact return structure (day, total_calories, targeted_deficiencies, meals with replacements).
    """
    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    dietary_restrictions = dietary_restrictions or []
    
    current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    recipes_path = os.path.join(current_dir, "data", "recipes.json")
    
    recipes = []
    if os.path.exists(recipes_path):
        with open(recipes_path, "r", encoding="utf-8") as f:
            recipes = json.load(f)

    # 1. Identify High Risk Focus Nutrients (P >= 0.45)
    focus_deficiencies = high_risk_nutrients(detected_deficiencies, cutoff=0.45)

    # 2. Filter recipes against user dietary restrictions & allergies
    compatible_recipes = []
    for r in recipes:
        r_food_obj = {
            "name": r.get("name", "") + " " + " ".join(r.get("ingredients", [])),
            "tags": r.get("dietary_tags", [])
        }
        if is_food_compatible(r_food_obj, dietary_restrictions):
            compatible_recipes.append(r)

    # 3. Build diet-safe catalog pools per meal type for 2-3 replacements
    replacement_pools = {
        "breakfast": [
            "Fortified Oats Bowl with Chia Seeds (50g)",
            "Sprouted Moong & Spinach Cheela (120g)",
            "Steamed Ragi & Flaxseed Porridge (150g)",
            "Avocado & Pumpkin Seed Toast (100g)",
            "Fresh Guava & Citrus Fruit Salad (140g)",
            "Tofu Scramble with Bell Peppers (120g)",
            "Fortified Plant Milk & Berry Smoothie (200ml)"
        ],
        "lunch": [
            "Lentil & Mixed Vegetable Stew (180g)",
            "Brown Rice & Masoor Dal Bowl (200g)",
            "Quinoa & Chickpea Salad with Lemon (160g)",
            "Slow-Cooked Rajma with Steamed Greens (180g)",
            "Amaranth & Sweet Potato Bowl (150g)",
            "Stir-fried Tofu & Broccoli with Sesame (160g)",
            "Chickpea & Spinach Coconut Curry (180g)"
        ],
        "snack": [
            "Roasted Chana & Cumin Seeds (40g)",
            "Pumpkin Seed & Sunflower Seed Mix (35g)",
            "Fresh Guava & Gooseberry Slices (120g)",
            "Steamed Sweet Potato Cubes (100g)",
            "Roasted Makhana with Spices (30g)",
            "Cucumber & Carrot Stick Medley (100g)",
            "Toasted Sesame & Flaxseed Clusters (35g)"
        ],
        "dinner": [
            "Sautéed Amaranth & Spinach Greens (150g)",
            "Steamed Sweet Potato & Broccoli Medley (160g)",
            "Slow-Cooked Yellow Lentil Soup (180g)",
            "Herb-Grilled Tofu with Sauteed Vegetables (170g)",
            "Spiced Chickpea & Kale Bowl (180g)",
            "Quinoa & Vegetable Stir-Fry (170g)",
            "Roasted Cauliflower & Fenugreek Bowl (150g)"
        ]
    }

    # Filter replacement candidates with is_food_compatible
    diet_safe_replacements = {}
    for mtype, pool in replacement_pools.items():
        filtered_items = []
        for item in pool:
            if is_food_compatible({"name": item, "tags": []}, dietary_restrictions):
                filtered_items.append(item)
        if len(filtered_items) < 3:
            # Safe plant-based fallbacks if filters heavily reduce pool
            fallbacks = [
                "Steamed Greens & Sesame Seeds (100g)",
                "Lentils & Pumpkin Seeds (120g)",
                "Fresh Citrus & Guava Medley (120g)"
            ]
            for f in fallbacks:
                if f not in filtered_items:
                    filtered_items.append(f)
        diet_safe_replacements[mtype] = filtered_items

    meal_plan = []
    used_recipe_ids = set()

    for i, day in enumerate(days):
        target_index_1 = i % len(focus_deficiencies)
        target_index_2 = (i + 1) % len(focus_deficiencies)
        day_targets = [focus_deficiencies[target_index_1], focus_deficiencies[target_index_2]]

        day_meals = {}

        def find_recipe(meal_type):
            for r in compatible_recipes:
                if r["id"] in used_recipe_ids:
                    continue
                targets_overlap = any(t in r.get("target_deficiencies", []) for t in day_targets)
                if targets_overlap:
                    r_name_lower = r["name"].lower()
                    if meal_type == "breakfast" and any(x in r_name_lower for x in ["yogurt", "bowl", "smoothie", "egg", "breakfast", "toast", "oatmeal"]):
                        return r
                    elif meal_type in ["lunch", "dinner"] and any(x in r_name_lower for x in ["salad", "stew", "soup", "curry", "rice", "pie", "dinner", "lunch"]):
                        return r
            return None

        for mtype in ["breakfast", "lunch", "dinner", "snack"]:
            recipe = find_recipe(mtype)

            # Pick 2 to 3 diet-compliant replacement food items
            pool = diet_safe_replacements[mtype]
            offset = (i * 2 + {"breakfast": 0, "lunch": 1, "dinner": 2, "snack": 3}[mtype]) % len(pool)
            replacements = [
                pool[offset % len(pool)],
                pool[(offset + 1) % len(pool)],
                pool[(offset + 2) % len(pool)]
            ]

            if recipe:
                used_recipe_ids.add(recipe["id"])
                focus_nutrients = [t.split(" Deficiency")[0].split(" (Anemia)")[0] for t in recipe.get("target_deficiencies", [])]
                focus_str = ", ".join(focus_nutrients)

                # Pick 2-3 replacements that do not duplicate the recipe name
                rec_name_lower = recipe["name"].lower()
                replacements = [item for item in pool if item.split(" (")[0].lower() not in rec_name_lower][:3]
                if len(replacements) < 2:
                    replacements = pool[:3]

                day_meals[mtype] = {
                    "title": recipe["name"],
                    "calories": recipe["calories_per_serving"],
                    "focus": f"Targets: {focus_str}",
                    "recipe_id": recipe["id"],
                    "replacements": replacements,
                    "replacement_foods": replacements
                }
            else:
                main_food = pool[offset % len(pool)].split(" (")[0]

                if mtype == "breakfast":
                    cals = 320 + (i % 3) * 20
                    title = f"{main_food} Breakfast Special"
                elif mtype == "lunch":
                    cals = 400 + (i % 3) * 25
                    title = f"Nutrient-Rich {main_food} Lunch"
                elif mtype == "dinner":
                    cals = 450 + (i % 3) * 30
                    title = f"Hearty {main_food} Dinner"
                else:
                    cals = 180 + (i % 3) * 15
                    title = f"{main_food} Snack"

                focus_nutrients = [t.split(" Deficiency")[0].split(" (Anemia)")[0] for t in day_targets]
                focus_str = " & ".join(focus_nutrients[:2])

                # Pick replacements starting from offset + 1 so main_food is never repeated in alternatives
                replacements = [
                    pool[(offset + 1) % len(pool)],
                    pool[(offset + 2) % len(pool)],
                    pool[(offset + 3) % len(pool)]
                ]

                day_meals[mtype] = {
                    "title": title,
                    "calories": cals,
                    "focus": f"Targets {focus_str}",
                    "recipe_id": None,
                    "replacements": replacements,
                    "replacement_foods": replacements
                }

        daily_cals = sum(day_meals[m]["calories"] for m in day_meals)

        meal_plan.append({
            "day": day,
            "total_calories": daily_cals,
            "targeted_deficiencies": [t.split(" Deficiency")[0].split(" (Anemia)")[0] for t in day_targets],
            "meals": day_meals
        })

    return meal_plan
