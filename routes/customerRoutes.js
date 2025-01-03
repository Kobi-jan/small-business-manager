const express = require('express');
const path = require('path');
const multer = require('multer');
const customerController = require('../controllers/customerController');
const router = express.Router();

// Dashboard page
router.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/customers/customerDashboard.html'));
});

// Business search route
router.get('/search', customerController.searchBusinesses);

// Get featured businesses
router.get('/featured', customerController.getFeaturedBusinesses);

// View a business profile page
router.get('/business/:business_id', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/customers/businessProfile.html'));
});

// Get business profile data
router.get('/api/business/:business_id', customerController.viewBusinessProfile);

// Scheduling appointments
router.post('/api/appointments/:business_id', customerController.scheduleAppointment);

// Post a new review
router.post('/api/leaveReview/:business_id', customerController.leaveReview);

// Serve appointments page
router.get('/viewAppointments', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/customers/appointments.html'));
});

// Endpoint to get appointments
router.get('/api/get-appointments', customerController.getAppointments);

// Canceling an appointment
router.post('/api/cancel-appointment/:appointmentId', customerController.cancelAppointment);

// Reschedule an appointment
router.post('/api/reschedule-appointment/:appointmentId', customerController.rescheduleAppointment);

// Serve appointments page
router.get('/reviews', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/customers/reviewHistory.html'));
});

// Get reviews for a customer
router.get('/api/reviews', customerController.getReviews);

// Serve appointments page
router.get('/store', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/customers/online-store/homePage.html'));
});

// Get list of products for the online store
router.get('/products', customerController.getProducts);

// Serve cart page
router.get('/cart', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/customers/online-store/cart.html'));
});

// Add an item to the cart
router.post('/cart/add', customerController.addToCart);

// View the cart
router.get('/api/cart', customerController.viewCart);

// Remove an item from the cart
router.delete('/cart/remove', customerController.removeFromCart);

// Update the quantity of an item in the cart
router.put('/cart/update', customerController.updateCart);

// Handle checkout 
router.post('/checkout', customerController.checkout);  // Simulate checkout

// Get order history page
router.get('/order-history', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/customers/orderHistory.html'));
});

// Get order history
router.get('/api/order-history', customerController.getOrderHistory);

// Get order items for a given order ID
router.get('/api/order-items/:orderId', customerController.getOrderItems);

// Sending a message
router.post('/api/sendMessage/:business_id', customerController.sendMessage);


// Serve messages page
router.get('/messages', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/customers/messages.html'));
});

// Get conversations 
router.get('/api/messages/conversations', customerController.getConversations);

// Get messages for a specific business 
router.get("/api/messages/:businessId", customerController.getMessages);

// Send a message from the customer to a business
router.post("/api/messages/send", customerController.sendMessage2);

module.exports = router;