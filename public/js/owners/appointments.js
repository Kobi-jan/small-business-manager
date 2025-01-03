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
            appointmentsList.innerHTML = '';  

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
                            <button class="action-btn confirm" data-id="${appointment.appointment_id}" ${appointment.status === 'confirmed' ? 'disabled' : ''}>
                                Confirm
                            </button>
                            <button class="action-btn complete" data-id="${appointment.appointment_id}" ${appointment.status === 'completed' ? 'disabled' : ''}>
                                Complete
                            </button>
                        </td>
                    `;
                    tableBody.appendChild(row);
                });

                table.appendChild(tableBody);
                appointmentsList.appendChild(table);

                attachEventListeners();
            }
        } catch (error) {
            console.error('Error loading appointments:', error);
        }
    };

    // Load appointments 
    await getAppointments();

    // Event listener for filter button
    document.getElementById('filter-btn').addEventListener('click', async (e) => {
        e.preventDefault();

        const statusFilter = document.getElementById('status-filter').value;

        await getAppointments(statusFilter);
    });

    // Event listener to action buttons (Cancel, Confirm, Complete)
    function attachEventListeners() {
        // Cancel button
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

        // Confirm button 
        const confirmButtons = document.querySelectorAll('.action-btn.confirm');
        confirmButtons.forEach(button => {
            button.addEventListener('click', async () => {
                const appointmentId = button.getAttribute('data-id');
                try {
                    const confirmResponse = await fetch(`/owner/api/confirm-appointment/${appointmentId}`, {
                        method: 'POST',
                    });
                    const confirmResult = await confirmResponse.json();
                    if (confirmResult.success) {
                        button.disabled = true;
                        button.innerText = 'Confirmed';
                        const row = button.closest('tr');
                        row.querySelector('.status').innerText = 'Confirmed';
                    } else {
                        alert('Error confirming appointment');
                    }
                } catch (error) {
                    console.error('Error confirming appointment:', error);
                }
            });
        });

        // Complete button 
        const completeButtons = document.querySelectorAll('.action-btn.complete');
        completeButtons.forEach(button => {
            button.addEventListener('click', async () => {
                const appointmentId = button.getAttribute('data-id');
                try {
                    const completeResponse = await fetch(`/owner/api/complete-appointment/${appointmentId}`, {
                        method: 'POST',
                    });
                    const completeResult = await completeResponse.json();
                    if (completeResult.success) {
                        button.disabled = true;
                        button.innerText = 'Completed';
                        const row = button.closest('tr');
                        row.querySelector('.status').innerText = 'Completed';
                    } else {
                        alert('Error completing appointment');
                    }
                } catch (error) {
                    console.error('Error completing appointment:', error);
                }
            });
        });
    }
});
