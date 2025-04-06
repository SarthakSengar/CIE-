import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Container,
  Avatar,
  Grid,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import { Facebook as FacebookIcon } from '@mui/icons-material';
import axios from 'axios';

function Login({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const response = await axios.post(endpoint, formData);
      
      // Store token in localStorage
      localStorage.setItem('token', response.data.token);
      
      // Set default Authorization header for all future requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      
      setSuccess(isLogin ? 'Login successful!' : 'Registration successful!');
      
      // Call the onLogin callback with the user data
      onLogin(response.data.user);
    } catch (error) {
      console.error('Authentication error:', error);
      setError(error.response?.data?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setSuccess('');
  };

  return (
    <Container maxWidth="sm">
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          mt: 8, 
          borderRadius: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        <Avatar sx={{ m: 1, bgcolor: '#1877f2', width: 56, height: 56 }}>
          <FacebookIcon fontSize="large" />
        </Avatar>
        
        <Typography component="h1" variant="h5" sx={{ mt: 2, mb: 3 }}>
          {isLogin ? 'Sign In' : 'Create Account'}
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ width: '100%', mb: 2 }}>
            {success}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
          {!isLogin && (
            <TextField
              margin="normal"
              required
              fullWidth
              id="name"
              label="Full Name"
              name="name"
              autoComplete="name"
              autoFocus
              value={formData.name}
              onChange={handleChange}
            />
          )}
          
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus={isLogin}
            value={formData.email}
            onChange={handleChange}
          />
          
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete={isLogin ? 'current-password' : 'new-password'}
            value={formData.password}
            onChange={handleChange}
          />
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ 
              mt: 3, 
              mb: 2, 
              py: 1.5,
              bgcolor: '#1877f2',
              '&:hover': {
                bgcolor: '#166fe5'
              }
            }}
            disabled={loading}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              isLogin ? 'Sign In' : 'Create Account'
            )}
          </Button>
          
          <Grid container justifyContent="center">
            <Grid item>
              <Button 
                onClick={toggleMode}
                sx={{ 
                  textTransform: 'none',
                  color: '#1877f2'
                }}
              >
                {isLogin 
                  ? "Don't have an account? Sign Up" 
                  : "Already have an account? Sign In"}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
}

export default Login; 