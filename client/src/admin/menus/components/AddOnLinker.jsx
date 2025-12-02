import { useState } from "react";
import { Snackbar, Alert } from "@mui/material";
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

export default function AddOnLinker({
  itemId,
  allAddOns,
  linked,
  onSaved,
  authHeader,
}) {
  const [selected, setSelected] = useState(new Set(linked.map((a) => a.id)));

  const toggle = (id) =>
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  async function save() {
    const res = await fetch(`/api/admin/menus/${itemId}/addons`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader || {}),
      },
      body: JSON.stringify({ addOnIds: Array.from(selected) }),
    });
    if (!res.ok) return alert("Save failed");
    onSaved?.();
  }

  return (
    <Box>
      <Stack spacing={1}>
        {allAddOns.map((a) => (
          <Paper key={a.id} variant="outlined" sx={{ p: 1 }}>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
            >
              <div>
                <Typography fontWeight={600}>{a.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  ${(a.priceCents / 100).toFixed(2)}
                  {a.description ? ` • ${a.description}` : ""}
                </Typography>
              </div>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selected.has(a.id)}
                    onChange={() => toggle(a.id)}
                  />
                }
                label={selected.has(a.id) ? "Linked" : "Link"}
              />
            </Stack>
          </Paper>
        ))}
        {!allAddOns.length && (
          <Typography color="text.secondary">No add-ons</Typography>
        )}
      </Stack>

      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
        <Button variant="contained" onClick={save}>
          Save Links
        </Button>
      </Box>
    </Box>
  );
}
