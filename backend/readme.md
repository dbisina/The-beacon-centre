// backend/README.md
# The Beacon Centre Backend API

A comprehensive REST API for The Beacon Centre mobile application and admin dashboard, built with Node.js, Express, TypeScript, and PostgreSQL.

## 🚀 Features

- **Complete Content Management**: Devotionals, Video/Audio Sermons, Announcements, Categories
- **Authentication System**: JWT-based admin authentication with refresh tokens
- **File Management**: Cloudinary integration for audio and image uploads
- **Analytics Tracking**: Anonymous user engagement and content performance metrics
- **Security**: Rate limiting, CORS, helmet security headers, input validation
- **Database**: PostgreSQL with Prisma ORM for type-safe database operations
- **TypeScript**: Full type safety throughout the application

## 📋 Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- Cloudinary account (for file storage)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd beacon-centre-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Database setup**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Run migrations
   npm run db:migrate
   
   # Seed with sample data
   npm run db:seed
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:5000`

## 🗃️ Database Configuration

### Using Neon (Recommended)
1. Create account at [neon.tech](https://neon.tech)
2. Create new project
3. Copy connection string to `DATABASE_URL` in `.env`

### Using Supabase
1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Get connection string from Settings > Database
4. Copy to `DATABASE_URL` in `.env`

### Local PostgreSQL
```bash
DATABASE_URL="postgresql://username:password@localhost:5432/beacon_centre_db"
```

## ☁️ Cloudinary Setup

1. Create account at [cloudinary.com](https://cloudinary.com)
2. Get credentials from Dashboard
3. Add to `.env`:
   ```
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   ```

## 📚 API Documentation

### Public Endpoints (Mobile App)

#### Devotionals
- `GET /api/devotionals` - List all devotionals
- `GET /api/devotionals/today` - Get today's devotional
- `GET /api/devotionals/date/:date` - Get devotional by date
- `GET /api/devotionals/:id` - Get specific devotional

#### Video Sermons
- `GET /api/video-sermons` - List all video sermons
- `GET /api/video-sermons/featured` - Get featured videos
- `GET /api/video-sermons/category/:categoryId` - Get by category
- `GET /api/video-sermons/:id` - Get specific video

#### Audio Sermons
- `GET /api/audio-sermons` - List all audio sermons
- `GET /api/audio-sermons/featured` - Get featured audio
- `GET /api/audio-sermons/category/:categoryId` - Get by category
- `GET /api/audio-sermons/:id` - Get specific audio

#### Announcements
- `GET /api/announcements` - List all announcements
- `GET /api/announcements/active` - Get active announcements
- `GET /api/announcements/:id` - Get specific announcement

#### Categories
- `GET /api/categories` - List all categories

#### Analytics
- `POST /api/analytics/track` - Track content interaction
- `POST /api/analytics/session` - Track app session

### Protected Endpoints (Admin Dashboard)

All admin endpoints require `Authorization: Bearer <token>` header.

#### Authentication
- `POST /api/admin/auth/login` - Admin login
- `POST /api/admin/auth/refresh` - Refresh access token
- `POST /api/admin/auth/logout` - Logout
- `GET /api/admin/auth/me` - Get profile

#### Content Management
- `POST /api/devotionals` - Create devotional
- `PUT /api/devotionals/:id` - Update devotional
- `DELETE /api/devotionals/:id` - Delete devotional
- `POST /api/devotionals/bulk` - Bulk create devotionals

Similar CRUD operations available for:
- `/api/video-sermons`
- `/api/audio-sermons`
- `/api/announcements`
- `/api/categories`

#### File Uploads
- `POST /api/upload/audio` - Upload audio file
- `POST /api/upload/image` - Upload image
- `POST /api/upload/thumbnail` - Upload thumbnail
- `DELETE /api/upload/:publicId` - Delete file

#### Analytics Dashboard
- `GET /api/analytics/dashboard` - Get analytics overview
- `GET /api/analytics/content-performance` - Content performance metrics
- `GET /api/analytics/user-engagement` - User engagement stats

## 🔧 Development Commands

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server

# Database
npm run db:generate     # Generate Prisma client
npm run db:migrate      # Run database migrations
npm run db:seed         # Seed database with sample data
npm run db:reset        # Reset database and reseed
npm run db:studio       # Open Prisma Studio

# Code Quality
npm run type-check      # TypeScript type checking
npm run lint            # Lint code
npm run lint:fix        # Fix linting issues
npm run test            # Run tests
npm run test:coverage   # Run tests with coverage
```

## 🔐 Default Admin Credentials

After seeding, you can login with:
- **Email**: admin@beaconcentre.org
- **Password**: admin123

⚠️ **Important**: Change these credentials in production!

## 🚀 Deployment

### Railway
1. Connect your GitHub repository
2. Add environment variables
3. Deploy automatically

### Render
1. Connect repository
2. Set build command: `npm run build`
3. Set start command: `npm start`
4. Add environment variables

### Vercel (API Routes)
1. Configure `vercel.json`
2. Deploy with `vercel --prod`

## 📊 Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Custom middleware
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── scripts/         # Database seeding
│   ├── types/           # TypeScript types
│   ├── utils/           # Utility functions
│   └── server.ts        # Main server file
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── migrations/      # Database migrations
├── .env.example         # Environment template
└── package.json
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email tech@beaconcentre.org or create an issue in the repository.