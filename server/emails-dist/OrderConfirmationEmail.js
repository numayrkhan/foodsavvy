"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = OrderConfirmationEmail;
var _react = _interopRequireDefault(require("react"));
var _jsxRuntime = require("react/jsx-runtime");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
// server/emails/OrderConfirmationEmail.jsx

/**
 * Props shape (what your webhook passes in):
 * {
 *   id, customerName, customerEmail, phone, address, deliveryDate, deliverySlot,
 *   orderItems: [{ quantity, priceCents, menuItem: { name } }],
 *   addOns: [{ name, quantity, priceCents }],
 *   totalCents
 * }
 */function OrderConfirmationEmail({
  order
}) {
  const fmt = cents => (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD"
  });
  const items = order.orderItems || [];
  const addOns = order.addOns || [];
  const deliveryLines = [order.address, order.customerEmail ? String(order.customerEmail) : null, order.phone ? String(order.phone) : null, order.deliveryDate || order.deliverySlot ? `${order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : ""}${order.deliveryDate && order.deliverySlot ? " • " : ""}${order.deliverySlot || ""}` : null].filter(Boolean);

  // — styles (inline for email client support) —
  const colors = {
    bg: "#0A0F1A",
    // page background (very dark blue/black)
    card: "#141C2B",
    // panels
    text: "#E6EDF7",
    // primary text
    subtext: "#A6B2C6",
    border: "#263248",
    accent: "#0EA5E9",
    // cyan-ish
    mutedRow: "#1A2436"
  };
  const container = {
    width: "100%",
    backgroundColor: colors.bg,
    margin: 0,
    padding: "32px 0"
  };
  const wrapper = {
    width: "100%",
    maxWidth: "640px",
    margin: "0 auto",
    borderCollapse: "collapse"
  };
  const card = {
    backgroundColor: colors.card,
    borderRadius: "12px",
    border: `1px solid ${colors.border}`
  };
  const h1 = {
    margin: 0,
    color: colors.text,
    fontSize: "24px",
    fontWeight: 700,
    lineHeight: "1.3"
  };
  const p = {
    margin: "6px 0 0",
    color: colors.subtext,
    fontSize: "14px",
    lineHeight: "1.6"
  };
  const sectionTitle = {
    color: colors.text,
    fontSize: "14px",
    fontWeight: 600,
    margin: 0,
    paddingBottom: "8px"
  };
  const panel = {
    padding: "16px",
    backgroundColor: colors.card,
    borderRadius: "10px",
    border: `1px solid ${colors.border}`
  };
  const button = {
    display: "inline-block",
    backgroundColor: colors.accent,
    color: "#0B1220",
    textDecoration: "none",
    borderRadius: "8px",
    padding: "12px 18px",
    fontWeight: 700,
    fontSize: "14px"
  };
  const row = (label, value, isTotal = false) => ({
    label,
    value,
    isTotal
  });
  const priceRows = [...items.map(it => row(`${it.quantity}× ${it.menuItem?.name || "Item"}`, fmt(it.priceCents))), ...addOns.map(ad => row(`${ad.quantity}× ${ad.name}`, fmt(ad.priceCents)))];
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("html", {
    children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("head", {
      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("meta", {
        charSet: "utf-8"
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("title", {
        children: "Order Confirmation"
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("meta", {
        name: "color-scheme",
        content: "dark"
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("meta", {
        name: "supported-color-schemes",
        content: "dark"
      })]
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("body", {
      style: container,
      children: /*#__PURE__*/(0, _jsxRuntime.jsx)("table", {
        role: "presentation",
        width: "100%",
        cellPadding: "0",
        cellSpacing: "0",
        style: wrapper,
        children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("tbody", {
          children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("tr", {
            children: /*#__PURE__*/(0, _jsxRuntime.jsx)("td", {
              style: {
                padding: "0 20px 16px"
              },
              children: /*#__PURE__*/(0, _jsxRuntime.jsx)("table", {
                role: "presentation",
                width: "100%",
                style: card,
                cellPadding: "0",
                cellSpacing: "0",
                children: /*#__PURE__*/(0, _jsxRuntime.jsx)("tbody", {
                  children: /*#__PURE__*/(0, _jsxRuntime.jsx)("tr", {
                    children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("td", {
                      style: {
                        padding: "20px"
                      },
                      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("h1", {
                        style: h1,
                        children: "Order Confirmed \uD83C\uDF89"
                      }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("p", {
                        style: p,
                        children: ["Thanks", order.customerName ? `, ${order.customerName}` : "", "! Your order is confirmed."]
                      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
                        style: {
                          ...p,
                          marginTop: "6px"
                        },
                        children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("span", {
                          style: {
                            color: colors.subtext
                          },
                          children: ["Order #", order.id]
                        })
                      })]
                    })
                  })
                })
              })
            })
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("tr", {
            children: /*#__PURE__*/(0, _jsxRuntime.jsx)("td", {
              style: {
                padding: "0 20px 16px"
              },
              children: /*#__PURE__*/(0, _jsxRuntime.jsx)("table", {
                role: "presentation",
                width: "100%",
                style: panel,
                cellPadding: "0",
                cellSpacing: "0",
                children: /*#__PURE__*/(0, _jsxRuntime.jsx)("tbody", {
                  children: /*#__PURE__*/(0, _jsxRuntime.jsx)("tr", {
                    children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("td", {
                      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
                        style: sectionTitle,
                        children: "Delivery"
                      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("table", {
                        role: "presentation",
                        width: "100%",
                        cellPadding: "0",
                        cellSpacing: "0",
                        children: /*#__PURE__*/(0, _jsxRuntime.jsx)("tbody", {
                          children: deliveryLines.map((line, i) => /*#__PURE__*/(0, _jsxRuntime.jsx)("tr", {
                            children: /*#__PURE__*/(0, _jsxRuntime.jsx)("td", {
                              style: {
                                color: colors.subtext,
                                fontSize: "14px",
                                paddingTop: i === 0 ? 0 : 4
                              },
                              children: line
                            })
                          }, i))
                        })
                      })]
                    })
                  })
                })
              })
            })
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("tr", {
            children: /*#__PURE__*/(0, _jsxRuntime.jsx)("td", {
              style: {
                padding: "0 20px 16px"
              },
              children: /*#__PURE__*/(0, _jsxRuntime.jsx)("table", {
                role: "presentation",
                width: "100%",
                style: panel,
                cellPadding: "0",
                cellSpacing: "0",
                children: /*#__PURE__*/(0, _jsxRuntime.jsx)("tbody", {
                  children: /*#__PURE__*/(0, _jsxRuntime.jsx)("tr", {
                    children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("td", {
                      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
                        style: sectionTitle,
                        children: "Items"
                      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("table", {
                        role: "presentation",
                        width: "100%",
                        cellPadding: "0",
                        cellSpacing: "0",
                        children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("tbody", {
                          children: [priceRows.map((r, idx) => /*#__PURE__*/(0, _jsxRuntime.jsxs)("tr", {
                            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("td", {
                              style: {
                                padding: "8px 0",
                                borderBottom: `1px solid ${colors.border}`,
                                color: colors.text,
                                fontSize: "14px"
                              },
                              children: r.label
                            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("td", {
                              align: "right",
                              style: {
                                padding: "8px 0",
                                borderBottom: `1px solid ${colors.border}`,
                                color: colors.text,
                                fontSize: "14px",
                                whiteSpace: "nowrap"
                              },
                              children: r.value
                            })]
                          }, idx)), /*#__PURE__*/(0, _jsxRuntime.jsxs)("tr", {
                            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("td", {
                              style: {
                                paddingTop: 12,
                                color: colors.subtext,
                                fontSize: "14px"
                              },
                              children: "Total"
                            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("td", {
                              align: "right",
                              style: {
                                paddingTop: 12,
                                color: colors.text,
                                fontSize: "18px",
                                fontWeight: 800
                              },
                              children: fmt(order.totalCents)
                            })]
                          })]
                        })
                      })]
                    })
                  })
                })
              })
            })
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("tr", {
            children: /*#__PURE__*/(0, _jsxRuntime.jsx)("td", {
              style: {
                padding: "0 20px 8px"
              },
              children: /*#__PURE__*/(0, _jsxRuntime.jsx)("table", {
                role: "presentation",
                width: "100%",
                style: card,
                cellPadding: "0",
                cellSpacing: "0",
                children: /*#__PURE__*/(0, _jsxRuntime.jsx)("tbody", {
                  children: /*#__PURE__*/(0, _jsxRuntime.jsx)("tr", {
                    children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("td", {
                      style: {
                        padding: "20px",
                        textAlign: "left"
                      },
                      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("a", {
                        href: "https://foodsavy.com",
                        style: button,
                        children: "View your order"
                      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
                        style: {
                          ...p,
                          marginTop: "14px"
                        },
                        children: "Need help? Reply to this email and we\u2019ll get back to you."
                      })]
                    })
                  })
                })
              })
            })
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("tr", {
            children: /*#__PURE__*/(0, _jsxRuntime.jsx)("td", {
              style: {
                height: "16px"
              },
              children: "\xA0"
            })
          })]
        })
      })
    })]
  });
}