const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');

const isProduction = process.env.NODE_ENV === 'production';
// Dev note: Vercel frontend aur Render backend cross-site hote hain; production me SameSite=None refresh cookie ko allow karta hai.
const refreshCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'strict'
};

const requireAuthSecrets = () => {
  if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
    const error = new Error('JWT secrets are not configured on backend');
    error.statusCode = 500;
    throw error;
  }
};

// Generate Access Token (Short lived)
const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '15m',
  });
};

// Generate Refresh Token (Long lived)
const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: '7d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    res.status(400);
    throw new Error('Please include all fields');
  }

  // Dev note: JWT secret missing tha to user create ho raha tha but token nahi mil raha tha; pehle config validate karte hain.
  requireAuthSecrets();

  // Check if user already exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  // Create user (password hashing is handled by pre-save middleware in model)
  const user = await User.create({
    username,
    email,
    password,
  });

  if (user) {
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Set refresh token in HTTP-only cookie
    res.cookie('jwt', refreshToken, {
      ...refreshCookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      _id: user.id,
      username: user.username,
      email: user.email,
      // Dev note: password hash response me bhejna security leak tha; auth ke liye accessToken enough hai.
      accessToken,
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Dev note: token generate karne se pehle JWT env check karna zaroori hai, warna frontend ko fake success milta hai.
  requireAuthSecrets();

  const user = await User.findOne({ email });

  // Check user and password match using the model method
  if (user && (await user.matchPassword(password))) {
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Set refresh token in HTTP-only cookie
    res.cookie('jwt', refreshToken, {
      ...refreshCookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      _id: user.id,
      username: user.username,
      email: user.email,
      // Dev note: password hash response me bhejna security leak tha; auth ke liye accessToken enough hai.
      accessToken,
    });
  } else {
    res.status(401);
    throw new Error('Invalid credentials');
  }
});

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
const refresh = asyncHandler(async (req, res) => {
  const cookies = req.cookies;

  // Dev note: refresh bhi JWT secrets pe depend karta hai; missing env ko clear 500 error banana hai.
  requireAuthSecrets();

  if (!cookies?.jwt) {
    res.status(401);
    throw new Error('Unauthorized');
  }

  const refreshToken = cookies.jwt;

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    // Find user to ensure they still exist
    const user = await User.findById(decoded.id);
    if (!user) {
      res.status(401);
      throw new Error('Unauthorized');
    }

    const accessToken = generateAccessToken(user._id);

    res.json({ accessToken });
  } catch (error) {
    res.status(403);
    throw new Error('Forbidden - Invalid Refresh Token');
  }
});

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Public
const logoutUser = asyncHandler(async (req, res) => {
  const cookies = req.cookies;
  if (!cookies?.jwt) return res.sendStatus(204); // No content

  res.cookie('jwt', '', {
    ...refreshCookieOptions,
    expires: new Date(0),
  });
  
  res.status(200).json({ message: 'Logged out successfully' });
});

module.exports = {
  registerUser,
  loginUser,
  refresh,
  logoutUser,
};
