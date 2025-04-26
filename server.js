const express = require("express");
const mysql2 = require("mysql2");
const cors = require("cors");

const app = express();
const PORT = 4000;

// 🛑 Add CORS Middleware Before Any Routes
app.use(cors({
    origin: "*",  // Allow all origins
    methods: ["GET", "POST", "DELETE"],
    allowedHeaders: ["Content-Type"]
}));

// Middleware
app.use(express.json());
// MySQL Connection
const db = mysql2.createConnection({
    host: "localhost",
    user: "root", // Use your MySQL username
    password: ".....", // Use your MySQL password
    database: "inventorymgt",
});

db.connect((err) => {
    if (err) {
        console.error("Database connection failed:", err);
        return;
    }
    console.log("Connected to MySQL database.");
});

// ✅ Ensure CORS is applied before defining API routes
app.post("/api/add-item", (req, res) => {
    let { itemName, addedDateTime, costPrice, sellingPrice, quantity, barcode } = req.body;

    if (!barcode) {
        barcode = `QR-${Date.now()}`; // Generate QR code in backend
    }

    const formattedDateTime = addedDateTime || new Date().toISOString().slice(0, 19).replace("T", " ");

    const query = `CALL AddItem(?, ?, ?, ?, ?, ?)`;
    db.query(query, [itemName, formattedDateTime, costPrice, sellingPrice, quantity, barcode], (err, result) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).send("Database error: " + err.message);
        }
        res.json({ message: "Item added successfully!", barcode: barcode });
    });
});

app.get("/api/items", (req, res) => {
    const query = "SELECT * FROM Items"; // Fetch all items from MySQL

    db.query(query, (err, results) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).json({ error: "Database error" });
        }
        res.json(results); // Send JSON response with inventory items
    });
});

app.post("/api/sell-multiple-items", (req, res) => {
    const sales = req.body.sales; // List of sold items

    if (!sales || sales.length === 0) {
        return res.status(400).json({ error: "No items to sell." });
    }

    let queries = sales.map(sale => {
        return `CALL SellItem('${sale.itemName}', ${sale.quantityToSell})`;
    }).join("; ");

    db.query(queries, (err, result) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).json({ error: "Database error" });
        }
        res.json({ message: "Items sold successfully!" });
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

app.delete("/api/delete-item/:barcode", (req, res) => {
    let { barcode } = req.params;

    if (!barcode || barcode.toLowerCase() === "null") {
        return res.status(400).json({ error: "Invalid barcode. Cannot delete item without a barcode." });
    }

    const query = "DELETE FROM Items WHERE Barcode = ?";
    db.query(query, [barcode], (err, result) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).json({ error: "Database error" });
        }
        res.json({ message: "Item deleted successfully." });
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});


// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

