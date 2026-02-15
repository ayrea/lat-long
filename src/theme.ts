import { createTheme } from "@mui/material/styles";

export type ColorMode = "light" | "dark";

export function getAppTheme(mode: ColorMode) {
  return createTheme({
    palette: {
      mode,
      primary: { main: "#1976d2" },
      secondary: { main: "#9c27b0" },
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
