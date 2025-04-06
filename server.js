const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// MongoDB Connection with retry logic
const connectWithRetry = async () => {
  const maxRetries = 5;
  let retries = 0;

  const tryConnect = async () => {
    try {
      await mongoose.connect('mongodb://localhost:27017/facebook_clone', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      console.log('Connected to MongoDB');
      
      // Test the connection
      await mongoose.connection.db.admin().ping();
      console.log('MongoDB connection is healthy');
      
      // Create dummy data after successful connection
      await createDummyUsers();
    } catch (err) {
      console.error('MongoDB connection error:', err);
      retries++;
      if (retries < maxRetries) {
        console.log(`Retrying connection in 5 seconds... (Attempt ${retries}/${maxRetries})`);
        setTimeout(tryConnect, 5000);
      } else {
        console.error('Failed to connect to MongoDB after multiple attempts');
        process.exit(1);
      }
    }
  };

  await tryConnect();
};

// Add MongoDB connection error handler
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected. Attempting to reconnect...');
  connectWithRetry();
});

// Start server only after MongoDB connection is established
const startServer = async () => {
  try {
    await connectWithRetry();
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`API available at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// User Schema
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  profilePicture: String,
  coverPicture: String,
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  friendRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  location: {
    type: { type: String },
    coordinates: [Number],
    address: String,
    placeId: String
  }
});

// Post Schema with updated fields
const postSchema = new mongoose.Schema({
  content: String,
  image: String,
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  taggedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  privacy: {
    type: String,
    enum: ['public', 'friends', 'private'],
    default: 'friends'
  },
  likes: { type: Number, default: 0 },
  likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [{
    content: String,
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
  }],
  sharedBy: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    comment: String
  }],
  originalPost: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Post = mongoose.model('Post', postSchema);

// Create dummy users with profile pictures
const createDummyUsers = async () => {
  try {
    const existingUsers = await User.find();
    if (existingUsers.length === 0) {
      const dummyUsers = [
        { 
          name: 'Sarthak Sengar', 
          email: 'sarthak@example.com',
          profilePicture: 'https://ui-avatars.com/api/?name=Sarthak+Sengar&background=random',
          location: {
            coordinates: [77.2090, 28.6139],
            address: 'New Delhi, India',
            placeId: 'ChIJL_P_CXMEDTkRw0ZdG-0GVvw'
          }
        },
        { 
          name: 'John Doe', 
          email: 'john@example.com',
          profilePicture: 'https://ui-avatars.com/api/?name=John+Doe&background=random',
          location: {
            coordinates: [72.8777, 19.0760],
            address: 'Mumbai, India',
            placeId: 'ChIJwe1EZjDG5zsRaYxkjY_tpF0'
          }
        },
        { 
          name: 'Jane Smith', 
          email: 'jane@example.com',
          profilePicture: 'https://ui-avatars.com/api/?name=Jane+Smith&background=random',
          location: {
            coordinates: [88.3639, 22.5726],
            address: 'Kolkata, India',
            placeId: 'ChIJZ_YISduC-DkRvCxsj-Yw40M'
          }
        },
        { 
          name: 'Alice Johnson', 
          email: 'alice@example.com',
          profilePicture: 'https://ui-avatars.com/api/?name=Alice+Johnson&background=random',
          location: {
            coordinates: [80.2707, 13.0827],
            address: 'Chennai, India',
            placeId: 'ChIJYTN9T-plUjoRM9RjaAunYW4'
          }
        }
      ];

      // Create users first
      const createdUsers = await User.insertMany(dummyUsers);
      
      // Add some friends
      const [sarthak, john, jane, alice] = createdUsers;
      
      // Make Sarthak friends with John and Jane
      sarthak.friends.push(john._id, jane._id);
      john.friends.push(sarthak._id);
      jane.friends.push(sarthak._id);
      
      // Make John and Jane friends
      john.friends.push(jane._id);
      jane.friends.push(john._id);
      
      // Alice sends friend requests to Sarthak and John
      sarthak.friendRequests.push(alice._id);
      john.friendRequests.push(alice._id);
      
      await Promise.all([
        sarthak.save(),
        john.save(),
        jane.save(),
        alice.save()
      ]);

      // Create some dummy posts
      const dummyPosts = [
        {
          content: 'Hello everyone! This is my first post! 👋',
          author: sarthak._id,
          privacy: 'public',
          location: sarthak.location,
          createdAt: new Date(Date.now() - 3600000) // 1 hour ago
        },
        {
          content: 'Beautiful day in Mumbai! 🌞',
          author: john._id,
          image: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f',
          privacy: 'friends',
          location: john.location,
          createdAt: new Date(Date.now() - 7200000) // 2 hours ago
        },
        {
          content: 'Just visited the Victoria Memorial! 🏛️',
          author: jane._id,
          image: 'https://images.unsplash.com/photo-1532664189809-02133fee698d',
          privacy: 'public',
          location: jane.location,
          taggedUsers: [john._id],
          createdAt: new Date(Date.now() - 10800000) // 3 hours ago
        }
      ];

      await Post.insertMany(dummyPosts);
      console.log('Dummy users and posts created');
    }
  } catch (error) {
    console.error('Error creating dummy data:', error);
  }
};

// Authentication middleware
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ message: 'Authentication failed' });
  }
};

// Routes

// Get all users
app.get('/api/users', async (req, res) => {
  try {
    console.log('Fetching users...');
    const users = await User.find().populate('friends friendRequests');
    console.log(`Found ${users.length} users`);
    if (!users || users.length === 0) {
      console.log('No users found, creating dummy users...');
      await createDummyUsers();
      const newUsers = await User.find().populate('friends friendRequests');
      return res.json(newUsers);
    }
    res.json(users);
  } catch (error) {
    console.error('Error in /api/users:', error);
    res.status(500).json({ 
      message: 'Error fetching users', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get user's friends
app.get('/api/users/:userId/friends', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate('friends');
    res.json(user.friends);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Send friend request
app.post('/api/users/:userId/friend-request', async (req, res) => {
  try {
    const { targetUserId } = req.body;
    const targetUser = await User.findById(targetUserId);
    if (!targetUser.friendRequests.includes(req.params.userId)) {
      targetUser.friendRequests.push(req.params.userId);
      await targetUser.save();
    }
    res.json({ message: 'Friend request sent' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Accept friend request
app.post('/api/users/:userId/accept-friend', async (req, res) => {
  try {
    const { requesterId } = req.body;
    const user = await User.findById(req.params.userId);
    const requester = await User.findById(requesterId);

    user.friends.push(requesterId);
    requester.friends.push(req.params.userId);
    user.friendRequests = user.friendRequests.filter(id => id.toString() !== requesterId);

    await user.save();
    await requester.save();
    res.json({ message: 'Friend request accepted' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update user location
app.post('/api/users/:userId/location', async (req, res) => {
  try {
    const { coordinates, address, placeId } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { 
        location: {
          type: 'Point',
          coordinates,
          address,
          placeId
        }
      },
      { new: true }
    );
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get posts
app.get('/api/posts', async (req, res) => {
  try {
    console.log('Fetching posts with query params:', req.query);
    
    const currentUserId = req.query.userId;
    
    // If userId is provided, filter posts based on privacy settings
    if (currentUserId) {
      const currentUser = await User.findById(currentUserId);
      
      if (!currentUser) {
        console.log('User not found:', currentUserId);
        return res.status(404).json({ message: 'User not found' });
      }

      // Get posts based on privacy settings
      const posts = await Post.find({
        $or: [
          { privacy: 'public' },
          { privacy: 'friends', author: { $in: [...currentUser.friends, currentUserId] } },
          { privacy: 'private', author: currentUserId }
        ]
      })
      .populate('author')
      .populate('taggedUsers')
      .populate('comments.author')
      .sort({ createdAt: -1 });
      
      console.log(`Found ${posts.length} posts for user ${currentUserId}`);
      return res.json(posts);
    } else {
      // If no userId is provided, return all public posts
      console.log('No userId provided, returning all public posts');
      const posts = await Post.find({ privacy: 'public' })
        .populate('author')
        .populate('taggedUsers')
        .populate('comments.author')
        .sort({ createdAt: -1 });
        
      console.log(`Found ${posts.length} public posts`);
      return res.json(posts);
    }
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: 'Error fetching posts', error: error.message });
  }
});

// Create post
app.post('/api/posts', async (req, res) => {
  try {
    const { content, image, authorId, taggedUsers, privacy } = req.body;

    // Validate privacy setting
    if (!['public', 'friends', 'private'].includes(privacy)) {
      return res.status(400).json({ message: 'Invalid privacy setting' });
    }

    // Create and save the post
    const post = new Post({
      content,
      image,
      author: authorId,
      taggedUsers,
      privacy
    });

    await post.save();

    // Populate the post with author and tagged users data
    const populatedPost = await Post.findById(post._id)
      .populate('author')
      .populate('taggedUsers')
      .populate('comments.author');

    res.status(201).json(populatedPost);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ message: 'Error creating post', error: error.message });
  }
});

// Share post
app.post('/api/posts/:id/share', async (req, res) => {
  try {
    const { userId, comment } = req.body;
    
    // Validate inputs
    if (!userId) {
      console.error('Missing userId in share request');
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    if (!req.params.id) {
      console.error('Missing post ID in share request');
      return res.status(400).json({ message: 'Post ID is required' });
    }
    
    // Find the original post
    const originalPost = await Post.findById(req.params.id);
    if (!originalPost) {
      console.error('Original post not found:', req.params.id);
      return res.status(404).json({ message: 'Original post not found' });
    }
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      console.error('User not found:', userId);
      return res.status(400).json({ message: 'User not found' });
    }
    
    // Create a new post that shares the original
    const newPost = new Post({
      content: comment || 'Shared a post',
      author: userId,
      originalPost: originalPost._id,
      privacy: 'friends',
      sharedBy: [{
        user: userId,
        comment: comment || ''
      }]
    });

    const savedPost = await newPost.save();
    
    // Populate only the fields that exist in the schema
    const populatedPost = await Post.findById(savedPost._id)
      .populate('author')
      .populate('taggedUsers')
      .populate('comments.author')
      .populate('originalPost');
      
    console.log('Post shared successfully:', {
      postId: savedPost._id,
      userId: userId,
      originalPostId: originalPost._id
    });

    res.json(populatedPost);
  } catch (error) {
    console.error('Error sharing post:', error);
    res.status(500).json({ 
      message: 'Error sharing post', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Like post
app.post('/api/posts/:id/like', async (req, res) => {
  try {
    const { userId } = req.body;
    
    // Validate userId
    if (!userId) {
      console.error('Missing userId in like request');
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Validate post ID
    if (!req.params.id) {
      console.error('Missing post ID in like request');
      return res.status(400).json({ message: 'Post ID is required' });
    }

    // Find the post
    const post = await Post.findById(req.params.id);
    if (!post) {
      console.error('Post not found:', req.params.id);
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      console.error('User not found:', userId);
      return res.status(400).json({ message: 'User not found' });
    }

    const userLikedIndex = post.likedBy.indexOf(userId);
    
    if (userLikedIndex === -1) {
      post.likes += 1;
      post.likedBy.push(userId);
    } else {
      post.likes -= 1;
      post.likedBy.splice(userLikedIndex, 1);
    }

    const updatedPost = await post.save();
    
    // Populate only the fields that exist in the schema
    const populatedPost = await Post.findById(updatedPost._id)
      .populate('author')
      .populate('taggedUsers')
      .populate('comments.author');
      
    console.log('Post liked/unliked successfully:', {
      postId: updatedPost._id,
      userId: userId,
      newLikeCount: updatedPost.likes
    });
    
    res.json(populatedPost);
  } catch (error) {
    console.error('Error liking/unliking post:', error);
    res.status(500).json({ 
      message: 'Error processing like request', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get comments for a post
app.get('/api/posts/:id/comments', async (req, res) => {
  try {
    console.log('Fetching comments for post:', req.params.id);
    
    const post = await Post.findById(req.params.id)
      .populate('comments.author');
    
    if (!post) {
      console.error('Post not found:', req.params.id);
      return res.status(404).json({ message: 'Post not found' });
    }
    
    console.log(`Found ${post.comments.length} comments for post ${req.params.id}`);
    res.json(post.comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ 
      message: 'Error fetching comments', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Add comment
app.post('/api/posts/:id/comments', async (req, res) => {
  try {
    console.log('Received comment request:', {
      postId: req.params.id,
      body: req.body
    });
    
    const { content, authorId } = req.body;
    
    // Validate inputs
    if (!content || !content.trim()) {
      console.error('Empty comment content');
      return res.status(400).json({ message: 'Comment content cannot be empty' });
    }
    
    if (!authorId) {
      console.error('Missing author ID');
      return res.status(400).json({ message: 'Author ID is required' });
    }
    
    // Find the post
    const post = await Post.findById(req.params.id);
    if (!post) {
      console.error('Post not found:', req.params.id);
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Check if author exists
    const author = await User.findById(authorId);
    if (!author) {
      console.error('Author not found:', authorId);
      return res.status(400).json({ message: 'Author not found' });
    }
    
    // Create the comment object
    const newComment = {
      content: content.trim(),
      author: authorId,
      createdAt: new Date()
    };
    
    console.log('Adding new comment:', newComment);
    
    // Add the comment to the post's comments array
    post.comments.push(newComment);
    
    // Save the updated post
    const updatedPost = await post.save();
    console.log('Post updated successfully');
    
    // Populate the post with author and comment author information
    const populatedPost = await Post.findById(updatedPost._id)
      .populate('author')
      .populate('taggedUsers')
      .populate('comments.author');
      
    console.log('Comment added successfully:', {
      postId: updatedPost._id,
      commentContent: content,
      authorId: authorId
    });
    
    res.json(populatedPost);
  } catch (error) {
    console.error('Error adding comment:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Error adding comment', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Register user
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      profilePicture: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
    });
    
    await user.save();
    
    // Generate token
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
    
    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.status(201).json({ user: userResponse, token });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Error registering user', error: error.message });
  }
});

// Login user
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Generate token
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
    
    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.json({ user: userResponse, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
});

// Get current user
app.get('/api/auth/me', auth, async (req, res) => {
  try {
    // Return user without password
    const user = req.user.toObject();
    delete user.password;
    res.json(user);
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Error getting current user', error: error.message });
  }
});

// Get users who liked a post
app.get('/api/posts/:id/likes', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Get all users who liked the post
    const likedUsers = await User.find({ _id: { $in: post.likedBy } })
      .select('_id name profilePicture');
    
    res.json(likedUsers);
  } catch (error) {
    console.error('Error getting post likes:', error);
    res.status(500).json({ message: 'Error getting post likes', error: error.message });
  }
});

// Start the server
startServer(); 