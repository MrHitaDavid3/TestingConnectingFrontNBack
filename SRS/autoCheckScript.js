async function fetchSelectedRoom() {
  try {
    const response = await fetch('/api/selectedRoom'); // API call to get the selected room
    if (!response.ok) throw new Error('Failed to fetch selected room');
    return await response.json();
  } catch (error) {
    console.error(error);
    return null;
  }
}

async function fetchBookingHistory() {
  try {
    const response = await fetch('/api/bookings');
    if (!response.ok) throw new Error('Failed to fetch booking history');
    return await response.json();
  } catch (error) {
    console.error(error);
    return [];
  }
}

async function saveBookings(bookings) {
  try {
    const response = await fetch('/api/bookings', {
      method: 'POST',
      body: JSON.stringify(bookings),
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.ok) {
      const result = await response.json();
      return result;
    } else {
      throw new Error('Failed to save bookings');
    }
  } catch (error) {
    console.error(error);
    return null;
  }
}

async function handleBooking() {
  const room = await fetchSelectedRoom(); // Fetch selected room from the backend

  if (!room) {
    document.querySelector('.checkout-container').innerHTML = `
      <h2>Confirm Your Booking</h2>
      <div style="background-color:#f8d7da; color:#721c24; padding: 12px; border-radius: 5px; font-weight: bold;">
        ⚠️ No room selected. Please go back and choose a room.
      </div>
    `;
    return;
  }

  document.getElementById('booking-details').innerHTML = `
    <p><strong>Room ID:</strong> ${room.id}</p>
    <p><strong>Capacity:</strong> ${room.capacity} people</p>
    <p><strong>Floor:</strong> ${room.floor}</p>
    <p><strong>Start Date:</strong> ${room.date}</p>
    <p><strong>Time:</strong> ${formatTo12Hour(room.from)} - ${formatTo12Hour(room.until)}</p>
    <p><strong>Recurring:</strong> 5 Weeks</p>
  `;

  document.getElementById('checkout-form').addEventListener('submit', async function (e) {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const group = document.getElementById('group').value.trim();

    const startDate = new Date(room.date);
    const bookings = [];

    for (let i = 0; i < 5; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i * 7);

      bookings.push({
        name,
        email,
        group,
        ...room,
        date: date.toISOString().split('T')[0], // Format: YYYY-MM-DD
        timestamp: new Date().toISOString()
      });
    }

    const history = await fetchBookingHistory(); // Fetch current booking history
    history.push(...bookings);

    const result = await saveBookings(history); // Save updated booking history to the backend
    if (result) {
      const message = document.createElement('div');
      message.style.backgroundColor = '#d4edda';
      message.style.color = '#155724';
      message.style.padding = '12px';
      message.style.marginTop = '20px';
      message.style.borderRadius = '5px';
      message.style.fontWeight = 'bold';
      message.innerText = '✅ Booking confirmed for 5 weeks!';
      document.querySelector('.checkout-container').appendChild(message);

      document.getElementById('checkout-form').reset();
      document.getElementById('checkout-form').style.display = 'none';
    } else {
      alert("There was an error saving your booking. Please try again.");
    }
  });
}

document.getElementById('back-button')?.addEventListener('click', () => {
  window.location.href = 'home.html';
});

function formatTo12Hour(timeStr) {
  const [hour, minute] = timeStr.split(":").map(Number);
  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = ((hour + 11) % 12 + 1); // Converts 0-23 to 1-12
  return `${hour12}:${minute.toString().padStart(2, "0")} ${period}`;
}

// Initialize the booking process
handleBooking();
