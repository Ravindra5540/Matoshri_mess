require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
const messageRoutes = require("./routes/messageRoutes");
const cronRoutes = require("./routes/cronRoutes");

// ✅ Middleware
app.use(express.json());

// ✅ CORS (IMPORTANT)
app.use(cors({
  origin: [
    "http://localhost:5173",   // Vite local
    "http://localhost:3000",   // React local
    "https://mess-management-b803c.web.app" // Firebase deployed URL
  ],
  credentials: true
}));

app.use("/api/messages", messageRoutes);

app.use("/api/cron", cronRoutes);
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