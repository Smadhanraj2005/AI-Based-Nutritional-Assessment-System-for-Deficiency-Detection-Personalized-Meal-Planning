import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Sparkles,
  Utensils,
  Calendar,
  Activity,
  ArrowRight,
  CheckCircle2,
  Brain,
  TrendingUp,
  User,
  ChevronRight,
  Zap,
  TestTube2,
  Pill,
  HeartPulse,
  HelpCircle,
  ChevronDown,
  Award,
  Lightbulb,
  Lock,
  Layers,
  Database,
  Sliders
} from "lucide-react";
import heroDashboardImg from "../assets/hero_dashboard.jpg";
import mealShowcaseImg from "../assets/meal_showcase.jpg";
import logoImg from "../assets/logo.png";

const FEATURES = [
  {
    id: "deficiency-detection",
    icon: Brain,
    title: "13-Feature AI Diagnosis",
    description: "Multi-output machine learning model trained to analyze intake averages and detect micronutrient deficiency risks.",
    color: "#10b981",
    bg: "rgba(16, 185, 129, 0.1)",
    tag: "Clinical ML Engine"
  },
  {
    id: "meal-planning",
    icon: Utensils,
    title: "7-Day Dynamic Meal Schedules",
    description: "Algorithmically compiles personalized 7-day culinary plans tailored to target your specific deficiencies while respecting vegetarian & dietary filters.",
    color: "#6366f1",
    bg: "rgba(99, 102, 241, 0.1)",
    tag: "100% Tailored"
  },
  {
    id: "dietary-diary",
    icon: Calendar,
    title: "Smart Dietary Diary",
    description: "Effortlessly log daily meals with an Indian food database to track daily iron, calcium, vitamin D, B12, and macro intake.",
    color: "#f59e0b",
    bg: "rgba(245, 158, 11, 0.1)",
    tag: "Nutrient Calculator"
  },
  {
    id: "progress-tracking",
    icon: TrendingUp,
    title: "Longitudinal Analytics",
    description: "Track risk reduction curves and health score improvements across 4, 8, and 12 weeks of plan adherence.",
    color: "#ec4899",
    bg: "rgba(236, 72, 153, 0.1)",
    tag: "Progress Tracker"
  }
];

const STEPS = [
  {
    step: "01",
    title: "Log Daily Foods & Symptoms",
    desc: "Record your daily meals and check off any clinical symptoms or upload lab test results."
  },
  {
    step: "02",
    title: "Run AI Deficiency Assessment",
    desc: "Our Random Forest ML engine processes 13 health features to quantify your deficiency probabilities."
  },
  {
    step: "03",
    title: "Get Your 7-Day Corrective Plan",
    desc: "Receive a personalized 7-day nutrient-dense meal schedule designed to correct your specific deficiencies."
  }
];

const MICRONUTRIENTS_DATA = [
  { name: "Iron (Fe)", rda: "18 mg/day", indicator: "Fatigue, pale skin, brittle nails", foods: "Spinach, Lentils, Pumpkin seeds, Tofu" },
  { name: "Calcium (Ca)", rda: "1000 mg/day", indicator: "Bone density loss, muscle cramps", foods: "Chia seeds, Almonds, Sesame, Fortified Milk" },
  { name: "Vitamin D", rda: "600 IU/day", indicator: "Joint pain, low immunity, bone soreness", foods: "Sunlight exposure, Fortified cereals, Eggs" },
  { name: "Vitamin B12", rda: "2.4 mcg/day", indicator: "Brain fog, numbness, tingling in hands", foods: "Nutritional yeast, Dairy, Fortified plant milk" },
  { name: "Vitamin A", rda: "900 mcg/day", indicator: "Night blindness, dry eyes, skin rashes", foods: "Sweet potatoes, Carrots, Guava, Spinach" },
  { name: "Vitamin C", rda: "90 mg/day", indicator: "Bleeding gums, slow wound healing", foods: "Amla, Guava, Bell peppers, Citrus fruits" },
  { name: "Magnesium (Mg)", rda: "420 mg/day", indicator: "Muscle twitches, insomnia, anxiety", foods: "Dark chocolate, Pumpkin seeds, Quinoa" },
  { name: "Zinc (Zn)", rda: "11 mg/day", indicator: "Hair thinning, delayed healing, loss of taste", foods: "Chickpeas, Cashews, Whole grains, Seeds" }
];

const FAQ_ITEMS = [
  {
    q: "How does the AI model calculate my deficiency risks?",
    a: "NutriAI uses a multi-output Random Forest classifier trained on 13 clinical health features derived from your average 3+ day dietary logs, self-reported symptoms, and laboratory blood tests. Features are normalized using standard preprocessing models trained on clinical NHANES & Indian dietary data."
  },
  {
    q: "Can NutriAI accommodate strict vegetarian or vegan diets?",
    a: "Yes! NutriAI features a two-layer dietary restriction filter. SQL queries pre-filter food databases for vegan or vegetarian tags, while Python keyword filters eliminate potential leaks (e.g. gluten, dairy, or nut allergens) to build 100% compliant meal schedules."
  },
  {
    q: "What happens if I upload blood test lab results?",
    a: "Blood test biomarkers (such as Serum Ferritin, Hemoglobin, Vitamin D3 ng/mL, and B12 pg/mL) trigger Bayesian clinical overrides. When lab results indicate deficiency, the probability risk is automatically boosted using maximum safety bounds."
  },
  {
    q: "Are the suggested 7-day meal plans editable?",
    a: "Every single meal in your 7-day plan includes 2 to 3 diet-compliant replacement food items. You can easily substitute any dish while maintaining full nutrient sufficiency target coverage."
  }
];

export default function LandingPage({ onGoToLogin, onGoToRegister }) {
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="landing-container" style={{ minHeight: "100vh", background: "var(--bg-page)", color: "var(--text-main)", fontFamily: "var(--font-body)" }}>

      {/* ── Top Navbar ── */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 48px",
          background: scrolled ? "var(--bg-card-solid)" : "transparent",
          backdropFilter: scrolled ? "blur(16px)" : "none",
          borderBottom: scrolled ? "1px solid var(--border-glass)" : "1px solid transparent",
          boxShadow: scrolled ? "var(--shadow-sm)" : "none",
          transition: "all 0.3s ease"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img
            src={logoImg}
            alt="NutriAI Logo"
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              objectFit: "cover",
              boxShadow: "0 4px 16px rgba(16, 185, 129, 0.35)",
              border: "1px solid rgba(16, 185, 129, 0.3)"
            }}
          />
          <div>
            <span style={{ fontSize: "1.3rem", fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text-main)" }}>
              Nutri<span style={{ color: "var(--primary)" }}>AI</span>
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <a href="#features" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.9rem", fontWeight: 600, transition: "color 0.2s" }} onMouseEnter={e => e.target.style.color = "var(--primary)"} onMouseLeave={e => e.target.style.color = "var(--text-muted)"}>
            Features
          </a>
          <a href="#how-it-works" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.9rem", fontWeight: 600, transition: "color 0.2s" }} onMouseEnter={e => e.target.style.color = "var(--primary)"} onMouseLeave={e => e.target.style.color = "var(--text-muted)"}>
            How It Works
          </a>
          <a href="#impact" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.9rem", fontWeight: 600, transition: "color 0.2s" }} onMouseEnter={e => e.target.style.color = "var(--primary)"} onMouseLeave={e => e.target.style.color = "var(--text-muted)"}>
            Analytics
          </a>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button
            id="lp-login-btn"
            className="btn-secondary"
            onClick={onGoToLogin}
            style={{ padding: "8px 20px", fontSize: "0.88rem", fontWeight: 600, borderRadius: 10 }}
          >
            Log In
          </button>
          <button
            id="lp-signup-btn"
            className="btn-primary"
            onClick={onGoToRegister}
            style={{ padding: "8px 22px", fontSize: "0.88rem", fontWeight: 600, borderRadius: 10 }}
          >
            Sign Up Free
          </button>
        </div>
      </nav>

      {/* ── Hero Section (Clean Centered Layout) ── */}
      <section
        style={{
          paddingTop: 140,
          paddingBottom: 90,
          maxWidth: 960,
          margin: "0 auto",
          paddingLeft: 24,
          paddingRight: 24,
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 28
        }}
      >
        {/* Pre-title badge */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 18px", borderRadius: 30, background: "rgba(16, 185, 129, 0.12)", border: "1px solid rgba(16, 185, 129, 0.35)" }}>
          <Sparkles size={16} color="var(--primary)" />
          <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--primary-light)", letterSpacing: "0.02em" }}>
            AI Deficiency Diagnosis &amp; Personalized Meal Planning
          </span>
        </div>

        {/* Main Headline */}
        <h1 style={{ fontSize: "clamp(2.5rem, 5vw, 3.6rem)", fontWeight: 900, lineHeight: 1.15, color: "var(--text-main)", letterSpacing: "-0.03em", maxWidth: 850 }}>
          <span style={{ color: "var(--text-main)" }}>Detect Deficiencies. Optimize Health.</span><br />
          <span style={{ background: "linear-gradient(135deg, var(--primary) 0%, #34d399 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Decoded by Science &amp; AI.
          </span>
        </h1>

        {/* Subtitle */}
        <p style={{ fontSize: "1.1rem", color: "var(--text-muted)", lineHeight: 1.7, maxWidth: 680, margin: "0 auto" }}>
          Smart nutritional assessment platform that evaluates daily diet logs and lab values to identify micronutrient risks and build targeted 7-day corrective meal plans.
        </p>

        {/* Action CTAs */}
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center", marginTop: 8 }}>
          <button
            id="lp-hero-login-btn"
            className="btn-primary"
            onClick={onGoToLogin}
            style={{ padding: "14px 34px", fontSize: "1rem", fontWeight: 700, borderRadius: 12, display: "inline-flex", alignItems: "center", gap: 8, boxShadow: "0 8px 24px rgba(16, 185, 129, 0.35)" }}
          >
            Get Started Free <ArrowRight size={18} />
          </button>

          <button
            id="lp-hero-signup-btn"
            className="btn-secondary"
            onClick={onGoToRegister}
            style={{ padding: "14px 28px", fontSize: "1rem", fontWeight: 600, borderRadius: 12, display: "inline-flex", alignItems: "center", gap: 8 }}
          >
            <User size={18} color="var(--primary)" /> Create Free Account
          </button>
        </div>

        {/* Hero Interactive UI Preview Showcase Image */}
        <div style={{
          width: "100%",
          maxWidth: 1040,
          marginTop: 20,
          marginBottom: 10,
          position: "relative",
          borderRadius: 20,
          padding: 8,
          background: "linear-gradient(135deg, rgba(16, 185, 129, 0.3) 0%, rgba(99, 102, 241, 0.2) 100%)",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(16, 185, 129, 0.15)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          overflow: "hidden"
        }}>
          <div style={{
            position: "absolute",
            top: -50,
            left: "20%",
            width: 300,
            height: 300,
            background: "radial-gradient(circle, rgba(16,185,129,0.3) 0%, transparent 70%)",
            pointerEvents: "none",
            filter: "blur(40px)"
          }} />
          <img
            src={heroDashboardImg}
            alt="NutriAI Clinical Diagnosis & Meal Planner Dashboard Mockup"
            style={{
              width: "100%",
              height: "auto",
              display: "block",
              borderRadius: 14,
              border: "1px solid var(--border-glass)"
            }}
          />
        </div>

        {/* Trust Badges Bar */}
        <div style={{ display: "flex", gap: 28, paddingTop: 24, borderTop: "1px solid var(--border-glass)", flexWrap: "wrap", justifyContent: "center", width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.88rem", color: "var(--text-muted)", fontWeight: 500 }}>
            <CheckCircle2 size={18} color="var(--primary)" /> 10+ Micronutrients Assessed
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.88rem", color: "var(--text-muted)", fontWeight: 500 }}>
            <CheckCircle2 size={18} color="var(--primary)" /> 100% Personalized Plans
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.88rem", color: "var(--text-muted)", fontWeight: 500 }}>
            <CheckCircle2 size={18} color="var(--primary)" /> 7-Day Targeted Schedules
          </div>
        </div>
      </section>

      {/* ── Visual Showcase Section: AI Meal Mapping & Intelligence ── */}
      <section style={{ padding: "80px 32px", background: "linear-gradient(180deg, var(--bg-page) 0%, rgba(255, 255, 255, 0.12) 100%)", borderTop: "1px solid var(--border-glass)" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 48, alignItems: "center" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 20, background: "rgba(99, 102, 241, 0.15)", border: "1px solid rgba(99, 102, 241, 0.3)", marginBottom: 16 }}>
              <Zap size={14} color="#818cf8" />
              <span style={{ fontSize: "0.76rem", color: "#818cf8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Precision Dietary Intelligence
              </span>
            </div>
            <h2 style={{ fontSize: "2.4rem", fontWeight: 800, color: "var(--text-main)", lineHeight: 1.2, marginBottom: 18 }}>
              Automated Micronutrient Mapping for Every Meal
            </h2>
            <p style={{ fontSize: "0.95rem", color: "var(--text-muted)", lineHeight: 1.7, marginBottom: 24 }}>
              NutriAI analyzes food compositions down to individual micro-density values. Our engine matches your detected deficiencies (Iron, Calcium, Vit D, B12, Folate) with optimal bioavailable food sources from Indian and global nutritional databases.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 32 }}>
              {[
                { title: "Real-time RDA Tracking", desc: "Instant nutrient distribution graphs for iron, calcium, vitamin D, and B12." },
                { title: "Diet-Compliant Replacements", desc: "2 to 3 alternative ingredient options for every single scheduled meal." },
                { title: "Allergy & Preference Filtering", desc: "Strict safety filters for Vegetarian, Vegan, Gluten-Free, and Nut allergies." }
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(16, 185, 129, 0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                    <CheckCircle2 size={15} color="#10b981" />
                  </div>
                  <div>
                    <strong style={{ fontSize: "0.92rem", color: "var(--text-main)", display: "block" }}>{item.title}</strong>
                    <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>{item.desc}</span>
                  </div>
                </div>
              ))}
            </div>
            <button
              className="btn-primary"
              onClick={onGoToRegister}
              style={{ padding: "12px 28px", fontSize: "0.92rem", fontWeight: 700, borderRadius: 10, display: "inline-flex", alignItems: "center", gap: 8 }}
            >
              Explore AI Meal Planner <ArrowRight size={16} />
            </button>
          </div>

          <div style={{ position: "relative" }}>
            <div style={{
              position: "absolute",
              inset: -20,
              background: "radial-gradient(circle, rgba(16,185,129,0.15) 0%, rgba(99,102,241,0.1) 60%, transparent 80%)",
              borderRadius: 30,
              filter: "blur(30px)",
              pointerEvents: "none"
            }} />
            <div className="glass-card" style={{ padding: 12, borderRadius: 20, border: "1px solid rgba(255, 255, 255, 0.12)", boxShadow: "0 20px 50px rgba(0,0,0,0.5)" }}>
              <img
                src={mealShowcaseImg}
                alt="AI Micronutrient Mapping & Food Database Showcase"
                style={{ width: "100%", height: "auto", display: "block", borderRadius: 14 }}
              />
            </div>
          </div>
        </div>
      </section>




      {/* ── Interactive FAQ Section ── */}
      <section style={{ padding: "80px 32px", borderTop: "1px solid var(--border-glass)" }}>
        <div style={{ maxWidth: 880, margin: "0 auto" }}>
          <div style={{ textAlign: "center", margin: "0 auto 48px" }}>
            <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--primary)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>
              Got Questions?
            </span>
            <h2 style={{ fontSize: "2.2rem", fontWeight: 800, color: "var(--text-main)", margin: 0 }}>
              Frequently Asked Questions
            </h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {FAQ_ITEMS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="glass-card"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  style={{ padding: "18px 24px", cursor: "pointer", transition: "all 0.2s ease" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
                    <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-main)", margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
                      <HelpCircle size={18} color="var(--primary)" /> {faq.q}
                    </h3>
                    <ChevronDown size={18} color="var(--text-muted)" style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.25s ease", flexShrink: 0 }} />
                  </div>
                  {isOpen && (
                    <p style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border-glass)", fontSize: "0.9rem", color: "var(--text-muted)", lineHeight: 1.65, margin: "14px 0 0 0" }}>
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Core Features Section ── */}
      <section id="features" style={{ padding: "80px 32px", background: "rgba(255, 255, 255, 0.01)", borderTop: "1px solid var(--border-glass)" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>

          <div style={{ textAlign: "center", maxWidth: 600, margin: "0 auto 56px" }}>
            <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--primary)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>
              Intelligent Healthcare
            </span>
            <h2 style={{ fontSize: "2.2rem", fontWeight: 800, color: "var(--text-main)", margin: "0 0 12px 0" }}>
              Core Features &amp; AI Capabilities
            </h2>
            <p style={{ fontSize: "0.95rem", color: "var(--text-muted)", margin: 0 }}>
              Four integrated pillars of nutritional intelligence designed to optimize your health.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24 }}>
            {FEATURES.map((f) => {
              const IconComp = f.icon;
              return (
                <div
                  key={f.id}
                  id={`feature-card-${f.id}`}
                  className="glass-card"
                  style={{
                    padding: 28,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    transition: "all 0.3s ease"
                  }}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                      <div style={{ width: 48, height: 48, borderRadius: 12, background: f.bg, display: "flex", alignItems: "center", justifyContent: "center", color: f.color }}>
                        <IconComp size={24} />
                      </div>
                      <span style={{ fontSize: "0.72rem", padding: "3px 8px", borderRadius: 6, background: f.bg, color: f.color, fontWeight: 600 }}>
                        {f.tag}
                      </span>
                    </div>

                    <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--text-main)", marginBottom: 10 }}>
                      {f.title}
                    </h3>

                    <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", lineHeight: 1.6, margin: 0 }}>
                      {f.description}
                    </p>
                  </div>

                  <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--border-glass)", display: "flex", alignItems: "center", gap: 6, fontSize: "0.82rem", color: f.color, fontWeight: 600, cursor: "pointer" }} onClick={onGoToRegister}>
                    Explore Feature <ChevronRight size={14} />
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ── How It Works Section ── */}
      <section id="how-it-works" style={{ padding: "80px 32px", borderTop: "1px solid var(--border-glass)" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>

          <div style={{ textAlign: "center", maxWidth: 600, margin: "0 auto 56px" }}>
            <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--primary)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>
              Simple 3-Step Process
            </span>
            <h2 style={{ fontSize: "2.2rem", fontWeight: 800, color: "var(--text-main)", margin: 0 }}>
              How NutriAI Works
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 28 }}>
            {STEPS.map((s, idx) => (
              <div key={idx} className="glass-card" style={{ padding: 32, position: "relative" }}>
                <span style={{ fontSize: "2.5rem", fontWeight: 900, color: "var(--primary-glow)", position: "absolute", top: 20, right: 24 }}>
                  {s.step}
                </span>

                <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(16, 185, 129, 0.15)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "1rem", marginBottom: 20 }}>
                  {idx + 1}
                </div>

                <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-main)", marginBottom: 10 }}>
                  {s.title}
                </h3>

                <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", lineHeight: 1.6, margin: 0 }}>
                  {s.desc}
                </p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── Metrics Counter Bar ── */}
      <section id="impact" style={{ padding: "48px 32px", background: "linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(99, 102, 241, 0.08) 100%)", borderTop: "1px solid var(--border-glass)", borderBottom: "1px solid var(--border-glass)" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: 32, textAlign: "center" }}>
          {[
            { num: "10+", label: "Micronutrients Tracked" },
            { num: "100%", label: "Personalized Insights" },
            { num: "7-Day", label: "Dynamic Corrective Schedules" },
            { num: "24/7", label: "Automated ML Inference" }
          ].map((stat, i) => (
            <div key={i}>
              <div style={{ fontSize: "2.4rem", fontWeight: 900, color: "var(--text-main)", letterSpacing: "-0.02em" }}>{stat.num}</div>
              <div style={{ fontSize: "0.85rem", color: "var(--primary-light)", fontWeight: 600, marginTop: 4 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer CTA Banner ── */}
      <section style={{ padding: "80px 32px", textAlign: "center" }}>
        <div className="glass-card" style={{ maxWidth: 840, margin: "0 auto", padding: 56, background: "linear-gradient(135deg, var(--bg-card-solid), var(--bg-card))", border: "1px solid rgba(16, 185, 129, 0.3)" }}>
          <ShieldCheck size={48} color="var(--primary)" style={{ margin: "0 auto 16px" }} />
          <h2 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--text-main)", marginBottom: 12 }}>
            Ready to Optimize Your Nutritional Health?
          </h2>
          <p style={{ fontSize: "0.95rem", color: "var(--text-muted)", maxWidth: 500, margin: "0 auto 28px" }}>
            Join NutriAI today to receive instant AI deficiency analysis and tailored meal recommendations.
          </p>
          <button
            id="lp-footer-signup-btn"
            className="btn-primary"
            onClick={onGoToRegister}
            style={{ padding: "14px 36px", fontSize: "1rem", fontWeight: 700, borderRadius: 12, margin: "0 auto", display: "inline-flex", alignItems: "center", gap: 8 }}
          >
            Get Started Free <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ padding: "32px 48px", borderTop: "1px solid var(--border-glass)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16, fontSize: "0.85rem", color: "var(--text-muted)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <ShieldCheck size={18} color="var(--primary)" />
          <span>&copy; 2026 NutriAI &mdash; AI-Based Nutritional Assessment System</span>
        </div>

        <div style={{ display: "flex", gap: 20 }}>
          <a href="#features" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Features</a>
          <a href="#how-it-works" style={{ color: "var(--text-muted)", textDecoration: "none" }}>How It Works</a>
          <a href="#" onClick={(e) => { e.preventDefault(); onGoToLogin(); }} style={{ color: "var(--primary-light)", textDecoration: "none", fontWeight: 600 }}>Log In</a>
          <a href="#" onClick={(e) => { e.preventDefault(); onGoToRegister(); }} style={{ color: "var(--primary-light)", textDecoration: "none", fontWeight: 600 }}>Sign Up</a>
        </div>
      </footer>

    </div>
  );
}
