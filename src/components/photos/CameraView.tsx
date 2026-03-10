import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import CameraAlt from "@mui/icons-material/CameraAlt";
import type { RefObject } from "react";

export interface CameraViewProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  preferredFacingMode: "user" | "environment";
  hasMultipleCameras: boolean;
  cameraLoading: boolean;
  onSwitchCamera: () => void;
  onCapture: () => void;
}

export function CameraView({
  videoRef,
  preferredFacingMode,
  hasMultipleCameras,
  cameraLoading,
  onSwitchCamera,
  onCapture,
}: CameraViewProps) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
      }}
    >
      <Box
        sx={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Camera: {preferredFacingMode === "environment" ? "Back" : "Front"}
        </Typography>
        {hasMultipleCameras && (
          <Button
            size="small"
            variant="text"
            onClick={onSwitchCamera}
            disabled={cameraLoading}
          >
            Switch camera
          </Button>
        )}
      </Box>
      <Box
        sx={{
          width: "100%",
          maxHeight: 360,
          bgcolor: "black",
          borderRadius: 1,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <Box
          component="video"
          ref={videoRef}
          autoPlay
          playsInline
          muted
          sx={{
            width: "100%",
            height: "auto",
            display: "block",
          }}
        />
        {cameraLoading && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "rgba(0,0,0,0.5)",
            }}
          >
            <Typography color="white">Starting camera…</Typography>
          </Box>
        )}
      </Box>
      <Box sx={{ display: "flex", gap: 1 }}>
        <Button
          variant="contained"
          startIcon={<CameraAlt />}
          onClick={onCapture}
          disabled={cameraLoading}
          aria-label="Capture photo"
        >
          Capture
        </Button>
      </Box>
    </Box>
  );
}

export default CameraView;