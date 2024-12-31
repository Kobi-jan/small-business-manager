document.addEventListener('DOMContentLoaded', async () => {
    // Fetch appointments with optional filters
    const getAppointments = async (statusFilter = '', dateFilter = '') => {
        try {
            const queryParams = new URLSearchParams();
            if (statusFilter) queryParams.append('status', statusFilter);
            if (dateFilter) queryParams.append('date', dateFilter);

            const response = await fetch(`/owner/api/get-appointments?${queryParams.toString()}`);
            const appointments = await response.json();

            const appointmentsList = document.getElementById('appointments-list');
            appointmentsList.innerHTML = '';  // Clear existing appointments

            if (appointments.length === 0) {
                appointmentsList.innerHTML = '<p>No appointments available.</p>';
            } else {
                const table = document.createElement('table');
                table.classList.add('appointments-table');

                const tableHeader = `
                    <thead>
                        <tr>
                            <th>Customer Name</th>
                            <th>Appointment Date</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                `;

                table.innerHTML = tableHeader;

                const tableBody = document.createElement('tbody');
                appointments.forEach(appointment => {
                    const row = document.createElement('tr');
                    const statusClass = appointment.status === 'canceled' ? 'canceled' : '';
                    row.innerHTML = `
                        <td>${appointment.first_name} ${appointment.last_name}</td>
                        <td>${new Date(appointment.appointment_date).toLocaleString()}</td>
                        <td class="status ${statusClass}">${appointment.status}</td>
                        <td>
                            <button class="action-btn cancel" data-id="${appointment.appointment_id}" ${appointment.status === 'canceled' ? 'disabled' : ''}>
                                ${appointment.status === 'canceled' ? 'Canceled' : 'Cancel'}
                            </button>
                            <button class="action-btn reschedule" data-id="${appointment.appointment_id}" data-current-date="${appointment.appointment_date}">
                                Reschedule
                            </button>
                        </td>
                    `;
                    tableBody.appendChild(row);
                });

                table.appendChild(tableBody);
                appointmentsList.appendChild(table);
            }
        } catch (error) {
            console.error('Error loading appointments:', error);
        }
    };

    // Load appointments on page load
    await getAppointments();

    // Add event listener for filter button
    document.getElementById('filter-btn').addEventListener('click', async (e) => {
        e.preventDefault();

        const statusFilter = document.getElementById('status-filter').value;

        await getAppointments(statusFilter);
    });

    // Add event listener to cancel buttons (same as before)
    const cancelButtons = document.querySelectorAll('.action-btn.cancel');
    cancelButtons.forEach(button => {
        button.addEventListener('click', async (e) => {
            const appointmentId = button.getAttribute('data-id');
            try {
                const cancelResponse = await fetch(`/owner/api/cancel-appointment/${appointmentId}`, {
                    method: 'POST',
                });
                const cancelResult = await cancelResponse.json();
                if (cancelResult.success) {
                    button.disabled = true;
                    button.innerText = 'Canceled';
                    const row = button.closest('tr');
                    row.querySelector('.status').innerText = 'Canceled';
                } else {
                    alert('Error canceling appointment');
                }
            } catch (error) {
                console.error('Error canceling appointment:', error);
            }
        });
    });

    // Add event listener to reschedule buttons (same as before)
    const rescheduleButtons = document.querySelectorAll('.action-btn.reschedule');
    rescheduleButtons.forEach(button => {
        button.addEventListener('click', () => {
            const appointmentId = button.getAttribute('data-id');
            const currentDate = button.getAttribute('data-current-date');

            // Pre-fill the modal with the current appointment date
            document.getElementById('new-date').value = currentDate;
            document.getElementById('appointment-id').value = appointmentId;

            // Show the modal
            document.getElementById('reschedule-modal').style.display = 'block';
        });
    });
});

document.getElementById('close-modal').addEventListener('click', () => {
    document.getElementById('reschedule-modal').style.display = 'none';
});