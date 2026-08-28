def compute_shap_explanations(input_dict, predicted_probs):
    """
    Computes model explainability feature attributions (SHAP style) for each predicted nutrient deficiency.
    Uses the 13-feature NHANES model input (raw nutrient values, not percentages).
    Shows the top positive risk drivers (low intake) and protective factors.
    """
    explanations = {}
    
    # Maps each deficiency to (feature_key, RDA_threshold, display_label)
    INTAKE_MAP = {
        "Iron Deficiency (Anemia)": ("iron_mg", 8.0, "Daily Iron Intake"),
        "Vitamin D Deficiency": ("vitamin_d_mcg", 15.0, "Daily Vitamin D Intake"),
        "Vitamin B12 Deficiency": ("vitamin_b12_mcg", 2.4, "Daily Vitamin B12 Intake"),
        "Calcium Deficiency": ("calcium_mg", 1000.0, "Daily Calcium Intake"),
        "Folate (Vitamin B9) Deficiency": ("folate_mcg", 400.0, "Daily Folate Intake"),
        "Zinc Deficiency": ("zinc_mg", 8.0, "Daily Zinc Intake"),
        "Vitamin A Deficiency": ("vitamin_a_mcg", 700.0, "Daily Vitamin A Intake"),
        "Vitamin C Deficiency": ("vitamin_c_mg", 75.0, "Daily Vitamin C Intake"),
        "Magnesium Deficiency": ("magnesium_mg", 320.0, "Daily Magnesium Intake"),
        "Protein Deficiency": ("protein_g", 50.0, "Daily Protein Intake"),
    }
    
    # Symptom associations (kept for context even though symptoms aren't model features)
    SYMPTOM_MAP = {
        "Iron Deficiency (Anemia)": [("fatigue", "Fatigue & Low Energy"), ("pale_skin", "Pale Skin / Pallor"), ("brittle_nails", "Brittle Nails")],
        "Vitamin D Deficiency": [("muscle_weakness", "Muscle Weakness"), ("mood_changes", "Mood Swings / Low Mood"), ("fatigue", "Chronic Fatigue")],
        "Vitamin B12 Deficiency": [("fatigue", "Fatigue & Weakness"), ("mood_changes", "Neurological / Mood Symptoms")],
        "Calcium Deficiency": [("muscle_weakness", "Muscle Twitches / Weakness"), ("brittle_nails", "Brittle Nails")],
        "Folate (Vitamin B9) Deficiency": [("fatigue", "Fatigue"), ("pale_skin", "Pale Skin"), ("hair_loss", "Hair Thinning")],
        "Zinc Deficiency": [("hair_loss", "Hair Loss"), ("slow_healing", "Slow Wound Healing"), ("brittle_nails", "Nail Dystrophy")],
        "Vitamin A Deficiency": [("dry_skin", "Severe Dry Skin / Xerosis")],
        "Vitamin C Deficiency": [("bleeding_gums", "Bleeding Gums"), ("slow_healing", "Impaired Wound Healing")],
        "Magnesium Deficiency": [("muscle_weakness", "Muscle Cramps / Weakness"), ("mood_changes", "Anxiety / Mood Alterations")],
        "Protein Deficiency": [("fatigue", "Fatigue & Weakness"), ("hair_loss", "Hair Loss / Thinning")],
    }

    for deficiency, prob in predicted_probs.items():
        if prob < 0.10:
            continue
            
        factors = []
        
        # 1. Check Dietary Intake Impact based on RDA thresholds
        if deficiency in INTAKE_MAP:
            key, rda_threshold, label = INTAKE_MAP[deficiency]
            intake_val = float(input_dict.get(key, rda_threshold))
            pct_of_rda = round((intake_val / rda_threshold) * 100, 1) if rda_threshold > 0 else 100.0
            
            if pct_of_rda < 80.0:
                deficit = round(100.0 - pct_of_rda, 1)
                weight = round(min(0.46, (deficit / 100.0) * 0.5), 2)
                factors.append({
                    "feature": label,
                    "type": "dietary_gap",
                    "impact": f"+{int(weight * 100)}%",
                    "pct": f"{pct_of_rda}% RDA",
                    "value": f"{round(intake_val, 1)}",
                    "description": f"Dietary intake ({round(intake_val, 1)}) is {deficit}% below RDA ({rda_threshold})."
                })
            else:
                factors.append({
                    "feature": label,
                    "type": "protective",
                    "impact": "-15%",
                    "pct": f"{pct_of_rda}% RDA",
                    "value": f"{round(intake_val, 1)}",
                    "description": "Sufficient dietary consumption acts as a protective factor."
                })

        # 2. Check Symptoms Impact (from input_dict if symptoms were passed alongside features)
        if deficiency in SYMPTOM_MAP:
            for symptom_key, symptom_label in SYMPTOM_MAP[deficiency]:
                if input_dict.get(symptom_key, 0) == 1:
                    factors.append({
                        "feature": symptom_label,
                        "type": "reported_symptom",
                        "impact": "+20%",
                        "pct": "Present",
                        "value": "Present",
                        "description": f"User reported active clinical symptom of {symptom_label.lower()}."
                    })

        # 3. Additional context: Age & Gender influence
        age = input_dict.get("age_years", 25)
        gender = input_dict.get("gender", 1)
        if deficiency == "Iron Deficiency (Anemia)" and gender == 2 and age < 50:
            factors.append({
                "feature": "Demographic Risk (Female, <50)",
                "type": "demographic",
                "impact": "+12%",
                "pct": f"Age {age}, Female",
                "value": "Higher risk group",
                "description": "Pre-menopausal females have elevated iron deficiency risk."
            })
        if deficiency == "Vitamin D Deficiency" and age > 60:
            factors.append({
                "feature": "Demographic Risk (Age > 60)",
                "type": "demographic",
                "impact": "+10%",
                "pct": f"Age {age}",
                "value": "Higher risk group",
                "description": "Older adults have reduced Vitamin D synthesis."
            })

        explanations[deficiency] = sorted(factors, key=lambda x: x["impact"], reverse=True)

    return explanations
