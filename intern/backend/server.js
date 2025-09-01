const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Mock Database (In production, use MongoDB or SQL database)
let movies = [
  {
    id: 1,
    title: "The Shawshank Redemption",
    genre: ["Drama"],
    releaseYear: 1994,
    director: "Frank Darabont",
    cast: ["Tim Robbins", "Morgan Freeman", "Bob Gunton"],
    synopsis: "Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.",
    posterUrl: "https://via.placeholder.com/300x450?text=Shawshank",
    averageRating: 4.8,
    reviews: []
  },
  {
    id: 2,
    title: "The Godfather",
    genre: ["Crime", "Drama"],
    releaseYear: 1972,
    director: "Francis Ford Coppola",
    cast: ["Marlon Brando", "Al Pacino", "James Caan"],
    synopsis: "The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son.",
    posterUrl: "https://via.placeholder.com/300x450?text=Godfather",
    averageRating: 4.7,
    reviews: []
  },
  {
    id: 3,
    title: "Pulp Fiction",
    genre: ["Crime", "Drama"],
    releaseYear: 1994,
    director: "Quentin Tarantino",
    cast: ["John Travolta", "Uma Thurman", "Samuel L. Jackson"],
    synopsis: "The lives of two mob hitmen, a boxer, a gangster and his wife intertwine in four tales of violence and redemption.",
    posterUrl: "https://via.placeholder.com/300x450?text=Pulp+Fiction",
    averageRating: 4.6,
    reviews: []
  }
];

let users = [];
let reviews = [];
let watchlists = [];

// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Helper function to calculate average rating
const calculateAverageRating = (movieId) => {
  const movieReviews = reviews.filter(review => review.movieId === movieId);
  if (movieReviews.length === 0) return 0;
  
  const sum = movieReviews.reduce((acc, review) => acc + review.rating, 0);
  return Math.round((sum / movieReviews.length) * 10) / 10;
};

// User Authentication Routes
app.post('/api/auth/register', [
  body('username').isLength({ min: 3 }).trim(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password } = req.body;
    
    // Check if user already exists
    const existingUser = users.find(user => user.email === email || user.username === username);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create new user
    const newUser = {
      id: users.length + 1,
      username,
      email,
      password: hashedPassword,
      profilePicture: `https://ui-avatars.com/api/?name=${username}&background=random`,
      joinDate: new Date().toISOString()
    };
    
    users.push(newUser);

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser.id, username: newUser.username },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        profilePicture: newUser.profilePicture
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error during registration' });
  }
});

app.post('/api/auth/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').exists()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    
    // Find user
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Movie Routes
app.get('/api/movies', (req, res) => {
  try {
    const { page = 1, limit = 10, genre, year, search, sortBy = 'title' } = req.query;
    let filteredMovies = [...movies];

    // Apply filters
    if (genre) {
      filteredMovies = filteredMovies.filter(movie => 
        movie.genre.some(g => g.toLowerCase().includes(genre.toLowerCase()))
      );
    }

    if (year) {
      filteredMovies = filteredMovies.filter(movie => movie.releaseYear.toString() === year);
    }

    if (search) {
      const searchTerm = search.toLowerCase();
      filteredMovies = filteredMovies.filter(movie => 
        movie.title.toLowerCase().includes(searchTerm) ||
        movie.director.toLowerCase().includes(searchTerm) ||
        movie.cast.some(actor => actor.toLowerCase().includes(searchTerm))
      );
    }

    // Apply sorting
    filteredMovies.sort((a, b) => {
      switch (sortBy) {
        case 'year':
          return b.releaseYear - a.releaseYear;
        case 'rating':
          return b.averageRating - a.averageRating;
        case 'title':
        default:
          return a.title.localeCompare(b.title);
      }
    });

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedMovies = filteredMovies.slice(startIndex, endIndex);

    res.json({
      movies: paginatedMovies,
      totalCount: filteredMovies.length,
      currentPage: parseInt(page),
      totalPages: Math.ceil(filteredMovies.length / limit)
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching movies' });
  }
});

app.get('/api/movies/:id', (req, res) => {
  try {
    const movieId = parseInt(req.params.id);
    const movie = movies.find(m => m.id === movieId);
    
    if (!movie) {
      return res.status(404).json({ error: 'Movie not found' });
    }

    // Get reviews for this movie
    const movieReviews = reviews.filter(review => review.movieId === movieId);
    
    // Add user information to reviews
    const reviewsWithUsers = movieReviews.map(review => {
      const user = users.find(u => u.id === review.userId);
      return {
        ...review,
        username: user ? user.username : 'Unknown User',
        userProfilePicture: user ? user.profilePicture : null
      };
    });

    res.json({
      ...movie,
      reviews: reviewsWithUsers
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching movie details' });
  }
});

app.post('/api/movies', authenticateToken, [
  body('title').notEmpty().trim(),
  body('genre').isArray(),
  body('releaseYear').isInt({ min: 1900, max: new Date().getFullYear() + 5 }),
  body('director').notEmpty().trim()
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, genre, releaseYear, director, cast, synopsis, posterUrl } = req.body;
    
    const newMovie = {
      id: movies.length + 1,
      title,
      genre,
      releaseYear,
      director,
      cast: cast || [],
      synopsis: synopsis || '',
      posterUrl: posterUrl || `https://via.placeholder.com/300x450?text=${encodeURIComponent(title)}`,
      averageRating: 0,
      reviews: []
    };

    movies.push(newMovie);
    res.status(201).json(newMovie);
  } catch (error) {
    res.status(500).json({ error: 'Error creating movie' });
  }
});

// Review Routes
app.get('/api/movies/:id/reviews', (req, res) => {
  try {
    const movieId = parseInt(req.params.id);
    const movieReviews = reviews.filter(review => review.movieId === movieId);
    
    const reviewsWithUsers = movieReviews.map(review => {
      const user = users.find(u => u.id === review.userId);
      return {
        ...review,
        username: user ? user.username : 'Unknown User',
        userProfilePicture: user ? user.profilePicture : null
      };
    });

    res.json(reviewsWithUsers);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching reviews' });
  }
});

app.post('/api/movies/:id/reviews', authenticateToken, [
  body('rating').isInt({ min: 1, max: 5 }),
  body('reviewText').notEmpty().trim()
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const movieId = parseInt(req.params.id);
    const { rating, reviewText } = req.body;
    
    // Check if movie exists
    const movie = movies.find(m => m.id === movieId);
    if (!movie) {
      return res.status(404).json({ error: 'Movie not found' });
    }

    // Check if user already reviewed this movie
    const existingReview = reviews.find(
      review => review.movieId === movieId && review.userId === req.user.userId
    );
    
    if (existingReview) {
      return res.status(400).json({ error: 'You have already reviewed this movie' });
    }

    const newReview = {
      id: reviews.length + 1,
      movieId,
      userId: req.user.userId,
      rating,
      reviewText,
      timestamp: new Date().toISOString()
    };

    reviews.push(newReview);

    // Update movie's average rating
    const movieIndex = movies.findIndex(m => m.id === movieId);
    movies[movieIndex].averageRating = calculateAverageRating(movieId);

    // Return review with user info
    const user = users.find(u => u.id === req.user.userId);
    const reviewWithUser = {
      ...newReview,
      username: user.username,
      userProfilePicture: user.profilePicture
    };

    res.status(201).json(reviewWithUser);
  } catch (error) {
    res.status(500).json({ error: 'Error creating review' });
  }
});

// User Routes
app.get('/api/users/:id', authenticateToken, (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const user = users.find(u => u.id === userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's reviews
    const userReviews = reviews.filter(review => review.userId === userId);
    const reviewsWithMovies = userReviews.map(review => {
      const movie = movies.find(m => m.id === review.movieId);
      return {
        ...review,
        movieTitle: movie ? movie.title : 'Unknown Movie',
        moviePoster: movie ? movie.posterUrl : null
      };
    });

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      profilePicture: user.profilePicture,
      joinDate: user.joinDate,
      reviews: reviewsWithMovies
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching user profile' });
  }
});

app.put('/api/users/:id', authenticateToken, [
  body('username').optional().isLength({ min: 3 }).trim(),
  body('email').optional().isEmail().normalizeEmail()
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = parseInt(req.params.id);
    
    // Check if user is updating their own profile
    if (req.user.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized to update this profile' });
    }

    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { username, email, profilePicture } = req.body;
    
    // Check for duplicate username/email
    if (username && users.some(u => u.username === username && u.id !== userId)) {
      return res.status(400).json({ error: 'Username already taken' });
    }
    
    if (email && users.some(u => u.email === email && u.id !== userId)) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    // Update user
    if (username) users[userIndex].username = username;
    if (email) users[userIndex].email = email;
    if (profilePicture) users[userIndex].profilePicture = profilePicture;

    res.json({
      id: users[userIndex].id,
      username: users[userIndex].username,
      email: users[userIndex].email,
      profilePicture: users[userIndex].profilePicture
    });
  } catch (error) {
    res.status(500).json({ error: 'Error updating user profile' });
  }
});

// Watchlist Routes
app.get('/api/users/:id/watchlist', authenticateToken, (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (req.user.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized to view this watchlist' });
    }

    const userWatchlist = watchlists.filter(item => item.userId === userId);
    const watchlistWithMovies = userWatchlist.map(item => {
      const movie = movies.find(m => m.id === item.movieId);
      return {
        ...item,
        movie: movie
      };
    });

    res.json(watchlistWithMovies);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching watchlist' });
  }
});

app.post('/api/users/:id/watchlist', authenticateToken, [
  body('movieId').isInt({ min: 1 })
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = parseInt(req.params.id);
    const { movieId } = req.body;
    
    if (req.user.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized to modify this watchlist' });
    }

    // Check if movie exists
    const movie = movies.find(m => m.id === movieId);
    if (!movie) {
      return res.status(404).json({ error: 'Movie not found' });
    }

    // Check if already in watchlist
    const existingItem = watchlists.find(
      item => item.userId === userId && item.movieId === movieId
    );
    
    if (existingItem) {
      return res.status(400).json({ error: 'Movie already in watchlist' });
    }

    const newWatchlistItem = {
      id: watchlists.length + 1,
      userId,
      movieId,
      dateAdded: new Date().toISOString()
    };

    watchlists.push(newWatchlistItem);
    res.status(201).json({ ...newWatchlistItem, movie });
  } catch (error) {
    res.status(500).json({ error: 'Error adding to watchlist' });
  }
});

app.delete('/api/users/:id/watchlist/:movieId', authenticateToken, (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const movieId = parseInt(req.params.movieId);
    
    if (req.user.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized to modify this watchlist' });
    }

    const itemIndex = watchlists.findIndex(
      item => item.userId === userId && item.movieId === movieId
    );
    
    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Movie not in watchlist' });
    }

    watchlists.splice(itemIndex, 1);
    res.json({ message: 'Movie removed from watchlist' });
  } catch (error) {
    res.status(500).json({ error: 'Error removing from watchlist' });
  }
});

// Featured/Trending Movies Route
app.get('/api/movies/featured', (req, res) => {
  try {
    // Return top rated movies as featured
    const featured = [...movies]
      .sort((a, b) => b.averageRating - a.averageRating)
      .slice(0, 6);
    
    res.json(featured);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching featured movies' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;