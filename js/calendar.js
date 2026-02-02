// Calendar Component
// Naptár nézet a foglalási rendszerhez

class BookingCalendar {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.currentDate = new Date();
        this.selectedDate = null;
        this.bookings = [];
        this.onDateSelect = options.onDateSelect || (() => { });

        this.init();
    }

    async init() {
        await this.loadBookings();
        this.render();
    }

    async loadBookings() {
        // API hívás a foglalások betöltéséhez
        if (typeof API !== 'undefined') {
            this.bookings = await API.getBookings();
        } else {
            const stored = localStorage.getItem('k2_barber_bookings');
            this.bookings = stored ? JSON.parse(stored) : [];
        }
    }

    render() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        this.container.innerHTML = `
            <div class="calendar">
                <div class="calendar-header">
                    <button class="calendar-nav" id="prevMonth">&lt;</button>
                    <h3 class="calendar-title">${this.getMonthName(month)} ${year}</h3>
                    <button class="calendar-nav" id="nextMonth">&gt;</button>
                </div>
                <div class="calendar-weekdays">
                    ${this.renderWeekdays()}
                </div>
                <div class="calendar-days">
                    ${this.renderDays()}
                </div>
                <div class="calendar-legend">
                    <span class="legend-item">
                        <span class="legend-dot available"></span> Szabad
                    </span>
                    <span class="legend-item">
                        <span class="legend-dot partial"></span> Részben foglalt
                    </span>
                    <span class="legend-item">
                        <span class="legend-dot booked"></span> Teljesen foglalt
                    </span>
                    <span class="legend-item">
                        <span class="legend-dot closed"></span> Zárva
                    </span>
                </div>
            </div>
        `;

        this.attachEventListeners();
    }

    renderWeekdays() {
        const weekdays = ['H', 'K', 'Sze', 'Cs', 'P', 'Szo', 'V'];
        return weekdays.map(day => `<div class="calendar-weekday">${day}</div>`).join('');
    }

    renderDays() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const prevLastDay = new Date(year, month, 0);

        const firstDayOfWeek = (firstDay.getDay() + 6) % 7; // Hétfőtől kezdődik
        const lastDate = lastDay.getDate();
        const prevLastDate = prevLastDay.getDate();

        let daysHTML = '';

        // Előző hónap napjai
        for (let i = firstDayOfWeek - 1; i >= 0; i--) {
            daysHTML += `<div class="calendar-day other-month">${prevLastDate - i}</div>`;
        }

        // Aktuális hónap napjai
        for (let day = 1; day <= lastDate; day++) {
            const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayClass = this.getDayClass(dateString);
            const isToday = this.isToday(year, month, day);
            const isSelected = this.selectedDate === dateString;

            daysHTML += `
                <div class="calendar-day ${dayClass} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}" 
                     data-date="${dateString}">
                    ${day}
                    ${this.getBookingBadge(dateString)}
                </div>
            `;
        }

        // Következő hónap napjai (hogy teljesen kitöltse a grid-et)
        const totalCells = daysHTML.split('calendar-day').length - 1;
        const remainingCells = 42 - totalCells; // 6 sor × 7 nap
        for (let i = 1; i <= remainingCells; i++) {
            daysHTML += `<div class="calendar-day other-month">${i}</div>`;
        }

        return daysHTML;
    }

    getDayClass(dateString) {
        const date = new Date(dateString + 'T00:00:00');
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Múltbeli dátum
        if (date < today) {
            return 'past';
        }

        // Zárva van-e (availability.js használatával)
        if (typeof isDateClosed === 'function' && isDateClosed(dateString)) {
            return 'closed';
        }

        // Foglalások száma az adott napon
        const bookingsOnDate = this.bookings.filter(b => b.date === dateString);
        const totalSlots = this.getTotalSlotsForDate(dateString);

        if (bookingsOnDate.length === 0) {
            return 'available';
        } else if (bookingsOnDate.length >= totalSlots) {
            return 'fully-booked';
        } else {
            return 'partial';
        }
    }

    getTotalSlotsForDate(dateString) {
        if (typeof getAvailableTimeSlotsForDate === 'function') {
            return getAvailableTimeSlotsForDate(dateString).length;
        }
        return 18; // Alapértelmezett: 9 óra × 2 slot/óra
    }

    getBookingBadge(dateString) {
        const count = this.bookings.filter(b => b.date === dateString).length;
        if (count > 0) {
            return `<span class="booking-badge">${count}</span>`;
        }
        return '';
    }

    isToday(year, month, day) {
        const today = new Date();
        return today.getFullYear() === year &&
            today.getMonth() === month &&
            today.getDate() === day;
    }

    getMonthName(month) {
        const months = [
            'Január', 'Február', 'Március', 'Április', 'Május', 'Június',
            'Július', 'Augusztus', 'Szeptember', 'Október', 'November', 'December'
        ];
        return months[month];
    }

    attachEventListeners() {
        // Navigáció
        document.getElementById('prevMonth')?.addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.render();
        });

        document.getElementById('nextMonth')?.addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.render();
        });

        // Nap kiválasztása
        document.querySelectorAll('.calendar-day:not(.other-month):not(.past):not(.closed)').forEach(day => {
            day.addEventListener('click', (e) => {
                const dateString = e.currentTarget.getAttribute('data-date');
                if (dateString) {
                    this.selectDate(dateString);
                }
            });
        });
    }

    selectDate(dateString) {
        this.selectedDate = dateString;
        this.render();
        this.onDateSelect(dateString);
    }

    async refresh() {
        await this.loadBookings();
        this.render();
    }

    // Adott hónapra ugrás
    goToMonth(year, month) {
        this.currentDate = new Date(year, month, 1);
        this.render();
    }

    // Mai napra ugrás
    goToToday() {
        this.currentDate = new Date();
        this.render();
    }
}

// Gyors inicializálás függvény
function initializeCalendar(containerId, options) {
    return new BookingCalendar(containerId, options);
}
