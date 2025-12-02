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
  { v: 0, label: "Sun" }, { v: 1, label: "Mon" }, { v: 2, label: "Tue" },
  { v: 3, label: "Wed" }, { v: 4, label: "Thu" }, { v: 5, label: "Fri" },
  { v: 6, label: "Sat" },
];

export default function ItemsTab() {
  const { token } = useAdminAuth();
  const authHeader = useMemo(
    () => ({ Authorization: `Bearer ${token}` }),
    [token]
  );

  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [addons, setAddons] = useState([]);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState(null); // { ...item, _panel?: 'variants'|'addons' }
  

  const loadAll = useCallback(
    async (signal) => {
      if (!token) return;
      try {
        const [itemsRes, catsRes, addonsRes] = await Promise.all([
          fetch("/api/admin/menus", { headers: authHeader, signal }),
          fetch("/api/admin/categories", { headers: authHeader, signal }),
          fetch("/api/admin/addons", { headers: authHeader, signal }),
        ]);

        if (!itemsRes.ok || !catsRes.ok || !addonsRes.ok) {
          // Optional: read text for easier debugging
          const [it, ct, ad] = await Promise.all([
            itemsRes.text(),
            catsRes.text(),
            addonsRes.text(),
          ]);
          console.error("Load failed", {
            items: it,
            categories: ct,
            addons: ad,
          });
          return;
        }

        const [itemsData, catsData, addonsData] = await Promise.all([
          itemsRes.json(),
          catsRes.json(),
          addonsRes.json(),
        ]);

        setItems(Array.isArray(itemsData) ? itemsData : []);
        setCategories(Array.isArray(catsData) ? catsData : []);
        setAddons(Array.isArray(addonsData) ? addonsData : []);
      } catch (err) {
        if (err?.name === "AbortError") return; // navigation/unmount cancel — safe to ignore
        console.error("Failed to load data", err);
      }
    },
    [authHeader, token]
  );

  useEffect(() => {
    const controller = new AbortController();
    loadAll(controller.signal);
    return () => controller.abort();
  }, [loadAll]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter(
      (i) =>
        i.name.toLowerCase().includes(s) ||
        (i.category?.name || "").toLowerCase().includes(s)
    );
  }, [items, q]);

  async function handleCreateOrUpdate(payload) {
    const isEdit = Boolean(payload.id);
    // Ensure we send menuType (not menuId)
    const body = { ...payload, menuType: payload.menuType || "weekly" };

    const res = await fetch(
      isEdit ? `/api/admin/menus/${payload.id}` : "/api/admin/menus",
      {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify(body),
      }
    );
    if (!res.ok) {
      const t = await res.text();
      return alert(`Save failed: ${t}`);
    }
    await loadAll();
    setEditing(null);
  }

  async function handleDelete(id) {
    if (!confirm("Delete this item?")) return;
    const res = await fetch(`/api/admin/menus/${id}`, {
      method: "DELETE",
      headers: authHeader,
    });
    if (!res.ok) {
      const t = await res.text();
      return alert(`Delete failed: ${t}`);
    }
    await loadAll();
  }

  return (
    <Box>
      <Stack direction="row" spacing={2} sx={{ mb: 2 }} alignItems="center">
        <TextField
          label="Search items or categories"
          size="small"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setEditing({})}
        >
          New Item
        </Button>
      </Stack>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Menu Type</TableCell>
              <TableCell>Category</TableCell>
              <TableCell align="center">Variants</TableCell>
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
                <TableCell>{i.menu?.type}</TableCell>
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
                </TableCell>
                <TableCell align="center">{i.variants?.length || 0}</TableCell>
                <TableCell align="center">{i.addOns?.length || 0}</TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Tooltip title="Variants">
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
                <TableCell
                  colSpan={6}
                  align="center"
                  sx={{ py: 6, color: "text.secondary" }}
                >
                  No items
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={!!editing}
        onClose={() => setEditing(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editing?._panel === "variants"
            ? "Edit Variants"
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
