const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');

// @desc    Get user data
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (user) {
    res.status(200).json({
      id: user._id,
      username: user.username,
      email: user.email,
      // Dev note: profile API se password hash hata diya; browser ko sirf identity/profile data chahiye.
      profile: user.profile
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update user data
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  
  if (user) {
    const currentProfile = user.profile || {};
    user.profile = {
      skills: req.body.skills !== undefined ? req.body.skills : currentProfile.skills,
      post: req.body.post !== undefined ? req.body.post : currentProfile.post,
      roles: req.body.roles !== undefined ? req.body.roles : currentProfile.roles,
      address: req.body.address !== undefined ? req.body.address : currentProfile.address,
    };
    
    const updatedUser = await user.save();
    
    res.status(200).json({
      id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      // Dev note: update response me bhi password hash nahi bhejna; warna profile save ke baad leak wapas aa jata.
      profile: updatedUser.profile
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

module.exports = {
  getUserProfile,
  updateUserProfile,
};
