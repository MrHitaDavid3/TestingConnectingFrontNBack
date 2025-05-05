document.getElementById("filter-room").addEventListener("click", () => {
  // Example API call to get available rooms or filter data
  fetch('http://localhost:3000/api/rooms')
      .then(response => response.json())
      .then(rooms => {
          // You can process the rooms data here if needed
          localStorage.setItem('filteredRooms', JSON.stringify(rooms)); // Store data for use in the next page
          window.location.href = "roomFilter.html"; // Navigate to the filter page
      })
      .catch(error => {
          console.error('Error fetching rooms:', error);
          alert("Error fetching room data.");
      });
});

document.getElementById("auto-room-book").addEventListener("click", () => {
  // Example API call to get room availability for auto-booking
  fetch('http://localhost:3000/api/auto-booking')
      .then(response => response.json())
      .then(bookingInfo => {
          // Process the booking data here if needed
          localStorage.setItem('autoBookingInfo', JSON.stringify(bookingInfo)); // Store booking info
          window.location.href = "autoBooking.html"; // Navigate to auto-booking page
      })
      .catch(error => {
          console.error('Error fetching auto-booking data:', error);
          alert("Error fetching booking data.");
      });
});

document.getElementById("booking-status-button").addEventListener("click", () => {
  // Fetch booking status data from backend
  fetch('http://localhost:3000/api/booking-status')
      .then(response => response.json())
      .then(statusData => {
          // Process status data here if needed
          localStorage.setItem('bookingStatus', JSON.stringify(statusData)); // Store status data
          window.location.href = "bookStat.html"; // Navigate to booking status page
      })
      .catch(error => {
          console.error('Error fetching booking status:', error);
          alert("Error fetching booking status.");
      });
});

  // document.getElementById("check-in").addEventListener("click", () => {
  //   window.location.href = "Checkin/Checkin.html";
  // });
  
  document.getElementById("log-out").addEventListener("click", () => {
    // Make a logout request to the backend if necessary
    fetch('http://localhost:3000/api/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            // Clear any local storage or session data
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
});
