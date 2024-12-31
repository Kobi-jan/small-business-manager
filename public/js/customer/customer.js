// Function to populate the carousel with businesses
function populateCarousel(businesses) {
const carouselSlide = document.querySelector('.carousel-slide');
carouselSlide.innerHTML = ''; // Clear previous content
console.log("Businesses: ", businesses);

businesses.forEach(business => {
  const businessDiv = document.createElement('div');
  businessDiv.classList.add('business-container');

  const stars = generateStars(business.average_rating);

  businessDiv.innerHTML = `
    <div class="business-logo">
      <img src="${business.logo_image_url || '/Images/default-logo.png'}" alt="${business.business_name} Logo" />
    </div>
    <div class="business-info">
      <h3>${business.business_name}</h3>
      <p class="rating">${stars}</p>
      <a class="view-button" href="/customers/business/${business.business_id}">View Details</a>
    </div>
  `;

  carouselSlide.appendChild(businessDiv);
});

// Initialize carousel
setupCarousel();
}

// Function to generate stars based on rating
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

// Carousel logic
let currentIndex = 0;

function setupCarousel() {
const carouselSlide = document.querySelector('.carousel-slide');
const totalItems = carouselSlide.children.length;
const itemsToShow = 3;
const slideWidth = carouselSlide.firstElementChild.offsetWidth;

// Adjust carousel width
carouselSlide.style.width = `${totalItems * slideWidth}px`;

// Function to move the carousel
window.moveCarousel = function(direction) {
  if (direction === 'prev') {
    currentIndex = currentIndex > 0 ? currentIndex - 1 : 0;
  } else if (direction === 'next') {
    const maxIndex = Math.ceil(totalItems / itemsToShow) - 1;
    currentIndex = currentIndex < maxIndex ? currentIndex + 1 : maxIndex;
  }

  const newTransform = -currentIndex * itemsToShow * slideWidth;
  carouselSlide.style.transform = `translateX(${newTransform}px)`;
};
}

// Search input logic
document.getElementById('businessSearch').addEventListener('input', function() {
const searchTerm = this.value;

// Send the search request to the server
fetch(`/customers/search?searchTerm=${searchTerm}`)
  .then(response => response.json())
  .then(data => {
    displaySearchResults(data);
  })
  .catch(err => console.error('Error fetching search results:', err));
});

function displaySearchResults(businesses) {
const resultsDiv = document.getElementById('searchResultsContainer');
const dropdown = document.getElementById('searchResultsDropdown');
resultsDiv.innerHTML = ''; // Clear previous results

if (businesses.length === 0) {
    resultsDiv.innerHTML = '<p>No businesses found.</p>';
    dropdown.style.display = 'none'; // Hide dropdown if no results
    return;
}

businesses.forEach(business => {
  console.log("Business ID: ", business);

  const businessDiv = document.createElement('div');
  businessDiv.classList.add('business-result');
  
  // Create HTML structure with logo and details
  businessDiv.innerHTML = `
      <div class="business-logo">
          <img src="${business.logo_image_url || '/Images/default-logo.png'}" alt="${business.business_name} logo" />
      </div>
      <h3>${business.business_name}</h3>
      <p>${business.location} - ${business.category}</p>
      <a href="/customers/business/${business.business_id}" class="view-details-btn">View Details</a>
  `;
  
  resultsDiv.appendChild(businessDiv);
});

dropdown.style.display = 'block'; // Show the dropdown with results
}

// Close dropdown when clicking the "X" button
document.getElementById('closeDropdown').addEventListener('click', function() {
document.getElementById('searchResultsDropdown').style.display = 'none';
});

// Fetch featured businesses from the server
fetch('/customers/featured')
.then(response => response.json())
.then(data => {
  populateCarousel(data);
})
.catch(err => console.error('Error fetching featured businesses:', err));
