import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

export default function VariantsEditor({
  itemId,
  initial,
  onSaved,
  authHeader,
}) {
  // Guard against undefined/null and clone to avoid mutating props
  const [rows, setRows] = useState(
    Array.isArray(initial) ? initial.map((v) => ({ ...v })) : []
  );
  const [draft, setDraft] = useState({ label: "", priceCents: "" });

  // If the dialog is reused for another item, refresh local state
  useEffect(() => {
    setRows(Array.isArray(initial) ? initial.map((v) => ({ ...v })) : []);
    setDraft({ label: "", priceCents: "" });
  }, [itemId, initial]);

  const add = () => {
    const label = draft.label.trim();
    const priceCents = Number(draft.priceCents);
    if (!label || !Number.isFinite(priceCents) || priceCents <= 0) return;

    setRows((r) => [...r, { label, priceCents }]);
    setDraft({ label: "", priceCents: "" });
  };

  const remove = (idx) => setRows((r) => r.filter((_, i) => i !== idx));

  async function save() {
    const res = await fetch(`/api/admin/menus/${itemId}/variants`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader || {}),
      },
      body: JSON.stringify({ variants: rows }),
    });
    if (!res.ok) return alert("Save failed");
    onSaved?.();
  }

  const list = Array.isArray(rows) ? rows : []; // extra safety

  return (
    <Box>
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <TextField
          size="small"
          label="Label (e.g. Half Tray)"
          value={draft.label}
          onChange={(e) => setDraft((s) => ({ ...s, label: e.target.value }))}
        />
        <TextField
          size="small"
          label="Price (cents)"
          value={draft.priceCents}
          inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
          onChange={(e) =>
            setDraft((s) => ({
              ...s,
              priceCents: e.target.value.replace(/\D/g, ""),
            }))
          }
        />
        <Button variant="contained" onClick={add}>
          Add
        </Button>
      </Stack>

      <Stack spacing={1}>
        {list.map((v, i) => (
          <Paper
            key={`${v.label}-${i}`}
            variant="outlined"
            sx={{
              p: 1.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Typography>{v.label}</Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography sx={{ fontVariantNumeric: "tabular-nums" }}>
                ${(v.priceCents / 100).toFixed(2)}
              </Typography>
              <Button color="error" size="small" onClick={() => remove(i)}>
                Remove
              </Button>
            </Stack>
          </Paper>
        ))}
        {!list.length && (
          <Typography color="text.secondary">No variants</Typography>
        )}
      </Stack>

      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
        <Button variant="contained" onClick={save}>
          Save Variants
        </Button>
      </Box>
    </Box>
  );
}
