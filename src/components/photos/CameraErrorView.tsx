import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

export interface CameraErrorViewProps {
  message: string;
}

export function CameraErrorView({ message }: CameraErrorViewProps) {
  return (
    <Box
      sx={{
        py: 2,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 1,
      }}
    >
      <Typography color="error">{message}</Typography>
      <Typography variant="body2" color="text.secondary">
        Use &quot;Choose from device&quot; to add photos from your gallery or
        file picker.
      </Typography>
    </Box>
  );
}

export default CameraErrorView;