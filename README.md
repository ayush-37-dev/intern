# intern
Full Stack Developer Assignment: Movie Review Platform
# Movie Review Platform

A full-stack web application for browsing movies, reading and writing reviews, and managing personal watchlists. Built with React frontend and Node.js/Express backend.

## 🎬 Features

### Core Features
- **Movie Browsing**: Search and filter movies by genre, year, rating, and title
- **Movie Details**: View comprehensive movie information including cast, synopsis, and reviews
- **User Reviews**: Rate movies (1-5 stars) and write detailed reviews
- **Watchlist Management**: Add/remove movies from personal watchlist
- **User Authentication**: Secure registration and login system
- **Responsive Design**: Works seamlessly on desktop and mobile devices

### Advanced Features
- **Featured Movies**: Curated selection of top-rated films
- **Search & Filter**: Advanced filtering options with real-time results
- **User Profiles**: View review history and statistics
- **Rating System**: Average ratings calculated from user reviews
- **Pagination**: Efficient loading of large movie collections

## 🛠 Tech Stack

### Frontend
- **React 18** with Hooks and Context API
- **Lucide React** for icons
- **Tailwind CSS** for styling
- **Responsive Design** for mobile compatibility

### Backend
- **Node.js** with Express.js
- **JWT** for authentication
- **bcryptjs** for password hashing
- **express-validator** for input validation
- **CORS** enabled for cross-origin requests

### Database
- **In-memory storage** (development)
- **PostgreSQL/MySQL/MongoDB** (production ready schemas provided)

## 📋 Prerequisites

Before running this application, make sure you have the following installed:
- **Node.js** (version 16.0 or higher)
- **npm** or **yarn**
- **Git**
- **Database** (PostgreSQL, MySQL, or MongoDB for production)

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/movie-review-platform.git
cd movie-review-platform
```

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env file with your configuration
# See Environment Variables section below

# Start the development server
npm run dev
```

### 3. Frontend Setup
```bash
# Navigate to frontend directory (in a new terminal)
cd frontend

# Install dependencies
npm install

# Start the React development server
npm start
```

### 4. Database Setup

#### For PostgreSQL:
```bash
# Create database
createdb movie_review_db

# Run the schema
psql movie_review_db < database/schema.sql
```

#### For MongoDB:
```bash
# Start MongoDB service
mongod

# The application will create collections automatically
```

## 🔧 Environment Variables

Create a `.env` file in the backend directory with the following variables:

```env
# Required
PORT=5000
JWT_SECRET=your_super_secret_jwt_key_here

# Database (choose one)
DATABASE_URL=postgresql://username:password@localhost:5432/movie_review_db
# OR
MONGODB_URI=mongodb://localhost:27017/movie_review_db

# Optional
TMDB_API_KEY=your_tmdb_api_key # For fetching movie data
NODE_ENV=development
```

## 📡 API Documentation

### Authentication Endpoints

#### Register User
```
POST /api/auth/register
Content-Type: application/json

{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

#### Login User
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "string",
  "password": "string"
}
```

### Movie Endpoints

#### Get All Movies
```
GET /api/movies?page=1&limit=10&search=&genre=&year=&sortBy=title
```

#### Get Movie by ID
```
GET /api/movies/:id
```

#### Add New Movie (Admin)
```
POST /api/movies
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "string",
  "genre": ["string"],
  "releaseYear": number,
  "director": "string",
  "cast": ["string"],
  "synopsis": "string",
  "posterUrl": "string"
}
```

### Review Endpoints

#### Get Movie Reviews
```
GET /api/movies/:id/reviews
```

#### Add Review
```
POST /api/movies/:id/reviews
Authorization: Bearer <token>
Content-Type: application/json

{
  "rating": number,
  "reviewText": "string"
}
```

### User & Watchlist Endpoints

#### Get User Profile
```
GET /api/users/:id
Authorization: Bearer <token>
```

#### Get User Watchlist
```
GET /api/users/:id/watchlist
Authorization: Bearer <token>
```

#### Add to Watchlist
```
POST /api/users/:id/watchlist
Authorization: Bearer <token>
Content-Type: application/json

{
  "movieId": number
}
```

#### Remove from Watchlist
```
DELETE /api/users/:id/watchlist/:movieId
Authorization: Bearer <token>
```

## 🏗 Project Structure

```
movie-review-platform/
├── backend/
│   ├── server.js              # Main server file
│   ├── package.json           # Backend dependencies
│   ├── .env                   # Environment variables
│   ├── middleware/            # Custom middleware
│   ├── routes/               # API routes
│   ├── models/               # Database models
│   └── utils/                # Utility functions
├── frontend/
│   ├── src/
│   │   ├── App.js            # Main React component
│   │   ├── components/       # Reusable components
│   │   ├── pages/            # Page components
│   │   ├── context/          # Context providers
│   │   └── services/         # API services
│   ├── public/               # Static files
│   └── package.json          # Frontend dependencies
├── database/
│   ├── schema.sql            # SQL database schema
│   └── seeds.sql             # Sample data
└── README.md
```

## 🚦 Running the Application

1. **Start the backend server:**
   ```bash
   cd backend
   npm run dev
   ```
   Server will run on `http://localhost:5000`

2. **Start the frontend application:**
   ```bash
   cd frontend
   npm start
   ```
   Application will open at `http://localhost:3000`

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test
```

### Frontend Testing
```bash
cd frontend
npm test
```

## 🔒 Security Features

- **Password Hashing**: Uses bcryptjs with 12 salt rounds
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Server-side validation using express-validator
- **CORS Protection**: Configured for specific origins
- **Rate Limiting**: Prevents API abuse
- **SQL Injection Protection**: Parameterized queries

## 🎨 UI/UX Features

- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Loading States**: Smooth loading indicators
- **Error Handling**: User-friendly error messages
- **Interactive Elements**: Hover effects and smooth transitions
- **Accessibility**: Semantic HTML and proper ARIA labels

## 🔄 State Management

The application uses React Context API for global state management:
- **AuthContext**: Manages user authentication state
- **Local State**: Component-level state for UI interactions
- **Session Storage**: Persists authentication across browser sessions

## 📊 Database Design Decisions

### Relational Structure
- **Normalized Design**: Separate tables for genres and cast members
- **Junction Tables**: Many-to-many relationships for movies-genres and movies-cast
- **Constraints**: Foreign keys and unique constraints for data integrity

### Performance Optimizations
- **Indexing**: Strategic indexes on frequently queried columns
- **Triggers**: Automatic average rating calculation
- **Pagination**: Efficient data loading with offset/limit

## 🚀 Deployment

### Backend Deployment (Heroku/Railway/DigitalOcean)
1. Set up your production database
2. Configure environment variables
3. Deploy using Git or Docker

### Frontend Deployment (Netlify/Vercel)
1. Build the React application: `npm run build`
2. Deploy the `build` folder
3. Configure API base URL for production

### Environment Variables for Production
```env
NODE_ENV=production
PORT=5000
DATABASE_URL=your_production_database_url
JWT_SECRET=your_production_jwt_secret
CORS_ORIGIN=https://your-frontend-domain.com
```

## 🔮 Future Enhancements

### Planned Features
- **Recommendation Engine**: AI-powered movie suggestions
- **Social Features**: Follow users and see their reviews
- **Advanced Search**: Filters by director, cast, IMDb rating
- **Movie Trailers**: Embedded video trailers
- **Admin Dashboard**: Content management system
- **Real-time Notifications**: WebSocket-based updates
- **Mobile App**: React Native version

### Technical Improvements
- **Caching**: Redis for improved performance
- **Image Upload**: Cloudinary integration for user avatars
- **Email Notifications**: Review notifications for watchlisted movies
- **Advanced Analytics**: User behavior tracking
- **API Documentation**: Swagger/OpenAPI documentation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -m 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🐛 Known Issues

- In-memory storage resets on server restart (use persistent database for production)
- No image upload functionality (placeholder images used)
- Limited error boundary implementation in React

## 📞 Support

For support, email support@moviereviews.com or create an issue in the GitHub repository.

## 🙏 Acknowledgments

- Movie data structure inspired by IMDb and TMDB
- UI design patterns from modern web applications
- React best practices from the React community
