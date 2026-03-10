import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import ChevronLeft from "@mui/icons-material/ChevronLeft";
import ChevronRight from "@mui/icons-material/ChevronRight";
import Close from "@mui/icons-material/Close";
import type { CoordinatePhoto } from "../../types";

export interface PhotoViewerProps {
  open: boolean;
  photo: CoordinatePhoto | null;
  url: string;
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
}

export function PhotoViewer({
  open,
  photo,
  url,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
  onClose,
}: PhotoViewerProps) {
  if (!open || photo == null || url === "") {
    return null;
  }

  return (
    <Box
      onClick={onClose}
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 1400,
        bgcolor: "rgba(0,0,0,0.9)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <IconButton
        aria-label="Previous photo"
        onClick={(e) => {
          e.stopPropagation();
          onPrev();
        }}
        disabled={!hasPrev}
        sx={{
          position: "absolute",
          left: 8,
          color: "white",
        }}
      >
        <ChevronLeft fontSize="large" />
      </IconButton>
      <Box
        component="img"
        src={url}
        alt={photo.fileName}
        onClick={(e) => e.stopPropagation()}
        sx={{
          maxWidth: "90vw",
          maxHeight: "90vh",
          objectFit: "contain",
        }}
      />
      <IconButton
        aria-label="Next photo"
        onClick={(e) => {
          e.stopPropagation();
          onNext();
        }}
        disabled={!hasNext}
        sx={{
          position: "absolute",
          right: 8,
          color: "white",
        }}
      >
        <ChevronRight fontSize="large" />
      </IconButton>
      <IconButton
        aria-label="Close"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        sx={{
          position: "absolute",
          top: 8,
          right: 8,
          color: "white",
        }}
      >
        <Close />
      </IconButton>
    </Box>
  );
}

export default PhotoViewer;