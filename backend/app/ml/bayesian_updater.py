def apply_bayesian_lab_updates(prior_probs, lab_data, gender=1):
    """
    Applies Bayesian probability updating logic to ML risk scores using medical laboratory test values.
    
    Bayes Rule: Posterior = (Prior * Likelihood) / (Prior * Likelihood + (1 - Prior))
    """
    posterior_probs = prior_probs.copy()
    bayesian_boosts = {}
    
    if not lab_data:
        return posterior_probs, bayesian_boosts

    # 1. Hemoglobin (g/dL) -> Iron Deficiency Anemia
    if "hemoglobin_g_dl" in lab_data and lab_data["hemoglobin_g_dl"] is not None:
        hb = float(lab_data["hemoglobin_g_dl"])
        cutoff = 12.0 if gender == 1 else 13.0
        if hb < cutoff:
            severity_factor = (cutoff - hb) / 2.0
            lr = 3.5 + (severity_factor * 2.0) # Likelihood Ratio for deficiency
            prior = posterior_probs.get("Iron Deficiency (Anemia)", 0.2)
            post = (prior * lr) / ((prior * lr) + (1.0 - prior))
            posterior_probs["Iron Deficiency (Anemia)"] = min(0.98, post)
            bayesian_boosts["Iron Deficiency (Anemia)"] = f"Hemoglobin level of {hb} g/dL is below standard threshold ({cutoff} g/dL). Likelihood ratio {lr:.1f}x applied."

    # 2. Vitamin D 25-OH (ng/mL) -> Vitamin D Deficiency
    if "vit_d_ng_ml" in lab_data and lab_data["vit_d_ng_ml"] is not None:
        vit_d = float(lab_data["vit_d_ng_ml"])
        if vit_d < 30.0:
            lr = 4.5 if vit_d < 20.0 else 2.5
            prior = posterior_probs.get("Vitamin D Deficiency", 0.2)
            post = (prior * lr) / ((prior * lr) + (1.0 - prior))
            posterior_probs["Vitamin D Deficiency"] = min(0.98, post)
            bayesian_boosts["Vitamin D Deficiency"] = f"Vitamin D 25-OH is {vit_d} ng/mL (Deficient/Insufficient < 30 ng/mL). Likelihood ratio {lr:.1f}x applied."

    # 3. Vitamin B12 (pg/mL) -> Vitamin B12 Deficiency
    if "vit_b12_pg_ml" in lab_data and lab_data["vit_b12_pg_ml"] is not None:
        b12 = float(lab_data["vit_b12_pg_ml"])
        if b12 < 300.0:
            lr = 5.0 if b12 < 200.0 else 2.5
            prior = posterior_probs.get("Vitamin B12 Deficiency", 0.2)
            post = (prior * lr) / ((prior * lr) + (1.0 - prior))
            posterior_probs["Vitamin B12 Deficiency"] = min(0.98, post)
            bayesian_boosts["Vitamin B12 Deficiency"] = f"Serum Vitamin B12 level is {b12} pg/mL (Deficient < 200 pg/mL). Likelihood ratio {lr:.1f}x applied."

    # 4. Serum Iron (mcg/dL) -> Iron Deficiency
    if "serum_iron_mcg_dl" in lab_data and lab_data["serum_iron_mcg_dl"] is not None:
        iron = float(lab_data["serum_iron_mcg_dl"])
        if iron < 60.0:
            lr = 3.5
            prior = posterior_probs.get("Iron Deficiency (Anemia)", 0.2)
            post = (prior * lr) / ((prior * lr) + (1.0 - prior))
            posterior_probs["Iron Deficiency (Anemia)"] = min(0.98, post)
            if "Iron Deficiency (Anemia)" not in bayesian_boosts:
                bayesian_boosts["Iron Deficiency (Anemia)"] = f"Serum Iron is {iron} mcg/dL (Low < 60 mcg/dL)."

    # 5. Serum Calcium (mg/dL) -> Calcium Deficiency
    if "calcium_mg_dl" in lab_data and lab_data["calcium_mg_dl"] is not None:
        cal = float(lab_data["calcium_mg_dl"])
        if cal < 8.6:
            lr = 4.0
            prior = posterior_probs.get("Calcium Deficiency", 0.2)
            post = (prior * lr) / ((prior * lr) + (1.0 - prior))
            posterior_probs["Calcium Deficiency"] = min(0.98, post)
            bayesian_boosts["Calcium Deficiency"] = f"Serum Calcium is {cal} mg/dL (Hypocalcemia < 8.6 mg/dL)."

    return posterior_probs, bayesian_boosts
