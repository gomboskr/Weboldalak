// Backend API Mock
// Ez egy mock implementáció, ami localStorage-t használ
// Production környezetben cseréld ki valódi API hívásokra

const API_BASE_URL = '/api';  // Production-ben: 'https://yourdomain.com/api'

/**
 * API utility függvények
 */
const API = {
    /**
     * Összes foglalás lekérése
     * @returns {Promise<Array>}
     */
    async getBookings() {
        return new Promise((resolve) => {
            setTimeout(() => {
                const bookings = localStorage.getItem('k2_barber_bookings');
                resolve(bookings ? JSON.parse(bookings) : []);
            }, 300); // Szimulált hálózati késleltetés
        });
    },

    /**
     * Egy foglalás lekérése ID alapján
     * @param {number} id - Foglalás ID
     * @returns {Promise<Object|null>}
     */
    async getBooking(id) {
        return new Promise(async (resolve) => {
            const bookings = await this.getBookings();
            const booking = bookings.find(b => b.id === id);
            setTimeout(() => resolve(booking || null), 200);
        });
    },

    /**
     * Új foglalás létrehozása
     * @param {Object} bookingData - Foglalás adatok
     * @returns {Promise<Object>}
     */
    async createBooking(bookingData) {
        return new Promise(async (resolve, reject) => {
            try {
                // Validáció
                if (!bookingData.service || !bookingData.date || !bookingData.time ||
                    !bookingData.name || !bookingData.email || !bookingData.phone) {
                    throw new Error('Hiányzó kötelező mezők');
                }

                const bookings = await this.getBookings();

                // Ütközés ellenőrzés
                const conflict = bookings.find(b =>
                    b.date === bookingData.date && b.time === bookingData.time
                );

                if (conflict) {
                    throw new Error('Ez az időpont már foglalt');
                }

                // Új foglalás létrehozása
                const newBooking = {
                    id: Date.now(),
                    ...bookingData,
                    createdAt: new Date().toISOString(),
                    status: 'confirmed' // pending, confirmed, cancelled, completed
                };

                bookings.push(newBooking);
                localStorage.setItem('k2_barber_bookings', JSON.stringify(bookings));

                setTimeout(() => resolve(newBooking), 300);
            } catch (error) {
                setTimeout(() => reject(error), 300);
            }
        });
    },

    /**
     * Foglalás módosítása
     * @param {number} id - Foglalás ID
     * @param {Object} updates - Módosítandó mezők
     * @returns {Promise<Object>}
     */
    async updateBooking(id, updates) {
        return new Promise(async (resolve, reject) => {
            try {
                const bookings = await this.getBookings();
                const index = bookings.findIndex(b => b.id === id);

                if (index === -1) {
                    throw new Error('Foglalás nem található');
                }

                // Ha dátum vagy idő változik, ütközés ellenőrzés
                if (updates.date || updates.time) {
                    const newDate = updates.date || bookings[index].date;
                    const newTime = updates.time || bookings[index].time;

                    const conflict = bookings.find(b =>
                        b.id !== id && b.date === newDate && b.time === newTime
                    );

                    if (conflict) {
                        throw new Error('Az új időpont már foglalt');
                    }
                }

                // Módosítás alkalmazása
                bookings[index] = {
                    ...bookings[index],
                    ...updates,
                    updatedAt: new Date().toISOString()
                };

                localStorage.setItem('k2_barber_bookings', JSON.stringify(bookings));

                setTimeout(() => resolve(bookings[index]), 300);
            } catch (error) {
                setTimeout(() => reject(error), 300);
            }
        });
    },

    /**
     * Foglalás törlése
     * @param {number} id - Foglalás ID
     * @returns {Promise<boolean>}
     */
    async deleteBooking(id) {
        return new Promise(async (resolve, reject) => {
            try {
                const bookings = await this.getBookings();
                const filtered = bookings.filter(b => b.id !== id);

                if (filtered.length === bookings.length) {
                    throw new Error('Foglalás nem található');
                }

                localStorage.setItem('k2_barber_bookings', JSON.stringify(filtered));

                setTimeout(() => resolve(true), 300);
            } catch (error) {
                setTimeout(() => reject(error), 300);
            }
        });
    },

    /**
     * Elérhetőség lekérése egy adott dátumra
     * @param {string} date - YYYY-MM-DD formátum
     * @returns {Promise<Object>}
     */
    async getAvailability(date) {
        return new Promise(async (resolve) => {
            // Ellenőrizze a config-ot (ha be van töltve)
            let availableSlots = [];

            if (typeof getAvailableTimeSlotsForDate === 'function') {
                availableSlots = getAvailableTimeSlotsForDate(date);
            } else {
                // Fallback: alapértelmezett időpontok
                for (let i = 10; i < 19; i++) {
                    availableSlots.push(`${i.toString().padStart(2, '0')}:00`);
                    availableSlots.push(`${i.toString().padStart(2, '0')}:30`);
                }
            }

            // Szűrje ki a foglalt időpontokat
            const bookings = await this.getBookings();
            const bookedSlots = bookings
                .filter(b => b.date === date)
                .map(b => b.time);

            const available = availableSlots.filter(slot => !bookedSlots.includes(slot));

            setTimeout(() => resolve({
                date,
                totalSlots: availableSlots.length,
                bookedSlots: bookedSlots.length,
                availableSlots: available.length,
                slots: available
            }), 200);
        });
    },

    /**
     * Foglalások lekérése dátum tartományban
     * @param {string} startDate - YYYY-MM-DD
     * @param {string} endDate - YYYY-MM-DD
     * @returns {Promise<Array>}
     */
    async getBookingsByDateRange(startDate, endDate) {
        return new Promise(async (resolve) => {
            const bookings = await this.getBookings();
            const filtered = bookings.filter(b =>
                b.date >= startDate && b.date <= endDate
            );
            setTimeout(() => resolve(filtered), 200);
        });
    },

    /**
     * Keresés foglalásokban
     * @param {string} query - Keresési kifejezés
     * @returns {Promise<Array>}
     */
    async searchBookings(query) {
        return new Promise(async (resolve) => {
            const bookings = await this.getBookings();
            const lowerQuery = query.toLowerCase();

            const results = bookings.filter(b =>
                b.name.toLowerCase().includes(lowerQuery) ||
                b.email.toLowerCase().includes(lowerQuery) ||
                b.phone.includes(query) ||
                b.service.toLowerCase().includes(lowerQuery)
            );

            setTimeout(() => resolve(results), 200);
        });
    }
};

// Production Backend Integration Example (kommentálva)
/*
const API = {
    async getBookings() {
        const response = await fetch(`${API_BASE_URL}/bookings`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to fetch bookings');
        return await response.json();
    },

    async createBooking(bookingData) {
        const response = await fetch(`${API_BASE_URL}/bookings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify(bookingData)
        });
        
        if (!response.ok) throw new Error('Failed to create booking');
        return await response.json();
    },

    // ... további endpoints hasonlóan
};
*/
