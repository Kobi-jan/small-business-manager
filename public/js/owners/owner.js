const form = document.querySelector('#profileSetupForm'); // Replace with the actual ID or selector of your form


form.addEventListener('submit', async function (event) {
    event.preventDefault(); // Prevent default form submission

    const formData = new FormData(form);
    const errorMessages = document.getElementById('errorMessages');

    // Log form data for debugging
    console.log('Submitting form with data:');
    formData.forEach((value, key) => console.log(key, value));

    try {
        const response = await fetch('/owner/complete-profile', {
            method: 'POST',
            body: formData,
            credentials: 'same-origin', // Include cookies with the request
        });

        if (!response.ok) {
            const result = await response.json();
            console.error('Server response error:', result);
            throw new Error(`HTTP error! Status: ${response.status}, Message: ${result.message}`);
        }

        const result = await response.json();

        if (result.success) {
            alert('Your profile has been updated successfully!');
            window.location.href = '/auth/login'; // Redirect to login page after completing profile
        } else {
            errorMessages.textContent = result.message || 'An error occurred. Please try again.';
            errorMessages.style.display = 'block';
        }
    } catch (error) {
        errorMessages.textContent = 'There was an error with the form submission. Please try again later.';
        errorMessages.style.display = 'block';
        console.error('Error during profile completion:', error);
    }
});
