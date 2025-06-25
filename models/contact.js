const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
const PORT = 5000;
const SECRET_KEY = '6LdE_2ArAAAAAGbmR_nts53C6VRD4OvfonoMsb5S';

app.use(cors());
app.use(bodyParser.json());

app.post('/contact', async (req, res) => {
  const { name, email, subject, message, captchaToken } = req.body;

  if (!captchaToken) {
    return res.status(400).json({ success: false, message: 'No CAPTCHA token provided' });
  }

  // Validate CAPTCHA
  const verifyURL = `https://www.google.com/recaptcha/api/siteverify?secret=${SECRET_KEY}&response=${captchaToken}`;

  try {
    const captchaRes = await fetch(verifyURL, { method: 'POST' });
    const captchaJson = await captchaRes.json();

    if (!captchaJson.success) {
      return res.status(400).json({ success: false, message: 'Failed CAPTCHA verification' });
    }

    // Normally you'd send the message to an email or save it in a DB
    console.log("Message Received:", { name, email, subject, message });

    return res.json({ success: true, message: '✅ Message sent successfully!' });
  } catch (err) {
    console.error("Captcha verification failed:", err);
    return res.status(500).json({ success: false, message: 'Server error during CAPTCHA check' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
