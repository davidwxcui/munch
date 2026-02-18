import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, Typography, Box, Rating, Chip, Divider, 
  List, ListItem, ListItemAvatar, Avatar, ListItemText,
  IconButton, Skeleton, Link, ImageList, ImageListItem
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PhoneIcon from '@mui/icons-material/Phone';
import LanguageIcon from '@mui/icons-material/Language';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

const RestaurantDetailsDialog = ({ open, onClose, restaurantId }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open && restaurantId) {
      fetchDetails();
    } else {
      setDetails(null); // Reset when closed
    }
  }, [open, restaurantId]);

  const fetchDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:5000/api/restaurants/${restaurantId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch details');
      }
      const data = await response.json();
      setDetails(data);
    } catch (err) {
      console.error('Error fetching details:', err);
      setError('Failed to load restaurant details');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      scroll="paper"
    >
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
          {loading ? 'Loading...' : details?.name || 'Restaurant Details'}
        </Typography>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ color: (theme) => theme.palette.grey[500] }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers>
        {loading ? (
          <Box sx={{ pt: 1 }}>
            <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2, mb: 2 }} />
            <Skeleton variant="text" height={40} />
            <Skeleton variant="text" height={30} width="60%" />
            <Skeleton variant="text" height={100} sx={{ mt: 2 }} />
          </Box>
        ) : error ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="error">{error}</Typography>
            <Button onClick={fetchDetails} sx={{ mt: 2 }}>Retry</Button>
          </Box>
        ) : details ? (
          <>
            {/* Photos */}
            {details.photos && details.photos.length > 0 && (
              <Box sx={{ display: 'flex', overflowX: 'auto', gap: 1, mb: 2, pb: 1 }}>
                {details.photos.map((photo, index) => (
                  <Box 
                    key={index} 
                    component="img" 
                    src={photo.url} 
                    alt={`Photo ${index + 1}`}
                    sx={{ height: 160, borderRadius: 2, flexShrink: 0 }}
                  />
                ))}
              </Box>
            )}

            {/* Basic Info */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Rating value={details.rating} readOnly precision={0.5} size="small" />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                  ({details.totalRatings} ratings) • {Array(details.priceLevel).fill('$').join('')}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                {details.isOpen !== null && (
                  <Chip 
                    label={details.isOpen ? "Open Now" : "Closed"} 
                    color={details.isOpen ? "success" : "default"} 
                    size="small" 
                    variant="outlined"
                  />
                )}
                <Chip icon={<LocationOnIcon />} label={details.address} size="small" variant="outlined" />
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {details.phone && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PhoneIcon color="action" fontSize="small" />
                    <Link href={`tel:${details.phone}`} underline="hover" color="inherit">
                      {details.phone}
                    </Link>
                  </Box>
                )}
                {details.website && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LanguageIcon color="action" fontSize="small" />
                    <Link href={details.website} target="_blank" rel="noopener" underline="hover" color="inherit">
                      Visit Website
                    </Link>
                  </Box>
                )}
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Opening Hours */}
            {details.openingHours && details.openingHours.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AccessTimeIcon fontSize="small" /> Opening Hours
                </Typography>
                <Box sx={{ pl: 3.5 }}>
                  {details.openingHours.map((hour, idx) => (
                    <Typography key={idx} variant="body2" color="text.secondary">
                      {hour}
                    </Typography>
                  ))}
                </Box>
              </Box>
            )}

            <Divider sx={{ my: 2 }} />

            {/* Reviews */}
            {details.reviews && details.reviews.length > 0 && (
              <Box>
                 <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Reviews
                </Typography>
                <List dense>
                  {details.reviews.map((review, index) => (
                    <ListItem key={index} alignItems="flex-start" disableGutters>
                      <ListItemAvatar>
                        <Avatar src={review.profilePhoto} alt={review.author} />
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="subtitle2">{review.author}</Typography>
                            <Typography variant="caption" color="text.secondary">{review.time}</Typography>
                          </Box>
                        }
                        secondary={
                          <>
                            <Rating value={review.rating} readOnly size="small" sx={{ my: 0.5 }} />
                            <Typography variant="body2" color="text.primary" component="span">
                              {review.text}
                            </Typography>
                          </>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </>
        ) : null}
      </DialogContent>
      <DialogActions>
        {details?.googleMapsUrl && (
          <Button href={details?.googleMapsUrl} target="_blank" color="primary">
            Open in Maps
          </Button>
        )}
        <Button onClick={onClose} variant="contained" color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RestaurantDetailsDialog;
