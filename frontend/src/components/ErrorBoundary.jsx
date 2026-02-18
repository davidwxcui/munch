import React from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            p: 3,
            bgcolor: '#f8f9fa'
          }}
        >
          <Paper
            elevation={3}
            sx={{
              p: 4,
              maxWidth: 600,
              width: '100%',
              borderRadius: 4,
              textAlign: 'center'
            }}
          >
            <Typography variant="h4" color="error" gutterBottom fontWeight="bold">
              Oops! Something went wrong.
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              The application encountered an unexpected error.
            </Typography>
            
            <Box
              sx={{
                mt: 2,
                mb: 4,
                p: 2,
                bgcolor: '#ffebee',
                borderRadius: 2,
                overflow: 'auto',
                maxHeight: 200,
                textAlign: 'left',
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                border: '1px solid #ffcdd2'
              }}
            >
              <strong>{this.state.error && this.state.error.toString()}</strong>
              {this.state.errorInfo && (
                <pre style={{ margin: 0, marginTop: '8px' }}>
                  {this.state.errorInfo.componentStack}
                </pre>
              )}
            </Box>

            <Button
              variant="contained"
              color="primary"
              onClick={this.handleReload}
              size="large"
            >
              Reload Page
            </Button>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
