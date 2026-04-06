const messageService = require("../services/messageService");

exports.runCron = async (req, res) => {
  try {
    console.log("⏰ Cron running...");

    const customers = [
      {
        name: "Ravinn",
        phone: "919999999999",
        dueDate: "2026-03-30",
        endDate: "2026-03-31",
        remaining: 1
      }
    ];

    const today = new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Kolkata"
    });

    for (let c of customers) {

      // ✅ DUE REMINDER (2 days before)
      const due = new Date(c.dueDate);
      due.setDate(due.getDate() - 2);

      const dueMinus2 = due.toLocaleDateString("en-CA", {
        timeZone: "Asia/Kolkata"
      });

      if (dueMinus2 === today && c.remaining > 0) {
        await messageService.processMessage({
          phone: c.phone,
          type: "DUE_REMINDER",
          data: c
        });
      }

      // ✅ END REMINDER (1 day before)
      const endMinus1 = new Date(c.endDate);
      endMinus1.setDate(endMinus1.getDate() - 1);

      const endMinus1Str = endMinus1.toLocaleDateString("en-CA", {
        timeZone: "Asia/Kolkata"
      });

      if (endMinus1Str === today) {
        await messageService.processMessage({
          phone: c.phone,
          type: "END_REMINDER",
          data: c
        });
      }

      // ✅ EXPIRED
      const endDate = new Date(c.endDate).toLocaleDateString("en-CA", {
        timeZone: "Asia/Kolkata"
      });

      if (endDate < today) {
        await messageService.processMessage({
          phone: c.phone,
          type: "SUBSCRIPTION_EXPIRED",
          data: c
        });
      }
    }

    res.json({ success: true, message: "Cron executed" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Cron failed" });
  }
};