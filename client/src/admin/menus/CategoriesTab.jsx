import { useEffect, useState } from "react";
import {
  Box,
  Button,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { useAdminAuth } from "../../auth/useAdminAuth";

export default function CategoriesTab() {
  const { token, logout } = useAdminAuth();
  const [rows, setRows] = useState([]);
  const [name, setName] = useState("");

  const withAuth = (init = {}) => ({
    ...init,
    headers: {
      ...(init.headers || {}),
      Authorization: `Bearer ${token}`,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
    },
  });

  const safeJson = async (res) => {
    const t = await res.text();
    try {
      return JSON.parse(t);
    } catch {
      return t;
    }
  };

  async function load() {
    const res = await fetch("/api/admin/categories", withAuth());
    if (!res.ok) {
      if (res.status === 401) logout();
      return;
    }
    const data = await safeJson(res);
    setRows(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    if (token) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function create() {
    if (!name.trim()) return;
    const res = await fetch(
      "/api/admin/categories",
      withAuth({
        method: "POST",
        body: JSON.stringify({ name }),
      })
    );
    if (!res.ok) {
      if (res.status === 401) logout();
      return alert("Create failed");
    }
    setName("");
    load();
  }

  async function rename(id, newName) {
    const res = await fetch(
      `/api/admin/categories/${id}`,
      withAuth({
        method: "PATCH",
        body: JSON.stringify({ name: newName }),
      })
    );
    if (!res.ok) {
      if (res.status === 401) logout();
      return alert("Update failed");
    }
    load();
  }

  async function remove(id) {
    if (!confirm("Delete category? Items will be cleared of this category."))
      return;
    const res = await fetch(
      `/api/admin/categories/${id}`,
      withAuth({ method: "DELETE" })
    );
    if (!res.ok) {
      if (res.status === 401) logout();
      return alert("Delete failed");
    }
    load();
  }

  return (
    <Box>
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <TextField
          size="small"
          label="New category name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Button variant="contained" onClick={create}>
          Add
        </Button>
      </Stack>

      <Stack spacing={1}>
        {rows.map((c) => (
          <Paper
            key={c.id}
            variant="outlined"
            sx={{
              p: 1.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <InlineEdit value={c.name} onSave={(v) => rename(c.id, v)} />
            <IconButton color="error" onClick={() => remove(c.id)}>
              <DeleteIcon />
            </IconButton>
          </Paper>
        ))}
        {!rows.length && (
          <Typography color="text.secondary">No categories</Typography>
        )}
      </Stack>
    </Box>
  );
}

function InlineEdit({ value, onSave }) {
  const [v, setV] = useState(value);
  const [editing, setEditing] = useState(false);
  return editing ? (
    <Stack
      direction="row"
      spacing={1}
      component="form"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(v);
        setEditing(false);
      }}
    >
      <TextField
        size="small"
        value={v}
        onChange={(e) => setV(e.target.value)}
        autoFocus
      />
      <Button variant="outlined" type="submit">
        Save
      </Button>
      <Button
        variant="text"
        onClick={() => {
          setV(value);
          setEditing(false);
        }}
      >
        Cancel
      </Button>
    </Stack>
  ) : (
    <Button variant="text" onClick={() => setEditing(true)}>
      {value}
    </Button>
  );
}
