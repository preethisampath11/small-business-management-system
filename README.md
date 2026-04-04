# Invotrack - Invoice & Order Management System

A full-stack invoice tracking application built with Node.js, Express, React, MongoDB, and styled with a dark theme for a professional invoicing experience.

## Project Structure

```
invoice-tracker/
├── server/          # Node.js + Express backend
│   ├── models/      # MongoDB models (User, Customer, Order)
│   ├── routes/      # API routes (auth, orders, customers)
│   ├── controllers/  # Route controllers
│   ├── middleware/   # Auth middleware
│   ├── utils/        # Utility functions
│   ├── index.js     # Entry point
│   ├── package.json
│   └── .env
├── client/          # React + Vite frontend
│   ├── src/
│   │   ├── components/    # Reusable components (Sidebar, ProtectedRoute)
│   │   ├── context/       # React Context (AuthContext)
│   │   ├── pages/         # Page components (Home, Login, Register, Dashboard, Orders, Customers)
│   │   ├── App.jsx        # Main app
│   │   └── main.jsx       # Entry point
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
└── README.md
```

## Getting Started

### Server Setup

1. Navigate to the server directory:

   ```bash
   cd server
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Configure the `.env` file with your settings:

   ```
   MONGO_URI=mongodb://localhost:27017/invotrack
   JWT_SECRET=your_jwt_secret_key_here
   PORT=5000
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

The server will run on `http://localhost:5000`

### Client Setup

1. Navigate to the client directory:

   ```bash
   cd client
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The client will run on `http://localhost:5173`

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Orders (Protected)

- `GET /api/orders` - Get all orders for logged-in seller
- `GET /api/orders/:id` - Get single order with customer details
- `POST /api/orders` - Create new order (auto-calculates total from items)
- `PATCH /api/orders/:id` - Update order status or payment status
- `DELETE /api/orders/:id` - Delete order

### Customers (Protected)

- `GET /api/customers` - Get all customers
- `GET /api/customers/:id` - Get single customer
- `POST /api/customers` - Create new customer
- `PATCH /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

## Features

### Authentication

- User registration with email and password
- Secure JWT-based login (7-day expiration)
- Password hashing with bcryptjs
- Protected routes with token verification

### Dashboard

- Dark-themed Invotrack interface (#111 background, #378ADD accent)
- Revenue overview and quick stats
- Order management with status tracking
- Customer management
- Payment status tracking (Unpaid, Partial, Paid)
- Order status tracking (Pending, Processing, Delivered)

### Order Management

- Create orders with multiple items
- Automatic total calculation
- Track payment and order status
- Assign orders to customers
- Add order notes and invoice numbers

### Customer Management

- Add and manage customer information
- Track customer contact details
- Store address and location information

## Tech Stack

**Backend:**

- Node.js
- Express.js
- MongoDB + Mongoose
- JWT for authentication
- bcryptjs for password hashing
- CORS for cross-origin requests

**Frontend:**

- React 18
- Vite (build tool)
- React Router v6
- Tailwind CSS
- Context API for state management

## Styling

The application uses a professional dark theme inspired by Invotrack:

- Background: `#111`
- Card surfaces: `#161616`
- Borders: `#222`
- Accent color: `#378ADD` (blue)
- Text: White and muted gray

## Database Models

### User

- name, email, password (hashed), businessName, createdAt

### Customer

- userId (ref: User), name, email, phone, address, city, state, zipCode, createdAt

### Order

- userId (ref: User), customerId (ref: Customer), items (array), totalAmount, orderStatus, paymentStatus, invoiceNumber, notes, createdAt

## Environment Variables

### Server (.env)

```
MONGO_URI=mongodb://localhost:27017/invotrack
JWT_SECRET=your_secure_jwt_secret_here
PORT=5000
```

## Development

### Server

- `npm start` - Run production server
- `npm run dev` - Run development server with nodemon

### Client

- `npm run dev` - Run Vite dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## License

ISC
