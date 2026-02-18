import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import socketService from '../services/socketService';
import './SwipePage.css';

function SwipePage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [swipeDirection, setSwipeDirection] = useState(null);
  const [partnerCompleted, setPartnerCompleted] = useState(false);
  const [userCompleted, setUserCompleted] = useState(false);
  const cardRef = useRef(null);
  const startXRef = useRef(0);

  useEffect(() => {
    loadRestaurants();
    
    // Listen for partner completion
    socketService.onPartnerCompleted(() => {
      setPartnerCompleted(true);
    });

    return () => {
      socketService.removeAllListeners();
    };
  }, [roomId]);

  useEffect(() => {
    // If both completed, navigate to matches
    if (userCompleted && partnerCompleted) {
      setTimeout(() => {
        navigate(`/matches/${roomId}`);
      }, 1000);
    }
  }, [userCompleted, partnerCompleted, roomId, navigate]);

  const loadRestaurants = async () => {
    try {
      const response = await api.getRestaurants(roomId);
      setRestaurants(response.restaurants);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleSwipe = async (direction) => {
    if (currentIndex >= restaurants.length) return;

    const restaurant = restaurants[currentIndex];
    const socketId = socketService.socket?.id;

    // Animate swipe
    setSwipeDirection(direction);

    // Record swipe
    try {
      await api.recordSwipe(
        roomId,
        socketId,
        restaurant.id,
        direction,
        {
          name: restaurant.name,
          address: restaurant.address,
          rating: restaurant.rating,
          priceLevel: restaurant.priceLevel,
          photos: restaurant.photos,
          location: restaurant.location
        }
      );

      // Broadcast swipe via socket
      socketService.sendSwipe(roomId, restaurant.id, direction, restaurant);

      // Move to next card after animation
      setTimeout(() => {
        setSwipeDirection(null);
        setCurrentIndex(prev => prev + 1);
        
        // Check if finished
        if (currentIndex + 1 >= restaurants.length) {
          setUserCompleted(true);
          socketService.completeSwiping(roomId);
        }
      }, 300);

    } catch (err) {
      console.error('Error recording swipe:', err);
      setSwipeDirection(null);
    }
  };

  // Touch/mouse handlers for swipe gestures
  const handleTouchStart = (e) => {
    startXRef.current = e.touches ? e.touches[0].clientX : e.clientX;
  };

  const handleTouchMove = (e) => {
    if (!cardRef.current) return;
    const currentX = e.touches ? e.touches[0].clientX : e.clientX;
    const diff = currentX - startXRef.current;
    
    cardRef.current.style.transform = `translateX(${diff}px) rotate(${diff * 0.1}deg)`;
    
    if (diff > 0) {
      cardRef.current.style.borderColor = '#48bb78';
    } else {
      cardRef.current.style.borderColor = '#f56565';
    }
  };

  const handleTouchEnd = (e) => {
    if (!cardRef.current) return;
    const currentX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
    const diff = currentX - startXRef.current;
    
    cardRef.current.style.transform = '';
    cardRef.current.style.borderColor = '';
    
    if (Math.abs(diff) > 100) {
      handleSwipe(diff > 0 ? 'right' : 'left');
    }
  };

  if (loading) {
    return (
      <div className="swipe-page">
        <div className="loading">Loading restaurants...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="swipe-page">
        <div className="error">{error}</div>
      </div>
    );
  }

  if (userCompleted) {
    return (
      <div className="swipe-page">
        <div className="completion-screen fade-in">
          <h2>✅ All Done!</h2>
          {partnerCompleted ? (
            <p>Calculating matches...</p>
          ) : (
            <p>Waiting for your friend to finish...</p>
          )}
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  const currentRestaurant = restaurants[currentIndex];

  if (!currentRestaurant) {
    return (
      <div className="swipe-page">
        <div className="completion-screen">
          <h2>No more restaurants</h2>
          <button onClick={() => navigate(`/matches/${roomId}`)}>
            View Matches
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="swipe-page">
      <div className="swipe-container">
        <div className="header">
          <h3>Find Your Match</h3>
          <p className="progress">{currentIndex + 1} / {restaurants.length}</p>
        </div>

        <div 
          ref={cardRef}
          className={`restaurant-card ${swipeDirection ? `swipe-${swipeDirection}` : ''}`}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleTouchStart}
          onMouseMove={(e) => e.buttons === 1 && handleTouchMove(e)}
          onMouseUp={handleTouchEnd}
        >
          {currentRestaurant.photos && currentRestaurant.photos.length > 0 && (
            <div 
              className="restaurant-image"
              style={{ backgroundImage: `url(${currentRestaurant.photos[0].url})` }}
            />
          )}
          
          <div className="restaurant-info">
            <h2>{currentRestaurant.name}</h2>
            <div className="restaurant-meta">
              <span className="rating">⭐ {currentRestaurant.rating?.toFixed(1) || 'N/A'}</span>
              <span className="price">{'$'.repeat(currentRestaurant.priceLevel || 1)}</span>
            </div>
            <p className="address">{currentRestaurant.address}</p>
          </div>

          <div className="swipe-indicators">
            <div className="indicator nope">NOPE</div>
            <div className="indicator like">LIKE</div>
          </div>
        </div>

        <div className="action-buttons">
          <button 
            className="action-button dislike"
            onClick={() => handleSwipe('left')}
          >
            ✕
          </button>
          <button 
            className="action-button like"
            onClick={() => handleSwipe('right')}
          >
            ♥
          </button>
        </div>
      </div>
    </div>
  );
}

export default SwipePage;
