import React, { useState, useRef, useEffect } from 'react';
import { 
  Paper, 
  TextField, 
  Button, 
  Box, 
  Avatar, 
  Typography, 
  IconButton, 
  Menu, 
  MenuItem,
  Popover,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Select,
  FormControl
} from '@mui/material';
import ImageIcon from '@mui/icons-material/Image';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import GifIcon from '@mui/icons-material/Gif';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import CloseIcon from '@mui/icons-material/Close';
import PublicIcon from '@mui/icons-material/Public';
import PeopleIcon from '@mui/icons-material/People';
import LockIcon from '@mui/icons-material/Lock';
import EmojiPicker from 'emoji-picker-react';
import axios from 'axios';

function PostCreate({ onSubmit, currentUser }) {
  const [content, setContent] = useState('');
  const [feeling, setFeeling] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [privacy, setPrivacy] = useState('friends');
  const fileInputRef = useRef(null);
  
  // User states
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [friendsDialogOpen, setFriendsDialogOpen] = useState(false);
  const [friends, setFriends] = useState([]);
  
  // State for emoji picker
  const [emojiAnchorEl, setEmojiAnchorEl] = useState(null);
  
  // State for more options menu
  const [moreAnchorEl, setMoreAnchorEl] = useState(null);
  
  // State for snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Fetch users and friends on component mount
  useEffect(() => {
    fetchUsers();
    if (currentUser?._id) {
      fetchFriends(currentUser._id);
    }
  }, [currentUser]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      setSnackbar({
        open: true,
        message: 'Error fetching users',
        severity: 'error'
      });
    }
  };

  const fetchFriends = async (userId) => {
    try {
      const response = await axios.get(`/api/users/${userId}/friends`);
      setFriends(response.data);
    } catch (error) {
      console.error('Error fetching friends:', error);
      setSnackbar({
        open: true,
        message: 'Error fetching friends',
        severity: 'error'
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (content.trim() || selectedImage) {
      const postData = {
        content,
        image: selectedImage,
        authorId: currentUser?._id,
        taggedUsers: selectedUsers.map(user => user._id),
        privacy
      };

      onSubmit(postData);
      setContent('');
      setSelectedImage(null);
      setFeeling('');
      setSelectedUsers([]);
      setPrivacy('friends');
      setSnackbar({
        open: true,
        message: 'Post created successfully!',
        severity: 'success'
      });
    }
  };

  // Image handling
  const handleImageClick = () => {
    fileInputRef.current.click();
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setSnackbar({
          open: true,
          message: 'Image size should be less than 5MB',
          severity: 'error'
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        // Compress image if needed
        const img = new Image();
        img.src = reader.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Calculate new dimensions while maintaining aspect ratio
          let width = img.width;
          let height = img.height;
          const maxDimension = 1200;
          
          if (width > height && width > maxDimension) {
            height = (height * maxDimension) / width;
            width = maxDimension;
          } else if (height > maxDimension) {
            width = (width * maxDimension) / height;
            height = maxDimension;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // Draw and compress image
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to base64 with reduced quality
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
          setSelectedImage(compressedBase64);
        };
      };
      reader.readAsDataURL(file);
    }
  };

  // Emoji handling
  const handleEmojiClick = (event) => {
    setEmojiAnchorEl(event.currentTarget);
  };

  const handleEmojiClose = () => {
    setEmojiAnchorEl(null);
  };

  const onEmojiSelect = (emojiObject) => {
    setContent(prevContent => prevContent + emojiObject.emoji);
    handleEmojiClose();
  };

  // User tagging
  const handleTagClick = () => {
    setTagDialogOpen(true);
  };

  const handleUserSelect = (user) => {
    if (!selectedUsers.find(u => u._id === user._id)) {
      setSelectedUsers([...selectedUsers, user]);
      setSnackbar({
        open: true,
        message: `Tagged ${user.name}`,
        severity: 'success'
      });
    }
  };

  const handleRemoveUser = (userId) => {
    setSelectedUsers(selectedUsers.filter(user => user._id !== userId));
  };

  // Friends handling
  const handleFriendsClick = () => {
    setFriendsDialogOpen(true);
  };

  const sendFriendRequest = async (targetUserId) => {
    try {
      await axios.post(`/api/users/${currentUser._id}/friend-request`, {
        targetUserId
      });
      setSnackbar({
        open: true,
        message: 'Friend request sent!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error sending friend request:', error);
      setSnackbar({
        open: true,
        message: 'Error sending friend request',
        severity: 'error'
      });
    }
  };

  // More options handling
  const handleMoreClick = (event) => {
    setMoreAnchorEl(event.currentTarget);
  };

  const handleMoreClose = () => {
    setMoreAnchorEl(null);
  };

  // Handle close
  const handleClose = () => {
    setContent('');
    setSelectedImage(null);
    setFeeling('');
  };

  const getPrivacyIcon = (value) => {
    switch (value) {
      case 'public': return <PublicIcon />;
      case 'friends': return <PeopleIcon />;
      case 'private': return <LockIcon />;
      default: return <PeopleIcon />;
    }
  };

  return (
    <Paper sx={{ 
      p: 2, 
      mb: 3, 
      borderRadius: 3,
      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.2)'
    }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 2
      }}>
        <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
          Create post
        </Typography>
        <IconButton size="small" onClick={handleClose}>
          <CloseIcon />
        </IconButton>
      </Box>

      {/* User Info and Privacy Setting */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Avatar src={currentUser?.profilePicture} sx={{ mr: 1 }} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
            {currentUser?.name || 'Loading...'}
          </Typography>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={privacy}
              onChange={(e) => setPrivacy(e.target.value)}
              sx={{ 
                height: 30,
                '.MuiSelect-select': { 
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  py: 0
                }
              }}
            >
              <MenuItem value="public">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PublicIcon fontSize="small" />
                  <Typography>Public</Typography>
                </Box>
              </MenuItem>
              <MenuItem value="friends">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PeopleIcon fontSize="small" />
                  <Typography>Friends</Typography>
                </Box>
              </MenuItem>
              <MenuItem value="private">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LockIcon fontSize="small" />
                  <Typography>Only me</Typography>
                </Box>
              </MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          multiline
          rows={4}
          placeholder={`What's on your mind, ${currentUser?.name?.split(' ')[0]}?${feeling ? ` - feeling ${feeling}` : ''}`}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          variant="standard"
          InputProps={{
            disableUnderline: true,
            style: { fontSize: '1.5rem' }
          }}
          sx={{ mb: 2 }}
        />

        {/* Tagged Users */}
        {selectedUsers.length > 0 && (
          <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {selectedUsers.map(user => (
              <Chip
                key={user._id}
                avatar={<Avatar src={user.profilePicture}>{user.name[0]}</Avatar>}
                label={user.name}
                onDelete={() => handleRemoveUser(user._id)}
              />
            ))}
          </Box>
        )}

        {/* Selected Image Preview */}
        {selectedImage && (
          <Box sx={{ mb: 2, position: 'relative' }}>
            <img 
              src={selectedImage} 
              alt="Selected" 
              style={{ width: '100%', borderRadius: 8 }}
            />
            <IconButton
              onClick={() => setSelectedImage(null)}
              sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'rgba(0,0,0,0.5)' }}
            >
              <CloseIcon sx={{ color: 'white' }} />
            </IconButton>
          </Box>
        )}

        {/* Add Photos/Videos Box */}
        {!selectedImage && (
          <Paper 
            variant="outlined" 
            sx={{ 
              p: 3, 
              mb: 2, 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center',
              border: '2px dashed #ddd',
              borderRadius: 2,
              cursor: 'pointer'
            }}
            onClick={handleImageClick}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              style={{ display: 'none' }}
            />
            <Box sx={{ mb: 1 }}>
              <IconButton size="large">
                <ImageIcon fontSize="large" />
              </IconButton>
            </Box>
            <Typography variant="subtitle1" sx={{ mb: 0.5 }}>
              Add photos/videos
            </Typography>
            <Typography variant="body2" color="text.secondary">
              or drag and drop
            </Typography>
          </Paper>
        )}

        {/* Action Buttons */}
        <Box sx={{ 
          display: 'flex', 
          gap: 1, 
          p: 1, 
          border: '1px solid #ddd',
          borderRadius: 2,
          mb: 2
        }}>
          <Typography variant="subtitle2" sx={{ mr: 1 }}>
            Add to your post:
          </Typography>
          <IconButton size="small" sx={{ color: '#45bd62' }} onClick={handleImageClick}>
            <ImageIcon />
          </IconButton>
          <IconButton size="small" sx={{ color: '#1877f2' }} onClick={handleTagClick}>
            <PersonAddIcon />
          </IconButton>
          <IconButton size="small" sx={{ color: '#f7b928' }} onClick={handleEmojiClick}>
            <EmojiEmotionsIcon />
          </IconButton>
          <IconButton size="small" onClick={handleMoreClick}>
            <MoreHorizIcon />
          </IconButton>
        </Box>

        <Button
          fullWidth
          variant="contained"
          color="primary"
          type="submit"
          disabled={!content.trim() && !selectedImage}
          sx={{ 
            borderRadius: 2,
            textTransform: 'none',
            py: 1,
            backgroundColor: '#1b74e4',
            '&:hover': {
              backgroundColor: '#1660c1'
            }
          }}
        >
          Post
        </Button>
      </form>

      {/* Tag Users Dialog */}
      <Dialog open={tagDialogOpen} onClose={() => setTagDialogOpen(false)}>
        <DialogTitle>Tag People</DialogTitle>
        <DialogContent>
          <List>
            {users.map(user => (
              <ListItem
                key={user._id}
                button
                onClick={() => handleUserSelect(user)}
                disabled={selectedUsers.some(u => u._id === user._id)}
              >
                <ListItemAvatar>
                  <Avatar src={user.profilePicture}>{user.name[0]}</Avatar>
                </ListItemAvatar>
                <ListItemText 
                  primary={user.name} 
                  secondary={user.location?.address || user.email}
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTagDialogOpen(false)}>Done</Button>
        </DialogActions>
      </Dialog>

      {/* Friends Dialog */}
      <Dialog open={friendsDialogOpen} onClose={() => setFriendsDialogOpen(false)}>
        <DialogTitle>Friends</DialogTitle>
        <DialogContent>
          <List>
            {users.filter(user => user._id !== currentUser?._id).map(user => (
              <ListItem
                key={user._id}
                secondaryAction={
                  !friends.find(f => f._id === user._id) && (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => sendFriendRequest(user._id)}
                    >
                      Add Friend
                    </Button>
                  )
                }
              >
                <ListItemAvatar>
                  <Avatar src={user.profilePicture}>{user.name[0]}</Avatar>
                </ListItemAvatar>
                <ListItemText 
                  primary={user.name} 
                  secondary={
                    <>
                      {friends.find(f => f._id === user._id) ? 'Friend' : 'Not Connected'}
                      {user.location?.address && ` • ${user.location.address}`}
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFriendsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Emoji Picker Popover */}
      <Popover
        open={Boolean(emojiAnchorEl)}
        anchorEl={emojiAnchorEl}
        onClose={handleEmojiClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <Box sx={{ p: 2 }}>
          <EmojiPicker onEmojiClick={onEmojiSelect} />
        </Box>
      </Popover>

      {/* More Options Menu */}
      <Menu
        anchorEl={moreAnchorEl}
        open={Boolean(moreAnchorEl)}
        onClose={handleMoreClose}
      >
        <MenuItem onClick={handleMoreClose}>Background Color</MenuItem>
        <MenuItem onClick={handleMoreClose}>Tag Event</MenuItem>
        <MenuItem onClick={handleMoreClose}>Support Cause</MenuItem>
      </Menu>

      {/* Snackbar for notifications */}
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
    </Paper>
  );
}

export default PostCreate; 