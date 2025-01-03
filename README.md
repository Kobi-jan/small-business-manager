# StartSmart 
## A Small Business Manager

StartSmart is a platform designed to help small businesses manage their operations, connect with customers, and grow their online presence. 

---

## Core Features
- **Business Directory**: Small businesses can list their profiles. 
  - Appointment scheduling.
  - Customers can leave reviews for businesses.

- **Inventory Management**: 
  - Track inventory.
  - Manage product quantities.
  - Track sales.

- **Online Store**: 
  - Show products available for sale.
  - Display products and services offered by businesses.

- **Messaging**: Facilitate communication between potential customers and business owners.

- **Customer Discovery**: Customers can browse the app to discover products and businesses.

---

## Technology Stack
- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express.js
- **Database**: MySQL
- **Authentication**: `express-session`

---

## Project Dependencies
- `express`
- `mysql2`
- `dotenv`
- `bcrypt`
- `nodemon`
- `multer`
- `express-session`
- `chart.js`

---

### Prerequisites

Before you begin, make sure you have the following installed on your machine:

- **Node.js**: Download and install the latest version from [here](https://nodejs.org/).
- **MySQL**: Download and install MySQL from [here](https://www.mysql.com/downloads/).
  - Create a MySQL database for the project. You can do this using a MySQL client or command line.

### Installation Steps

1. **Clone the repository**:
   First, clone the project repository to your local machine:
   ```bash
   git clone https://github.com/Kobi-jan/small-business-manager.git

2. **Navigate to the project folder**:
    Change to the project directory:
    ```bash
    cd small-business-manager
  

3. **Install the dependencies**:
    Run the following command to install all required packages and dependencies:
    ```bash
    npm install 

4. **Configure the database**:
    Create a .env file and fill in your database credentials
    ```bash
    DB_HOST = localhost
    DB_USER = <your-username>
    DB_PASSWORD = <your-password>
    DB_NAME = small_business_manager
    PORT = <your-preferred-port> /// I used 5000
    SESSION_SECRET = <your-session-password>
  ```

5. **Create the database tables**: 
    In MYSQL WorkBench, run the SQL queries to create the necessary tables.
    ``` sql 
    CREATE TABLE customers (
        customer_id INT AUTO_INCREMENT PRIMARY KEY,
        first_name VARCHAR(25) NOT NULL,
        last_name VARCHAR(25) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );

    CREATE TABLE businesses (
        business_id INT AUTO_INCREMENT PRIMARY KEY,
        business_name VARCHAR(255) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL, 
        password VARCHAR(255) NOT NULL,
        business_description TEXT,
        location VARCHAR(255),
        logo_image_url VARCHAR(255),
        isProfileComplete BOOLEAN DEFAULT FALSE,
        opening_time TIME,
        closing_time TIME,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
    CREATE TABLE messages (
        message_id INT AUTO_INCREMENT PRIMARY KEY,
        sender_id INT NOT NULL, -- customer_id or business_id
        recipient_id INT NOT NULL, -- customer_id or business_id
        message_text TEXT NOT NULL,
        sender_type ENUM('customer', 'business') NOT NULL,  -- To differentiate between customers and businesses
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        read_status BOOLEAN DEFAULT FALSE -- Foreign key reference for business
    );
    CREATE TABLE order_items (
        order_item_id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(order_id),
        FOREIGN KEY (product_id) REFERENCES products(product_id)
    );
        CREATE TABLE payments (
        payment_id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT,
        amount DECIMAL(10, 2),
        payment_status ENUM('pending', 'paid', 'failed')
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE orders (
        order_id INT AUTO_INCREMENT PRIMARY KEY,
        customer_id INT,
        order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        total_amount DECIMAL(10, 2),
        shipping_address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
    CREATE TABLE appointments (
        appointment_id INT AUTO_INCREMENT PRIMARY KEY,
        business_id INT NOT NULL,
        customer_id INT NOT NULL,
        appointment_date DATETIME NOT NULL,
        status ENUM('pending', 'confirmed', 'completed', 'canceled') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (business_id) REFERENCES businesses(business_id) ON DELETE CASCADE,
        FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE
    );
    CREATE TABLE reviews (
        review_id INT AUTO_INCREMENT PRIMARY KEY,
        business_id INT NOT NULL,
        customer_id INT NOT NULL,
        rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
        review_txt TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (business_id) REFERENCES businesses(business_id) ON DELETE CASCADE,
        FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE
    );
    CREATE TABLE products (
        product_id INT AUTO_INCREMENT PRIMARY KEY,
        business_id INT NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        product_description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        quantity_in_stock INT NOT NULL,
        image_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (business_id) REFERENCES businesses(business_id) ON DELETE CASCADE
    );
  ```
6. **Run the development server**:
  ```
  npm start
  ```
Your app will be be will be available at `http://localhost:${PORT}`
    






