import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const PlantSelectPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  const [aiPlants, setAiPlants] = useState([]);
  const [loadingAI, setLoadingAI] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResult, setSearchResult] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  // Track plant progress data
  const [plantProgressData, setPlantProgressData] = useState({});

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
      // Load all plant progress data
      loadAllPlantProgress();
    } else {
      navigate("/login");
    }
  }, [navigate]);

  // Load progress data for all plants
  const loadAllPlantProgress = () => {
    const progressData = {};
    const allPlants = [...plants]; // Include AI and search results when available

    allPlants.forEach((plant) => {
      const savedData = localStorage.getItem(`plant_${plant.id}_progress`);
      if (savedData) {
        try {
          progressData[plant.id] = JSON.parse(savedData);
        } catch (error) {
          console.error(`Error loading progress for plant ${plant.id}:`, error);
        }
      }
    });

    setPlantProgressData(progressData);
  };

  // Get plant status info
  const getPlantStatus = (plantId) => {
    const progress = plantProgressData[plantId];
    if (!progress) {
      return {
        status: "New Plant",
        health: 0,
        age: 0,
        stage: "seedling",
        dailyCareComplete: false,
        careStreak: 0,
        statusColor: "text-gray-600",
        bgColor: "bg-gray-100",
        emoji: "🌱",
      };
    }

    const health = progress.health?.health || 0;
    const age = progress.age || 0;
    const stage = progress.stage || "seedling";
    const dailyCare = progress.dailyCare || {};
    const careComplete =
      dailyCare.todayCareGiven &&
      Object.values(dailyCare.todayCareGiven).every(Boolean);

    // Determine status based on health and care
    let status, statusColor, bgColor, emoji;

    if (health === 0) {
      status = "New Plant";
      statusColor = "text-gray-600";
      bgColor = "bg-gray-100";
      emoji = "🌱";
    } else if (health < 20) {
      status = "Critical";
      statusColor = "text-red-600";
      bgColor = "bg-red-100";
      emoji = "💀";
    } else if (health < 40) {
      status = "Struggling";
      statusColor = "text-orange-600";
      bgColor = "bg-orange-100";
      emoji = "😰";
    } else if (health < 60) {
      status = "Growing";
      statusColor = "text-yellow-600";
      bgColor = "bg-yellow-100";
      emoji = "🌿";
    } else if (health < 80) {
      status = "Healthy";
      statusColor = "text-green-600";
      bgColor = "bg-green-100";
      emoji = "🪴";
    } else {
      status = "Thriving";
      statusColor = "text-green-700";
      bgColor = "bg-green-100";
      emoji = "🌺";
    }

    return {
      status,
      health,
      age,
      stage,
      dailyCareComplete: careComplete,
      careStreak: dailyCare.careStreak || 0,
      statusColor,
      bgColor,
      emoji,
      lastCared: progress.lastSaved
        ? new Date(progress.lastSaved).toLocaleDateString()
        : "Never",
    };
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  const plants = [
    {
      id: 1,
      name: "Rose Plant",
      description: "Beautiful flowering plant with vibrant colors",
      care: "Water daily, needs sunlight",
    },
    {
      id: 2,
      name: "Sunflower",
      description: "Bright and cheerful plant that follows the sun",
      care: "Water regularly, full sun exposure",
    },
    {
      id: 3,
      name: "Cactus",
      description: "Low maintenance succulent perfect for beginners",
      care: "Water sparingly, indirect sunlight",
    },
    {
      id: 4,
      name: "Lavender",
      description: "Fragrant herb with calming properties",
      care: "Water moderately, well-drained soil",
    },
    {
      id: 5,
      name: "Monstera",
      description: "Trendy houseplant with unique split leaves",
      care: "Water weekly, bright indirect light",
    },
    {
      id: 6,
      name: "Snake Plant",
      description: "Hardy plant that purifies air",
      care: "Water monthly, low to bright light",
    },
  ];

  const handleSelectPlant = (plant) => {
    // Store the selected plant
    localStorage.setItem("selectedPlant", JSON.stringify(plant));

    const plantStatus = getPlantStatus(plant.id);

    // Show different message based on plant status
    if (plantStatus.health > 0) {
      alert(
        `Welcome back to your ${plant.name}! Health: ${plantStatus.health}%, Age: ${plantStatus.age} days`
      );
    } else {
      alert(`You selected ${plant.name}! Starting your plant care journey...`);
    }

    // Navigate to plant details page
    navigate("/plant-details");
  };

  const fetchAIPlants = async () => {
    setLoadingAI(true);
    try {
      const response = await fetch(
        "http://localhost:5000/api/recommend-plants",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            selectedPlants: plants.map((p) => p.name),
            preferences: {
              sunlight: "medium",
              humidity: "moderate",
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.plants && Array.isArray(data.plants)) {
        const validPlants = data.plants.map((plant, index) => ({
          id: plant.id || Date.now() + index,
          name: plant.name || `AI Plant ${index + 1}`,
          description: plant.description || "AI-generated plant description",
          care: plant.care || "AI-suggested care instructions",
        }));

        setAiPlants(validPlants);
        // Reload progress data to include AI plants
        setTimeout(loadAllPlantProgress, 100);
      } else {
        alert(data.message || "Failed to get AI suggestions");
        setAiPlants([]);
      }
    } catch (error) {
      console.error("Failed to fetch AI plants:", error);
      alert(`Failed to get AI suggestions: ${error.message}`);
      setAiPlants([]);
    }
    setLoadingAI(false);
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    setSearching(true);
    setSearchResults([]);
    setSearchResult("");

    try {
      const response = await fetch("http://localhost:5000/api/search-plants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ searchQuery: searchTerm }),
      });

      const data = await response.json();

      if (data.success && data.plants && data.plants.length > 0) {
        const results = data.plants.map((plant, index) => ({
          id: plant.id || 300 + index,
          name: plant.name || `Plant ${index + 1}`,
          description: plant.description || "AI-generated plant",
          care: plant.care || "Care instructions provided by AI",
        }));

        setSearchResults(results);
        setSearchResult(
          `Found ${results.length} plants matching "${searchTerm}"`
        );
        // Reload progress data to include search results
        setTimeout(loadAllPlantProgress, 100);
      } else {
        setSearchResult(`No plants found for "${searchTerm}". Try again.`);
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Search failed:", error);
      setSearchResult("Error searching for plants. Please try again.");
      setSearchResults([]);
    }

    setSearching(false);
  };

  // Plant card component with progress display
  const PlantCard = ({ plant, type = "featured" }) => {
    const plantStatus = getPlantStatus(plant.id);
    const isExisting = plantStatus.health > 0;

    let borderColor, buttonColor, typeLabel;
    switch (type) {
      case "search":
        borderColor = "border-blue-500";
        buttonColor = "bg-blue-600 hover:bg-blue-700";
        typeLabel = {
          bg: "bg-blue-100",
          text: "text-blue-800",
          label: "Search Result",
        };
        break;
      case "ai":
        borderColor = "border-purple-500";
        buttonColor = "bg-purple-600 hover:bg-purple-700";
        typeLabel = {
          bg: "bg-purple-100",
          text: "text-purple-800",
          label: "AI Suggested",
        };
        break;
      default:
        borderColor = "";
        buttonColor = "bg-green-600 hover:bg-green-700";
        typeLabel = null;
    }

    return (
      <div
        className={`bg-white p-6 rounded-lg shadow-md hover:shadow-lg ${
          borderColor && `border-l-4 ${borderColor}`
        } transition-all duration-200`}
      >
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xl font-semibold text-gray-900">{plant.name}</h3>
          {typeLabel && (
            <span
              className={`${typeLabel.bg} ${typeLabel.text} text-xs px-2 py-1 rounded`}
            >
              {typeLabel.label}
            </span>
          )}
        </div>

        {/* Plant Status Display */}
        <div className={`mb-4 p-3 rounded-lg ${plantStatus.bgColor}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="flex items-center">
              <span className="text-lg mr-2">{plantStatus.emoji}</span>
              <span className={`font-semibold ${plantStatus.statusColor}`}>
                {plantStatus.status}
              </span>
            </span>
            {isExisting && (
              <span className="text-sm text-gray-600">
                Day {plantStatus.age}
              </span>
            )}
          </div>

          {isExisting ? (
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Health:</span>
                <span className={`font-semibold ${plantStatus.statusColor}`}>
                  {plantStatus.health}%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Care Streak:</span>
                <span className="font-semibold text-orange-600">
                  {plantStatus.careStreak} days
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Today's Care:</span>
                <span
                  className={`font-semibold ${
                    plantStatus.dailyCareComplete
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {plantStatus.dailyCareComplete ? "✅ Complete" : "❌ Pending"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Last Cared:</span>
                <span className="text-gray-500 text-xs">
                  {plantStatus.lastCared}
                </span>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-gray-600 text-sm mb-2">{plant.description}</p>
              <p className="text-xs text-gray-500">
                <strong>Care:</strong> {plant.care}
              </p>
            </div>
          )}
        </div>

        {/* Action Button */}
        <button
          onClick={() => handleSelectPlant(plant)}
          className={`w-full text-white py-2 rounded-md transition-colors ${buttonColor} ${
            isExisting ? "font-semibold" : ""
          }`}
        >
          {isExisting ? `Continue with ${plant.name}` : `Select ${plant.name}`}
        </button>

        {/* Urgency indicator for critical plants */}
        {plantStatus.health > 0 && plantStatus.health < 30 && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700 text-xs font-semibold text-center animate-pulse">
              🚨 Your plant needs immediate attention!
            </p>
          </div>
        )}

        {/* Daily care reminder */}
        {plantStatus.health > 0 && !plantStatus.dailyCareComplete && (
          <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded-md">
            <p className="text-orange-700 text-xs text-center">
              ⏰ Don't forget today's care routine!
            </p>
          </div>
        )}
      </div>
    );
  };

  if (!user) return <div>Loading...</div>;

  // Get plants that need urgent care
  const criticalPlants = plants.filter((plant) => {
    const status = getPlantStatus(plant.id);
    return status.health > 0 && status.health < 30;
  });

  const plantsNeedingCare = plants.filter((plant) => {
    const status = getPlantStatus(plant.id);
    return status.health > 0 && !status.dailyCareComplete;
  });

  return (
    <div className="min-h-screen bg-green-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome, {user.username || user.email}!
            </h1>
            <p className="text-gray-600 mt-2">
              Select your virtual plant to start or continue your journey
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Logout
          </button>
        </div>

        {/* Urgent Care Alerts */}
        {criticalPlants.length > 0 && (
          <div className="mb-6 bg-red-100 border border-red-300 rounded-lg p-4">
            <h3 className="text-red-800 font-bold mb-2 flex items-center">
              <span className="mr-2">🚨</span>
              Plants Need Urgent Care!
            </h3>
            <div className="flex flex-wrap gap-2">
              {criticalPlants.map((plant) => (
                <button
                  key={plant.id}
                  onClick={() => handleSelectPlant(plant)}
                  className="bg-red-600 text-white px-3 py-1 rounded-md text-sm hover:bg-red-700 animate-pulse"
                >
                  {plant.name} ({getPlantStatus(plant.id).health}% health)
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Daily Care Reminders */}
        {plantsNeedingCare.length > 0 && (
          <div className="mb-6 bg-orange-100 border border-orange-300 rounded-lg p-4">
            <h3 className="text-orange-800 font-bold mb-2 flex items-center">
              <span className="mr-2">⏰</span>
              Plants Need Today's Care
            </h3>
            <div className="flex flex-wrap gap-2">
              {plantsNeedingCare.map((plant) => (
                <button
                  key={plant.id}
                  onClick={() => handleSelectPlant(plant)}
                  className="bg-orange-600 text-white px-3 py-1 rounded-md text-sm hover:bg-orange-700"
                >
                  {plant.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search Section */}
        <div className="mb-8">
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Search any plant..."
              className="flex-1 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            />
            <button
              onClick={handleSearch}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              disabled={searching}
            >
              {searching ? "Searching..." : "Search"}
            </button>
          </div>

          {searchResult && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
              <p className="text-blue-800">{searchResult}</p>
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-blue-700">
                Search Results
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults.map((plant) => (
                  <PlantCard key={plant.id} plant={plant} type="search" />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Featured Plants */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-green-700">
            Featured Plants
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plants.map((plant) => (
              <PlantCard key={plant.id} plant={plant} type="featured" />
            ))}
          </div>
        </div>

        {/* AI Recommended Plants */}
        {aiPlants.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-green-700">
              AI Recommended Plants
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {aiPlants.map((plant) => (
                <PlantCard key={plant.id} plant={plant} type="ai" />
              ))}
            </div>
          </div>
        )}

        <div className="text-center">
          <button
            onClick={fetchAIPlants}
            className="px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            disabled={loadingAI}
          >
            {loadingAI ? "Loading..." : "Get AI Suggestions"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlantSelectPage;
