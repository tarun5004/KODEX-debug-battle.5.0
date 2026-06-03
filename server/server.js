const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');

// Dev note: Mongo crash me MONGO_URI undefined mila; .env ko DB connect se pehle load karna zaroori hai.
dotenv.config();
connectDB();

const app = express();
const port = process.env.PORT || 5000;
const localClientUrl = 'http://localhost:5173';
const allowedOrigins = [localClientUrl, process.env.CLIENT_URL, process.env.FRONTEND_URL]
  .filter((origin, index, origins) => origin && origins.indexOf(origin) === index);

// Dev note: pehle CORS sirf ek origin allow kar raha tha; ab local Vite aur deployed CLIENT_URL dono safely allow hote hain.
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/inventory', require('./routes/inventoryRoutes'));

app.get('/', (req, res) => {
  res.send('Server is running');
});

app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
