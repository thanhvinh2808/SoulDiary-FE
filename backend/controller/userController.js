const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const User = require("../models/userModel");

// ====== GET USER PROFILE ======
exports.getUserProfile = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  
  const user = await User.findById(userId);
  
  if (!user) {
    return next(new AppError("User not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      bio: user.bio,
      profileImage: user.profileImage || user.photo,
      phone: user.phone,
      address: user.address,
      dateOfBirth: user.dateOfBirth,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      entriesCount: user.entriesCount || 0,
    },
  });
});

// ====== UPDATE USER PROFILE ======
exports.updateUserProfile = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const { name, username, bio, phone, address, dateOfBirth, profileImage } = req.body;

  // Fields that can be updated
  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (username !== undefined) updateData.username = username;
  if (bio !== undefined) updateData.bio = bio;
  if (phone !== undefined) updateData.phone = phone;
  if (address !== undefined) updateData.address = address;
  if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth;
  if (profileImage !== undefined) updateData.profileImage = profileImage;

  // Note: Email and password cannot be updated via this endpoint
  if (req.body.email || req.body.password) {
    return next(new AppError("Cannot update email or password via this endpoint", 400));
  }

  const user = await User.findByIdAndUpdate(
    userId,
    updateData,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  res.status(200).json({
    status: "success",
    message: "Profile updated successfully",
    data: {
      id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      bio: user.bio,
      profileImage: user.profileImage || user.photo,
      phone: user.phone,
      address: user.address,
      dateOfBirth: user.dateOfBirth,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  });
});
