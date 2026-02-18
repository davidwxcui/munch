import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import CreateRoomPage from './pages/CreateRoomPage';
import JoinRoomPage from './pages/JoinRoomPage';
import SwipePage from './pages/SwipePage';
import MatchesPage from './pages/MatchesPage';
import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/create" element={<CreateRoomPage />} />
        <Route path="/join" element={<JoinRoomPage />} />
        <Route path="/swipe/:roomId" element={<SwipePage />} />
        <Route path="/matches/:roomId" element={<MatchesPage />} />
      </Routes>
    </Router>
  );
}

export default App;
