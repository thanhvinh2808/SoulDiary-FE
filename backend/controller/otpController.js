const catchAsync = require('../utils/catchAsync');

exports.verifyOtp = catchAsync(async (req, res, next) => {
    // Dummy implementation
    console.log('DUMMY: Verifying OTP for:', req.body.email);
    res.status(200).json({
        status: 'success',
        message: 'Xác thực OTP thành công (dummy response)'
    });
});

exports.resendOtp = catchAsync(async (req, res, next) => {
    // Dummy implementation
    console.log('DUMMY: Resending OTP to:', req.body.email);
    res.status(200).json({
        status: 'success',
        message: 'Mã OTP đã được gửi lại thành công (dummy response)'
    });
});
