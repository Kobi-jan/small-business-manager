async function loadProducts() {
    try {
        const response = await fetch('/owner/api/get-products');
        const products = await response.json();

        const inventoryContainer = document.getElementById('inventory-container');
        products.forEach(product => {
            const productRow = document.createElement('div');
            productRow.classList.add('product-row');
            productRow.dataset.productId = product.product_id;

            productRow.innerHTML = `
                <img class="product-image" src="${product.image_url}" alt="${product.product_name}" />
                <div class="product-name">${product.product_name}</div>
                <div class="product-quantity">Quantity: ${product.quantity_in_stock}</div>
            `;

            productRow.addEventListener('click', () => openProductModal(product));

            inventoryContainer.appendChild(productRow);
        });
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

function openProductModal(product) {
    document.getElementById('product-name').textContent = product.product_name;
    document.getElementById('product-image').src = product.image_url;
    document.getElementById('product-price').textContent = product.price;
    document.getElementById('product-quantity').textContent = product.quantity_in_stock;
    document.getElementById('product-description').textContent = product.product_description;

    // Show modal
    document.getElementById('product-modal').style.display = 'block';

    // Add functionality to buttons
    document.getElementById('edit-product-btn').addEventListener('click', () => {
        console.log('Edit Product:', product.product_id);
        // Optionally, redirect to product editing page or open an editor form
    });

    document.getElementById('edit-quantity-btn').addEventListener('click', () => {
        const newQuantity = prompt('Enter new quantity:', product.quantity_in_stock);
        if (newQuantity !== null) {
            updateProductQuantity(product.product_id, newQuantity);
        }
    });

    document.getElementById('edit-price-btn').addEventListener('click', () => {
        const newPrice = prompt('Enter new price:', product.price);
        if (newPrice !== null) {
            updateProductPrice(product.product_id, newPrice);
        }
    });
}
function updateProductQuantity(productId, newQuantity) {
    fetch(`/api/update-product-quantity/${productId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ quantity: newQuantity })
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            alert('Quantity updated successfully');
            // Update UI without reloading
            document.getElementById('product-quantity').textContent = newQuantity;
        } else {
            alert('Error updating quantity');
        }
    })
    .catch(error => console.error('Error updating quantity:', error));
}

function updateProductPrice(productId, newPrice) {
    fetch(`/api/update-product-price/${productId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ price: newPrice })
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            alert('Price updated successfully');
            document.getElementById('product-price').textContent = newPrice;
        } else {
            alert('Error updating price');
        }
    })
    .catch(error => console.error('Error updating price:', error));
}

function closeProductModal() {
    document.getElementById('product-modal').style.display = 'none';
}


function openAddProductModal() {
    const addProductModal = document.getElementById('add-product-modal');
    if (addProductModal) {
        addProductModal.style.display = 'block'; // Show the modal
    }
}

function closeAddProductModal() {
    const addProductModal = document.getElementById('add-product-modal');
    if (addProductModal) {
        addProductModal.style.display = 'none'; // Hide the modal
    }
}

async function handleAddProductForm(event) {
    event.preventDefault(); // Prevent default form submission
    console.log('Form submitted');

    // Retrieve form field values
    const productName = document.getElementById('product-name').value.trim();
    const price = parseFloat(document.getElementById('product-price').value.trim());
    const quantityInStock = parseInt(document.getElementById('product-quantity').value.trim(), 10);
    const productDescription = document.getElementById('product-description').value.trim();
    const productLogo = document.getElementById('product-logo').files[0]; // Get the file (image)

    // Debugging: Check the values of the form fields
    console.log({ productName, price, quantityInStock, productDescription, productLogo });

    // Check if any required field is missing
    if (!productName || isNaN(price) || isNaN(quantityInStock) || !productDescription || !productLogo) {
        alert('Please fill all fields correctly');
        return;
    }

    console.log('Product Name:', productName);
    console.log('Price:', price);
    console.log('Description:', productDescription);
    console.log('Quantity:', quantityInStock);

    const formData = new FormData();
    formData.append('product_name', productName);
    formData.append('price', price);
    formData.append('quantity_in_stock', quantityInStock);
    formData.append('product_description', productDescription);
    formData.append('logo', productLogo); // Append the file

    try {
        const response = await fetch('/owner/api/add-product', {
            method: 'POST',
            body: formData // Send the FormData directly without JSON.stringify()
        });

        const result = await response.json();
        if (response.ok && result.message === 'Product added successfully') {
            alert('Product added successfully');
            window.location.href = '/owner/inventorymanagement'; // Reload page to see updated product list
        } else {
            alert('Failed to add product');
        }
    } catch (error) {
        console.error('Error adding product:', error);
        alert('Error adding product');
    }
}




document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded');
    const form = document.getElementById('add-product-form');
    if (form) {
        console.log('Form found, adding event listener');
        form.addEventListener('submit', handleAddProductForm);
    } else {
        console.error('Form not found!');
    }

    const closeModalButton = document.getElementById('close-modal-btn');
    if (closeModalButton) {
        closeModalButton.addEventListener('click', closeProductModal);
    }
});

    

document.addEventListener('DOMContentLoaded', () => {
    // Show modal when "Add Product" button is clicked
    document.getElementById('add-product-btn').addEventListener('click', openAddProductModal);

    // Close the modal when the close button is clicked
    document.getElementById('close-add-product-modal-btn').addEventListener('click', closeAddProductModal);
});

document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
});
