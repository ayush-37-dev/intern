// MongoDB Models using Mongoose
// Place this in backend/models/index.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/movie_review_db', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// User Schema
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  profilePicture: {
    type: String,
    default: function() {
      return `https://ui-avatars.com/api/?name=${this.username}&background=random`;
    }
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  joinDate: {
    type: Date,
    default: Date.now
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  averageRatingGiven: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Movie Schema
const movieSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 255
  },
  director: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  releaseYear: {
    type: Number,
    required: true,
    min: 1888, // First movie year
    max: new Date().getFullYear() + 10
  },
  genre: [{
    type: String,
    required: true,
    enum: [
      'Action', 'Adventure', 'Animation', 'Biography', 'Comedy', 'Crime',
      'Documentary', 'Drama', 'Family', 'Fantasy', 'Film-Noir', 'History',
      'Horror', 'Music', 'Musical', 'Mystery', 'Romance', 'Sci-Fi', 'Sport',
      'Thriller', 'War', 'Western'
    ]
  }],
  cast: [{
    name: {
      type: String,
      required: true
    },
    role: {
      type: String,
      default: 'Actor'
    },
    character: String
  }],
  synopsis: {
    type: String,
    maxlength: 2000
  },
  posterUrl: {
    type: String,
    default: function() {
      return `https://via.placeholder.com/300x450?text=${encodeURIComponent(this.title)}`;
    }
  },
  trailerUrl: String,
  duration: {
    type: Number, // in minutes
    min: 1,
    max: 1000
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  tmdbId: String, // For external API integration
  imdbId: String,
  budget: Number,
  revenue: Number,
  language: {
    type: String,
    default: 'English'
  },
  country: {
    type: String,
    default: 'USA'
  }
}, {
  timestamps: true
});

// Index for search functionality
movieSchema.index({
  title: 'text',
  director: 'text',
  'cast.name': 'text',
  synopsis: 'text'
});

// Additional indexes for performance
movieSchema.index({ releaseYear: -1 });
movieSchema.index({ averageRating: -1 });
movieSchema.index({ genre: 1 });
movieSchema.index