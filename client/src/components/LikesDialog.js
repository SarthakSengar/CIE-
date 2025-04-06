import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Divider,
  CircularProgress,
  Box
} from '@mui/material';
import axios from 'axios';

function LikesDialog({ open, onClose, postId }) {
  const [likedUsers, setLikedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && postId) {
      fetchLikedUsers();
    }
  }, [open, postId]);

  const fetchLikedUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get(`/api/posts/${postId}/likes`);
      setLikedUsers(response.data);
    } catch (error) {
      console.error('Error fetching liked users:', error);
      setError('Failed to load users who liked this post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h6" component="div">
          People who liked this post
        </Typography>
      </DialogTitle>
      
      <Divider />
      
      <DialogContent sx={{ p: 0 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error" sx={{ p: 2 }}>
            {error}
          </Typography>
        ) : likedUsers.length === 0 ? (
          <Typography sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
            No one has liked this post yet
          </Typography>
        ) : (
          <List sx={{ width: '100%' }}>
            {likedUsers.map((user) => (
              <React.Fragment key={user._id}>
                <ListItem alignItems="flex-start">
                  <ListItemAvatar>
                    <Avatar 
                      alt={user.name} 
                      src={user.profilePicture}
                      sx={{ width: 40, height: 40 }}
                    >
                      {user.name?.[0]}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={user.name}
                    secondary={
                      <Typography
                        component="span"
                        variant="body2"
                        color="text.primary"
                      >
                        {user.email}
                      </Typography>
                    }
                  />
                </ListItem>
                <Divider variant="inset" component="li" />
              </React.Fragment>
            ))}
          </List>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default LikesDialog; 