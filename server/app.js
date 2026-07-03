const express = require("express");
const path = require('path');
// Load env from server/.env then fallback to project root .env
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const bcrypt = require('bcryptjs');
const fileUpload = require("express-fileupload");
const productsRouter = require("./routes/products");
const productImagesRouter = require("./routes/productImages");
const categoryRouter = require("./routes/category");
const searchRouter = require("./routes/search");
const mainImageRouter = require("./routes/mainImages");
const userRouter = require("./routes/users");
const orderRouter = require("./routes/customer_orders");
const slugRouter = require("./routes/slugs");
const orderProductRouter = require('./routes/customer_order_product');
// const wishlistRouter = require('./routes/wishlist');
const notificationsRouter = require('./routes/notifications');
const merchantRouter = require('./routes/merchant'); // Add this line
const bulkUploadRouter = require('./routes/bulkUpload');
const heroSlidesRouter = require("./routes/heroSlides");
const orderStatusesRouter = require("./routes/orderStatuses");
const dashboardMetricsRouter = require("./routes/dashboardMetrics");
const cartEventsRouter = require("./routes/cartEvents");
const featuredBrandsRouter = require("./routes/featuredBrands");
const dealsRouter = require("./routes/deals");
const productBannersRouter = require("./routes/productBanners");
const reportsRouter = require("./routes/reports");
const deliveryZonesRouter = require("./routes/deliveryZones");
const prisma = require("./utills/db");
var cors = require("cors");

// Import logging middleware
const { 
  addRequestId, 
  requestLogger, 
  errorLogger, 
  securityLogger 
} = require('./middleware/requestLogger');

// Import rate limiting middleware
const {
  generalLimiter,
  authLimiter,
  registerLimiter,
  userManagementLimiter,
  uploadLimiter,
  searchLimiter,
  orderLimiter
} = require('./middleware/rateLimiter');


const {
  handleServerError
} = require('./utills/errorHandler');

const app = express();

const normalizeOrigin = (value) => {
  if (!value || typeof value !== "string") return "";
  return value.trim().replace(/\/+$/, "");
};

const getHostname = (value) => {
  try {
    return new URL(value).hostname;
  } catch {
    return "";
  }
};

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Add request ID to all requests
app.use(addRequestId);

// Security logging (check for suspicious patterns)
app.use(securityLogger);

// Standard request logging
app.use(requestLogger);

// Error logging (only logs 4xx and 5xx responses)
app.use(errorLogger);

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.NEXTAUTH_URL,
  process.env.FRONTEND_URL,
]
  .map(normalizeOrigin)
  .filter(Boolean); // Remove undefined values

const createCorsOptions = (req) => ({
  origin(origin, callback) {
    const normalizedOrigin = normalizeOrigin(origin);

    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }

    const requestHost = normalizeOrigin(`${req.protocol}://${req.get("host") || ""}`);
    if (
      process.env.NODE_ENV === "production" &&
      getHostname(normalizedOrigin) &&
      getHostname(normalizedOrigin) === getHostname(requestHost)
    ) {
      return callback(null, true);
    }
    

    if (process.env.NODE_ENV === 'development' && normalizedOrigin.startsWith('http://localhost:')) {
      return callback(null, true);
    }
    
    // Reject other origins
    const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
    return callback(new Error(msg), false);
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true, // Allow cookies and authorization headers
});

const corsOptionsDelegate = (req, callback) => {
  callback(null, createCorsOptions(req));
};

// Apply general rate limiting to all routes
app.use(generalLimiter);

app.use(express.json());
app.use(cors(corsOptionsDelegate));
app.options("*", cors(corsOptionsDelegate));
app.use(fileUpload());
app.use(
  "/uploads",
  express.static(path.join(__dirname, "..", "public", "uploads"), {
    fallthrough: false,
    maxAge: process.env.NODE_ENV === "production" ? "30d" : 0,
  })
);

// Apply specific rate limiters to different route groups
app.use("/api/users", userManagementLimiter);
app.use("/api/search", searchLimiter);
app.use("/api/orders", orderLimiter);
app.use("/api/order-product", orderLimiter);
app.use("/api/images", uploadLimiter);
app.use("/api/main-image", uploadLimiter);
// app.use("/api/wishlist", wishlistLimiter);
// app.use("/api/products", productLimiter);
// app.use("/api/merchants", productLimiter);
app.use("/api/bulk-upload", uploadLimiter);
app.use("/api/hero-slides", uploadLimiter);
app.use("/api/cart-events", orderLimiter);
app.use("/api/deals", orderLimiter);
app.use("/api/product-banners", uploadLimiter);
app.use("/api/reports", orderLimiter);

// Apply stricter rate limiting to authentication-related routes
app.use("/api/users/email", authLimiter); // For login attempts via email lookup 

// Apply admin rate limiting to admin routes


app.use("/api/products", productsRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/images", productImagesRouter);
app.use("/api/main-image", mainImageRouter);
app.use("/api/users", userRouter);
app.use("/api/search", searchRouter);
app.use("/api/orders", orderRouter);
app.use('/api/order-product', orderProductRouter);
app.use("/api/slugs", slugRouter);
// app.use("/api/wishlist", wishlistRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/merchants", merchantRouter); 
app.use("/api/bulk-upload", bulkUploadRouter);
app.use("/api/hero-slides", heroSlidesRouter);
app.use("/api/order-statuses", orderStatusesRouter);
app.use("/api/dashboard-metrics", dashboardMetricsRouter);
app.use("/api/cart-events", cartEventsRouter);
app.use("/api/featured-brands", featuredBrandsRouter);
app.use("/api/deals", dealsRouter);
app.use("/api/product-banners", productBannersRouter);
app.use("/api/reports", reportsRouter);
app.use("/api/delivery-zones", deliveryZonesRouter);

// Health check endpoint (no rate limiting)
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    rateLimiting: 'enabled',
    requestId: req.reqId
  });
});

app.get('/health/db', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: 'OK',
      database: 'connected',
      timestamp: new Date().toISOString(),
      requestId: req.reqId
    });
  } catch (error) {
    console.error('Database health check failed:', error);
    res.status(503).json({
      status: 'ERROR',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString(),
      requestId: req.reqId
    });
  }
});

// Rate limit info endpoint
app.get('/rate-limit-info', (req, res) => {
  res.status(200).json({
    general: '100 requests per 15 minutes',
    auth: '5 login attempts per 15 minutes',
    register: '3 registrations per hour',
    upload: '10 uploads per 15 minutes',
    search: '30 searches per minute',
    orders: '15 order operations per 15 minutes',
    wishlist: '20 operations per 5 minutes',
    products: '60 requests per minute',
    requestId: req.reqId
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    requestId: req.reqId
  });
});

// Global error handler
app.use((err, req, res, next) => {
  handleServerError(err, res, `${req.method} ${req.path}`);
});

const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Rate limiting and request logging enabled for all endpoints');
  console.log('Logs are being written to server/logs/ directory');
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use. Stop the old backend process or set a different PORT.`);
    console.error(`On Windows, run: netstat -ano | findstr :${PORT}`);
    console.error("Then stop the listed PID with: taskkill /PID <PID> /T /F");
    process.exit(1);
  }

  throw error;
});
