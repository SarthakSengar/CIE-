import React, { useState, useEffect } from 'react';
import { Container, Box, CssBaseline, createTheme, ThemeProvider, Snackbar, Alert, CircularProgress, Button } from '@mui/material';
import PostCreate from './components/PostCreate';
import PostList from './components/PostList';
import axios from 'axios';
import Login from './components/Login';

// Configure axios defaults
axios.defaults.baseURL = 'http://localhost:3001';
axios.defaults.timeout = 5000; // 5 seconds timeout

// Create a custom theme to match Facebook's colors
const theme = createTheme({
  palette: {
    primary: {
      main: '#1b74e4',
    },
    background: {
      default: '#f0f2f5',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
});

function App() {
  const [posts, setPosts] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Check for authentication on app load
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Set the token in axios headers
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Get current user
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, []);

  // Fetch posts when user changes
  useEffect(() => {
    if (currentUser) {
      fetchPosts();
    }
  }, [currentUser]);

  const fetchCurrentUser = async () => {
    try {
      const response = await axios.get('/api/auth/me');
      setCurrentUser(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching current user:', error);
      // Clear token if it's invalid
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    try {
      // Only include userId if we have a current user
      const params = currentUser ? { userId: currentUser._id } : {};
      const response = await axios.get('/api/posts', { params });
      setPosts(response.data);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setSnackbar({
        open: true,
        message: 'Error fetching posts',
        severity: 'error'
      });
      throw error;
    }
  };

  const handleCreatePost = async (postData) => {
    try {
      const response = await axios.post('/api/posts', postData);
      setPosts([response.data, ...posts]);
      setSnackbar({
        open: true,
        message: 'Post created successfully!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error creating post:', error);
      setSnackbar({
        open: true,
        message: 'Error creating post. Please try again.',
        severity: 'error'
      });
    }
  };

  const handleLike = async (postId) => {
    try {
      // Validate inputs
      if (!postId) {
        throw new Error('Post ID is required');
      }
      
      if (!currentUser || !currentUser._id) {
        throw new Error('User not logged in');
      }
      
      console.log('Liking post:', { postId, userId: currentUser._id });
      
      const response = await axios.post(`/api/posts/${postId}/like`, {
        userId: currentUser._id
      });
      
      console.log('Like response:', response.data);
      
      setPosts(posts.map(post => 
        post._id === postId ? response.data : post
      ));
      
      setSnackbar({
        open: true,
        message: response.data.likedBy.includes(currentUser._id) ? 'Post liked!' : 'Post unliked',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error liking post:', error);
      
      // Extract error message from response if available
      const errorMessage = error.response?.data?.message || error.message || 'Error liking post';
      console.error('Error details:', {
        message: errorMessage,
        response: error.response?.data,
        status: error.response?.status
      });
      
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    }
  };

  const handleComment = async (postId, text) => {
    try {
      // Validate inputs with detailed logging
      console.log('Validating comment inputs:', { postId, text, currentUser });
      
      if (!postId) {
        const error = new Error('Post ID is required');
        console.error(error);
        throw error;
      }
      
      if (!text || !text.trim()) {
        const error = new Error('Comment text cannot be empty');
        console.error(error);
        throw error;
      }
      
      if (!currentUser || !currentUser._id) {
        const error = new Error('User not logged in');
        console.error(error);
        throw error;
      }
      
      // Check if the post exists in our state
      const post = posts.find(p => p._id === postId);
      if (!post) {
        const error = new Error('Post not found');
        console.error(error);
        throw error;
      }
      
      console.log('Adding comment:', { postId, text, authorId: currentUser._id });
      
      // Make sure we're using POST method
      const response = await axios({
        method: 'post',
        url: `/api/posts/${postId}/comments`,
        data: {
          content: text,
          authorId: currentUser._id
        }
      });
      
      console.log('Comment response:', response.data);
      
      // Update the posts state with the updated post
      setPosts(posts.map(post => 
        post._id === postId ? response.data : post
      ));
      
      setSnackbar({
        open: true,
        severity: 'success',
        message: 'Comment added successfully!',
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      
      // Extract error message from response if available
      const errorMessage = error.response?.data?.message || error.message || 'Error adding comment';
      console.error('Error details:', {
        message: errorMessage,
        response: error.response?.data,
        status: error.response?.status
      });
      
      setSnackbar({
        open: true,
        severity: 'error',
        message: errorMessage,
      });
      
      // Re-throw the error so the component can handle it
      throw error;
    }
  };

  const handleShare = async (postId, comment) => {
    try {
      const response = await axios.post(`/api/posts/${postId}/share`, {
        userId: currentUser._id,
        comment
      });
      setPosts([response.data, ...posts]);
      setSnackbar({
        open: true,
        message: 'Post shared successfully!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error sharing post:', error);
      setSnackbar({
        open: true,
        message: 'Error sharing post',
        severity: 'error'
      });
    }
  };

  const handleLogin = (user) => {
    setCurrentUser(user);
    setSnackbar({
      open: true,
      message: 'Welcome back!',
      severity: 'success'
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setCurrentUser(null);
    setSnackbar({
      open: true,
      message: 'Logged out successfully',
      severity: 'success'
    });
  };

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: '100vh' 
          }}
        >
          <CircularProgress />
        </Box>
      </ThemeProvider>
    );
  }

  if (error) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: '100vh',
            flexDirection: 'column',
            gap: 2,
            p: 3,
            textAlign: 'center'
          }}
        >
          <Alert severity="error" sx={{ width: '100%', maxWidth: 500 }}>
            {error}
          </Alert>
          <Button 
            variant="contained" 
            onClick={() => window.location.reload()}
          >
            Retry Connection
          </Button>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ 
        bgcolor: 'background.default', 
        minHeight: '100vh',
        py: 3
      }}>
        {currentUser ? (
          <Container maxWidth="sm">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Facebook_logo_%282012%29.svg/1200px-Facebook_logo_%282012%29.svg.png" 
                  alt="Facebook" 
                  style={{ height: 40 }}
                />
              </Box>
              <Button 
                variant="outlined" 
                onClick={handleLogout}
                sx={{ textTransform: 'none' }}
              >
                Logout
              </Button>
            </Box>
            <PostCreate onSubmit={handleCreatePost} currentUser={currentUser} />
            <PostList 
              posts={posts} 
              onLike={handleLike} 
              onComment={handleComment}
              onShare={handleShare}
              currentUser={currentUser}
            />
          </Container>
        ) : (
          <Login onLogin={handleLogin} />
        )}
      </Box>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}

export default App;
