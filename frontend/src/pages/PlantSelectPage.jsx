import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const PlantSelectPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  const plants = [
    {
      id: 1,
      name: 'Rose Plant',
      description: 'Beautiful flowering plant with vibrant colors',
      care: 'Water daily, needs sunlight'
    },
    {
      id: 2,
      name: 'Sunflower',
      description: 'Bright and cheerful plant that follows the sun',
      care: 'Water regularly, full sun exposure'
    },
    {
      id: 3,
      name: 'Cactus',
      description: 'Low maintenance succulent perfect for beginners',
      care: 'Water sparingly, indirect sunlight'
    },
    {
      id: 4,
      name: 'Lavender',
      description: 'Fragrant herb with calming properties',
      care: 'Water moderately, well-drained soil'
    },
    {
      id: 5,
      name: 'Monstera',
      description: 'Trendy houseplant with unique split leaves',
      care: 'Water weekly, bright indirect light'
    },
    {
      id: 6,
      name: 'Snake Plant',
      description: 'Hardy plant that purifies air',
      care: 'Water monthly, low to bright light'
    }
  ];

  const handleSelectPlant = (plant) => {
    alert(`You selected ${plant.name}! Your virtual plant journey begins now.`);
    // Here you would typically save the plant selection to backend
    localStorage.setItem('selectedPlant', JSON.stringify(plant));
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-green-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome, {user.username || user.email}!
            </h1>
            <p className="text-gray-600 mt-2">Select your virtual plant to start your journey</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Logout
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plants.map((plant) => (
            <div key={plant.id} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold mb-3 text-gray-900">{plant.name}</h3>
              <p className="text-gray-600 mb-3">{plant.description}</p>
              <p className="text-sm text-gray-500 mb-4">
                <strong>Care:</strong> {plant.care}
              </p>
              <button 
                onClick={() => handleSelectPlant(plant)}
                className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition-colors"
              >
                Select {plant.name}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PlantSelectPage;