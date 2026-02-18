import { useNavigate } from 'react-router-dom';
import './HomePage.css';

function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="home-page">
      <div className="home-container fade-in">
        <div className="logo">🍽️</div>
        <h1>Restaurant Match</h1>
        <p className="tagline">Find the perfect restaurant with your friends</p>
        
        <div className="button-group">
          <button 
            className="primary-button"
            onClick={() => navigate('/create')}
          >
            Create Room
          </button>
          
          <button 
            className="secondary-button"
            onClick={() => navigate('/join')}
          >
            Join Room
          </button>
        </div>

        <div className="features">
          <div className="feature">
            <span className="feature-icon">🔑</span>
            <p>Create a private room with a unique 4-letter code</p>
          </div>
          <div className="feature">
            <span className="feature-icon">🎯</span>
            <p>Set your preferences: distance, cuisine, price</p>
          </div>
          <div className="feature">
            <span className="feature-icon">👆</span>
            <p>Swipe through restaurants together</p>
          </div>
          <div className="feature">
            <span className="feature-icon">❤️</span>
            <p>Find mutual matches instantly</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
