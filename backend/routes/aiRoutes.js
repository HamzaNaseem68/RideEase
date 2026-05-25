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


// @route   POST api/ai/recommend
// @desc    Generate vehicle recommendations based on user inputs
router.post('/recommend', authMiddleware, async (req, res) => {
  const { budget, tripType, passengers, duration, fuelPreference, dailyDistance } = req.body;

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
    const apiKey = process.env.OPENAI_API_KEY;
    const offlineResult = await getOfflineRecommendation(inputs);

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
    
    // Fetch all vehicles to feed context to AI
    const fleet = await Vehicle.find({});
    const fleetInfo = fleet.map(v => `ID: ${v._id}, Name: ${v.name}, Type: ${v.type}, Price: PKR ${v.pricePerDay}/day, Seating: ${v.seatingCapacity}, Fuel: ${v.fuelType}`).join('\n');

    const systemPrompt = `You are RideEase AI, a premium and friendly vehicle rental expert in Pakistan.
Given the user's inputs, analyze them together to recommend the single most suitable vehicle from our fleet.
Always give a friendly, personalized response explaining why this vehicle fits, any drawbacks to watch out for (e.g. recommending a motorcycle for 4 passengers is bad), and state the total cost in PKR.

Here is our current fleet of vehicles available for rent:
${fleetInfo}

Return your response in a clean, JSON format:
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

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: systemPrompt }],
      response_format: { type: "json_object" }
    });

    const aiOutput = JSON.parse(response.choices[0].message.content);
    
    res.json({
      success: true,
      source: 'openai_gpt_model',
      recommendation: aiOutput.recommendation,
      vehicleId: aiOutput.vehicleId || offlineResult.vehicleId,
      vehicleName: aiOutput.vehicleName || offlineResult.vehicleName,
      estimatedCost: aiOutput.estimatedCost || offlineResult.estimatedCost
    });

  } catch (err) {
    console.error("AI Recommendation error:", err);
    // Graceful fallback to offline engine if OpenAI error occurs
    try {
      const offlineResult = await getOfflineRecommendation(inputs);
      res.json({
        success: true,
        source: 'local_expert_engine_fallback',
        ...offlineResult
      });
    } catch (fallbackErr) {
      res.status(500).json({ success: false, message: 'Recommendation engine failed. Please try again later.' });
    }
  }
});

module.exports = router;
