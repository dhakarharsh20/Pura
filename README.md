# 🌿 Purawow — Full Stack Cinematic Ecommerce Website

**Zero Sugar Natural Sweetener Brand | Three.js + Express + MongoDB**

---

## 🚀 Quick Start

```bash
# 1. Install
npm install

# 2. Configure
cp .env.example .env
# → Edit .env with your MongoDB URI, Stripe key, etc.

# 3. Run
node server.js

# 4. Open
http://localhost:3000
```

---

## 📁 Project Structure

```
purawow/
├── server.js              ← Express backend + all API routes
├── package.json
├── .env.example           ← Copy to .env and configure
├── public/
│   └── index.html         ← Complete cinematic frontend
│                            (Three.js + full UI + cart + checkout)
└── README.md
```

---

## 🔌 API Reference

| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| GET | `/api/products` | All products | Public |
| GET | `/api/products/:id` | Single product | Public |
| GET | `/api/cart` | Session cart | Session |
| POST | `/api/cart/add` | Add item `{productId, qty}` | Session |
| POST | `/api/cart/update` | Update qty `{productId, qty}` | Session |
| POST | `/api/cart/remove` | Remove item `{productId}` | Session |
| POST | `/api/cart/clear` | Clear cart | Session |
| POST | `/api/checkout` | Place order | Session |
| GET | `/api/orders` | All orders (admin) | Admin |
| GET | `/api/orders/:orderId` | Order details | Admin |
| POST | `/api/contact` | Contact form | Public |
| GET | `/api/contacts` | All contacts (admin) | Admin |
| GET | `/api/health` | Server health check | Public |

### POST /api/checkout body:
```json
{
  "name": "Priya Sharma",
  "email": "priya@gmail.com",
  "phone": "+91 98765 43210",
  "address": "123, Green Park, Bandra West",
  "city": "Mumbai",
  "pincode": "400050",
  "payMode": "card"
}
```

### POST /api/contact body:
```json
{
  "name": "Arjun Mehta",
  "email": "arjun@gmail.com",
  "phone": "+91 99999 00000",
  "message": "I love your products!"
}
```

---

## 💳 Payment Integration

### Stripe (Card)
```bash
npm install stripe
```
Uncomment the Stripe section in `server.js` and set:
```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
```

### Razorpay (Indian Payments + UPI)
```bash
npm install razorpay
```
Uncomment the Razorpay section in `server.js` and set:
```env
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=...
```

---

## 📧 Email Setup (Nodemailer)

1. Create a Gmail App Password at `myaccount.google.com/apppasswords`
2. Set in `.env`:
```env
EMAIL_USER=hello@purawow.in
EMAIL_PASS=your-app-password
```

Order confirmation emails and contact notifications are sent automatically.

---

## 🗄️ MongoDB Schema

### Order
```js
{
  orderId: "PWW-1234567890-XY2AB",
  customer: { name, email, phone, address, city, pincode },
  items: [{ productId, name, emoji, price, qty, subtotal }],
  total: 598,
  payMode: "card",
  status: "confirmed",
  createdAt: Date
}
```

### Contact
```js
{
  name, email, phone, message,
  createdAt: Date
}
```

### Customer
```js
{
  name, email, phone,
  orders: [ObjectId],
  createdAt: Date
}
```

---

## 🎨 Frontend Features

### 3D Engine (Three.js r128)
- ✅ WebGL GPU-accelerated rendering
- ✅ Sugar cube with glass/crystal material
- ✅ Scroll-driven cube dissolve animation
- ✅ 28 crystal shards that scatter on scroll
- ✅ 1,500 tri-color floating particles
- ✅ 4 animated orbital rings
- ✅ Cursor-reactive particle cluster
- ✅ Mouse parallax camera system
- ✅ ACES filmic tone mapping
- ✅ Dynamic point lights

### Ecommerce
- ✅ 4 product cards (3D hover effect)
- ✅ Add to Cart with toast notification
- ✅ Cart panel (slide-in, qty control, remove)
- ✅ Checkout form (full details)
- ✅ Payment method selector (Card/UPI/Razorpay/COD)
- ✅ Stripe card UI
- ✅ Order confirmation screen
- ✅ Product detail modal
- ✅ Session-based cart (backend)

### UI/UX
- ✅ 8 cinematic content sections
- ✅ Scroll reveal animations
- ✅ Custom dual-ring cursor
- ✅ Ripple click effects on all CTAs
- ✅ Contact form with API call
- ✅ Responsive mobile design
- ✅ Glassmorphism UI cards
- ✅ Playfair Display + DM Sans typography
- ✅ Emerald / Gold / Cream color palette

---

## 🌱 Products

| # | Product | Price | SKU |
|---|---------|-------|-----|
| 1 | Stevia Sachets | ₹199 | PWW-SACHET-001 |
| 2 | Sauf Sharbat | ₹249 | PWW-SAUF-001 |
| 3 | Gulab Sharbat | ₹279 | PWW-GULAB-001 |
| 4 | Protein Bars | ₹349 | PWW-PBAR-001 |

---

## 🌍 Deployment

### Render / Railway / Fly.io
1. Push to GitHub
2. Connect to Render/Railway
3. Set env variables in dashboard
4. Deploy → live in minutes

### Vercel (frontend only)
Deploy `public/index.html` to Vercel for static hosting.

---

**Purawow** — *Sweetness. Reimagined.* 🌿
