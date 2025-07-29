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

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      navigate("/login");
    }
  }, [navigate]);

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
    alert(`You selected ${plant.name}!`);
    localStorage.setItem("selectedPlant", JSON.stringify(plant));
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
        // Ensure each plant has required properties
        const validPlants = data.plants.map((plant, index) => ({
          id: plant.id || Date.now() + index,
          name: plant.name || `AI Plant ${index + 1}`,
          description: plant.description || "AI-generated plant description",
          care: plant.care || "AI-suggested care instructions",
        }));

        setAiPlants(validPlants);
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
        // Ensure each plant has required properties
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

  if (!user) return <div>Loading...</div>;

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
              Select your virtual plant to start your journey
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Logout
          </button>
        </div>

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
                  <div
                    key={plant.id}
                    className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg border-l-4 border-blue-500"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {plant.name}
                      </h3>
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                        Search Result
                      </span>
                    </div>
                    <button
                      onClick={() => handleSelectPlant(plant)}
                      className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
                    >
                      Select {plant.name}
                    </button>
                  </div>
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
              <div
                key={plant.id}
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg"
              >
                <h3 className="text-xl font-semibold mb-3 text-gray-900">
                  {plant.name}
                </h3>
                <p className="text-gray-600 mb-3">{plant.description}</p>
                <p className="text-sm text-gray-500 mb-4">
                  <strong>Care:</strong> {plant.care}
                </p>
                <button
                  onClick={() => handleSelectPlant(plant)}
                  className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700"
                >
                  Select {plant.name}
                </button>
              </div>
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
                <div
                  key={plant.id}
                  className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg border-l-4 border-purple-500"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {plant.name}
                    </h3>
                    <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
                      AI Suggested
                    </span>
                  </div>
                  <button
                    onClick={() => handleSelectPlant(plant)}
                    className="w-full bg-purple-600 text-white py-2 rounded-md hover:bg-purple-700"
                  >
                    Select {plant.name}
                  </button>
                </div>
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
