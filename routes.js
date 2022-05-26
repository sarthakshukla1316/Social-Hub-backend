const router = require('express').Router();

const authController = require('./controllers/auth-controller');
const activateController = require('./controllers/activate-controller');
const { authMiddleware } = require('./middlewares/auth-middlewares');
const roomsController = require('./controllers/rooms-controller');


// Authentication
router.post('/api/send-otp', authController.sendOtp);
router.post('/api/send-otp-email', authController.sendOtpEmail);

router.post('/api/verify-otp', authController.verifyOtp);
router.post('/api/verify-otp-email', authController.verifyOtpEmail);

// Activation
router.post('/api/activate', authMiddleware, activateController.activate);

// Refresh token
router.get('/api/refresh', authController.refresh);

// logout user
router.post('/api/logout', authMiddleware, authController.logout);

// create room
router.post('/api/rooms', authMiddleware, roomsController.create);
router.get('/api/rooms/delete/:roomId', authMiddleware, roomsController.delete);

// Fetch rooms
router.get('/api/rooms', authMiddleware, roomsController.index);
router.get('/api/rooms/:roomId', authMiddleware, roomsController.show);


module.exports = router;