// ================================================================
// PURAWOW — Full Stack Express + MongoDB Backend
// ================================================================
// Setup:
//   npm install
//   node server.js
//
// Requires:
//   MongoDB (local or Atlas)
//   Set MONGODB_URI in .env
//   Set STRIPE_SECRET_KEY in .env
//   Set EMAIL_USER + EMAIL_PASS in .env (for Nodemailer)
//   Set RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET in .env
// ================================================================

require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

// ================================================================
// DATABASE CONNECTION
// ================================================================
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/purawow';

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => {
    console.error('⚠️  MongoDB connection failed — using in-memory store');
    console.error(err.message);
  });

// ================================================================
// MONGOOSE SCHEMAS
// ================================================================

const OrderSchema = new mongoose.Schema({
  orderId:    { type: String, unique: true },
  customer: {
    name:    String,
    email:   String,
    phone:   String,
    address: String,
    city:    String,
    pincode: String,
  },
  items: [{
    productId: Number,
    name:      String,
    emoji:     String,
    price:     Number,
    qty:       Number,
    subtotal:  Number,
  }],
  total:       Number,
  payMode:     String,
  status:      { type: String, default: 'confirmed' },
  createdAt:   { type: Date, default: Date.now },
});

const ContactSchema = new mongoose.Schema({
  name:      String,
  email:     String,
  phone:     String,
  message:   String,
  createdAt: { type: Date, default: Date.now },
});

const CustomerSchema = new mongoose.Schema({
  name:      String,
  email:     { type: String, unique: true },
  phone:     String,
  orders:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
  createdAt: { type: Date, default: Date.now },
});

const Order    = mongoose.model('Order',    OrderSchema);
const Contact  = mongoose.model('Contact',  ContactSchema);
const Customer = mongoose.model('Customer', CustomerSchema);

// ================================================================
// PRODUCTS DATA (swap to DB collection in production)
// ================================================================
const PRODUCTS = [
  {
    id: 1, emoji: '🫙', badge: 'Best Seller',
    name: 'Stevia Sachets',
    tagline: 'Natural sweetness. Anytime, anywhere.',
    description: 'Premium stevia sachets for chai, coffee, and everyday use.',
    benefits: ['Zero Sugar','Zero Calories','Travel Friendly','Perfect for Chai & Coffee'],
    price: 199, original: 299, stock: 500, sku: 'PWW-SACHET-001'
  },
  {
    id: 2, emoji: '🌿', badge: 'New Launch',
    name: 'Sauf Sharbat',
    tagline: 'Cool. Refreshing. Naturally sweet.',
    description: 'A refreshing fennel-based sharbat sweetened with pure stevia.',
    benefits: ['Zero Sugar','Digestive Cooling','Summer Perfect','Natural Fennel'],
    price: 249, original: 349, stock: 200, sku: 'PWW-SAUF-001'
  },
  {
    id: 3, emoji: '🌹', badge: 'Popular',
    name: 'Gulab Sharbat',
    tagline: 'The elegance of roses — without sugar.',
    description: 'Luxurious rose-flavoured sharbat sweetened with stevia.',
    benefits: ['Floral Natural Flavor','Zero Sugar','Perfect for Mocktails','Milk & Drinks'],
    price: 279, original: 399, stock: 150, sku: 'PWW-GULAB-001'
  },
  {
    id: 4, emoji: '💪', badge: 'Power',
    name: 'Protein Bars',
    tagline: 'Energy that fuels you — without sugar.',
    description: 'High-protein bars with no added sugar, sweetened with stevia.',
    benefits: ['High Protein 20g','No Added Sugar','Post-Workout','Multiple Flavors'],
    price: 349, original: 499, stock: 300, sku: 'PWW-PBAR-001'
  }
];

// ================================================================
// MIDDLEWARE
// ================================================================
app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'purawow-secret-2025',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false, maxAge: 86400000 * 7 }, // 7 days
}));

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ================================================================
// HELPERS
// ================================================================
function generateOrderId() {
  return 'PWW-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();
}

// ================================================================
// API ROUTES
// ================================================================

// ---- GET /api/products ----
app.get('/api/products', (req, res) => {
  res.json({ success: true, count: PRODUCTS.length, products: PRODUCTS });
});

// ---- GET /api/products/:id ----
app.get('/api/products/:id', (req, res) => {
  const product = PRODUCTS.find(p => p.id === parseInt(req.params.id));
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  res.json({ success: true, product });
});

// ---- GET /api/cart ----
app.get('/api/cart', (req, res) => {
  if (!req.session.cart) req.session.cart = [];
  const enriched = req.session.cart.map(item => {
    const p = PRODUCTS.find(pr => pr.id === item.id);
    return { ...item, product: p, subtotal: p ? p.price * item.qty : 0 };
  }).filter(i => i.product);
  const total = enriched.reduce((s, i) => s + i.subtotal, 0);
  res.json({
    success: true,
    cart: enriched,
    total,
    count: req.session.cart.reduce((s, i) => s + i.qty, 0)
  });
});

// ---- POST /api/cart/add ----
app.post('/api/cart/add', (req, res) => {
  const { productId, qty = 1 } = req.body;
  if (!req.session.cart) req.session.cart = [];
  const product = PRODUCTS.find(p => p.id === parseInt(productId));
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  const existing = req.session.cart.find(i => i.id === parseInt(productId));
  if (existing) { existing.qty += parseInt(qty); }
  else { req.session.cart.push({ id: parseInt(productId), qty: parseInt(qty) }); }
  res.json({
    success: true,
    message: `${product.name} added to cart`,
    count: req.session.cart.reduce((s, i) => s + i.qty, 0)
  });
});

// ---- POST /api/cart/update ----
app.post('/api/cart/update', (req, res) => {
  const { productId, qty } = req.body;
  if (!req.session.cart) req.session.cart = [];
  const newQty = parseInt(qty);
  if (newQty <= 0) {
    req.session.cart = req.session.cart.filter(i => i.id !== parseInt(productId));
  } else {
    const item = req.session.cart.find(i => i.id === parseInt(productId));
    if (item) item.qty = newQty;
  }
  res.json({ success: true, message: 'Cart updated' });
});

// ---- POST /api/cart/remove ----
app.post('/api/cart/remove', (req, res) => {
  const { productId } = req.body;
  if (!req.session.cart) req.session.cart = [];
  req.session.cart = req.session.cart.filter(i => i.id !== parseInt(productId));
  res.json({ success: true, message: 'Item removed' });
});

// ---- POST /api/cart/clear ----
app.post('/api/cart/clear', (req, res) => {
  req.session.cart = [];
  res.json({ success: true, message: 'Cart cleared' });
});

// ---- POST /api/checkout ----
app.post('/api/checkout', async (req, res) => {
  try {
    const { name, email, phone, address, city, pincode, payMode = 'card' } = req.body;
    if (!req.session.cart || req.session.cart.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }
    if (!name || !email || !address) {
      return res.status(400).json({ success: false, message: 'Name, email and address required' });
    }

    const items = req.session.cart.map(item => {
      const p = PRODUCTS.find(pr => pr.id === item.id);
      return { productId: p.id, name: p.name, emoji: p.emoji, price: p.price, qty: item.qty, subtotal: p.price * item.qty };
    });
    const total = items.reduce((s, i) => s + i.subtotal, 0);
    const orderId = generateOrderId();

    // Save order
    const order = new Order({ orderId, customer: { name, email, phone, address, city, pincode }, items, total, payMode });
    await order.save();

    // Upsert customer
    await Customer.findOneAndUpdate(
      { email },
      { $set: { name, phone }, $addToSet: { orders: order._id } },
      { upsert: true, new: true }
    );

    // Clear cart
    req.session.cart = [];

    // Send confirmation email
    if (process.env.EMAIL_USER) {
      try {
        const transporter = nodemailer.createTransporter({
          service: 'gmail',
          auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
        });
        await transporter.sendMail({
          from: `Purawow <${process.env.EMAIL_USER}>`,
          to: email,
          subject: `Order Confirmed — ${orderId}`,
          html: `<h2>Your Purawow order is confirmed!</h2>
            <p>Order ID: <strong>${orderId}</strong></p>
            <p>Total: ₹${total}</p>
            <p>Your sweetness is on the way! 🌿</p>`
        });
      } catch (emailErr) {
        console.error('Email error:', emailErr.message);
      }
    }

    res.json({ success: true, orderId, order, message: 'Order placed successfully' });
  } catch (err) {
    console.error('Checkout error:', err);
    res.status(500).json({ success: false, message: 'Server error during checkout' });
  }
});

// ---- POST /api/contact ----
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: 'Name, email and message required' });
    }
    const contact = new Contact({ name, email, phone, message });
    await contact.save();

    // Send notification email to admin
    if (process.env.EMAIL_USER) {
      try {
        const transporter = nodemailer.createTransporter({
          service: 'gmail',
          auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
        });
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
          subject: `New Contact: ${name} — Purawow`,
          html: `<h3>New contact from ${name}</h3>
            <p>Email: ${email}</p>
            <p>Phone: ${phone || 'N/A'}</p>
            <p>Message: ${message}</p>`
        });
      } catch (emailErr) {
        console.error('Email error:', emailErr.message);
      }
    }

    res.json({ success: true, message: 'Message received! We will get back to you soon.' });
  } catch (err) {
    console.error('Contact error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ---- GET /api/orders (admin) ----
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, count: orders.length, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---- GET /api/orders/:orderId ----
app.get('/api/orders/:orderId', async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---- GET /api/contacts (admin) ----
app.get('/api/contacts', async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, count: contacts.length, contacts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---- STRIPE PAYMENT INTENT ----
// Uncomment when STRIPE_SECRET_KEY is set:
/*
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
app.post('/api/payment/stripe/create-intent', async (req, res) => {
  try {
    const { amount, currency = 'inr' } = req.body;
    const intent = await stripe.paymentIntents.create({
      amount: amount * 100, // paise
      currency,
      automatic_payment_methods: { enabled: true },
    });
    res.json({ success: true, clientSecret: intent.client_secret });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
*/

// ---- RAZORPAY ORDER CREATE ----
// Uncomment when Razorpay keys are set:
/*
const Razorpay = require('razorpay');
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});
app.post('/api/payment/razorpay/create-order', async (req, res) => {
  try {
    const { amount } = req.body;
    const order = await razorpay.orders.create({
      amount: amount * 100, currency: 'INR',
      receipt: 'receipt_' + Date.now()
    });
    res.json({ success: true, orderId: order.id, amount: order.amount });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
*/

// ---- HEALTH CHECK ----
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// ---- SERVE FRONTEND ----
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ================================================================
// START SERVER
// ================================================================
app.listen(PORT, () => {
  console.log(`\n🌿 Purawow server running → http://localhost:${PORT}`);
  console.log(`📦 API endpoints ready at /api/*`);
  console.log(`🗃️  MongoDB: ${MONGO_URI}\n`);
});

module.exports = app;
