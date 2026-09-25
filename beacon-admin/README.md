// README.md - Complete setup instructions

# The Beacon Centre - Admin Dashboard

A comprehensive content management system for The Beacon Centre, built with Next.js 14, TypeScript, and Tailwind CSS.

## 🚀 Features

- **Content Management**: Manage devotionals, video sermons, audio sermons, and announcements
- **File Upload**: Cloudinary integration for audio and image uploads  
- **Analytics Dashboard**: Track user engagement and content performance
- **Categories**: Organize content with customizable categories
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Role-based Access**: Admin and super admin roles
- **Real-time Updates**: Live data with React Query
- **Type Safety**: Full TypeScript implementation

## 📋 Prerequisites

Before you begin, ensure you have:

- Node.js 18.0 or later
- npm or yarn package manager
- A running backend API (see backend setup)
- Cloudinary account for file storage

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/beacon-admin
cd beacon-admin
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Environment Configuration

Copy the environment template:

```bash
cp .env.example .env.local
```

Update `.env.local` with your configuration:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000/api

# Cloudinary Configuration
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
NEXT_PUBLIC_CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### 4. Start Development Server

```bash
npm run dev
# or
yarn dev
```

The admin dashboard will be available at `http://localhost:3000`

## 🗄️ Backend Setup

The admin dashboard requires the backend API to be running. Make sure you have:

1. **Backend Server**: Running on `http://localhost:5000`
2. **Database**: PostgreSQL with proper schema
3. **Default Admin**: Created with credentials for login

### First Login

Sign in with the admin account created by the backend seed. Its password is
whatever `ADMIN_SEED_PASSWORD` was set to when seeding — there is no default
password, because this repository is public. See `backend/readme.md`.

## 📁 Project Structure

```
src/
├── app/                    # Next.js 14 app directory
│   ├── dashboard/         # Dashboard pages
│   ├── login/            # Authentication pages
│   └── layout.tsx        # Root layout
├── components/           # Reusable components
│   ├── ui/              # shadcn/ui components
│   ├── forms/           # Form components
│   └── layout/          # Layout components
├── contexts/            # React contexts
├── lib/                # Utilities and configurations
│   ├── api.ts          # API client
│   ├── types.ts        # TypeScript types
│   └── utils.ts        # Utility functions
└── styles/             # Global styles
```

## 🎨 Key Components

### Dashboard Layout
- **Sidebar Navigation**: Easy access to all sections
- **Header**: Search, notifications, and user menu
- **Responsive**: Mobile-first design

### Content Management
- **Devotionals**: Rich text editor with Bible verse integration
- **Video Sermons**: YouTube URL import with metadata extraction
- **Audio Sermons**: File upload with progress tracking
- **Announcements**: Rich content with image support

### Analytics
- **User Metrics**: Track engagement and usage
- **Content Performance**: Most viewed content
- **Demographics**: Platform and location insights

## 🔧 Configuration

### Cloudinary Setup

1. Create a Cloudinary account
2. Get your cloud name and API credentials
3. Create upload presets:
   - `beacon_audio_preset` for audio files
   - `beacon_images_preset` for images

### API Integration

The dashboard connects to the backend API with these endpoints:

- **Authentication**: `/api/admin/auth/*`
- **Content**: `/api/devotionals`, `/api/video-sermons`, etc.
- **Uploads**: `/api/upload/*`
- **Analytics**: `/api/analytics/*`

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect Repository**: Link your GitHub repo to Vercel
2. **Environment Variables**: Add all environment variables
3. **Deploy**: Automatic deployment on push

### Manual Deployment

```bash
# Build the application
npm run build

# Start production server
npm run start
```

### Environment Variables for Production

```env
NEXT_PUBLIC_API_URL=https://your-api-domain.com/api
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
# ... other production variables
```

## 📱 Mobile Responsiveness

The dashboard is fully responsive and works on:

- **Desktop**: Full sidebar and multi-column layouts
- **Tablet**: Collapsible sidebar with optimized spacing
- **Mobile**: Bottom navigation and single-column layouts

## 🔐 Security Features

- **JWT Authentication**: Secure token-based auth
- **Role-based Access**: Different permissions for admin roles
- **CORS Protection**: Configured for your domain
- **Input Validation**: Client and server-side validation
- **File Upload Security**: Type and size restrictions

## 🛠️ Development Tools

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
```

### Code Quality

- **TypeScript**: Full type safety
- **ESLint**: Code linting and formatting
- **Tailwind CSS**: Utility-first styling
- **React Query**: Data fetching and caching

## 📊 Performance

- **Code Splitting**: Automatic route-based splitting
- **Image Optimization**: Next.js Image component
- **Caching**: React Query for data caching
- **Bundle Analysis**: Track bundle size

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:

- **Email**: support@beaconcentre.org
- **Documentation**: Check the inline comments
- **Issues**: Create a GitHub issue

## 🎯 Roadmap

- [ ] Advanced analytics with charts
- [ ] Bulk content operations
- [ ] Multi-language support
- [ ] Push notification management
- [ ] Advanced user roles
- [ ] Content scheduling
- [ ] API rate limiting dashboard
- [ ] Backup and restore functionality

---

**Built with ❤️ for The Beacon Centre's mission of "Raising Shining Lights"**