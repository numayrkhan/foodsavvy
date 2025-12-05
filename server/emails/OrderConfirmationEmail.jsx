// server/emails/OrderConfirmationEmail.jsx
import React from "react";
import { labelForDateKey } from "../../client/src/utils/grouping.js";

/**
 * Props shape (what your webhook passes in):
 * {
 *   id, customerName, customerEmail, phone, address, deliveryDate, deliverySlot,
 *   orderItems: [{ quantity, priceCents, menuItem: { name } }],
 *   addOns: [{ name, quantity, priceCents }],
 *   totalCents
 * }
 */
export default function OrderConfirmationEmail({ order }) {
  const fmt = (cents) =>
    (cents / 100).toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    });

  const items = order.orderItems || [];
  const addOns = order.addOns || [];

  const deliveryLines = [
    order.address,
    order.customerEmail ? String(order.customerEmail) : null,
    order.phone ? String(order.phone) : null,
    order.deliveryDate || order.deliverySlot
      ? `${order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : ""}${
          order.deliveryDate && order.deliverySlot ? " • " : ""
        }${order.deliverySlot || ""}`
      : null,
  ].filter(Boolean);

  // — styles (inline for email client support) —
  const colors = {
    bg: "#0A0F1A", // page background (very dark blue/black)
    card: "#141C2B", // panels
    text: "#E6EDF7", // primary text
    subtext: "#A6B2C6",
    border: "#263248",
    accent: "#0EA5E9", // cyan-ish
    mutedRow: "#1A2436",
  };

  const container = {
    width: "100%",
    backgroundColor: colors.bg,
    margin: 0,
    padding: "32px 0",
  };

  const wrapper = {
    width: "100%",
    maxWidth: "640px",
    margin: "0 auto",
    borderCollapse: "collapse",
  };

  const card = {
    backgroundColor: colors.card,
    borderRadius: "12px",
    border: `1px solid ${colors.border}`,
  };

  const h1 = {
    margin: 0,
    color: colors.text,
    fontSize: "24px",
    fontWeight: 700,
    lineHeight: "1.3",
  };

  const p = {
    margin: "6px 0 0",
    color: colors.subtext,
    fontSize: "14px",
    lineHeight: "1.6",
  };

  const sectionTitle = {
    color: colors.text,
    fontSize: "14px",
    fontWeight: 600,
    margin: 0,
    paddingBottom: "8px",
  };

  const panel = {
    padding: "16px",
    backgroundColor: colors.card,
    borderRadius: "10px",
    border: `1px solid ${colors.border}`,
  };

  const button = {
    display: "inline-block",
    backgroundColor: colors.accent,
    color: "#0B1220",
    textDecoration: "none",
    borderRadius: "8px",
    padding: "12px 18px",
    fontWeight: 700,
    fontSize: "14px",
  };

  const row = (label, value, isTotal = false) => ({
    label,
    value,
    isTotal,
  });

  const priceRows = [
    ...items.map((it) =>
      row(`${it.quantity}× ${it.menuItem?.name || "Item"}`, fmt(it.priceCents))
    ),
    ...addOns.map((ad) =>
      row(`${ad.quantity}× ${ad.name}`, fmt(ad.priceCents))
    ),
  ];

  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <title>Order Confirmation</title>
        <meta name="color-scheme" content="dark" />
        <meta name="supported-color-schemes" content="dark" />
      </head>
      <body style={container}>
        {/* outer wrapper table for reliable dark background */}
        <table
          role="presentation"
          width="100%"
          cellPadding="0"
          cellSpacing="0"
          style={wrapper}
        >
          <tbody>
            {/* header / hero */}
            <tr>
              <td style={{ padding: "0 20px 16px" }}>
                <table
                  role="presentation"
                  width="100%"
                  style={card}
                  cellPadding="0"
                  cellSpacing="0"
                >
                  <tbody>
                    <tr>
                      <td style={{ padding: "20px" }}>
                        <h1 style={h1}>Order Confirmed 🎉</h1>
                        <p style={p}>
                          Thanks
                          {order.customerName ? `, ${order.customerName}` : ""}!
                          Your order is confirmed.
                        </p>
                        <p style={{ ...p, marginTop: "6px" }}>
                          <span style={{ color: colors.subtext }}>
                            Order #{order.id}
                          </span>
                        </p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>

            {/* delivery block */}
            <tr>
              <td style={{ padding: "0 20px 16px" }}>
                <table
                  role="presentation"
                  width="100%"
                  style={panel}
                  cellPadding="0"
                  cellSpacing="0"
                >
                  <tbody>
                    <tr>
                      <td>
                        <p style={sectionTitle}>Delivery</p>
                        <table
                          role="presentation"
                          width="100%"
                          cellPadding="0"
                          cellSpacing="0"
                        >
                          <tbody>
                            {deliveryLines.map((line, i) => (
                              <tr key={i}>
                                <td
                                  style={{
                                    color: colors.subtext,
                                    fontSize: "14px",
                                    paddingTop: i === 0 ? 0 : 4,
                                  }}
                                >
                                  {line}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>

            {/* items list */}
            <tr>
              <td style={{ padding: "0 20px 16px" }}>
                <table
                  role="presentation"
                  width="100%"
                  style={panel}
                  cellPadding="0"
                  cellSpacing="0"
                >
                  <tbody>
                    <tr>
                      <td>
                        <p style={sectionTitle}>Items</p>
                        <table
                          role="presentation"
                          width="100%"
                          cellPadding="0"
                          cellSpacing="0"
                        >
                          <tbody>
                            {/* Multi-day groups */}
                            {order.deliveryGroups && order.deliveryGroups.length > 0 ? (
                              order.deliveryGroups
                                .sort((a, b) => new Date(a.serviceDate) - new Date(b.serviceDate))
                                .map((group, gIdx) => {
                                  // Format date label
                                  // Format date label
                                  const dateLabel = labelForDateKey(
                                    new Date(group.serviceDate)
                                      .toISOString()
                                      .slice(0, 10)
                                  );
                                  return (
                                    <React.Fragment key={gIdx}>
                                      <tr>
                                        <td
                                          colSpan={2}
                                          style={{
                                            padding: "12px 0 4px",
                                            color: colors.accent,
                                            fontSize: "13px",
                                            fontWeight: 700,
                                            borderBottom: `1px solid ${colors.border}`,
                                          }}
                                        >
                                          {dateLabel}
                                          {group.slot ? ` • ${group.slot}` : ""}
                                        </td>
                                      </tr>
                                      {group.items.map((it, iIdx) => (
                                        <tr key={iIdx}>
                                          <td
                                            style={{
                                              padding: "8px 0",
                                              borderBottom: `1px solid ${colors.border}`,
                                              color: colors.text,
                                              fontSize: "14px",
                                              paddingLeft: "12px",
                                            }}
                                          >
                                            {it.quantity}× {it.menuItem?.name || "Item"}
                                          </td>
                                          <td
                                            align="right"
                                            style={{
                                              padding: "8px 0",
                                              borderBottom: `1px solid ${colors.border}`,
                                              color: colors.text,
                                              fontSize: "14px",
                                              whiteSpace: "nowrap",
                                            }}
                                          >
                                            {fmt(it.priceCents * it.quantity)}
                                          </td>
                                        </tr>
                                      ))}
                                    </React.Fragment>
                                  );
                                })
                            ) : (
                              /* Legacy flat list */
                              items.map((it, idx) => (
                                <tr key={idx}>
                                  <td
                                    style={{
                                      padding: "8px 0",
                                      borderBottom: `1px solid ${colors.border}`,
                                      color: colors.text,
                                      fontSize: "14px",
                                    }}
                                  >
                                    {it.quantity}× {it.menuItem?.name || "Item"}
                                  </td>
                                  <td
                                    align="right"
                                    style={{
                                      padding: "8px 0",
                                      borderBottom: `1px solid ${colors.border}`,
                                      color: colors.text,
                                      fontSize: "14px",
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    {fmt(it.priceCents)}
                                  </td>
                                </tr>
                              ))
                            )}

                            {/* Add-ons */}
                            {addOns.length > 0 && (
                              <>
                                <tr>
                                  <td
                                    colSpan={2}
                                    style={{
                                      padding: "12px 0 4px",
                                      color: colors.subtext,
                                      fontSize: "12px",
                                      fontWeight: 600,
                                      borderBottom: `1px solid ${colors.border}`,
                                    }}
                                  >
                                    Add-ons
                                  </td>
                                </tr>
                                {addOns.map((ad, idx) => (
                                  <tr key={`addon-${idx}`}>
                                    <td
                                      style={{
                                        padding: "8px 0",
                                        borderBottom: `1px solid ${colors.border}`,
                                        color: colors.text,
                                        fontSize: "14px",
                                        paddingLeft: "12px",
                                      }}
                                    >
                                      {ad.quantity}× {ad.name}
                                    </td>
                                    <td
                                      align="right"
                                      style={{
                                        padding: "8px 0",
                                        borderBottom: `1px solid ${colors.border}`,
                                        color: colors.text,
                                        fontSize: "14px",
                                        whiteSpace: "nowrap",
                                      }}
                                    >
                                      {fmt(ad.priceCents * ad.quantity)}
                                    </td>
                                  </tr>
                                ))}
                              </>
                            )}

                            {/* total */}
                            <tr>
                              <td
                                style={{
                                  paddingTop: 12,
                                  color: colors.subtext,
                                  fontSize: "14px",
                                }}
                              >
                                Total
                              </td>
                              <td
                                align="right"
                                style={{
                                  paddingTop: 12,
                                  color: colors.text,
                                  fontSize: "18px",
                                  fontWeight: 800,
                                }}
                              >
                                {fmt(order.totalCents)}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>

            {/* CTA */}
            <tr>
              <td style={{ padding: "0 20px 8px" }}>
                <table
                  role="presentation"
                  width="100%"
                  style={card}
                  cellPadding="0"
                  cellSpacing="0"
                >
                  <tbody>
                    <tr>
                      <td style={{ padding: "20px", textAlign: "left" }}>
                        {/* If you have an order page, put the real URL here */}
                        <a href="https://foodsavy.com" style={button}>
                          View your order
                        </a>
                        <p style={{ ...p, marginTop: "14px" }}>
                          Need help? Reply to this email and we’ll get back to
                          you.
                        </p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>

            {/* footer space */}
            <tr>
              <td style={{ height: "16px" }}>&nbsp;</td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  );
}
