document.addEventListener('DOMContentLoaded', function () {
    const reviewsContainer = document.getElementById('reviews-container');

    // Function to fetch and display reviews
    function fetchReviews() {
        fetch('/customers/api/reviews') 
            .then(response => response.json())
            .then(data => {
                reviewsContainer.innerHTML = ''; 

                if (data.message) {
                    // No reviews found
                    reviewsContainer.innerHTML = `<p>${data.message}</p>`;
                } else {
                    // Display each review
                    data.forEach(review => {
                        const reviewDiv = document.createElement('div');
                        reviewDiv.classList.add('review-card');

                        reviewDiv.innerHTML = `
                            <div class="business-logo">
                                <img src="${review.business_logo || '/Images/default-logo.png'}" alt="${review.business_name} Logo">
                            </div>
                            <h3>${review.business_name}</h3>
                            <p>Rating: ${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</p>
                            <p>${review.review_txt}</p>
                        `;

                        reviewsContainer.appendChild(reviewDiv);
                    });
                }
            })
            .catch(error => {
                console.error('Error fetching reviews:', error);
                reviewsContainer.innerHTML = '<p>There was an error loading your reviews.</p>';
            });
    }

    // Fetch reviews on page load
    fetchReviews();
});
