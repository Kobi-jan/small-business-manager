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

---

## SQL Tables
### `customers`
| Column         | Type          | Description                        |
|----------------|---------------|------------------------------------|
| `customer_id`  | INT           | Primary key.                      |
| `first_name`   | VARCHAR       | Customer's first name.            |
| `last_name`    | VARCHAR       | Customer's last name.             |
| `email`        | VARCHAR       | Customer's email address.         |
| `password`     | VARCHAR       | Encrypted password.               |
| `created_at`   | TIMESTAMP     | Record creation timestamp.        |
| `updated_at`   | TIMESTAMP     | Record update timestamp.          |

### `businesses`
| Column              | Type          | Description                        |
|---------------------|---------------|------------------------------------|
| `business_id`       | INT           | Primary key.                      |
| `business_name`     | VARCHAR       | Business name.                    |
| `business_description` | TEXT       | Description of the business.      |
| `location`          | VARCHAR       | Physical location.                |
| `hours`             | VARCHAR       | Business operating hours.         |
| `logo_image_url`    | VARCHAR       | URL for the business's logo.      |
| `created_at`        | TIMESTAMP     | Record creation timestamp.        |
| `updated_at`        | TIMESTAMP     | Record update timestamp.          |

### `products`
| Column              | Type          | Description                        |
|---------------------|---------------|------------------------------------|
| `product_id`        | INT           | Primary key.                      |
| `business_id`       | INT           | Foreign key to `businesses`.      |
| `product_name`      | VARCHAR       | Name of the product.              |
| `product_description` | TEXT        | Product details.                  |
| `price`             | DECIMAL       | Price of the product.             |
| `quantity_in_stock` | INT           | Available stock.                  |
| `image_url`         | VARCHAR       | URL for the product image.        |
| `created_at`        | TIMESTAMP     | Record creation timestamp.        |
| `updated_at`        | TIMESTAMP     | Record update timestamp.          |

### `appointments`
| Column              | Type          | Description                        |
|---------------------|---------------|------------------------------------|
| `appointment_id`    | INT           | Primary key.                      |
| `business_id`       | INT           | Foreign key to `businesses`.      |
| `customer_id`       | INT           | Foreign key to `customers`.       |
| `appointment_date`  | DATETIME      | Scheduled appointment date.       |
| `status`            | VARCHAR       | Appointment status.               |
| `created_at`        | TIMESTAMP     | Record creation timestamp.        |
| `updated_at`        | TIMESTAMP     | Record update timestamp.          |

### `reviews`
| Column              | Type          | Description                        |
|---------------------|---------------|------------------------------------|
| `review_id`         | INT           | Primary key.                      |
| `business_id`       | INT           | Foreign key to `businesses`.      |
| `customer_id`       | INT           | Foreign key to `customers`.       |
| `rating`            | INT           | Customer rating for the business. |
| `review_txt`        | TEXT          | Review text.                      |
| `created_at`        | TIMESTAMP     | Record creation timestamp.        |

### `orders`
| Column              | Type          | Description                        |
|---------------------|---------------|------------------------------------|
| `order_id`          | INT           | Primary key.                      |
| `customer_id`       | INT           | Foreign key to `customers`.       |
| `business_id`       | INT           | Foreign key to `businesses`.      |
| `order_date`        | DATETIME      | Date the order was placed.        |
| `total_amount`      | DECIMAL       | Total order amount.               |
| `shipping_address`  | TEXT          | Address for shipping the order.   |
| `created_at`        | TIMESTAMP     | Record creation timestamp.        |
| `updated_at`        | TIMESTAMP     | Record update timestamp.          |


---

## Project Structure

small-business-manager/ | |config/ # Configuration files (e.g., database connection) | | |db.js | |controllers/ # Controllers for handling application logic | | |authController.js | | |customerController.js | | |ownerController.js | |middleware/ # Middleware functions | | |checkProfileCompletion.js | |public/ # Public assets like CSS, images, and JavaScript | | |css/ # CSS files | | |Images/ # Images and logos | | |js/ # JavaScript files | | |uploads # Uploaded files | |routes/ # Application routes | | |authRoutes.js | | |customerRoutes.js | | |ownerRoutes.js | |views/ # HTML files for views | | |index.html | |.gitignore # Files and directories to be ignored by Git | |app.js # Entry point for the application | |README.md # Project documentation
---

## Setup Instructions

### Prerequisites
- Node.js
- MySQL

### Installation
1. Clone the repository:
   ```bash
   git clone <repository-url>

2. Install dependencies:
```bash
npm install
```
3. Configure the database:
Update config/db.js with your MySQL credentials.

4. Run the development server:
```bash
npm start
```
