import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import TinderCard from 'react-tinder-card';
import { 
  Box, Typography, CircularProgress, Paper, Fab, Snackbar, Alert, 
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Avatar 
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FavoriteIcon from '@mui/icons-material/Favorite';
import CheckIcon from '@mui/icons-material/Check';
import Layout from '../components/Layout';
import RestaurantCard from '../components/RestaurantCard';
import RestaurantDetailsDialog from '../components/RestaurantDetailsDialog';
import { api } from '../services/api';

const SwipePage = () => {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
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

  const [partnerCompleted, setPartnerCompleted] = useState(false);

  // Refs for programmatic swiping
  const cardRefs = useMemo(() => Array(restaurants.length).fill(0).map(i => React.createRef()), [restaurants.length]);

  // Track which cards are gone to determine "All Caught Up"
  // In react-tinder-card, we often remove cards from DOM or just track index.
  // We'll track the *current top card index*. 
  // Since the stack renders in reverse order (index 0 at bottom), we swipe from the END of the array.
  // Let's keep it simple: We render the array. When a card is swiped, we don't need to remove it from state immediately if we don't want to, 
  // but usually it's cleaner to just mark it as swiped.
  // actually react-tinder-card recommends keeping them and just hiding them or letting them fly off.
  // We will track an index for the "current" card to handle the API calls.
  // Since we are rendering a stack, the "top" card is usually the *last* element in the array if we use standard stacking context, 
  // or we can use z-index.
  // Let's stick to: Last element in 'restaurants' is the top card.
  
  // Actually, to make 'currentIndex' logic work with the library's suggestion:
  // We will maintain the 'restaurants' array. The card refs align with this array.
  // The "active" card is the one at `currentIndex`.
  // Wait, `react-tinder-card` usually works by removing items or just handling the onSwipe.
  // Let's use a state to track *remaining* cards or just use an index.
  // We'll assume the LAST item in the list is the top one (default CSS stacking).
  const [lastDirection, setLastDirection] = useState();

  useEffect(() => {
    // Initialize socket connection
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const newSocket = io(apiUrl);
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

  // Update socket listeners for match handling
  useEffect(() => {
    if (!socket) return;

    const handleMatchFound = (restaurant) => {
      setMatches(prev => [...prev, restaurant]);
      setCurrentMatch(restaurant);
      setShowMatchDialog(true);
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
        const data = await api.getRestaurants(roomId);
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

  const swiped = (direction, restaurant, index) => {
    setLastDirection(direction);
    
    // Emit swipe event
    if (socket) {
      socket.emit('swipe', {
        roomId,
        restaurantId: restaurant.id,
        direction,
        restaurantData: restaurant
      });
    }

    // Check if we are done
    // index is the index of the card that was just swiped.
    // If index === 0, we just swiped the last card (since we render stack bottom-up or verify order).
    // Let's verify standard order: array.map renders 0..N. N is on top (highest z-index by default source order).
    // So if we swipe index 0, that was the bottom card? No, usually reverse.
    // We will confirm order in render.
    
    if (index === 0) {
      // Last card processed
      if (socket) {
        socket.emit('complete-swiping', { roomId });
      }
    }
  };

  const outOfFrame = (name) => {
    // Console log or cleanup if needed
  };

  const swipe = async (dir) => {
    // Find the current top card.
    // We filter out cards that are already swiped? 
    // react-tinder-card documentation says: ref.current.swipe(dir).
    // We need to know WHICH card to swipe.
    // If we render `restaurants` and they are removed from screen, we need to track which ones are left.
    // A simple way is to find the highest index card that hasn't been swiped yet.
    // But since `swiped` callback fires, we can just maintain a local pointer or just check the refs.
    
    // We can assume the valid cards are from 0 to N.
    // We want to swipe the *Top* card.
    // If we render standard map, index N is last in DOM => Top.
    // We need to track the "current top index".
    // Let's filter `restaurants`? No, that remounts components.
    // We'll use a local variable accessible to this closure or check refs.
    // Actually, `react-tinder-card` handles the internal state of "swiped".
    // But for the BUTTONS to work, we need to call swipe on the correct ref.
    
    // Let's filter the refs to find valid ones? 
    // Easier: Just try to swipe the 'restaurants.length - 1 - alreadySwipedCount'.
    
    // We haven't tracked 'alreadySwipedCount' in state.
    // Let's assume we can simply iterate backwards and find a non-swiped card?
    // Or better: Use a callback-based tracker?
    // Let's just track the *current index* in a ref or state.
    // Since `swiped` is called, we can decrement a counter.
  };
  
  // Improved programmatic swipe logic:
  // We start with index = restaurants.length - 1 (Top).
  // When swiped, we decrement.
  const [currentIndex, setCurrentIndex] = useState(0); 
  // We need to initialize this when restaurants load. 
  // Actually, useEffect will run when restaurants change.
  useEffect(() => {
    if (restaurants.length > 0) {
      setCurrentIndex(restaurants.length - 1);
    }
  }, [restaurants]);

  const swipeProgrammatically = async (dir) => {
    if (currentIndex >= 0 && currentIndex < restaurants.length) {
      await cardRefs[currentIndex].current.swipe(dir); // Swipe the card!
      // The `swiped` callback will handle the state update (socket emit).
      // We don't decrement here because `swiped` will be called by the library.
    }
  };
  
  // Update index when a card is swiped
  const handleCardLeftScreen = (index) => {
     // This card is gone. Update current index to the one below it.
     // Note: swiped() is called before outOfFrame(). 
     // We can just rely on this to safely decrement our tracker for the buttons.
     setCurrentIndex(prev => prev - 1);
  };

  const handleInfoClick = (restaurant) => {
    setSelectedRestaurantId(restaurant.id);
    setDetailsOpen(true);
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

  // All done check
  if (currentIndex < 0 && restaurants.length > 0) {
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
          <Typography variant="h5" fontWeight="bold">Waiting for your friend...</Typography>
          <Typography color="text.secondary">Share this code with your friend to start matching!</Typography>
          <Paper elevation={3} sx={{ p: 3, bgcolor: 'primary.main', color: 'white', borderRadius: 4, minWidth: 200 }}>
            <Typography variant="h3" fontWeight="bold" sx={{ letterSpacing: 4 }}>
              {location.state?.roomKey || roomId.slice(0, 4).toUpperCase()}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8, mt: 1, display: 'block' }}>ROOM CODE</Typography>
          </Paper>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>The session will start automatically when they join.</Typography>
        </Box>
      </Layout>
    );
  }

  return (
    <Layout title={`Room: ${location.state?.roomKey || '...'} (${participantCount})`}>
      <Box sx={{ 
        flexGrow: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center',
        position: 'relative',
        height: '100%',
        mt: 2,
        overflow: 'hidden' // Prevent scrollbars during swipe
      }}>
        {/* Card Stack Container */}
        <Box sx={{ 
          position: 'relative', 
          width: '100%',
          maxWidth: 400,
          height: '65vh',
          maxHeight: 600,
          mx: 'auto',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          {restaurants.map((restaurant, index) => (
            <TinderCard
              ref={cardRefs[index]}
              key={restaurant.id}
              className='swipe'
              onSwipe={(dir) => swiped(dir, restaurant, index)}
              onCardLeftScreen={() => handleCardLeftScreen(index)}
              preventSwipe={['up', 'down']}
              swipeRequirementType="position"
              swipeThreshold={100}
            >
              <Box sx={{
                /* Inner card content - fills the parent .swipe wrapper */
                width: '100%',
                height: '100%',
                bgcolor: 'background.paper',
                borderRadius: 4,
                /* Shadow handled by RestaurantCard, removed here to avoid double-shadow */
                overflow: 'hidden',
                /* Optimization: Only show top 2 cards to prevent "black shadow" stacking effect */
                display: (index >= currentIndex - 1 && index <= currentIndex + 1) ? 'block' : 'none' 
                // +1 just in case of race condition during swipe animation
              }}>
                <RestaurantCard 
                  restaurant={restaurant} 
                  onInfoClick={() => handleInfoClick(restaurant)}
                />
              </Box>
            </TinderCard>
          ))}
        </Box>

        {/* Action Buttons */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: 4, 
          mt: 4,
          zIndex: 100
        }}>
          <Fab 
            color="white" 
            aria-label="dislike"
            onClick={() => swipeProgrammatically('left')}
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
            onClick={() => swipeProgrammatically('right')}
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
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4, textAlign: 'center', p: 1 } }}
      >
        <DialogTitle sx={{ pb: 0 }}>
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
