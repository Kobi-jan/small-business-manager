const express = require('express');
const path = require('path');
const multer = require('multer');
const ownerController = require('../controllers/ownerController');
const checkProfileCompletion = require('../middleware/checkProfileCompletion');

const router = express.Router();

console.log('Owner routes are loaded');

// Configure multer for file uploads 
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

// Completing the profile 
router.post('/complete-profile', (req, res, next) => {
    upload(req, res, (err) => {
        if (err) {
            return res.status(400).json({ message: err.message });
        }
        ownerController.completeProfile(req, res, next);
    });
});

// Get the dashboard page
router.get('/dashboard', checkProfileCompletion, (req, res) => {
    res.sendFile(path.join(__dirname, '../views/business_owners/ownerDashboard.html'));
});

// Check if the profile is complete
router.get('/api/profile-status', (req, res) => {
    if (req.session.user) {
        return res.json({ isProfileComplete: req.session.user.isProfileComplete });
    }
    res.status(401).json({ message: 'Unauthorized' });
});

// Get Business overview details
router.get('/api/business-overview', ownerController.getBusinessOverview);


// Get reviews for the business
router.get('/api/reviews', ownerController.getReviews);

// Serve appointments page
router.get('/appointments', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/business_owners/appointments.html'));
});

// Get appointments
router.get('/api/get-appointments', ownerController.getAppointments);

// Canceling an appointment
router.post('/api/cancel-appointment/:appointmentId', ownerController.cancelAppointment);

// Confirm an appointment
router.post('/api/confirm-appointment/:appointmentId', ownerController.confirmAppointment);

// Complete an appointment
router.post('/api/complete-appointment/:appointmentId', ownerController.completeAppointment);

// Serve inventory page
router.get('/inventorymanagement', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/business_owners/inventory.html'));
});

// Get all products for the business
router.get('/api/get-products', ownerController.getProducts);

// Add a new product with image upload
router.post('/api/add-product', (req, res, next) => {
    upload(req, res, (err) => {
        if (err) {
            return res.status(400).json({ message: err.message });
        }
        ownerController.addProduct(req, res, next);
    });
});

// Update a product description
router.put('/api/update-product-description/:product_id', ownerController.updateProductDescription);

// Update a product price
router.put('/api/update-product-price/:product_id', ownerController.updateProductPrice);

// Add quantity to a product
router.put('/api/update-quantity/:product_id', ownerController.addQuantityInStock);

// Delete a product
router.delete('/api/products/:product_id', ownerController.deleteProduct);

// Serve the sales report page
router.get('/sales-and-reports', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/business_owners/sales.html'));
});

// Get sales overview data
router.get('/api/sales-overview', ownerController.getTotalSales);

// Get sales by product
router.get('/api/sales-by-product', ownerController.getSalesByProduct);

// Get graphs
router.get('/api/sales-graphs', ownerController.getSalesGraphData);

// Sales transactions
router.get('/api/sales-transactions', ownerController.getSalesTransactions);





// Route to serve messages page
router.get('/messages', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/business_owners/messages.html'));
});

router.get('/api/messages/conversations', ownerController.getConversations);

// Route to get messages for a specific business (customerId is extracted from session)
router.get("/api/messages/:customerId", ownerController.getMessages);

// Route to send a message from the customer to a business
router.post("/api/messages/send", ownerController.sendMessage);

module.exports = router;
