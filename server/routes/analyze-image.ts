import { Router } from "express";
import OpenAI from "openai";

const router = Router();

function getOpenAIClient() {
  return new OpenAI({
    apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
    baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  });
}

router.post("/api/analyze-gear-image", async (req, res) => {
  console.log("[analyze-image] Request received");
  
  try {
    const { image, category } = req.body;
    console.log("[analyze-image] Category:", category, "Image length:", image?.length || 0);

    if (!image) {
      return res.status(400).json({ error: "Image data (base64) is required" });
    }

    const categoryContext = category === "food" 
      ? "food item for a hiking/camping trip"
      : category === "clothing"
      ? "outdoor/hiking clothing item"
      : "outdoor/hiking gear item";

    const openai = getOpenAIClient();
    console.log("[analyze-image] Making OpenAI request...");
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert at identifying outdoor and hiking equipment. Analyze the image and identify the ${categoryContext}. Return a JSON object with the following fields:
- name: The specific name of the item (e.g., "Backpack", "Tent", "Hiking Boots")
- type: The category type (for gear: "Sleep System", "Shelter", "Cooking", "Navigation", "First Aid", "Tools", "Storage", "Hydration", "Lighting", "Electronics", "Other"; for clothing: "Base Layer", "Mid Layer", "Outer Layer", "Footwear", "Headwear", "Handwear", "Legwear", "Other"; for food: "Breakfast", "Lunch", "Dinner", "Snacks", "Drinks", "Other")
- brand: The brand if visible, otherwise null
- model: The model name if visible, otherwise null
- estimatedWeightGrams: Estimated weight in grams (be reasonable based on typical weights)
- estimatedPrice: Estimated price in cents (USD)
- confidence: Your confidence level (low, medium, high)

Only return valid JSON, no other text.`
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: image.startsWith("data:") ? image : `data:image/jpeg;base64,${image}`,
              },
            },
            {
              type: "text",
              text: `What ${categoryContext} is this? Provide details in JSON format.`
            }
          ],
        },
      ],
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content || "{}";
    
    // Parse the JSON response
    let parsedContent;
    try {
      // Remove markdown code blocks if present
      const cleanContent = content.replace(/```json\n?|\n?```/g, "").trim();
      parsedContent = JSON.parse(cleanContent);
    } catch {
      parsedContent = {
        name: "Unknown Item",
        type: "Other",
        brand: null,
        model: null,
        estimatedWeightGrams: 0,
        estimatedPrice: 0,
        confidence: "low"
      };
    }

    res.json(parsedContent);
  } catch (error: any) {
    console.error("[analyze-image] Error analyzing image:", error?.message || error);
    console.error("[analyze-image] Full error:", JSON.stringify(error, null, 2));
    res.status(500).json({ error: "Failed to analyze image", details: error?.message });
  }
});

export default router;
