const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  name: String,
  email: String,
  method: String,  // 'delivery' or 'pickup'
  address: String,
  phone: String,
  branch: String,
  items: [{
    name: String,
    quantity: Number,
    price: String,
  }],
  total: String,
  reference: { type: String, unique: true, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Order', OrderSchema);
