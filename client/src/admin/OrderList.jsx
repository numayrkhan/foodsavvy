import { useEffect, useMemo, useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import {
  Box,
  Typography,
  Drawer,
  IconButton,
  Chip,
  Divider,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import RefundIcon from "@mui/icons-material/Replay";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { useAdminAuth } from "../auth/useAdminAuth";
import { labelForDateKey } from "../utils/grouping";

function StatusBadge({ status }) {
  const map = {
    confirmed: "bg-accent/20 text-gray-100 border border-accent/40",
    preparing: "bg-yellow-500/20 text-yellow-200 border border-yellow-500/40",
    out_for_delivery: "bg-blue-500/20 text-blue-200 border border-blue-500/40",
    completed:
      "bg-emerald-500/20 text-emerald-200 border border-emerald-500/40",
    pending: "bg-gray-500/20 text-gray-200 border border-gray-500/40",
  };
  return (
    <span
      className={`px-2 py-1 rounded-md text-xs font-semibold ${
        map[status] || map.pending
      }`}
    >
      {status?.replaceAll("_", " ") || "pending"}
    </span>
  );
}

function currency(cents) {
  const n = typeof cents === "number" ? cents : 0;
  return `$${(n / 100).toFixed(2)}`;
}
const toCents = (dollars) => Math.round(Number(dollars) * 100);
const toDollars = (cents) => (cents / 100).toFixed(2);

function labelOrDash(v) {
  return v ? v : "—";
}

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "preparing", label: "Preparing" },
  { value: "out_for_delivery", label: "Out for delivery" },
  { value: "completed", label: "Completed" },
];

export default function OrderList() {
  const [orders, setOrders] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const { token } = useAdminAuth();

  async function loadOrders() {
    const res = await fetch("/api/admin/orders", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setOrders(Array.isArray(data) ? data : []);
    if (selectedOrder) {
      const updated = data.find((o) => o.id === selectedOrder.id);
      if (updated) setSelectedOrder(updated);
    }
  }

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const columns = useMemo(
    () => [
      { field: "id", headerName: "ID", width: 80 },
      { field: "customerName", headerName: "Name", width: 160 },
      { field: "customerEmail", headerName: "Email", width: 220 },
      { field: "phone", headerName: "Phone", width: 150 },
      {
        field: "deliveryDate",
        headerName: "Schedule",
        width: 220,
        valueGetter: (params) => {
          if (!params || !params.row) return "";
          const { deliveryGroups, deliveryDate, deliverySlot } = params.row;

          // 1. Try deliveryGroups
          if (Array.isArray(deliveryGroups) && deliveryGroups.length > 0) {
            // Sort to find the earliest
            const sorted = [...deliveryGroups].sort(
              (a, b) => new Date(a.serviceDate) - new Date(b.serviceDate)
            );
            const group = sorted[0];
            if (!group || !group.serviceDate) return "";

            const d = new Date(group.serviceDate);
            const dateStr = d.toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            });
            return group.slot ? `${dateStr} – ${group.slot}` : dateStr;
          }

          // 2. Fallback to legacy flat fields
          if (deliveryDate) {
            const d = new Date(deliveryDate);
            const dateStr = d.toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            });
            return deliverySlot ? `${dateStr} – ${deliverySlot}` : dateStr;
          }

          return "";
        },
      },
      { field: "deliverySlot", headerName: "Time", width: 110 },
      {
        field: "status",
        headerName: "Status",
        width: 160,
        renderCell: (params) => <StatusBadge status={params.value} />,
        sortable: false,
      },
      {
        field: "totalCents",
        headerName: "Total",
        width: 110,
        renderCell: (params) => (
          <span className="font-semibold">{currency(params.value ?? 0)}</span>
        ),
      },
    ],
    []
  );

  return (
    <Box>
      <div className="mb-4">
        <Typography variant="h6" className="font-bold text-gray-100">
          All Orders
        </Typography>
        <p className="text-sm text-gray-200/70">
          Newest first. Click a row to view details.
        </p>
      </div>

      <div className="rounded-xl border border-accent-dark/30 bg-gray-900 p-2">
        <DataGrid
          rows={orders}
          columns={columns}
          getRowId={(row) => row.id}
          autoHeight
          disableRowSelectionOnClick
          onRowClick={(params) => {
            setSelectedOrder(params.row);
            setOpen(true);
          }}
          sx={{
            border: "none",
            "& .MuiDataGrid-columnHeaders": {
              backgroundColor: "rgba(72,127,81,0.25)",
              color: "#f7fafc",
              borderBottom: "1px solid rgba(72,127,81,0.3)",
            },
            "& .MuiDataGrid-cell": {
              color: "#f7fafc",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            },
            "& .MuiDataGrid-footerContainer": {
              backgroundColor: "rgba(32,30,32,0.6)",
              borderTop: "1px solid rgba(72,127,81,0.3)",
              color: "#edf2f7",
            },
          }}
        />
      </div>

      <OrderDetailsDrawer
        open={open}
        onClose={() => setOpen(false)}
        order={selectedOrder}
        token={token}
        onRefresh={loadOrders}
      />
    </Box>
  );
}

function OrderDetailsDrawer({ open, onClose, order, token, onRefresh }) {
  // Toasts
  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const showToast = (message, severity = "success") =>
    setToast({ open: true, message, severity });

  // Local state
  const [saving, setSaving] = useState(false);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [refundInput, setRefundInput] = useState(""); // dollars text input
  const [submittingRefund, setSubmittingRefund] = useState(false);
  const [localStatus, setLocalStatus] = useState(order?.status ?? "pending");

  useEffect(() => {
    setLocalStatus(order?.status ?? "pending");
  }, [order?.status]);

  useEffect(() => {
    // default refund input to remaining balance when opening
    if (order) {
      const remaining = Math.max(
        0,
        (order.totalCents || 0) - (order.refundedCents || 0)
      );
      setRefundInput(remaining > 0 ? toDollars(remaining) : "");
    }
  }, [order]);

  if (!order) return null;

  const {
    id,
    status,
    customerName,
    customerEmail,
    phone,
    address,
    deliveryDate,
    deliverySlot,
    fulfillment,
    totalCents,
    refundedCents = 0,
    stripePaymentIntentId,
    orderItems = [],
    addOns = [],
    createdAt,
    updatedAt,
  } = order;

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast("Copied to clipboard", "success");
    } catch {
      showToast("Copy failed", "error");
    }
  };

  const stripePaymentUrl = stripePaymentIntentId
    ? `https://dashboard.stripe.com/${
        import.meta.env.MODE === "production" ? "" : "test/"
      }payments/${stripePaymentIntentId}`
    : null;

  async function saveStatus() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: localStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      await onRefresh();
      showToast("Status updated", "success");
    } catch (e) {
      console.error(e);
      showToast("Could not update status", "error");
    } finally {
      setSaving(false);
    }
  }

  function openRefundDialog() {
    const remaining = Math.max(0, (totalCents || 0) - (refundedCents || 0));
    setRefundInput(remaining > 0 ? toDollars(remaining) : "");
    setRefundDialogOpen(true);
  }

  async function submitRefund() {
    const remaining = Math.max(0, (totalCents || 0) - (refundedCents || 0));
    if (!stripePaymentIntentId)
      return showToast("No payment intent on order", "error");

    const amountCents = toCents(refundInput);
    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      return showToast("Enter a valid amount", "error");
    }
    if (amountCents > remaining) {
      return showToast(`Max refundable is ${toDollars(remaining)}`, "error");
    }

    if (!window.confirm(`Refund $${toDollars(amountCents)} for order #${id}?`))
      return;

    setSubmittingRefund(true);
    try {
      const res = await fetch(`/api/admin/orders/${id}/refund`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amountCents }),
      });
      if (!res.ok) throw new Error("Refund failed");
      await onRefresh();
      setRefundDialogOpen(false);
      showToast("Refund created", "success");
    } catch (e) {
      console.error(e);
      showToast("Refund failed", "error");
    } finally {
      setSubmittingRefund(false);
    }
  }

  const remainingCents = Math.max(0, (totalCents || 0) - (refundedCents || 0));

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        slotProps={{
          paper: {
            className:
              "w-full max-w-[520px] bg-gray-900 border-l border-accent-dark/30",
          },
        }}
      >
        <div className="flex items-center justify-between p-4 border-b border-accent-dark/30">
          <div>
            <h3 className="text-lg font-bold text-gray-100">Order #{id}</h3>
            <p className="text-xs text-gray-400">
              Created {createdAt ? new Date(createdAt).toLocaleString() : "—"}
            </p>
          </div>
          <IconButton
            onClick={onClose}
            aria-label="Close drawer"
            color="inherit"
          >
            <CloseIcon />
          </IconButton>
        </div>

        <div className="p-4 space-y-10 overflow-y-auto">
          {/* Status + Actions */}
          <section className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Status:</span>
                <StatusBadge status={status} />
              </div>

              <FormControl size="small" className="min-w-[180px]">
                <InputLabel id="status-label">Update status</InputLabel>
                <Select
                  labelId="status-label"
                  label="Update status"
                  value={localStatus}
                  onChange={(e) => setLocalStatus(e.target.value)}
                >
                  {STATUS_OPTIONS.map((o) => (
                    <MenuItem key={o.value} value={o.value}>
                      {o.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Button
                variant="contained"
                onClick={saveStatus}
                disabled={saving || localStatus === status}
                className="bg-accent hover:bg-accent-dark"
                startIcon={saving ? <CircularProgress size={16} /> : null}
              >
                {saving ? "Saving..." : "Save"}
              </Button>

              <div className="flex-1" />

              <Button
                variant="outlined"
                color="inherit"
                onClick={openRefundDialog}
                disabled={!stripePaymentIntentId || remainingCents <= 0}
                startIcon={<RefundIcon />}
                className="border-white/20 text-gray-100"
              >
                Refund
              </Button>

              {stripePaymentUrl && (
                <Button
                  variant="text"
                  color="inherit"
                  endIcon={<OpenInNewIcon />}
                  href={stripePaymentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-gray-300"
                >
                  Open in Stripe
                </Button>
              )}
            </div>
          </section>

          {/* Totals / Fulfillment */}
          <section className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Total:</span>
              <span className="text-base font-semibold text-gray-100">
                {currency(totalCents)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Refunded:</span>
              <span className="text-base text-gray-100">
                {currency(refundedCents)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Remaining:</span>
              <span className="text-base text-gray-100">
                {currency(remainingCents)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Fulfillment:</span>
              <Chip
                size="small"
                label={fulfillment || "—"}
                className="bg-white/5 text-gray-100"
              />
            </div>
          </section>

          {/* Customer */}
          <section className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-300">Customer</h4>
            <div className="text-sm text-gray-100">
              {labelOrDash(customerName)}
            </div>
            <div className="text-sm text-gray-100">
              {labelOrDash(customerEmail)}
            </div>
            <div className="text-sm text-gray-100">{labelOrDash(phone)}</div>
            <div className="text-sm text-gray-100">{labelOrDash(address)}</div>
          </section>

          {/* Delivery */}
          <section className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-300">Delivery</h4>
            {/* If multiple groups, show summary. Else show single date/slot (or legacy). */}
            {order.deliveryGroups && order.deliveryGroups.length > 1 ? (
              <div className="text-sm text-gray-100 italic">
                Multiple dates – see breakdown below
              </div>
            ) : (
              <>
                <div className="text-sm text-gray-100">
                  Date:{" "}
                  {deliveryDate
                    ? new Date(deliveryDate).toLocaleDateString()
                    : "—"}
                </div>
                <div className="text-sm text-gray-100">
                  Time: {labelOrDash(deliverySlot)}
                </div>
              </>
            )}
          </section>

          {/* Payment */}
          <section className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-300">Payment</h4>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-100">
                PI: {labelOrDash(stripePaymentIntentId)}
              </span>
              {stripePaymentIntentId && (
                <Tooltip title="Copy Payment Intent ID">
                  <IconButton
                    size="small"
                    onClick={() => copy(stripePaymentIntentId)}
                    aria-label="Copy Payment Intent ID"
                  >
                    <ContentCopyIcon fontSize="inherit" />
                  </IconButton>
                </Tooltip>
              )}
            </div>
            <div className="text-xs text-gray-500">
              Updated {updatedAt ? new Date(updatedAt).toLocaleString() : "—"}
            </div>
          </section>

          <Divider className="border-accent-dark/30" />



// ...

          {/* Items */}
          <section className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-300">Items</h4>
            {order.deliveryGroups && order.deliveryGroups.length > 0 ? (
              <div className="space-y-4">
                {order.deliveryGroups
                  .sort((a, b) => new Date(a.serviceDate) - new Date(b.serviceDate))
                  .map((group) => (
                    <div key={group.id} className="border border-white/10 rounded-md overflow-hidden">
                      <div className="bg-white/5 px-3 py-2 flex justify-between items-center">
                        <span className="text-sm font-medium text-accent-light">
                          {labelForDateKey(new Date(group.serviceDate).toISOString().slice(0, 10))}
                        </span>
                        <span className="text-xs text-gray-400 bg-black/20 px-2 py-0.5 rounded">
                          {group.slot || "No slot"}
                        </span>
                      </div>
                      <ul className="divide-y divide-white/5">
                        {group.items.map((it) => (
                          <li
                            key={it.id}
                            className="flex items-center justify-between text-sm text-gray-100 px-3 py-2"
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {it.menuItem?.name ?? `Item #${it.menuItemId}`}
                              </span>
                              <span className="text-xs text-gray-400">
                                × {it.quantity}
                              </span>
                            </div>
                            <span className="font-semibold">
                              {currency(it.priceCents)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
              </div>
            ) : orderItems.length === 0 ? (
              <p className="text-sm text-gray-500">No items.</p>
            ) : (
              <ul className="space-y-2">
                {orderItems.map((it) => (
                  <li
                    key={it.id}
                    className="flex items-center justify-between text-sm text-gray-100 border-b border-white/5 pb-2"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {it.menuItem?.name ?? `Item #${it.menuItemId}`}
                      </span>
                      <span className="text-xs text-gray-400">
                        × {it.quantity}
                      </span>
                    </div>
                    <span className="font-semibold">
                      {currency(it.priceCents)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Add‑ons */}
          <section className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-300">Add‑ons</h4>
            {addOns.length === 0 ? (
              <p className="text-sm text-gray-500">No add‑ons.</p>
            ) : (
              <ul className="space-y-2">
                {addOns.map((ad) => (
                  <li
                    key={ad.id}
                    className="flex items-center justify-between text-sm text-gray-100 border-b border-white/5 pb-2"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{ad.name}</span>
                      <span className="text-xs text-gray-400">
                        × {ad.quantity}
                      </span>
                    </div>
                    <span className="font-semibold">
                      {currency(ad.priceCents)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </Drawer>

      {/* Refund dialog */}
      <Dialog
        open={refundDialogOpen}
        onClose={() => setRefundDialogOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Issue a refund</DialogTitle>
        <DialogContent className="pt-2">
          <div className="space-y-2">
            <div className="text-sm text-gray-600">
              Remaining refundable: <strong>{currency(remainingCents)}</strong>
            </div>
            <TextField
              label="Amount to refund (USD)"
              value={refundInput}
              onChange={(e) => setRefundInput(e.target.value)}
              placeholder={toDollars(remainingCents)}
              fullWidth
              inputProps={{ inputMode: "decimal" }}
              autoFocus
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRefundDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={submitRefund}
            variant="contained"
            disabled={submittingRefund}
            className="bg-accent hover:bg-accent-dark"
          >
            {submittingRefund ? "Processing..." : "Refund"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toasts */}
      <Snackbar
        open={toast.open}
        autoHideDuration={2500}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setToast((t) => ({ ...t, open: false }))}
          severity={toast.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </>
  );
}
