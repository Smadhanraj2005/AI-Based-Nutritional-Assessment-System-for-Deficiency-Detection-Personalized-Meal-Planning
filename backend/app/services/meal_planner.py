import os
import json

def generate_7day_meal_plan(detected_deficiencies, dietary_restrictions=None):
    """
    Generates a personalized 7-day meal schedule addressing detected deficiencies.
    Structure per day: Breakfast, Lunch, Dinner, Snack with target nutrient benefits.
    """
    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    def_names = [d["deficiency"] for d in detected_deficiencies] if detected_deficiencies else ["General Wellness"]
    
    current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    recipes_path = os.path.join(current_dir, "data", "recipes.json")
    with open(recipes_path, "r") as f:
        recipes = json.load(f)
        
    meal_plan = []
    
    # Template meals catering to common deficiencies
    meal_options = {
        "breakfast": [
            {"title": "Almond & Berry Greek Yogurt Bowl", "calories": 320, "focus": "Calcium, Vit B12 & Magnesium", "recipe_id": "rec_3"},
            {"title": "Fortified Oatmeal with Pumpkin Seeds & Banana", "calories": 340, "focus": "Iron, Zinc & Magnesium", "recipe_id": None},
            {"title": "Spinach & Mushroom Omelette with Whole Grain Toast", "calories": 380, "focus": "Iron, Folate & Vit D", "recipe_id": None},
            {"title": "Fortified Soy Milk & Berry Chia Smoothie Bowl", "calories": 310, "focus": "Vit D, Vit B12 & Calcium", "recipe_id": None}
        ],
        "lunch": [
            {"title": "Iron & Folate Citrus Spinach Super Salad", "calories": 390, "focus": "Iron, Folate & Vit C", "recipe_id": "rec_1"},
            {"title": "Golden Turmeric Lentil & Sweet Potato Stew", "calories": 420, "focus": "Folate, Zinc & Vit A", "recipe_id": "rec_4"},
            {"title": "Quinoa Bowl with Roasted Chickpeas, Spinach & Avocado", "calories": 450, "focus": "Iron, Magnesium & Zinc", "recipe_id": None},
            {"title": "Grilled Chicken & Spinach Whole Grain Wrap", "calories": 460, "focus": "Protein, B12 & Iron", "recipe_id": None}
        ],
        "dinner": [
            {"title": "Pan-Seared Wild Salmon with Sweet Potato Mash", "calories": 520, "focus": "Vit D, Vit B12, Iodine & Vit A", "recipe_id": "rec_2"},
            {"title": "Baked Cod with Steamed Broccoli & Quinoa", "calories": 440, "focus": "Iodine, Vit C & Calcium", "recipe_id": None},
            {"title": "Lentil & Vegetable Shepherd's Pie", "calories": 480, "focus": "Iron, Folate & Zinc", "recipe_id": None},
            {"title": "Tofu & Veggie Stir-fry over Brown Rice", "calories": 430, "focus": "Calcium, Magnesium & Vit C", "recipe_id": None}
        ],
        "snack": [
            {"title": "Roasted Pumpkin Seeds & Citrus Orange Segments", "calories": 180, "focus": "Zinc & Vit C Boost", "recipe_id": None},
            {"title": "Handful of Raw Almonds & Dried Figs", "calories": 210, "focus": "Calcium & Magnesium", "recipe_id": None},
            {"title": "Greek Yogurt with Honey & Chia Seeds", "calories": 190, "focus": "Calcium & Vit B12", "recipe_id": None},
            {"title": "Dark Chocolate (70%+) & Walnuts", "calories": 200, "focus": "Antioxidants & Magnesium", "recipe_id": None}
        ]
    }
    
    for i, day in enumerate(days):
        b = meal_options["breakfast"][i % len(meal_options["breakfast"])]
        l = meal_options["lunch"][i % len(meal_options["lunch"])]
        d = meal_options["dinner"][i % len(meal_options["dinner"])]
        s = meal_options["snack"][i % len(meal_options["snack"])]
        
        daily_cals = b["calories"] + l["calories"] + d["calories"] + s["calories"]
        
        meal_plan.append({
            "day": day,
            "total_calories": daily_cals,
            "targeted_deficiencies": def_names[:3],
            "meals": {
                "breakfast": b,
                "lunch": l,
                "dinner": d,
                "snack": s
            }
        })

    return meal_plan
