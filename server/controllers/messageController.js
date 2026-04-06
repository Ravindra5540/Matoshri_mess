const messageService = require("../services/messageService");

exports.sendMessage = async (req, res) => {
  try {
    const { phone, type, data } = req.body;

    if (!phone || !type) {
      return res.status(400).json({
        error: "phone and type are required"
      });
    }

    const result = await messageService.processMessage({
      phone,
      type,
      data
    });

    res.json({
      success: true,
      message: result
    });

  } catch (error) {
    console.error("Message Error:", error);
    res.status(500).json({
      error: "Failed to send message"
    });
  }
};