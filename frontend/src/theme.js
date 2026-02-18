import { createTheme } from '@mui/material/styles';

/**
 * Munch App Theme
 * Vibrant orange/red palette for an appetizing feel
 */
const theme = createTheme({
  palette: {
    primary: {
      main: '#FF6B6B', // Vibrant Orange-Red
      light: '#FF9E9E',
      dark: '#D94545',
      contrastText: '#fff',
    },
    secondary: {
      main: '#4ECDC4', // Teal/Turquoise for contrast/actions like "Like"
      light: '#7EDBD5',
      dark: '#2A9D95',
      contrastText: '#fff',
    },
    background: {
      default: '#F7F7F7',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#2D3436',
      secondary: '#636E72',
    },
    error: {
      main: '#FF5252', // Red for "Dislike"
    },
    success: {
      main: '#4CAF50', // Green
    },
  },
  typography: {
    fontFamily: '"Poppins", "Nunito", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
    },
    h5: {
      fontWeight: 500,
      fontSize: '1.25rem',
    },
    h6: {
      fontWeight: 500,
      fontSize: '1rem',
    },
    button: {
      textTransform: 'none', // More friendly feel
      fontWeight: 600,
      borderRadius: 12, // Rounded buttons
    },
  },
  shape: {
    borderRadius: 12, // Rounded corners throughout
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 24, // Pill-shaped buttons
          padding: '10px 24px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
          },
        },
        contained: {
          fontWeight: 700,
        },
        sizeLarge: {
          padding: '12px 32px',
          fontSize: '1.1rem',
        }
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.08)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: {
          borderRadius: 20,
        },
      },
    }
  },
});

export default theme;
