// Function to render the cart items on the page
async function renderCart() {
    const cartItemsContainer = document.getElementById('cartItemsContainer');
    const cartTotal = document.getElementById('cartTotal');

    cartItemsContainer.innerHTML = '';

    try {
        // Fetch the cart items from the backend 
        const response = await fetch('/customers/api/cart');
        const cart = await response.json(); 

        let total = 0;

        // Loop through the cart items and create HTML for each product
        cart.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.classList.add('cart-item');
            
            itemDiv.innerHTML = `
                <img src="${item.imageUrl}" alt="${item.name}" class="cart-item-image"/>
                <div class="cart-item-details">
                    <h4>${item.name}</h4>
                    <p>$${item.price}</p>
                    <p>Quantity: ${item.quantity}</p>
                    <button class="increase-quantity-btn" data-id="${item.productId}">+</button>
                    <button class="decrease-quantity-btn" data-id="${item.productId}" ${item.quantity <= 1 ? 'disabled' : ''}>-</button>
                </div>
                <button class="remove-item-btn" data-id="${item.productId}">Remove</button>
            `;
            
            cartItemsContainer.appendChild(itemDiv);

            total += item.price * item.quantity;
        });

        cartTotal.textContent = total.toFixed(2);

    } catch (error) {
        console.error('Error fetching cart:', error);
    }
}

// Function to handle adding a product to the cart
async function addToCart(product) {
    try {
        const response = await fetch('/customers/cart/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ productId: product.id, quantity: 1 })
        });
        const updatedCart = await response.json();  
        renderCart();  
    } catch (error) {
        console.error('Error adding to cart:', error);
    }
}

// Function to update the quantity of a product in the cart
async function updateQuantity(productId, operation) {
    try {
        const response = await fetch('/customers/cart/update', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ productId: productId, operation: operation })
        });

        const updatedCart = await response.json(); 
        renderCart(updatedCart);  
    } catch (error) {
        console.error('Error updating quantity:', error);
    }
}

async function removeFromCart(productId) {
    try {
        const response = await fetch('/customers/cart/remove', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ productId: productId })
        });

        if (response.ok) {
            const updatedCart = await response.json();  
            renderCart(updatedCart);  
        } else {
            alert('Failed to remove item from cart');
        }
    } catch (error) {
        console.error('Error removing item from cart:', error);
    }
}



// Event listener for removing items from the cart
document.getElementById('cartItemsContainer').addEventListener('click', function(e) {
    if (e.target.classList.contains('remove-item-btn')) {
        const productId = e.target.dataset.id;
        removeFromCart(productId);
    }

    // Handle increasing quantity
    if (e.target.classList.contains('increase-quantity-btn')) {
        const productId = e.target.dataset.id;
        updateQuantity(productId, 'increase');
    }

    // Handle decreasing quantity
    if (e.target.classList.contains('decrease-quantity-btn')) {
        const productId = e.target.dataset.id;
        updateQuantity(productId, 'decrease');
    }
});

// Function to handle checkout process, including the shipping address
async function handleCheckout() {
    // Get the shipping address from the input field
    const shippingAddress = document.getElementById("shippingAddress").value.trim();

    if (!shippingAddress) {
        alert("Please enter a shipping address.");
        return;
    }

    try {
        const response = await fetch('/customers/api/cart');
        const cart = await response.json(); // Get cart from the server
        const totalAmount = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

        // Sending shipping address and cart details to the backend
        const checkoutResponse = await fetch('/customers/checkout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                shippingAddress: shippingAddress,
                cart: cart,
                totalAmount: totalAmount
            })
        });

        const data = await checkoutResponse.json();
        console.log('Checkout response:', data);

        if (data.status === 'paid') {
            alert('Order successful!');
            // Redirect to order confirmation page or clear the cart
            window.location.href = '/customers/order-history';
        } else {
            alert('Payment failed!');
        }
    } catch (error) {
        console.error('Error during checkout:', error);
    }
}
// Event listener for checkout button
document.getElementById('checkoutBtn').addEventListener('click', handleCheckout);

// Initialize the cart on page load
document.addEventListener('DOMContentLoaded', renderCart);
