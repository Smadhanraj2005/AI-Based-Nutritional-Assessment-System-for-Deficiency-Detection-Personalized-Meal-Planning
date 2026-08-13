import numpy as np
import pandas as pd

def generate_nutritional_dataset(n_samples=2500, random_state=42):
    """
    Generates a realistic clinical synthetic dataset based on WHO/NHANES epidemiological 
    patterns for multi-label micronutrient deficiency prediction.
    """
    np.random.seed(random_state)
    
    # Demographics
    age = np.random.randint(18, 75, size=n_samples)
    gender = np.random.binomial(1, 0.55, size=n_samples) # 1: Female, 0: Male
    weight_kg = np.random.normal(70, 15, size=n_samples).clip(45, 120)
    height_cm = np.random.normal(168, 10, size=n_samples).clip(145, 195)
    bmi = weight_kg / ((height_cm / 100) ** 2)
    
    # Dietary Intakes (% of RDA consumed daily: 20% to 150%)
    iron_intake_pct = np.random.uniform(20, 140, size=n_samples)
    vit_d_intake_pct = np.random.uniform(15, 130, size=n_samples)
    vit_b12_intake_pct = np.random.uniform(10, 150, size=n_samples)
    calcium_intake_pct = np.random.uniform(25, 140, size=n_samples)
    folate_intake_pct = np.random.uniform(20, 140, size=n_samples)
    zinc_intake_pct = np.random.uniform(25, 140, size=n_samples)
    vit_a_intake_pct = np.random.uniform(20, 140, size=n_samples)
    vit_c_intake_pct = np.random.uniform(20, 150, size=n_samples)
    mag_intake_pct = np.random.uniform(25, 140, size=n_samples)
    iodine_intake_pct = np.random.uniform(20, 140, size=n_samples)
    
    # Deficiency probabilities based on intake & demographic risk
    p_iron = 1 / (1 + np.exp((iron_intake_pct - 65) / 15)) + (0.15 if gender.all() else 0.0)
    p_vit_d = 1 / (1 + np.exp((vit_d_intake_pct - 60) / 15))
    p_vit_b12 = 1 / (1 + np.exp((vit_b12_intake_pct - 55) / 15))
    p_calcium = 1 / (1 + np.exp((calcium_intake_pct - 65) / 15))
    p_folate = 1 / (1 + np.exp((folate_intake_pct - 60) / 15))
    p_zinc = 1 / (1 + np.exp((zinc_intake_pct - 65) / 15))
    p_vit_a = 1 / (1 + np.exp((vit_a_intake_pct - 60) / 15))
    p_vit_c = 1 / (1 + np.exp((vit_c_intake_pct - 55) / 15))
    p_mag = 1 / (1 + np.exp((mag_intake_pct - 65) / 15))
    p_iodine = 1 / (1 + np.exp((iodine_intake_pct - 60) / 15))
    
    # Generate Target Labels (1: Deficient, 0: Normal)
    target_iron = np.random.binomial(1, p_iron.clip(0.05, 0.95))
    target_vit_d = np.random.binomial(1, p_vit_d.clip(0.05, 0.95))
    target_vit_b12 = np.random.binomial(1, p_vit_b12.clip(0.05, 0.95))
    target_calcium = np.random.binomial(1, p_calcium.clip(0.05, 0.95))
    target_folate = np.random.binomial(1, p_folate.clip(0.05, 0.95))
    target_zinc = np.random.binomial(1, p_zinc.clip(0.05, 0.95))
    target_vit_a = np.random.binomial(1, p_vit_a.clip(0.05, 0.95))
    target_vit_c = np.random.binomial(1, p_vit_c.clip(0.05, 0.95))
    target_mag = np.random.binomial(1, p_mag.clip(0.05, 0.95))
    target_iodine = np.random.binomial(1, p_iodine.clip(0.05, 0.95))
    
    # Generate Symptom Features conditionally linked to target deficiencies
    fatigue = np.random.binomial(1, (0.1 + 0.5 * target_iron + 0.3 * target_vit_d + 0.3 * target_vit_b12).clip(0.05, 0.95))
    hair_loss = np.random.binomial(1, (0.05 + 0.4 * target_zinc + 0.3 * target_iron + 0.2 * target_folate).clip(0.05, 0.95))
    pale_skin = np.random.binomial(1, (0.05 + 0.6 * target_iron + 0.3 * target_folate).clip(0.05, 0.95))
    muscle_weakness = np.random.binomial(1, (0.08 + 0.5 * target_vit_d + 0.4 * target_mag + 0.3 * target_calcium).clip(0.05, 0.95))
    mood_changes = np.random.binomial(1, (0.1 + 0.4 * target_vit_d + 0.4 * target_mag + 0.3 * target_vit_b12).clip(0.05, 0.95))
    brittle_nails = np.random.binomial(1, (0.05 + 0.5 * target_iron + 0.4 * target_zinc + 0.3 * target_calcium).clip(0.05, 0.95))
    bleeding_gums = np.random.binomial(1, (0.02 + 0.7 * target_vit_c).clip(0.02, 0.95))
    dry_skin = np.random.binomial(1, (0.08 + 0.6 * target_vit_a + 0.3 * target_zinc).clip(0.05, 0.95))
    cold_intolerance = np.random.binomial(1, (0.05 + 0.6 * target_iodine + 0.4 * target_iron).clip(0.05, 0.95))
    slow_healing = np.random.binomial(1, (0.05 + 0.5 * target_vit_c + 0.5 * target_zinc).clip(0.05, 0.95))
    
    # Generate Lab Values (Numerical with noise)
    hemoglobin = np.where(target_iron == 1, np.random.normal(10.2, 1.1, size=n_samples), np.random.normal(13.8, 1.0, size=n_samples))
    vit_d_level = np.where(target_vit_d == 1, np.random.normal(14.5, 3.5, size=n_samples), np.random.normal(32.0, 6.0, size=n_samples))
    vit_b12_level = np.where(target_vit_b12 == 1, np.random.normal(160, 30, size=n_samples), np.random.normal(450, 90, size=n_samples))
    serum_iron = np.where(target_iron == 1, np.random.normal(42, 10, size=n_samples), np.random.normal(95, 20, size=n_samples))
    calcium_level = np.where(target_calcium == 1, np.random.normal(8.0, 0.4, size=n_samples), np.random.normal(9.6, 0.4, size=n_samples))
    
    df = pd.DataFrame({
        "age": age,
        "gender": gender,
        "bmi": bmi,
        "iron_intake_pct": iron_intake_pct,
        "vit_d_intake_pct": vit_d_intake_pct,
        "vit_b12_intake_pct": vit_b12_intake_pct,
        "calcium_intake_pct": calcium_intake_pct,
        "folate_intake_pct": folate_intake_pct,
        "zinc_intake_pct": zinc_intake_pct,
        "vit_a_intake_pct": vit_a_intake_pct,
        "vit_c_intake_pct": vit_c_intake_pct,
        "mag_intake_pct": mag_intake_pct,
        "iodine_intake_pct": iodine_intake_pct,
        "fatigue": fatigue,
        "hair_loss": hair_loss,
        "pale_skin": pale_skin,
        "muscle_weakness": muscle_weakness,
        "mood_changes": mood_changes,
        "brittle_nails": brittle_nails,
        "bleeding_gums": bleeding_gums,
        "dry_skin": dry_skin,
        "cold_intolerance": cold_intolerance,
        "slow_healing": slow_healing,
        "hemoglobin_g_dl": hemoglobin.clip(6.0, 18.0),
        "vit_d_ng_ml": vit_d_level.clip(5.0, 70.0),
        "vit_b12_pg_ml": vit_b12_level.clip(50.0, 1000.0),
        "serum_iron_mcg_dl": serum_iron.clip(10.0, 200.0),
        "calcium_mg_dl": calcium_level.clip(6.0, 12.0),
        # Targets
        "target_iron": target_iron,
        "target_vit_d": target_vit_d,
        "target_vit_b12": target_vit_b12,
        "target_calcium": target_calcium,
        "target_folate": target_folate,
        "target_zinc": target_zinc,
        "target_vit_a": target_vit_a,
        "target_vit_c": target_vit_c,
        "target_mag": target_mag,
        "target_iodine": target_iodine
    })
    
    return df

if __name__ == "__main__":
    df = generate_nutritional_dataset()
    print(f"Generated synthetic clinical dataset with {df.shape[0]} rows and {df.shape[1]} features/targets.")
