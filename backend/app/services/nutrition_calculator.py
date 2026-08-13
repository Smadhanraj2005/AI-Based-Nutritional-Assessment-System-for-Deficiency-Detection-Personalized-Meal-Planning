# Standard RDA Baselines (Adult Male / Female)
RDA_BASELINES = {
    "calories": 2000,
    "protein_g": 56.0,
    "carbs_g": 275.0,
    "fat_g": 70.0,
    "fiber_g": 28.0,
    "iron_mg": 18.0,        # 18mg for females of childbearing age, 8mg for males
    "vitamin_d_iu": 600.0,
    "vitamin_b12_mcg": 2.4,
    "calcium_mg": 1000.0,
    "folate_mcg": 400.0,
    "zinc_mg": 11.0,
    "vitamin_a_iu": 3000.0,
    "vitamin_c_mg": 90.0,
    "magnesium_mg": 400.0,
    "iodine_mcg": 150.0
}

def calculate_daily_nutrition(logged_foods, user_profile=None):
    """
    Computes total macro and micronutrient totals from food diary entries and calculates % RDA.
    """
    totals = {key: 0.0 for key in RDA_BASELINES.keys()}
    
    for item in logged_foods:
        grams = item.get("serving_g", 100.0)
        multiplier = grams / 100.0
        
        for key in totals.keys():
            totals[key] += item.get(key, 0.0) * multiplier
            
    # Adjust RDA based on gender
    rda = RDA_BASELINES.copy()
    if user_profile:
        if user_profile.get("gender") == "Female" or user_profile.get("gender") == 1:
            rda["iron_mg"] = 18.0
            rda["zinc_mg"] = 8.0
            rda["magnesium_mg"] = 310.0
        else:
            rda["iron_mg"] = 8.0
            rda["zinc_mg"] = 11.0
            rda["magnesium_mg"] = 400.0

    percentages = {}
    for key, val in totals.items():
        ref = rda.get(key, 100.0)
        percentages[f"{key}_pct"] = round((val / ref) * 100.0, 1) if ref > 0 else 100.0

    return {
        "totals": {k: round(v, 2) for k, v in totals.items()},
        "rda_baselines": rda,
        "percentages": percentages
    }
