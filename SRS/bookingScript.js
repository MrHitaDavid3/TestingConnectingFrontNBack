async function fetchRooms() {
  try {
    const response = await fetch('/api/rooms'); // API call to fetch rooms
    if (!response.ok) throw new Error('Failed to fetch rooms');
    return await response.json(); // Returns an array of rooms
  } catch (error) {
    console.error(error);
    return [];
  }
}

async function reserveRoom(roomId) {
  try {
    const selected = await fetchRoomById(roomId); // Fetch room by ID
    if (selected) {
      const response = await fetch('/api/reserveRoom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selected) // Send the selected room for reservation
      });
      if (response.ok) {
        window.location.href = 'autoCheck.html'; // Redirect to confirmation page
      } else {
        alert('Failed to reserve the room.');
      }
    } else {
      alert('Room not found!');
    }
  } catch (error) {
    console.error(error);
    alert('There was an error reserving the room. Please try again.');
  }
}

async function fetchRoomById(roomId) {
  try {
    const response = await fetch(`/api/rooms/${roomId}`); // Fetch room by ID
    if (!response.ok) throw new Error('Room not found');
    return await response.json();
  } catch (error) {
    console.error(error);
    return null;
  }
}

document.getElementById("room-filter-form").addEventListener("submit", async function (e) {
  e.preventDefault();

  const roomSize = document.getElementById("room-size").value;
  const floor = document.getElementById("floor").value;
  const selectedDay = document.getElementById("day-of-week").value;
  const fromTime = document.getElementById("from-time").value;
  const untilTime = document.getElementById("until-time").value;

  let minCap = 1, maxCap = 99;
  if (roomSize === "1-4") [minCap, maxCap] = [1, 4];
  else if (roomSize === "5-8") [minCap, maxCap] = [5, 8];
  else if (roomSize === "9-12") [minCap, maxCap] = [9, 12];

  const rooms = await fetchRooms(); // Fetch available rooms from the backend

  const filteredRooms = rooms.filter(room => {
    const cap = parseInt(room.capacity);
    const matchesSize = roomSize === "Any" || (cap >= minCap && cap <= maxCap);
    const matchesFloor = floor === "Any" || room.floor === parseInt(floor);

    const roomDay = new Date(room.date).toLocaleDateString('en-US', { weekday: 'long' });
    const matchesDate = roomDay === selectedDay;

    let matchesTime = true;
    if (fromTime && untilTime) {
      const userFrom = timeToMinutes(fromTime);
      const userUntil = timeToMinutes(untilTime);
      const roomFrom = timeToMinutes(room.from);
      const roomUntil = timeToMinutes(room.until);
      matchesTime = roomFrom < userUntil && roomUntil > userFrom;
    }

    return matchesSize && matchesFloor && matchesDate && matchesTime;
  });

  displayRooms(filteredRooms);
});

function displayRooms(rooms) {
  const resultsContainer = document.getElementById("room-results");
  resultsContainer.innerHTML = "";

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

document.getElementById("back-button").addEventListener("click", () => {
  window.location.href = "home.html";
});

function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
}
