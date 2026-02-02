// Admin Dashboard JavaScript
// Foglalások kezelése, szerkesztés, törlés, keresés, export

document.addEventListener('DOMContentLoaded', () => {

    // --- Authentication ---
    const ADMIN_PASSWORD = 'admin123';  // Production-ben ezt biztonságosabban kell tárolni!
    let isAuthenticated = false;

    const adminLogin = document.getElementById('adminLogin');
    const adminDashboard = document.getElementById('adminDashboard');
    const loginForm = document.getElementById('loginForm');
    const logoutBtn = document.getElementById('logoutBtn');

    // Login handler
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const password = document.getElementById('password')?.value;

            if (password === ADMIN_PASSWORD) {
                isAuthenticated = true;
                adminLogin?.classList.add('hidden');
                adminDashboard?.classList.remove('hidden');
                loadDashboard();
            } else {
                alert('Hibás jelszó!');
            }
        });
    }

    // Logout handler
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            isAuthenticated = false;
            adminLogin?.classList.remove('hidden');
            adminDashboard?.classList.add('hidden');
            const passwordField = document.getElementById('password');
            if (passwordField) passwordField.value = '';
        });
    }


    // --- Dashboard Data ---
    let allBookings = [];
    let filteredBookings = [];
    let currentEditId = null;
    let currentDeleteId = null;

    async function loadDashboard() {
        await loadBookings();
        updateStatistics();
        displayBookings();
    }

    async function loadBookings() {
        allBookings = await API.getBookings();
        filteredBookings = [...allBookings];
    }

    function updateStatistics() {
        const today = new Date().toISOString().split('T')[0];
        const todayBookings = allBookings.filter(b => b.date === today);
        const upcomingBookings = allBookings.filter(b => b.date >= today);

        // Bevétel számítás
        const pricing = {
            'hajvagas': 5500,
            'szakall': 3500,
            'kombinalt': 8000
        };

        const totalRevenue = allBookings.reduce((sum, b) => {
            return sum + (pricing[b.serviceValue] || 0);
        }, 0);

        document.getElementById('totalBookings').textContent = allBookings.length;
        document.getElementById('todayBookings').textContent = todayBookings.length;
        document.getElementById('upcomingBookings').textContent = upcomingBookings.length;
        document.getElementById('totalRevenue').textContent = totalRevenue.toLocaleString('hu-HU') + ' Ft';
    }

    function displayBookings() {
        const tbody = document.getElementById('bookingsTableBody');
        const noBookings = document.getElementById('noBookings');

        if (filteredBookings.length === 0) {
            tbody.innerHTML = '';
            noBookings.classList.remove('hidden');
            return;
        }

        noBookings.classList.add('hidden');

        // Rendezés dátum szerint (legújabb elöl)
        const sortedBookings = [...filteredBookings].sort((a, b) => {
            const dateA = new Date(a.date + ' ' + a.time);
            const dateB = new Date(b.date + ' ' + b.time);
            return dateB - dateA;
        });

        tbody.innerHTML = sortedBookings.map(booking => `
            <tr>
                <td>${booking.id}</td>
                <td>${booking.name}</td>
                <td>${booking.email}</td>
                <td>${booking.phone}</td>
                <td>${booking.service}</td>
                <td>${booking.date}</td>
                <td>${booking.time}</td>
                <td class="notes-cell">${booking.notes || '-'}</td>
                <td class="actions-cell">
                    <button class="btn-icon btn-edit" onclick="editBooking(${booking.id})" title="Szerkesztés">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-delete" onclick="deleteBooking(${booking.id})" title="Törlés">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }


    // --- Search and Filter ---
    const searchInput = document.getElementById('searchInput');
    const filterDateStart = document.getElementById('filterDateStart');
    const filterDateEnd = document.getElementById('filterDateEnd');
    const clearFiltersBtn = document.getElementById('clearFilters');

    searchInput?.addEventListener('input', applyFilters);
    filterDateStart?.addEventListener('change', applyFilters);
    filterDateEnd?.addEventListener('change', applyFilters);

    clearFiltersBtn?.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        if (filterDateStart) filterDateStart.value = '';
        if (filterDateEnd) filterDateEnd.value = '';
        applyFilters();
    });

    function applyFilters() {
        const query = searchInput.value.toLowerCase();
        const startDate = filterDateStart.value;
        const endDate = filterDateEnd.value;

        filteredBookings = allBookings.filter(booking => {
            // Keresési szűrő
            const matchesSearch = !query ||
                booking.name.toLowerCase().includes(query) ||
                booking.email.toLowerCase().includes(query) ||
                booking.phone.includes(query) ||
                booking.service.toLowerCase().includes(query);

            // Dátum szűrő
            const matchesDateStart = !startDate || booking.date >= startDate;
            const matchesDateEnd = !endDate || booking.date <= endDate;

            return matchesSearch && matchesDateStart && matchesDateEnd;
        });

        displayBookings();
    }


    // --- Edit Booking ---
    const editModal = document.getElementById('editModal');
    const editForm = document.getElementById('editBookingForm');
    const closeEditModal = document.getElementById('closeEditModal');
    const cancelEdit = document.getElementById('cancelEdit');

    window.editBooking = async function (id) {
        currentEditId = id;
        const booking = await API.getBooking(id);

        if (!booking) {
            alert('Foglalás nem található!');
            return;
        }

        // Űrlap előtöltése
        document.getElementById('editBookingId').value = booking.id;
        document.getElementById('editService').value = booking.serviceValue;
        document.getElementById('editDate').value = booking.date;
        document.getElementById('editTime').value = booking.time;
        document.getElementById('editName').value = booking.name;
        document.getElementById('editPhone').value = booking.phone;
        document.getElementById('editEmail').value = booking.email;
        document.getElementById('editNotes').value = booking.notes || '';

        editModal.classList.remove('hidden');
    };

    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const updates = {
            serviceValue: document.getElementById('editService').value,
            service: document.getElementById('editService').options[document.getElementById('editService').selectedIndex].text,
            date: document.getElementById('editDate').value,
            time: document.getElementById('editTime').value,
            name: document.getElementById('editName').value,
            phone: document.getElementById('editPhone').value,
            email: document.getElementById('editEmail').value,
            notes: document.getElementById('editNotes').value
        };

        try {
            await API.updateBooking(currentEditId, updates);
            alert('Foglalás sikeresen módosítva!');
            editModal.classList.add('hidden');
            await loadDashboard();
        } catch (error) {
            alert('Hiba: ' + error.message);
        }
    });

    closeEditModal?.addEventListener('click', () => {
        editModal?.classList.add('hidden');
    });

    cancelEdit?.addEventListener('click', () => {
        editModal?.classList.add('hidden');
    });


    // --- Delete Booking ---
    const deleteModal = document.getElementById('deleteModal');
    const deleteInfo = document.getElementById('deleteInfo');
    const closeDeleteModal = document.getElementById('closeDeleteModal');
    const cancelDelete = document.getElementById('cancelDelete');
    const confirmDelete = document.getElementById('confirmDelete');

    window.deleteBooking = async function (id) {
        currentDeleteId = id;
        const booking = await API.getBooking(id);

        if (!booking) {
            alert('Foglalás nem található!');
            return;
        }

        deleteInfo.innerHTML = `
            <strong>${booking.name}</strong><br>
            ${booking.date} ${booking.time}<br>
            ${booking.service}
        `;

        deleteModal.classList.remove('hidden');
    };

    confirmDelete.addEventListener('click', async () => {
        try {
            await API.deleteBooking(currentDeleteId);
            alert('Foglalás törölve!');
            deleteModal.classList.add('hidden');
            await loadDashboard();
        } catch (error) {
            alert('Hiba: ' + error.message);
        }
    });

    closeDeleteModal?.addEventListener('click', () => {
        deleteModal?.classList.add('hidden');
    });

    cancelDelete?.addEventListener('click', () => {
        deleteModal?.classList.add('hidden');
    });


    // --- Refresh ---
    const refreshBtn2 = document.getElementById('refreshBtn');
    if (refreshBtn2) {
        refreshBtn2.addEventListener('click', async () => {
            await loadDashboard();
            alert('Adatok frissítve!');
        });
    }

    // --- Export CSV ---
    const exportBtn = document.getElementById('exportCSV');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            exportToCSV();
        });
    }

    function exportToCSV() {
        if (filteredBookings.length === 0) {
            alert('Nincs exportálható adat!');
            return;
        }

        // CSV fejléc
        const headers = ['ID', 'Név', 'Email', 'Telefon', 'Szolgáltatás', 'Dátum', 'Időpont', 'Megjegyzés', 'Létrehozva'];

        // CSV sorok
        const rows = filteredBookings.map(b => [
            b.id,
            b.name,
            b.email,
            b.phone,
            b.service,
            b.date,
            b.time,
            b.notes || '',
            b.createdAt
        ]);

        // CSV generálás
        let csv = headers.join(',') + '\n';
        rows.forEach(row => {
            csv += row.map(cell => `"${cell}"`).join(',') + '\n';
        });

        // Letöltés
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', `k2_barber_bookings_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }


    // --- Modal Close on Outside Click ---
    window.addEventListener('click', (e) => {
        if (e.target === editModal) {
            editModal.classList.add('hidden');
        }
        if (e.target === deleteModal) {
            deleteModal.classList.add('hidden');
        }
    });

});
