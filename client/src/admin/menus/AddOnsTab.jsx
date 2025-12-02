// client/src/admin/menus/AddOnsTab.jsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  InputAdornment,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import UploadIcon from "@mui/icons-material/Upload";
import ClearIcon from "@mui/icons-material/Clear";
import { useAdminAuth } from "../../auth/useAdminAuth";

export default function AddOnsTab() {
  const { token } = useAdminAuth();
  const authHeader = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState(null); // { id?, name, description, priceCents, imageUrl }
  const [saving, setSaving] = useState(false);

  const load = useCallback(
    async (signal) => {
      if (!token) return;
      try {
        const res = await fetch("/api/admin/addons", { headers: authHeader, signal });
        if (!res.ok) {
          console.error("Failed to load add-ons:", await res.text());
          return;
        }
        const data = await res.json();
        setRows(Array.isArray(data) ? data : []);
      } catch (err) {
        if (err?.name !== "AbortError") console.error(err);
      }
    },
    [authHeader, token]
  );

  useEffect(() => {
    const c = new AbortController();
    load(c.signal);
    return () => c.abort();
  }, [load]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter(
      (r) =>
        r.name?.toLowerCase().includes(s) ||
        (r.description || "").toLowerCase().includes(s)
    );
  }, [rows, q]);

  async function handleDelete(id) {
    if (!confirm("Delete this add-on?")) return;
    const res = await fetch(`/api/admin/addons/${id}`, {
      method: "DELETE",
      headers: authHeader,
    });
    if (!res.ok) {
      const t = await res.text();
      return alert(`Delete failed: ${t}`);
    }
    await load();
  }

  async function handleSave(form) {
    setSaving(true);
    try {
      const isEdit = !!form.id;
      const priceCents = Math.round(Number(form.priceDollars || 0) * 100);
      const payload = {
        name: form.name?.trim(),
        description: form.description?.trim() || null,
        imageUrl: form.imageUrl || null,
        priceCents,
      };

      const res = await fetch(
        isEdit ? `/api/admin/addons/${form.id}` : "/api/admin/addons",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json", ...authHeader },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) throw new Error(await res.text());
      await load();
      setEditing(null);
    } catch (e) {
      console.error(e);
      alert("Save failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Box>
      <Stack direction="row" spacing={2} sx={{ mb: 2 }} alignItems="center">
        <TextField
          label="Search add-ons"
          size="small"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() =>
            setEditing({
              name: "",
              description: "",
              imageUrl: "",
              priceDollars: "",
            })
          }
        >
          New Add-on
        </Button>
      </Stack>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="center">Price</TableCell>
              <TableCell>Image</TableCell>
              <TableCell align="right" width={160}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((r) => (
              <TableRow key={r.id} hover>
                <TableCell>{r.name}</TableCell>
                <TableCell sx={{ maxWidth: 380, whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
                  {r.description || <span style={{ color: "var(--mui-palette-text-secondary)" }}>—</span>}
                </TableCell>
                <TableCell align="center">
                  ${(r.priceCents / 100).toFixed(2)}
                </TableCell>
                <TableCell>
                  {r.imageUrl ? (
                    <img
                      src={r.imageUrl}
                      alt=""
                      width={40}
                      height={40}
                      style={{ borderRadius: 6, objectFit: "cover" }}
                    />
                  ) : (
                    <span style={{ color: "var(--mui-palette-text-secondary)" }}>—</span>
                  )}
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={() =>
                          setEditing({
                            id: r.id,
                            name: r.name || "",
                            description: r.description || "",
                            imageUrl: r.imageUrl || "",
                            priceDollars: ((r.priceCents || 0) / 100).toFixed(2),
                          })
                        }
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(r.id)}
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
                  No add-ons
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <EditDialog
        open={!!editing}
        onClose={() => setEditing(null)}
        onSave={handleSave}
        data={editing}
        authHeader={authHeader}
        saving={saving}
      />
    </Box>
  );
}

/* ------------ Edit/Create Dialog ------------- */

function EditDialog({ open, onClose, onSave, data, authHeader, saving }) {
  const [name, setName] = useState(data?.name || "");
  const [description, setDescription] = useState(data?.description || "");
  const [imageUrl, setImageUrl] = useState(data?.imageUrl || "");
  const [priceDollars, setPriceDollars] = useState(data?.priceDollars || "");
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState("");
  const fileRef = useRef(null);

  useEffect(() => {
    setName(data?.name || "");
    setDescription(data?.description || "");
    setImageUrl(data?.imageUrl || "");
    setPriceDollars(data?.priceDollars || "");
    setErr("");
  }, [data]);

  async function handleUpload(file) {
    if (!file) return;
    setUploading(true);
    setErr("");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/admin/uploads", {
        method: "POST",
        headers: { ...(authHeader || {}) },
        body: form,
      });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json(); // { url: "/uploads/xxxx.jpg" }
      setImageUrl(json.url || "");
    } catch (e) {
      console.error(e);
      setErr("Image upload failed.");
    } finally {
      setUploading(false);
    }
  }

  function submit() {
    if (!name.trim()) {
      setErr("Name is required.");
      return;
    }
    if (priceDollars === "" || isNaN(Number(priceDollars))) {
      setErr("Valid price is required.");
      return;
    }
    onSave?.({
      id: data?.id,
      name,
      description,
      imageUrl,
      priceDollars,
    });
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{data?.id ? "Edit Add-on" : "New Add-on"}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <TextField
            label="Name"
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <TextField
            label="Description"
            fullWidth
            multiline
            minRows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="Price"
              type="number"
              inputProps={{ step: "0.01", min: "0" }}
              value={priceDollars}
              onChange={(e) => setPriceDollars(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              fullWidth
            />
            <TextField
              label="Image URL"
              fullWidth
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    {imageUrl ? (
                      <IconButton
                        aria-label="clear image"
                        onClick={() => setImageUrl("")}
                        edge="end"
                        size="small"
                        disabled={uploading}
                        title="Clear"
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    ) : null}
                    <Button
                      variant="outlined"
                      size="small"
                      sx={{ ml: 1 }}
                      onClick={() => fileRef.current?.click()}
                      disabled={uploading}
                      startIcon={<UploadIcon />}
                    >
                      {uploading ? "Uploading..." : "Browse"}
                    </Button>
                  </InputAdornment>
                ),
              }}
            />
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
              style={{ display: "none" }}
              onChange={(e) => handleUpload(e.target.files?.[0])}
            />
          </Stack>

          {imageUrl ? (
            <Stack direction="row" spacing={1} alignItems="center">
              <img
                src={imageUrl}
                alt=""
                width={64}
                height={64}
                style={{ borderRadius: 8, objectFit: "cover" }}
              />
              <Typography variant="body2" color="text.secondary">
                Preview
              </Typography>
            </Stack>
          ) : null}

          {err ? (
            <Typography color="error">{err}</Typography>
          ) : (
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip size="small" label="Tip" />
              <Typography variant="caption" color="text.secondary">
                We store only the relative path (e.g. <code>/uploads/…</code>) so it works in dev & prod.
              </Typography>
            </Stack>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving || uploading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={submit}
          disabled={saving || uploading}
        >
          {data?.id ? "Save" : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
