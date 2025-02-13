const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Database connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'yourpassword',
    database: 'room_rental'
});

db.connect(err => {
    if (err) {
        console.error('Database connection failed:', err);
        return;
    }
    console.log('Database connected successfully');
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Configure nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'your-email@gmail.com',
        pass: 'your-email-password'
    }
});

// Send email notification
const sendEmailNotification = (to, subject, text) => {
    const mailOptions = {
        from: 'your-email@gmail.com',
        to,
        subject,
        text
    };

    transporter.sendMail(mailOptions, (err, info) => {
        if (err) console.error(err);
        else console.log('Email sent: ' + info.response);
    });
};

// Routes
app.get('/api/rooms', (req, res) => {
    const { location, price_min, price_max, room_type } = req.query;
    let sql = 'SELECT * FROM Rooms WHERE availability_status = "Available"';
    const params = [];

    if (location) {
        sql += ' AND location LIKE ?';
        params.push(`%${location}%`);
    }
    if (price_min) {
        sql += ' AND price >= ?';
        params.push(price_min);
    }
    if (price_max) {
        sql += ' AND price <= ?';
        params.push(price_max);
    }
    if (room_type) {
        sql += ' AND room_type = ?';
        params.push(room_type);
    }

    db.query(sql, params, (err, results) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).json({ error: 'Error fetching rooms' });
        }
        res.json(results);
    });
});

app.get('/api/rooms/:id', (req, res) => {
    const roomId = req.params.id;
    const sql = 'SELECT * FROM Rooms WHERE room_id = ?';
    
    db.query(sql, [roomId], (err, results) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).json({ error: 'Error fetching room details' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'Room not found' });
        }
        res.json(results[0]);
    });
});

// Example: Send email on booking
app.post('/book', (req, res) => {
    const { user_id, room_id, start_date, end_date } = req.body;
    const sql = 'INSERT INTO Bookings (user_id, room_id, booking_date, start_date, end_date, status) VALUES (?, ?, NOW(), ?, ?, "Booked")';
    db.query(sql, [user_id, room_id, start_date, end_date], (err, result) => {
        if (err) return res.status(500).send(err);
        res.status(201).send('Room booked successfully');

        // Send email notification
        const userEmail = 'user-email@example.com'; // Fetch user email from database
        sendEmailNotification(userEmail, 'Booking Confirmation', 'Your room has been booked successfully.');
    });
});

const roomsData = [
    {
        room_id: 1,
        room_type: "Single Room",
        location: "MIT Area, Cambridge",
        price: 350,
        amenities: "Free WiFi,Single Bed,Shared Bathroom,Shared Kitchen",
        availability_status: "Available",
        owner_contact_number: "+1234567890",
        description: "Cozy single room in a student-friendly environment. Located just 5 minutes walk from MIT campus. Ideal for students looking for affordable accommodation.",
        image_url: "img/rooms/single-room1.jpg"
    },
    {
        room_id: 2,
        room_type: "Double Room",
        location: "Financial District",
        price: 500,
        amenities: "Free WiFi,Two Beds,Private Bathroom,Shared Kitchen",
        availability_status: "Available",
        owner_contact_number: "+1234567891",
        description: "Spacious double room in the heart of the Financial District. Perfect for students or young professionals who want to share.",
        image_url: "img/rooms/double-room1.jpg"
    },
    {
        room_id: 3,
        room_type: "Studio Apartment",
        location: "Harvard Square",
        price: 750,
        amenities: "Free WiFi,Queen Bed,Private Bathroom,Private Kitchen",
        availability_status: "Available",
        owner_contact_number: "+1234567892",
        description: "Modern studio apartment near Harvard Square. Fully furnished with private kitchen and bathroom. Perfect for those seeking independence.",
        image_url: "img/rooms/studio1.jpg"
    },
    {
        room_id: 4,
        room_type: "Shared Room",
        location: "Brookline",
        price: 300,
        amenities: "Free WiFi,Bunk Bed,Shared Bathroom,Shared Kitchen",
        availability_status: "Available",
        owner_contact_number: "+1234567893",
        description: "Economic shared room in peaceful Brookline area. Great for students on a budget. Friendly roommates and welcoming environment.",
        image_url: "img/rooms/shared-room1.jpg"
    },
    {
        room_id: 5,
        room_type: "Luxury Single Room",
        location: "Theater District",
        price: 600,
        amenities: "LED Ambient Lighting,Premium Bedding,Modern Furniture,Built-in Wardrobe,Study Area,Air Conditioning",
        availability_status: "Available",
        owner_contact_number: "+1234567894",
        description: "Modern luxury single room featuring ambient LED lighting, premium furnishings, and built-in storage. Includes a comfortable study area, high-quality bedding, and contemporary design elements. Perfect for students who appreciate premium living space.",
        image_url: "img/rooms/luxury-single1.jpg"
    },
    {
        room_id: 6,
        room_type: "Economy Single",
        location: "Cambridge",
        price: 400,
        amenities: "Free WiFi,Single Bed,Shared Bathroom,Study Desk",
        availability_status: "Available",
        owner_contact_number: "+1234567895",
        description: "Affordable single room in Cambridge. Includes study desk and basic amenities. Great for students focusing on academics.",
        image_url: "img/rooms/economy-single1.jpg"
    }
];

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 