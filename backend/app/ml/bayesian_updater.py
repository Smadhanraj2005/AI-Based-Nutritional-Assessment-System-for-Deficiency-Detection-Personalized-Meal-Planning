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
    hb_val = lab_data.get("hemoglobin_g_dl") or lab_data.get("hemoglobin")
    if hb_val is not None and float(hb_val) > 0:
        hb = float(hb_val)
        cutoff = 13.0 if gender == 1 else 12.0
        if hb < cutoff:
            severity_factor = (cutoff - hb) / 2.0
            lr = 3.5 + (severity_factor * 2.0)
            prior = posterior_probs.get("Iron Deficiency (Anemia)", 0.2)
            post = (prior * lr) / ((prior * lr) + (1.0 - prior))
            posterior_probs["Iron Deficiency (Anemia)"] = min(0.98, post)
            bayesian_boosts["Iron Deficiency (Anemia)"] = f"Hemoglobin level of {hb} g/dL is below standard threshold ({cutoff} g/dL). Likelihood ratio {lr:.1f}x applied."

    # 2. Vitamin D 25-OH -> Vitamin D Deficiency
    vit_d_val = lab_data.get("vit_d_ng_ml") if lab_data.get("vit_d_ng_ml") is not None else lab_data.get("serum_vitamin_d")
    if vit_d_val is not None and float(vit_d_val) > 0:
        vit_d = float(vit_d_val)
        if vit_d < 50.0:
            lr = 4.5 if vit_d < 20.0 else 2.5
            prior = posterior_probs.get("Vitamin D Deficiency", 0.2)
            post = (prior * lr) / ((prior * lr) + (1.0 - prior))
            posterior_probs["Vitamin D Deficiency"] = min(0.98, post)
            bayesian_boosts["Vitamin D Deficiency"] = f"Serum Vitamin D is {vit_d} (Insufficient < 50). Likelihood ratio {lr:.1f}x applied."

    # 3. Vitamin B12 (pg/mL) -> Vitamin B12 Deficiency
    b12_val = lab_data.get("vit_b12_pg_ml") if lab_data.get("vit_b12_pg_ml") is not None else lab_data.get("vitamin_b12")
    if b12_val is not None and float(b12_val) > 0:
        b12 = float(b12_val)
        if b12 < 200.0:
            lr = 5.0
            prior = posterior_probs.get("Vitamin B12 Deficiency", 0.2)
            post = (prior * lr) / ((prior * lr) + (1.0 - prior))
            posterior_probs["Vitamin B12 Deficiency"] = min(0.98, post)
            bayesian_boosts["Vitamin B12 Deficiency"] = f"Serum Vitamin B12 level is {b12} pg/mL (Deficient < 200 pg/mL). Likelihood ratio {lr:.1f}x applied."

    # 4. Ferritin (ng/mL) -> Iron Deficiency
    ferritin_val = lab_data.get("ferritin")
    if ferritin_val is not None and float(ferritin_val) > 0:
        ferritin = float(ferritin_val)
        if ferritin < 30.0:
            lr = 3.5
            prior = posterior_probs.get("Iron Deficiency (Anemia)", 0.2)
            post = (prior * lr) / ((prior * lr) + (1.0 - prior))
            posterior_probs["Iron Deficiency (Anemia)"] = min(0.98, post)
            if "Iron Deficiency (Anemia)" not in bayesian_boosts:
                bayesian_boosts["Iron Deficiency (Anemia)"] = f"Ferritin level of {ferritin} ng/mL is low (< 30 ng/mL)."

    # 5. Serum Calcium (mg/dL) -> Calcium Deficiency
    calc_val = lab_data.get("calcium_mg_dl") if lab_data.get("calcium_mg_dl") is not None else lab_data.get("calcium")
    if calc_val is not None and float(calc_val) > 0:
        cal = float(calc_val)
        if cal < 8.5:
            lr = 4.0
            prior = posterior_probs.get("Calcium Deficiency", 0.2)
            post = (prior * lr) / ((prior * lr) + (1.0 - prior))
            posterior_probs["Calcium Deficiency"] = min(0.98, post)
            bayesian_boosts["Calcium Deficiency"] = f"Serum Calcium is {cal} mg/dL (Hypocalcemia < 8.5 mg/dL)."

    return posterior_probs, bayesian_boosts
