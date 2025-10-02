# WeRepair

A full-stack web application for managing gaming peripheral repair services. WeRepair provides an efficient platform for users to submit repair requests and for administrators to manage the repair process.

## 🎮 Features

### Core Functionality
- **User Authentication & Authorization**
  - User registration and login
  - Role-based access control (User/Admin)
  - Secure password handling with JWT tokens

- **Repair Request System**
  - Submit repair requests for gaming peripherals:
    - Mouse repair (clicking issues, sensor problems)
    - Keyboard repair (sticky keys, LED issues, connectivity)
    - Headphone repair (audio issues, broken cables)
    - Controller repair (drift issues, button problems)
  - Image upload for device issues
  - Detailed issue description
  - Delivery method selection (pickup/drop-off)
  - Address management for pickup/delivery

- **Dashboard Management**
  - **User Dashboard**: View repair requests, track status, edit/cancel pending requests
  - **Admin Dashboard**: Manage all requests, update status, provide quotes, reject requests
  - Real-time status tracking (Pending, In Repair, Repaired, Delivered)
  - Advanced filtering by device type and status

- **Quote System**
  - Admin-generated repair quotes with cost estimates
  - Quote acceptance/rejection by users
  - Detailed repair notes and time estimates

- **Modern UI/UX**
  - Responsive design with mobile support
  - Smooth animations using Framer Motion
  - Interactive components and modern styling
  - Toast notifications for user feedback

## 🛠️ Technology Stack

### Frontend
- **React 19** - Modern React with latest features
- **React Router DOM** - Client-side routing
- **Framer Motion** - Smooth animations and transitions
- **React Hot Toast** - User notification system
- **Axios** - HTTP client for API requests
- **Font Awesome** - Icon library
- **CSS3** - Custom styling with modern features

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - JSON Web Tokens for authentication
- **bcryptjs** - Password hashing
- **Multer** - File upload handling
- **Express Validator** - Input validation

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- MongoDB (local installation or MongoDB Atlas)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd WeRepair
   ```

2. **Install server dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install client dependencies**
   ```bash
   cd ../client
   npm install
   ```

4. **Environment Setup**
   Create a `.env` file in the server directory:
   ```env
   MONGODB_URI=mongodb://localhost:27017/werepair
   JWT_SECRET=your_jwt_secret_here
   PORT=5000
   ```

5. **Start the application**

   **Terminal 1 - Backend Server:**
   ```bash
   cd server
   npm run dev  # Development mode with auto-restart
   ```

   **Terminal 2 - Frontend Client:**
   ```bash
   cd client
   npm start
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 📱 Usage

### For Users
1. **Register/Login** - Create an account or sign in
2. **Submit Repair Request** - Fill out the repair form with device details
3. **Track Status** - Monitor your repair progress in the dashboard
4. **Review Quotes** - Accept or reject repair quotes from admins
5. **Manage Requests** - Edit or cancel pending requests

### For Administrators
1. **Access Admin Dashboard** - Login with admin credentials
2. **Review Requests** - View all incoming repair requests
3. **Provide Quotes** - Generate detailed repair estimates
4. **Update Status** - Track repair progress through different stages
5. **Manage Users** - View and manage user accounts

## 🏗️ Project Structure

```
WeRepair/
├── client/                 # React frontend
│   ├── public/            # Static assets
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── context/       # React context (Auth)
│   │   └── assets/        # Images and assets
│   └── package.json
├── server/                # Node.js backend
│   ├── middleware/        # Express middleware
│   ├── models/           # MongoDB models
│   ├── routes/           # API routes
│   ├── uploads/          # File upload directory
│   └── package.json
└── README.md
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Repair Requests
- `POST /api/repairs` - Submit repair request
- `GET /api/repairs` - Get repair requests
- `PUT /api/repairs/:id` - Update repair request
- `DELETE /api/repairs/:id` - Cancel repair request

### Quotes
- `POST /api/quotes` - Create repair quote
- `PUT /api/quotes/:id/accept` - Accept quote
- `PUT /api/quotes/:id/reject` - Reject quote

### Users (Admin only)
- `GET /api/users` - Get all users
- `PUT /api/users/:id` - Update user

## 🎨 Features in Detail

### Device Types Supported
- **Mouse**: Clicking issues, sensor problems, connectivity
- **Keyboard**: Sticky keys, LED issues, connectivity problems
- **Headphones**: Audio issues, broken cables, connection problems
- **Controllers**: Drift issues, button problems, connectivity

### Delivery Options
- **Drop-off**: Users can drop off devices at physical locations
- **Pickup**: Arranged pickup with address details

### Status Tracking
- **Pending**: Request submitted, awaiting admin review
- **In Repair**: Device is being repaired
- **Repaired**: Repair completed
- **Delivered**: Device returned to user

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Input validation and sanitization
- Protected routes with role-based access
- Secure file upload handling

## 🚀 Development

### Available Scripts

**Client:**
```bash
npm start      # Start development server
npm run build  # Build for production
npm test       # Run tests
```

**Server:**
```bash
npm start      # Start production server
npm run dev    # Start development server with nodemon
```

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 Notes

- The application uses MongoDB for data persistence
- File uploads are handled securely with validation
- The UI is fully responsive and mobile-friendly
- Real-time updates are provided through API polling
- Error handling is implemented throughout the application

## 🤝 Support

For support or questions about the WeRepair application, please refer to the project documentation or create an issue in the repository.

---

**WeRepair** - Professional repair services for your gaming peripherals. Fast, reliable, and affordable.