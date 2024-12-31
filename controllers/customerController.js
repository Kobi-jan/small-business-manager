const db = require('../config/db');
const path = require('path');

// Function to search businesses
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
  
      // Include logo_url in the response
      const businessesWithLogo = results.map(business => ({
        ...business,
        logo_image_url: business.logo_image_url ? `${business.logo_image_url}` : null, // Adjust path if needed
      }));
  
      // Send the modified search results
      res.json(businessesWithLogo);
    });
  };
  
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
        average_rating: business.average_rating || 0  // Default to 0 if no rating exists
      }));
      
      res.json(businessesWithRating);
    });
  };

  exports.viewBusinessProfile = async (req, res) => {
    const businessId = req.params.business_id;
    console.log("Business ID: ", businessId);
  
    try {
      // Query business details
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
  
      // Send business and reviews as JSON
      res.json({ business, reviews });
  
    } catch (err) {
      console.error('Error fetching business profile:', err);
      res.status(500).sendFile(path.join(__dirname, '..', 'views', '500.html'));
    }
  };
  

// Controller function to handle appointment scheduling
exports.scheduleAppointment = async (req, res) => {
  const { appointmentDateTime } = req.body; // Expecting a datetime in the body
  const businessId = req.params.business_id; // Business ID from the route param
  const customerId = req.session.user.id; // Assuming the customer is logged in and their ID is stored in the session

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

exports.leaveReview = async (req, res) => {
  console.log('Request body:', req.body); // Log the request body

  const businessId = req.params.business_id;
  const { rating, review_txt } = req.body;  // review_txt is optional
  const customerId = req.session.user.id;  // Assuming customerId is stored in session

  // Ensure rating is provided and is valid
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

      // Fetch the updated list of reviews for the business
      const result = await db.execute(
          'SELECT r.rating, r.review_txt, r.created_at, c.first_name FROM reviews r LEFT JOIN customers c ON r.customer_id = c.customer_id WHERE r.business_id = ? ORDER BY r.created_at DESC', 
          [businessId]
      );

      console.log('Query result:', result);  // Log the entire result to check the structure

      // The rows are stored in _rows, not the result directly
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


exports.getAppointments = async (req, res) => {
  const { status } = req.query; // Extract filters from query params
  console.log('Filters:', status);

  try {
      // Get the business_id from the session (it was stored during login)
      const customerId = req.session.user.id; // Access business_id from session

      if (!customerId) {
          return res.status(401).json({ message: 'Customer not found or not authenticated.' });
      }

      // Build the dynamic query for filtering
      let query = `
          SELECT  b.business_name, a.appointment_date, a.status
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


// Fetch reviews for a customer
exports.getReviews = async (req, res) => {
  const customerId = req.session.user.id; // Get customer ID from session

  if (!customerId) {
      return res.status(401).json({ message: 'Customer not found or not authenticated.' });
  }

  try {
      // Query to fetch reviews
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

// Get products for the online store, with optional search query
exports.getProducts = async (req, res) => {
  const searchQuery = req.query.search ? `%${req.query.search}%` : '%';  // Default to all products if no search term

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

