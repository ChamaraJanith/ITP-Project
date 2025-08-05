import express from "express";
const router = express.Router();

const sicknessData = [
  {
    name: "Common Cold",
    symptoms: ["runny nose", "sneezing", "cough", "sore throat", "mild fever", "fatigue"]
  },
  {
    name: "Flu (Influenza)",
    symptoms: ["high fever", "muscle aches", "chills", "sweats", "headache", "dry cough", "fatigue", "nasal congestion"]
  },
  {
    name: "Diabetes",
    symptoms: ["frequent urination", "increased thirst", "extreme hunger", "unexplained weight loss", "fatigue", "blurred vision"]
  },
  {
    name: "COVID-19",
    symptoms: ["fever", "cough", "loss of taste", "loss of smell", "fatigue", "shortness of breath", "muscle aches", "sore throat"]
  },
  {
    name: "Migraine",
    symptoms: ["severe headache", "nausea", "sensitivity to light", "sensitivity to sound", "visual disturbances"]
  }
];

function findMatchingSicknesses(userText) {
  if (!userText || typeof userText !== "string") return [];
  const input = userText.toLowerCase();
  return sicknessData.filter(disease =>
    disease.name.toLowerCase().includes(input) ||
    disease.symptoms.some(symptom => input.includes(symptom.toLowerCase()))
  );
}

router.post('/', (req, res) => {
  try {
    console.log('Chatbot route hit!', req.body); // Debug log
    
    const history = req.body?.contents || [];
    let userMessage = "";
    
    // Extract user message from history
    if (history.length > 0) {
      const lastMessage = history[history.length - 1];
      if (lastMessage && lastMessage.parts) {
        userMessage = lastMessage.parts.map(part => part.text).join(' ');
      }
    }

    const matches = findMatchingSicknesses(userMessage);
    let reply;

    if (matches.length > 0) {
      reply = matches.map(disease => 
        `**${disease.name}**\nSymptoms: ${disease.symptoms.join(", ")}`
      ).join("\n\n");
    } else if (userMessage.trim()) {
      reply = "I couldn't find matching symptoms. Please describe your symptoms more clearly (like: fever, cough, headache, etc.)";
    } else {
      reply = "Hello! I can help you identify possible illnesses based on symptoms. Please describe what symptoms you're experiencing.";
    }

    res.json({
      candidates: [
        {
          content: {
            parts: [
              { text: reply }
            ]
          }
        }
      ]
    });
  } catch (err) {
    console.error('Chatbot error:', err);
    res.status(500).json({
      error: { message: err.message || "Internal server error" }
    });
  }
});

export default router;
