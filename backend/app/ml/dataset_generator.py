import numpy as np
import pandas as pd

def generate_nutritional_dataset(n_samples=3000, random_state=42):
    """
    Generates a realistic clinical synthetic dataset based on NHANES 2021-2023 patterns
    for the 13-feature input and 10-label deficiency outputs.
    """
    np.random.seed(random_state)
    
    # Demographics
    gender = np.random.choice([1, 2], size=n_samples, p=[0.45, 0.55]) # 1 = male, 2 = female
    age_years = np.random.randint(18, 80, size=n_samples)
    
    # Nutrient intakes (daily averages)
    calories_kcal = np.random.normal(1800, 400, size=n_samples).clip(800, 3500)
    protein_g = np.random.normal(65, 15, size=n_samples).clip(20, 150)
    iron_mg = np.random.normal(12, 4, size=n_samples).clip(2, 30)
    calcium_mg = np.random.normal(800, 250, size=n_samples).clip(150, 2000)
    vitamin_d_mcg = np.random.normal(8, 4, size=n_samples).clip(0, 30)
    vitamin_b12_mcg = np.random.normal(3.0, 1.2, size=n_samples).clip(0.1, 10.0)
    folate_mcg = np.random.normal(350, 100, size=n_samples).clip(50, 800)
    vitamin_a_mcg = np.random.normal(650, 200, size=n_samples).clip(50, 1800)
    vitamin_c_mg = np.random.normal(85, 30, size=n_samples).clip(5, 250)
    magnesium_mg = np.random.normal(280, 70, size=n_samples).clip(50, 600)
    zinc_mg = np.random.normal(9, 3, size=n_samples).clip(1, 25)
    
    # Labs (statistically correlated with intakes, used to build training labels)
    # 1. Hemoglobin & Ferritin -> Iron
    hb_mean = np.where(gender == 2, 11.5, 12.5) + (iron_mg - 12) * 0.1
    hemoglobin = np.random.normal(hb_mean, 1.2).clip(7.0, 17.5)
    ferritin = np.random.normal(25 + (iron_mg - 10) * 1.5, 12).clip(5, 150)
    
    # 2. Serum Vit D (ng/mL)
    serum_vit_d = np.random.normal(32 + (vitamin_d_mcg - 15) * 1.2, 8).clip(5, 80)
    
    # Define Targets based on clinical criteria (0 = not deficient, 1 = deficient)
    # label_iron: Lab: low Hb (M<13 / F<12) OR ferritin<30; else iron intake < 8 mg
    is_hb_low = np.where(gender == 2, hemoglobin < 12.0, hemoglobin < 13.0)
    is_ferritin_low = ferritin < 30.0
    label_iron = np.where(is_hb_low | is_ferritin_low, 1, np.where(iron_mg < 8.0, 1, 0))
    
    # label_vitamin_d: Lab: serum Vit D < 20.0 ng/mL; else intake < 15.0 mcg (600 IU)
    label_vitamin_d = np.where(serum_vit_d < 20.0, 1, np.where(vitamin_d_mcg < 15.0, 1, 0))
    
    # label_vitamin_b12: Intake B12 < 2.4 mcg
    label_vitamin_b12 = np.where(vitamin_b12_mcg < 2.4, 1, 0)
    
    # label_calcium: Intake calcium < 1000 mg
    label_calcium = np.where(calcium_mg < 1000.0, 1, 0)
    
    # label_folate: Intake folate < 400 mcg
    label_folate = np.where(folate_mcg < 400.0, 1, 0)
    
    # label_vitamin_a: Intake Vit A < 700 mcg
    label_vitamin_a = np.where(vitamin_a_mcg < 700.0, 1, 0)
    
    # label_vitamin_c: Intake Vit C < 75 mg
    label_vitamin_c = np.where(vitamin_c_mg < 75.0, 1, 0)
    
    # label_magnesium: Intake magnesium < 320 mg
    label_magnesium = np.where(magnesium_mg < 320.0, 1, 0)
    
    # label_zinc: Intake zinc < 8 mg
    label_zinc = np.where(zinc_mg < 8.0, 1, 0)
    
    # label_protein: Intake protein < 50 g
    label_protein = np.where(protein_g < 50.0, 1, 0)
    
    df = pd.DataFrame({
        "gender": gender,
        "age_years": age_years,
        "calories_kcal": calories_kcal,
        "protein_g": protein_g,
        "iron_mg": iron_mg,
        "calcium_mg": calcium_mg,
        "vitamin_d_mcg": vitamin_d_mcg,
        "vitamin_b12_mcg": vitamin_b12_mcg,
        "folate_mcg": folate_mcg,
        "vitamin_a_mcg": vitamin_a_mcg,
        "vitamin_c_mg": vitamin_c_mg,
        "magnesium_mg": magnesium_mg,
        "zinc_mg": zinc_mg,
        # Targets
        "label_iron": label_iron,
        "label_vitamin_d": label_vitamin_d,
        "label_vitamin_b12": label_vitamin_b12,
        "label_calcium": label_calcium,
        "label_folate": label_folate,
        "label_vitamin_a": label_vitamin_a,
        "label_vitamin_c": label_vitamin_c,
        "label_magnesium": label_magnesium,
        "label_zinc": label_zinc,
        "label_protein": label_protein
    })
    
    return df

if __name__ == "__main__":
    df = generate_nutritional_dataset()
    print(f"Generated synthetic clinical dataset with {df.shape[0]} rows and {df.shape[1]} features/targets.")

