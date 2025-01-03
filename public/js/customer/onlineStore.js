document.addEventListener('DOMContentLoaded', function() {
    fetchProducts(); // Fetch products when the page loads

    document.getElementById('productSearch').addEventListener('input', searchProducts);
    document.getElementById('businessSearch').addEventListener('input', searchBusinesses);
    document.getElementById('closeProductDropdown').addEventListener('click', () => {
        document.getElementById('searchResultsDropdown').style.display = 'none';
    });
    document.getElementById('closeBusinessDropdown').addEventListener('click', () => {
        document.getElementById('searchResultsDropdownBusiness').style.display = 'none';
    });
    document.getElementById('productModal').addEventListener('click', function(event) {
        if (event.target === document.getElementById('productModal')) {
            closeModal(); 
        }
    });
    
    // Close modal buttons
    const closeModalBtn = document.getElementById('closeModal');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
        console.log('closeModal button listener attached');
    } else {
        console.error('closeModal button not found');
    }

    const closeModalBtnAlt = document.getElementById('closeModalBtn');
    if (closeModalBtnAlt) {
        closeModalBtnAlt.addEventListener('click', closeModal);
        console.log('closeModalBtn button listener attached');
    } else {
        console.error('closeModalBtn button not found');
    }
});



// Fetch all products from the backend
function fetchProducts() {
    fetch('/customers/products')
        .then(response => response.json())
        .then(data => {
            displayProducts(data); 
        })
        .catch(err => console.error('Error fetching products:', err));
}

// Display products in the online store
function displayProducts(products) {
    const productList = document.getElementById('productList');
    productList.innerHTML = ''; 

    if (products.length === 0) {
        productList.innerHTML = '<p>No products available.</p>';
        return;
    }

    products.forEach(product => {
        const productDiv = document.createElement('div');
        productDiv.classList.add('product-item');
        productDiv.innerHTML = `
            <img src="${product.image_url}" alt="${product.product_name}" class="product-image">
            <h3>${product.product_name}</h3>
            <p>$${product.price}</p>
        `;
        productDiv.addEventListener('click', () => showProductModal(product)); 
        productList.appendChild(productDiv); 
    });
}

// Function to show a modal with product details
function showProductModal(product) { 

    // Populate modal using innerHTML
    const modalContent = `
        <div class="modal-content">
            <span id="closeModal" class="close-btn">&times;</span>
            <img src="${product.image_url}" alt="${product.product_name}" class="modal-image">
            <h3>${product.product_name}</h3>
            <p>$${product.price}</p>
            <p>${product.product_description}</p>
            <p>Seller: ${product.business_name}</p>
            <button id="addToCartModalBtn" data-product-id="${product.product_id}">Add to Cart</button>
            <button id="closeModalBtn">Close</button>
        </div>
    `;

    const modal = document.getElementById('productModal');
    modal.innerHTML = modalContent;

    // Show the modal
    modal.classList.add('show');
    modal.style.display = 'block';

    document.getElementById('closeModal').addEventListener('click', closeModal);
    document.getElementById('closeModalBtn').addEventListener('click', closeModal);
    document.getElementById('addToCartModalBtn').addEventListener('click', () => addToCart(product.product_id));
}

// Function to add a product to the cart 
async function addToCart(productId) {
    try {
        const response = await fetch('/customers/cart/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ productId: productId, quantity: 1 })  
        });

        // Check if the request was successful
        if (response.ok) {
            const updatedCart = await response.json();  
            console.log('Updated cart:', updatedCart);

            alert('Product added to cart!');
        } else {
            alert('Failed to add product to cart.');
        }
    } catch (error) {
        console.error('Error adding product to cart:', error);
    }
}

// Product search functionality
function searchProducts() {
    const searchTerm = document.getElementById('productSearch').value.toLowerCase();
    
    if (searchTerm === '') {
        document.getElementById('searchResultsDropdown').style.display = 'none';
        return;
    }

    fetch('/customers/products?search=' + searchTerm) 
        .then(response => response.json())
        .then(results => {
            showSearchResults(results);
        })
        .catch(err => console.error('Error searching for products:', err));
}

function searchBusinesses() {
    const searchTerm = document.getElementById('businessSearch').value.toLowerCase();
    
    if (searchTerm === '') {
        document.getElementById('searchResultsDropdown').style.display = 'none';
        return;
    }

    fetch(`/customers/search?searchTerm=${searchTerm}`)
        .then(response => response.json())
        .then(results => {
            showSearchResultsBusiness(results);
        })
        .catch(err => console.error('Error searching for business:', err));
}


// Display search results in the dropdown
function showSearchResults(results) {
    const dropdown = document.getElementById('searchResultsDropdown');
    const resultsContainer = document.getElementById('searchResultsContainer');

    resultsContainer.innerHTML = ''; 

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

    dropdown.style.display = 'block'; 
}

// Display search results in the dropdown
function showSearchResultsBusiness(results) {
    const dropdown = document.getElementById('searchResultsDropdownBusiness');
    const resultsContainer = document.getElementById('searchResultsContainerBusiness');

    resultsContainer.innerHTML = ''; 

    if (results.length === 0) {
        resultsContainer.innerHTML = '<p>No results found</p>';
    } else {
        results.forEach(business => {
            const resultItem = document.createElement('div');
            resultItem.classList.add('search-result-item');
            resultItem.innerHTML = `
                <div class="business-logo">
          <img src="${business.logo_image_url || '/Images/default-logo.png'}" alt="${business.business_name} logo" />
      </div>
      <h3>${business.business_name}</h3>
      <p>${business.location} - ${business.category}</p>
      <a href="/customers/business/${business.business_id}" class="view-details-btn">View Details</a>
           ` ;
            resultsContainer.appendChild(resultItem);
        });
    }

    dropdown.style.display = 'block'; 
}

function closeModal() {
    const modal = document.getElementById('productModal');
    if (modal) {
        modal.classList.remove('show');  
        modal.style.display = 'none';   
        modal.innerHTML = '';  
    } else {
        console.error('Modal not found');
    }
}