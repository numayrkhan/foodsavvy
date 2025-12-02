// client/src/admin/menus/AdminMenus.jsx
import { useState } from "react";
import { Box, Tabs, Tab, Paper, Typography } from "@mui/material";
import ItemsTab from "./ItemsTab";
import CategoriesTab from "./CategoriesTab";
import AddOnsTab from "./AddOnsTab";

export default function AdminMenus() {
  const [tab, setTab] = useState(0);

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
        Menus
      </Typography>

      <Paper elevation={0} sx={{ border: 1, borderColor: "divider", mb: 2 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Menu Items" />
          <Tab label="Categories" />
          <Tab label="Add‑ons" />
        </Tabs>
      </Paper>

      <Box>
        {tab === 0 && <ItemsTab />}
        {tab === 1 && <CategoriesTab />}
        {tab === 2 && <AddOnsTab />}
      </Box>
    </Box>
  );
}
