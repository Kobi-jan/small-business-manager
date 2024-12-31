// Wait for the DOM to load
document.addEventListener('DOMContentLoaded', function() {
    fetchProducts(); // Fetch all products when the page loads

    // Add event listener for product search
    document.getElementById('productSearch').addEventListener('input', searchProducts);
    
    // Close search dropdown when the user clicks the close button
    document.getElementById('closeDropdown').addEventListener('click', () => {
        document.getElementById('searchResultsDropdown').style.display = 'none';
    });

    // Add event listener to close the modal
    document.getElementById('closeModal').addEventListener('click', () => {
        document.getElementById('productModal').style.display = 'none';
    });
});

// Fetch all products from the backend and display them
function fetchProducts() {
    fetch('/customers/products')
        .then(response => response.json())
        .then(data => {
            displayProducts(data); // Display all products
        })
        .catch(err => console.error('Error fetching products:', err));
}

// Display products in the online store
function displayProducts(products) {
    const productList = document.getElementById('productList');
    productList.innerHTML = ''; // Clear previous product list

    if (products.length === 0) {
        productList.innerHTML = '<p>No products available.</p>';
        return;
    }

    products.forEach(product => {
        const productDiv = document.createElement('div');
        productDiv.classList.add('product-item');
        productDiv.innerHTML = `
            <img src="${product.image_url}" alt="${product.name}" class="product-image">
            <h3>${product.product_name}</h3>
            <p>$${product.price}</p>
        `;
        productDiv.addEventListener('click', () => showProductModal(product)); // Open modal on product click
        productList.appendChild(productDiv);
    });
}

// Show product details in the modal when clicked
function showProductModal(product) {
    // Set the modal content
    document.getElementById('modalProductImage').src = product.image_url;
    document.getElementById('modalProductName').textContent = product.product_name;
    document.getElementById('modalProductPrice').textContent = `$${product.price}`;
    document.getElementById('modalProductDescription').textContent = product.product_description;
    document.getElementById('modalSellerName').textContent = `Seller: ${product.business_name}`;

    // Show the modal
    document.getElementById('productModal').style.display = 'block';

    // Add to cart functionality
    document.getElementById('addToCartModalBtn').onclick = function() {
        addToCart(product.product_id);
    };
}

// Add product to the cart (store it in localStorage for now)
function addToCart(productId) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart.push(productId);
    localStorage.setItem('cart', JSON.stringify(cart));

    alert('Product added to cart!');
}

// Handle the product search functionality
function searchProducts() {
    const searchTerm = document.getElementById('productSearch').value.toLowerCase();
    
    if (searchTerm === '') {
        document.getElementById('searchResultsDropdown').style.display = 'none';
        return;
    }

    fetch('/customers/products?search=' + searchTerm) // Send search term to the backend
        .then(response => response.json())
        .then(results => {
            showSearchResults(results);
        })
        .catch(err => console.error('Error searching for products:', err));
}

// Display search results in the dropdown
function showSearchResults(results) {
    const dropdown = document.getElementById('searchResultsDropdown');
    const resultsContainer = document.getElementById('searchResultsContainer');

    resultsContainer.innerHTML = ''; // Clear previous results

    if (results.length === 0) {
        resultsContainer.innerHTML = '<p>No results found</p>';
    } else {
        results.forEach(product => {
            const resultItem = document.createElement('div');
            resultItem.classList.add('search-result-item');
            resultItem.innerHTML = `
                <p>${product.product_name}</p>
                <p>$${product.price}</p>
            `;
            resultsContainer.appendChild(resultItem);
        });
    }

    dropdown.style.display = 'block'; // Show the search results dropdown
}
