const express = require('express');
const router = express.Router();
const { Vehicle } = require('../database/db');
const { authMiddleware } = require('../middleware/authMiddleware');
const { OpenAI } = require('openai');

// Helper for offline rules-based expert recommendations (Outstanding local fallback)
async function getOfflineRecommendation(inputs) {
  const { budget, tripType, passengers, duration, fuelPreference, dailyDistance } = inputs;
  
  // Fetch vehicles to match
  const vehicles = await Vehicle.find({});
  
  // Filtering logic based on constraints
  let matches = [...vehicles];
  
  // 1. Filter by seating capacity
  matches = matches.filter(v => v.seatingCapacity >= passengers);
  
  // If no vehicles can fit all passengers, get the largest ones
  if (matches.length === 0) {
    matches = [...vehicles].sort((a, b) => b.seatingCapacity - a.seatingCapacity);
  }
  
  // 2. Filter by budget if possible
  const budgetedMatches = matches.filter(v => (v.pricePerDay * duration) <= budget);
  if (budgetedMatches.length > 0) {
    matches = budgetedMatches;
  }
  
  // 3. Filter by fuel preference if specified
  if (fuelPreference && fuelPreference !== 'No preference') {
    const fuelMatches = matches.filter(v => v.fuelType.toLowerCase() === fuelPreference.toLowerCase());
    if (fuelMatches.length > 0) {
      matches = fuelMatches;
    }
  }

  // 4. Select best fit based on trip type
  let bestFit = matches[0];
  
  if (tripType === 'Family trip') {
    // Prefer higher seating capacity
    bestFit = matches.find(v => v.seatingCapacity >= 5) || bestFit;
  } else if (tripType === 'Adventure') {
    // Prefer SUV or offroad look (e.g. Fortuner or heavy bikes if 1 passenger)
    bestFit = matches.find(v => v.name.includes('Fortuner') || v.name.includes('Sportage') || v.type === 'bike') || bestFit;
  } else if (tripType === 'City travel') {
    // Prefer small compact cars or electric
    bestFit = matches.find(v => v.seatingCapacity <= 5 && v.fuelType === 'Electric') || 
              matches.find(v => v.seatingCapacity <= 5 && v.type === 'car') || bestFit;
  } else if (tripType === 'Long distance') {
    // Prefer comfortable hybrid/sedans
    bestFit = matches.find(v => v.fuelType === 'Hybrid' || v.name.includes('Civic') || v.name.includes('Corolla')) || bestFit;
  }

  if (!bestFit) {
    return {
      recommendation: "Based on your preferences, we don't have an exact match in our fleet, but we recommend checking out our full vehicle catalog on the homepage!",
      vehicleId: null,
      vehicleName: "",
      estimatedCost: 0
    };
  }

  // ADVANCED AI SIMULATION MATH: Fuel Economics Projection
  const totalDistance = duration * dailyDistance;
  let fuelEconomy = 12; // default km/liter average
  
  if (bestFit.name.includes('Fortuner')) fuelEconomy = 9;
  else if (bestFit.name.includes('Civic')) fuelEconomy = 13;
  else if (bestFit.name.includes('Alto')) fuelEconomy = 19;
  else if (bestFit.name.includes('MG HS')) fuelEconomy = 11;
  else if (bestFit.name.includes('Tucson')) fuelEconomy = 10;
  else if (bestFit.name.includes('Alsvin')) fuelEconomy = 14;
  else if (bestFit.name.includes('YBR')) fuelEconomy = 42;
  else if (bestFit.name.includes('GS 150')) fuelEconomy = 38;
  else if (bestFit.name.includes('CG 125')) fuelEconomy = 35;
  else if (bestFit.name.includes('Vlektra')) fuelEconomy = 80;

  let fuelRequired = 0;
  let fuelCost = 0;
  let fuelAnalysisText = '';

  if (bestFit.fuelType === 'Electric') {
    const chargesNeeded = Math.ceil(totalDistance / fuelEconomy);
    fuelCost = chargesNeeded * 150; // Rs. 150 flat domestic charge
    fuelAnalysisText = `⚡ **Eco Electric Efficiency Projection:** For a total distance of **${totalDistance.toLocaleString()} km** over ${duration} days, this silent electric bike requires approximately **${chargesNeeded} full charging cycles**. At an average cost of PKR 150 per utility charge, your total energy budget is estimated at just **PKR ${fuelCost.toLocaleString()}**—saving you massive fuel charges compared to standard petrol commuters!`;
  } else {
    const rate = bestFit.fuelType === 'Diesel' ? 281 : 272; // PKR diesel vs petrol average rates
    fuelRequired = Math.round((totalDistance / fuelEconomy) * 10) / 10;
    fuelCost = Math.round(fuelRequired * rate);
    fuelAnalysisText = `⛽ **Trip Energy Economics:** Over your **${duration}-day trip**, covering an estimated **${totalDistance.toLocaleString()} km**, this vehicle will consume approximately **${fuelRequired} Liters** of ${bestFit.fuelType} (at an average of ${fuelEconomy} km/L). At current local rates (PKR ${rate}/L), your projected trip fuel expense is **PKR ${fuelCost.toLocaleString()}**.`;
  }

  // ADVANCED AI SIMULATION MATH: Topographic & Terrain Match Analysis
  let terrainAdviceText = '';
  if (tripType === 'Adventure') {
    terrainAdviceText = `🏞️ **Terrain Suitability Review:** Exploring rugged settings or steep highway climbs (like Murree/Naran trails) requires excellent ground clearance and rigid torque. We've matched you with the **${bestFit.name}** because of its high suspension configuration and superb gradeability. While a simple hatchback would struggle on steep pot-holed paths, this chassis is purpose-built to navigate rugged inclines safely.`;
  } else if (tripType === 'Family trip') {
    terrainAdviceText = `👨‍👩‍👧‍👦 **Cabin Ergonomics Analysis:** Traveling with a group of **${passengers} people** means passenger legroom, high cabin volume, and trunk luggage spaces are top travel priorities. We selected the **${bestFit.name}** to prevent cramped seating. With its independent rear air vents and spacious cabin width, it ensures everyone—from children to elders—enjoys a highly comfortable highway drive.`;
  } else if (tripType === 'City travel') {
    terrainAdviceText = `🌆 **Urban Commuting Analysis:** Navigating bumper-to-bumper urban congestion in busy cities demand swift steering response, compact dimensions for lane-changing, and easy parking. The **${bestFit.name}** provides the ultimate city-driving package. It maneuvers smoothly through tight gridlocks and slips easily into tight slots that would frustrate large crossover SUVs.`;
  } else {
    terrainAdviceText = `🛣️ **Highway Aerodynamics Review:** Driving substantial inter-city mileage (like the Lahore-Karachi Motorway) requires excellent high-speed cruise stability, plush seat contouring support, and refined noise insulation. The **${bestFit.name}** is exceptionally suited for these long corridors, delivering fatigue-free high-speed cruising.`;
  }

  // ADVANCED AI SIMULATION MATH: Safety Warning check
  let safetyNotice = '';
  if (bestFit.type === 'bike' && passengers > 2) {
    safetyNotice = `\n\n⚠️ **Logistical Safety Alert:** You specified **${passengers} passengers**, but our best fit motorcycle like the **${bestFit.name}** only accommodates up to 2 riders. We strongly advise choosing a car or booking multiple rides to comply with local traffic laws and safety codes!`;
  }

  const estimatedCost = bestFit.pricePerDay * duration;
  const inBudget = estimatedCost <= budget ? "which is within your budget" : "which slightly exceeds your specified budget, but offers unmatched reliability";

  // Build high-fidelity personalized response paragraph
  let text = `Hey there! 🚗 Based on your trip details, you're planning a **${tripType}** for **${passengers} passengers** over **${duration} days** driving about **${dailyDistance} km/day**.\n\n`;
  text += `We highly recommend renting the **${bestFit.name}** (${bestFit.seatingCapacity}-seater, ${bestFit.fuelType} ${bestFit.type}). It matches your seating requirement and is perfect for ${tripType.toLowerCase()}.\n\n`;
  text += `${terrainAdviceText}${safetyNotice}\n\n`;
  text += `${fuelAnalysisText}\n\n`;
  text += `💰 **Financial Analysis:** Rented at **PKR ${bestFit.pricePerDay.toLocaleString()}/day** for ${duration} days, the total rental fee is **PKR ${estimatedCost.toLocaleString()}** (${inBudget}).`;

  return {
    recommendation: text,
    vehicleId: bestFit._id,
    vehicleName: bestFit.name,
    estimatedCost
  };
}

// Helper utility to safely parse LLM outputs (cleaning any markdown fence blocks like ```json ... ```)
function safeParseJSON(str) {
  if (!str) return null;
  try {
    const cleanStr = str.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanStr);
  } catch (e) {
    console.error("safeParseJSON error parsing string:", e.message, "Raw string was:", str);
    return null;
  }
}

// @route   POST api/ai/recommend
// @desc    Generate vehicle recommendations based on user inputs
router.post('/recommend', authMiddleware, async (req, res) => {
  const { budget, tripType, passengers, duration, fuelPreference, dailyDistance, aiEngine, customApiKey } = req.body;

  if (!budget || !tripType || !passengers || !duration || !fuelPreference || !dailyDistance) {
    return res.status(400).json({ success: false, message: 'Please provide all necessary trip details to analyze' });
  }

  const inputs = {
    budget: parseFloat(budget),
    tripType,
    passengers: parseInt(passengers, 10),
    duration: parseInt(duration, 10),
    fuelPreference,
    dailyDistance: parseFloat(dailyDistance)
  };

  try {
    const offlineResult = await getOfflineRecommendation(inputs);

    // 1. Check if local offline engine is selected explicitly
    if (aiEngine === 'local') {
      console.log("Local offline expert engine selected explicitly.");
      return res.json({
        success: true,
        source: 'local_expert_engine',
        ...offlineResult
      });
    }

    // Fetch all vehicles to feed context to AI
    const fleet = await Vehicle.find({});
    const fleetInfo = fleet.map(v => `ID: ${v._id}, Name: ${v.name}, Type: ${v.type}, Price: PKR ${v.pricePerDay}/day, Seating: ${v.seatingCapacity}, Fuel: ${v.fuelType}`).join('\n');

    const systemPrompt = `You are RideEase AI, a premium and friendly vehicle rental expert in Pakistan.
Given the user's inputs, analyze them together to recommend the single most suitable vehicle from our fleet.
Always give a friendly, personalized response explaining why this vehicle fits, any drawbacks to watch out for (e.g. recommending a motorcycle for 4 passengers is bad), and state the total cost in PKR.

Here is our current fleet of vehicles available for rent:
${fleetInfo}

Return your response in a clean, JSON format matching this schema exactly:
{
  "recommendation": "your highly engaging, custom response here (markdown supported)",
  "vehicleId": "the ID of the recommended vehicle from the fleet",
  "vehicleName": "the name of the recommended vehicle",
  "estimatedCost": 12000
}
Analyze all parameters carefully:
- Budget: PKR ${inputs.budget}
- Passengers: ${inputs.passengers}
- Trip Type: ${inputs.tripType}
- Duration: ${inputs.duration} days
- Fuel Preference: ${inputs.fuelPreference}
- Estimated Daily Distance: ${inputs.dailyDistance} km`;

    // 2. Google Gemini API Engine
    if (aiEngine === 'gemini' || (!aiEngine && !process.env.OPENAI_API_KEY && (customApiKey || process.env.GEMINI_API_KEY))) {
      const apiKey = customApiKey || process.env.GEMINI_API_KEY;
      
      if (!apiKey || apiKey === 'your_gemini_api_key_here') {
        console.log("No live Gemini key found, falling back to local expert engine.");
        return res.json({
          success: true,
          source: 'local_expert_engine_fallback',
          message: "Note: Gemini key not configured. Using local offline advisor.",
          ...offlineResult
        });
      }

      console.log("Executing live Google Gemini API query...");
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

      const response = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: systemPrompt + "\n\nCRITICAL: Return ONLY raw JSON matching the required schema. Do not output any markdown code blocks (like ```json ... ```) or conversational preamble outside of the JSON object."
            }]
          }],
          generationConfig: {
            responseMimeType: "application/json"
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API returned status code ${response.status}`);
      }

      const rawData = await response.json();
      const rawText = rawData.candidates[0].content.parts[0].text;
      const aiOutput = safeParseJSON(rawText);

      if (!aiOutput) {
        throw new Error("Failed to parse dynamic JSON from Gemini LLM candidate");
      }

      return res.json({
        success: true,
        source: 'google_gemini_model',
        recommendation: aiOutput.recommendation,
        vehicleId: aiOutput.vehicleId || offlineResult.vehicleId,
        vehicleName: aiOutput.vehicleName || offlineResult.vehicleName,
        estimatedCost: aiOutput.estimatedCost || offlineResult.estimatedCost
      });
    }

    // 3. OpenAI GPT API Engine
    const apiKey = customApiKey || process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === 'your_openai_api_key_here') {
      console.log("No live OpenAI API key found, returning deterministic local expert recommendation.");
      return res.json({
        success: true,
        source: 'local_expert_engine',
        ...offlineResult
      });
    }

    // Call OpenAI API for a live, highly realistic AI recommendation
    console.log("Executing live OpenAI API query for vehicle advisor...");
    const openai = new OpenAI({ apiKey });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: systemPrompt }],
      response_format: { type: "json_object" }
    });

    const aiOutput = JSON.parse(response.choices[0].message.content);
    
    return res.json({
      success: true,
      source: 'openai_gpt_model',
      recommendation: aiOutput.recommendation,
      vehicleId: aiOutput.vehicleId || offlineResult.vehicleId,
      vehicleName: aiOutput.vehicleName || offlineResult.vehicleName,
      estimatedCost: aiOutput.estimatedCost || offlineResult.estimatedCost
    });

  } catch (err) {
    console.error("AI Recommendation error:", err);
    // Graceful fallback to offline engine if API call fails
    try {
      const offlineResult = await getOfflineRecommendation(inputs);
      return res.json({
        success: true,
        source: 'local_expert_engine_fallback_on_error',
        message: `Dynamic AI query error: ${err.message}. Using offline expert fallback.`,
        ...offlineResult
      });
    } catch (fallbackErr) {
      return res.status(500).json({ success: false, message: 'Recommendation engine failed. Please try again later.' });
    }
  }
});
// Helper for offline rules-based conversational matcher
async function getOfflineChatRecommendation(latestMessage) {
  const text = latestMessage.toLowerCase();
  
  // Fetch vehicles to match
  const vehicles = await Vehicle.find({});
  let matchedVehicle = null;
  let reply = "";

  // 1. Identify vehicle by name or keyword
  if (text.includes("fortuner") || text.includes("legender") || text.includes("4x4") || text.includes("suv") || text.includes("offroad")) {
    matchedVehicle = vehicles.find(v => v.name.includes("Fortuner"));
    reply = "Aap ki adventure aur family road trips ke liye **Toyota Fortuner Legender** sab se behtareen choice hai! Yeh 4WD capability, 7-seater space aur diesel engine ke sath aati hai.";
  } else if (text.includes("civic") || text.includes("oriel") || text.includes("sedan") || text.includes("honda")) {
    matchedVehicle = vehicles.find(v => v.name.includes("Civic"));
    reply = "Shehar mein premium aur sporty drive ke liye **Honda Civic Oriel** behtareen hai. Isme sunroof, automatic cruise control aur behtareen fuel average milta hai.";
  } else if (text.includes("alto") || text.includes("cheap") || text.includes("sasti") || text.includes("budget") || text.includes("suzuki")) {
    matchedVehicle = vehicles.find(v => v.name.includes("Alto"));
    reply = "Budget-friendly aur fuel-efficient drive ke liye **Suzuki Alto VXL** sab se behtareen pick hai. Lahore ke heavy traffic aur easy parking ke liye yeh ideal AGS automatic hatchback hai.";
  } else if (text.includes("mg") || text.includes("hs") || text.includes("essence") || text.includes("crossover")) {
    matchedVehicle = vehicles.find(v => v.name.includes("MG HS"));
    reply = "Modern technology aur premium safety features ke sath **MG HS Essence** ek zabardast crossover SUV hai. Panoramic sunroof aur gorgeous red interior isse behad luxury banate hain.";
  } else if (text.includes("tucson") || text.includes("hyundai") || text.includes("awd")) {
    matchedVehicle = vehicles.find(v => v.name.includes("Tucson"));
    reply = "Comfortable inter-city cruising aur hilly areas ke safar ke liye **Hyundai Tucson AWD** sab se reliable crossover SUV hai. Iska All-Wheel Drive system behtareen stability deta hai.";
  } else if (text.includes("alsvin") || text.includes("changan") || text.includes("value")) {
    matchedVehicle = vehicles.find(v => v.name.includes("Alsvin"));
    reply = "Family drive ke liye ek modern aur budget sedan **Changan Alsvin Lumiere** hai. Isme smart keyless entry, automatic DCT gear aur sunroof jese premium features miltay hain.";
  } else if (text.includes("bike") || text.includes("motorcycle") || text.includes("ybr") || text.includes("yamaha")) {
    matchedVehicle = vehicles.find(v => v.name.includes("YBR"));
    reply = "Lahore ki busy streets par adventure aur fuel-efficient ride ke liye **Yamaha YBR 125G** behtareen motorcycle hai. Iske custom shocks aur aggressive design solo tourers ke liye ideal hain.";
  } else if (text.includes("cruiser") || text.includes("gs") || text.includes("150")) {
    matchedVehicle = vehicles.find(v => v.name.includes("GS 150"));
    reply = "Durable comfort aur long highway rides ke liye 150cc power wali **Suzuki GS 150 SE** behtareen tourer bike hai. Iska cushion seat aur retro look behtareen riding experience deta hai.";
  } else if (text.includes("cg") || text.includes("125") || text.includes("honda bike")) {
    matchedVehicle = vehicles.find(v => v.name.includes("CG 125"));
    reply = "Pakistani streets ki legendary commuter **Honda CG 125 Self-Start** sab se zyada heavy power bike hai. Iska quick acceleration traffic se nikalne mein bemisaal hai.";
  } else if (text.includes("electric") || text.includes("vlektra") || text.includes("silent") || text.includes("eco")) {
    matchedVehicle = vehicles.find(v => v.name.includes("Vlektra"));
    reply = "Zero carbon emission aur bilkul silent drive ke liye **Vlektra Retro Electric Bike** ek green champion hai! Yeh 3 ghante mein full charge ho kar 80km ki driving range deti hai.";
  } else {
    // Default reply if no specific gaari matched
    reply = "Assalam-o-Alaikum! Main aap ka RideEase AI Copilot hoon. 🚗\n\nMujhe batayein ke aap ka trip kahan ka hai, kitne passengers hain, ya aap ka budget kya hai? Main aap ko behtareen ride suggest karoon ga! Jaise ke aap type kar saktay hain: *'Alto for low budget'* ya *'Fortuner for family road trip'*.";
  }

  return {
    reply: reply,
    matchedVehicleId: matchedVehicle ? matchedVehicle._id : null
  };
}

// @route   POST api/ai/chat
// @desc    Dynamic conversational chat advisor
router.post('/chat', authMiddleware, async (req, res) => {
  const { messages, aiEngine, customApiKey } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ success: false, message: 'Please provide messages history array' });
  }

  const latestMessage = messages[messages.length - 1].content || "";

  try {
    const offlineResult = await getOfflineChatRecommendation(latestMessage);

    // 1. If local fallback engine is selected explicitly
    if (aiEngine === 'local') {
      console.log("Local offline expert chat engine selected explicitly.");
      return res.json({
        success: true,
        source: 'local_expert_chat_engine',
        ...offlineResult
      });
    }

    // Fetch all vehicles to feed context to AI
    const fleet = await Vehicle.find({});
    const fleetInfo = fleet.map(v => `ID: ${v._id}, Name: ${v.name}, Type: ${v.type}, Price: PKR ${v.pricePerDay}/day, Seating: ${v.seatingCapacity}, Fuel: ${v.fuelType}`).join('\n');

    const systemPrompt = `You are RideEase AI Copilot, a premium, friendly, and expert vehicle rental assistant in Pakistan.
You help users select the perfect car or bike from our fleet based on their trip description and messages.
Talk to the user in a natural, conversational manner. You can converse in English, Urdu, or Roman Urdu (e.g. "Assalam-o-Alaikum! Aap ke safar ke liye...").

Here is our current fleet of vehicles available for rent:
${fleetInfo}

Analyze the user's requirements (e.g., budget, passengers, comfort, trip type) from the chat history and recommend the single most suitable vehicle from the list.
When you match a vehicle, state why it fits beautifully. If no specific match fits yet, ask for details.

Return your response in a clean, JSON format matching this schema:
{
  "reply": "Your friendly conversational reply advising the user. Use bullet points and bold text for rich styling (markdown supported).",
  "matchedVehicleId": "the Mongoose ID of the matched vehicle from the fleet list (must be exactly one of the IDs provided, or null if you are still asking for details or no match fits)"
}`;

    // 2. Google Gemini API Engine
    if (aiEngine === 'gemini' || (!aiEngine && !process.env.OPENAI_API_KEY && (customApiKey || process.env.GEMINI_API_KEY))) {
      const apiKey = customApiKey || process.env.GEMINI_API_KEY;
      
      if (!apiKey || apiKey === 'your_gemini_api_key_here') {
        console.log("No live Gemini key found for chat, falling back to local expert engine.");
        return res.json({
          success: true,
          source: 'local_expert_chat_engine_fallback',
          reply: offlineResult.reply + "\n\n*(Note: Gemini key not configured. Using local offline advisor.)*",
          matchedVehicleId: offlineResult.matchedVehicleId
        });
      }

      console.log("Executing live Google Gemini chat API query...");
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

      // Convert conversation messages array into Gemini parts format
      const geminiContents = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

      // Prepend system prompt
      geminiContents.unshift({
        role: 'user',
        parts: [{ text: systemPrompt + "\n\nCRITICAL: Respond to the next messages as the Copilot in Pakistan." }]
      });

      const response = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: geminiContents,
          generationConfig: {
            responseMimeType: "application/json"
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API returned status code ${response.status}`);
      }

      const rawData = await response.json();
      const rawText = rawData.candidates[0].content.parts[0].text;
      const aiOutput = safeParseJSON(rawText);

      if (!aiOutput) {
        throw new Error("Failed to parse dynamic JSON from Gemini LLM candidate");
      }

      return res.json({
        success: true,
        source: 'google_gemini_chat_model',
        reply: aiOutput.reply,
        matchedVehicleId: aiOutput.matchedVehicleId || offlineResult.matchedVehicleId
      });
    }

    // 3. OpenAI GPT API Engine
    const apiKey = customApiKey || process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === 'your_openai_api_key_here') {
      console.log("No live OpenAI API key found for chat, returning local expert chat recommendation.");
      return res.json({
        success: true,
        source: 'local_expert_chat_engine',
        ...offlineResult
      });
    }

    console.log("Executing live OpenAI API chat query...");
    const openai = new OpenAI({ apiKey });

    // Format messages for OpenAI
    const openAiMessages = messages.map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content
    }));
    
    // Add system message
    openAiMessages.unshift({
      role: 'system',
      content: systemPrompt
    });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: openAiMessages,
      response_format: { type: "json_object" }
    });

    const aiOutput = JSON.parse(response.choices[0].message.content);
    
    return res.json({
      success: true,
      source: 'openai_gpt_chat_model',
      reply: aiOutput.reply,
      matchedVehicleId: aiOutput.matchedVehicleId || offlineResult.matchedVehicleId
    });

  } catch (err) {
    console.error("AI Chat error:", err);
    // Graceful fallback to offline chat engine if API call fails
    try {
      const offlineResult = await getOfflineChatRecommendation(latestMessage);
      return res.json({
        success: true,
        source: 'local_expert_chat_fallback_on_error',
        reply: offlineResult.reply + `\n\n*(AI Chat error: ${err.message}. Using offline fallback.)*`,
        matchedVehicleId: offlineResult.matchedVehicleId
      });
    } catch (fallbackErr) {
      return res.status(500).json({ success: false, message: 'Chat engine failed. Please try again later.' });
    }
  }
});

module.exports = router;
