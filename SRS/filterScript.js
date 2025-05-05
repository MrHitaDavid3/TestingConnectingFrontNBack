// filterScript.js

// Fetch all rooms from the backend on page load
document.addEventListener("DOMContentLoaded", function () {
  fetchRooms();
});

// Fetch rooms from the backend (initially or after filter change)
function fetchRooms(filters = {}) {
  const queryParams = new URLSearchParams(filters).toString();

  fetch(`https://your-backend-api.com/rooms?${queryParams}`)
    .then(response => response.json())
    .then(rooms => displayRooms(rooms))
    .catch(error => {
      console.error('Error fetching rooms:', error);
      alert('There was an issue fetching the rooms.');
    });
}

// Handle form submission for room filters
document.getElementById("room-filter-form").addEventListener("submit", function (e) {
  e.preventDefault();

  // Collect filter values from the form
  const roomSize = document.getElementById("room-size").value;
  const floor = document.getElementById("floor").value;
  const date = document.getElementById("date").value;
  const fromTime = document.getElementById("from-time").value;
  const untilTime = document.getElementById("until-time").value;

  // Construct the filters object
  const filters = {
    size: roomSize,
    floor: floor,
    date: date,
    fromTime: fromTime,
    untilTime: untilTime,
  };

  // Fetch rooms with the applied filters
  fetchRooms(filters);
});

// Display filtered rooms
function displayRooms(rooms) {
  const resultsContainer = document.getElementById("room-results");
  resultsContainer.innerHTML = ""; // Clear previous results

  if (rooms.length === 0) {
    resultsContainer.innerHTML = "<p>No rooms match your criteria.</p>";
  } else {
    rooms.forEach(room => {
      const roomElement = document.createElement("div");
      roomElement.classList.add("room");
      roomElement.innerHTML = `
        <p><strong>Room ID:</strong> ${room.id}</p>
        <p><strong>Capacity:</strong> ${room.capacity} people</p>
        <p><strong>Floor:</strong> ${room.floor}</p>
        <p><strong>Date:</strong> ${room.date}</p>
        <p><strong>Time:</strong> ${room.from} - ${room.until}</p>
        <button onclick="reserveRoom(${room.id})">Reserve</button>
      `;
      resultsContainer.appendChild(roomElement);
    });
  }
}

// Handle reservation
function reserveRoom(roomId) {
  fetch(`https://your-backend-api.com/rooms/${roomId}`)
    .then(response => response.json())
    .then(room => {
      if (room) {
        localStorage.setItem('selectedRoom', JSON.stringify(room));
        window.location.href = 'checkout.html';
      } else {
        alert('Room not found!');
      }
    })
    .catch(error => {
      console.error('Error reserving room:', error);
      alert('There was an error reserving the room.');
    });
}

// Booking status page navigation
document.getElementById("booking-status-button").addEventListener("click", () => {
  window.location.href = "bookStat.html"; // Update to the correct filename if needed
});

// Handle back button
document.getElementById('back-button')?.addEventListener('click', () => {
  window.location.href = 'home.html'; // Adjust to your actual home page filename
});
