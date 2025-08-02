import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const PlantDetails = () => {
  const navigate = useNavigate();

  // Plant state
  const [plant, setPlant] = useState(null);
  const [plantAge, setPlantAge] = useState(0);
  const [plantStage, setPlantStage] = useState("seedling");
  const [plantHealth, setPlantHealth] = useState({
    health: 0,
    water: 0,
    sunlight: 0,
    nutrients: 0,
    happiness: 0,
  });

  // Daily care tracking
  const [dailyCare, setDailyCare] = useState({
    lastCareDate: null,
    todayCareGiven: {
      water: false,
      sunlight: false,
      nutrients: false,
      happiness: false,
    },
    careStreak: 0,
    missedDays: 0,
    dailyReminder: true,
  });

  // Get today's date in YYYY-MM-DD format for consistent comparison
  const getTodayString = () => {
    return new Date().toISOString().split("T")[0];
  };

  // Get selected plant from localStorage
  useEffect(() => {
    const selectedPlant = localStorage.getItem("selectedPlant");
    if (selectedPlant) {
      const plantData = JSON.parse(selectedPlant);
      setPlant(plantData);

      // Check if this plant has existing data
      const existingData = localStorage.getItem(
        `plant_${plantData.id}_progress`
      );
      if (existingData) {
        const progressData = JSON.parse(existingData);
        setPlantAge(progressData.age || 0);
        setPlantStage(progressData.stage || "seedling");
        setPlantHealth(
          progressData.health || {
            health: 0,
            water: 0,
            sunlight: 0,
            nutrients: 0,
            happiness: 0,
          }
        );
        setDailyCare(
          progressData.dailyCare || {
            lastCareDate: null,
            todayCareGiven: {
              water: false,
              sunlight: false,
              nutrients: false,
              happiness: false,
            },
            careStreak: 0,
            missedDays: 0,
            dailyReminder: true,
          }
        );
      }
    } else {
      navigate("/plant-select");
    }
  }, [navigate]);

  // Save plant progress whenever it changes
  useEffect(() => {
    if (plant) {
      const progressData = {
        age: plantAge,
        stage: plantStage,
        health: plantHealth,
        dailyCare: dailyCare,
        lastSaved: Date.now(),
      };
      localStorage.setItem(
        `plant_${plant.id}_progress`,
        JSON.stringify(progressData)
      );
    }
  }, [plant, plantAge, plantStage, plantHealth, dailyCare]);

  // Check if it's a new day and apply daily effects
  useEffect(() => {
    if (!plant) return; // Don't run if plant isn't loaded yet

    const today = getTodayString();
    const lastCareDate = dailyCare.lastCareDate;

    console.log("Today:", today, "Last Care Date:", lastCareDate); // Debug log

    if (lastCareDate !== today) {
      // It's a new day - check if we need to apply penalties
      if (lastCareDate !== null) {
        // Calculate days missed
        const lastDate = new Date(lastCareDate);
        const todayDate = new Date(today);
        const daysDifference = Math.floor(
          (todayDate - lastDate) / (1000 * 60 * 60 * 24)
        );

        console.log("Days difference:", daysDifference); // Debug log

        if (daysDifference > 1) {
          // Player missed one or more days (more than 1 day gap)
          const daysMissed = daysDifference - 1;

          console.log("Days missed:", daysMissed); // Debug log

          // Apply penalties for missed days
          setPlantHealth((prev) => ({
            health: Math.max(0, prev.health - daysMissed * 15),
            water: Math.max(0, prev.water - daysMissed * 20),
            sunlight: Math.max(0, prev.sunlight - daysMissed * 15),
            nutrients: Math.max(0, prev.nutrients - daysMissed * 10),
            happiness: Math.max(0, prev.happiness - daysMissed * 25),
          }));

          setDailyCare((prev) => ({
            ...prev,
            missedDays: prev.missedDays + daysMissed,
            careStreak: 0, // Reset streak
            todayCareGiven: {
              water: false,
              sunlight: false,
              nutrients: false,
              happiness: false,
            },
            dailyReminder: true,
          }));
        } else {
          // Just a normal new day - reset daily care tasks
          setDailyCare((prev) => ({
            ...prev,
            todayCareGiven: {
              water: false,
              sunlight: false,
              nutrients: false,
              happiness: false,
            },
            dailyReminder: true,
          }));
        }
      } else {
        // First time caring for this plant
        setDailyCare((prev) => ({
          ...prev,
          todayCareGiven: {
            water: false,
            sunlight: false,
            nutrients: false,
            happiness: false,
          },
          dailyReminder: true,
        }));
      }
    }
  }, [plant, dailyCare.lastCareDate]);

  // Auto-decay system - plant health decreases over time if not cared for recently
  useEffect(() => {
    if (!plant) return;

    const decayTimer = setInterval(() => {
      const today = getTodayString();
      const lastCareDate = dailyCare.lastCareDate;

      // Only decay if player hasn't completed today's care
      if (!isDailyCareComplete() || lastCareDate !== today) {
        setPlantHealth((prev) => {
          const newHealth = {
            health: Math.max(0, prev.health - 1), // Slower decay
            water: Math.max(0, prev.water - 2),
            sunlight: Math.max(0, prev.sunlight - 1),
            nutrients: Math.max(0, prev.nutrients - 0.5),
            happiness: Math.max(0, prev.happiness - 1.5),
          };

          // Update overall health based on other stats
          const avgStats =
            (newHealth.water +
              newHealth.sunlight +
              newHealth.nutrients +
              newHealth.happiness) /
            4;
          newHealth.health = Math.round(avgStats);

          return newHealth;
        });
      }
    }, 10000); // Decay every 10 seconds

    return () => clearInterval(decayTimer);
  }, [plant, dailyCare.lastCareDate, dailyCare.todayCareGiven]);

  // Check daily care completion
  const isDailyCareComplete = () => {
    const care = dailyCare.todayCareGiven;
    return care.water && care.sunlight && care.nutrients && care.happiness;
  };

  // Get daily care progress
  const getDailyCareProgress = () => {
    const care = dailyCare.todayCareGiven;
    const completed = Object.values(care).filter(Boolean).length;
    return (completed / 4) * 100;
  };

  // Determine plant stage based on health
  const getPlantStage = (health) => {
    if (health < 20) return "dying";
    if (health < 40) return "seedling";
    if (health < 60) return "young";
    if (health < 80) return "mature";
    return "flowering";
  };

  // Update plant stage based on health changes
  useEffect(() => {
    const newStage = getPlantStage(plantHealth.health);
    setPlantStage(newStage);

    // Age increases only when plant is healthy and daily care is complete
    if (plantHealth.health > 50 && isDailyCareComplete()) {
      const ageTimer = setTimeout(() => {
        setPlantAge((prev) => prev + 1);
      }, 30000);

      return () => clearTimeout(ageTimer);
    }
  }, [plantHealth.health, dailyCare.todayCareGiven]);

  // Enhanced action handlers with daily tracking
  const waterPlant = () => {
    const today = getTodayString();

    setPlantHealth((prev) => {
      const newWater = Math.min(100, prev.water + 25);
      const newHappiness = Math.min(100, prev.happiness + 5);
      const avgStats =
        (newWater + prev.sunlight + prev.nutrients + newHappiness) / 4;

      return {
        ...prev,
        water: newWater,
        happiness: newHappiness,
        health: Math.round(avgStats),
      };
    });

    // Mark daily care as given
    setDailyCare((prev) => {
      const updatedCare = {
        ...prev,
        lastCareDate: today,
        todayCareGiven: {
          ...prev.todayCareGiven,
          water: true,
        },
      };

      // Check if this completes daily care
      const newCareGiven = updatedCare.todayCareGiven;
      if (
        newCareGiven.water &&
        newCareGiven.sunlight &&
        newCareGiven.nutrients &&
        newCareGiven.happiness
      ) {
        updatedCare.careStreak = prev.careStreak + 1;
        updatedCare.dailyReminder = false;
      }

      return updatedCare;
    });
  };

  const giveSunlight = () => {
    const today = getTodayString();

    setPlantHealth((prev) => {
      const newSunlight = Math.min(100, prev.sunlight + 20);
      const newHappiness = Math.min(100, prev.happiness + 3);
      const avgStats =
        (prev.water + newSunlight + prev.nutrients + newHappiness) / 4;

      return {
        ...prev,
        sunlight: newSunlight,
        happiness: newHappiness,
        health: Math.round(avgStats),
      };
    });

    setDailyCare((prev) => {
      const updatedCare = {
        ...prev,
        lastCareDate: today,
        todayCareGiven: {
          ...prev.todayCareGiven,
          sunlight: true,
        },
      };

      const newCareGiven = updatedCare.todayCareGiven;
      if (
        newCareGiven.water &&
        newCareGiven.sunlight &&
        newCareGiven.nutrients &&
        newCareGiven.happiness
      ) {
        updatedCare.careStreak = prev.careStreak + 1;
        updatedCare.dailyReminder = false;
      }

      return updatedCare;
    });
  };

  const addNutrients = () => {
    const today = getTodayString();

    setPlantHealth((prev) => {
      const newNutrients = Math.min(100, prev.nutrients + 30);
      const newHappiness = Math.min(100, prev.happiness + 7);
      const avgStats =
        (prev.water + prev.sunlight + newNutrients + newHappiness) / 4;

      return {
        ...prev,
        nutrients: newNutrients,
        happiness: newHappiness,
        health: Math.round(avgStats),
      };
    });

    setDailyCare((prev) => {
      const updatedCare = {
        ...prev,
        lastCareDate: today,
        todayCareGiven: {
          ...prev.todayCareGiven,
          nutrients: true,
        },
      };

      const newCareGiven = updatedCare.todayCareGiven;
      if (
        newCareGiven.water &&
        newCareGiven.sunlight &&
        newCareGiven.nutrients &&
        newCareGiven.happiness
      ) {
        updatedCare.careStreak = prev.careStreak + 1;
        updatedCare.dailyReminder = false;
      }

      return updatedCare;
    });
  };

  const playWithPlant = () => {
    const today = getTodayString();

    setPlantHealth((prev) => {
      const newHappiness = Math.min(100, prev.happiness + 15);
      const avgStats =
        (prev.water + prev.sunlight + prev.nutrients + newHappiness) / 4;

      return {
        ...prev,
        happiness: newHappiness,
        health: Math.round(avgStats),
      };
    });

    setDailyCare((prev) => {
      const updatedCare = {
        ...prev,
        lastCareDate: today,
        todayCareGiven: {
          ...prev.todayCareGiven,
          happiness: true,
        },
      };

      const newCareGiven = updatedCare.todayCareGiven;
      if (
        newCareGiven.water &&
        newCareGiven.sunlight &&
        newCareGiven.nutrients &&
        newCareGiven.happiness
      ) {
        updatedCare.careStreak = prev.careStreak + 1;
        updatedCare.dailyReminder = false;
      }

      return updatedCare;
    });
  };

  // Get health status color
  const getHealthColor = (value) => {
    if (value >= 80) return "text-green-600";
    if (value >= 60) return "text-yellow-600";
    if (value >= 40) return "text-orange-600";
    if (value >= 20) return "text-red-600";
    return "text-gray-600";
  };

  const getHealthBgColor = (value) => {
    if (value >= 80) return "bg-green-500";
    if (value >= 60) return "bg-yellow-500";
    if (value >= 40) return "bg-orange-500";
    if (value >= 20) return "bg-red-500";
    return "bg-gray-500";
  };

  // Get stage information based on health
  const getStageInfo = (stage) => {
    switch (stage) {
      case "dying":
        return {
          name: "Dying",
          description: "Your plant is dying! Needs immediate care!",
          emoji: "💀",
          color: "text-red-600",
          nextStage: "Care for your plant to revive it!",
        };
      case "seedling":
        return {
          name: "Struggling Seedling",
          description: "Just sprouted but needs more care to grow.",
          emoji: "🌱",
          color: "text-yellow-600",
          nextStage: "Improve health to 40% for growth",
        };
      case "young":
        return {
          name: "Young Plant",
          description: "Growing well! Keep up the good care.",
          emoji: "🌿",
          color: "text-green-500",
          nextStage: "Reach 60% health to mature",
        };
      case "mature":
        return {
          name: "Mature Plant",
          description: "Healthy and strong! Almost ready to flower.",
          emoji: "🪴",
          color: "text-green-600",
          nextStage: "Reach 80% health to flower",
        };
      case "flowering":
        return {
          name: "Flowering Plant",
          description: "Beautiful and fully bloomed! Perfect care!",
          emoji: "🌺",
          color: "text-pink-600",
          nextStage: "Maintain health to keep flowering!",
        };
      default:
        return {
          name: "Seedling",
          description: "Just starting to grow.",
          emoji: "🌱",
          color: "text-green-400",
          nextStage: "Keep caring!",
        };
    }
  };

  // Render plant SVG based on stage and health - ENHANCED to show neglect
  const renderPlantSVG = () => {
    const healthPercent = plantHealth.health;
    const waterLevel = plantHealth.water;
    const isNeglected =
      !isDailyCareComplete() && dailyCare.lastCareDate !== getTodayString();

    return (
      <svg
        width="300"
        height="400"
        viewBox="0 0 300 400"
        className="mx-auto transform hover:scale-105 transition-transform duration-300"
      >
        {/* Pot */}
        <path
          d="M80 320 L220 320 L210 380 L90 380 Z"
          fill="#8B4513"
          stroke="#654321"
          strokeWidth="2"
        />

        {/* Soil - color changes based on health and water */}
        <ellipse
          cx="150"
          cy="320"
          rx="70"
          ry="10"
          fill={
            waterLevel > 50
              ? "#4A4A4A"
              : waterLevel > 20
              ? "#8B7355"
              : "#D2B48C" // Dry, cracked soil
          }
        />

        {/* Render based on stage and health */}
        {(plantStage === "dying" || healthPercent < 20) && (
          <g>
            {/* Wilted/dying plant */}
            <line
              x1="150"
              y1="320"
              x2={isNeglected ? "135" : "140"}
              y2={isNeglected ? "290" : "300"}
              stroke="#8B4513"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.7"
            />
            <ellipse
              cx={isNeglected ? "133" : "138"}
              cy={isNeglected ? "285" : "295"}
              rx="5"
              ry="3"
              fill="#A0522D"
              opacity="0.8"
            />
            <text x="120" y="250" fontSize="20" fill="#8B4513">
              ☠️
            </text>
            {/* Dry leaves on ground if very neglected */}
            {isNeglected && (
              <>
                <ellipse
                  cx="100"
                  cy="330"
                  rx="8"
                  ry="4"
                  fill="#8B4513"
                  opacity="0.6"
                />
                <ellipse
                  cx="180"
                  cy="335"
                  rx="6"
                  ry="3"
                  fill="#A0522D"
                  opacity="0.6"
                />
              </>
            )}
          </g>
        )}

        {plantStage === "seedling" && healthPercent >= 20 && (
          <g>
            {/* Small sprout - droops if not watered */}
            <line
              x1="150"
              y1="320"
              x2="150"
              y2={320 - healthPercent * 0.5 * (waterLevel > 30 ? 1 : 0.7)}
              stroke={waterLevel > 30 ? "#90EE90" : "#8FBC8F"}
              strokeWidth={Math.max(2, healthPercent * 0.08)}
              strokeLinecap="round"
              transform={waterLevel < 30 ? "rotate(10 150 320)" : ""}
            />
            <ellipse
              cx="150"
              cy={320 - healthPercent * 0.5 * (waterLevel > 30 ? 1 : 0.7) - 5}
              rx={Math.max(4, healthPercent * 0.15)}
              ry={Math.max(2, healthPercent * 0.08)}
              fill={waterLevel > 30 ? "#90EE90" : "#8FBC8F"}
              opacity={waterLevel > 30 ? 1 : 0.8}
            />
          </g>
        )}

        {plantStage === "young" && healthPercent >= 40 && (
          <g>
            {/* Medium plant - leaves droop if not cared for */}
            <line
              x1="150"
              y1="320"
              x2="150"
              y2={270 - (healthPercent - 40) * 0.5}
              stroke="#228B22"
              strokeWidth={Math.max(3, (healthPercent - 40) * 0.1 + 3)}
              strokeLinecap="round"
            />
            <ellipse
              cx="130"
              cy={280 - (healthPercent - 40) * 0.3}
              rx={10 + (healthPercent - 40) * 0.2}
              ry={6 + (healthPercent - 40) * 0.1}
              fill={waterLevel > 40 ? "#32CD32" : "#228B22"}
              opacity={waterLevel > 40 ? 1 : 0.7}
              transform={`rotate(${waterLevel > 40 ? -20 : -35} 130 ${
                280 - (healthPercent - 40) * 0.3
              })`}
            />
            <ellipse
              cx="170"
              cy={280 - (healthPercent - 40) * 0.3}
              rx={10 + (healthPercent - 40) * 0.2}
              ry={6 + (healthPercent - 40) * 0.1}
              fill={waterLevel > 40 ? "#32CD32" : "#228B22"}
              opacity={waterLevel > 40 ? 1 : 0.7}
              transform={`rotate(${waterLevel > 40 ? 20 : 35} 170 ${
                280 - (healthPercent - 40) * 0.3
              })`}
            />
          </g>
        )}

        {plantStage === "mature" && healthPercent >= 60 && (
          <g>
            {/* Large plant */}
            <line
              x1="150"
              y1="320"
              x2="150"
              y2="200"
              stroke="#228B22"
              strokeWidth={6 + (healthPercent - 60) * 0.1}
              strokeLinecap="round"
            />
            <g className={waterLevel > 50 ? "animate-pulse" : ""}>
              <ellipse
                cx="120"
                cy="220"
                rx={20 + (healthPercent - 60) * 0.2}
                ry={12 + (healthPercent - 60) * 0.1}
                fill={waterLevel > 50 ? "#32CD32" : "#228B22"}
                opacity={waterLevel > 50 ? 1 : 0.8}
                transform={`rotate(${waterLevel > 50 ? -30 : -45} 120 220)`}
              />
              <ellipse
                cx="180"
                cy="220"
                rx={20 + (healthPercent - 60) * 0.2}
                ry={12 + (healthPercent - 60) * 0.1}
                fill={waterLevel > 50 ? "#32CD32" : "#228B22"}
                opacity={waterLevel > 50 ? 1 : 0.8}
                transform={`rotate(${waterLevel > 50 ? 30 : 45} 180 220)`}
              />
              <ellipse
                cx="110"
                cy="180"
                rx={25 + (healthPercent - 60) * 0.2}
                ry={15 + (healthPercent - 60) * 0.1}
                fill={waterLevel > 50 ? "#228B22" : "#556B2F"}
                opacity={waterLevel > 50 ? 1 : 0.8}
                transform={`rotate(${waterLevel > 50 ? -45 : -60} 110 180)`}
              />
              <ellipse
                cx="190"
                cy="180"
                rx={25 + (healthPercent - 60) * 0.2}
                ry={15 + (healthPercent - 60) * 0.1}
                fill={waterLevel > 50 ? "#228B22" : "#556B2F"}
                opacity={waterLevel > 50 ? 1 : 0.8}
                transform={`rotate(${waterLevel > 50 ? 45 : 60} 190 180)`}
              />
              <ellipse
                cx="150"
                cy="160"
                rx={30 + (healthPercent - 60) * 0.3}
                ry={18 + (healthPercent - 60) * 0.2}
                fill={waterLevel > 50 ? "#32CD32" : "#228B22"}
                opacity={waterLevel > 50 ? 1 : 0.8}
              />
            </g>
          </g>
        )}

        {plantStage === "flowering" && healthPercent >= 80 && (
          <g>
            <line
              x1="150"
              y1="320"
              x2="150"
              y2="180"
              stroke="#228B22"
              strokeWidth="10"
              strokeLinecap="round"
            />
            <g className="animate-pulse">
              <ellipse
                cx="110"
                cy="200"
                rx="30"
                ry="18"
                fill="#228B22"
                transform="rotate(-35 110 200)"
              />
              <ellipse
                cx="190"
                cy="200"
                rx="30"
                ry="18"
                fill="#228B22"
                transform="rotate(35 190 200)"
              />
              <ellipse
                cx="120"
                cy="160"
                rx="35"
                ry="20"
                fill="#90EE90"
                transform="rotate(-15 120 160)"
              />
              <ellipse
                cx="180"
                cy="160"
                rx="35"
                ry="20"
                fill="#90EE90"
                transform="rotate(15 180 160)"
              />
              <ellipse cx="150" cy="140" rx="40" ry="25" fill="#32CD32" />
            </g>

            <g className="animate-bounce">
              <circle cx="130" cy="120" r="12" fill="#FF69B4" />
              <circle cx="130" cy="120" r="6" fill="#FFB6C1" />
              <circle cx="170" cy="125" r="10" fill="#FF1493" />
              <circle cx="170" cy="125" r="5" fill="#FFB6C1" />
              <circle cx="150" cy="110" r="15" fill="#FF69B4" />
              <circle cx="150" cy="110" r="8" fill="#FFF" />

              {healthPercent > 90 && (
                <>
                  <circle cx="100" cy="140" r="8" fill="#FFB6C1" />
                  <circle cx="200" cy="135" r="6" fill="#FF69B4" />
                </>
              )}
            </g>
          </g>
        )}

        {/* Water drops only if recently watered (and plant is alive) */}
        {plantHealth.water > 70 &&
          plantStage !== "dying" &&
          dailyCare.todayCareGiven.water && (
            <g className="animate-bounce">
              <circle cx="100" cy="160" r="3" fill="#87CEEB" opacity="0.7" />
              <circle cx="200" cy="180" r="2" fill="#87CEEB" opacity="0.7" />
              <circle cx="160" cy="140" r="2.5" fill="#87CEEB" opacity="0.7" />
            </g>
          )}

        {/* Wilting/stress indicators */}
        {plantHealth.water < 30 && plantStage !== "dying" && (
          <g>
            <text x="250" y="50" fontSize="24" fill="#FF6600">
              💧
            </text>
            <text x="50" y="50" fontSize="16" fill="#FF6600">
              Thirsty!
            </text>
          </g>
        )}

        {/* General health warnings */}
        {plantHealth.health < 30 && plantStage !== "dying" && (
          <g>
            <text x="250" y="80" fontSize="24" fill="#FF0000">
              ⚠️
            </text>
            <text x="60" y="80" fontSize="20" fill="#FF0000">
              💔
            </text>
          </g>
        )}

        {/* Neglect indicator - shows if care is overdue */}
        {isNeglected && plantHealth.health > 20 && (
          <g>
            <text
              x="150"
              y="40"
              fontSize="16"
              fill="#FF4500"
              textAnchor="middle"
            >
              Needs Care!
            </text>
            <circle
              cx="150"
              cy="50"
              r="20"
              fill="none"
              stroke="#FF4500"
              strokeWidth="2"
              opacity="0.5"
            />
          </g>
        )}
      </svg>
    );
  };

  if (!plant) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your plant...</p>
        </div>
      </div>
    );
  }

  const stageInfo = getStageInfo(plantStage);
  const dailyCareProgress = getDailyCareProgress();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with daily care reminder */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">{plant.name}</h1>
            <p className="text-gray-600 mt-2">{plant.description}</p>
            <div className="flex items-center mt-3 space-x-4">
              <span className={`flex items-center ${stageInfo.color}`}>
                <span className="text-2xl mr-2">{stageInfo.emoji}</span>
                <span className="font-semibold">{stageInfo.name}</span>
              </span>
              <span className="text-gray-500">•</span>
              <span className="text-gray-600">Age: {plantAge} days</span>

              {/* Daily care status */}
              <span className="text-gray-500">•</span>
              <span
                className={`font-semibold ${
                  isDailyCareComplete() ? "text-green-600" : "text-orange-600"
                }`}
              >
                Daily Care: {Math.round(dailyCareProgress)}%
              </span>

              {/* Debug info - remove in production */}
              <span className="text-gray-500">•</span>
              <span className="text-xs text-gray-500">
                Today: {getTodayString()}, Last: {dailyCare.lastCareDate}
              </span>

              {plantHealth.health < 30 && (
                <>
                  <span className="text-gray-500">•</span>
                  <span className="text-red-600 font-semibold animate-pulse">
                    ⚠️ Critical Health!
                  </span>
                </>
              )}
            </div>
          </div>
          <button
            onClick={() => navigate("/plant-select")}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            ← Back to Plants
          </button>
        </div>

        {/* Daily Care Reminder Banner */}
        {dailyCare.dailyReminder && !isDailyCareComplete() && (
          <div className="mb-6 bg-gradient-to-r from-blue-500 to-purple-500 text-white p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">
                  🌱 Daily Plant Care Reminder
                </h3>
                <p className="text-sm opacity-90">
                  Your plant needs daily attention! Complete all care tasks
                  today to maintain health.
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">
                  {Math.round(dailyCareProgress)}%
                </p>
                <p className="text-xs">Complete</p>
              </div>
            </div>
            <div className="mt-3 w-full bg-white bg-opacity-20 rounded-full h-2">
              <div
                className="bg-white h-2 rounded-full transition-all duration-500"
                style={{ width: `${dailyCareProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Daily Care Complete Celebration */}
        {isDailyCareComplete() && (
          <div className="mb-6 bg-gradient-to-r from-green-500 to-emerald-500 text-white p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">🎉 Daily Care Complete!</h3>
                <p className="text-sm opacity-90">
                  Excellent job! Your plant is happy and healthy today. Care
                  streak: {dailyCare.careStreak} days
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl">✅</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Side - Plant Health with daily tracking */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <span className="text-green-600 mr-2">🌱</span>
              Plant Health
            </h2>

            {/* Daily Care Progress */}
            <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-purple-700">
                  📅 Today's Care
                </span>
                <span className="text-sm text-gray-500">
                  {Math.round(dailyCareProgress)}%
                </span>
              </div>

              {/* Care checklist */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div
                  className={`flex items-center text-xs ${
                    dailyCare.todayCareGiven.water
                      ? "text-green-600"
                      : "text-gray-400"
                  }`}
                >
                  <span className="mr-1">
                    {dailyCare.todayCareGiven.water ? "✅" : "⭕"}
                  </span>
                  Water
                </div>
                <div
                  className={`flex items-center text-xs ${
                    dailyCare.todayCareGiven.sunlight
                      ? "text-green-600"
                      : "text-gray-400"
                  }`}
                >
                  <span className="mr-1">
                    {dailyCare.todayCareGiven.sunlight ? "✅" : "⭕"}
                  </span>
                  Sunlight
                </div>
                <div
                  className={`flex items-center text-xs ${
                    dailyCare.todayCareGiven.nutrients
                      ? "text-green-600"
                      : "text-gray-400"
                  }`}
                >
                  <span className="mr-1">
                    {dailyCare.todayCareGiven.nutrients ? "✅" : "⭕"}
                  </span>
                  Nutrients
                </div>
                <div
                  className={`flex items-center text-xs ${
                    dailyCare.todayCareGiven.happiness
                      ? "text-green-600"
                      : "text-gray-400"
                  }`}
                >
                  <span className="mr-1">
                    {dailyCare.todayCareGiven.happiness ? "✅" : "⭕"}
                  </span>
                  Play Time
                </div>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${dailyCareProgress}%` }}
                ></div>
              </div>
            </div>

            {/* Care Stats */}
            <div className="mb-6 p-3 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center">
                  <p className="font-semibold text-green-600">
                    {dailyCare.careStreak}
                  </p>
                  <p className="text-gray-600">Care Streak</p>
                </div>
                <div className="text-center">
                  <p className="font-semibold text-red-600">
                    {dailyCare.missedDays}
                  </p>
                  <p className="text-gray-600">Missed Days</p>
                </div>
              </div>
            </div>

            {/* Growth Stage Info */}
            <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className={`font-bold ${stageInfo.color}`}>
                  {stageInfo.emoji} {stageInfo.name}
                </span>
                <span className="text-sm text-gray-500">Day {plantAge}</span>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                {stageInfo.description}
              </p>
              <p className="text-xs text-blue-600 font-medium">
                {stageInfo.nextStage}
              </p>
            </div>

            {/* Overall Health */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-gray-700">
                  Overall Health
                </span>
                <span
                  className={`font-bold text-lg ${getHealthColor(
                    plantHealth.health
                  )}`}
                >
                  {plantHealth.health}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-500 ${getHealthBgColor(
                    plantHealth.health
                  )}`}
                  style={{ width: `${plantHealth.health}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Complete daily care to maintain and improve health
              </p>
            </div>

            {/* Individual Stats */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-700 flex items-center">
                    <span className="text-blue-500 mr-2">💧</span>
                    Water Level
                  </span>
                  <span
                    className={`font-semibold ${getHealthColor(
                      plantHealth.water
                    )}`}
                  >
                    {plantHealth.water}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${plantHealth.water}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-700 flex items-center">
                    <span className="text-yellow-500 mr-2">☀️</span>
                    Sunlight
                  </span>
                  <span
                    className={`font-semibold ${getHealthColor(
                      plantHealth.sunlight
                    )}`}
                  >
                    {plantHealth.sunlight}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${plantHealth.sunlight}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-700 flex items-center">
                    <span className="text-green-500 mr-2">🌿</span>
                    Nutrients
                  </span>
                  <span
                    className={`font-semibold ${getHealthColor(
                      plantHealth.nutrients
                    )}`}
                  >
                    {plantHealth.nutrients}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${plantHealth.nutrients}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-700 flex items-center">
                    <span className="text-pink-500 mr-2">😊</span>
                    Happiness
                  </span>
                  <span
                    className={`font-semibold ${getHealthColor(
                      plantHealth.happiness
                    )}`}
                  >
                    {plantHealth.happiness}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-pink-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${plantHealth.happiness}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Plant Status */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Plant Status</h3>
              <p
                className={`text-sm ${getHealthColor(plantHealth.health)} mb-1`}
              >
                {plantHealth.health >= 80 && "Your plant is thriving! 🌟"}
                {plantHealth.health >= 60 &&
                  plantHealth.health < 80 &&
                  "Your plant is doing well! 👍"}
                {plantHealth.health >= 40 &&
                  plantHealth.health < 60 &&
                  "Your plant needs some attention 🤔"}
                {plantHealth.health >= 20 &&
                  plantHealth.health < 40 &&
                  "Your plant is struggling! 😰"}
                {plantHealth.health < 20 && "CRITICAL: Your plant is dying! 💀"}
              </p>

              <p className="text-xs text-gray-600 mt-2">
                {!isDailyCareComplete() &&
                  "⏰ Don't forget to complete today's care routine!"}
                {isDailyCareComplete() &&
                  dailyCare.careStreak > 0 &&
                  `🔥 Great job! ${dailyCare.careStreak} day care streak!`}
                {dailyCare.missedDays > 0 &&
                  ` (${dailyCare.missedDays} days missed recently)`}
              </p>
            </div>
          </div>

          {/* Center - Plant SVG */}
          <div className="bg-white rounded-xl shadow-lg p-8 flex items-center justify-center">
            <div className="text-center">
              <div className="mb-6">{renderPlantSVG()}</div>

              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {plant.name}
              </h3>
              <p className="text-gray-600 text-sm mb-4">{plant.care}</p>

              <div
                className={`rounded-lg p-4 ${
                  plantHealth.health < 20
                    ? "bg-red-100"
                    : plantHealth.health < 40
                    ? "bg-yellow-100"
                    : "bg-green-100"
                }`}
              >
                <div className="flex items-center justify-center mb-2">
                  <span className="text-2xl mr-2">{stageInfo.emoji}</span>
                  <span className={`font-bold ${stageInfo.color}`}>
                    {stageInfo.name}
                  </span>
                </div>
                <p
                  className={`font-semibold ${getHealthColor(
                    plantHealth.health
                  )}`}
                >
                  Health: {plantHealth.health}%
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Age: {plantAge} days
                </p>

                {/* Daily care progress */}
                <div className="mt-3">
                  <p className="text-xs text-gray-600 mb-1">
                    Today's Care Progress:
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${dailyCareProgress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Daily Care Actions */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <span className="text-blue-600 mr-2">🛠️</span>
              Daily Plant Care
              {!isDailyCareComplete() && (
                <span className="ml-2 text-orange-600 animate-pulse">⏰</span>
              )}
              {isDailyCareComplete() && (
                <span className="ml-2 text-green-600">✅</span>
              )}
            </h2>

            <div className="space-y-4">
              {/* Water Plant */}
              <button
                onClick={waterPlant}
                disabled={dailyCare.todayCareGiven.water}
                className={`w-full p-4 rounded-lg transition-colors flex items-center justify-center space-x-2 ${
                  dailyCare.todayCareGiven.water
                    ? "bg-green-500 text-white cursor-not-allowed"
                    : plantHealth.water < 30
                    ? "bg-red-500 hover:bg-red-600 animate-pulse text-white"
                    : "bg-blue-500 hover:bg-blue-600 text-white"
                }`}
              >
                <span className="text-2xl">
                  {dailyCare.todayCareGiven.water ? "✅" : "💧"}
                </span>
                <span className="font-semibold">
                  {dailyCare.todayCareGiven.water
                    ? "Water Given Today ✓"
                    : plantHealth.water < 30
                    ? "URGENT: Water Plant"
                    : "Water Plant"}
                </span>
              </button>

              {/* Give Sunlight */}
              <button
                onClick={giveSunlight}
                disabled={dailyCare.todayCareGiven.sunlight}
                className={`w-full p-4 rounded-lg transition-colors flex items-center justify-center space-x-2 ${
                  dailyCare.todayCareGiven.sunlight
                    ? "bg-green-500 text-white cursor-not-allowed"
                    : plantHealth.sunlight < 30
                    ? "bg-red-500 hover:bg-red-600 animate-pulse text-white"
                    : "bg-yellow-500 hover:bg-yellow-600 text-white"
                }`}
              >
                <span className="text-2xl">
                  {dailyCare.todayCareGiven.sunlight ? "✅" : "☀️"}
                </span>
                <span className="font-semibold">
                  {dailyCare.todayCareGiven.sunlight
                    ? "Sunlight Given Today ✓"
                    : plantHealth.sunlight < 30
                    ? "URGENT: Give Sunlight"
                    : "Give Sunlight"}
                </span>
              </button>

              {/* Add Nutrients */}
              <button
                onClick={addNutrients}
                disabled={dailyCare.todayCareGiven.nutrients}
                className={`w-full p-4 rounded-lg transition-colors flex items-center justify-center space-x-2 ${
                  dailyCare.todayCareGiven.nutrients
                    ? "bg-green-500 text-white cursor-not-allowed"
                    : plantHealth.nutrients < 30
                    ? "bg-red-500 hover:bg-red-600 animate-pulse text-white"
                    : "bg-green-500 hover:bg-green-600 text-white"
                }`}
              >
                <span className="text-2xl">
                  {dailyCare.todayCareGiven.nutrients ? "✅" : "🌿"}
                </span>
                <span className="font-semibold">
                  {dailyCare.todayCareGiven.nutrients
                    ? "Nutrients Given Today ✓"
                    : plantHealth.nutrients < 30
                    ? "URGENT: Add Nutrients"
                    : "Add Nutrients"}
                </span>
              </button>

              {/* Play with Plant */}
              <button
                onClick={playWithPlant}
                disabled={dailyCare.todayCareGiven.happiness}
                className={`w-full p-4 rounded-lg transition-colors flex items-center justify-center space-x-2 ${
                  dailyCare.todayCareGiven.happiness
                    ? "bg-green-500 text-white cursor-not-allowed"
                    : plantHealth.happiness < 30
                    ? "bg-red-500 hover:bg-red-600 animate-pulse text-white"
                    : "bg-pink-500 hover:bg-pink-600 text-white"
                }`}
              >
                <span className="text-2xl">
                  {dailyCare.todayCareGiven.happiness ? "✅" : "🎵"}
                </span>
                <span className="font-semibold">
                  {dailyCare.todayCareGiven.happiness
                    ? "Play Time Done Today ✓"
                    : plantHealth.happiness < 30
                    ? "URGENT: Cheer Up Plant"
                    : "Play Music"}
                </span>
              </button>

              {/* Emergency Care Button */}
              {plantHealth.health < 20 && (
                <button
                  onClick={() => {
                    setPlantHealth({
                      health: 40,
                      water: 50,
                      sunlight: 40,
                      nutrients: 45,
                      happiness: 35,
                    });
                  }}
                  className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white p-4 rounded-lg transition-colors flex items-center justify-center space-x-2 animate-bounce"
                >
                  <span className="text-2xl">🚑</span>
                  <span className="font-semibold">EMERGENCY CARE</span>
                </button>
              )}
            </div>

            {/* Daily Goals Summary */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">
                📋 Daily Goals
              </h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li
                  className={
                    dailyCare.todayCareGiven.water
                      ? "line-through opacity-60"
                      : ""
                  }
                >
                  • {dailyCare.todayCareGiven.water ? "✅" : "🎯"} Water your
                  plant
                </li>
                <li
                  className={
                    dailyCare.todayCareGiven.sunlight
                      ? "line-through opacity-60"
                      : ""
                  }
                >
                  • {dailyCare.todayCareGiven.sunlight ? "✅" : "🎯"} Give
                  sunlight exposure
                </li>
                <li
                  className={
                    dailyCare.todayCareGiven.nutrients
                      ? "line-through opacity-60"
                      : ""
                  }
                >
                  • {dailyCare.todayCareGiven.nutrients ? "✅" : "🎯"} Add
                  nutrients/fertilizer
                </li>
                <li
                  className={
                    dailyCare.todayCareGiven.happiness
                      ? "line-through opacity-60"
                      : ""
                  }
                >
                  • {dailyCare.todayCareGiven.happiness ? "✅" : "🎯"} Spend
                  quality time (play music)
                </li>
              </ul>

              {isDailyCareComplete() && (
                <div className="mt-3 p-2 bg-green-100 rounded-lg text-center">
                  <p className="text-green-800 font-semibold text-sm">
                    🎉 All daily goals completed! Great job!
                  </p>
                </div>
              )}
            </div>

            {/* Care Statistics */}
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg text-center">
                <p className="text-2xl">🔥</p>
                <p className="text-sm font-semibold text-gray-700">
                  {dailyCare.careStreak} Day Streak
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg text-center">
                <p className="text-2xl">📅</p>
                <p className="text-sm font-semibold text-gray-700">
                  {Math.round(dailyCareProgress)}% Today
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlantDetails;
