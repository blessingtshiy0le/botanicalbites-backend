const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");

const app = express();

// Replace localhost Mongo URI with secure Atlas URI
mongoose.connect(
  'mongodb+srv://blessingtshiyole9:4mXlawg0D27Bip9O@botanicalbites.5uvhh9j.mongodb.net/?retryWrites=true&w=majority&appName=BotanicalBites',
  {}
).then(() => console.log("✅ MongoDB connected"))
 .catch(err => console.error("❌ MongoDB connection error:", err));

app.use(cors());
app.use(bodyParser.json());

// Mongo Models
const Reservation = require("./models/Reservation");
const Order = require("./models/Order");
const Message = require("./models/Message");

// Email config
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "blessingtshiyole9@gmail.com",
    pass: "jemvuyasgucnrjjn",
  },
});

// Replace with your frontend domain (e.g. GitHub Pages, Netlify, Render static site, etc.)
const FRONTEND_URL = "https://your-frontend-url.netlify.app"; 
const BACKEND_URL = "https://botanicalbites-backend.onrender.com"; // Update if your backend Render URL is different

const pfConfig = {
  merchant_id: "10039846",
  merchant_key: "hxhvvdepo4umm",
  return_url: `${FRONTEND_URL}/success.html`,
  cancel_url: `${FRONTEND_URL}/index.html`,
  notify_url: `${BACKEND_URL}/notify`,
};

// ==================== ROUTES ====================

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'User-Admin' && password === 'Adm1n#') {
    return res.json({ success: true, message: 'Login successful' });
  }
  return res.status(401).json({ success: false, message: 'Invalid credentials' });
});

app.get('/api/reservations', async (req, res) => {
  try {
    const reservations = await Reservation.find().sort({ date: -1 });
    res.json(reservations);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch reservations" });
  }
});

app.post("/api/reservations", async (req, res) => {
  try {
    const newReservation = new Reservation(req.body);
    await newReservation.save();
    res.status(201).json({ success: true, message: "✅ Reservation saved" });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to save reservation" });
  }
});

app.post("/api/messages", async (req, res) => {
  try {
    const newMessage = new Message(req.body);
    await newMessage.save();
    res.status(201).json({ success: true, message: "✅ Message received" });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to send message" });
  }
});

app.get('/api/messages', async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

app.post("/send-email", async (req, res) => {
  const { email, message, name } = req.body;
  const mailOptions = {
    from: 'Botanical Bites <blessingtshiyole9@gmail.com>',
    to: email,
    subject: "Reservation Confirmation",
    text: `Hello ${name},\n\nThank you for your reservation!\n\nDetails:\n${message}\n\nSee you soon!`,
  };
  try {
    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: "✅ Reservation confirmation email sent." });
  } catch (error) {
    res.status(500).json({ success: false, message: "❌ Failed to send confirmation email." });
  }
});

app.post("/api/orders", async (req, res) => {
  try {
    const newOrder = new Order(req.body);
    await newOrder.save();
    console.log("✅ Order saved:", newOrder.reference);
    res.status(201).json({ success: true, message: "✅ Order saved", reference: newOrder.reference });
  } catch (err) {
    console.error("❌ Order save error:", err);
    res.status(500).json({ success: false, error: "Failed to save order" });
  }
});

app.post("/create-checkout", (req, res) => {
  const { amountInCents, customer, reference } = req.body;

  if (amountInCents < 200) {
    return res.status(400).json({ success: false, message: "❌ Minimum payment is R2.00" });
  }

  const amount = (amountInCents / 100).toFixed(2);
  const data = {
    merchant_id: pfConfig.merchant_id,
    merchant_key: pfConfig.merchant_key,
    return_url: pfConfig.return_url,
    cancel_url: pfConfig.cancel_url,
    notify_url: pfConfig.notify_url,
    amount,
    item_name: `Order #${reference}`,
    name_first: customer.name,
    email_address: customer.email,
  };

  const query = Object.entries(data).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&");
  const payfastUrl = `https://sandbox.payfast.co.za/eng/process?${query}`;
  res.json({ success: true, checkoutUrl: payfastUrl });
});

app.post("/notify", (req, res) => {
  console.log("📩 PayFast notification received");
  res.sendStatus(200);
});

// ==================== START SERVER ====================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
