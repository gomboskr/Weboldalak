// K2 Barber Shop - Main Script

document.addEventListener('DOMContentLoaded', () => {

    // --- Navigation & Mobile Menu ---
    const burger = document.querySelector('.burger');
    const nav = document.querySelector('.nav-links');
    const navLinks = document.querySelectorAll('.nav-links li');
    const mobileMenu = document.querySelector('.mobile-menu');
    const mobileLinks = document.querySelectorAll('.mobile-link');
    const navbar = document.querySelector('nav');

    // Toggle Mobile Menu
    burger.addEventListener('click', () => {
        // Toggle Nav
        nav.classList.toggle('nav-active'); // For non-overlay version if needed
        mobileMenu.classList.toggle('active');

        // Burger Animation
        burger.classList.toggle('toggle');

        // Animate Links
        navLinks.forEach((link, index) => {
            if (link.style.animation) {
                link.style.animation = '';
            } else {
                link.style.animation = `navLinkFade 0.5s ease forwards ${index / 7 + 0.3}s`;
            }
        });
    });

    // Close mobile menu when a link is clicked
    mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.remove('active');
            burger.classList.remove('toggle');
        });
    });

    // Sticky Navbar Effect
    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });


    // --- Scroll Reveal Animations ---
    const revealElements = document.querySelectorAll('.reveal-left, .reveal-right, .reveal-bottom');

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target); // Only animate once
            }
        });
    }, {
        root: null,
        threshold: 0.15, // Trigger when 15% visible
        rootMargin: "0px"
    });

    revealElements.forEach(el => revealObserver.observe(el));


    // --- Booking System Logic ---
    const dateInput = document.getElementById('date');
    const timeSelect = document.getElementById('time');
    const bookingForm = document.getElementById('bookingForm');
    const bookingMessage = document.getElementById('bookingMessage');
    const newBookingBtn = document.getElementById('newBookingBtn');

    // LocalStorage key for bookings
    const BOOKINGS_KEY = 'k2_barber_bookings';

    // Initialize bookings from localStorage
    function getBookings() {
        const bookings = localStorage.getItem(BOOKINGS_KEY);
        return bookings ? JSON.parse(bookings) : [];
    }

    // Save bookings to localStorage
    function saveBooking(booking) {
        const bookings = getBookings();
        bookings.push(booking);
        localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
    }

    // Check if time slot is already booked
    function isTimeSlotBooked(date, time) {
        const bookings = getBookings();
        return bookings.some(booking => booking.date === date && booking.time === time);
    }

    // Set minimum date to today
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    dateInput.setAttribute('min', todayString);

    // Set maximum date to 3 months from now
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3);
    const maxDateString = maxDate.toISOString().split('T')[0];
    dateInput.setAttribute('max', maxDateString);

    // Populate Time Slots based on date selection
    dateInput.addEventListener('change', () => {
        populateTimeSlots();
    });

    function populateTimeSlots() {
        const selectedDate = dateInput.value;
        timeSelect.innerHTML = '<option value="" disabled selected>Válassz időpontot...</option>';

        if (!selectedDate) return;

        const startHour = 10;
        const endHour = 19;
        const selectedDateObj = new Date(selectedDate + 'T00:00:00');
        const todayDate = new Date(todayString + 'T00:00:00');
        const currentHour = new Date().getHours();
        const currentMinutes = new Date().getMinutes();

        for (let i = startHour; i < endHour; i++) {
            // Full hour
            const timeSlot1 = `${i.toString().padStart(2, '0')}:00`;

            // Check if this is today and the time has already passed
            const isPastTime = selectedDateObj.getTime() === todayDate.getTime() &&
                (i < currentHour || (i === currentHour && currentMinutes > 0));

            // Check if time slot is already booked
            const isBooked1 = isTimeSlotBooked(selectedDate, timeSlot1);

            if (!isPastTime && !isBooked1) {
                const option1 = document.createElement('option');
                option1.value = timeSlot1;
                option1.textContent = timeSlot1;
                timeSelect.appendChild(option1);
            }

            // Half hour
            const timeSlot2 = `${i.toString().padStart(2, '0')}:30`;
            const isPastTime2 = selectedDateObj.getTime() === todayDate.getTime() &&
                (i < currentHour || (i === currentHour && currentMinutes > 30));
            const isBooked2 = isTimeSlotBooked(selectedDate, timeSlot2);

            if (!isPastTime2 && !isBooked2) {
                const option2 = document.createElement('option');
                option2.value = timeSlot2;
                option2.textContent = timeSlot2;
                timeSelect.appendChild(option2);
            }
        }

        // If no time slots available
        if (timeSelect.options.length === 1) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'Nincs elérhető időpont ezen a napon';
            option.disabled = true;
            timeSelect.appendChild(option);
        }
    }

    // Email validation
    function validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Phone validation and formatting
    function validatePhone(phone) {
        // Remove all non-digit characters
        const cleaned = phone.replace(/\D/g, '');

        // Check if it's a valid Hungarian phone number
        if (cleaned.length === 11 && cleaned.startsWith('36')) {
            return true; // +36 format
        } else if (cleaned.length === 9 && cleaned.startsWith('06')) {
            return true; // 06 format
        } else if (cleaned.length === 9) {
            return true; // Without prefix
        }

        return false;
    }

    function formatPhone(phone) {
        const cleaned = phone.replace(/\D/g, '');

        if (cleaned.length === 11 && cleaned.startsWith('36')) {
            return `+${cleaned.substring(0, 2)} ${cleaned.substring(2, 4)} ${cleaned.substring(4, 7)} ${cleaned.substring(7)}`;
        } else if (cleaned.length >= 9) {
            const baseNumber = cleaned.slice(-9);
            return `+36 ${baseNumber.substring(0, 2)} ${baseNumber.substring(2, 5)} ${baseNumber.substring(5)}`;
        }

        return phone;
    }

    // Real-time phone formatting
    const phoneInput = document.getElementById('phone');
    phoneInput.addEventListener('blur', (e) => {
        if (e.target.value) {
            e.target.value = formatPhone(e.target.value);
        }
    });

    // Handle Form Submission
    bookingForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // Get values
        const serviceElement = document.getElementById('service');
        const service = serviceElement.options[serviceElement.selectedIndex].text;
        const serviceValue = serviceElement.value;
        const date = document.getElementById('date').value;
        const time = document.getElementById('time').value;
        const name = document.getElementById('name').value;
        const phone = document.getElementById('phone').value;
        const email = document.getElementById('email').value;
        const notes = document.getElementById('notes').value;

        // Validate email
        if (!validateEmail(email)) {
            alert('Kérlek, adj meg egy érvényes email címet!');
            return;
        }

        // Validate phone
        if (!validatePhone(phone)) {
            alert('Kérlek, adj meg egy érvényes magyar telefonszámot!');
            return;
        }

        // Check if time slot is still available (double-check)
        if (isTimeSlotBooked(date, time)) {
            alert('Sajnáljuk, ez az időpont már foglalt! Kérlek, válassz másikat.');
            populateTimeSlots(); // Refresh time slots
            return;
        }

        // Simulate API call / processing
        const submitBtn = bookingForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = "Feldolgozás...";
        submitBtn.disabled = true;

        setTimeout(() => {
            // Create booking object
            const booking = {
                id: Date.now(),
                service: service,
                serviceValue: serviceValue,
                date: date,
                time: time,
                name: name,
                phone: formatPhone(phone),
                email: email,
                notes: notes,
                createdAt: new Date().toISOString()
            };

            // Save to localStorage
            saveBooking(booking);

            // Show Success Message
            document.getElementById('confName').textContent = name;
            document.getElementById('confDate').textContent = date;
            document.getElementById('confTime').textContent = time;

            bookingForm.classList.add('hidden');
            bookingMessage.classList.remove('hidden');

            // Scroll to message
            bookingMessage.scrollIntoView({ behavior: 'smooth' });

            // Reset button
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;

            console.log('Foglalás mentve:', booking);
        }, 1500);
    });

    // Handle "New Booking" button
    newBookingBtn.addEventListener('click', () => {
        bookingForm.reset();
        timeSelect.innerHTML = '<option value="" disabled selected>Válassz időpontot...</option>';
        bookingMessage.classList.add('hidden');
        bookingForm.classList.remove('hidden');
    });

});

// --- Helper Functions ---

// Called from onclick in HTML
function selectService(serviceValue) {
    const bookingSection = document.getElementById('booking');
    const serviceSelect = document.getElementById('service');

    // Scroll to booking section
    bookingSection.scrollIntoView({ behavior: 'smooth' });

    // Select the option
    serviceSelect.value = serviceValue;

    // Highlight the field briefly
    serviceSelect.style.borderColor = 'var(--primary)';
    setTimeout(() => {
        serviceSelect.style.borderColor = '#333';
    }, 1000);
}
