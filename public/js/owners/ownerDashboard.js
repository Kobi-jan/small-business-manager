document.addEventListener('DOMContentLoaded', async () => {

    function generateStars(rating) {
        const fullStars = Math.floor(rating);
        const emptyStars = 5 - fullStars;
        let stars = '';
        
        for (let i = 0; i < fullStars; i++) {
          stars += '★';
        }
        
        for (let i = 0; i < emptyStars; i++) {
          stars += '☆';
        }
        
        return stars;
        }

    // Fetch business overview data
    try {
        const response = await fetch('/owner/api/business-overview');
        const data = await response.json();
        const stars = generateStars(data.average_rating);
        

        if (data) {
            // Populate the Business Overview section
            document.getElementById('business-name').textContent = data.business_name;
            document.getElementById('business-description').textContent = data.business_description;
            document.getElementById('business-location').textContent = data.location;
            document.getElementById('business-hours').textContent = `${data.opening_time} - ${data.closing_time}`;
            document.getElementById('business-logo').src = data.logo_image_url || '/Images/default-logo.png'; 
            document.getElementById('average-rating').textContent = stars;

            const totalSales = data.total_sales;

            const formattedTotalSales = Number(totalSales);  

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

    if (!reviewResponse.ok) {
        throw new Error('Failed to fetch reviews');
    }

    const reviews = await reviewResponse.json();
    const reviewList = document.getElementById('reviewList');

    reviewList.innerHTML = '';

    if (Array.isArray(reviews) && reviews.length > 0) {
        // Display review cards if there are reviews
        reviews.forEach(review => {
            const reviewCard = document.createElement('div');
            reviewCard.classList.add('review-card');
            
            reviewCard.innerHTML = ` 
                <div class="review-header">
                    <span><strong>${review.first_name}</strong></span>
                    <br><span>${generateStars(review.rating)}</span>
                    <br><span>${new Date(review.created_at).toLocaleDateString()}</span>
                </div>
                <div class="review-body">
                    <p>${review.review_txt}</p>
                </div>
            `;
            
            // Append review card to the list
            reviewList.appendChild(reviewCard);
        });
    } else {
        reviewList.innerHTML = '<p class="no-reviews">No reviews yet.</p>';
    }
} catch (error) {
    console.error('Error fetching reviews:', error);

    const reviewList = document.getElementById('reviewList');
    reviewList.innerHTML = '<p class="error-message">Failed to load reviews. Please try again later.</p>';
    }
});