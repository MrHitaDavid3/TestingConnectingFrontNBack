// Handle Login form submission
document.getElementById('loginForm').addEventListener('submit', function (e) {
  e.preventDefault();

  const id = document.getElementById('login-id').value;
  const pin = document.getElementById('login-pin').value;

  // Send login request to the backend
  fetch('http://localhost:3000/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, pin })
  })
  .then(response => response.json())
  .then(user => {
    if (user) {
      if (user.suspended) {
        alert("Your account is currently suspended. Please contact support.");
        return;
      }

      // Save user info to localStorage
      localStorage.setItem('currentUser', JSON.stringify(user));

      // Redirect based on the user's role
      window.location.href = user.role === 'admin' ? "AdminHub.html" : "home.html";
    } else {
      alert("Invalid ID, PIN, or email domain.");
    }
  })
  .catch(error => alert("Login failed. Please try again."));
});

// Signup handler
document.getElementById('signupForm').addEventListener('submit', function (e) {
  e.preventDefault();

  const id = document.getElementById('signup-id').value;
  const pin = document.getElementById('signup-pin').value;
  const email = document.getElementById('signup-email').value;
  const pass = document.getElementById('signup-pass').value;
  const confirm = document.getElementById('signup-confirm').value;
  const agree = document.getElementById('agree-terms').checked;

  // Validation checks
  if (!agree) {
    alert("You must agree to the terms.");
    return;
  }

  if (!email.endsWith("@sjsu.edu")) {
    alert("Only SJSU email addresses are allowed.");
    return;
  }

  if (pass !== confirm) {
    alert("Passwords do not match.");
    return;
  }

  const newUser = { id, pin, email, password: pass };

  // Send signup request to the backend
  fetch('http://localhost:3000/api/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newUser)
  })
  .then(res => res.json())
  .then(result => {
    if (result.success) {
      alert("Account created! You can now log in.");
      document.getElementById('signupForm').reset();
      document.getElementById('show-login').click(); // Switch to login form after signup
    } else {
      alert(result.message);
    }
  })
  .catch(error => alert("Signup failed. Please try again."));
});

// Toggle between login and signup forms
document.getElementById('show-signup').addEventListener('click', function() {
  document.getElementById('login-section').style.display = 'none';
  document.getElementById('signup-section').style.display = 'block';
});

document.getElementById('show-login').addEventListener('click', function() {
  document.getElementById('signup-section').style.display = 'none';
  document.getElementById('login-section').style.display = 'block';
});

// Function to fetch rooms data
function fetchRooms() {
  fetch('http://localhost:3000/api/rooms')
    .then(response => response.json())
    .then(rooms => {
      localStorage.setItem('filteredRooms', JSON.stringify(rooms)); // Store data for use in the next page
      window.location.href = "roomFilter.html"; // Navigate to the filter page
    })
    .catch(error => {
      console.error('Error fetching rooms:', error);
      alert("Error fetching room data.");
    });
}

// Event listener for room filter button
document.getElementById("filter-room").addEventListener("click", fetchRooms);

// Function to handle auto booking
function handleAutoBooking() {
  fetch('http://localhost:3000/api/auto-booking')
    .then(response => response.json())
    .then(bookingInfo => {
      localStorage.setItem('autoBookingInfo', JSON.stringify(bookingInfo)); // Store booking info
      window.location.href = "autoBooking.html"; // Navigate to auto-booking page
    })
    .catch(error => {
      console.error('Error fetching auto-booking data:', error);
      alert("Error fetching booking data.");
    });
}

// Event listener for auto-booking button
document.getElementById("auto-room-book").addEventListener("click", handleAutoBooking);

// Function to handle booking status
function handleBookingStatus() {
  fetch('http://localhost:3000/api/booking-status')
    .then(response => response.json())
    .then(statusData => {
      localStorage.setItem('bookingStatus', JSON.stringify(statusData)); // Store status data
      window.location.href = "bookStat.html"; // Navigate to booking status page
    })
    .catch(error => {
      console.error('Error fetching booking status:', error);
      alert("Error fetching booking status.");
    });
}

// Event listener for booking status button
document.getElementById("booking-status-button").addEventListener("click", handleBookingStatus);

// Function for logout
function handleLogout() {
  fetch('http://localhost:3000/api/logout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  })
  .then(response => response.json())
  .then(result => {
    if (result.success) {
      localStorage.removeItem('currentUser');
      window.location.href = "logIn.html"; // Navigate to login page
    } else {
      alert("Logout failed. Please try again.");
    }
  })
  .catch(error => {
    console.error('Error logging out:', error);
    alert("Logout failed. Please try again.");
  });
}

// Event listener for logout button
document.getElementById("log-out").addEventListener("click", handleLogout);
