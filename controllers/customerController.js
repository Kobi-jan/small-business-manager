const exp = require('constants');
const db = require('../config/db');
const path = require('path');

// Function to search for businesses
exports.searchBusinesses = (req, res) => {
    const searchTerm = req.query.searchTerm || '';
  
    const query = `
      SELECT * FROM businesses 
      WHERE business_name LIKE ? OR location LIKE ? OR business_description LIKE ?
    `;
  
    db.query(query, [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`], (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).send('Internal Server Error');
      }
  
      const businessesWithLogo = results.map(business => ({
        ...business,
        logo_image_url: business.logo_image_url ? `${business.logo_image_url}` : null, 
      }));

      res.json(businessesWithLogo);
    });
  };
  
  // Simulate featured businesses
  exports.getFeaturedBusinesses = (req, res) => {
    const query = `
      SELECT b.business_id, b.business_name, b.logo_image_url, AVG(r.rating) AS average_rating
      FROM businesses b
      LEFT JOIN reviews r ON b.business_id = r.business_id
      GROUP BY b.business_id
      ORDER BY RAND()  
      LIMIT 5;  
    `;
    
    db.query(query, (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).send('Internal Server Error');
      }
      
      // Include logo_url and average rating in the response
      const businessesWithRating = results.map(business => ({
        ...business,
        logo_image_url: business.logo_image_url ? `${business.logo_image_url}` : null,
        average_rating: business.average_rating || 0  
      }));
      
      res.json(businessesWithRating);
    });
  };

// Function to view business details
  exports.viewBusinessProfile = async (req, res) => {
    const businessId = req.params.business_id;
  
    try {
        // Query the business details
      const businessQuery = `
        SELECT b.*, AVG(r.rating) AS average_rating
        FROM businesses b
        LEFT JOIN reviews r ON b.business_id = r.business_id
        WHERE b.business_id = ?
        GROUP BY b.business_id
      `;
      const [businessResults] = await db.promise().query(businessQuery, [businessId]);
      const business = businessResults[0];
  
      if (!business) {
        return res.status(404).json({ error: 'Business not found' });
      }
  
      // Query reviews for the business
      const reviewsQuery = `
        SELECT r.rating, r.review_txt, r.created_at, c.first_name
        FROM reviews r
        LEFT JOIN customers c ON r.customer_id = c.customer_id 
        WHERE business_id = ?
        ORDER BY r.created_at DESC`;

      const [reviews] = await db.promise().query(reviewsQuery, [businessId]);

      res.json({ business, reviews });
  
    } catch (err) {
      console.error('Error fetching business profile:', err);
      res.status(500).sendFile(path.join(__dirname, '..', 'views', '500.html'));
    }
  };
  

// Function to handle appointment scheduling
exports.scheduleAppointment = async (req, res) => {
  const { appointmentDateTime } = req.body; 
  const businessId = req.params.business_id; 
  const customerId = req.session.user.id; 

  // Validation
  if (!customerId || !businessId || !appointmentDateTime) {
      return res.status(400).json({ error: 'Missing required fields.' });
  }

  const appointmentDate = new Date(appointmentDateTime);

  if (isNaN(appointmentDate)) {
      return res.status(400).json({ error: 'Invalid date and time format.' });
  }

  try {
      console.log('Inserting appointment:', { businessId, customerId, appointmentDate });

      // Insert the appointment into the database
      const query = `
          INSERT INTO appointments (business_id, customer_id, appointment_date, status)
          VALUES (?, ?, ?, 'pending')
      `;
      const [result] = await db.promise().query(query, [businessId, customerId, appointmentDate]);

      console.log('Appointment successfully inserted:', result);

      res.status(201).json({ message: 'Appointment successfully booked.', appointmentId: result.insertId });
  } catch (err) {
      console.error('Error booking appointment:', err);
      res.status(500).json({ error: 'Error booking appointment. Please try again later.' });
  }
};

// Function to leave a review
exports.leaveReview = async (req, res) => {
  const businessId = req.params.business_id;
  const { rating, review_txt } = req.body;  
  const customerId = req.session.user.id;  

  // Validation
  if (!rating || rating < 1 || rating > 5 || !customerId) {
      return res.status(400).json({ error: 'Rating or customer ID is missing or invalid' });
  }

  try {
      // If review_txt is provided, insert it along with the rating
      if (review_txt) {
          await db.execute('INSERT INTO reviews (business_id, customer_id, rating, review_txt) VALUES (?, ?, ?, ?)', [businessId, customerId, rating, review_txt]);
      } else {
          // If no review_txt is provided, only insert the rating
          await db.execute('INSERT INTO reviews (business_id, customer_id, rating) VALUES (?, ?, ?)', [businessId, customerId, rating]);
      }

      const result = await db.execute(
          'SELECT r.rating, r.review_txt, r.created_at, c.first_name FROM reviews r LEFT JOIN customers c ON r.customer_id = c.customer_id WHERE r.business_id = ? ORDER BY r.created_at DESC', 
          [businessId]
      );

      const rows = result._rows;

      if (!Array.isArray(rows)) {
          console.error('Expected an array, but got:', rows);
          return res.status(500).json({ error: 'Error fetching reviews from the database' });
      }

      // If no reviews are found, send an empty array
      if (rows.length === 0) {
          return res.json({ reviews: [] });
      }

      res.json({ reviews: rows });
  } catch (error) {
      console.error('Error fetching reviews:', error);
      return res.status(500).json({ error: 'Unable to fetch reviews' });
  }
};

// Get appointments for a customer
exports.getAppointments = async (req, res) => {
  const { status } = req.query; 
  console.log('Filters:', status);

  try {
      const customerId = req.session.user.id; 

      if (!customerId) {
          return res.status(401).json({ message: 'Customer not found or not authenticated.' });
      }

      let query = `
          SELECT  b.business_name, a.appointment_date, a.status, a.appointment_id
          FROM appointments a
          JOIN businesses b ON a.business_id = b.business_id
          WHERE a.customer_id = ?`;

      // Add filters based on the query params
      const params = [customerId];
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
          return res.status(404).json({ message: 'No appointments found for this user' });
      }

      res.json(appointments);
  } catch (error) {
      console.error('Error fetching appointments:', error);
      res.status(500).json({ error: 'Error fetching appointments' });
  }
};


// Cancel an appointment
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

// Update appointment date
exports.rescheduleAppointment = async (req, res) => {
  const { newDate } = req.body;
  appointmentId = req.params.appointmentId;

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

          res.json({ success: true });
      });
  } catch (error) {
      console.error('Error rescheduling appointment:', error);
      res.status(500).json({ error: 'Error rescheduling appointment' });
  }
};


// Get reviews for a business
exports.getReviews = async (req, res) => {
  const customerId = req.session.user.id; // Get customer ID from session

  if (!customerId) {
      return res.status(401).json({ message: 'Customer not found or not authenticated.' });
  }

  try {
      const query = `
          SELECT 
              b.business_name,
              b.logo_image_url AS business_logo,
              r.rating,
              r.review_txt
          FROM reviews r
          JOIN businesses b ON r.business_id = b.business_id
          WHERE r.customer_id = ?
      `;
      
      const params = [customerId];

      // Fetch reviews from the database
      const reviews = await new Promise((resolve, reject) => {
          db.query(query, params, (err, results) => {
              if (err) {
                  console.error('Error fetching reviews:', err);
                  return reject(err);
              }
              resolve(results);
          });
      });

      if (reviews.length === 0) {
          return res.status(404).json({ message: 'No reviews found for this customer.' });
      }

      // Return the reviews
      res.json(reviews);
  } catch (error) {
      console.error('Error fetching reviews:', error);
      res.status(500).json({ error: 'Error fetching reviews' });
  }
};

// Get products for the online store with a search query
exports.getProducts = async (req, res) => {
  const searchQuery = req.query.search ? `%${req.query.search}%` : '%';  

  try {
      const query = `
          SELECT p.product_id, p.product_name,p.product_description, p.price, p.image_url, b.business_name
          FROM products p
          JOIN businesses b ON p.business_id = b.business_id
          WHERE p.quantity_in_stock > 0 AND p.product_name LIKE ?
      `;

      const products = await new Promise((resolve, reject) => {
          db.query(query, [searchQuery], (err, results) => {
              if (err) {
                  console.error('Error fetching products:', err);
                  return reject(err);
              }
              resolve(results);
          });
      });

      res.json(products);
  } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ error: 'Error fetching products' });
  }
};


// Add to cart with stock check 
exports.addToCart = async (req, res) => {
    const { productId, quantity } = req.body;

    // Initialize cart if it doesn't exist
    if (!req.session.cart) {
        req.session.cart = [];
    }

    // Fetch the product from the database to check stock availability 
    const query = `SELECT p.*, b.business_id 
    FROM products p 
    JOIN businesses b ON p.business_id = b.business_id
    WHERE product_id = ?
    `;
    const product = await new Promise((resolve, reject) => {
        db.query(query, [productId], (err, results) => {
            if (err) return reject(err);
            resolve(results[0]);
        });
    });

    // If no product found or quantity exceeds stock, return an error
    if (!product || quantity > product.quantity_in_stock) {
        return res.status(400).json({ message: 'Not enough stock available' });
    }

    // Check if product is already in cart
    const existingProduct = req.session.cart.find(item => item.productId === productId);
    if (existingProduct) {
        existingProduct.quantity += quantity; 
    } else {
        req.session.cart.push({
            businessId: product.business_id,
            productId,
            quantity,
            name: product.product_name,
            price: product.price,
            imageUrl: product.image_url,  
            description: product.product_description  
        });
    }

    // Return updated cart 
    res.json(req.session.cart);  
};


// View the cart
exports.viewCart = (req, res) => {
    const cart = req.session.cart || [];  // Get cart from session
    res.json(cart);  
};


exports.updateCart = (req, res) => {
    const { productId, operation } = req.body;  

    if (!req.session.cart) {
        return res.status(400).json({ message: 'Cart is empty' });
    }

    const item = req.session.cart.find(item => item.productId === parseInt(productId));

    if (item) {
        if (operation === 'increase') {
            item.quantity += 1;
        } else if (operation === 'decrease' && item.quantity > 1) {
            item.quantity -= 1;
        }
        return res.json(req.session.cart);  
    } else {
        return res.status(404).json({ message: 'Product not found in cart' });
    }
};



// Remove an item from the cart
exports.removeFromCart = (req, res) => {
    const { productId } = req.body;

    if (!req.session.cart) {
        return res.status(400).json({ message: 'Cart is empty' });
    }

    req.session.cart = req.session.cart.filter(item => item.productId !== parseInt(productId));
    res.json(req.session.cart);  
};

// Checkout the cart
exports.checkout = async (req, res) => {
    const { shippingAddress } = req.body;  
    const customerId = req.session.user.id;  
    const cart = req.session.cart;

    // Validation
    if (!cart || cart.length === 0) {
        return res.status(400).json({ message: 'Your cart is empty' });
    }

    if (!shippingAddress) {
        return res.status(400).json({ message: 'Shipping address is required' });
    }

    const totalAmount = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

    // Create a new order in the orders table
    const orderQuery = 'INSERT INTO orders (customer_id, total_amount, shipping_address, order_date) VALUES (?, ?, ?, NOW())';
    const values = [customerId, totalAmount, shippingAddress];

    try {
        // Insert the order into the database
        const [orderResult] = await db.promise().query(orderQuery, values);
        const orderId = orderResult.insertId;

        // Insert each item into the order_items table
        for (const item of cart) {
            const orderItemQuery = 'INSERT INTO order_items (order_id, product_id, business_id, quantity, price) VALUES (?, ?, ?, ?, ?)';
            const orderItemValues = [orderId, item.productId, item.businessId, item.quantity, item.price];
            await db.promise().query(orderItemQuery, orderItemValues);
        }

        // Simulate payment
        const paymentStatus = Math.random() > 0.1 ? 'paid' : 'failed';  // Random probability for payment simulation
        const paymentQuery = 'INSERT INTO payments (order_id, payment_status, amount) VALUES (?, ?, ?)';
        const paymentValues = [orderId, paymentStatus, totalAmount];
        await db.promise().query(paymentQuery, paymentValues);

        // Clear the cart after order and payment
        req.session.cart = [];

        res.json({
            message: paymentStatus === 'paid' ? 'Order placed successfully!' : 'Payment failed, try again later',
            status: paymentStatus
        });
    } catch (error) {
        console.error('Error processing checkout:', error);
        res.status(500).json({ message: 'Error processing order' });
    }
};

// Get order history for a customer
exports.getOrderHistory = async (req, res) => {
    const customerId = req.session.user.id; 

    if (!customerId) {
        return res.status(401).json({ message: 'Customer not found or not authenticated.' });
    }

    try {
        const query = `
            SELECT o.order_id, o.total_amount, o.order_date, p.payment_status, p.amount
            FROM orders o
            JOIN payments p ON o.order_id = p.order_id
            WHERE o.customer_id = ?
            ORDER BY o.order_date DESC
        `;
        
        const params = [customerId];

        const [orders] = await db.promise().query(query, params);

        if (orders.length === 0) {
            return res.status(404).json({ message: 'No orders found for this customer.' });
        }

        res.json(orders);
    } catch (error) {
        console.error('Error fetching order history:', error);
        res.status(500).json({ error: 'Error fetching order history' });
    }
};

// Fetch order items for a given order
exports.getOrderItems = async (req, res) => {
    const { orderId } = req.params;

    try {
        const query = `
            SELECT p.product_name, i.quantity, i.price
            FROM order_items i
            JOIN products p ON i.product_id = p.product_id
            WHERE i.order_id = ?
        `;
        
        const [orderItems] = await db.promise().query(query, [orderId]);

        if (orderItems.length === 0) {
            return res.status(404).json({ message: 'No items found for this order.' });
        }

        res.json(orderItems);
    } catch (error) {
        console.error('Error fetching order items:', error);
        res.status(500).json({ message: 'Error fetching order items' });
    }
};


// Send a Message
exports.sendMessage = async (req, res) => {
    const businessId  = req.params.business_id;
    const { message_text } = req.body;  

    const customerId = req.session.user.id;  

    try {
        // Insert the message into the database
        const query = `
            INSERT INTO messages (sender_id, recipient_id, message_text, sender_type)
            VALUES (?, ?, ?, ?)
        `;
        await db.execute(query, [customerId, businessId, message_text, 'customer']);

        res.status(200).json({ message: 'Message sent successfully' });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Error sending message' });
    }
};

// Get conversations for a customer
exports.getConversations = async (req, res) => {
    const customerId = req.session.user.id;

    if (!customerId) {
        return res.status(400).json({ error: 'Customer ID is required' });
    }

    try {
        const query = `
            SELECT DISTINCT
                b.business_id,
                b.business_name,
                b.logo_image_url
            FROM messages m
            JOIN businesses b ON b.business_id = m.sender_id OR b.business_id = m.recipient_id
            WHERE (m.sender_id = ? AND m.sender_type = 'customer') 
               OR (m.recipient_id = ? AND m.sender_type = 'business')
        `;

        const params = [customerId, customerId];

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
    }catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ error: 'An error occurred while fetching conversations' });
    }
};

// Get messages between a customer and a business
exports.getMessages = async (req, res) => {
    const customerId = req.session.user.id;  
    const businessId = req.params.businessId;  

    if (!customerId || !businessId) {
        return res.status(400).json({ error: 'Customer ID and Business ID are required' });
    }

    try {
        const query = `
            SELECT m.message_text, m.sender_type, m.created_at
            FROM messages m
            WHERE (m.sender_id = ? AND m.recipient_id = ?)
               OR (m.sender_id = ? AND m.recipient_id = ?)
            ORDER BY created_at ASC
        `;

        const params = [customerId, businessId, businessId, customerId];

        const messages = await new Promise((resolve, reject) => {
            db.query(query, params, (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });

        if (!messages.length) {
            return res.status(404).json({ message: 'No messages found' });
        }

        res.json({ messages });

    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'An error occurred while fetching messages' });
    }
};

// Send a message to a business from the conversation
exports.sendMessage2 = async (req, res) => {
    const customerId = req.session.user.id;  
    const { businessId, messageText } = req.body; 

    if (!customerId || !businessId || !messageText) {
        return res.status(400).json({ error: 'Customer ID, Business ID, and Message Text are required' });
    }

    const senderType = 'customer';  
    const timestamp = new Date();  

    try {
        const query = `
            INSERT INTO messages (sender_id, recipient_id, sender_type, message_text, created_at)
            VALUES (?, ?, ?, ?, ?)
        `;

        const params = [customerId, businessId, senderType, messageText, timestamp];  // customerId for sender_id, businessId for recipient_id

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
