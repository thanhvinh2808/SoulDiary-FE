const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    username: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true,
      unique: true,
      validate: {
        validator: function (v) {
          return /^[a-z0-9_-]{3,30}$/.test(v);
        },
        message: "Username must be 3-30 characters, only lowercase letters, numbers, _, and -",
      },
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 160,
      default: null,
    },
    email: {
      type: String,
      sparse: true, // Allow multiple nulls but unique if present
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, "Email không hợp lệ"],
    },
    photo: {
      type: String,
      default: null,
    },
    profileImage: {
      type: String,
      default: null,
    },
    phone: {
      type: String,
      validate: {
        validator: function (v) {
          return /^\d{10}$/.test(v);
        },
        message: (props) =>
          `${props.value} không phải là số điện thoại hợp lệ!`,
      },
    },
    dateOfBirth: Date,

    password: {
      type: String,
      default: null,
      select: false,
    },

    address: {
      type: String,
      trim: true,
      default: null,
    },

    passwordChangedAt: Date,

    isVerified: {
      type: Boolean,
      default: false,
    },

    isUpdatePassword: {
      type: Boolean,
      default: true,
    },

    googleId: {
      type: String,
      select: false,
    },

    facebookId: {
      type: String,
      select: false,
    },

    refreshToken: {
      type: String,
      select: false,
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true },
);

// Hash password
userSchema.pre("save", async function () {
  if (!this.isModified("password") || !this.password) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Set passwordChangedAt
userSchema.pre("save", function () {
  if (!this.isModified("password") || this.isNew) return;
  this.passwordChangedAt = Date.now() - 1000;
});

// Social login → không yêu cầu update password
userSchema.pre("save", function () {
  if ((this.googleId || this.facebookId) && !this.password) {
    this.isUpdatePassword = false;
  }
});

userSchema.pre("save", function () {
  if (!this.name) this.name = `user-${Date.now()}`;
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword,
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changePasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

const User = mongoose.model("User", userSchema);
module.exports = User;
