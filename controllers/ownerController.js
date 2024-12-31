const db = require('../config/db');

// Complete the business profile
exports.completeProfile = async (req, res) => {
    const { description, location, openingTime, closingTime } = req.body;
    const logo = req.file ? `/uploads/${req.file.filename}` : null;

    console.log('Request Body:', req.body);
    console.log('Uploaded File:', req.file);
    console.log('Session User:', req.session.user);

    try {
        // Validate required fields
        if (!description || !location || !openingTime || !closingTime) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        // Ensure a logo is provided
        if (!logo) {
            return res.status(400).json({ message: 'Logo image is required.' });
        }

        // Check for valid session
        if (!req.session.user || !req.session.user.email) {
            return res.status(401).json({ message: 'User not authenticated or session expired.' });
        }

        // Update business profile in the database
        const query = `
            UPDATE businesses 
            SET business_description = ?, 
                location = ?, 
                opening_time = ?, 
                closing_time = ?, 
                logo_image_url = ?, 
                isProfileComplete = ? 
            WHERE email = ?`;

        const params = [
            description,
            location,
            openingTime,
            closingTime,
            logo,
            true,
            req.session.user.email,
        ];

        console.log('Query:', query);
        console.log('Params:', params);
        

        await new Promise((resolve, reject) => {
            db.query(query, params, (err, result) => {
                if (err) {
                    console.error('Database Query Error:', err);
                    return reject(err);
                }
                console.log('Query Result:', result);
                if (result.affectedRows === 0) {
                    return reject(new Error('No rows were updated. Check the email or database entry.'));
                }
                resolve();
            });
        });

        req.session.user.isProfileComplete = true;

        req.session.save((err) => {
            if (err) {
                console.error('Error saving session:', err);
            }
        });

        res.status(200).json({ success: true, message: 'Profile updated successfully!' });

    } catch (err) {
        console.error('Error updating profile:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

exports.getBusinessOverview = async (req, res) => {
    try {
        console.log('User email from session:', req.session.user.email); 
        console.log('Session User Id:', req.session.user.id);// Debugging session email

        const businessData = await new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    b.business_name, 
                    b.business_description, 
                    b.location, 
                    b.opening_time, 
                    b.closing_time, 
                    b.logo_image_url,
                    COALESCE(COUNT(a.appointment_id), 0) AS total_appointments,
                    COALESCE(COUNT(r.review_id), 0) AS total_reviews,
                    COALESCE(SUM(o.total_amount), 0) AS total_sales
                FROM businesses b
                LEFT JOIN appointments a ON a.business_id = b.business_id
                LEFT JOIN reviews r ON r.business_id = b.business_id
                LEFT JOIN orders o ON o.business_id = b.business_id
                WHERE b.email = ?
                GROUP BY b.business_id
            `;
            db.query(query, [req.session.user.email], (err, results) => {
                if (err) return reject(err);
                console.log('Query Results:', results);  // Log query result
                resolve(results[0]);
            });
        });

        if (!businessData) {
            return res.status(404).json({ message: 'Business not found.' });
        }

        res.json(businessData);
    } catch (err) {
        console.error('Error fetching business overview:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

exports.getReviews = async (req, res) => {
    try {
        const user = req.session.user;

        if (!user || !user.id) {
            return res.status(401).json({ message: 'Unauthorized: No user session found' });
        }

        const businessId = user.id; // Retrieve the business ID from the session
        console.log('Business ID:', businessId); // Debug log for the business ID

        // Query to get reviews for the specific business
        const query = `
            SELECT r.review_id, r.rating, r.review_txt, r.created_at, c.first_name, c.last_name
            FROM reviews r
            JOIN customers c ON r.customer_id = c.customer_id
            WHERE r.business_id = ?
            ORDER BY r.created_at DESC
        `;

        const reviews = await new Promise((resolve, reject) => {
            db.query(query, [businessId], (err, results) => {
                if (err) {
                    console.error('Error executing query:', err);
                    return reject(err);
                }
                resolve(results);
            });
        });

        // If no reviews are found, return a message
        if (reviews.length === 0) {
            return res.status(404).json({ message: 'No reviews found for this business' });
        }

        res.json(reviews); // Send reviews as a JSON response
    } catch (err) {
        console.error('Error fetching reviews:', err);
        res.status(500).json({ message: 'Server error fetching reviews' });
    }
};



exports.getAppointments = async (req, res) => {
    const { status } = req.query; // Extract filters from query params
    console.log('Filters:', status);

    try {
        // Get the business_id from the session (it was stored during login)
        const businessId = req.session.user.id; // Access business_id from session

        if (!businessId) {
            return res.status(401).json({ message: 'Business not found or user not authenticated.' });
        }

        // Build the dynamic query for filtering
        let query = `
            SELECT a.appointment_id, c.first_name, c.last_name, a.appointment_date, a.status
            FROM appointments a
            JOIN customers c ON a.customer_id = c.customer_id
            WHERE a.business_id = ?`;

        // Add filters based on the query params
        const params = [businessId];
        if (status) {
            query += ' AND a.status = ?';
            params.push(status);
        }

        const appointments = await new Promise((resolve, reject) => {
            db.query(query, params, (err, results) => {
                if (err) {
                    console.error('Error fetching appointments:', err);
                    return reject(err);
                }
                resolve(results);
            });
        });

        if (appointments.length === 0) {
            return res.status(404).json({ message: 'No appointments found for this business' });
        }

        res.json(appointments);
    } catch (error) {
        console.error('Error fetching appointments:', error);
        res.status(500).json({ error: 'Error fetching appointments' });
    }
};



exports.cancelAppointment = async (req, res) => {
    const appointmentId = req.params.appointmentId;
    console.log('Canceling appointment with ID:', appointmentId);

    try {
        const query = 'UPDATE appointments SET status = ? WHERE appointment_id = ?';
        db.query(query, ['canceled', appointmentId], (err, results) => {
            if (err) {
                console.error('Error canceling appointment:', err);
                return res.status(500).json({ message: 'Error canceling appointment' });
            }

            if (results.affectedRows === 0) {
                return res.status(404).json({ message: 'Appointment not found' });
            }

            res.json({ success: true });
        });
    } catch (error) {
        console.error('Error in cancelAppointment controller:', error);
        res.status(500).json({ message: 'Error canceling appointment' });
    }
};

// Update appointment date
exports.rescheduleAppointment = async (req, res) => {
    const { appointmentId, newDate } = req.body;
    try {
        const query = 'UPDATE appointments SET appointment_date = ?, status = "pending" WHERE appointment_id = ?';
        db.query(query, [newDate, appointmentId], (err, results) => {
            if (err) {
                console.error('Error rescheduling appointment:', err);
                return res.status(500).json({ error: 'Error rescheduling appointment' });
            }

            if (results.affectedRows === 0) {
                return res.status(404).json({ error: 'Appointment not found' });
            }

            res.status(200).json({ message: 'Appointment rescheduled successfully' });
        });
    } catch (error) {
        console.error('Error rescheduling appointment:', error);
        res.status(500).json({ error: 'Error rescheduling appointment' });
    }
};

// Get all products for a business
exports.getProducts = async (req, res) => {
    const user = req.session.user;

        if (!user || !user.id) {
            return res.status(401).json({ message: 'Unauthorized: No user session found' });
        }

        const businessId = user.id; // Retrieve the business ID from the session
        console.log('Business ID:', businessId); // Debug log for the business ID
    try {
        const query = 'SELECT * FROM products WHERE business_id = ?';
        const results = await new Promise((resolve, reject) => {
            db.query(query, [businessId], (err, results) => {
                if (err) {
                    console.error('Error fetching products:', err);
                    return reject(err);
                }
                resolve(results);
            });
        });

        res.json(results);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Error fetching products' });
    }
};

exports.addProduct = async (req, res) => {
    const user = req.session.user;

    if (!user || !user.id) {
        return res.status(401).json({ message: 'Unauthorized: No user session found' });
    }

    const { product_name, price, quantity_in_stock, product_description } = req.body;
    const businessId = user.id;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null; // Get the uploaded image URL

    // Validate required fields
    if (!product_name || !price || !quantity_in_stock || !product_description) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        const query = `
            INSERT INTO products (business_id, product_name, price, quantity_in_stock, product_description, image_url)
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        await new Promise((resolve, reject) => {
            db.query(query, [businessId, product_name, price, quantity_in_stock, product_description, imageUrl], (err, results) => {
                if (err) {
                    console.error('Error adding product:', err);
                    return reject(err);
                }
                resolve(results);
            });
        });

        res.json({ message: 'Product added successfully' });
    } catch (error) {
        console.error('Error adding product:', error);
        res.status(500).json({ message: 'Error adding product' });
    }
};

// // Update product details
// exports.updateProduct = async (req, res) => {
//     const { product_id, product_name, product_description, price, quantity_in_stock, image_url } = req.body;

//     if (!product_id || !product_name || !price || !quantity_in_stock) {
//         return res.status(400).json({ error: 'Missing required fields' });
//     }

//     try {
//         const query = `
//             UPDATE products 
//             SET product_name = ?, product_description = ?, price = ?, quantity_in_stock = ?, image_url = ?, updated_at = NOW()
//             WHERE product_id = ? AND business_id = ?
//         `;
//         const results = await new Promise((resolve, reject) => {
//             db.query(query, [product_name, product_description, price, quantity_in_stock, image_url, product_id, req.session.businessId], (err, results) => {
//                 if (err) {
//                     console.error('Error updating product:', err);
//                     return reject(err);
//                 }
//                 resolve(results);
//             });
//         });

//         if (results.affectedRows === 0) {
//             return res.status(404).json({ error: 'Product not found' });
//         }

//         res.status(200).json({ message: 'Product updated successfully' });
//     } catch (error) {
//         console.error('Error updating product:', error);
//         res.status(500).json({ error: 'Error updating product' });
//     }
// };

// // Delete a product
// exports.deleteProduct = async (req, res) => {
//     const { product_id } = req.params;

//     try {
//         const query = 'DELETE FROM products WHERE product_id = ? AND business_id = ?';
//         const results = await new Promise((resolve, reject) => {
//             db.query(query, [product_id, req.session.businessId], (err, results) => {
//                 if (err) {
//                     console.error('Error deleting product:', err);
//                     return reject(err);
//                 }
//                 resolve(results);
//             });
//         });

//         if (results.affectedRows === 0) {
//             return res.status(404).json({ error: 'Product not found' });
//         }

//         res.status(200).json({ message: 'Product deleted successfully' });
//     } catch (error) {
//         console.error('Error deleting product:', error);
//         res.status(500).json({ error: 'Error deleting product' });
//     }
// };