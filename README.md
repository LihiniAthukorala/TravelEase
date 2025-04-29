# Online Tourism and Travel Management System

A comprehensive web-based platform for managing tourism and travel operations, built with MERN stack (MongoDB, Express.js, React.js, Node.js).

## Features

### Admin Dashboard
- Real-time stock tracking and inventory management
- Supplier management system
- User management and role-based access control
- Tour package management
- Booking management
- Equipment management
- Automated reorder system for low stock items
- Email notifications for stock alerts

### Stock Management
- Real-time stock level monitoring
- Automated reorder configurations
- Low stock alerts and notifications
- Supplier integration
- Stock history tracking
- Inventory reports generation

### Supplier Management
- Supplier profile management
- Product catalog management
- Order processing
- Communication system
- Performance tracking

### User Management
- Role-based access control (Admin, Staff, Customer)
- User profile management
- Activity logging
- Security features

## Tech Stack

### Frontend
- React.js
- Tailwind CSS
- Axios for API calls
- React Router for navigation
- Context API for state management
- Material-UI components

### Backend
- Node.js
- Express.js
- MongoDB
- JWT for authentication
- Nodemailer for email notifications
- Multer for file uploads

## Installation

1. Clone the repository:
```bash
git clone [repository-url]
```

2. Install backend dependencies:
```bash
cd travel/backend
npm install
```

3. Install frontend dependencies:
```bash
cd ../frontend
npm install
```

4. Create a `.env` file in the backend directory with the following variables:
```
PORT=5001
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
EMAIL_USER=your_email
EMAIL_PASS=your_email_password
```

5. Start the backend server:
```bash
cd backend
npm start
```

6. Start the frontend development server:
```bash
cd frontend
npm start
```

## API Endpoints

### Authentication
- POST /api/auth/register - User registration
- POST /api/auth/login - User login
- GET /api/auth/me - Get current user

### Stock Management
- GET /api/stock - Get all stock items
- POST /api/stock - Add new stock item
- PUT /api/stock/:id - Update stock item
- DELETE /api/stock/:id - Delete stock item

### Supplier Management
- GET /api/suppliers - Get all suppliers
- POST /api/suppliers - Add new supplier
- PUT /api/suppliers/:id - Update supplier
- DELETE /api/suppliers/:id - Delete supplier

### Reorder Configuration
- POST /api/reorder-configs/create - Create reorder configuration
- GET /api/reorder-configs - Get all configurations
- PUT /api/reorder-configs/:id - Update configuration
- DELETE /api/reorder-configs/:id - Delete configuration

## Features in Detail

### Real-time Stock Tracking
- Monitor stock levels in real-time
- Set reorder thresholds
- Configure automatic reordering
- Receive low stock alerts
- Track stock history

### Supplier Integration
- Manage supplier profiles
- Track supplier performance
- Process orders
- Handle communications
- Manage product catalogs

### User Management
- Role-based access control
- User authentication
- Profile management
- Activity tracking
- Security features

