# EventGenie - Full-Stack Event Planning Platform

Welcome to **EventGenie**, a comprehensive full-stack application designed to streamline the event planning process. This platform connects customers with various service vendors, allowing them to browse, book, and manage services for their events seamlessly.

## 🚀 Live Demo

- **Frontend**: [Deploy your frontend URL here]
- **Backend API**: [Deploy your backend URL here]

## ✨ Key Features

### For Customers:
- **Service Discovery**: Browse a wide range of event services, including venues, catering, decor, and entertainment
- **Advanced Filtering**: Filter services by category, price, rating, date availability, and other criteria
- **Shopping Cart**: Add multiple services to a cart for a specific event date
- **Booking Management**: Book services, view past and upcoming bookings, and manage your event schedule
- **User Profiles**: Manage your profile, including contact information and profile photo
- **Reviews and Ratings**: Leave reviews and ratings for services you've used to help other users

### For Vendors:
- **Service Management**: Create, update, and delete service listings
- **Vendor Dashboard**: View all your listed services and manage your offerings
- **Booking Visibility**: See which dates your services are booked for
- **Booking Management**: Accept or reject booking requests

### For Administrators:
- **User Management**: Approve/reject vendor registrations
- **Service Moderation**: Monitor and manage service listings
- **System Overview**: View comprehensive statistics and reports

## 🛠️ Tech Stack

### Frontend (`eventgenie/`)
- **Framework**: React.js 19 with Vite
- **Routing**: React Router DOM v7
- **Styling**: Custom CSS with responsive design
- **UI Components**: React Toastify, React Multi Date Picker
- **Build Tool**: Vite 6

### Backend (`server/`)
- **Runtime**: Node.js with Express.js 5
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Custom JWT-based authentication
- **CORS**: Cross-origin resource sharing enabled
- **Environment**: Dotenv for configuration management

## 📁 Project Structure

```
eventgenie/
├── eventgenie/                 # React frontend application
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── config/            # API configuration
│   │   ├── styles/            # CSS files
│   │   └── main.jsx           # Entry point
│   ├── public/                # Static assets
│   ├── package.json           # Frontend dependencies
│   ├── vite.config.js         # Vite configuration
│   ├── vercel.json            # Vercel deployment config
│   └── netlify.toml           # Netlify deployment config
├── server/                    # Node.js backend server
│   ├── models/                # MongoDB schemas
│   ├── routes/                # API routes
│   ├── server.js              # Express server
│   ├── package.json           # Backend dependencies
│   └── vercel.json            # Vercel deployment config
├── DEPLOYMENT.md              # Detailed deployment guide
└── README.md                  # This file
```

## ⚙️ Quick Start

### Prerequisites
- Node.js >= 18.0.0
- npm >= 8.0.0
- MongoDB (local or MongoDB Atlas)

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd eventgenie
   ```

2. **Set up environment variables**
   ```bash
   # Backend
   cd server
   cp env.example .env
   # Edit .env with your MongoDB connection string
   
   # Frontend
   cd ../eventgenie
   cp env.example .env
   # Edit .env with your backend URL
   ```

3. **Install dependencies**
   ```bash
   # Backend
   cd server
   npm install
   
   # Frontend
   cd ../eventgenie
   npm install
   ```

4. **Start the application**
   ```bash
   # Backend (Terminal 1)
   cd server
   npm run dev
   
   # Frontend (Terminal 2)
   cd eventgenie
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5001

## 🚀 Deployment

### Quick Deployment (Vercel)

1. **Deploy Backend**:
   - Push code to GitHub
   - Import to Vercel (set root directory to `server`)
   - Add environment variables: `MONGO_URI`, `NODE_ENV`

2. **Deploy Frontend**:
   - Import to Vercel (set root directory to `eventgenie`)
   - Add environment variable: `VITE_API_BASE_URL`

### Other Deployment Options
- **Netlify**: See `netlify.toml` configuration
- **Heroku**: See `DEPLOYMENT.md` for detailed instructions
- **Manual**: See deployment guide for custom server setup

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## 💬 Stage 1 — Chat System

Backend Endpoints (base: http://localhost:5001)
- POST `/api/chats/start` { customerId, vendorId, serviceCategory }
- GET `/api/chats/customer/:customerId`
- GET `/api/chats/vendor/:vendorId`
- GET `/api/chats/admin/all`
- POST `/api/chats/:chatId/send` { senderModel, senderId, receiverModel, receiverId, content }

Frontend Usage
- Customer: My Bookings → “Chat with Vendor”
- Vendor: Vendor Dashboard → “Chats” tab
- Admin: Admin Portal → “Chats” tab (read-only)

Notes
- New chats auto-start with: "Hello there! How can we assist you today?"
- Help & Support is for ticketed issues; chat is for booking-specific messaging.

## ⚡ Stage 2 — Real-Time Chat (Socket.io)

Server
- Added Socket.io in `server/server.js` with CORS enabled
- Rooms per conversation: `joinConversation` with `{ chatId }`
- `sendMessage` persists to MongoDB and emits `receiveMessage` to room

Client
- Uses `socket.io-client` to connect to backend base URL
- CustomerChat: joins chat room after start/fetch; emits `sendMessage`, listens for `receiveMessage`
- VendorChat: joins active chat room; listens and updates active and list; quick toast hook supported
- AdminChatMonitor: read-only listener to all updates, reflects changes live

Integration Notes
- REST routes remain for initial start/fetch; WebSocket handles incremental updates
- Message schema unchanged; all messages persisted via server events

## 🔧 Configuration

### Environment Variables

#### Backend (server/.env)
```env
PORT=5001
MONGO_URI=mongodb://localhost:27017/eventgenie
NODE_ENV=development
```

#### Frontend (eventgenie/.env)
```env
VITE_API_BASE_URL=http://localhost:5001
VITE_APP_NAME=EventGenie
```

### API Configuration
The frontend uses a centralized API configuration system. All API endpoints are defined in `eventgenie/src/config/api.js` and automatically use the correct base URL based on environment variables.

## 🐛 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure backend CORS is properly configured
   - Check that frontend URL is allowed in backend CORS settings

2. **MongoDB Connection Issues**
   - Verify MongoDB is running
   - Check connection string in `.env` file
   - Ensure network access (for MongoDB Atlas)

3. **Environment Variables Not Loading**
   - Restart development server after adding `.env` files
   - Ensure variable names start with `VITE_` for frontend
   - Check file location and syntax

4. **Build Failures**
   - Clear `node_modules` and reinstall dependencies
   - Check Node.js version compatibility
   - Verify all required dependencies are installed

### Getting Help
1. Check the browser console for frontend errors
2. Check the terminal for backend errors
3. Verify environment variables are set correctly
4. Test API endpoints directly using tools like Postman

## 📊 API Documentation

### Main Endpoints
- `GET /api/services` - Get all services
- `POST /api/customers/register` - Customer registration
- `POST /api/vendors/register` - Vendor registration
- `GET /api/admin/vendors` - Get all vendors (admin)

For complete API documentation, check the route files in `server/routes/`.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License - see the LICENSE file for details.

## 🙏 Acknowledgments

- React.js team for the amazing framework
- Vite team for the fast build tool
- MongoDB team for the database
- All contributors and users of EventGenie

---

**EventGenie** - Making event planning magical! ✨ 