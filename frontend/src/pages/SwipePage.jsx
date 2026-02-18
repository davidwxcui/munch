import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import { 
  Box, Typography, IconButton, Container, CircularProgress, 
  Paper, Fab, Fade, Snackbar, Alert, // existing
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Avatar // new
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FavoriteIcon from '@mui/icons-material/Favorite';
import RefreshIcon from '@mui/icons-material/Refresh';
import InfoIcon from '@mui/icons-material/Info'; // new
import CheckIcon from '@mui/icons-material/Check'; // new
import Layout from '../components/Layout';
import RestaurantCard from '../components/RestaurantCard';
import RestaurantDetailsDialog from '../components/RestaurantDetailsDialog';

// Simple Swipe Card implementation 
// In a real app, you might use 'react-tinder-card' or 'framer-motion'
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';

const SwipePage = () => {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [match, setMatch] = useState(null);
  const [error, setError] = useState('');
  
  // Match state
  const [matches, setMatches] = useState([]);
  const [showMatchDialog, setShowMatchDialog] = useState(false);
  const [currentMatch, setCurrentMatch] = useState(null);
  
  // Dialog state
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState(null);

  // Room state
  const [participantCount, setParticipantCount] = useState(1);
  const [waitingForPartner, setWaitingForPartner] = useState(false);

  // Motion values for swipe animation
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-30, 30]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);
  
  // Background color change based on swipe direction
  const bgC = useTransform(x, [-200, 0, 200], ["rgba(255, 0, 0, 0.1)", "rgba(255, 255, 255, 0)", "rgba(0, 255, 0, 0.1)"]);

  // Track swipe direction for exit animation
  const [exitDir, setExitDir] = useState(null);

  const [partnerCompleted, setPartnerCompleted] = useState(false);

  // ... (existing state)

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    // Join room
    const roomKey = location.state?.roomKey;
    newSocket.emit('join-room', { roomId, roomKey });

    // Socket event listeners
    newSocket.on('room-updated', (data) => {
      setParticipantCount(data.participantCount);
      if (data.status === 'active') {
        setWaitingForPartner(false);
      }
    });

    newSocket.on('partner-completed', () => {
      setPartnerCompleted(true);
    });

    newSocket.on('error', (data) => {
      setError(data.message);
    });

    return () => newSocket.close();
  }, [roomId, location.state, navigate]);

  // ... (match listeners) ...

  // Notify server when finished swiping
  useEffect(() => {
    if (socket && restaurants.length > 0 && currentIndex >= restaurants.length) {
      socket.emit('complete-swiping', { roomId });
    }
  }, [currentIndex, restaurants.length, socket, roomId]);

  // ... (handlers) ...



  // Update socket listeners for match handling
  useEffect(() => {
    if (!socket) return;

    const handleMatchFound = (restaurant) => {
      setMatches(prev => [...prev, restaurant]);
      setCurrentMatch(restaurant);
      setShowMatchDialog(true);
      // setMatch(restaurant); // If you still need the old 'match' state for other purposes
    };

    socket.on('match-found', handleMatchFound);

    return () => {
      socket.off('match-found', handleMatchFound);
    };
  }, [socket]);

  // Fetch restaurants
  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/restaurants?roomId=${roomId}`);
        const data = await response.json();
        setRestaurants(data.restaurants);
        setLoading(false);
      } catch (err) {
        setError('Failed to load restaurants');
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, [roomId]);

  const handleKeepSwiping = () => {
    setShowMatchDialog(false);
    setCurrentMatch(null);
  };

  const handleGoToMatches = () => {
    navigate(`/matches/${roomId}`);
  };

  const handleSwipe = (direction) => {
    if (!socket || currentIndex >= restaurants.length) return;

    setExitDir(direction);
    const restaurant = restaurants[currentIndex];
    
    // Emit swipe event
    socket.emit('swipe', {
      roomId,
      restaurantId: restaurant.id,
      direction,
      restaurantData: restaurant
    });

    // Move to next card
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
      x.set(0); 
      setExitDir(null);
    }, 200); // Small delay to allow exit animation start
  };

  const onDragEnd = (event, info) => {
    const threshold = 100;
    if (info.offset.x > threshold) {
      handleSwipe('right');
    } else if (info.offset.x < -threshold) {
      handleSwipe('left');
    }
  };

  const handleInfoClick = () => {
    if (restaurants[currentIndex]) {
      setSelectedRestaurantId(restaurants[currentIndex].id);
      setDetailsOpen(true);
    }
  };

  if (loading) {
    return (
      <Layout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  // End of stack check
  if (currentIndex >= restaurants.length) {
    return (
      <Layout showBack>
        <Box sx={{ textAlign: 'center', mt: 8, p: 3 }}>
          <Typography variant="h4" gutterBottom>All Caught Up!</Typography>
          <Typography color="text.secondary" paragraph>
            You've swiped on all available restaurants.
          </Typography>
          
          {matches.length > 0 ? (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" color="primary" gutterBottom>
                You have {matches.length} matches!
              </Typography>
              <Button 
                variant="contained" 
                size="large" 
                onClick={handleGoToMatches}
                sx={{ mt: 2, borderRadius: 4, px: 4, py: 1.5 }}
                startIcon={<FavoriteIcon />}
              >
                View Matches
              </Button>
            </Box>
          ) : partnerCompleted ? (
            <Box sx={{ mt: 4 }}>
               <CheckIcon sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
               <Typography variant="h6" gutterBottom>
                 All Done!
               </Typography>
               <Typography color="text.secondary">
                 Your partner has also finished. Check the matches!
               </Typography>
                <Button 
                  variant="contained" 
                  onClick={handleGoToMatches}
                  sx={{ mt: 3 }}
                >
                  View Potential Matches
                </Button>
            </Box>
          ) : (
            <Box sx={{ mt: 4 }}>
               <CircularProgress size={30} />
               <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                 Waiting for your partner to finish...
               </Typography>
            </Box>
          )}
        </Box>
      </Layout>
    );
  }

  if (participantCount < 2) {
    return (
      <Layout title="Waiting for Partner">
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '60vh',
          textAlign: 'center',
          gap: 3
        }}>
          <CircularProgress size={60} thickness={4} />
          
          <Typography variant="h5" fontWeight="bold">
            Waiting for your friend...
          </Typography>
          
          <Typography color="text.secondary">
            Share this code with your friend to start matching!
          </Typography>

          <Paper 
            elevation={3} 
            sx={{ 
              p: 3, 
              bgcolor: 'primary.main', 
              color: 'white',
              borderRadius: 4,
              minWidth: 200
            }}
          >
            <Typography variant="h3" fontWeight="bold" sx={{ letterSpacing: 4 }}>
              {location.state?.roomKey || roomId.slice(0, 4).toUpperCase()}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8, mt: 1, display: 'block' }}>
              ROOM CODE
            </Typography>
          </Paper>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            The session will start automatically when they join.
          </Typography>
        </Box>
      </Layout>
    );
  }

  const currentRestaurant = restaurants[currentIndex];

  const variants = {
    enter: { scale: 0.95, y: 20 },
    center: { scale: 1, y: 0, zIndex: 1, opacity: 1 },
    exit: (custom) => ({
      x: custom === 'left' ? -1000 : 1000,
      opacity: 0,
      rotate: custom === 'left' ? -30 : 30,
      transition: { duration: 0.3 }
    })
  };

  return (
    <Layout title={`Room: ${location.state?.roomKey || '...'} (${participantCount})`}>
      <motion.div style={{ background: bgC, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: -1 }} />
      
      <Box sx={{ 
        flexGrow: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center',
        position: 'relative',
        height: '100%',
        maxHeight: '75vh',
        mt: 2,
        // overflow: 'hidden' removed to allow swipe exit
      }}>
        {/* Card Stack Container */}
        <Box sx={{ 
          position: 'relative', 
          width: '100%', 
          height: 500, 
          maxHeight: 540,
          zIndex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          perspective: 1000
        }}>
          <AnimatePresence custom={exitDir}>
            <motion.div
              key={currentRestaurant.id}
              custom={exitDir}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              style={{ x, rotate, opacity, position: 'absolute', width: '100%', height: '100%', maxWidth: 400 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.6}
              onDragEnd={onDragEnd}
              whileTap={{ cursor: "grabbing" }}
            >
              <RestaurantCard 
                restaurant={currentRestaurant} 
                onInfoClick={handleInfoClick}
              />
            </motion.div>
          </AnimatePresence>
        </Box>

        {/* Action Buttons */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: 4, 
          mt: 4,
          zIndex: 2
        }}>
          <Fab 
            color="white" 
            aria-label="dislike"
            onClick={() => handleSwipe('left')}
            sx={{ 
              bgcolor: 'white', 
              color: 'error.main',
              width: 64, 
              height: 64,
              boxShadow: '0 8px 24px rgba(255, 82, 82, 0.2)',
              '&:hover': { bgcolor: '#ffebee' }
            }}
          >
            <CloseIcon fontSize="large" />
          </Fab>
          
          <Fab 
            color="primary" 
            aria-label="like"
            onClick={() => handleSwipe('right')}
            sx={{ 
              bgcolor: 'secondary.main', 
              width: 64, 
              height: 64,
              boxShadow: '0 8px 24px rgba(78, 205, 196, 0.3)',
              '&:hover': { bgcolor: 'secondary.dark' }
            }}
          >
            <FavoriteIcon fontSize="large" />
          </Fab>
        </Box>
      </Box>

      {/* Details Dialog */}
      <RestaurantDetailsDialog 
        open={detailsOpen} 
        onClose={() => setDetailsOpen(false)} 
        restaurantId={selectedRestaurantId} 
      />

      {/* Error Snackbar */}
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError('')}>
        <Alert severity="error" onClose={() => setError('')}>{error}</Alert>
      </Snackbar>
      {/* Match Found Dialog */}
       <Dialog
        open={showMatchDialog}
        onClose={handleKeepSwiping}
        aria-labelledby="match-dialog-title"
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4, textAlign: 'center', p: 1 } }}
      >
        <DialogTitle id="match-dialog-title" sx={{ pb: 0 }}>
          <Typography variant="h4" sx={{ fontFamily: 'cursive', color: 'primary.main', transform: 'rotate(-5deg)' }}>
            It's a Match!
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          {currentMatch && (
            <>
              <Avatar 
                src={currentMatch.photos && currentMatch.photos[0]?.url} 
                alt={currentMatch.name}
                sx={{ width: 120, height: 120, border: '4px solid white', boxShadow: 3 }}
              />
              <Typography variant="h6" fontWeight="bold">
                {currentMatch.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {currentMatch.address}
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ flexDirection: 'column', gap: 1, p: 2 }}>
          <Button 
            variant="contained" 
            fullWidth 
            onClick={handleGoToMatches}
            size="large"
            startIcon={<FavoriteIcon />}
          >
            Go to Matches
          </Button>
          <Button 
            variant="text" 
            fullWidth 
            onClick={handleKeepSwiping}
            color="inherit"
          >
            Keep Swiping
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default SwipePage;
