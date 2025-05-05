document.addEventListener('DOMContentLoaded', displayBookings);

async function displayBookings() {
  const currentBookingsContainer = document.getElementById('current-bookings-list');
  const pastBookingsContainer = document.getElementById('past-bookings-list');
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));

  if (!currentUser) {
    currentBookingsContainer.innerHTML = "<p>You must be logged in to view your bookings.</p>";
    return;
  }

  // Check if the user is banned
  if (currentUser.banned) {
    alert("Your account is banned. Please contact support.");
    localStorage.removeItem('currentUser'); // Remove the banned user
    window.location.href = "logIn.html"; // Redirect to login page
    return;
  }

  // Fetch booking data from the backend
  let allBookings = await fetchBookings();

  const now = new Date();

  // Update booking status
  allBookings = allBookings.map(b => {
    const start = new Date(`${b.date}T${b.from}`);
    const end = new Date(`${b.date}T${b.until}`);
    const fiveDaysBefore = new Date(start.getTime() - 5 * 24 * 60 * 60 * 1000);

    if (b.status !== "checked-in" && b.status !== "missed") {
      if (now >= fiveDaysBefore && now <= end) {
        b.status = "confirmed";
      } else {
        b.status = "pending";
      }
    }

    if (now > end && b.status !== "checked-in") {
      b.status = "missed";
    }

    return b;
  });

  // Update booking status on backend (optional)
  await updateBookings(allBookings);

  const userBookings = allBookings.filter(b => b.email === currentUser.email);

  const currentBookings = userBookings.filter(b =>
    new Date(`${b.date}T${b.until}`) >= now && b.status !== "missed" && b.status !== "checked-in"
  );

  const pastBookings = userBookings.filter(b =>
    b.status === "checked-in" || b.status === "missed"
  );

  currentBookingsContainer.innerHTML = currentBookings.length
    ? currentBookings.map(renderBooking).join("")
    : "<p>No current bookings.</p>";

  pastBookingsContainer.innerHTML = pastBookings.length
    ? pastBookings.map(renderBooking).join("")
    : "<p>No past bookings.</p>";

  checkSuspension(currentUser, allBookings);

  addBookingEventListeners();
}

async function fetchBookings() {
  const response = await fetch('/api/bookings'); // Assuming your backend has this endpoint
  const data = await response.json();
  return data;
}

async function updateBookings(bookings) {
  const response = await fetch('/api/bookings', {
    method: 'PUT', // Assuming you want to update the existing bookings
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(bookings),
  });
  return await response.json();
}

function renderBooking(b) {
  const bookingKey = `${b.id}-${b.date}-${b.from}`;

  return `
    <div class="booking" id="booking-${bookingKey}">
      <p><strong>Room ID:</strong> ${b.id}</p>
      <p><strong>Capacity:</strong> ${b.capacity} people</p>
      <p><strong>Floor:</strong> ${b.floor}</p>
      <p><strong>Date:</strong> ${b.date}</p>
      <p><strong>Time:</strong> ${formatTo12Hour(b.from)} - ${formatTo12Hour(b.until)}</p>
      <p class="status ${b.status}"><strong>Status:</strong> ${b.status.charAt(0).toUpperCase() + b.status.slice(1)}</p>

      ${(b.status === "confirmed") ? `
        <button class="cancel-button" data-id="${b.id}" data-date="${b.date}" data-from="${b.from}">Cancel</button>
        <button class="checkin-button" data-id="${b.id}" data-date="${b.date}" data-from="${b.from}">Check In</button>
      ` : ""}
      ${(b.status === "pending") ? `
        <button class="cancel-button" data-id="${b.id}" data-date="${b.date}" data-from="${b.from}">Cancel</button>
      ` : ""}
    </div>
  `;
}

function formatTo12Hour(timeStr) {
  const [hour, minute] = timeStr.split(":").map(Number);
  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = ((hour + 11) % 12 + 1);
  return `${hour12}:${minute.toString().padStart(2, "0")} ${period}`;
}

function addBookingEventListeners() {
  document.querySelectorAll('.cancel-button').forEach(btn =>
    btn.addEventListener('click', handleCancel)
  );

  document.querySelectorAll('.checkin-button').forEach(btn =>
    btn.addEventListener('click', handleDirectCheckIn)
  );
}

async function handleCancel(e) {
  if (!confirm("Are you sure you want to cancel this booking?")) return;

  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  let bookings = await fetchBookings();
  const { id, date, from } = e.target.dataset;

  bookings = bookings.filter(b =>
    !(b.email === currentUser.email && b.id == id && b.date === date && b.from === from)
  );

  await updateBookings(bookings);
  displayBookings();
}

async function handleDirectCheckIn(e) {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  let bookings = await fetchBookings();
  const { id, date, from } = e.target.dataset;

  const now = new Date();
  const bookingStart = new Date(`${date}T${from}`);
  const checkInWindowStart = new Date(bookingStart.getTime() - 15 * 60000);
  const checkInWindowEnd = new Date(bookingStart.getTime() + 15 * 60000);

  let bookingUpdated = false;

  bookings = bookings.map(b => {
    if (b.email === currentUser.email && b.id == id && b.date === date && b.from === from) {
      if (now < checkInWindowStart) {
        alert("You cannot check in yet. Please try again closer to your booking time.");
        bookingUpdated = true; // prevent display refresh
        return b;
      } else if (now > checkInWindowEnd) {
        alert("Check-in window has passed. Booking marked as missed.");
        return { ...b, status: "missed" };
      } else {
        alert("Check-in successful!");
        return { ...b, status: "checked-in" };
      }
    }
    return b;
  });

  await updateBookings(bookings);
  if (!bookingUpdated) displayBookings(); // only refresh if status changed
}

async function checkSuspension(currentUser, allBookings) {
  const missedBookings = allBookings.filter(b =>
    b.email === currentUser.email && b.status === "missed"
  ).length;

  if (missedBookings >= 3) {
    currentUser.banned = true; // Ban user if they have 3 missed bookings
    localStorage.setItem('currentUser', JSON.stringify(currentUser)); // Save updated status
    alert("Your account is now suspended due to 3 missed bookings. Please contact support.");
    window.location.href = "suspend.html"; // Redirect to the suspension page
  }
}

// Navigation
document.getElementById('back-button-home')?.addEventListener('click', () => {
  window.location.href = 'home.html';
});

document.getElementById('back-button-rooms')?.addEventListener('click', () => {
  window.location.href = 'roomFilter.html';
});
