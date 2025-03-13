import React, { useState } from 'react';
import { Search, MapPin, Navigation } from 'lucide-react';
import { destinations } from './data/destinations';

function App() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredDestinations = destinations.filter(dest =>
    dest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dest.state.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDestinationClick = (destinationName: string) => {
    const searchQuery = encodeURIComponent(`${destinationName} tourist attraction`);
    window.open(`https://www.google.com/search?q=${searchQuery}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div 
        className="h-[60vh] bg-cover bg-center relative"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1485738422979-f5c462d49f74?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80")'
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center text-white px-4">
          <h1 className="text-5xl font-bold mb-4 text-center">Discover America's Beautiful Places</h1>
          <p className="text-xl mb-8 text-center max-w-2xl">Explore our carefully selected guide to 100 incredible destinations to visit across the United States.</p>
          <div className="relative w-full max-w-xl">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search destinations..."
              className="w-full pl-12 pr-4 py-3 rounded-full bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Destinations Grid */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredDestinations.map((destination) => (
            <div 
              key={destination.id} 
              className="bg-white rounded-lg shadow-lg overflow-hidden transition-transform hover:scale-105 cursor-pointer"
              onClick={() => handleDestinationClick(destination.name)}
            >
              <img
                src={destination.imageUrl}
                alt={destination.name}
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <div className="flex items-center mb-2">
                  <MapPin className="w-5 h-5 text-blue-500 mr-2" />
                  <h3 className="text-xl font-semibold text-gray-900">{destination.name}</h3>
                </div>
                <p className="text-gray-600 mb-4 flex items-center">
                  <Navigation className="w-4 h-4 mr-1" />
                  {destination.state}
                </p>
                <p className="text-gray-700">{destination.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p>© 2024 US Travel Guide. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;