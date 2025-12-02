// client/src/admin/AdminLayout.jsx
import { Outlet, NavLink, useLocation } from "react-router-dom";
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Divider,
  ThemeProvider,
  CssBaseline,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import LocalShippingIcon from "@mui/icons-material/LocalShipping"; // ⬅ NEW
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import { useState } from "react";
import theme from "./theme";
import { useAdminAuth } from "../auth/useAdminAuth";

const drawerWidth = 240;

export default function AdminLayout() {
  const { pathname } = useLocation();
  const { logout } = useAdminAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { to: "/admin", label: "Dashboard", icon: <DashboardIcon fontSize="small" /> },
    { to: "/admin/orders", label: "Orders", icon: <ReceiptLongIcon fontSize="small" /> },
    { to: "/admin/menus", label: "Menus", icon: <RestaurantMenuIcon fontSize="small" /> },
    // NEW: Delivery & Slots
    { to: "/admin/delivery", label: "Delivery & Slots", icon: <LocalShippingIcon fontSize="small" /> },
  ];

  const drawer = (
    <div className="h-full bg-dark text-gray-100">
      <div className="px-4 py-5">
        <div className="text-lg font-extrabold">FoodSavvy Admin</div>
        <div className="text-sm text-gray-200/70">Manage orders & fulfillment</div>
      </div>
      <Divider className="border-accent-dark/30" />
      <List className="px-2 py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className="block"
              aria-current={isActive ? "page" : undefined}
              onClick={() => setMobileOpen(false)}
            >
              <ListItemButton
                selected={isActive}
                sx={{ pl: 1.5 }}
                className={[
                  "rounded-r-lg my-1 border-l-4 transition-colors",
                  isActive
                    ? "bg-accent/20 hover:bg-accent/30 border-accent text-gray-100"
                    : "hover:bg-white/5 border-transparent text-gray-100",
                ].join(" ")}
              >
                <ListItemIcon className="min-w-9 text-gray-200/80">
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            </NavLink>
          );
        })}
      </List>
      <Divider className="border-accent-dark/30 my-2" />
      <List className="px-2">
        <ListItemButton
          onClick={logout}
          sx={{ pl: 1.5 }}
          className="rounded-lg hover:bg-white/5 text-gray-100"
          aria-label="Logout"
        >
          <ListItemIcon className="min-w-9 text-gray-200/80">
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItemButton>
      </List>
    </div>
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box className="min-h-screen bg-dark text-gray-100 flex">
        <AppBar
          position="fixed"
          sx={{
            width: { md: `calc(100% - ${drawerWidth}px)` },
            ml: { md: `${drawerWidth}px` },
          }}
          className="bg-dark/80 backdrop-blur border-b border-accent-dark/30 shadow-none"
        >
          <Toolbar className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconButton
                color="inherit"
                edge="start"
                onClick={() => setMobileOpen((s) => !s)}
                sx={{ display: { md: "none" } }}
                aria-label="Open menu"
              >
                <MenuIcon />
              </IconButton>
              <Typography variant="h6" className="font-bold">
                Admin
              </Typography>
            </div>
          </Toolbar>
        </AppBar>

        <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            ModalProps={{ keepMounted: true }}
            sx={{
              display: { xs: "block", md: "none" },
              "& .MuiDrawer-paper": { width: drawerWidth, boxSizing: "border-box" },
            }}
            className="border-r border-accent-dark/30"
          >
            {drawer}
          </Drawer>

          <Drawer
            variant="permanent"
            sx={{
              display: { xs: "none", md: "block" },
              "& .MuiDrawer-paper": { width: drawerWidth, boxSizing: "border-box" },
            }}
            className="border-r border-accent-dark/30"
            open
          >
            {drawer}
          </Drawer>
        </Box>

        <Box
          component="main"
          sx={{ flexGrow: 1, width: { md: `calc(100% - ${drawerWidth}px)` } }}
          className="p-4 md:p-6 bg-dark"
        >
          <Toolbar />
          <Outlet />
        </Box>
      </Box>
    </ThemeProvider>
  );
}
