import path from 'path';
import express from 'express';
import dotenv from 'dotenv';
import colors from 'colors';
import morgan from 'morgan';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import fs from 'fs';
import https from 'https';
import { fileURLToPath } from 'url';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import connectDB from './config/db.js';

// ✅ Import Routes
import productRoutes from './routes/productRoutes.js';
import userRoutes from './routes/userRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import paymentRoutes from './routes/PaymentRoutes.js';

// ✅ Load .env variables
dotenv.config();

// ✅ Connect to MongoDB
connectDB();

const app = express();

// ✅ Middlewares
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(compression());

// ✅ Define Routes
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/payment', paymentRoutes);

// ✅ Fix __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Serve static uploads folder
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

// ✅ Default route for testing API
app.get('/', (req, res) => {
  res.send('✅ Secure API is running successfully...');
});

// ✅ Error Handlers
app.use(notFound);
app.use(errorHandler);

// ✅ Server Ports
const HTTP_PORT = process.env.PORT || 5001;
const HTTPS_PORT = process.env.HTTPS_PORT || 443;

// ✅ Read SSL Certificates (with safe fallback)
let sslOptions = {};
try {
  sslOptions = {
    key: fs.readFileSync(process.env.SSL_KEY_PATH),
    cert: fs.readFileSync(process.env.SSL_CERT_PATH),
  };
  console.log('🔐 SSL Certificates loaded successfully'.cyan.bold);
} catch (error) {
  console.warn('⚠️  SSL certificates not found or invalid. Running HTTPS may fail.'.yellow);
}

// ✅ Start HTTP Server
app.listen(HTTP_PORT, () => {
  console.log(`🌍 HTTP Server running on port ${HTTP_PORT}`.yellow.bold);
});

// ✅ Start HTTPS Server (only if certs are valid)
if (sslOptions.key && sslOptions.cert) {
  https.createServer(sslOptions, app).listen(HTTPS_PORT, () => {
    console.log(`🔒 HTTPS Server running on port ${HTTPS_PORT}`.green.bold);
  });
} else {
  console.warn('⚠️ HTTPS Server not started due to missing SSL certificates.'.red.bold);
}
