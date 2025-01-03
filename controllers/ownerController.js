const db = require('../config/db');

// Complete the business profile
exports.completeProfile = async (req, res) => {
    const { description, location, openingTime, closingTime } = req.body;
    const logo = req.file ? `/uploads/${req.file.filename}` : null;

    try {
        if (!description || !location || !openingTime || !closingTime) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        if (!logo) {
            return res.status(400).json({ message: 'Logo image is required.' });
        }

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
        
        await new Promise((resolve, reject) => {
            db.query(query, params, (err, result) => {
                if (err) {
                    console.error('Database Query Error:', err);
                    return reject(err);
                }
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

// Business overview on the dashboard
exports.getBusinessOverview = async (req, res) => {
    try {
        const businessData = await new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    b.business_name, 
                    b.business_description, 
                    b.location, 
                    b.opening_time, 
                    b.closing_time, 
                    b.logo_image_url,
                    ROUND(AVG(r.rating), 1) AS average_rating,
                    COALESCE(COUNT(DISTINCT a.appointment_id), 0) AS total_appointments,
                    COALESCE(COUNT(DISTINCT r.review_id), 0) AS total_reviews,
                    COALESCE(SUM(oi.quantity * p.price), 0) AS total_sales  -- Calculate total sales from order_items and products  
                FROM businesses b
                LEFT JOIN appointments a ON a.business_id = b.business_id
                LEFT JOIN reviews r ON r.business_id = b.business_id
                LEFT JOIN products p ON p.business_id = b.business_id  -- Join products first, as we need product_id in order_items
                LEFT JOIN order_items oi ON oi.product_id = p.product_id  -- Now we can reference p.product_id
                WHERE b.email = ?
                GROUP BY b.business_id;

            `;
            db.query(query, [req.session.user.email], (err, results) => {
                if (err) return reject(err);
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

// Get reviews on the dashboard
exports.getReviews = async (req, res) => {
    try {
        const user = req.session.user;

        if (!user || !user.id) {
            return res.status(401).json({ message: 'Unauthorized: No user session found' });
        }
        
        const businessId = user.id; 

        const query = `
            SELECT r.review_id, r.rating, r.review_txt, r.created_at, c.first_name
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

        // If no reviews are found
        if (reviews.length === 0) {
            return res.status(404).json({ message: 'No reviews found for this business' });
        }

        res.json(reviews); 
    } catch (err) {
        console.error('Error fetching reviews:', err);
        res.status(500).json({ message: 'Server error fetching reviews' });
    }
};


// Get appointments
exports.getAppointments = async (req, res) => {
    const { status } = req.query; 

    try {
        const businessId = req.session.user.id; 

        if (!businessId) {
            return res.status(401).json({ message: 'Business not found or user not authenticated.' });
        }

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

// Cancel appointment
exports.cancelAppointment = async (req, res) => {
    const appointmentId = req.params.appointmentId;

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

// Update appointment date to confirmed
exports.confirmAppointment = async (req, res) => {
    const appointmentId = req.params.appointmentId;

    // Validation
    if (!appointmentId) {
        return res.status(400).json({ error: 'Appointment ID is required' });
    }

    try {
        const query = 'UPDATE appointments SET status = ? WHERE appointment_id = ?';
        db.query(query, ["confirmed", appointmentId], (err, results) => {
            if (err) {
                console.error('Error confirming appointment:', err);
                return res.status(500).json({ error: 'Error confirming appointment' });
            }

            if (results.affectedRows === 0) {
                return res.status(404).json({ error: 'Appointment not found' });
            }

            res.json({ success: true });
        });
    } catch (error) {
        console.error('Error confirming appointment:', error);
        res.status(500).json({ error: 'Error confirming appointment' });
    }
};

// Update appointment to completed
exports.completeAppointment = async (req, res) => {
    const appointmentId = req.params.appointmentId;

    // Validation
    if (!appointmentId) {
        return res.status(400).json({ error: 'Appointment ID is required' });
    }

    try {
        const query = 'UPDATE appointments SET status = ? WHERE appointment_id = ?';
        db.query(query, ["completed", appointmentId], (err, results) => {
            if (err) {
                console.error('Error setting appointment to complete:', err);
                return res.status(500).json({ error: 'Error setting appointment to complete' });
            }

            if (results.affectedRows === 0) {
                return res.status(404).json({ error: 'Appointment not found' });
            }

            res.json({ success: true});
        });
    } catch (error) {
        console.error('Error setting appointment to complete:', error);
        res.status(500).json({ error: 'Error setting appointment to complete' });
    }
};

// Get all products 
exports.getProducts = async (req, res) => {
    const user = req.session.user;

        if (!user || !user.id) {
            return res.status(401).json({ message: 'Unauthorized: No user session found' });
        }

        const businessId = user.id; 

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

// Add a new product
exports.addProduct = async (req, res) => {
    const user = req.session.user;

    if (!user || !user.id) {
        return res.status(401).json({ message: 'Unauthorized: No user session found' });
    }

    const { product_name, price, quantity_in_stock, product_description } = req.body;
    const businessId = user.id;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    //Validation
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

// Update a product description
exports.updateProductDescription = async (req, res) => {
    const { product_description } = req.body;
    const product_id = req.params.product_id;   

    // Validation
    if (!product_id) {
        return res.status(400).json({ error: 'Product ID is required' });
    }
    if (!product_description) {
        return res.status(400).json({ error: 'Product description is required' });
    }
    const businessId = req.session.user.id;
    try {
        const query = 'UPDATE products SET product_description = ? WHERE product_id = ? AND business_id = ?';
        const results = await new Promise((resolve, reject) => {
            db.query(query, [product_description, product_id, businessId], (err, results) => {
                if (err) {
                    console.error('Error updating product description:', err);
                    return reject(err);
                }
                resolve(results);
            });
        });
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Product not found or no changes made' });
        }
        res.status(200).json({ message: 'Product description updated successfully' });
    } catch (error) {
        console.error('Error updating product description:', error);
        res.status(500).json({ error: 'Error updating product description' });
    }
};

// Update a product price
exports.updateProductPrice = async (req, res) => {
    const { price } = req.body;
    const product_id = req.params.product_id; 

    // Validation
    if (!product_id) {
        return res.status(400).json({ error: 'Product ID is required' });
    }
    if (!price) {
        return res.status(400).json({ error: 'Product price is required' });
    }
    const businessId = req.session.user.id;
    try {
        const query = 'UPDATE products SET price = ? WHERE product_id = ? AND business_id = ?';
        const results = await new Promise((resolve, reject) => {
            db.query(query, [price, product_id, businessId], (err, results) => {
                if (err) {
                    console.error('Error updating product price:', err);
                    return reject(err);
                }
                resolve(results);
            });
        });
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Product not found or no changes made' });
        }
        res.status(200).json({ message: 'Product price updated successfully' });
    } catch (error) {
        console.error('Error updating product price:', error);
        res.status(500).json({ error: 'Error updating product price' });
    }
};

// Add product quantity
exports.addQuantityInStock = async (req, res) => {
    const { quantity_in_stock } = req.body;
    const product_id = req.params.product_id;   

    //Validation
    if (!product_id) {
        return res.status(400).json({ error: 'Product ID is required' });
    }
    if (!quantity_in_stock) {
        return res.status(400).json({ error: 'Valid quantity is required' });
    }

    const businessId = req.session.user.id;

    try {
        const query = `
            UPDATE products 
            SET quantity_in_stock = quantity_in_stock + ? 
            WHERE product_id = ? AND business_id = ?
        `;
        const results = await new Promise((resolve, reject) => {
            db.query(query, [quantity_in_stock, product_id, businessId], (err, results) => {
                if (err) {
                    console.error('Error updating quantity:', err);
                    return reject(err);
                }
                resolve(results);
            });
        });

        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Product not found or no changes made' });
        }

        res.status(200).json({ message: 'Quantity updated successfully' });
    } catch (error) {
        console.error('Error updating quantity:', error);
        res.status(500).json({ error: 'Error updating quantity' });
    }
};

// Delete a product
exports.deleteProduct = async (req, res) => {
    const product_id = req.params.product_id;   

    if (!product_id) {
        return res.status(400).json({ error: 'Product ID is required' });
    }

    try {
        const query = 'DELETE FROM products WHERE product_id = ? AND business_id = ?';
        const results = await new Promise((resolve, reject) => {
            db.query(query, [product_id, req.session.user.id], (err, results) => {
                if (err) {
                    console.error('Error deleting product:', err);
                    return reject(err);
                }
                resolve(results);
            });
        });

        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Product not found or already deleted' });
        }

        res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ error: 'Error deleting product' });
    }
};

// Get total sales
exports.getTotalSales = async (req, res) => {
    try {
        // Get the current date and previous time periods
        const currentDate = new Date();
        const startOfDay = new Date(currentDate.setHours(0, 0, 0, 0));
        const startOfWeek = new Date(currentDate.setDate(currentDate.getDate() - currentDate.getDay()));
        const startOfMonth = new Date(currentDate.setDate(1));
        const startOfYear = new Date(currentDate.setMonth(0, 1));

        const query = `
            SELECT 
                SUM(i.quantity * p.price) AS total_revenue,
                COUNT(DISTINCT o.order_id) AS number_of_sales
            FROM order_items i
            LEFT JOIN orders o ON o.order_id = i.order_id
            LEFT JOIN products p ON p.product_id = i.product_id
            WHERE o.created_at >= ?
        `;
        
        // Fetch total sales data for the day, week, month, and year
        const [salesDataDay] = await db.promise().query(query, [startOfDay]);
        const [salesDataWeek] = await db.promise().query(query, [startOfWeek]);
        const [salesDataMonth] = await db.promise().query(query, [startOfMonth]);
        const [salesDataYear] = await db.promise().query(query, [startOfYear]);

        res.json({
            day: salesDataDay[0],
            week: salesDataWeek[0],
            month: salesDataMonth[0],
            year: salesDataYear[0],
        });
    } catch (error) {
        console.error('Error fetching total sales data:', error);
        res.status(500).json({ error: 'Error fetching sales data' });
    }
};

// Get sales by product
exports.getSalesByProduct = async (req, res) => {
    try {
        const query = `
            SELECT 
                p.product_id,
                p.product_name,
                SUM(i.quantity) AS total_units_sold,
                SUM(i.quantity * p.price) AS total_revenue
            FROM order_items i
            LEFT JOIN products p ON p.product_id = i.product_id
            JOIN orders o ON o.order_id = i.order_id
            GROUP BY p.product_id
            ORDER BY total_revenue DESC
        `;
        
        const [salesByProduct] = await db.promise().query(query);

        res.json(salesByProduct);
    } catch (error) {
        console.error('Error fetching sales by product data:', error);
        res.status(500).json({ error: 'Error fetching sales by product data' });
    }
};

// Get sales data for graphs 
exports.getSalesGraphData = async (req, res) => {
    try {
        const currentDate = new Date();

        const startOfDay = new Date(currentDate.setHours(0, 0, 0, 0));
        const startOfWeek = new Date(currentDate.setDate(currentDate.getDate() - currentDate.getDay()));
        const startOfMonth = new Date(currentDate.setDate(1));
        const startOfYear = new Date(currentDate.setMonth(0, 1));
        const startOfAllTime = '2024-01-01'; // Assuming no sales before this date

        // Query for daily sales trend
        const dailyQuery = `
            SELECT 
                DATE(o.created_at) AS date,
                SUM(i.quantity * p.price) AS total_revenue
            FROM order_items i
            LEFT JOIN orders o ON o.order_id = i.order_id
            LEFT JOIN products p ON p.product_id = i.product_id
            WHERE o.created_at >= ?
            GROUP BY DATE(o.created_at)
            ORDER BY DATE(o.created_at)
        `;
        
        // Query for weekly sales trend
        const weeklyQuery = `
            SELECT 
                WEEK(o.created_at) AS week,
                SUM(i.quantity * p.price) AS total_revenue
            FROM order_items i
            LEFT JOIN orders o ON o.order_id = i.order_id
            LEFT JOIN products p ON p.product_id = i.product_id
            WHERE o.created_at >= ?
            GROUP BY WEEK(o.created_at)
            ORDER BY WEEK(o.created_at)
        `;
        
        // Query for monthly sales trend
        const monthlyQuery = `
            SELECT 
                MONTH(o.created_at) AS month,
                SUM(i.quantity * p.price) AS total_revenue
            FROM order_items i
            LEFT JOIN orders o ON o.order_id = i.order_id
            LEFT JOIN products p ON p.product_id = i.product_id
            WHERE o.created_at >= ?
            GROUP BY MONTH(o.created_at)
            ORDER BY MONTH(o.created_at)
        `;
        
        // Query for yearly sales trend
        const yearlyQuery = `
            SELECT 
                YEAR(o.created_at) AS year,
                SUM(i.quantity * p.price) AS total_revenue
            FROM order_items i
            LEFT JOIN orders o ON o.order_id = i.order_id
            LEFT JOIN products p ON p.product_id = i.product_id
            WHERE o.created_at >= ?
            GROUP BY YEAR(o.created_at)
            ORDER BY YEAR(o.created_at)
        `;
        
        // Query for all-time sales trend
        const allTimeQuery = `
            SELECT 
                SUM(i.quantity * p.price) AS total_revenue
            FROM order_items i
            LEFT JOIN orders o ON o.order_id = i.order_id
            LEFT JOIN products p ON p.product_id = i.product_id
            WHERE o.created_at >= ?
        `;

        // Fetch all-time, daily, weekly, monthly, and yearly data
        const [dailyData] = await db.promise().query(dailyQuery, [startOfDay]);
        const [weeklyData] = await db.promise().query(weeklyQuery, [startOfWeek]);
        const [monthlyData] = await db.promise().query(monthlyQuery, [startOfMonth]);
        const [yearlyData] = await db.promise().query(yearlyQuery, [startOfYear]);
        const [allTimeData] = await db.promise().query(allTimeQuery, [startOfAllTime]);

        res.json({
            allTime: allTimeData[0],
            daily: dailyData,
            weekly: weeklyData,
            monthly: monthlyData,
            yearly: yearlyData
        });
    } catch (error) {
        console.error('Error fetching sales graph data:', error);
        res.status(500).json({ error: 'Error fetching sales graph data' });
    }
};

// Get sales transactions details
exports.getSalesTransactions = async (req, res) => {
    try {
        const query = `
            SELECT 
                o.order_id,
                o.created_at AS sale_date,
                p.product_name,
                i.quantity,
                i.quantity * p.price AS sale_price,
                c.first_name
            FROM order_items i
            LEFT JOIN orders o ON o.order_id = i.order_id
            LEFT JOIN products p ON p.product_id = i.product_id
            LEFT JOIN customers c ON c.customer_id = o.customer_id
            ORDER BY o.created_at DESC
        `;
        
        const [salesTransactions] = await db.promise().query(query);

        res.json(salesTransactions);
    } catch (error) {
        console.error('Error fetching sales transactions:', error);
        res.status(500).json({ error: 'Error fetching sales transactions' });
    }
};

// Get conversations
exports.getConversations = async (req, res) => {
    const businessId = req.session.user.id;  
    console.log("Business ID is: ", businessId);

    if (!businessId) {
        return res.status(400).json({ error: 'Business ID is required' });
    }

    try {
        const query = `
            SELECT DISTINCT
                c.customer_id,
                CONCAT(c.first_name, ' ', c.last_name) AS customer_name
            FROM messages m
            JOIN customers c ON c.customer_id = m.sender_id OR c.customer_id = m.recipient_id
            WHERE (m.sender_id = ? AND m.sender_type = 'business') 
               OR (m.recipient_id = ? AND m.sender_type = 'customer')
        `;

        const params = [businessId, businessId];

        const conversations = await new Promise((resolve, reject) => {
            db.query(query, params, (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });

        if (!conversations.length) {
            return res.status(404).json({ message: 'No conversations found' });
        }

        res.json(conversations);
    } catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ error: 'An error occurred while fetching conversations' });
    }
};

// Get messages for a specific business
exports.getMessages = async (req, res) => {
    const businessId = req.session.user.id;  
    const customerId = req.params.customerId; 

    console.log("Business ID:", businessId);
    console.log("Customer ID:", customerId);

    if (!businessId || !customerId) {
        return res.status(400).json({ error: 'Business ID and Customer ID are required' });
    }

    try {
        const query = `
            SELECT m.message_text, m.sender_type, m.created_at
            FROM messages m
            WHERE (m.sender_id = ? AND m.recipient_id = ?)
               OR (m.sender_id = ? AND m.recipient_id = ?)
            ORDER BY m.created_at ASC
        `;

        const params = [businessId, customerId, customerId, businessId];

        const messages = await new Promise((resolve, reject) => {
            db.query(query, params, (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });

        // If no messages found
        if (!messages.length) {
            return res.status(404).json({ message: 'No messages found' });
        }

        // Return the messages in a response
        res.json({ messages });

    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'An error occurred while fetching messages' });
    }
};

// Send a message
exports.sendMessage = async (req, res) => {
    const businessId = req.session.user.id;  
    const { customerId, messageText } = req.body;  

    // Validation
    if (!businessId || !customerId || !messageText) {
        return res.status(400).json({ error: 'Business ID, Customer ID, and Message Text are required' });
    }

    const senderType = 'business';  
    const timestamp = new Date();  

    try {
        const query = `
            INSERT INTO messages (sender_id, recipient_id, sender_type, message_text, created_at)
            VALUES (?, ?, ?, ?, ?)
        `;

        const params = [businessId, customerId, senderType, messageText, timestamp];  // Use businessId for sender_id

        await new Promise((resolve, reject) => {
            db.query(query, params, (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });

        res.status(200).json({ message: 'Message sent successfully' });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'An error occurred while sending the message' });
    }
};
