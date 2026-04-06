const express = require("express");
const router = express.Router();
const { sendMessage } = require("../controllers/messageController");

console.log("sendMessage:", sendMessage);
// POST /api/messages/send
router.post("/send", sendMessage);

module.exports = router;    