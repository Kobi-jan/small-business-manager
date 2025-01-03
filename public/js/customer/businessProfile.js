document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('appointmentForm').addEventListener('submit', async function(event) {
        event.preventDefault();  // Prevent default form submission

        const appointmentDate = document.getElementById('appointmentDate').value;
        const appointmentTime = document.getElementById('appointmentTime').value;
        const businessId = window.location.pathname.split("/").pop(); // Extract businessId from URL

        if (!appointmentDate || !appointmentTime) {
            alert('Please select both date and time.');
            return;
        }

        const appointmentDateTime = `${appointmentDate}T${appointmentTime}`;

        try {
            const response = await fetch(`/customers/api/appointments/${businessId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    appointmentDateTime
                })
            });

            const data = await response.json();

            if (response.ok) {
                document.getElementById('appointmentConfirmation').textContent = `Appointment scheduled for ${appointmentDateTime}.`;
            } else {
                document.getElementById('appointmentConfirmation').textContent = `Error: ${data.error || 'Unable to schedule appointment'}`;
            }
        } catch (error) {
            console.error('Error scheduling appointment:', error);
            document.getElementById('appointmentConfirmation').textContent = 'An error occurred while scheduling your appointment.';
        }
    });
});

  let selectedRating = null; 

  // Handle star clicks to set the rating
  document.querySelectorAll('.star').forEach(star => {
      star.addEventListener('click', function() {
          selectedRating = this.getAttribute('data-value'); 

          updateStars(selectedRating);
      });
  });
  
  // Function to update the stars based on the selected rating
  function updateStars(rating) {
      const stars = document.querySelectorAll('.star');
      stars.forEach(star => {
          if (star.getAttribute('data-value') <= rating) {
              star.classList.add('selected');
          } else {
              star.classList.remove('selected');
          }
      });
  }
  
  // Handle submit review 
  document.getElementById('leaveReviewBtn').addEventListener('click', async function() {
    const reviewText = document.getElementById('reviewText').value; 
    if (!selectedRating) {
        alert('Please select a rating.');
        return;
    }

    const review = {
        rating: selectedRating, 
        review_txt: reviewText.trim() || null 
    };

    const businessId = window.location.pathname.split("/").pop(); 

    try {
        // Send the new review to the server
        const response = await fetch(`/customers/api/leaveReview/${businessId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(review)
        });

        const data = await response.json();

        if (response.ok) {
            // Reload the page to fetch and display the updated reviews
            window.location.reload();
        } else {
            console.error('Error submitting review:', data.error);
            alert('There was an error submitting your review. Please try again.');
        }
    } catch (error) {
        console.error('Error submitting review:', error);
        alert('An error occurred. Please try again later.');
    }
});



document.getElementById('sendMessageBtn').addEventListener('click', async function() {
    const messageText = document.getElementById('messageText').value.trim();
    if (messageText) {
        const businessId = window.location.pathname.split("/").pop(); 
        const message = {
            message_text: messageText,
        };

        try {
            const response = await fetch(`/customers/api/sendMessage/${businessId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(message),
            });

            const data = await response.json();

            if (response.ok) {
                document.getElementById('messageText').value = '';  
                fetchMessages();  
            } else {
                alert('Error sending message.');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            alert('An error occurred while sending the message.');
        }
    } else {
        alert('Please enter a message.');
    }
});


