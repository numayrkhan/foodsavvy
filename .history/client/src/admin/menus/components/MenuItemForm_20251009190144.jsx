// client/src/admin/menus/components/MenuItemForm.jsx
import { useRef, useState } from "react";
import {
  Box,
  Button,
  Stack,
  TextField,
  Typography,
  InputAdornment,
  IconButton,
  Chip,
  MenuItem, // ← use MUI MenuItem options
} from "@mui/material";
import UploadIcon from "@mui/icons-material/Upload";
import ClearIcon from "@mui/icons-material/Clear";

export default function MenuItemForm({
  data = {},
  categories = [],
  onCancel,
  onSubmit,
  authHeader, // { Authorization: 'Bearer ...' }
  weekday,
  weekOf, // 👈 NE  W
}) {
  const [name, setName] = useState(data.name || "");
  const [imageUrl, setImageUrl] = useState(data.imageUrl || "");
  const [description, setDescription] = useState(data.description || "");

  // keep empty "" for none; otherwise store the numeric id
  const [categoryId, setCategoryId] = useState(
    typeof data.category?.id === "number" ? data.category.id : ""
  );
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const fileInputRef = useRef(null);

  async function handleUpload(file) {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch("/api/admin/uploads", {
        method: "POST",
        headers: {
          ...(authHeader || {}),
          // Don't set Content-Type; browser sets multipart boundary.
        },
        body: form,
      });

      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || "Upload failed");
      }
      const json = await res.json(); // { url: "/uploads/xxxx.jpg" }
      setImageUrl(json.url || "");
    } catch (e) {
      console.error(e);
      setError("Image upload failed. Please try a different file.");
    } finally {
      setUploading(false);
    }
  }

  function triggerBrowse() {
    fileInputRef.current?.click();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!name.trim()) return setError("Name is required.");

    const payload = {
      id: data.id,
      name: name.trim(),
      description: (description || "").trim() || null,
      imageUrl: imageUrl || null,
      categoryId: categoryId === "" ? null : Number(categoryId),
      weekday, // 👈 NEW: required by the new admin endpoint
    };

    try {
      setSaving(true);
      await onSubmit?.(payload);
    } catch (e) {
      console.error(e);
      setError("Save failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      {/* Row 1: name + image with browse */}
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 2 }}>
        <TextField
          label="Name"
          fullWidth
          value={name}
          onChange={(e) => setName(e.target.value)}
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
                  onClick={triggerBrowse}
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
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
          style={{ display: "none" }}
          onChange={(e) => handleUpload(e.target.files?.[0])}
        />
      </Stack>

      {/* Optional preview */}
      {imageUrl ? (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
          <img
            src={imageUrl}
            alt=""
            width={72}
            height={72}
            style={{
              borderRadius: 8,
              objectFit: "cover",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          />
          <Typography variant="body2" color="text.secondary">
            Preview
          </Typography>
        </Stack>
      ) : null}

      {/* Row 2: description */}
      <TextField
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        multiline
        minRows={3}
        fullWidth
        sx={{ mb: 2 }}
      />

      {/* Row 3: selects (use MUI MenuItem) */}
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 2 }}>
        <TextField
          label="Category"
          select
          fullWidth
          value={categoryId === "" ? "" : String(categoryId)}
          onChange={(e) => {
            const v = e.target.value;
            setCategoryId(v === "" ? "" : Number(v));
          }}
          helperText="Optional"
        >
          <MenuItem value="">
            <em>None</em>
          </MenuItem>
          {categories.map((c) => (
            <MenuItem key={c.id} value={String(c.id)}>
              {c.name}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      {error ? (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      ) : null}

      {/* Actions */}
      <Stack direction="row" justifyContent="flex-end" spacing={1}>
        <Button onClick={onCancel} disabled={saving || uploading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          type="submit"
          disabled={saving || uploading}
        >
          {data?.id ? "Save" : "Create"}
        </Button>
      </Stack>

      <Stack direction="row" spacing={1} sx={{ mt: 1 }} alignItems="center">
        <Chip size="small" label="Tip" />
        <Typography variant="caption" color="text.secondary">
          Uploaded images are stored under <code>/uploads</code> and only the
          relative path is saved.
        </Typography>
      </Stack>
    </Box>
  );
}
