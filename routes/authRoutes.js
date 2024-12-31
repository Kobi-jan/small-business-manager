const express = require('express');
const path = require('path');
const authController = require('../controllers/authController');
const router = express.Router();

// Registration pages
router.get('/registerBusiness', (req, res) => {
    const filePath = path.join(__dirname, '../views/auth/businessRegister.html');
    res.sendFile(filePath, (err) => {
        if (err) {
            console.error('Error sending register page:', err);
            res.status(err.status).end();
        }
    });
});

router.get('/registerCustomer', (req, res) => {
    const filePath = path.join(__dirname, '../views/auth/customerRegister.html');
    res.sendFile(filePath, (err) => {
        if (err) {
            console.error('Error sending register page:', err);
            res.status(err.status).end();
        }
    });
});

router.post('/registerBusiness', authController.registerBusiness); 
router.post('/registerCustomer', authController.registerCustomer); 

// Login page
router.get('/login', (req, res) => {
    const filePath = path.join(__dirname, '../views/auth/login.html');
    res.sendFile(filePath, (err) => {
        if (err) {
            console.error('Error sending login page:', err);
            res.status(err.status).end();
        }
    });
});

router.post('/login', authController.login); 

module.exports = router;