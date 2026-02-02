// Notifications System
// Email és SMS értesítések kezelése

/**
 * EmailJS Configuration
 * Regisztrálj itt: https://www.emailjs.com/
 * 
 * Lépések:
 * 1. Regisztráció EmailJS-en
 * 2. Email szolgáltatás hozzáadása (Gmail, Outlook, stb.)
 * 3. Email template létrehozása
 * 4. Másold be az alábbi kulcsokat
 */
const EMAILJS_CONFIG = {
    serviceID: 'YOUR_SERVICE_ID',      // EmailJS Service ID
    templateID: 'YOUR_TEMPLATE_ID',    // EmailJS Template ID
    publicKey: 'YOUR_PUBLIC_KEY',      // EmailJS Public Key
    enabled: false  // Állítsd true-ra, amikor beállítottad az EmailJS-t
};

/**
 * SMS Configuration (Twilio vagy más szolgáltató)
 * Ez egy mockup implementáció
 */
const SMS_CONFIG = {
    accountSID: 'YOUR_TWILIO_ACCOUNT_SID',
    authToken: 'YOUR_TWILIO_AUTH_TOKEN',
    phoneNumber: '+36301234567',  // A borbély telefonszáma (feladó)
    enabled: false  // Állítsd true-ra production-ben
};

/**
 * Email értesítés küldése foglalásról
 * @param {Object} booking - Foglalás adatok
 * @param {string} type - 'confirmation' | 'reminder' | 'cancellation'
 * @returns {Promise<boolean>}
 */
async function sendEmailNotification(booking, type = 'confirmation') {
    if (!EMAILJS_CONFIG.enabled) {
        console.log('📧 Email küldés (DEMO):', {
            to: booking.email,
            type: type,
            booking: booking
        });
        return true; // Szimuláció
    }

    try {
        // EmailJS inicializálás (production-ben)
        // emailjs.init(EMAILJS_CONFIG.publicKey);

        const templateParams = {
            to_email: booking.email,
            to_name: booking.name,
            service: booking.service,
            date: booking.date,
            time: booking.time,
            phone: booking.phone,
            notes: booking.notes || 'Nincs',
            booking_id: booking.id
        };

        // EmailJS send (production-ben)
        /*
        const response = await emailjs.send(
            EMAILJS_CONFIG.serviceID,
            EMAILJS_CONFIG.templateID,
            templateParams
        );
        
        console.log('✅ Email sikeresen elküldve:', response);
        return true;
        */

        // Demo célokra
        console.log('📧 Email szimuláció:', templateParams);
        return true;

    } catch (error) {
        console.error('❌ Email küldés hiba:', error);
        return false;
    }
}

/**
 * SMS értesítés küldése
 * @param {Object} booking - Foglalás adatok
 * @param {string} type - 'confirmation' | 'reminder'
 * @returns {Promise<boolean>}
 */
async function sendSMSNotification(booking, type = 'confirmation') {
    if (!SMS_CONFIG.enabled) {
        const message = generateSMSMessage(booking, type);
        console.log('📱 SMS küldés (DEMO):', {
            to: booking.phone,
            message: message
        });
        return true; // Szimuláció
    }

    try {
        const message = generateSMSMessage(booking, type);

        // Twilio API hívás (production-ben)
        /*
        const response = await fetch('https://api.twilio.com/2010-04-01/Accounts/' + SMS_CONFIG.accountSID + '/Messages.json', {
            method: 'POST',
            headers: {
                'Authorization': 'Basic ' + btoa(SMS_CONFIG.accountSID + ':' + SMS_CONFIG.authToken),
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                From: SMS_CONFIG.phoneNumber,
                To: booking.phone,
                Body: message
            })
        });

        if (!response.ok) throw new Error('SMS küldés sikertelen');
        
        console.log('✅ SMS sikeresen elküldve');
        return true;
        */

        // Demo célokra
        console.log('📱 SMS szimuláció:', {
            to: booking.phone,
            message: message
        });
        return true;

    } catch (error) {
        console.error('❌ SMS küldés hiba:', error);
        return false;
    }
}

/**
 * SMS üzenet generálása
 * @param {Object} booking
 * @param {string} type
 * @returns {string}
 */
function generateSMSMessage(booking, type) {
    const messages = {
        confirmation: `K2 Barber - Foglalás megerősítve!\n\nSzolgáltatás: ${booking.service}\nIdőpont: ${booking.date} ${booking.time}\n\nVárunk szeretettel!\n\nLemondás: +36 30 000 0000`,

        reminder: `K2 Barber - Emlékeztető!\n\nHolnap várunk: ${booking.date} ${booking.time}\nSzolgáltatás: ${booking.service}\n\nJó készülést!\n\nMódosítás: +36 30 000 0000`
    };

    return messages[type] || messages.confirmation;
}

/**
 * Értesítések küldése foglaláskor
 * @param {Object} booking - Foglalás adatok
 * @param {Object} options - { email: true, sms: true }
 */
async function sendBookingNotifications(booking, options = { email: true, sms: true }) {
    const results = {
        email: null,
        sms: null
    };

    // Email küldés
    if (options.email) {
        results.email = await sendEmailNotification(booking, 'confirmation');
    }

    // SMS küldés
    if (options.sms) {
        results.sms = await sendSMSNotification(booking, 'confirmation');
    }

    console.log('📬 Értesítések státusza:', results);
    return results;
}

/**
 * Emlékeztető üzenetek küldése (holnapi foglalásokra)
 * Ezt egy cron job-ban vagy háttér processben kell futtatni
 */
async function sendDailyReminders() {
    try {
        // Holnapi dátum
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowString = tomorrow.toISOString().split('T')[0];

        // Foglalások lekérése
        const bookings = await API.getBookingsByDateRange(tomorrowString, tomorrowString);

        console.log(`🔔 ${bookings.length} emlékeztető küldése...`);

        // Minden foglaláshoz emlékeztető
        for (const booking of bookings) {
            await sendEmailNotification(booking, 'reminder');
            await sendSMSNotification(booking, 'reminder');

            // Kis késleltetés a rate limiting elkerülésére
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        console.log('✅ Emlékeztetők elküldve');
        return true;

    } catch (error) {
        console.error('❌ Emlékeztető küldés hiba:', error);
        return false;
    }
}

/**
 * Lemondási értesítés
 * @param {Object} booking
 */
async function sendCancellationNotification(booking) {
    const emailSent = await sendEmailNotification(booking, 'cancellation');

    // SMS lemondási üzenet
    const smsMessage = `K2 Barber - Foglalás lemondva\n\nIdőpont: ${booking.date} ${booking.time}\n\nÚj foglalás: k2barber.hu\n\nKérdés? +36 30 000 0000`;

    if (SMS_CONFIG.enabled) {
        // await sendSMSNotification(...)
        console.log('📱 Lemondási SMS szimuláció:', smsMessage);
    }

    return emailSent;
}

// EmailJS SDK betöltése (csak ha enabled)
function loadEmailJS() {
    if (EMAILJS_CONFIG.enabled && typeof emailjs === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js';
        script.onload = () => {
            emailjs.init(EMAILJS_CONFIG.publicKey);
            console.log('✅ EmailJS inicializálva');
        };
        document.head.appendChild(script);
    }
}

// Automatikus inicializálás
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadEmailJS);
} else {
    loadEmailJS();
}

/**
 * EmailJS Template példa (ezt használd az EmailJS Dashboard-on):
 * 
 * Subject: Foglalás megerősítés - K2 Barber
 * 
 * Body:
 * Kedves {{to_name}}!
 * 
 * Foglalásod sikeresen rögzítettük a K2 Barber-nél.
 * 
 * Részletek:
 * ------------------
 * Szolgáltatás: {{service}}
 * Időpont: {{date}} {{time}}
 * Telefonszám: {{phone}}
 * Megjegyzés: {{notes}}
 * Foglalás ID: {{booking_id}}
 * 
 * Kérjük, legalább 24 órával a foglalás előtt jelezd, ha mégsem tudsz érkezni!
 * 
 * Címünk: Budapest, Város utca 12.
 * Telefon: +36 30 000 0000
 * 
 * Üdvözlettel,
 * K2 Barber csapata
 */
