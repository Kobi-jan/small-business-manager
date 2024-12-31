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

// document.getElementById('leaveReviewBtn').addEventListener('click', function() {
//     const rating = document.querySelector('input[name="rating"]:checked'); // Assuming you have radio buttons for rating
//     const reviewText = document.getElementById('reviewText').value;  // Assuming a text area for review text
  
//     if (!rating) {
//       alert('Please select a rating.');
//       return;
//     }
  
//     const reviewData = {
//       rating: rating.value,
//       review_txt: reviewText || null  // If reviewText is empty, set it as null
//     };
  
//     const businessId = window.location.pathname.split('/').pop();  // Extract businessId from URL
  
//     fetch(`/customers/api/reviews/${businessId}`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json'
//       },
//       body: JSON.stringify(reviewData)
//     })
//     .then(response => response.json())
//     .then(data => {
//       // Display the updated reviews
//       displayReviews(data.reviews);
//     })
//     .catch(err => console.error('Error submitting review:', err));
//   });
  
//   function displayReviews(reviews) {
//     const reviewsList = document.getElementById('reviewsList');
//     reviewsList.innerHTML = ''; // Clear existing reviews
    
//     reviews.forEach(review => {
//       const reviewItem = document.createElement('li');
//       reviewItem.classList.add('review-item');
//       reviewItem.innerHTML = `
//         <strong>(${review.rating} Stars)</strong> 
//         <br><strong>${review.first_name}</strong> 
//         ${review.review_txt ? `<p>${review.review_txt}</p>` : ''}
//         <br><small>${new Date(review.created_at).toLocaleString()}</small>
//       `;
//       reviewsList.appendChild(reviewItem);
//     });
//   }
  

  let selectedRating = null; // To store the selected rating

  // Handle star clicks to set the rating
  document.querySelectorAll('.star').forEach(star => {
      star.addEventListener('click', function() {
          selectedRating = this.getAttribute('data-value'); // Get the value of the clicked star
  
          // Update the stars' appearance
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
  
  // Handle submit review button click
  document.getElementById('leaveReviewBtn').addEventListener('click', async function() {
    const reviewText = document.getElementById('reviewText').value; // Get review text

    if (!selectedRating) {
        alert('Please select a rating.');
        return;
    }

    const review = {
        rating: selectedRating, // Use the selected rating
        review_txt: reviewText.trim() || null // Optional review text
    };

    const businessId = window.location.pathname.split("/").pop(); // Extract businessId from URL

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
