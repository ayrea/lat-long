import { createTheme } from "@mui/material/styles";

export type ColorMode = "light" | "dark";

export function getAppTheme(mode: ColorMode) {
  return createTheme({
    palette: {
      mode,
      primary: { main: "#1976d2" },
      secondary: { main: "#9c27b0" },
      background:
        mode === "dark"
          ? { default: "#121212", paper: "#1e1e1e" }
          : { default: "#f5f5f5", paper: "#ffffff" },
    },
    shape: { borderRadius: 8 },
    components: {
      MuiButton: {
        styleOverrides: {
          root: { textTransform: "none" },
        },
      },
    },
  });
}
