export const ACTIVITY_TYPES = [
  { value: "hike", label: "Hike" },
  { value: "run", label: "Run" },
  { value: "cycle", label: "Cycle" },
  { value: "swim", label: "Swim" },
  { value: "kayak", label: "Kayak" },
  { value: "canoe", label: "Canoe" },
  { value: "ski", label: "Ski" },
  { value: "horseriding", label: "Horse Riding" },
  { value: "drive", label: "Drive" },
  { value: "flight", label: "Flight" },
  { value: "boat", label: "Boat" },
  { value: "other", label: "Other" },
] as const;

export type ActivityType = typeof ACTIVITY_TYPES[number]['value'];

// Adventure icons for trip cards - randomly assigned on creation
export const ADVENTURE_ICONS = [
  "tent",
  "mountain",
  "trees",
  "compass",
  "map-pin",
  "sunrise",
  "campfire",
  "backpack",
  "binoculars",
  "cloud-sun",
  "flag",
  "footprints",
  "leaf",
  "star",
  "moon",
] as const;

export type AdventureIcon = typeof ADVENTURE_ICONS[number];

// Checklist items for trip planning - with aliases for fuzzy matching
// scope: "individual" = each person needs their own, "group" = one for the whole group
export const CHECKLIST_ITEMS: ChecklistItemDef[] = [
  // Gear - Individual
  { name: "Sunglasses", category: "essential", scope: "individual", gearCategory: "gear", aliases: ["sunnies", "shades"] },
  { name: "Mobile phone", category: "essential", scope: "individual", gearCategory: "gear", aliases: ["cell phone", "smartphone"] },
  { name: "Backpack", category: "essential", scope: "individual", gearCategory: "gear", aliases: ["rucksack", "knapsack", "daypack", "hiking pack", "hauler"] },
  { name: "Sleeping Bag or Quilt", category: "essential", scope: "individual", gearCategory: "gear", aliases: ["sleeping bag", "quilt", "doona", "mummy bag"] },
  { name: "Sleeping Pad", category: "essential", scope: "individual", gearCategory: "gear", aliases: ["sleeping mat", "mattress", "air mat", "foam mat", "thermarest", "self-inflating"] },
  { name: "Waterproof bag", category: "essential", scope: "individual", gearCategory: "gear", aliases: ["dry bag", "dry sack", "stuff sack"] },
  { name: "Bowl or plate", category: "essential", scope: "individual", gearCategory: "gear", aliases: ["mess kit", "camp bowl"] },
  { name: "Utensils", category: "essential", scope: "individual", gearCategory: "gear", aliases: ["spork", "camp cutlery", "fork", "spoon"] },
  { name: "Water bottle or bladder", category: "essential", scope: "individual", gearCategory: "gear", aliases: ["water bottle", "water bladder", "hydration bladder", "nalgene", "water reservoir", "drink bottle"] },
  { name: "Headlamp", category: "essential", scope: "individual", gearCategory: "gear", aliases: ["torch", "flashlight", "head light", "head torch", "head-torch"] },
  { name: "Shelter", category: "essential", scope: "individual", gearCategory: "gear", aliases: ["tent", "hammock", "bivy", "tarp", "swag", "fly"] },
  { name: "Rubbish bag(s)", category: "essential", scope: "individual", gearCategory: "gear", aliases: ["trash bag", "garbage bag", "waste bag"] },

  // Gear - Group
  { name: "Snake bite kit", category: "essential", scope: "group", gearCategory: "gear", aliases: ["snake kit", "venom kit"] },
  { name: "Emergency space blanket", category: "essential", scope: "group", gearCategory: "gear", aliases: ["space blanket", "emergency blanket", "thermal blanket"] },
  { name: "Shelter", category: "essential", scope: "group", gearCategory: "gear", aliases: ["tent", "hammock", "bivy", "tarp", "swag", "fly"] },
  { name: "Navigation", category: "essential", scope: "group", gearCategory: "gear", aliases: ["topographic map", "compass", "gps unit", "plb", "beacon", "inreach", "spot gen", "personal locator beacon"] },
  { name: "Stove", category: "essential", scope: "group", gearCategory: "gear", aliases: ["burner", "cooker", "cooking system", "gas stove", "spirit burner", "fuel stove"] },
  { name: "Fuel", category: "essential", scope: "group", gearCategory: "gear", aliases: ["gas canister", "isobutane", "propane", "methylated spirits", "fuel bottle"] },
  { name: "Lighter", category: "essential", scope: "group", gearCategory: "gear", aliases: ["matches", "fire starter", "firesteel"] },
  { name: "Water Filter", category: "essential", scope: "group", gearCategory: "gear", aliases: ["water purifier", "squeeze filter", "pump filter", "purification tablets", "aquatabs"] },

  // Clothing - Individual
  { name: "Rain Jacket", category: "essential", scope: "individual", gearCategory: "clothing", aliases: ["raincoat", "hardshell", "hard shell", "waterproof jacket", "poncho", "rain shell", "weatherproof jacket"] },
  { name: "Insulation Layer", category: "essential", scope: "individual", gearCategory: "clothing", aliases: ["puffy jacket", "down jacket", "synthetic jacket", "fleece", "midlayer", "pullover", "fleece jacket", "woolen mid layer"] },
  { name: "Warm hat or beanie", category: "essential", scope: "individual", gearCategory: "clothing", aliases: ["beanie", "wool hat", "winter hat"] },
  { name: "Gloves", category: "essential", scope: "individual", gearCategory: "clothing", aliases: ["mittens", "liner gloves"] },
  { name: "Sun hat", category: "essential", scope: "individual", gearCategory: "clothing", aliases: ["wide brim hat", "bucket hat", "legionnaire hat"] },
  { name: "Hiking boots or trail runners", category: "essential", scope: "individual", gearCategory: "clothing", aliases: ["hiking shoes", "trail shoes", "walking boots", "trekking boots"] },
  { name: "Socks (Short)", category: "essential", scope: "individual", gearCategory: "clothing", aliases: ["ankle socks", "liner socks", "short socks"] },
  { name: "Socks (Long)", category: "essential", scope: "individual", gearCategory: "clothing", aliases: ["hiking socks", "crew socks", "long socks", "wool socks", "merino socks"] },
  { name: "Gaiters", category: "essential", scope: "individual", gearCategory: "clothing", aliases: ["leg gaiters", "ankle gaiters"] },
  { name: "Mid layer shirt or long sleeved top", category: "essential", scope: "individual", gearCategory: "clothing", aliases: ["long sleeve", "hiking shirt"] },
  { name: "Shorts", category: "essential", scope: "individual", gearCategory: "clothing", aliases: ["hiking shorts", "running shorts"] },
  { name: "Base Layers", category: "essential", scope: "individual", gearCategory: "clothing", aliases: ["thermals", "long johns", "merino top", "merino bottom", "polypro", "thermal top", "thermal pants", "base layer"] },
  { name: "Camp top", category: "essential", scope: "individual", gearCategory: "clothing", aliases: ["camp shirt", "evening top"] },
  { name: "Camp bottoms", category: "essential", scope: "individual", gearCategory: "clothing", aliases: ["camp pants", "evening pants", "track pants"] },
  { name: "Neck warmer or ruff", category: "essential", scope: "individual", gearCategory: "clothing", aliases: ["buff", "neck gaiter", "snood", "balaclava"] },
  { name: "Waterproof pants", category: "essential", scope: "individual", gearCategory: "clothing", aliases: ["rain pants", "hard shell pants", "overpants"] },
  { name: "Toiletries", category: "essential", scope: "individual", gearCategory: "clothing", aliases: ["toothbrush", "toothpaste", "soap", "hygiene kit"] },
  { name: "Medications", category: "essential", scope: "individual", gearCategory: "clothing", aliases: ["medicine", "prescriptions", "first aid"] },

  // Clothing - Group
  { name: "Sunscreen", category: "essential", scope: "group", gearCategory: "clothing", aliases: ["sunblock", "sun cream", "spf"] },
  { name: "First Aid Kit", category: "essential", scope: "group", gearCategory: "clothing", aliases: ["medical kit", "plasters", "bandage", "emergency kit"] },
  { name: "Insect repellant", category: "essential", scope: "group", gearCategory: "clothing", aliases: ["bug spray", "mosquito repellent", "deet"] },
];

export interface ChecklistItemDef {
  name: string;
  category: string;
  scope: string;
  gearCategory: string;
  aliases: string[];
}

export type ChecklistItem = ChecklistItemDef;

export const GEAR_CATALOG = [
  // Pack
  { name: "Backpack", category: "gear", type: "Pack", weightGrams: 2200 },
  { name: "Day Pack", category: "gear", type: "Pack", weightGrams: 500 },
  { name: "Pack Liner", category: "gear", type: "Pack", weightGrams: 60 },
  { name: "Pack Rain Cover", category: "gear", type: "Pack", weightGrams: 100 },
  { name: "Dry Bag(s)", category: "gear", type: "Pack", weightGrams: 40 },
  { name: "Compression Sack", category: "gear", type: "Pack", weightGrams: 50 },
  { name: "Stuff Sacks", category: "gear", type: "Pack", weightGrams: 30 },
  { name: "Fanny Pack / Bum Bag", category: "gear", type: "Pack", weightGrams: 100 },
  { name: "Running Vest", category: "gear", type: "Pack", weightGrams: 300 },

  // Shelter
  { name: "1P Tent", category: "gear", type: "Shelter", weightGrams: 1200 },
  { name: "2P Tent", category: "gear", type: "Shelter", weightGrams: 1800 },
  { name: "3P Tent", category: "gear", type: "Shelter", weightGrams: 2400 },
  { name: "4P+ Tent", category: "gear", type: "Shelter", weightGrams: 3500 },
  { name: "Tarp", category: "gear", type: "Shelter", weightGrams: 400 },
  { name: "Bivy Sack", category: "gear", type: "Shelter", weightGrams: 300 },
  { name: "Tent Footprint / Groundsheet", category: "gear", type: "Shelter", weightGrams: 140 },
  { name: "Tent Stakes", category: "gear", type: "Shelter", weightGrams: 10 },

  // Sleep System
  { name: "Sleeping Bag", category: "gear", type: "Sleep System", weightGrams: 1200 },
  { name: "Sleeping Quilt", category: "gear", type: "Sleep System", weightGrams: 800 },
  { name: "Sleeping Pad", category: "gear", type: "Sleep System", weightGrams: 500 },
  { name: "Pillow", category: "gear", type: "Sleep System", weightGrams: 80 },
  { name: "Hammock", category: "gear", type: "Sleep System", weightGrams: 600 },

  // Cook System
  { name: "Stove", category: "gear", type: "Cook System", weightGrams: 100 },
  { name: "Fuel Canister", category: "gear", type: "Cook System", weightGrams: 220 },
  { name: "Cooking Pot", category: "gear", type: "Cook System", weightGrams: 150 },
  { name: "Pan", category: "gear", type: "Cook System", weightGrams: 300 },
  { name: "Bowl", category: "gear", type: "Cook System", weightGrams: 80 },
  { name: "Cup", category: "gear", type: "Cook System", weightGrams: 50 },
  { name: "Plate", category: "gear", type: "Cook System", weightGrams: 80 },
  { name: "Spork", category: "gear", type: "Cook System", weightGrams: 20 },
  { name: "Spoon", category: "gear", type: "Cook System", weightGrams: 20 },
  { name: "Knife", category: "gear", type: "Cook System", weightGrams: 25 },
  { name: "Fork", category: "gear", type: "Cook System", weightGrams: 15 },
  { name: "Scraper", category: "gear", type: "Cook System", weightGrams: 10 },
  { name: "Sponge", category: "gear", type: "Cook System", weightGrams: 10 },
  { name: "Lighter", category: "gear", type: "Cook System", weightGrams: 20 },
  { name: "Matches", category: "gear", type: "Cook System", weightGrams: 10 },

  // Hydration
  { name: "Water Filter", category: "gear", type: "Hydration", weightGrams: 80 },
  { name: "Water Purification Tablets", category: "gear", type: "Hydration", weightGrams: 30 },
  { name: "Water Bottle", category: "gear", type: "Hydration", weightGrams: 180 },
  { name: "Water Bladder", category: "gear", type: "Hydration", weightGrams: 150 },

  // Navigation
  { name: "Map", category: "gear", type: "Navigation", weightGrams: 50 },
  { name: "Compass", category: "gear", type: "Navigation", weightGrams: 30 },
  { name: "GPS Watch", category: "gear", type: "Navigation", weightGrams: 50 },
  { name: "GPS Unit", category: "gear", type: "Navigation", weightGrams: 200 },
  { name: "Binoculars", category: "gear", type: "Navigation", weightGrams: 250 },

  // Electronics
  { name: "Head Torch", category: "gear", type: "Electronics", weightGrams: 90 },
  { name: "Spare Batteries", category: "gear", type: "Electronics", weightGrams: 35 },
  { name: "Power Bank", category: "gear", type: "Electronics", weightGrams: 180 },
  { name: "Mobile Phone", category: "gear", type: "Electronics", weightGrams: 200 },
  { name: "Charging Cable(s)", category: "gear", type: "Electronics", weightGrams: 40 },
  { name: "Wall Charger", category: "gear", type: "Electronics", weightGrams: 60 },
  { name: "Solar Panel", category: "gear", type: "Electronics", weightGrams: 300 },
  { name: "Camera", category: "gear", type: "Electronics", weightGrams: 400 },
  { name: "Earbuds", category: "gear", type: "Electronics", weightGrams: 40 },
  { name: "Kindle", category: "gear", type: "Electronics", weightGrams: 120 },

  // Safety
  { name: "PLB (Emergency Beacon)", category: "gear", type: "Safety", weightGrams: 120 },
  { name: "Satellite Messenger", category: "gear", type: "Safety", weightGrams: 110 },
  { name: "Emergency Space Blanket", category: "gear", type: "Safety", weightGrams: 50 },
  { name: "Whistle", category: "gear", type: "Safety", weightGrams: 10 },
  { name: "Signal Mirror", category: "gear", type: "Safety", weightGrams: 20 },

  // First Aid
  { name: "First Aid Kit", category: "gear", type: "First Aid", weightGrams: 300 },
  { name: "Snake Bite Kit", category: "gear", type: "First Aid", weightGrams: 150 },
  { name: "Blister Kit", category: "gear", type: "First Aid", weightGrams: 30 },
  { name: "Pain Relief", category: "gear", type: "First Aid", weightGrams: 20 },
  { name: "Antihistamines", category: "gear", type: "First Aid", weightGrams: 10 },
  { name: "Tweezers", category: "gear", type: "First Aid", weightGrams: 10 },

  // Hygiene
  { name: "Poop Trowel", category: "gear", type: "Hygiene", weightGrams: 30 },
  { name: "Toilet Paper", category: "gear", type: "Hygiene", weightGrams: 45 },
  { name: "Rubbish Bags", category: "gear", type: "Hygiene", weightGrams: 20 },
  { name: "Towel", category: "gear", type: "Hygiene", weightGrams: 80 },

  // Toiletries
  { name: "Hand Sanitizer", category: "gear", type: "Toiletries", weightGrams: 40 },
  { name: "Toothbrush", category: "gear", type: "Toiletries", weightGrams: 15 },
  { name: "Toothpaste", category: "gear", type: "Toiletries", weightGrams: 30 },
  { name: "Sunscreen", category: "gear", type: "Toiletries", weightGrams: 50 },
  { name: "Lip Balm", category: "gear", type: "Toiletries", weightGrams: 10 },
  { name: "Soap", category: "gear", type: "Toiletries", weightGrams: 30 },
  { name: "Insect Repellent", category: "gear", type: "Toiletries", weightGrams: 40 },

  // Accessories (Gear)
  { name: "Trekking Poles", category: "gear", type: "Accessories", weightGrams: 220 },
  { name: "Multitool", category: "gear", type: "Accessories", weightGrams: 80 },
  { name: "Pocket Knife", category: "gear", type: "Accessories", weightGrams: 80 },
  { name: "Notebook", category: "gear", type: "Accessories", weightGrams: 20 },
  { name: "Pencil", category: "gear", type: "Accessories", weightGrams: 20 },
  { name: "Book", category: "gear", type: "Accessories", weightGrams: 180 },
  { name: "Cards / Game", category: "gear", type: "Accessories", weightGrams: 100 },
  { name: "Scissors", category: "gear", type: "Accessories", weightGrams: 15 },
  { name: "Zip Ties", category: "gear", type: "Accessories", weightGrams: 10 },
  { name: "Duct Tape", category: "gear", type: "Accessories", weightGrams: 30 },
  { name: "Gear Repair Tape", category: "gear", type: "Accessories", weightGrams: 20 },
  { name: "Cord / Paracord", category: "gear", type: "Accessories", weightGrams: 50 },
  { name: "Sewing Kit", category: "gear", type: "Accessories", weightGrams: 20 },
  { name: "Safety Pins", category: "gear", type: "Accessories", weightGrams: 5 },
  { name: "Carabiner(s)", category: "gear", type: "Accessories", weightGrams: 20 },
  { name: "Camp Chair", category: "gear", type: "Accessories", weightGrams: 900 },
  { name: "Seat Pad", category: "gear", type: "Accessories", weightGrams: 60 },
  { name: "Umbrella", category: "gear", type: "Accessories", weightGrams: 220 },
  { name: "Mosquito Head Net", category: "gear", type: "Accessories", weightGrams: 20 },

  // Clothing - Footwear
  { name: "Hiking Boots", category: "clothing", type: "Footwear", weightGrams: 1400 },
  { name: "Trail Runners", category: "clothing", type: "Footwear", weightGrams: 600 },
  { name: "Camp Shoes", category: "clothing", type: "Footwear", weightGrams: 200 },
  { name: "Socks (Short)", category: "clothing", type: "Footwear", weightGrams: 60 },
  { name: "Socks (Long)", category: "clothing", type: "Footwear", weightGrams: 80 },
  { name: "Gaiters", category: "clothing", type: "Footwear", weightGrams: 250 },

  // Clothing - Base Layers
  { name: "Base Layer Top", category: "clothing", type: "Base Layers", weightGrams: 180 },
  { name: "Base Layer Bottoms", category: "clothing", type: "Base Layers", weightGrams: 160 },
  { name: "T-Shirt", category: "clothing", type: "Base Layers", weightGrams: 180 },
  { name: "Underwear", category: "clothing", type: "Base Layers", weightGrams: 60 },
  { name: "Sports Bra", category: "clothing", type: "Base Layers", weightGrams: 50 },

  // Clothing - Mid Layers
  { name: "Fleece", category: "clothing", type: "Mid Layers", weightGrams: 350 },
  { name: "Merino Long Sleeve", category: "clothing", type: "Mid Layers", weightGrams: 200 },
  { name: "Hiking Shirt", category: "clothing", type: "Mid Layers", weightGrams: 200 },
  { name: "Vest", category: "clothing", type: "Mid Layers", weightGrams: 200 },
  { name: "Wind Shirt", category: "clothing", type: "Mid Layers", weightGrams: 100 },

  // Clothing - Insulation
  { name: "Puffy Jacket", category: "clothing", type: "Insulation", weightGrams: 350 },
  { name: "Thermal Top", category: "clothing", type: "Insulation", weightGrams: 180 },

  // Clothing - Shell
  { name: "Waterproof Jacket", category: "clothing", type: "Shell", weightGrams: 450 },
  { name: "Waterproof Pants", category: "clothing", type: "Shell", weightGrams: 250 },
  { name: "Hiking Pants", category: "clothing", type: "Shell", weightGrams: 350 },
  { name: "Shorts", category: "clothing", type: "Shell", weightGrams: 200 },
  { name: "Leggings / Tights", category: "clothing", type: "Shell", weightGrams: 200 },
  { name: "Poncho", category: "clothing", type: "Shell", weightGrams: 200 },
  { name: "Rain Kilt / Skirt", category: "clothing", type: "Shell", weightGrams: 80 },

  // Clothing - Accessories
  { name: "Sun Hat / Cap", category: "clothing", type: "Accessories", weightGrams: 70 },
  { name: "Beanie", category: "clothing", type: "Accessories", weightGrams: 60 },
  { name: "Buff / Neck Gaiter", category: "clothing", type: "Accessories", weightGrams: 40 },
  { name: "Gloves (Liner)", category: "clothing", type: "Accessories", weightGrams: 40 },
  { name: "Gloves (Outer)", category: "clothing", type: "Accessories", weightGrams: 120 },
  { name: "Sunglasses", category: "clothing", type: "Accessories", weightGrams: 30 },

  // Food
  { name: "Food", category: "food", type: "Meals", weightGrams: 500 },
  { name: "Freeze Dried Meal", category: "food", type: "Meals", weightGrams: 150 },
  { name: "Trail Mix (per 100g)", category: "food", type: "Snacks", weightGrams: 100 },
  { name: "Energy Bar", category: "food", type: "Snacks", weightGrams: 50 },
  { name: "Oatmeal Sachet", category: "food", type: "Meals", weightGrams: 40 },
  { name: "Coffee", category: "food", type: "Drinks", weightGrams: 50 },
  { name: "Coffee/Tea Sachets", category: "food", type: "Drinks", weightGrams: 5 },
  { name: "Condiments", category: "food", type: "Add-ons", weightGrams: 50 },
  { name: "Electrolyte Tablets", category: "food", type: "Drinks", weightGrams: 50 },
];
