import React, { useState, useEffect, createContext, useContext, useReducer } from 'react';
import { Search, Star, Heart, User, Film, Home, LogOut, Plus, Trash2, Filter } from 'lucide-react';

// Context for global state management
const AppContext = createContext();

// Auth reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN':
      return { ...state, isAuthenticated: true, user: action.payload.user, token: action.payload.token };
    case 'LOGOUT':
      return { ...state, isAuthenticated: false, user: null, token: null };
    case 'UPDATE_USER':
      return { ...state, user: { ...state.user, ...action.payload } };
    default:
      return state;
  }
};

// API service
const API_BASE = 'http://localhost:5000/api';

const apiService = {
  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'API request failed');
      }
      
      return data;
    } catch (error) {
      throw new Error(error.message || 'Network error');
    }
  },

  async getMovies(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/movies?${query}`);
  },

  async getMovie(id) {
    return this.request(`/movies/${id}`);
  },

  async getFeaturedMovies() {
    return this.request('/movies/featured');
  },

  async login(credentials) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  async addReview(movieId, reviewData, token) {
    return this.request(`/movies/${movieId}/reviews`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(reviewData),
    });
  },

  async getWatchlist(userId, token) {
    return this.request(`/users/${userId}/watchlist`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  async addToWatchlist(userId, movieId, token) {
    return this.request(`/users/${userId}/watchlist`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ movieId }),
    });
  },

  async removeFromWatchlist(userId, movieId, token) {
    return this.request(`/users/${userId}/watchlist/${movieId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
  }
};

// Star Rating Component
const StarRating = ({ rating, onRatingChange, readOnly = false, size = 'w-5 h-5' }) => {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${size} cursor-pointer transition-colors ${
            star <= (hover || rating)
              ? 'fill-yellow-400 text-yellow-400'
              : 'text-gray-300'
          }`}
          onClick={readOnly ? undefined : () => onRatingChange?.(star)}
          onMouseEnter={readOnly ? undefined : () => setHover(star)}
          onMouseLeave={readOnly ? undefined : () => setHover(0)}
        />
      ))}
    </div>
  );
};

// Movie Card Component
const MovieCard = ({ movie, onClick, showWatchlistButton = false, onWatchlistToggle, isInWatchlist = false }) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
      <div onClick={onClick}>
        <img 
          src={movie.posterUrl} 
          alt={movie.title}
          className="w-full h-64 object-cover"
        />
        <div className="p-4">
          <h3 className="font-bold text-lg mb-2 line-clamp-2">{movie.title}</h3>
          <p className="text-gray-600 text-sm mb-2">{movie.releaseYear} • {movie.genre?.join(', ')}</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <StarRating rating={movie.averageRating || 0} readOnly size="w-4 h-4" />
              <span className="text-sm text-gray-600">({movie.averageRating || 0})</span>
            </div>
            {showWatchlistButton && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onWatchlistToggle?.(movie.id);
                }}
                className={`p-2 rounded-full transition-colors ${
                  isInWatchlist 
                    ? 'bg-red-100 text-red-600 hover:bg-red-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Heart className={`w-4 h-4 ${isInWatchlist ? 'fill-current' : ''}`} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Navigation Component
const Navigation = ({ currentPage, onPageChange, user, onLogout }) => {
  return (
    <nav className="bg-blue-600 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-6">
          <h1 className="text-xl font-bold flex items-center">
            <Film className="w-6 h-6 mr-2" />
            MovieReviews
          </h1>
          <div className="flex space-x-4">
            <button
              onClick={() => onPageChange('home')}
              className={`flex items-center space-x-1 px-3 py-2 rounded ${
                currentPage === 'home' ? 'bg-blue-700' : 'hover:bg-blue-500'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </button>
            <button
              onClick={() => onPageChange('movies')}
              className={`flex items-center space-x-1 px-3 py-2 rounded ${
                currentPage === 'movies' ? 'bg-blue-700' : 'hover:bg-blue-500'
              }`}
            >
              <Film className="w-4 h-4" />
              <span>Movies</span>
            </button>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <button
                onClick={() => onPageChange('profile')}
                className={`flex items-center space-x-2 px-3 py-2 rounded ${
                  currentPage === 'profile' ? 'bg-blue-700' : 'hover:bg-blue-500'
                }`}
              >
                <User className="w-4 h-4" />
                <span>{user.username}</span>
              </button>
              <button
                onClick={onLogout}
                className="flex items-center space-x-1 px-3 py-2 rounded hover:bg-blue-500"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => onPageChange('auth')}
              className="bg-blue-700 px-4 py-2 rounded hover:bg-blue-800"
            >
              Login / Register
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

// Home Page Component
const HomePage = ({ onNavigateToMovie }) => {
  const [featuredMovies, setFeaturedMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFeaturedMovies = async () => {
      try {
        const data = await apiService.getFeaturedMovies();
        setFeaturedMovies(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedMovies();
  }, []);

  if (loading) return <div className="text-center py-8">Loading featured movies...</div>;
  if (error) return <div className="text-center py-8 text-red-600">Error: {error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Welcome to MovieReviews</h1>
        <p className="text-xl text-gray-600">Discover, review, and share your favorite films</p>
      </div>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Featured Movies</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {featuredMovies.map(movie => (
            <MovieCard
              key={movie.id}
              movie={movie}
              onClick={() => onNavigateToMovie(movie.id)}
            />
          ))}
        </div>
      </section>

      <section className="bg-gray-50 rounded-lg p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Start Your Movie Journey</h2>
        <p className="text-gray-600 mb-6">
          Join our community of movie enthusiasts. Rate movies, write reviews, and discover your next favorite film.
        </p>
        <div className="flex justify-center space-x-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <Film className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="font-semibold">Discover Movies</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <Star className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <p className="font-semibold">Rate & Review</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <Heart className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="font-semibold">Create Watchlists</p>
          </div>
        </div>
      </section>
    </div>
  );
};

// Movies Listing Component
const MoviesPage = ({ onNavigateToMovie }) => {
  const { auth } = useContext(AppContext);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    genre: '',
    year: '',
    sortBy: 'title'
  });
  const [watchlist, setWatchlist] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchMovies();
  }, [filters, currentPage]);

  useEffect(() => {
    if (auth.isAuthenticated) {
      fetchWatchlist();
    }
  }, [auth.isAuthenticated]);

  const fetchMovies = async () => {
    try {
      setLoading(true);
      const params = { ...filters, page: currentPage, limit: 12 };
      Object.keys(params).forEach(key => params[key] === '' && delete params[key]);
      
      const data = await apiService.getMovies(params);
      setMovies(data.movies);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchWatchlist = async () => {
    try {
      const data = await apiService.getWatchlist(auth.user.id, auth.token);
      setWatchlist(data.map(item => item.movieId));
    } catch (err) {
      console.error('Error fetching watchlist:', err);
    }
  };

  const handleWatchlistToggle = async (movieId) => {
    if (!auth.isAuthenticated) return;

    try {
      const isInWatchlist = watchlist.includes(movieId);
      
      if (isInWatchlist) {
        await apiService.removeFromWatchlist(auth.user.id, movieId, auth.token);
        setWatchlist(prev => prev.filter(id => id !== movieId));
      } else {
        await apiService.addToWatchlist(auth.user.id, movieId, auth.token);
        setWatchlist(prev => [...prev, movieId]);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({ search: '', genre: '', year: '', sortBy: 'title' });
    setCurrentPage(1);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Browse Movies</h1>
        
        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search movies..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={filters.genre}
              onChange={(e) => handleFilterChange('genre', e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Genres</option>
              <option value="action">Action</option>
              <option value="comedy">Comedy</option>
              <option value="drama">Drama</option>
              <option value="crime">Crime</option>
              <option value="horror">Horror</option>
              <option value="romance">Romance</option>
            </select>

            <input
              type="number"
              placeholder="Year"
              value={filters.year}
              onChange={(e) => handleFilterChange('year', e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              min="1900"
              max={new Date().getFullYear() + 5}
            />

            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="title">Sort by Title</option>
              <option value="year">Sort by Year</option>
              <option value="rating">Sort by Rating</option>
            </select>
          </div>
          
          <button
            onClick={clearFilters}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
          >
            <Filter className="w-4 h-4" />
            <span>Clear Filters</span>
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading movies...</p>
          </div>
        ) : (
          <>
            {/* Movies Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {movies.map(movie => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  onClick={() => onNavigateToMovie(movie.id)}
                  showWatchlistButton={auth.isAuthenticated}
                  onWatchlistToggle={handleWatchlistToggle}
                  isInWatchlist={watchlist.includes(movie.id)}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-300"
                >
                  Previous
                </button>
                <span className="px-4 py-2 bg-gray-100 rounded">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-300"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Movie Detail Component
const MovieDetailPage = ({ movieId, onBack }) => {
  const { auth } = useContext(AppContext);
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 0, reviewText: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    fetchMovie();
  }, [movieId]);

  const fetchMovie = async () => {
    try {
      setLoading(true);
      const data = await apiService.getMovie(movieId);
      setMovie(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!auth.isAuthenticated) return;

    try {
      setSubmittingReview(true);
      const newReview = await apiService.addReview(movieId, reviewForm, auth.token);
      
      // Update movie with new review
      setMovie(prev => ({
        ...prev,
        reviews: [...prev.reviews, newReview],
        averageRating: prev.reviews.length > 0 
          ? ((prev.averageRating * prev.reviews.length + reviewForm.rating) / (prev.reviews.length + 1))
          : reviewForm.rating
      }));
      
      setReviewForm({ rating: 0, reviewText: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) return <div className="text-center py-12">Loading movie details...</div>;
  if (error) return <div className="text-center py-12 text-red-600">Error: {error}</div>;
  if (!movie) return <div className="text-center py-12">Movie not found</div>;

  const userHasReviewed = auth.isAuthenticated && 
    movie.reviews.some(review => review.userId === auth.user.id);

  return (
    <div className="container mx-auto px-4 py-8">
      <button
        onClick={onBack}
        className="mb-6 flex items-center space-x-2 text-blue-600 hover:text-blue-800"
      >
        <span>← Back to Movies</span>
      </button>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="md:flex">
          <div className="md:w-1/3">
            <img 
              src={movie.posterUrl} 
              alt={movie.title}
              className="w-full h-96 md:h-full object-cover"
            />
          </div>
          
          <div className="md:w-2/3 p-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">{movie.title}</h1>
            
            <div className="flex items-center space-x-4 mb-4">
              <StarRating rating={movie.averageRating || 0} readOnly />
              <span className="text-lg font-semibold">{movie.averageRating || 0}/5</span>
              <span className="text-gray-600">({movie.reviews.length} reviews)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <p className="font-semibold text-gray-700">Release Year:</p>
                <p className="text-gray-600">{movie.releaseYear}</p>
              </div>
              <div>
                <p className="font-semibold text-gray-700">Director:</p>
                <p className="text-gray-600">{movie.director}</p>
              </div>
              <div>
                <p className="font-semibold text-gray-700">Genre:</p>
                <p className="text-gray-600">{movie.genre.join(', ')}</p>
              </div>
              <div>
                <p className="font-semibold text-gray-700">Cast:</p>
                <p className="text-gray-600">{movie.cast.join(', ')}</p>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-gray-700 mb-2">Synopsis</h3>
              <p className="text-gray-600 leading-relaxed">{movie.synopsis}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Review Section */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Reviews</h2>

        {/* Review Form */}
        {auth.isAuthenticated && !userHasReviewed && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Write a Review</h3>
            <form onSubmit={handleReviewSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rating
                </label>
                <StarRating
                  rating={reviewForm.rating}
                  onRatingChange={(rating) => setReviewForm(prev => ({ ...prev, rating }))}
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Review
                </label>
                <textarea
                  value={reviewForm.reviewText}
                  onChange={(e) => setReviewForm(prev => ({ ...prev, reviewText: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows="4"
                  placeholder="Share your thoughts about this movie..."
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={reviewForm.rating === 0 || submittingReview}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          </div>
        )}

        {/* Reviews List */}
        <div className="space-y-4">
          {movie.reviews.length === 0 ? (
            <p className="text-gray-600 text-center py-8">No reviews yet. Be the first to review this movie!</p>
          ) : (
            movie.reviews.map(review => (
              <div key={review.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <img
                      src={review.userProfilePicture}
                      alt={review.username}
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <p className="font-semibold text-gray-800">{review.username}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(review.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <StarRating rating={review.rating} readOnly size="w-4 h-4" />
                </div>
                <p className="text-gray-700 leading-relaxed">{review.reviewText}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// Auth Component
const AuthPage = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const endpoint = isLogin ? 'login' : 'register';
      const data = isLogin 
        ? { email: formData.email, password: formData.password }
        : formData;
      
      const result = await apiService[endpoint](data);
      onAuthSuccess(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <Film className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800">
            {isLogin ? 'Welcome Back' : 'Join MovieReviews'}
          </h2>
          <p className="text-gray-600 mt-2">
            {isLogin ? 'Sign in to your account' : 'Create your account'}
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
              minLength="6"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Loading...' : (isLogin ? 'Sign In' : 'Sign Up')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-600 hover:text-blue-800"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
};

// Profile Component
const ProfilePage = () => {
  const { auth } = useContext(AppContext);
  const [userProfile, setUserProfile] = useState(null);
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (auth.isAuthenticated) {
      fetchUserProfile();
      fetchWatchlist();
    }
  }, [auth.isAuthenticated]);

  const fetchUserProfile = async () => {
    try {
      const data = await apiService.request(`/users/${auth.user.id}`, {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      setUserProfile(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchWatchlist = async () => {
    try {
      const data = await apiService.getWatchlist(auth.user.id, auth.token);
      setWatchlist(data);
    } catch (err) {
      console.error('Error fetching watchlist:', err);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWatchlist = async (movieId) => {
    try {
      await apiService.removeFromWatchlist(auth.user.id, movieId, auth.token);
      setWatchlist(prev => prev.filter(item => item.movieId !== movieId));
    } catch (err) {
      setError(err.message);
    }
  };

  if (!auth.isAuthenticated) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Please log in to view your profile.</p>
      </div>
    );
  }

  if (loading) return <div className="text-center py-12">Loading profile...</div>;
  if (error) return <div className="text-center py-12 text-red-600">Error: {error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-8 mb-8">
        <div className="flex items-center space-x-6 mb-6">
          <img
            src={userProfile?.profilePicture || auth.user.profilePicture}
            alt={auth.user.username}
            className="w-24 h-24 rounded-full"
          />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{auth.user.username}</h1>
            <p className="text-gray-600">{auth.user.email}</p>
            <p className="text-sm text-gray-500">
              Member since {new Date(userProfile?.joinDate).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">
              {userProfile?.reviews?.length || 0}
            </p>
            <p className="text-gray-600">Reviews Written</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{watchlist.length}</p>
            <p className="text-gray-600">Watchlist Movies</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">
              {userProfile?.reviews?.length > 0 
                ? (userProfile.reviews.reduce((sum, r) => sum + r.rating, 0) / userProfile.reviews.length).toFixed(1)
                : '0.0'
              }
            </p>
            <p className="text-gray-600">Avg Rating Given</p>
          </div>
        </div>
      </div>

      {/* Recent Reviews */}
      <div className="bg-white rounded-lg shadow-md p-8 mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Your Recent Reviews</h2>
        {userProfile?.reviews?.length === 0 ? (
          <p className="text-gray-600 text-center py-4">You haven't written any reviews yet.</p>
        ) : (
          <div className="space-y-4">
            {userProfile?.reviews?.slice(0, 5).map(review => (
              <div key={review.id} className="border-l-4 border-blue-500 pl-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-800">{review.movieTitle}</h4>
                  <StarRating rating={review.rating} readOnly size="w-4 h-4" />
                </div>
                <p className="text-gray-600 text-sm mb-1">
                  {new Date(review.timestamp).toLocaleDateString()}
                </p>
                <p className="text-gray-700">{review.reviewText}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Watchlist */}
      <div className="bg-white rounded-lg shadow-md p-8">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Your Watchlist</h2>
        {watchlist.length === 0 ? (
          <p className="text-gray-600 text-center py-4">Your watchlist is empty.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {watchlist.map(item => (
              <div key={item.id} className="relative">
                <MovieCard movie={item.movie} />
                <button
                  onClick={() => removeFromWatchlist(item.movieId)}
                  className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Main App Component
const App = () => {
  const [auth