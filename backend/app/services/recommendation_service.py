import os
import json

def load_data_files():
    current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    deficiency_map_path = os.path.join(current_dir, "data", "deficiency_food_map.json")
    recipes_path = os.path.join(current_dir, "data", "recipes.json")
    
    with open(deficiency_map_path, "r") as f:
        deficiency_map = json.load(f)
        
    with open(recipes_path, "r") as f:
        recipes = json.load(f)
        
    return deficiency_map, recipes

def get_dietary_recommendations(detected_deficiencies, dietary_restrictions=None):
    """
    Returns targeted food recommendations, dietary absorption advice, supplements,
    and matching recipes for detected nutrient deficiencies, filtered by user dietary restrictions.
    """
    deficiency_map, recipes = load_data_files()
    recommendations = {}
    dietary_restrictions = dietary_restrictions or []
    
    for def_item in detected_deficiencies:
        def_name = def_item["deficiency"]
        if def_name in deficiency_map:
            data = deficiency_map[def_name]
            
            # Filter recipes targeting this deficiency and matching restrictions
            matching_recipes = []
            for r in recipes:
                if def_name in r["target_deficiencies"]:
                    # Check restriction compliance if any
                    tags = r.get("dietary_tags", [])
                    if dietary_restrictions:
                        match = True
                        for res in dietary_restrictions:
                            if res and res not in tags and res != "None":
                                match = False
                                break
                        if match:
                            matching_recipes.append(r)
                    else:
                        matching_recipes.append(r)

            recommendations[def_name] = {
                "risk_level": def_item.get("risk_level", "Moderate"),
                "confidence": def_item.get("confidence", "75%"),
                "recommended_foods": data["recommended_foods"],
                "dietary_notes": data["dietary_notes"],
                "supplements": data["supplements"],
                "suggested_recipes": matching_recipes if matching_recipes else recipes[:2]
            }

    return recommendations
