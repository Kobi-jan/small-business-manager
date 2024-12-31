document.addEventListener('DOMContentLoaded', async () => {
    // Fetch business overview data
    try {
        const response = await fetch('/owner/api/business-overview');
        const data = await response.json();
        
        console.log('Fetched Business Overview Data:', data); // Debugging line to see the structure

        if (data) {
            // Populate the Business Overview section
            document.getElementById('business-name').textContent = data.business_name;
            document.getElementById('business-description').textContent = data.business_description;
            document.getElementById('business-location').textContent = data.location;
            document.getElementById('business-hours').textContent = `${data.opening_time} - ${data.closing_time}`;
            document.getElementById('business-logo').src = data.logo_image_url || '/Images/default-logo.png'; // Fallback if no logo
            
            // Log total_sales to see its actual value
            const totalSales = data.total_sales;
            console.log('Total Sales:', totalSales); // Debugging line for total_sales value

            // Ensure total_sales is treated as a number
            const formattedTotalSales = Number(totalSales); // Explicitly convert to number
            console.log('Formatted Total Sales:', formattedTotalSales); // Debugging line for formatted total sales

            // Ensure it's a valid number, and then apply toFixed
            document.getElementById('total-sales').textContent = `$${isNaN(formattedTotalSales) ? 0 : formattedTotalSales.toFixed(2)}`;

            document.getElementById('total-appointments').textContent = data.total_appointments;
            document.getElementById('total-reviews').textContent = data.total_reviews;
        }
    } catch (error) {
        console.error('Error fetching business overview:', error);
    }

    // Fetch reviews from the backend
    try {
        const reviewResponse = await fetch('/owner/api/reviews');
        const reviews = await reviewResponse.json();
        console.log('Fetched Reviews:', reviews);

        // Check if reviews is an array and has content
        const reviewList = document.getElementById('reviewList');
        if (Array.isArray(reviews) && reviews.length > 0) {
            // Display review cards if there are reviews
            reviews.forEach(review => {
                const reviewCard = document.createElement('div');
                reviewCard.classList.add('review-card');
                
                reviewCard.innerHTML = ` 
                    <div class="review-header">
                        <span><strong>${review.first_name} ${review.last_name}</strong></span>
                        <span>${review.rating} / 5</span>
                        <span>${new Date(review.created_at).toLocaleDateString()}</span>
                    </div>
                    <div class="review-body">
                        <p>${review.review_txt}</p>
                    </div>
                `;
                
                // Append review card to the list
                reviewList.appendChild(reviewCard);
            });
        } else {
            // If no reviews, display a message
            reviewList.innerHTML = '<p class="no-reviews">No reviews yet.</p>';
        }
    } catch (error) {
        console.error('Error fetching reviews:', error);
    }
});
