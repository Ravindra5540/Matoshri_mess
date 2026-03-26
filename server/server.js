require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();

// ✅ Middleware
app.use(express.json());

// ✅ CORS (IMPORTANT)
app.use(cors({
  origin: [
    "http://localhost:5173",   // Vite local
    "http://localhost:3000",   // React local
    "https://your-frontend.web.app" // Firebase deployed URL
  ],
  credentials: true
}));

// ✅ Test Route
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

// ✅ Test API
app.get("/api/test", (req, res) => {
  res.json({ message: "API working properly ✅" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});