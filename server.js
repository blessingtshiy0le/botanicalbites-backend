const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");

const app = express();

mongoose.connect(
  'mongodb+srv://blessingtshiyole9:4mXlawg0D27Bip9O@botanicalbites.5uvhh9j.mongodb.net/?retryWrites=true&w=majority&appName=BotanicalBites',
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
).then(() => console.log("✅ MongoDB connected"))
 .catch(err => console.error("❌ MongoDB connection error:", err));

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "../public")));

const Reservation = require("./models/Reservation");
const Order = require("./models/Order");
const Message = require("./models/Message");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "blessingtshiyole9@gmail.com",
    pass: "jemvuyasgucnrjjn",
  },
});

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

app.post("/api/orders", async (req, res) => {
  console.log("👉 Saving order:", req.body);
  try {
    const newOrder = new Order(req.body);
    await newOrder.save();
    console.log("✅ Saved order with reference:", newOrder.reference);
    res.status(201).json({ success: true, message: "Order saved", reference: newOrder.reference });
  } catch (err) {
    console.error("❌ Error saving order:", err);
    res.status(500).json({ success: false, error: "Failed to save order" });
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

const pfConfig = {
  merchant_id: "10039846",
  merchant_key: "hxhvvdepo4umm",
  return_url: "http://127.0.0.1:5500/success.html",
  cancel_url: "http://127.0.0.1:5500/index.html",
  notify_url: "http://localhost:5000/notify",
};

app.post("/create-checkout", (req, res) => {
  const { amountInCents, customer, reference } = req.body;

  if (amountInCents < 200) {
    return res.status(400).json({ success: false, message: "❌ Minimum payment amount is R2.00" });
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
  console.log("📩 PayFast payment notification received");
  res.sendStatus(200);
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

app.post("/api/orders", async (req, res) => {
  try {
    const newOrder = new Order(req.body);
    await newOrder.save();
    res.status(201).json({ success: true, message: "✅ Order saved" });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to save order" });
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

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});


// ======= ordering.html JavaScript (call this when user pays) =======
async function createOrderAndCheckout(orderDetails) {
  try {
    const reference = `BOT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    orderDetails.reference = reference;

    await fetch("http://localhost:5000/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderDetails),
    });

    localStorage.setItem("orderReference", reference);

    const amountInCents = Math.round(orderDetails.total * 100);
    const customer = { name: orderDetails.name, email: orderDetails.email };

    const checkoutResponse = await fetch("http://localhost:5000/create-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amountInCents, customer, reference }),
    });

    const checkoutData = await checkoutResponse.json();
    if (!checkoutData.success) throw new Error("Checkout failed");

    window.location.href = checkoutData.checkoutUrl;
  } catch (error) {
    alert("Payment failed: " + error.message);
  }
}