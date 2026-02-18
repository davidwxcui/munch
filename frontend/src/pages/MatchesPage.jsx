import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, Typography, Button, Paper, Avatar, List, ListItem, 
  ListItemAvatar, ListItemText, Chip, Rating, Container,
  FormControl, InputLabel, Select, MenuItem, CircularProgress,
  IconButton, Collapse
} from '@mui/material';
import Layout from '../components/Layout';
import Confetti from 'react-confetti';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import FilterListIcon from '@mui/icons-material/FilterList';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PhoneIcon from '@mui/icons-material/Phone';
import StarIcon from '@mui/icons-material/Star';

// Simple hook if react-use isn't installed
const useSimpleWindowSize = () => {
  const [size, setSize] = React.useState({ width: window.innerWidth, height: window.innerHeight });
  React.useEffect(() => {
    const handleResize = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return size;
};

const MatchesPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { width, height } = useSimpleWindowSize();
  
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [minRating, setMinRating] = useState(0);
  const [priceFilter, setPriceFilter] = useState('all'); // all, $, $$, $$$+
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchMatches();
  }, [roomId]);

  const fetchMatches = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/swipes/${roomId}`);
      if (!response.ok) throw new Error('Failed to load matches');
      const data = await response.json();
      setMatches(data.matches || []);
    } catch (err) {
      console.error(err);
      setError('Could not load matches');
    } finally {
      setLoading(false);
    }
  };

  const filteredMatches = matches.filter(match => {
    // Rating filter
    if (match.rating < minRating) return false;
    
    // Price filter
    if (priceFilter !== 'all') {
      const level = match.priceLevel || 1;
      if (priceFilter === '$' && level !== 1) return false;
      if (priceFilter === '$$' && level !== 2) return false;
      if (priceFilter === '$$$+' && level < 3) return false;
    }
    
    return true;
  });

  if (loading) {
    return (
      <Layout title="Loading Matches..." showBack={false}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  return (
    <Layout title="It's a Match!" showBack={false}>
      <Confetti width={width} height={height} recycle={false} numberOfPieces={200} />
      
      <Container maxWidth="sm" sx={{ mt: 2, pb: 4 }}>
        <Typography variant="h4" align="center" fontWeight="bold" gutterBottom color="primary">
          Yay! {matches.length} Matches Found
        </Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
           <Button 
             startIcon={<FilterListIcon />} 
             onClick={() => setShowFilters(!showFilters)}
             variant="outlined"
             size="small"
           >
             {showFilters ? 'Hide Filters' : 'Filter Results'}
           </Button>
        </Box>

        <Collapse in={showFilters}>
          <Paper sx={{ p: 2, mb: 3, bgcolor: 'background.paper' }} elevation={2}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Min Rating</InputLabel>
                <Select
                  value={minRating}
                  label="Min Rating"
                  onChange={(e) => setMinRating(e.target.value)}
                >
                  <MenuItem value={0}>Any</MenuItem>
                  <MenuItem value={3}>3+ Stars</MenuItem>
                  <MenuItem value={4}>4+ Stars</MenuItem>
                  <MenuItem value={4.5}>4.5+ Stars</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl fullWidth size="small">
                <InputLabel>Price</InputLabel>
                <Select
                  value={priceFilter}
                  label="Price"
                  onChange={(e) => setPriceFilter(e.target.value)}
                >
                  <MenuItem value="all">Any</MenuItem>
                  <MenuItem value="$">$ (Cheap)</MenuItem>
                  <MenuItem value="$$">$$ (Moderate)</MenuItem>
                  <MenuItem value="$$$+">$$$+ (Expensive)</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Paper>
        </Collapse>

        {matches.length === 0 ? (
          <Typography align="center" color="text.secondary">
            No matches yet. Keep swiping!
          </Typography>
        ) : filteredMatches.length === 0 ? (
           <Typography align="center" color="text.secondary">
            No matches found with these filters.
          </Typography>
        ) : (
          <List sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {filteredMatches.map((match) => (
              <Paper 
                key={match.restaurantId} 
                elevation={3} 
                sx={{ borderRadius: 3, overflow: 'hidden' }}
              >
                <Box 
                  component="img"
                  src={match.photos && match.photos[0]?.url ? match.photos[0].url : 'https://placehold.co/100'}
                  sx={{ width: '100%', height: 140, objectFit: 'cover' }}
                />
                <Box sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Typography variant="h6" fontWeight="bold">
                      {match.name}
                    </Typography>
                    <Chip 
                      label={match.rating} 
                      icon={<StarIcon sx={{ "&&": { color: "gold" } }} />} 
                      size="small" 
                      variant="outlined"
                      sx={{ fontWeight: 'bold' }}
                    />
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                    <LocationOnIcon fontSize="small" /> {match.vicinity || match.address}
                  </Typography>

                  <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                     <Button 
                        variant="contained" 
                        fullWidth 
                        size="small"
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(match.name + ' ' + match.address)}`}
                        target="_blank"
                      >
                        Directions
                      </Button>
                  </Box>
                </Box>
              </Paper>
            ))}
          </List>
        )}
        
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Button variant="outlined" onClick={() => navigate('/')}>
            Start New Session
          </Button>
        </Box>
      </Container>
    </Layout>
  );
};

export default MatchesPage;
