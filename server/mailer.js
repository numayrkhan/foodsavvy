// server/mailer.js
const { Resend } = require("resend");
const { render, toPlainText } = require("@react-email/render"); // pretty() deprecated
const React = require("react");

// compiled output from your JSX template build step
const OrderEmail = require("./emails-dist/OrderConfirmationEmail.js").default;

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM || "Food Savvy <orders@example.com>"; // friendly name

async function sendOrderConfirmation(order) {
  if (!order?.customerEmail) return { skipped: true, reason: "no email" };

  // Render React → HTML email
  const html = await render(React.createElement(OrderEmail, { order }));
  // Optional: generate a clean text version for better deliverability
  const text = toPlainText(html);

  const { data, error } = await resend.emails.send({
    from: FROM,
    to: order.customerEmail,
    subject: `Your Food Savvy order #${order.id} is confirmed`,
    html,
    text,
    reply_to: "orders@foodsavy.com",
    // optional; omit to let Resend auto-generate
    // reply_to: "support@yourdomain.com", // optional
    // bcc: "orders-internal@yourdomain.com", // optional internal copy
    // headers: { "X-Order-ID": String(order.id) }, // optional tagging
  });

  if (error) throw error;
  return data; // contains id, etc.
}

module.exports = { sendOrderConfirmation };
