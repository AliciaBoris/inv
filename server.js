const express = require("express");
const bodyParser = require("body-parser");
const mysql2 = require("mysql2");
const nodemailer = require("nodemailer");
const cors = require("cors");

const app = express();
const PORT = 3000;

// Middleware
app.use(cors()); // Allow requests from any origin
app.use(bodyParser.json());

// MySQL Connection
const db = mysql2.createConnection({
    host: "localhost",
    user: "root", // Use your MySQL username
    password: "#85CHigozie", // Use your MySQL password
    database: "inventorymgt",
});

db.connect((err) => {
    if (err) {
        console.error("Database connection failed:", err);
        return;
    }
    console.log("Connected to MySQL database.");
});

// Nodemailer Transporter
const transporter = nodemailer.createTransport({
    service: "gmail", // Or your email provider's service
    auth: {
        user: "rockandcitadel@gmail.com", // Your email
        pass: "85chigozie",    // Your email password or app-specific password
    },
});

app.post("/api/add-item", (req, res) => {
    const { itemName, addedDateTime, costPrice, sellingPrice, quantity, barcode } = req.body;

    console.log("Received Data:", req.body); // Debugging Log

    if (!barcode) {
        console.log("⚠ Warning: Barcode is NULL or empty!");
    }

    const formattedDateTime = addedDateTime ? addedDateTime : new Date().toISOString().slice(0, 19).replace("T", " ");

    const query = `CALL AddItem(?, ?, ?, ?, ?, ?)`; // Only 6 parameters
    db.query(query, [itemName, formattedDateTime, costPrice, sellingPrice, quantity, barcode], (err, result) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).send("Database error: " + err.message);
        }
        res.send("Item added successfully.");
    });
});

app.post("/api/add-item", (req, res) => {
    const { itemName, addedDateTime, costPrice, sellingPrice, quantity, barcode } = req.body;

    console.log("Received Data:", req.body); // Log incoming data

    const query = `CALL AddItem(?, ?, ?, ?, ?, ?)`; // Remove profit
    db.query(query, [itemName, addedDateTime, costPrice, sellingPrice, quantity, barcode], (err, result) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).send("Database error: " + err.message);
        }
        res.send("Item added successfully.");
    });
});

app.get("/api/items", (req, res) => {
    const query = "SELECT * FROM Items";
    db.query(query, (err, results) => {
        if (err) {
            console.error("Error fetching items:", err);
            res.status(500).send("Failed to fetch items.");
        } else {
            res.json(results); // Send the items as JSON
        }
    });
});


// API to Send Receipt
app.post("/api/send-receipt", (req, res) => {
    const { email, item_name, quantity, total_profit, date } = req.body;

    const mailOptions = {
        from: "rockandcitadel@gmail.com", // Sender email
        to: email,                      // Recipient email
        subject: "Your Sale Receipt",
        html: `
            <h1>Receipt</h1>
            <p><strong>Item:</strong> ${item_name}</p>
            <p><strong>Quantity Sold:</strong> ${quantity}</p>
            <p><strong>Total Profit:</strong> ₦${total_profit}</p>
            <p><strong>Date:</strong> ${date}</p>
        `,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error("Error sending email:", error);
            res.status(500).send("Failed to send email.");
        } else {
            console.log("Email sent:", info.response);
            res.send("Receipt sent successfully.");
        }
    });
});

// API to Send Daily Sales Report
app.post("/api/sales", (req, res) => {
    const { item_name, quantity, total_profit } = req.body;

    console.log("Received data:", req.body); // Log incoming data for debugging

    if (!item_name || !quantity || !total_profit) {
        console.error("Missing fields in request.");
        return res.status(400).send("Invalid request: Missing fields.");
    }

    const query = `INSERT INTO sales (item_name, quantity, total_profit) VALUES (?, ?, ?)`;
    db.query(query, [item_name, quantity, total_profit], (err, result) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).send("Database error: Failed to save sale.");
        }

        console.log("Insert result:", result); // Log result of the query
        res.send("Sale saved successfully.");
    });
});


// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

