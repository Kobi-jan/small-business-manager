const bcrypt = require('bcryptjs');
const db = require('../config/db');

// Registration
exports.registerBusiness = async (req, res) => {
    const { businessName, email, password, confirmPassword } = req.body;

    try {
        // Check if the email already exists 
        const userExists = await new Promise((resolve, reject) => {
            db.query('SELECT email FROM customers WHERE email = ? UNION SELECT email FROM businesses WHERE email = ?', [email, email], (err, results) => {
                if (err) return reject(err);  
                resolve(results.length > 0);  
            });
        });

        if (userExists) {
            return res.status(400).json({ message: 'Email already registered.' });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ message: 'Passwords do not match.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert business into the database
        const query = 'INSERT INTO businesses (business_name, email, password, isProfileComplete) VALUES (?, ?, ?, ?)';
        
        await new Promise((resolve, reject) => {
            db.query(query, [businessName, email, hashedPassword, false], (err) => {
                if (err) return reject(err);  
                resolve();  
            });
        });

        // Setting up the session 
        req.session.user = { email: email, businessName: businessName, isProfileComplete: false };

        return res.status(201).json({ message: `${businessName} registered successfully`, redirectUrl: '/owner/business-details' });
    } catch (err) {
        console.error('Error in registration:', err.message || err);
        console.error('Error in registration:', err);
        return res.status(500).json({ message: 'Server error' });
    }
};

exports.registerCustomer = async (req, res) => {
    const { firstName, lastName, email, password, confirmPassword } = req.body;
    

    try {
        // Check if the email already exists 
        const userExists = await new Promise((resolve, reject) => {
            db.query('SELECT email FROM customers WHERE email = ? UNION SELECT email FROM businesses WHERE email = ?', [email, email], (err, results) => {
                if (err) return reject(err);  
                resolve(results.length > 0);  
            });
        });

        if (userExists) {
            return res.status(400).json({ message: 'Email already registered.' });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ message: 'Passwords do not match.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert customer into the database
        const query = 'INSERT INTO customers (first_name, last_name, email, password) VALUES (?, ?, ?, ?)';
        
        await new Promise((resolve, reject) => {
            db.query(query, [firstName, lastName, email, hashedPassword], (err) => {
                if (err) return reject(err);  
                resolve();  
            });
        });

        // Setting up the session 
        req.session.user = { email: email, firstName: firstName };

        return res.status(201).json({ message: `${firstName} registered successfully`, redirectUrl: '/auth/login' });

    } catch (err) {
        console.error('Error in registration:', err);
        return res.status(500).json({ message: 'Server error' });
    }
};

// Login 
exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    try {
        const user = await new Promise((resolve, reject) => {
            db.query(
                `SELECT email, password, business_id AS id, 'business' AS role FROM businesses WHERE email = ? 
                 UNION 
                 SELECT email, password, customer_id AS id, 'customer' AS role FROM customers WHERE email = ?`,
                [email, email],
                (err, results) => {
                    if (err) return reject(err);
                    resolve(results[0]);
                }
            );
        });

        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        // Store user session
        req.session.user = { 
            email: user.email, 
            role: user.role,
            id: user.id, };
        req.session.isAuthenticated = true;

        // Redirect based on role
        if (user.role === 'business') {
            return res.status(200).json({ message: 'Login successful', redirectUrl: '/owner/dashboard' });
        } else if (user.role === 'customer') {
            return res.status(200).json({ message: 'Login successful', redirectUrl: '/customers/dashboard' });
        }

    } catch (err) {
        console.error('Error in login:', err);
        return res.status(500).json({ message: 'Server error' });
    }
};
