import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import './MatchesPage.css';

function MatchesPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('rating');

  useEffect(() => {
    loadMatches();
  }, [roomId]);

  const loadMatches = async () => {
    try {
      const response = await api.getMatches(roomId);
      setMatches(response.matches);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const sortedMatches = [...matches].sort((a, b) => {
    if (sortBy === 'rating') {
      return (b.rating || 0) - (a.rating || 0);
    } else {
      // Sort by distance (would need to calculate from user location)
      return 0;
    }
  });

  if (loading) {
    return (
      <div className="matches-page">
        <div className="loading">Loading matches...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="matches-page">
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="matches-page">
      <div className="matches-container fade-in">
        <div className="header">
          <h2>🎉 Your Matches!</h2>
          <p className="subtitle">
            {matches.length === 0 
              ? "No matches found. Try again with different preferences!" 
              : `You both liked ${matches.length} restaurant${matches.length !== 1 ? 's' : ''}!`
            }
          </p>
        </div>

        {matches.length > 0 && (
          <>
            <div className="sort-controls">
              <button
                className={`sort-button ${sortBy === 'rating' ? 'active' : ''}`}
                onClick={() => setSortBy('rating')}
              >
                ⭐ Sort by Rating
              </button>
              <button
                className={`sort-button ${sortBy === 'distance' ? 'active' : ''}`}
                onClick={() => setSortBy('distance')}
              >
                📍 Sort by Distance
              </button>
            </div>

            <div className="matches-list">
              {sortedMatches.map((restaurant, index) => (
                <div key={restaurant.restaurantId || index} className="match-card">
                  {restaurant.photos && restaurant.photos.length > 0 && (
                    <div 
                      className="match-image"
                      style={{ backgroundImage: `url(${restaurant.photos[0]})` }}
                    />
                  )}
                  
                  <div className="match-info">
                    <h3>{restaurant.name}</h3>
                    <div className="match-meta">
                      <span className="rating">⭐ {restaurant.rating?.toFixed(1) || 'N/A'}</span>
                      <span className="price">{'$'.repeat(restaurant.priceLevel || 1)}</span>
                    </div>
                    <p className="address">{restaurant.address}</p>
                    
                    {restaurant.location && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${restaurant.location.lat},${restaurant.location.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="directions-link"
                      >
                        📍 Get Directions
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="action-buttons">
          <button 
            className="secondary-button"
            onClick={() => navigate('/')}
          >
            Start New Session
          </button>
        </div>
      </div>
    </div>
  );
}

export default MatchesPage;
