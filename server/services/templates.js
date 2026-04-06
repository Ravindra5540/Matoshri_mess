const templates = {
  CUSTOMER_CREATED: (data) => `
Hello ${data.name}, welcome to Matoshri Mess!
Your subscription is from ${data.startDate} to ${data.endDate}.
`,

CUSTOMER_CREATED_WITH_PAYMENT: (data) => `
Hello ${data.name}, welcome to Matoshri Mess! 🎉

Your subscription is from ${data.startDate} to ${data.endDate}.

💰 Payment Received: ₹${data.paid}
🧾 Total Plan: ₹${data.totalAmount}

Thank you!
`,

  PAYMENT_SUCCESS: (data) => `
Hello ${data.name}, we received ₹${data.amount}.
Remaining amount: ₹${data.remaining}.
`,

  HOLIDAY_ADDED: (data) => `
Hello ${data.name}, ${data.count} holidays added.
New end date: ${data.endDate}.
`,

  SUBSCRIPTION_RENEWED: (data) => `
Hello ${data.name}, your subscription is renewed.
Valid till ${data.endDate}.
`,

  DUE_REMINDER: (data) => `
Hello ${data.name}, your due amount is ₹${data.remaining}.
Please pay before ${data.dueDate}.
`,

  END_REMINDER: (data) => `
Hello ${data.name}, your subscription will end on ${data.endDate}.
`,

  SUBSCRIPTION_EXPIRED: (data) => `
Hello ${data.name}, your subscription has expired.
Please renew to continue service.
`
};

module.exports = templates;