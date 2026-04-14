/**
 * MITIGATION LIBRARY (PHASE 5 - COMPLETE)
 * Structured health recommendations calibrated for the Indian context.
 * Based on NFHS-5, ICMR-INDIAB, and clinical health guidelines.
 */
const MITIGATION_LIBRARY = [
  // --- ANEMIA (Step 42) ---
  {
    id: 'anemia_diet_palak',
    diseaseId: 'anemia',
    title: 'Iron-Rich Palak & Lemon',
    description: 'Consume spinach (Palak) with lemon. Vitamin C is critical to absorb non-heme iron from vegetarian sources.',
    priority: 'high',
    category: 'dietary',
    isRegional: true,
    rules: { dietType: ['Veg', 'Non-Veg'] }
  },
  {
    id: 'anemia_diet_beetroot',
    diseaseId: 'anemia',
    title: 'Beetroot Salad or Juice',
    description: 'Consume 100ml of fresh beetroot juice or a salad daily to support hemoglobin production.',
    priority: 'medium',
    category: 'dietary',
    isRegional: true,
    rules: {}
  },
  {
    id: 'anemia_diet_legumes_vitc',
    diseaseId: 'anemia',
    title: 'Lentils with Vitamin C',
    description: 'Always combine lentils (Dal) and legumes with a Vitamin C source like citrus or tomatoes.',
    priority: 'medium',
    category: 'dietary',
    isRegional: true,
    rules: {}
  },
  {
    id: 'anemia_avoid_tea',
    diseaseId: 'anemia',
    title: 'Avoid Tea/Coffee with Meals',
    description: 'Tannins in tea and coffee inhibit iron absorption. Maintain a 2-hour gap between tea and main meals.',
    priority: 'high',
    category: 'lifestyle',
    isRegional: true,
    rules: {}
  },

  // --- VITAMIN B12 (Step 42) ---
  {
    id: 'b12_paneer',
    diseaseId: 'vitamin_b12',
    title: 'Paneer & Dairy Support',
    description: 'Incorporate Paneer or fortified milk daily. Dairy is the primary natural B12 source for vegetarians.',
    priority: 'high',
    category: 'dietary',
    isRegional: true,
    rules: { dietType: ['Veg'] }
  },
  {
    id: 'b12_nutritional_yeast',
    diseaseId: 'vitamin_b12',
    title: 'Nutritional Yeast for Vegans',
    description: 'If avoiding dairy, use nutritional yeast as a savory seasoning to provide essential B12.',
    priority: 'medium',
    category: 'dietary',
    isRegional: false,
    rules: { dietType: ['Veg'] }
  },

  // --- VITAMIN D (Step 42) ---
  {
    id: 'vitd_sunlight_timing',
    diseaseId: 'vitamin_d',
    title: 'Optimal Sunlight Window',
    description: 'Aim for 15-20 min exposure between 11 AM and 1 PM for optimal D3 synthesis at Indian latitudes.',
    priority: 'high',
    category: 'lifestyle',
    isRegional: true,
    rules: {}
  },
  {
    id: 'vitd_mushrooms',
    diseaseId: 'vitamin_d',
    title: 'UV-Exposed Mushrooms',
    description: 'Placing mushrooms in direct sunlight for 30 mins before cooking can naturally increase their Vitamin D content.',
    priority: 'medium',
    category: 'dietary',
    isRegional: false,
    rules: {}
  },

  // --- THYROID (Step 42) ---
  {
    id: 'thyroid_selenium',
    diseaseId: 'thyroid',
    title: 'Selenium (Brazil Nuts/Sunflower)',
    description: 'One Brazil nut or a handful of sunflower seeds provides enough Selenium for thyroid function.',
    priority: 'medium',
    category: 'dietary',
    isRegional: false,
    rules: {}
  },
  {
    id: 'thyroid_iodized_salt',
    diseaseId: 'thyroid',
    title: 'Switch to Iodized Salt',
    description: 'Ensure you are using fortified iodized salt for all cooking to prevent goiter and thyroid strain.',
    priority: 'high',
    category: 'dietary',
    isRegional: true,
    rules: {}
  },
  {
    id: 'thyroid_yoga_halasana',
    diseaseId: 'thyroid',
    title: 'Halasana (Plow Pose)',
    description: 'Practice Halasana for 1-2 minutes daily to improve blood circulation to the thyroid gland.',
    priority: 'medium',
    category: 'lifestyle',
    isRegional: true,
    rules: {}
  },

  // --- FATTY LIVER (Step 42) ---
  {
    id: 'liver_karela',
    diseaseId: 'fatty_liver',
    title: 'Inclusion of Bitter Karela',
    description: 'Bitter gourd (Karela) contains compounds that help reduce hepatic fat accumulation.',
    priority: 'medium',
    category: 'dietary',
    isRegional: true,
    rules: {}
  },
  {
    id: 'liver_sugar_cut',
    diseaseId: 'fatty_liver',
    title: 'Reduce Refined Sugars',
    description: 'Cut down on soft drinks and sweets. Excess fructose is directly converted to liver fat.',
    priority: 'high',
    category: 'dietary',
    isRegional: true,
    rules: {}
  },

  // --- DIABETES (Step 42) ---
  {
    id: 'diabetes_millet_rice',
    diseaseId: 'diabetes',
    title: 'Millet to Rice Ratio',
    description: 'Aim for a 50:50 mix of Brown Rice and Millets (Ragi/Bajra) to significantly lower the meal GI.',
    priority: 'high',
    category: 'dietary',
    isRegional: true,
    rules: {}
  },
  {
    id: 'diabetes_portion_katori',
    diseaseId: 'diabetes',
    title: 'Traditional Portion Control',
    description: 'Limit your grain intake to one small Katori per meal, filling half the plate with green vegetables.',
    priority: 'medium',
    category: 'dietary',
    isRegional: true,
    rules: {}
  },
  {
    id: 'diabetes_methi_seeds',
    diseaseId: 'diabetes',
    title: 'Fenugreek (Methi) Seeds',
    description: 'Soak 1 teaspoon of methi seeds overnight and consume in the morning. Helps improve glucose tolerance.',
    priority: 'high',
    category: 'dietary',
    isRegional: true,
    rules: {}
  },
  {
    id: 'diabetes_walking_post_meal',
    diseaseId: 'diabetes',
    title: 'Post-Meal Walking (Shatapavali)',
    description: 'Walk 100 steps after each meal (especially dinner) to significantly reduce postprandial blood sugar spikes.',
    priority: 'high',
    category: 'lifestyle',
    isRegional: true,
    rules: {}
  },
  {
    id: 'diabetes_monitor_hba1c',
    diseaseId: 'diabetes',
    title: 'Regular HbA1c Monitoring',
    description: 'Check HbA1c every 3 months to track long-term glucose control and adjust management plan.',
    priority: 'medium',
    category: 'monitoring',
    isRegional: false,
    rules: {}
  },

  // --- HYPERTENSION ---
  {
    id: 'htn_salt_reduction',
    diseaseId: 'hypertension',
    title: 'Reduce Salt Intake to <5g/day',
    description: 'Limit salt to less than 1 teaspoon per day. Avoid processed foods, papads, pickles, and packaged snacks high in sodium.',
    priority: 'high',
    category: 'dietary',
    isRegional: true,
    rules: {}
  },
  {
    id: 'htn_dash_diet',
    diseaseId: 'hypertension',
    title: 'DASH Diet - Fruits & Vegetables',
    description: 'Increase potassium-rich foods: bananas, coconut water, spinach, and sweet potatoes to counter sodium effects.',
    priority: 'high',
    category: 'dietary',
    isRegional: true,
    rules: {}
  },
  {
    id: 'htn_hibiscus_tea',
    diseaseId: 'hypertension',
    title: 'Hibiscus (Gudhal) Tea',
    description: 'Drink 1-2 cups of hibiscus tea daily. Studies show it can lower systolic BP by 7-10 mmHg.',
    priority: 'medium',
    category: 'dietary',
    isRegional: true,
    rules: {}
  },
  {
    id: 'htn_pranayama_anulom_vilom',
    diseaseId: 'hypertension',
    title: 'Anulom Vilom Pranayama',
    description: 'Practice alternate nostril breathing for 15-20 minutes daily. Proven to reduce both systolic and diastolic BP.',
    priority: 'high',
    category: 'lifestyle',
    isRegional: true,
    rules: {}
  },
  {
    id: 'htn_weight_management',
    diseaseId: 'hypertension',
    title: 'Weight Reduction (If Overweight)',
    description: 'Losing even 5-10% of body weight can significantly lower blood pressure. Focus on gradual, sustainable loss.',
    priority: 'high',
    category: 'lifestyle',
    isRegional: false,
    rules: {}
  },
  {
    id: 'htn_stress_management',
    diseaseId: 'hypertension',
    title: 'Stress Management & Meditation',
    description: 'Practice yoga, meditation, or deep breathing for 10-15 minutes daily to reduce stress-related BP spikes.',
    priority: 'medium',
    category: 'lifestyle',
    isRegional: true,
    rules: {}
  },
  {
    id: 'htn_limit_alcohol',
    diseaseId: 'hypertension',
    title: 'Limit Alcohol Consumption',
    description: 'Restrict alcohol to moderate levels (max 1 drink/day for women, 2 for men). Excessive drinking raises BP significantly.',
    priority: 'high',
    category: 'lifestyle',
    isRegional: false,
    rules: {}
  },
  {
    id: 'htn_regular_monitoring',
    diseaseId: 'hypertension',
    title: 'Daily BP Monitoring',
    description: 'Check blood pressure at the same time daily (morning & evening). Keep a log to share with your doctor.',
    priority: 'high',
    category: 'monitoring',
    isRegional: false,
    rules: {}
  },
  {
    id: 'htn_quit_smoking',
    diseaseId: 'hypertension',
    title: 'Quit Smoking Immediately',
    description: 'Smoking causes immediate BP spikes and long-term arterial damage. Seek support to quit - it\'s the single best thing you can do.',
    priority: 'high',
    category: 'precaution',
    isRegional: false,
    rules: {}
  },
  {
    id: 'htn_garlic_benefit',
    diseaseId: 'hypertension',
    title: 'Garlic Supplementation',
    description: 'Aged garlic extract (600-1200mg/day) may help lower BP by 10-15 mmHg. Consult doctor before starting.',
    priority: 'low',
    category: 'dietary',
    isRegional: true,
    rules: {}
  },

  // --- LIFESTYLE & STRESS (Step 43) ---
  {
    id: 'life_stair_climb',
    diseaseId: 'obesity',
    title: 'Stair Climbing Challenge',
    description: 'Instead of the elevator, climb 3 flights of stairs daily to significantly boost cardio-metabolic rate.',
    priority: 'medium',
    category: 'lifestyle',
    isRegional: true,
    rules: { activityLevel: ['Sedentary', 'Occasional'] }
  },
  {
    id: 'life_digital_detox',
    diseaseId: 'anxiety',
    title: 'Digital Detox (Before Sleep)',
    description: 'No screens 60 minutes before bed to reduce blue light inhibition of melatonin and lower anxiety.',
    priority: 'high',
    category: 'lifestyle',
    isRegional: false,
    rules: {}
  },
  {
    id: 'life_sleep_hygiene',
    diseaseId: 'sleep_disorders',
    title: 'Indian Sleep Hygiene',
    description: 'Wash feet with lukewarm water before bed (Pada Abhyanga) to induce deep, restful sleep.',
    priority: 'medium',
    category: 'lifestyle',
    isRegional: true,
    rules: {}
  },
  {
    id: 'life_pranayama_bramhari',
    diseaseId: 'anxiety',
    title: 'Bhramari Pranayama',
    description: 'Humming Bee breath for 5-10 mins to soothe the nervous system and manage panic symptoms.',
    priority: 'high',
    category: 'lifestyle',
    isRegional: true,
    rules: {}
  },

  // --- PCOS (Gender Locked - Step 48) ---
  {
    id: 'pcos_diet_spearmint',
    diseaseId: 'pcos',
    title: 'Spearmint Tea (Twice Daily)',
    description: 'Studies suggest spearmint tea can help lower androgen levels in women with PCOS.',
    priority: 'medium',
    category: 'dietary',
    isRegional: false,
    rules: { gender: ['female'] }
  },
  {
    id: 'pcos_lifestyle_cycling',
    diseaseId: 'pcos',
    title: 'Regular Weight Training',
    description: 'Improving muscle mass helps combat insulin resistance, a core driver of PCOS symptoms.',
    priority: 'high',
    category: 'lifestyle',
    isRegional: false,
    rules: { gender: ['female'] }
  }
];

module.exports = { MITIGATION_LIBRARY };
