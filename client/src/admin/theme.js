// client/src/admin/theme.js
import { createTheme } from "@mui/material/styles";

// Tailwind color values pulled from tailwind.config.js
const tailwindColors = {
  accent: "#54A05F",
  accentDark: "#487f51",
  beige: "#DDC3A5",
  dark: "#201E20",
  gray100: "#f7fafc",
  gray200: "#edf2f7",
  gray900: "#1a202c",
};

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: tailwindColors.accent,
    },
    background: {
      default: tailwindColors.dark,
      paper: tailwindColors.gray900,
    },
    text: {
      primary: tailwindColors.gray100,
      secondary: tailwindColors.gray200,
    },
  },
  typography: {
    fontFamily: '"Open Sans", sans-serif',
    h6: { fontWeight: 700 },
    body2: { color: tailwindColors.gray200 },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiDataGrid: {
      styleOverrides: {
        root: {
          border: `1px solid ${tailwindColors.accentDark}`,
          backgroundColor: tailwindColors.gray900,
        },
        columnHeaders: {
          backgroundColor: tailwindColors.accentDark,
          color: tailwindColors.gray100,
        },
        cell: {
          color: tailwindColors.gray100,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: tailwindColors.dark,
        },
      },
    },
  },
});

export default theme;
