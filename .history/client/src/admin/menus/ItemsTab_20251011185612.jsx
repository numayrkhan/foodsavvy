// client/src/admin/menus/ItemsTab.jsx
import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Box,
  Button,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Stack,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CategoryIcon from "@mui/icons-material/Category";
import AddIcon from "@mui/icons-material/Add";
import TuneIcon from "@mui/icons-material/Tune";
import ExtensionIcon from "@mui/icons-material/Extension";
import MenuItemForm from "./components/MenuItemForm";
import VariantsEditor from "./components/VariantsEditor";
import AddOnLinker from "./components/AddOnLinker";
import { useAdminAuth } from "../../auth/useAdminAuth";

const WEEKDAYS = [
  { v: 0, label: "Sun" },
  { v: 1, label: "Mon" },
  { v: 2, label: "Tue" },
  { v: 3, label: "Wed" },
  { v: 4, label: "Thu" },
  { v: 5, label: "Fri" },
  { v: 6, label: "Sat" },
];

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function ItemsTab() {
  const { token } = useAdminAuth();
  const authHeader = useMemo(
    () => ({ Authorization: `Bearer ${token}` }),
    [token]
  );

  // Selection state
  const [weekday, setWeekday] = useState(1); // Mon default
  const [scope, setScope] = useState("templates"); // "templates" | "week"
  const [weekOf, setWeekOf] = useState("");        // YYYY-MM-DD when scope === "week"

  // Data
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [addons, setAddons] = useState([]);
  const [q, setQ] = useState("");

  // Dialogs
  const [editing, setEditing] = useState(null);
  const [confirmGen, setConfirmGen] = useState(false);
  const [genDays, setGenDays] = useState([1, 2, 3]); // Mon–Wed default

  // Load items (by weekday + optional weekOf), categories, add-ons
  const loadAll = useCallback(
    async (signal) => {
      if (!token) return;
      try {
        const itemsUrl =
          scope === "week" && weekOf
            ? `/api/admin/menus/by-day?weekday=${weekday}&weekOf=${weekOf}`
            : `/api/admin/menus/by-day?weekday=${weekday}`;

        const [itemsRes, catsRes, addonsRes] = await Promise.all([
          fetch(itemsUrl, { headers: authHeader, signal, credentials: "include" }),
          fetch("/api/admin/categories", { headers: authHeader, signal, credentials: "include" }),
          fetch("/api/admin/addons", { headers: authHeader, signal, credentials: "include" }),
        ]);

        if (!itemsRes.ok || !catsRes.ok || !addonsRes.ok) {
          const [it, ct, ad] = await Promise.all([
            itemsRes.text(), catsRes.text(), addonsRes.text(),
          ]);
          console.error("Load failed", { items: it, categories: ct, addons: ad });
          return;
        }

        const [itemsData, catsData, addonsData] = await Promise.all([
          itemsRes.json(), catsRes.json(), addonsRes.json(),
        ]);

        setItems(Array.isArray(itemsData?.items) ? itemsData.items : []);
        setCategories(Array.isArray(catsData) ? catsData : []);
        setAddons(Array.isArray(addonsData) ? addonsData : []);
      } catch (err) {
        if (err?.name === "AbortError") return;
        console.error("Failed to load data", err);
      }
    },
    [authHeader, token, weekday, weekOf, scope]
  );

  useEffect(() => {
    const controller = new AbortController();
    loadAll(controller.signal);
    return () => controller.abort();
  }, [loadAll]);

  // Search filter
  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    if (!ql) return items;
    return items.filter((i) => {
      const name = i?.name?.toLowerCase() || "";
      const cat = i?.category?.name?.toLowerCase() || "";
      return name.includes(ql) || cat.includes(ql);
    });
  }, [items, q]);

  // Create / Update
  async function handleCreateOrUpdate(payload) {
    const res = await fetch("/api/admin/menus/item", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader },
      credentials: "include",
      body: JSON.stringify({
        ...payload,
        weekday,
        weekOf: scope === "week" && weekOf ? weekOf : undefined,
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      return alert(`Save failed: ${t}`);
    }
    await loadAll();
    setEditing(null);
  }

  // Safe delete (soft-delete if item has orders)
  async function handleDelete(id) {
    if (!confirm("Remove this item from the menu?")) return;
    const res = await fetch(`/api/admin/menus/${id}`, {
      method: "DELETE",
      headers: authHeader,
      credentials: "include",
    });
    if (res.status === 204) {
      await loadAll();
      return;
    }
    if (res.ok) {
      const json = await res.json().catch(() => ({}));
      if (json?.softDeleted) {
        alert("Item had orders and was archived (hidden from customers).");
      }
      await loadAll();
      return;
    }
    const t = await res.text();
    alert(`Delete failed: ${t || res.statusText}`);
  }

  return (
    <Box>
      {/* Controls row */}
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2, flexWrap: "wrap" }}>
        <TextField
          label="Search items or categories"
          size="small"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setEditing({})}>
          New Item
        </Button>

        {/* Scope: Templates vs Specific week */}
        <Stack direction="row" spacing={1} alignItems="center">
          <Button
            size="small"
            variant={scope === "templates" ? "contained" : "outlined"}
            onClick={() => setScope("templates")}
          >
            Templates
          </Button>
          <Button
            size="small"
            variant={scope === "week" ? "contained" : "outlined"}
            onClick={() => setScope("week")}
          >
            Specific week
          </Button>
        </Stack>

        {/* Week picker (only for Specific week) */}
        {scope === "week" && (
          <TextField
            label="Week of (Mon)"
            type="date"
            size="small"
            value={weekOf}
            onChange={(e) => setWeekOf(e.target.value)}
            helperText="Choose a Monday to edit that week"
          />
        )}

        {/* Weekday toggle (right-aligned) */}
        <Stack direction="row" spacing={1} alignItems="center" sx={{ ml: "auto" }}>
          {WEEKDAYS.map((d) => (
            <Button
              key={d.v}
              size="small"
              variant={weekday === d.v ? "contained" : "outlined"}
              onClick={() => setWeekday(d.v)}
            >
              {d.label}
            </Button>
          ))}
        </Stack>
      </Stack>

      {/* Generate Week (clone templates into a week) */}
      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        <Button
          variant="outlined"
          disabled={!(scope === "week" && weekOf)}
          title="Clone your templates into the selected week"
          onClick={() => setConfirmGen(true)}
        >
          Generate Week
        </Button>
      </Stack>

      <Dialog open={confirmGen} onClose={() => setConfirmGen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Generate week</DialogTitle>
        <DialogContent dividers>
          <p className="mb-2">Choose days to generate from your templates:</p>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {DAY_LABELS.map((d, i) => {
              const on = genDays.includes(i);
              return (
                <Button
                  key={d}
                  size="small"
                  variant={on ? "contained" : "outlined"}
                  onClick={() =>
                    setGenDays((arr) => (on ? arr.filter((x) => x !== i) : [...arr, i]))
                  }
                >
                  {d}
                </Button>
              );
            })}
          </Stack>
          <p className="mt-3" style={{ opacity: 0.7, fontSize: 12 }}>
            Tip: Mon–Wed is the usual pattern.
          </p>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmGen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={async () => {
              const res = await fetch("/api/admin/menus/start-week", {
                method: "POST",
                headers: { "Content-Type": "application/json", ...authHeader },
                credentials: "include",
                body: JSON.stringify({ weekOf, weekdays: genDays.sort() }),
              });
              if (!res.ok) {
                const t = await res.text();
                alert(`Generate week failed: ${t}`);
              } else {
                setConfirmGen(false);
                await loadAll();
              }
            }}
          >
            Generate
          </Button>
        </DialogActions>
      </Dialog>

      {/* Table */}
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Category</TableCell>
              <TableCell align="center">Pricing</TableCell>
              <TableCell align="center">Add-ons</TableCell>
              <TableCell align="right" width={220}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((i) => (
              <TableRow key={i.id} hover>
                <TableCell>
                  <Stack direction="row" spacing={1} alignItems="center">
                    {i.imageUrl ? (
                      <img
                        src={i.imageUrl}
                        alt=""
                        width={36}
                        height={36}
                        style={{ borderRadius: 6, objectFit: "cover" }}
                      />
                    ) : null}
                    <div>{i.name}</div>
                  </Stack>
                </TableCell>

                <TableCell>
                  {i.category?.name ? (
                    <Chip
                      size="small"
                      icon={<CategoryIcon fontSize="small" />}
                      label={i.category.name}
                    />
                  ) : (
                    "—"
                  )}
                  {i.archived && <Chip size="small" label="Archived" sx={{ ml: 1 }} />}
                </TableCell>

                <TableCell align="center">
                  {i.variants?.length || 0}
                  {(i.variants?.length ?? 0) === 0 && (
                    <Chip size="small" color="warning" label="Add a price" sx={{ ml: 1 }} />
                  )}
                </TableCell>

                <TableCell align="center">{i.addOns?.length || 0}</TableCell>

                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Tooltip title="Edit pricing">
                      <IconButton
                        size="small"
                        onClick={() => setEditing({ ...i, _panel: "variants" })}
                      >
                        <TuneIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Link add-ons">
                      <IconButton
                        size="small"
                        onClick={() => setEditing({ ...i, _panel: "addons" })}
                      >
                        <ExtensionIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => setEditing(i)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(i.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}

            {!filtered.length && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 6, color: "text.secondary" }}>
                  {scope === "week" && weekOf ? (
                    <>
                      No items for <strong>{WEEKDAYS.find((d) => d.v === weekday)?.label}</strong>{" "}
                      (week of {weekOf}). Generate the week or switch to Templates.
                    </>
                  ) : (
                    <>
                      No items in Templates for{" "}
                      <strong>{WEEKDAYS.find((d) => d.v === weekday)?.label}</strong>.
                    </>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={!!editing} onClose={() => setEditing(null)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editing?._panel === "variants"
            ? "Edit Pricing"
            : editing?._panel === "addons"
            ? "Link Add-ons"
            : editing?.id
            ? "Edit Item"
            : "New Item"}
        </DialogTitle>
        <DialogContent dividers>
          {editing?._panel === "variants" && (
            <VariantsEditor
              itemId={editing.id}
              initial={editing.variants || []}
              onSaved={async () => {
                await loadAll();
                setEditing(null);
              }}
              authHeader={authHeader}
            />
          )}
          {editing?._panel === "addons" && (
            <AddOnLinker
              itemId={editing.id}
              allAddOns={addons}
              linked={editing.addOns || []}
              onSaved={async () => {
                await loadAll();
                setEditing(null);
              }}
              authHeader={authHeader}
            />
          )}
          {!editing?._panel && (
            <MenuItemForm
              data={editing || {}}
              categories={categories}
              onCancel={() => setEditing(null)}
              onSubmit={handleCreateOrUpdate}
              authHeader={authHeader}
              weekday={weekday}
              weekOf={scope === "week" && weekOf ? weekOf : undefined}
            />
          )}
        </DialogContent>
        {!editing?._panel && (
          <DialogActions>
            <Button onClick={() => setEditing(null)}>Close</Button>
          </DialogActions>
        )}
      </Dialog>
    </Box>
  );
}
