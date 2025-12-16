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

// ✅ Routes
import productRoutes from './routes/productRoutes.js';
import userRoutes from './routes/userRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import paymentRoutes from './routes/PaymentRoutes.js';

// ===============================
// ENV + DB
// ===============================
dotenv.config();
connectDB();

// ===============================
// FIX __dirname (MUST BE TOP)
// ===============================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ===============================
// MIDDLEWARES
// ===============================
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(compression());

// ===============================
// STATIC FOLDER (🔥 MOST IMPORTANT)
// ===============================
app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'))
);

// ===============================
// API ROUTES
// ===============================
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/payment', paymentRoutes);

// ===============================
// ROOT TEST
// ===============================
app.get('/', (req, res) => {
  res.send('✅ Secure API is running successfully...');
});

// ===============================
// ERROR HANDLERS
// ===============================
app.use(notFound);
app.use(errorHandler);

// ===============================
// SERVER
// ===============================
const HTTP_PORT = process.env.PORT || 5000;
const HTTPS_PORT = process.env.HTTPS_PORT || 443;

// ===============================
// SSL
// ===============================
let sslOptions = {};
try {
  sslOptions = {
    key: fs.readFileSync(process.env.SSL_KEY_PATH),
    cert: fs.readFileSync(process.env.SSL_CERT_PATH),
  };
  console.log('🔐 SSL loaded'.green.bold);
} catch {
  console.log('⚠️ SSL not found, HTTPS skipped'.yellow.bold);
}

// HTTP
app.listen(HTTP_PORT, () => {
  console.log(`🌍 HTTP running on port ${HTTP_PORT}`.cyan.bold);
});

// HTTPS
if (sslOptions.key && sslOptions.cert) {
  https.createServer(sslOptions, app).listen(HTTPS_PORT, () => {
    console.log(`🔒 HTTPS running on ${HTTPS_PORT}`.green.bold);
  });
}
