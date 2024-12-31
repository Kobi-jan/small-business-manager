const express = require('express');
const multer = require('multer');
const path = require('path');
const ownerController = require('../controllers/ownerController');
const checkProfileCompletion = require('../middleware/checkProfileCompletion');

const router = express.Router();

console.log('Owner routes are loaded');

// Configure multer for file uploads (this is done at the top for better clarity)
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'public/uploads/'),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        console.log('File being uploaded:', file);
        const fileTypes = /jpeg|jpg|png/;
        const extName = fileTypes.test(path.extname(file.originalname).toLowerCase());
        const mimeType = fileTypes.test(file.mimetype);

        if (extName && mimeType) {
            return cb(null, true);
        }
        console.log('File validation failed:', file);
        cb(new Error('Only image files with .jpeg, .jpg, or .png extensions are allowed.'));
    },
}).single('logo');

// Serve completion page
router.get('/business-details', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/business_owners/businessDetails.html'));
});

// Route for completing the profile setup (POST to /complete-profile)
router.post('/complete-profile', (req, res, next) => {
    // Handle file upload and profile completion
    upload(req, res, (err) => {
        if (err) {
            return res.status(400).json({ message: err.message });
        }
        // Proceed to the controller if no errors
        ownerController.completeProfile(req, res, next);
    });
});

// Route to serve the owner dashboard
router.get('/dashboard', checkProfileCompletion, (req, res) => {
    res.sendFile(path.join(__dirname, '../views/business_owners/ownerDashboard.html'));
});

// API route to check if the profile is complete
router.get('/api/profile-status', (req, res) => {
    if (req.session.user) {
        return res.json({ isProfileComplete: req.session.user.isProfileComplete });
    }
    res.status(401).json({ message: 'Unauthorized' });
});

// Route to get Business Overview details
router.get('/api/business-overview', ownerController.getBusinessOverview);


// Route to get reviews for the business
router.get('/api/reviews', (req, res) => {
    res.json({ message: 'Reviews endpoint is working!' });
});

// Route to serve appointments page
router.get('/appointments', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/business_owners/appointments.html'));
});

// Endpoint to get appointments
router.get('/api/get-appointments', ownerController.getAppointments);

// Route to handle canceling an appointment
router.post('/api/cancel-appointment/:appointmentId', ownerController.cancelAppointment);

// Route to reschedule an appointment
router.post('/api/reschedule-appointment', ownerController.rescheduleAppointment);

// Route to serve inventory page
router.get('/inventorymanagement', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/business_owners/inventory.html'));
});

// Get all products for the business
router.get('/api/get-products', ownerController.getProducts);

// Add a new product with image upload
router.post('/api/add-product', (req, res, next) => {
    // Handle file upload using multer
    upload(req, res, (err) => {
        if (err) {
            return res.status(400).json({ message: err.message });
        }

        // If no error, pass the request to the controller
        ownerController.addProduct(req, res, next);
    });
});


// // Update a product
// router.put('/api/products', ownerController.updateProduct);

// // Delete a product
// router.delete('/api/products/:product_id', ownerController.deleteProduct);

module.exports = router;
