// Barber Availability Configuration
// Ez a config fájl határozza meg a borbély elérhetőségét

const barberAvailability = {
    // Teljes munkanap bezárva (szabadnap, ünnepnap)
    closedDays: [
        '2026-12-24',  // Szenteste
        '2026-12-25',  // Karácsony
        '2026-12-26',  // Karácsony másnapja
        '2027-01-01',  // Újév
    ],

    // Speciális nyitvatartási idő bizonyos napokon
    specialHours: {
        '2026-02-15': { start: 12, end: 17 },  // Rövidített nyitvatartás
        '2026-12-23': { start: 10, end: 15 },  // Karácsony előtt korábban zár
        '2026-12-31': { start: 10, end: 16 },  // Szilveszter
    },

    // Alapértelmezett nyitvatartás (hétfő-péntek)
    defaultHours: {
        start: 10,  // 10:00
        end: 19     // 19:00
    },

    // Heti zárva tartás (0 = Vasárnap, 6 = Szombat)
    closedWeekdays: [0],  // Csak vasárnap zárva

    // Szombati speciális nyitvatartás
    weekendHours: {
        6: { start: 9, end: 16 }  // Szombat: 9:00-16:00
    },

    // Ebédszünet (opcionális)
    lunchBreak: null,  // Ha nincs ebédszünet
    // lunchBreak: { start: 13, end: 14 }  // Példa: 13:00-14:00
};

// Ellenőrző függvények

/**
 * Ellenőrzi, hogy egy adott dátum zárva van-e
 * @param {string} dateString - YYYY-MM-DD formátum
 * @returns {boolean}
 */
function isDateClosed(dateString) {
    // Ellenőrzi a teljes napra bezárást
    if (barberAvailability.closedDays.includes(dateString)) {
        return true;
    }

    // Ellenőrzi a heti szabadnapokat
    const date = new Date(dateString + 'T00:00:00');
    const dayOfWeek = date.getDay();

    return barberAvailability.closedWeekdays.includes(dayOfWeek);
}

/**
 * Visszaadja egy adott nap nyitvatartási idejét
 * @param {string} dateString - YYYY-MM-DD formátum
 * @returns {object|null} - { start: 10, end: 19 } vagy null ha zárva
 */
function getHoursForDate(dateString) {
    // Ha zárva van
    if (isDateClosed(dateString)) {
        return null;
    }

    // Speciális órák az adott napra
    if (barberAvailability.specialHours[dateString]) {
        return barberAvailability.specialHours[dateString];
    }

    // Hétvégi órák
    const date = new Date(dateString + 'T00:00:00');
    const dayOfWeek = date.getDay();

    if (barberAvailability.weekendHours[dayOfWeek]) {
        return barberAvailability.weekendHours[dayOfWeek];
    }

    // Alapértelmezett órák
    return barberAvailability.defaultHours;
}

/**
 * Generál elérhető időpontokat egy adott napra
 * @param {string} dateString - YYYY-MM-DD formátum
 * @returns {array} - ['10:00', '10:30', ...]
 */
function getAvailableTimeSlotsForDate(dateString) {
    const hours = getHoursForDate(dateString);

    if (!hours) {
        return []; // Zárva van
    }

    const slots = [];
    const { start, end } = hours;
    const { lunchBreak } = barberAvailability;

    for (let hour = start; hour < end; hour++) {
        // Ellenőrizze az ebédszünetet
        if (lunchBreak && hour >= lunchBreak.start && hour < lunchBreak.end) {
            continue;
        }

        // Teljes óra
        slots.push(`${hour.toString().padStart(2, '0')}:00`);

        // Fél óra (ha nem az utolsó óra)
        if (hour + 1 <= end) {
            const halfHour = `${hour.toString().padStart(2, '0')}:30`;

            // Ellenőrizze, hogy a fél óra nincs-e az ebédszünetben
            if (!lunchBreak || !(hour === lunchBreak.start - 1 && lunchBreak.start % 1 === 0.5)) {
                slots.push(halfHour);
            }
        }
    }

    return slots;
}

// Export ha module használatban van
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        barberAvailability,
        isDateClosed,
        getHoursForDate,
        getAvailableTimeSlotsForDate
    };
}
