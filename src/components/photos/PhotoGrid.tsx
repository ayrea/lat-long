import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import ImageList from "@mui/material/ImageList";
import ImageListItem from "@mui/material/ImageListItem";
import Typography from "@mui/material/Typography";
import AddPhotoAlternate from "@mui/icons-material/AddPhotoAlternate";
import Delete from "@mui/icons-material/Delete";
import type { CoordinatePhoto } from "../../types";

export interface PhotoGridProps {
  photos: CoordinatePhoto[];
  getOrCreateObjectUrl: (photo: CoordinatePhoto) => string;
  onThumbnailClick: (index: number) => void;
  onDelete: (photoId: string) => void;
}

export function PhotoGrid({
  photos,
  getOrCreateObjectUrl,
  onThumbnailClick,
  onDelete,
}: PhotoGridProps) {
  if (photos.length === 0) {
    return (
      <Box
        sx={{
          py: 4,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
        }}
      >
        <AddPhotoAlternate sx={{ fontSize: 48, color: "text.secondary" }} />
        <Typography color="text.secondary">Add your first photo</Typography>
      </Box>
    );
  }

  return (
    <ImageList cols={3} gap={8} sx={{ mt: 0 }}>
      {photos.map((photo, index) => (
        <ImageListItem
          key={photo.id}
          sx={{
            cursor: "pointer",
            overflow: "hidden",
            borderRadius: 1,
            position: "relative",
          }}
        >
          <img
            src={getOrCreateObjectUrl(photo)}
            alt={photo.fileName}
            loading="lazy"
            style={{
              height: 100,
              objectFit: "cover",
              display: "block",
            }}
            onClick={() => onThumbnailClick(index)}
          />
          <Box
            className="photo-delete"
            sx={{
              position: "absolute",
              top: 0,
              right: 0,
              opacity: 1,
              "& .MuiIconButton-root": { color: "white" },
            }}
          >
            <IconButton
              size="small"
              aria-label="Delete photo"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(photo.id);
              }}
              sx={{
                color: "white",
                backgroundColor: "rgba(0,0,0,0.6)",
                "&:hover": {
                  backgroundColor: "rgba(0,0,0,0.8)",
                },
              }}
            >
              <Delete fontSize="small" />
            </IconButton>
          </Box>
        </ImageListItem>
      ))}
    </ImageList>
  );
}

export default PhotoGrid;