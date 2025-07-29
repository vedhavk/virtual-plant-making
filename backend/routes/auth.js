const express = require("express");
const User = require("../models/user"); // Adjust the path as necessary
const router = express.Router();
require("dotenv").config();

// Register route
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    console.log("Request Body:", req.body); // ✅ Add this for debug

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({
        message: "User with this email or username already exists",
      });
    }

    // Create new user
    const user = new User({
      username,
      email,
      password,
    });

    await user.save();

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      message: "Server error during registration",
    });
  }
});

// Login route
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    res.json({
      message: "Login successful",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      message: "Server error during login",
    });
  }
});

// AI Plant Recommendation route
router.post("/recommend-plants", async (req, res) => {
  const { selectedPlants = [], preferences = {} } = req.body;

  const prompt = `
Generate 4 different indoor plants as a JSON array. Each plant should be an object with this exact format:
[
  {
    "name": "Plant Name",
    "description": "Brief description",
    "care": "Care instructions"
  }
]

Make them different from: ${selectedPlants.join(", ")}
Preferences: sunlight ${preferences.sunlight || "any"}, humidity ${
    preferences.humidity || "any"
  }
`;

  try {
    const fetchResponse = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, // Remove REACT_APP_
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openai/gpt-3.5-turbo",
          messages: [{ role: "user", content: prompt }],
        }),
      }
    );

    const data = await fetchResponse.json();
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      return res.status(500).json({
        success: false,
        message: "No suggestions found",
      });
    }

    try {
      // Try to parse as JSON array
      const plantsArray = JSON.parse(content);

      // Add IDs to the plants
      const plantsWithIds = plantsArray.map((plant, index) => ({
        id: Date.now() + index,
        ...plant,
      }));

      res.json({
        success: true,
        plants: plantsWithIds,
        message: "AI recommendations generated",
      });
    } catch (parseError) {
      // Fallback to static plants if parsing fails
      const fallbackPlants = [
        {
          id: Date.now(),
          name: "Peace Lily",
          description: "Elegant white flowers, great for beginners",
          care: "Water when soil is dry, low to medium light",
        },
        {
          id: Date.now() + 1,
          name: "Spider Plant",
          description: "Easy-care plant that produces baby plants",
          care: "Water regularly, bright indirect light",
        },
      ];

      res.json({
        success: true,
        plants: fallbackPlants,
        message: "Fallback recommendations provided",
      });
    }
  } catch (error) {
    console.error("AI Recommendation Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get recommendations",
    });
  }
});

// Fix the search-plants route
router.post("/search-plants", async (req, res) => {
  const { searchQuery } = req.body; // Changed from 'query' to 'searchQuery'

  if (!searchQuery || searchQuery.trim() === "") {
    return res.status(400).json({
      success: false,
      message: "Search query is required",
    });
  }

  const prompt = `
Find information about the plant "${searchQuery}" and return ONLY a JSON object with this exact format:
{
  "name": "Plant Name",
  "description": "Brief description of the plant",
  "care": "Basic care instructions"
}
`;

  try {
    const fetchResponse = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, // Remove REACT_APP_
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openai/gpt-3.5-turbo",
          messages: [{ role: "user", content: prompt }],
        }),
      }
    );

    const data = await fetchResponse.json();
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      return res.status(500).json({
        success: false,
        message: "No response from AI",
      });
    }

    try {
      // Try to parse the AI response as JSON
      const plantData = JSON.parse(content);

      // Create the plant object with an ID
      const plant = {
        id: Date.now(),
        name: plantData.name || searchQuery,
        description: plantData.description || "AI-generated plant information",
        care: plantData.care || "AI-suggested care instructions",
      };

      res.json({
        success: true,
        plants: [plant], // Return as array
        message: `Found information for "${searchQuery}"`,
      });
    } catch (parseError) {
      // If JSON parsing fails, create a basic plant object
      const plant = {
        id: Date.now(),
        name: searchQuery,
        description: content.substring(0, 100) + "...",
        care: "AI-suggested care instructions",
      };

      res.json({
        success: true,
        plants: [plant],
        message: `Found information for "${searchQuery}"`,
      });
    }
  } catch (error) {
    console.error("AI Search Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch plant info",
    });
  }
});

module.exports = router;
