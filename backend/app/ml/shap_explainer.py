def compute_shap_explanations(input_dict, predicted_probs):
    """
    Computes model explainability feature attributions (SHAP style) for each predicted nutrient deficiency.
    Shows the top positive risk drivers (low intake, reported symptoms, lab markers) and protective factors.
    """
    explanations = {}
    
    INTAKE_MAP = {
        "Iron Deficiency (Anemia)": ("iron_intake_pct", "Daily Iron Intake"),
        "Vitamin D Deficiency": ("vit_d_intake_pct", "Daily Vitamin D Intake"),
        "Vitamin B12 Deficiency": ("vit_b12_intake_pct", "Daily Vitamin B12 Intake"),
        "Calcium Deficiency": ("calcium_intake_pct", "Daily Calcium Intake"),
        "Folate (Vitamin B9) Deficiency": ("folate_intake_pct", "Daily Folate Intake"),
        "Zinc Deficiency": ("zinc_intake_pct", "Daily Zinc Intake"),
        "Vitamin A Deficiency": ("vit_a_intake_pct", "Daily Vitamin A Intake"),
        "Vitamin C Deficiency": ("vit_c_intake_pct", "Daily Vitamin C Intake"),
        "Magnesium Deficiency": ("mag_intake_pct", "Daily Magnesium Intake"),
        "Iodine Deficiency": ("iodine_intake_pct", "Daily Iodine Intake")
    }
    
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
        "Iodine Deficiency": [("cold_intolerance", "Sensitivity to Cold"), ("fatigue", "Lethargy & Fatigue")]
    }

    LAB_MAP = {
        "Iron Deficiency (Anemia)": ("hemoglobin_g_dl", 12.0, "Hemoglobin Lab Value"),
        "Vitamin D Deficiency": ("vit_d_ng_ml", 30.0, "Serum Vitamin D 25-OH"),
        "Vitamin B12 Deficiency": ("vit_b12_pg_ml", 300.0, "Serum B12 Test"),
        "Calcium Deficiency": ("calcium_mg_dl", 8.6, "Serum Calcium Level")
    }

    for deficiency, prob in predicted_probs.items():
        if prob < 0.20:
            continue
            
        factors = []
        
        # 1. Check Dietary Intake Impact
        if deficiency in INTAKE_MAP:
            key, label = INTAKE_MAP[deficiency]
            intake_pct = float(input_dict.get(key, 100.0))
            if intake_pct < 80.0:
                deficit = round(100.0 - intake_pct, 1)
                weight = round(min(0.45, (deficit / 100.0) * 0.5), 2)
                factors.append({
                    "feature": label,
                    "type": "dietary_gap",
                    "impact": f"+{int(weight * 100)}%",
                    "value": f"{intake_pct}% RDA",
                    "description": f"Dietary intake is {deficit}% below recommended daily allowance."
                })
            else:
                factors.append({
                    "feature": label,
                    "type": "protective",
                    "impact": "-15%",
                    "value": f"{intake_pct}% RDA",
                    "description": "Sufficient dietary consumption acts as a protective factor."
                })

        # 2. Check Symptoms Impact
        if deficiency in SYMPTOM_MAP:
            for symptom_key, symptom_label in SYMPTOM_MAP[deficiency]:
                if input_dict.get(symptom_key, 0) == 1:
                    factors.append({
                        "feature": symptom_label,
                        "type": "reported_symptom",
                        "impact": "+20%",
                        "value": "Present",
                        "description": f"User reported active clinical symptom of {symptom_label.lower()}."
                    })

        # 3. Check Lab Values Impact
        if deficiency in LAB_MAP:
            lab_key, threshold, lab_label = LAB_MAP[deficiency]
            val = input_dict.get(lab_key)
            if val is not None and float(val) < threshold:
                factors.append({
                    "feature": lab_label,
                    "type": "clinical_lab_marker",
                    "impact": "+35%",
                    "value": f"{val}",
                    "description": f"Blood test result ({val}) is below optimal clinical threshold ({threshold})."
                })

        explanations[deficiency] = sorted(factors, key=lambda x: x["impact"], reverse=True)

    return explanations
