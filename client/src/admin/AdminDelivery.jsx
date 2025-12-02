// client/src/admin/AdminDelivery.jsx
import { useEffect, useState, useRef, useMemo } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  IconButton,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Snackbar,
  Alert,
  Switch,
  InputAdornment,
  Chip,
  Stack,
} from "@mui/material";
import Grid from "@mui/material/Grid"; // MUI v7 Grid
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { useAdminAuth } from "../auth/useAdminAuth";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { Autocomplete, useJsApiLoader } from "@react-google-maps/api";

const libraries = ["places"];

export default function AdminDelivery() {
  const { token } = useAdminAuth();
  const [settings, setSettings] = useState(null);
  const [slots, setSlots] = useState([]);

  // Draft blackouts the admin is editing in the UI (toggle on calendar)
  const [blackouts, setBlackouts] = useState([]);

  // Persisted blackouts from the server (what is actually “in effect”)
  const [persistedBlackouts, setPersistedBlackouts] = useState([]);

  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [loading, setLoading] = useState(true);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_Maps_API_KEY,
    libraries,
  });
  const originRef = useRef(null);
  const [originText, setOriginText] = useState("");

  const showToast = (message, severity = "success") =>
    setToast({ open: true, message, severity });

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/delivery/config", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Failed to load config (${res.status})`);
      }
      const data = await res.json();

      // Defaults for first-run
      setSettings(data.settings || { maxRadiusMiles: 15, feeTiers: [] });
      setSlots(data.slots || []);

      // Both draft and persisted start from server state
      const serverBlackouts = data.blackouts || [];
      setBlackouts(serverBlackouts);
      setPersistedBlackouts(serverBlackouts);

      setOriginText(data.settings?.originAddress || "");
    } catch (err) {
      console.error(err);
      showToast(
        typeof err?.message === "string"
          ? err.message
          : "Failed to load config",
        "error"
      );
      setSettings((s) => s || { maxRadiusMiles: 15, feeTiers: [] });
      setSlots((s) => s || []);
      setBlackouts((b) => b || []);
      setPersistedBlackouts((b) => b || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(); // eslint-disable-next-line
  }, [token]);

  async function saveSettings() {
    const body = {
      originAddress: originText,
      originLat: settings?.originLat ?? null,
      originLng: settings?.originLng ?? null,
      maxRadiusMiles: Number(settings?.maxRadiusMiles ?? 15),
      feeTiers: settings?.feeTiers ?? [],
    };
    try {
      const res = await fetch("/api/admin/delivery/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Failed to save settings");
      }
      showToast("Settings saved");
      load();
    } catch (e) {
      console.error(e);
      showToast(
        typeof e?.message === "string" ? e.message : "Failed to save settings",
        "error"
      );
    }
  }

  async function saveSlots() {
    try {
      const res = await fetch("/api/admin/delivery/slots", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ slots }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Failed to save slots");
      }
      showToast("Slots saved");
      load();
    } catch (e) {
      console.error(e);
      showToast(
        typeof e?.message === "string" ? e.message : "Failed to save slots",
        "error"
      );
    }
  }

  async function saveBlackouts() {
    try {
      const res = await fetch("/api/admin/delivery/blackouts", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          blackouts: blackouts.map((b) => ({
            date: b.date.slice(0, 10),
            reason: b.reason,
          })),
        }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Failed to save blackouts");
      }
      // Persisted state now matches draft
      setPersistedBlackouts(blackouts);
      showToast("Blackouts saved");
    } catch (e) {
      console.error(e);
      showToast(
        typeof e?.message === "string" ? e.message : "Failed to save blackouts",
        "error"
      );
    }
  }

  // Occupancy preview
  const [occDate, setOccDate] = useState(null);
  const [occupancy, setOccupancy] = useState(null);
  useEffect(() => {
    if (!occDate) {
      setOccupancy(null);
      return;
    }
    const d = new Date(occDate);
    const yyyy = d.getFullYear(),
      mm = String(d.getMonth() + 1).padStart(2, "0"),
      dd = String(d.getDate()).padStart(2, "0");
    fetch(`/api/availability?date=${yyyy}-${mm}-${dd}`)
      .then((r) => r.json())
      .then(setOccupancy)
      .catch(() => setOccupancy(null));
  }, [occDate]);

  // Sets for quick lookups
  const persistedSet = useMemo(() => {
    return new Set(
      (persistedBlackouts || []).map((b) =>
        new Date(b.date).toISOString().slice(0, 10)
      )
    );
  }, [persistedBlackouts]);

  const draftSet = useMemo(() => {
    return new Set(
      (blackouts || []).map((b) => new Date(b.date).toISOString().slice(0, 10))
    );
  }, [blackouts]);

  // Helpers
  function toggleDraftBlackout(d) {
    if (!d) return;
    const iso = new Date(d).toISOString().slice(0, 10);
    const exists = blackouts.find((b) => b.date.slice(0, 10) === iso);
    if (exists) {
      setBlackouts((list) => list.filter((b) => b.date.slice(0, 10) !== iso));
    } else {
      setBlackouts((list) => [
        ...list,
        { date: `${iso}T00:00:00.000Z`, reason: "Closed" },
      ]);
    }
  }

  async function unblackout(isoDate) {
    // Remove from both draft & persisted and save immediately
    const next = blackouts.filter((b) => b.date.slice(0, 10) !== isoDate);
    setBlackouts(next);
    try {
      const res = await fetch("/api/admin/delivery/blackouts", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          blackouts: next.map((b) => ({
            date: b.date.slice(0, 10),
            reason: b.reason,
          })),
        }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Failed to update blackouts");
      }
      setPersistedBlackouts(next);
      showToast("Date un‑blacklisted");
    } catch (e) {
      console.error(e);
      showToast(
        typeof e?.message === "string"
          ? e.message
          : "Failed to update blackouts",
        "error"
      );
      // revert UI on error
      setBlackouts((prev) => [
        ...prev,
        { date: `${isoDate}T00:00:00.000Z`, reason: "Closed" },
      ]);
    }
  }

  if (loading) return <Typography>Loading…</Typography>;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
          Delivery & Slots
        </Typography>

        <Grid container spacing={2}>
          {/* Delivery Settings */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                Delivery Settings
              </Typography>

              {/* Origin (Places autocomplete) */}
              {isLoaded ? (
                <Autocomplete
                  onLoad={(auto) => (originRef.current = auto)}
                  onPlaceChanged={() => {
                    const place = originRef.current.getPlace();
                    setOriginText(place?.formatted_address || originText);
                    const loc = place?.geometry?.location;
                    if (loc)
                      setSettings((s) => ({
                        ...s,
                        originLat: loc.lat(),
                        originLng: loc.lng(),
                      }));
                  }}
                >
                  <input
                    value={originText}
                    onChange={(e) => setOriginText(e.target.value)}
                    placeholder="Delivery origin"
                    className="w-full bg-transparent border rounded px-3 py-2"
                  />
                </Autocomplete>
              ) : (
                <TextField
                  fullWidth
                  label="Origin"
                  value={originText}
                  onChange={(e) => setOriginText(e.target.value)}
                />
              )}

              <TextField
                sx={{ mt: 2 }}
                label="Max radius (miles)"
                type="number"
                fullWidth
                value={settings?.maxRadiusMiles ?? 15}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, maxRadiusMiles: e.target.value }))
                }
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">mi</InputAdornment>
                  ),
                }}
              />

              {/* Fee tiers */}
              <Typography sx={{ mt: 2, mb: 1, fontWeight: 600 }}>
                Fee tiers
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>≤ Miles</TableCell>
                    <TableCell>Fee (USD)</TableCell>
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(settings?.feeTiers || []).map((t, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <TextField
                          type="number"
                          value={t.toMiles}
                          onChange={(e) => {
                            const v = Number(e.target.value);
                            setSettings((s) => {
                              const ft = [...(s.feeTiers || [])];
                              ft[idx] = { ...ft[idx], toMiles: v };
                              return { ...s, feeTiers: ft };
                            });
                          }}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          value={(t.feeCents / 100).toFixed(2)}
                          onChange={(e) => {
                            const dollars = Number(e.target.value);
                            setSettings((s) => {
                              const ft = [...(s.feeTiers || [])];
                              ft[idx] = {
                                ...ft[idx],
                                feeCents: Math.round(dollars * 100),
                              };
                              return { ...s, feeTiers: ft };
                            });
                          }}
                          size="small"
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                $
                              </InputAdornment>
                            ),
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          onClick={() => {
                            setSettings((s) => ({
                              ...s,
                              feeTiers: (s.feeTiers || []).filter(
                                (_, i) => i !== idx
                              ),
                            }));
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={3}>
                      <Button
                        startIcon={<AddIcon />}
                        onClick={() => {
                          setSettings((s) => ({
                            ...s,
                            feeTiers: [
                              ...(s.feeTiers || []),
                              { toMiles: 5, feeCents: 500 },
                            ],
                          }));
                        }}
                      >
                        Add tier
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              <Button sx={{ mt: 2 }} variant="contained" onClick={saveSettings}>
                Save Settings
              </Button>
            </Paper>
          </Grid>

          {/* Slots */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                Time Slots
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Label</TableCell>
                    <TableCell>Capacity</TableCell>
                    <TableCell>Active</TableCell>
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {slots.map((s, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <TextField
                          size="small"
                          value={s.label}
                          onChange={(e) =>
                            setSlots((list) => {
                              const copy = [...list];
                              copy[idx] = {
                                ...copy[idx],
                                label: e.target.value,
                              };
                              return copy;
                            })
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          value={s.capacity}
                          onChange={(e) =>
                            setSlots((list) => {
                              const copy = [...list];
                              copy[idx] = {
                                ...copy[idx],
                                capacity: Number(e.target.value),
                              };
                              return copy;
                            })
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={!!s.active}
                          onChange={(e) =>
                            setSlots((list) => {
                              const copy = [...list];
                              copy[idx] = {
                                ...copy[idx],
                                active: e.target.checked,
                              };
                              return copy;
                            })
                          }
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          onClick={() =>
                            setSlots((list) => list.filter((_, i) => i !== idx))
                          }
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={4}>
                      <Button
                        startIcon={<AddIcon />}
                        onClick={() => {
                          setSlots((list) => [
                            ...list,
                            {
                              label: "5:00 PM",
                              startMin: 17 * 60,
                              endMin: 17 * 60 + 30,
                              capacity: 6,
                              active: true,
                            },
                          ]);
                        }}
                      >
                        Add slot
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              <Button sx={{ mt: 2 }} variant="contained" onClick={saveSlots}>
                Save Slots
              </Button>
            </Paper>
          </Grid>

          {/* Blackouts + Occupancy */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography
                    variant="subtitle1"
                    sx={{ mb: 1, fontWeight: 600 }}
                  >
                    Blackout Dates
                  </Typography>

                  {/* Calendar where you can toggle draft blackouts (click any date) */}
                  <DateCalendar
                    onChange={toggleDraftBlackout}
                    // Grey out the persisted (saved) blackout days
                    shouldDisableDate={(d) =>
                      d
                        ? persistedSet.has(
                            new Date(d).toISOString().slice(0, 10)
                          )
                        : false
                    }
                  />

                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{ mt: 1, flexWrap: "wrap" }}
                  >
                    <Button variant="outlined" onClick={saveBlackouts}>
                      Save Blackouts
                    </Button>
                  </Stack>

                  {/* Persisted blackout list with Unblackout buttons */}
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Currently blacked out:
                    </Typography>
                    {persistedBlackouts.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        None
                      </Typography>
                    ) : (
                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{ flexWrap: "wrap" }}
                      >
                        {persistedBlackouts
                          .slice()
                          .sort(
                            (a, b) =>
                              new Date(a.date).getTime() -
                              new Date(b.date).getTime()
                          )
                          .map((b) => {
                            const iso = new Date(b.date)
                              .toISOString()
                              .slice(0, 10);
                            return (
                              <Chip
                                key={iso}
                                label={iso}
                                onDelete={() => unblackout(iso)}
                                variant="outlined"
                              />
                            );
                          })}
                      </Stack>
                    )}
                  </Box>

                  {/* Draft (unsaved) changes indicator */}
                  {(() => {
                    const draftOnly = [...draftSet].filter(
                      (d) => !persistedSet.has(d)
                    );
                    const removed = [...persistedSet].filter(
                      (d) => !draftSet.has(d)
                    );
                    if (draftOnly.length === 0 && removed.length === 0)
                      return null;
                    return (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="caption" color="text.secondary">
                          Pending changes:
                        </Typography>
                        <Stack
                          direction="row"
                          spacing={1}
                          sx={{ flexWrap: "wrap", mt: 0.5 }}
                        >
                          {draftOnly.map((d) => (
                            <Chip
                              key={`add-${d}`}
                              color="warning"
                              variant="outlined"
                              label={`+ ${d}`}
                            />
                          ))}
                          {removed.map((d) => (
                            <Chip
                              key={`rem-${d}`}
                              color="warning"
                              variant="outlined"
                              label={`− ${d}`}
                            />
                          ))}
                        </Stack>
                      </Box>
                    );
                  })()}
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography
                    variant="subtitle1"
                    sx={{ mb: 1, fontWeight: 600 }}
                  >
                    Slot Occupancy
                  </Typography>
                  <DateCalendar value={occDate} onChange={setOccDate} />
                  {occupancy?.slots && (
                    <Box sx={{ mt: 2 }}>
                      {occupancy.slots.map((s) => (
                        <div
                          key={s.label}
                          className="flex items-center justify-between py-1"
                        >
                          <span>{s.label}</span>
                          <span className="font-semibold">
                            {s.reserved}/{s.capacity} left: {s.remaining}
                          </span>
                        </div>
                      ))}
                    </Box>
                  )}
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>

        <Snackbar
          open={toast.open}
          autoHideDuration={2500}
          onClose={() => setToast((t) => ({ ...t, open: false }))}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert
            severity={toast.severity}
            variant="filled"
            onClose={() => setToast((t) => ({ ...t, open: false }))}
          >
            {toast.message}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
}
