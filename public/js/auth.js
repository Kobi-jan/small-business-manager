function showError(form, message) {
    const errorMessagesContainer = form.querySelector("#errorMessages");
    if (errorMessagesContainer) {
        errorMessagesContainer.textContent = message;
        errorMessagesContainer.style.display = "block";
    }
}

function clearError(form) {
    const errorMessagesContainer = form.querySelector("#errorMessages");
    if (errorMessagesContainer) {
        errorMessagesContainer.textContent = ''; 
        errorMessagesContainer.style.display = 'none';
    }
}

// Registration form validation
function validateRegistrationForm(form) {
    const email = form.querySelector('input[type="email"]').value.trim();
    const password = form.querySelector('input[name="password"]').value;
    const confirmPassword = form.querySelector('input[name="confirmPassword"]').value;
    const terms = form.querySelector('input[type="checkbox"]');

    const emailPattern = /^(?!@)(?!.*@.*@)(?!.*\.\.)(?!.*\.$)[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

    clearError(form); 

    if (!emailPattern.test(email)) {
        showError(form, 'Please enter a valid email address.');
        return false;
    }

    if (password !== confirmPassword) {
        showError(form, "Passwords do not match.");
        return false;
    }

    if (!terms.checked) {
        showError(form, "You must agree to the terms and conditions.");
        return false;
    }

    return true;
}

// Login form validation
function validateLoginForm(form) {
    const password = form.querySelector('input[name="password"]').value;

    clearError(form); 

    if (!password) {
        showError(form, "Password is required.");
        return false;
    }

    return true;
}

// Submit the form 
function submitForm(form, url) {
    const formData = new FormData(form);  
    const formObject = {};
    
    formData.forEach((value, key) => {
        formObject[key] = value;  
    });

    fetch(url, {
        method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify(formObject), 
})
    .then(response => {
        if (!response.ok) {
            return response.json().then(data => {
                showError(form, data.message || 'An error occurred.');
                throw new Error(data.message || 'Submission failed');
            });
        }
        return response.json(); 
    })
    .then(data => {
        if (data.message) {
            alert(data.message); 
        }
        if (data.redirectUrl) {
            window.location.href = data.redirectUrl; 
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showError(form, error.message || 'An unexpected error occurred.');
    });
}

// Event listeners
document.addEventListener("DOMContentLoaded", () => {
    const businessRegisterForm = document.getElementById("businessRegisterForm");
    const customerRegisterForm = document.getElementById("customerRegisterForm");
    const loginForm = document.getElementById("loginForm");

    if (businessRegisterForm) {
        businessRegisterForm.addEventListener("submit", (e) => {
            e.preventDefault(); 
            if (validateRegistrationForm(businessRegisterForm)) {
                submitForm(businessRegisterForm, '/auth/registerBusiness'); 
            }
        });
    }

    if (customerRegisterForm) {
        customerRegisterForm.addEventListener("submit", (e) => {
            e.preventDefault();
            if (validateRegistrationForm(customerRegisterForm)) {
                submitForm(customerRegisterForm, '/auth/registerCustomer'); 
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault(); 
            console.log("Logging in"); 
            if (validateLoginForm(loginForm)) {
                submitForm(loginForm, '/auth/login'); 
            }
        });
    }
});
