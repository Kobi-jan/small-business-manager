document.addEventListener('DOMContentLoaded', () => {
    const appointmentsList = document.getElementById('appointments-list');
    const rescheduleModal = document.getElementById('reschedule-modal');
    const closeModalButton = document.getElementById('close-modal');
    const filterButton = document.getElementById('filter-btn');

    // Fetch and render appointments
    const getAppointments = async (statusFilter = '', dateFilter = '') => {
        try {
            const queryParams = new URLSearchParams();
            if (statusFilter) queryParams.append('status', statusFilter);
            if (dateFilter) queryParams.append('date', dateFilter);

            const response = await fetch(`/customers/api/get-appointments?${queryParams.toString()}`);
            const appointments = await response.json();

            renderAppointments(appointments);
        } catch (error) {
            console.error('Error loading appointments:', error);
            appointmentsList.innerHTML = '<p>Error loading appointments. Please try again later.</p>';
        }
    };

    // Render appointments
    const renderAppointments = (appointments) => {
        appointmentsList.innerHTML = '';

        if (!appointments.length) {
            appointmentsList.innerHTML = '<p>No appointments available.</p>';
            return;
        }

        const table = document.createElement('table');
        table.classList.add('appointments-table');

        table.innerHTML = `
            <thead>
                <tr>
                    <th>Business Name</th>
                    <th>Appointment Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
        `;

        const tableBody = document.createElement('tbody');
        appointments.forEach(appointment => {
            const row = document.createElement('tr');
            const statusClass = appointment.status === 'canceled' ? 'canceled' : '';
            row.innerHTML = `
                <td>${appointment.business_name}</td>
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
    };

    // Cancel an appointment
    const cancelAppointment = async (appointmentId, button, row) => {
        try {
            const response = await fetch(`/customers/api/cancel-appointment/${appointmentId}`, {
                method: 'POST',
            });
            const result = await response.json();

            if (result.success) {
                button.disabled = true;
                button.innerText = 'Canceled';
                row.querySelector('.status').innerText = 'Canceled';
                row.querySelector('.status').classList.add('canceled');
            } else {
                alert('Error canceling appointment');
            }
        } catch (error) {
            console.error('Error canceling appointment:', error);
            alert('Failed to cancel the appointment. Please try again later.');
        }
    };

    // Handle reschedule modal
    const openRescheduleModal = (appointmentId, currentDate) => {
        document.getElementById('new-date').value = currentDate;
        document.getElementById('appointment-id').value = appointmentId;
        rescheduleModal.style.display = 'block';
    };

    const closeRescheduleModal = () => {
        rescheduleModal.style.display = 'none';
    };

    // Appointment actions
    appointmentsList.addEventListener('click', (e) => {
        const button = e.target;

        if (button.classList.contains('cancel')) {
            const appointmentId = button.getAttribute('data-id');
            const row = button.closest('tr');
            cancelAppointment(appointmentId, button, row);
        }

        if (button.classList.contains('reschedule')) {
            const appointmentId = button.getAttribute('data-id');
            const currentDate = button.getAttribute('data-current-date');
            openRescheduleModal(appointmentId, currentDate);
        }
    });

    // Close reschedule modal
    closeModalButton.addEventListener('click', closeRescheduleModal);

    // Apply filters
    filterButton.addEventListener('click', async (e) => {
        e.preventDefault();
        const statusFilter = document.getElementById('status-filter').value;
        await getAppointments(statusFilter);
    });

    // Load appointments on page load
    getAppointments();
});

document.getElementById('save-reschedule').addEventListener('click', async () => {
    const newDate = document.getElementById('new-date').value;
    const appointmentId = document.getElementById('appointment-id').value;

    if (!newDate) {
        alert('Please select a new date.');
        return;
    }

    try {
        const response = await fetch(`/customers/api/reschedule-appointment/${appointmentId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ newDate }),
        });

        const result = await response.json();
        if (result.success) {
            alert('Appointment rescheduled successfully!');
            document.getElementById('reschedule-modal').style.display = 'none';
            await getAppointments(); 
        } else {
            alert(result.error || 'Failed to reschedule appointment.');
        }
    } catch (error) {
        console.error('Error rescheduling appointment:', error);
        alert('An error occurred while rescheduling the appointment.');
    }
});

