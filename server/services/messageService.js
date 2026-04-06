const templates = require("./templates");

exports.processMessage = async ({ phone, type, data }) => {
  // 1️⃣ Generate message
  const templateFn = templates[type];

  if (!templateFn) {
    throw new Error("Invalid message type");
  }

  const message = templateFn(data);
  console.log("TYPE RECEIVED:", type);
  console.log("data RECEIVED:", data);

  // 2️⃣ (FOR NOW) Log message
  console.log("📩 Sending Message:");
  console.log("To:", phone);
  console.log("Message:", message);

  // 3️⃣ FUTURE → WhatsApp API call
  // await whatsappClient.send(phone, message)

  return message;
};