import React from 'react';
import { 
  Card, CardMedia, CardContent, Typography, 
  Box, Chip, Rating, IconButton, Fab
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import LocationOnIcon from '@mui/icons-material/LocationOn';

// Curated high-quality food images from Unsplash
const UNSPLASH_IMAGES = [
  'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=800&q=80', 
  'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80', 
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80', 
  'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=800&q=80', 
  'https://images.unsplash.com/photo-1544025162-d76690b60944?auto=format&fit=crop&w=800&q=80', 
  'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=800&q=80', 
  'https://images.unsplash.com/photo-1484723091739-30a097e8f929?auto=format&fit=crop&w=800&q=80', 
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80', 
];

const getRandomImage = (id) => {
  if (!id) return UNSPLASH_IMAGES[0];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % UNSPLASH_IMAGES.length;
  return UNSPLASH_IMAGES[index];
};

const RestaurantCard = ({ restaurant, onInfoClick }) => {
  // Try to use the first real photo from Google
  const originalPhoto = restaurant.photos && restaurant.photos.length > 0 ? restaurant.photos[0].url : null;
  
  // State to handle image load errors (fallback to Unsplash)
  const [imgSrc, setImgSrc] = React.useState(originalPhoto || getRandomImage(restaurant.id));

  // Update image source if restaurant changes
  React.useEffect(() => {
    setImgSrc(originalPhoto || getRandomImage(restaurant.id));
  }, [restaurant, originalPhoto]);

  return (
    <Card 
      sx={{ 
        width: '100%', 
        height: '100%', 
        position: 'relative',
        borderRadius: 5,
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#fff',
        transition: 'transform 0.2s',
      }}
    >
      <Box sx={{ 
        position: 'relative', 
        height: '65%', 
        width: '100%',
        overflow: 'hidden', // Force clipping
        borderTopLeftRadius: 20, // Match Card radius (5 * 4px = 20px)
        borderTopRightRadius: 20
      }}>
        <CardMedia
          component="img"
          image={imgSrc}
          alt={restaurant.name}
          onError={(e) => {
            e.target.onerror = null; // Prevent infinite loop
            setImgSrc(getRandomImage(restaurant.id)); // Fallback to Unsplash
          }}
          sx={{ 
            height: '100%', 
            width: '100%',
            objectFit: 'cover' 
          }}
        />
        {/* Gradient Overlay */}
        <Box sx={{ 
          position: 'absolute', 
          bottom: 0, 
          left: 0, 
          width: '100%', 
          height: '40%', 
          background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)',
          pointerEvents: 'none'
        }} />
        
        {/* Floating Info Fab */}
        <Fab 
          color="white" 
          size="small" 
          onClick={(e) => {
            e.stopPropagation();
            onInfoClick();
          }}
          sx={{ 
            position: 'absolute', 
            top: 16, 
            right: 16, 
            bgcolor: 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(4px)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            '&:hover': { bgcolor: '#fff' }
          }}
        >
          <InfoIcon color="primary" fontSize="small" />
        </Fab>

        <Box sx={{ position: 'absolute', bottom: 12, left: 16, right: 16 }}>
           <Typography variant="h5" component="div" fontWeight="800" noWrap sx={{ color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
            {restaurant.name}
          </Typography>
        </Box>
      </Box>

      <CardContent sx={{ flexGrow: 1, pt: 2, px: 2.5, pb: '16px !important' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5, justifyContent: 'space-between' }}>
           <Box sx={{ display: 'flex', alignItems: 'center' }}>
             <Rating value={restaurant.rating} readOnly precision={0.5} size="small" />
             <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5, fontWeight: 600 }}>
               ({restaurant.rating})
             </Typography>
           </Box>
           <Typography variant="body2" color="success.main" fontWeight="bold" sx={{ bgcolor: 'success.light', color: 'success.dark', px: 1, py: 0.2, borderRadius: 1, opacity: 0.2 }}>
              {Array(restaurant.priceLevel || 1).fill('$').join('')}
           </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
          <Chip 
            icon={<LocationOnIcon fontSize="small" />} 
            label={restaurant.vicinity || restaurant.address} 
            size="small" 
            variant="outlined" 
            sx={{ maxWidth: '100%', borderRadius: 2, bgcolor: '#f5f5f5', border: 'none' }} 
          />
           {restaurant.types && restaurant.types.length > 0 && (
            <Chip 
              label={restaurant.types[0].replace('_', ' ')} 
              size="small" 
              sx={{ textTransform: 'capitalize', borderRadius: 2, bgcolor: '#fff0f0', color: 'primary.main', fontWeight: 'bold' }}
            />
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default RestaurantCard;
