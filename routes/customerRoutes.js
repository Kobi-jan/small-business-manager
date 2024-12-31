const express = require('express');
const multer = require('multer');
const path = require('path');
const customerController = require('../controllers/customerController');

const router = express.Router();

//Route to serve dashboard
router.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/customers/customerDashboard.html'));
});

// Business search route
router.get('/search', customerController.searchBusinesses);

// Route to get featured businesses
router.get('/featured', customerController.getFeaturedBusinesses);

// Route to view a business profile
router.get('/business/:business_id', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/customers/businessProfile.html'));
});

// Route to get business profile data
router.get('/api/business/:business_id', customerController.viewBusinessProfile);

// Route for scheduling appointments
router.post('/api/appointments/:business_id', customerController.scheduleAppointment);

// Route to post a new review
router.post('/api/leaveReview/:business_id', customerController.leaveReview);

// Route to serve appointments page
router.get('/viewAppointments', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/customers/appointments.html'));
});

// Endpoint to get appointments
router.get('/api/get-appointments', customerController.getAppointments);

// Route to handle canceling an appointment
router.post('/api/cancel-appointment/:appointmentId', customerController.cancelAppointment);

// Route to reschedule an appointment
router.post('/api/reschedule-appointment', customerController.rescheduleAppointment);

// Route to serve appointments page
router.get('/reviews', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/customers/reviewHistory.html'));
});

// Get reviews for a customer
router.get('/api/reviews', customerController.getReviews);

// Route to serve appointments page
router.get('/store', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/customers/online-store/homePage.html'));
});

// Get list of products for the online store
router.get('/products', customerController.getProducts);

// Route to serve cart page
router.get('/cart', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/customers/online-store/cart.html'));
});

// Add an item to the cart
router.post('/cart/add', customerController.addToCart);

// View the cart
router.get('/cart', customerController.viewCart);

// Remove an item from the cart
router.delete('/cart/remove', customerController.removeFromCart);

// Update the quantity of an item in the cart
router.put('/cart/update', customerController.updateCart);


module.exports = router;