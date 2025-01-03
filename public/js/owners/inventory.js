document.addEventListener('DOMContentLoaded', () => {

    // Handle the Add Product form
    const addProductForm = document.getElementById('add-product-form');
    if (addProductForm) {
        addProductForm.addEventListener('submit', handleAddProductForm);
    }

    // Add product modal handling
    document.getElementById('add-product-btn').addEventListener('click', openAddProductModal);
    document.getElementById('close-add-product-modal-btn').addEventListener('click', closeAddProductModal);
    document.getElementById('close-modal-btn').addEventListener('click', closeProductModal);

    // Load the products list
    loadProducts();
});

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

// Function to open the product modal
function openProductModal(product) {
    document.getElementById('product-name').textContent = product.product_name;
    document.getElementById('product-image').src = product.image_url;
    document.getElementById('product-price').textContent = product.price;
    document.getElementById('product-quantity').textContent = product.quantity_in_stock;
    document.getElementById('product-description').textContent = product.product_description;

    document.getElementById('product-modal').style.display = 'block';
 
    document.getElementById('edit-description-btn').addEventListener('click', () => {
        const newDescription = prompt('Enter new description:', product.product_description);
        if (newDescription !== null) {
            updateProductDescription(product.product_id, newDescription);
        }
    });

    document.getElementById('add-quantity-btn').addEventListener('click', () => {
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

    document.getElementById('delete-product-btn').addEventListener('click', () => {
        deleteProduct(product.product_id);
    });
}

// Function to update the product description
async function updateProductDescription( productId, newDescription) {
    console.log('Product ID:', productId);
    try {
        const response = await fetch(`/owner/api/update-product-description/${productId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ product_description: newDescription }),
        });

        const data = await response.json();

        if (response.ok) {
            alert('Product description updated successfully');
            window.location.href = '/owner/inventorymanagement'; 
        } else {
            alert(`Error: ${data.error}`);
        }
    } catch (error) {
        console.error('Error updating product description:', error);
        alert('Error updating product description');
    }
}

// Function to update the product price
async function updateProductPrice(productId, newPrice) {
    try {
        const response = await fetch(`/owner/api/update-product-price/${productId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ price: newPrice }),
        });

        const data = await response.json();

        if (response.ok) {
            alert('Product price updated successfully');
            window.location.href = '/owner/inventorymanagement'; 
        } else {
            alert(`Error: ${data.error}`);
        }
    } catch (error) {
        console.error('Error updating product price:', error);
        alert('Error updating product price');
    }
}

// Function to update the product quantity
async function updateProductQuantity(productId, newQuantity) {
    try {
        const response = await fetch(`/owner/api/update-quantity/${productId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ quantity_in_stock: newQuantity }),
        });

        const data = await response.json();

        if (response.ok) {
            alert('Product quantity updated successfully');
            window.location.href = '/owner/inventorymanagement'; 
        } else {
            alert(`Error: ${data.error}`);
        }
    } catch (error) {
        console.error('Error updating product quantity:', error);
        alert('Error updating product quantity');
    }
}

// Function to delete a product
async function deleteProduct(productId) {
    try {
        const response = await fetch(`/owner/api/products/${productId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();

        if (response.ok) {
            alert('Product deleted successfully');
            window.location.href = '/owner/inventorymanagement'; 
        } else {
            alert(`Error: ${data.error}`);
        }
    } catch (error) {
        console.error('Error deleting product:', error);
        alert('Error deleting product');
    }
}

function openAddProductModal() {
    document.getElementById('add-product-modal').style.display = 'block';
}
function closeAddProductModal() {
    document.getElementById('add-product-modal').style.display = 'none';
}

// Handle the form submission for adding a product
async function handleAddProductForm(event) { 
    event.preventDefault(); 

    const productName = document.getElementById('add-product-name').value.trim();
    const price = parseFloat(document.getElementById('add-product-price').value.trim());
    const quantityInStock = parseInt(document.getElementById('add-product-quantity').value.trim(), 10);
    const productDescription = document.getElementById('add-product-description').value.trim();
    const productLogo = document.getElementById('add-product-logo').files[0];

    if (!productName || isNaN(price) || isNaN(quantityInStock) || !productDescription || !productLogo) {
        alert('Please fill all fields correctly');
        return;
    }

    const formData = new FormData();
    formData.append('product_name', productName);
    formData.append('price', price);
    formData.append('quantity_in_stock', quantityInStock);
    formData.append('product_description', productDescription);
    formData.append('logo', productLogo);

    try {
        const response = await fetch('/owner/api/add-product', {
            method: 'POST',
            body: formData,
        });

        const result = await response.json();
        if (response.ok && result.message === 'Product added successfully') {
            alert('Product added successfully');
            window.location.href = '/owner/inventorymanagement'; 
        } else {
            alert('Failed to add product');
        }
    } catch (error) {
        console.error('Error adding product:', error);
        alert('Error adding product');
    }
}

function closeProductModal() {
    document.getElementById('product-modal').style.display = 'none';
}
