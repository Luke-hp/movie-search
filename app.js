const apiKey = "f3c83496";
const searchButton = document.getElementById("search-button");
const movieSearch = document.getElementById("movie-search");
const resultsContainer = document.getElementById("results-container");

// Add these new variables
let currentPage = 1;
const moviesPerPage = 8;
let currentMovies = [];
const heroSection = document.querySelector('.hero');
const searchSection = document.querySelector('.search');
const resultsSection = document.querySelector('.results-section');
const prevButton = document.getElementById('prev-page');
const nextButton = document.getElementById('next-page');
const pageInfo = document.getElementById('page-info');
const movieGrid = document.querySelector('.movie-grid')

// Add these at the top with your other variables
const yearFilter = document.querySelector(".year-filter")
const startYear = document.querySelector('.start-year');
const endYear = document.querySelector('.end-year');
const startYearValue = document.getElementById('start-year');
const endYearValue = document.getElementById('end-year');

const sortDropdown = document.getElementById('sort-drop');

const loader = document.querySelector('.results-loader-container')


searchButton.addEventListener("click", searchMovies);

async function searchMovies() {
  const searchTerm = movieSearch.value.trim();
  
  // Add validation for search term length
  if (searchTerm.length < 3) {
    resultsContainer.innerHTML = `
      <div class="error-message">
        <p>Please enter at least 3 characters to search.</p>
      </div>
    `;
    return;
  }

  const url = `https://www.omdbapi.com/?s=${searchTerm}&apikey=${apiKey}&type=movie`;

  try {
    // Hide hero and adjust search position
    heroSection.classList.add('hidden');
    searchSection.classList.add('active');
    resultsSection.classList.remove('hidden');
    sortDropdown.classList.add('hidden')
    yearFilter.classList.add('hidden')
    movieGrid.classList.add('hidden')
    loader.classList.remove('hidden')

    const response = await new Promise((resolve) => {
      setTimeout(() => {
        const result = fetch(url)
        resolve(result)
      }, 2000);
    })

    const data = await response.json();
    
    // Add console.log to debug API response
    console.log('API Response:', data);
    
    if (data.Response === "True" && data.Search && data.Search.length > 0) {
      currentMovies = data.Search;
      currentPage = 1;
      // Reset year filter to default values
      startYear.value = startYear.min;
      endYear.value = endYear.max;
      loader.classList.add('hidden')
      sortDropdown.classList.remove('hidden')
      yearFilter.classList.remove('hidden')
      movieGrid.classList.remove('hidden')
      setupYearFilter(); // Reset the slider visual
      displayResults(currentMovies);
    } else {
      loader.classList.add('hidden')
      sortDropdown.classList.remove('hidden')
      yearFilter.classList.remove('hidden')
      let errorMessage = "No movies found.";
      if (data.Error === "Too many results.") {
        errorMessage = `Your search "${searchTerm}" returned too many results. Please try a more specific search term.`;
        loader.classList.add('hidden')
        sortDropdown.classList.remove('hidden')
        yearFilter.classList.remove('hidden')
      }
      resultsContainer.innerHTML = `
        <div class="error-message">
          <p>${errorMessage}</p>
        </div>
      `;
    }
  } catch (error) {
    console.error('Search Error:', error);
    resultsContainer.innerHTML = `
      <div class="error-message">
        <p>An error occurred while fetching data. Please try again later.</p>
      </div>
    `;
  }
}

// Iterates through array "Search" which 
// is returned from API call when searching for movies
function displayResults(movies) {
  resultsContainer.innerHTML = "";
  
  // Create a copy of movies array to sort
  let sortedMovies = [...movies];
  
  // Sort movies based on selected option
  if (sortDropdown.value !== 'none') {
    sortedMovies.sort((a, b) => {
      const yearA = parseInt(a.Year);
      const yearB = parseInt(b.Year);
      return sortDropdown.value === 'asc' ? yearA - yearB : yearB - yearA;
    });
  }

  // Calculate pagination
  const startIndex = (currentPage - 1) * moviesPerPage;
  const endIndex = startIndex + moviesPerPage;
  const moviesToShow = sortedMovies.slice(startIndex, endIndex);

  moviesToShow.forEach((movie) => {
    const movieCard = document.createElement("div");
    movieCard.classList.add("movie-card");
    movieCard.innerHTML = `
        <img src="${movie.Poster}" alt="${movie.Title} poster">
        <div class="movie-info">
            <h2>${movie.Title}</h2>
            <p>${movie.Year}</p>
            <p>${movie.Type}</p>
        </div>
    `;
    resultsContainer.appendChild(movieCard);
  });

  updatePaginationControls(sortedMovies.length);
}

// Add new function for pagination controls
function updatePaginationControls(totalMovies) {
  const totalPages = Math.ceil(totalMovies / moviesPerPage);
  pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
  prevButton.disabled = currentPage === 1;
  nextButton.disabled = currentPage >= totalPages;
}

// Add event listeners for pagination
prevButton.addEventListener('click', () => {
  if (currentPage > 1) {
    currentPage--;
    displayResults(currentMovies);
  }
});

nextButton.addEventListener('click', () => {
  const totalPages = Math.ceil(currentMovies.length / moviesPerPage);
  if (currentPage < totalPages) {
    currentPage++;
    displayResults(currentMovies);
  }
});

// Add Enter key support for search
movieSearch.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    searchMovies();
  }
});

function setupYearFilter() {
  function updateSlider() {
    const start = parseInt(startYear.value);
    const end = parseInt(endYear.value);
    
    startYearValue.textContent = start;
    endYearValue.textContent = end;
    
    // Calculate percentages for the track fill
    const min = parseInt(startYear.min);
    const max = parseInt(startYear.max);
    const startPercent = ((start - min) / (max - min)) * 100;
    const endPercent = ((end - min) / (max - min)) * 100;
    
    // Update the track fill
    document.querySelector('.slider-track').style.background = 
      `linear-gradient(to right, 
        #ddd ${startPercent}%, 
        #3498db ${startPercent}%, 
        #3498db ${endPercent}%, 
        #ddd ${endPercent}%
      )`;
  }

  // Event listeners for both sliders
  startYear.addEventListener('input', function() {
    if (parseInt(startYear.value) > parseInt(endYear.value)) {
      startYear.value = endYear.value;
    }
    updateSlider();
    filterMoviesByYear();
  });

  endYear.addEventListener('input', function() {
    if (parseInt(endYear.value) < parseInt(startYear.value)) {
      endYear.value = startYear.value;
    }
    updateSlider();
    filterMoviesByYear();
  });

  // Initialize the slider
  updateSlider();
}

// Add event listener for sort dropdown
sortDropdown.addEventListener('change', () => {
  currentPage = 1; // Reset to first page when sorting
  filterMoviesByYear(); // Reapply filters and sorting
})

function filterMoviesByYear() {
  if (!currentMovies) return;
  
  const minYear = parseInt(startYear.value);
  const maxYear = parseInt(endYear.value);
  
  const filteredMovies = currentMovies.filter(movie => {
    const year = parseInt(movie.Year);
    return year >= minYear && year <= maxYear;
  });
  
  displayResults(filteredMovies);
}

// Initialize the slider when the page loads
document.addEventListener('DOMContentLoaded', setupYearFilter);
