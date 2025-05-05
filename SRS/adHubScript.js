async function fetchBookings() {
  try {
    const response = await fetch('/api/bookings');
    const data = await response.json();
    displayBookings(data);
  } catch (error) {
    console.error("Error fetching bookings:", error);
  }
}

async function fetchSuspensionRequests() {
  try {
    const response = await fetch('/api/suspensions');
    const data = await response.json();
    displaySuspensionRequests(data);
  } catch (error) {
    console.error("Error fetching suspension requests:", error);
  }
}

function displayBookings(bookings) {
  const bookingTable = document.getElementById('booking-table').getElementsByTagName('tbody')[0];
  bookingTable.innerHTML = '';

  if (bookings.length === 0) {
    const row = bookingTable.insertRow();
    const cell = row.insertCell();
    cell.colSpan = 6;
    cell.textContent = 'No bookings available';
    return;
  }

  bookings.forEach(booking => {
    const row = bookingTable.insertRow();
    row.innerHTML = `
      <td>${booking.id}</td>
      <td>${booking.capacity} people</td>
      <td>${booking.date}</td>
      <td>${booking.from} - ${booking.until}</td>
      <td>${booking.name} (${booking.email})</td>
      <td>
        <button class="remove" onclick="cancelBooking(${booking.id})">Cancel Booking</button>
      </td>
    `;
  });
}

function displaySuspensionRequests(suspensionRequests) {
  const suspensionTable = document.getElementById('suspension-table').getElementsByTagName('tbody')[0];
  suspensionTable.innerHTML = '';

  if (suspensionRequests.length === 0) {
    const row = suspensionTable.insertRow();
    const cell = row.insertCell();
    cell.colSpan = 4;
    cell.textContent = 'No suspension requests available';
    return;
  }

  suspensionRequests.forEach(request => {
    const row = suspensionTable.insertRow();
    row.innerHTML = `
      <td>${request.fullName}</td>
      <td>${request.email}</td>
      <td>
        <strong>Reason:</strong> ${request.reason}<br>
        <strong>Times Suspended:</strong> ${request.count || 1}
      </td>
      <td>
        <button class="view-letter" onclick="showLetter('${request.reason.replace(/'/g, "\\'")}')">View Letter</button>
        <button class="resolve" onclick="resolveRequest(${request.id}, '${request.email}')">Resolve</button>
        <button class="ban" onclick="banUser('${request.email}')">Ban User</button>
      </td>
    `;
  });
}

async function cancelBooking(bookingId) {
  try {
    const response = await fetch(`/api/bookings/${bookingId}`, { method: 'DELETE' });
    if (response.ok) {
      alert(`Booking with ID: ${bookingId} has been cancelled.`);
      fetchBookings(); // Refresh bookings after cancellation
    } else {
      alert("Error cancelling the booking.");
    }
  } catch (error) {
    console.error("Error cancelling booking:", error);
  }
}

async function resolveRequest(requestId, email) {
  try {
    const response = await fetch(`/api/suspensions/${requestId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'resolved' }),
      headers: { 'Content-Type': 'application/json' }
    });
    if (response.ok) {
      alert(`Suspension request for ${email} has been resolved.`);
      fetchSuspensionRequests(); // Refresh suspension requests after resolving
    } else {
      alert("Error resolving the suspension request.");
    }
  } catch (error) {
    console.error("Error resolving suspension request:", error);
  }
}

async function banUser(email) {
  try {
    const response = await fetch(`/api/users/${email}/ban`, {
      method: 'PATCH',
      body: JSON.stringify({ banned: true }),
      headers: { 'Content-Type': 'application/json' }
    });
    if (response.ok) {
      alert(`${email} has been banned.`);
      fetchSuspensionRequests(); // Refresh suspension requests after banning user
    } else {
      alert("Error banning the user.");
    }
  } catch (error) {
    console.error("Error banning user:", error);
  }
}

// Modal logic for viewing suspension reason
function showLetter(reasonText) {
  const modal = document.getElementById('letter-modal');
  const content = document.getElementById('letter-content');
  content.textContent = reasonText;
  modal.style.display = 'block';
}

document.getElementById('close-modal').addEventListener('click', () => {
  document.getElementById('letter-modal').style.display = 'none';
});

window.addEventListener('click', function(event) {
  const modal = document.getElementById('letter-modal');
  if (event.target === modal) {
    modal.style.display = 'none';
  }
});

// Initialize the page by fetching the data
fetchBookings();
fetchSuspensionRequests();

// Admin-specific navigation to various sections
document.getElementById("view-users").addEventListener("click", () => {
  window.location.href = "adminUsers.html";
});

document.getElementById("view-bookings").addEventListener("click", () => {
  window.location.href = "adminBookings.html";
});

document.getElementById("view-suspensions").addEventListener("click", () => {
  window.location.href = "adminSuspensions.html";
});

// Log-out functionality
document.getElementById("log-out").addEventListener("click", () => {
  window.location.href = "logIn.html";
});
