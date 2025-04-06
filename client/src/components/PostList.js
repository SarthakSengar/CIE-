import React, { useState } from 'react';
import { 
  Paper, 
  Typography, 
  Button, 
  Box, 
  Stack, 
  Avatar, 
  IconButton,
  TextField,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Card,
  CardHeader,
  CardMedia,
  CardContent,
  CardActions,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Tooltip
} from '@mui/material';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import ShareIcon from '@mui/icons-material/Share';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import PublicIcon from '@mui/icons-material/Public';
import SendIcon from '@mui/icons-material/Send';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PeopleIcon from '@mui/icons-material/People';
import LockIcon from '@mui/icons-material/Lock';
import LikesDialog from './LikesDialog';
import axios from 'axios';

function PostList({ posts, onLike, onComment, onShare, currentUser }) {
  const [expandedComments, setExpandedComments] = useState({});
  const [commentText, setCommentText] = useState({});
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareComment, setShareComment] = useState('');
  const [moreAnchorEl, setMoreAnchorEl] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [likesDialogOpen, setLikesDialogOpen] = useState(false);
  const [selectedPostForLikes, setSelectedPostForLikes] = useState(null);

  // If no posts are available, create dummy posts
  const displayPosts = posts

  const handleCommentClick = (postId) => {
    setExpandedComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const handleCommentChange = (postId, value) => {
    setCommentText(prev => ({
      ...prev,
      [postId]: value
    }));
  };

  const handleCommentSubmit = async (postId) => {
    if (!commentText[postId]?.trim()) return;

    try {
      // Log the post ID and comment text
      console.log('Attempting to submit comment:', {
        postId,
        text: commentText[postId],
        currentUser
      });

      // Validate post ID
      if (!postId) {
        console.error('Invalid post ID');
        setSnackbarMessage('Error: Invalid post ID');
        setSnackbarOpen(true);
        return;
      }

      // Validate current user
      if (!currentUser || !currentUser._id) {
        console.error('Current user not available:', currentUser);
        setSnackbarMessage('Error: Please log in to comment');
        setSnackbarOpen(true);
        return;
      }

      // Call the onComment function
      await onComment(postId, commentText[postId]);
      console.log('Comment submitted successfully');
      
      // Only clear the comment text if the submission was successful
      setCommentText(prev => ({
        ...prev,
        [postId]: ''
      }));
    } catch (error) {
      console.error('Error submitting comment:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Error submitting comment';
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
    }
  };

  const handleLike = async (postId) => {
    try {
      onLike(postId);
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleLikesClick = (post) => {
    setSelectedPostForLikes(post);
    setLikesDialogOpen(true);
  };

  const handleShare = (post) => {
    setSelectedPost(post);
    setShareDialogOpen(true);
  };

  const handleShareDialogClose = () => {
    setShareDialogOpen(false);
    setSelectedPost(null);
    setShareComment('');
  };

  const handleShareSubmit = async () => {
    if (selectedPost) {
      try {
        onShare(selectedPost._id, shareComment);
        handleShareDialogClose();
      } catch (error) {
        console.error('Error sharing post:', error);
      }
    }
  };

  const handleMoreClick = (event, post) => {
    setSelectedPost(post);
    setMoreAnchorEl(event.currentTarget);
  };

  const handleMoreClose = () => {
    setMoreAnchorEl(null);
    setSelectedPost(null);
  };

  const handlePostAction = (action) => {
    setSnackbarMessage(`Post ${action} successfully!`);
    setSnackbarOpen(true);
    handleMoreClose();
  };

  const getPrivacyIcon = (privacy) => {
    switch (privacy) {
      case 'public': return <PublicIcon fontSize="small" />;
      case 'friends': return <PublicIcon fontSize="small" />;
      case 'private': return <PublicIcon fontSize="small" />;
      default: return <PublicIcon fontSize="small" />;
    }
  };

  const handleLikesDialogClose = () => {
    setLikesDialogOpen(false);
    setSelectedPostForLikes(null);
  };

  return (
    <>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {displayPosts.map((post) => (
          <Card key={post._id} sx={{ borderRadius: 3, boxShadow: '0 1px 2px rgba(0, 0, 0, 0.2)' }}>
            <CardHeader
              avatar={
                <Avatar src={post.author?.profilePicture} alt={post.author?.name}>
                  {post.author?.name?.[0]}
                </Avatar>
              }
              action={
                <IconButton onClick={(e) => handleMoreClick(e, post)}>
                  <MoreHorizIcon />
                </IconButton>
              }
              title={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    {post.author?.name}
                  </Typography>
                  {getPrivacyIcon(post.privacy)}
                </Box>
              }
              subheader={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(post.createdAt).toLocaleString()}
                  </Typography>
                  {post.location && (
                    <>
                      <Typography variant="body2" color="text.secondary">•</Typography>
                      <LocationOnIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {post.location.address}
                      </Typography>
                    </>
                  )}
                </Box>
              }
            />

            <CardContent>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {post.content}
              </Typography>
            </CardContent>

            {post.image && (
              <CardMedia
                component="img"
                image={post.image}
                alt="Post image"
                sx={{
                  width: '100%',
                  maxHeight: 500,
                  objectFit: 'contain',
                  bgcolor: 'black'
                }}
              />
            )}

            <CardActions sx={{ px: 2, py: 1 }}>
              <IconButton 
                onClick={() => handleLike(post._id)}
                color={post.likedBy?.includes(currentUser._id) ? 'primary' : 'default'}
              >
                <ThumbUpIcon />
              </IconButton>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ 
                  cursor: 'pointer',
                  '&:hover': { textDecoration: 'underline' }
                }}
                onClick={() => handleLikesClick(post)}
              >
                {post.likes || 0} Like{post.likes !== 1 ? 's' : ''}
              </Typography>
              <IconButton onClick={() => handleCommentClick(post._id)}>
                <ChatBubbleOutlineIcon />
              </IconButton>
              <Typography variant="body2" color="text.secondary">
                {post.comments?.length || 0} Comment{post.comments?.length !== 1 ? 's' : ''}
              </Typography>
              <IconButton onClick={() => handleShare(post)}>
                <ShareIcon />
              </IconButton>
            </CardActions>

            {expandedComments[post._id] && (
              <Box sx={{ p: 2 }}>
                <List>
                  {post.comments?.map((comment, index) => (
                    <ListItem key={index} alignItems="flex-start">
                      <ListItemAvatar>
                        <Avatar src={comment.author?.profilePicture} alt={comment.author?.name}>
                          {comment.author?.name?.[0]}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="subtitle2">
                            {comment.author?.name}
                          </Typography>
                        }
                        secondary={
                          <>
                            <Typography component="span" variant="body2" color="text.primary">
                              {comment.content}
                            </Typography>
                            <br />
                            <Typography component="span" variant="caption" color="text.secondary">
                              {new Date(comment.createdAt).toLocaleString()}
                            </Typography>
                          </>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                  <Avatar 
                    src={currentUser?.profilePicture} 
                    alt={currentUser?.name}
                    sx={{ width: 32, height: 32 }}
                  >
                    {currentUser?.name?.[0]}
                  </Avatar>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Write a comment..."
                    value={commentText[post._id] || ''}
                    onChange={(e) => handleCommentChange(post._id, e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleCommentSubmit(post._id);
                      }
                    }}
                  />
                  <IconButton 
                    onClick={() => handleCommentSubmit(post._id)}
                    disabled={!commentText[post._id]?.trim()}
                  >
                    <SendIcon />
                  </IconButton>
                </Box>
              </Box>
            )}

            {post.taggedUsers?.length > 0 && (
              <Box sx={{ px: 2, pb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  with {post.taggedUsers.map(user => user.name).join(', ')}
                </Typography>
              </Box>
            )}

            <Divider />
          </Card>
        ))}
      </Box>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onClose={handleShareDialogClose}>
        <DialogTitle>Share Post</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder="Say something about this..."
            value={shareComment}
            onChange={(e) => setShareComment(e.target.value)}
            sx={{ mt: 2 }}
          />
          {selectedPost && (
            <Paper sx={{ p: 2, mt: 2, bgcolor: '#f0f2f5' }}>
              <Typography variant="body2">{selectedPost.content}</Typography>
            </Paper>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleShareDialogClose}>Cancel</Button>
          <Button onClick={handleShareSubmit} variant="contained">Share</Button>
        </DialogActions>
      </Dialog>

      {/* More Options Menu */}
      <Menu
        anchorEl={moreAnchorEl}
        open={Boolean(moreAnchorEl)}
        onClose={handleMoreClose}
      >
        <MenuItem onClick={() => handlePostAction('saved')}>Save Post</MenuItem>
        <MenuItem onClick={() => handlePostAction('reported')}>Report Post</MenuItem>
        <MenuItem onClick={() => handlePostAction('hidden')}>Hide Post</MenuItem>
      </Menu>

      {/* Likes Dialog */}
      <LikesDialog 
        open={likesDialogOpen}
        onClose={handleLikesDialogClose}
        postId={selectedPostForLikes?._id}
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </>
  );
}

export default PostList; 