import express from 'express';
import bodyParser from 'body-parser';
import { fileURLToPath } from 'url';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import path from 'path';
import loginRoutes from './routes/login.js';
import inventoryRoutes from './routes/inventory.js';
import reportRoutes from './routes/report.js';
import userRoutes from './routes/user.js';
import connectDB from './db.js';
import { isAuthenticated } from './middleware/auth.js'; // Import the middleware

const app = express();
const PORT = 8080;

// Connect to MongoDB
connectDB();

// Middleware to parse JSON request bodies
app.use(express.json());
app.use(cookieParser());

app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

// Add bodyParser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Resolve directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDirectoryPath = path.join(__dirname, 'public');

// Debugging middleware to check session
app.use((req, res, next) => {
  console.log('Session:', req.session);
  next();
});

// Serve static files from the 'public' directory
app.use(express.static(publicDirectoryPath));

// Serve products page with authentication check
app.get('/products', isAuthenticated, (req, res) => {
    res.sendFile(path.join(publicDirectoryPath, '/products.html'));
});

// Authentication routes (no need to protect these)
app.use('/login', loginRoutes);
app.use('/session', loginRoutes);

// Protected routes
app.use('/reports', isAuthenticated, reportRoutes);
app.use('/inventory', isAuthenticated, inventoryRoutes);
app.use('/users', isAuthenticated, userRoutes);


// Start the server
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port: http://localhost:${PORT}`));
