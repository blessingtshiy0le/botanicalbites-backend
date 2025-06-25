const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.post("/send-sms", async (req, res) => {
  const { phoneNumber, message } = req.body;

  const apiKey = "atsk_96a997f8bee46887743dccfeb29a7fd7611c89d661e712d37b5812724021d13c4d2257af"; // Replace with your actual Fast2SMS API key

  try {
    const response = await axios.post(
      "https://www.fast2sms.com/dev/bulkV2",
      {
        route: "q",
        message,
        language: "english",
        numbers: phoneNumber,
      },
      {
        headers: {
          authorization: apiKey,
        },
      }
    );

    res.json({ success: true, response: response.data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
