import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import ImageList from "@mui/material/ImageList";
import ImageListItem from "@mui/material/ImageListItem";
import Typography from "@mui/material/Typography";
import AddPhotoAlternate from "@mui/icons-material/AddPhotoAlternate";
import ChevronLeft from "@mui/icons-material/ChevronLeft";
import ChevronRight from "@mui/icons-material/ChevronRight";
import Close from "@mui/icons-material/Close";
import Delete from "@mui/icons-material/Delete";
import { useLiveQuery } from "dexie-react-hooks";
import { useCallback, useEffect, useRef, useState } from "react";
import { db } from "../db";
import type { CoordinatePhoto } from "../types";

interface PhotosDialogProps {
  open: boolean;
  onClose: () => void;
  coordinateId: string;
  coordinateName: string;
  projectId: string;
}

export function PhotosDialog({
  open,
  onClose,
  coordinateId,
  coordinateName,
  projectId,
}: PhotosDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const urlCacheRef = useRef<Map<string, string>>(new Map());
  const [, setUrlCacheVersion] = useState(0);

  const photos = useLiveQuery(
    () =>
      db.photos
        .where("coordinateId")
        .equals(coordinateId)
        .sortBy("sortOrder"),
    [coordinateId, open],
  );

  useEffect(() => {
    if (!open) {
      setViewerIndex(null);
      urlCacheRef.current.forEach((url) => URL.revokeObjectURL(url));
      urlCacheRef.current.clear();
    }
  }, [open]);

  const getOrCreateObjectUrl = useCallback((photo: CoordinatePhoto): string => {
    const cache = urlCacheRef.current;
    let url = cache.get(photo.id);
    if (!url) {
      url = URL.createObjectURL(photo.blob);
      cache.set(photo.id, url);
      setUrlCacheVersion((v) => v + 1);
    }
    return url;
  }, []);

  const revokeAndRemoveUrl = useCallback((photoId: string) => {
    const url = urlCacheRef.current.get(photoId);
    if (url) {
      URL.revokeObjectURL(url);
      urlCacheRef.current.delete(photoId);
      setUrlCacheVersion((v) => v + 1);
    }
  }, []);

  const list = photos ?? [];
  const currentPhoto = viewerIndex != null ? list[viewerIndex] : null;
  const currentUrl =
    currentPhoto != null ? getOrCreateObjectUrl(currentPhoto) : "";

  const handleAddClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    const now = Date.now();
    const iso = new Date().toISOString();
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith("image/")) continue;
      await db.photos.add({
        id: crypto.randomUUID(),
        coordinateId,
        projectId,
        fileName: file.name,
        mimeType: file.type,
        blob: file,
        createdDateTime: iso,
        sortOrder: now + i,
      });
    }
    e.target.value = "";
  };

  const handleDelete = useCallback(
    async (photoId: string) => {
      revokeAndRemoveUrl(photoId);
      setViewerIndex((idx) => {
        if (idx == null) return null;
        const newList = list.filter((p) => p.id !== photoId);
        if (newList.length === 0) return null;
        const newIdx = idx >= newList.length ? newList.length - 1 : idx;
        return newIdx;
      });
      await db.photos.delete(photoId);
    },
    [list, revokeAndRemoveUrl],
  );

  const handleThumbnailClick = (index: number) => setViewerIndex(index);
  const handleCloseViewer = () => setViewerIndex(null);
  const handlePrev = () =>
    setViewerIndex((idx) =>
      idx != null && idx > 0 ? idx - 1 : idx,
    );
  const handleNext = () =>
    setViewerIndex((idx) =>
      idx != null && list.length > 0 && idx < list.length - 1 ? idx + 1 : idx,
    );

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Photos — {coordinateName}</DialogTitle>
        <DialogContent>
          {list.length === 0 ? (
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
              <Typography color="text.secondary">
                Add your first photo
              </Typography>
            </Box>
          ) : (
            <ImageList cols={3} gap={8} sx={{ mt: 0 }}>
              {list.map((photo, index) => (
                <ImageListItem
                  key={photo.id}
                  sx={{
                    cursor: "pointer",
                    overflow: "hidden",
                    borderRadius: 1,
                    position: "relative",
                    "&:hover .photo-delete": { opacity: 1 },
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
                    onClick={() => handleThumbnailClick(index)}
                  />
                  <Box
                    className="photo-delete"
                    sx={{
                      position: "absolute",
                      top: 0,
                      right: 0,
                      opacity: 0,
                      "& .MuiIconButton-root": { color: "white" },
                    }}
                  >
                    <IconButton
                      size="small"
                      aria-label="Delete photo"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(photo.id);
                      }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>
                </ImageListItem>
              ))}
            </ImageList>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            capture="environment"
            onChange={handleFileChange}
            style={{ display: "none" }}
            aria-hidden
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAddClick} startIcon={<AddPhotoAlternate />}>
            Add photos
          </Button>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>

      {viewerIndex != null && currentPhoto != null && currentUrl !== "" && (
        <Box
          onClick={handleCloseViewer}
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
              handlePrev();
            }}
            disabled={viewerIndex <= 0}
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
            src={currentUrl}
            alt={currentPhoto.fileName}
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
              handleNext();
            }}
            disabled={viewerIndex >= list.length - 1}
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
              handleCloseViewer();
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
      )}
    </>
  );
}
