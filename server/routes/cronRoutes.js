const express = require("express");
const router = express.Router();
const { runCron } = require("../controllers/cronController");

router.get("/run", runCron);

module.exports = router;