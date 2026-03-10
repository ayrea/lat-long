import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import AddPhotoAlternate from "@mui/icons-material/AddPhotoAlternate";
import CameraAlt from "@mui/icons-material/CameraAlt";
import { useLiveQuery } from "dexie-react-hooks";
import { useCallback, useEffect, useRef, useState } from "react";
import { db } from "../../db";
import type { CoordinatePhoto } from "../../types";
import { CameraErrorView } from "./CameraErrorView";
import { CameraView } from "./CameraView";
import { PhotoGrid } from "./PhotoGrid";
import { PhotoViewer } from "./PhotoViewer";

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [preferredFacingMode, setPreferredFacingMode] = useState<
    "user" | "environment"
  >("environment");
  const [availableCameras, setAvailableCameras] = useState<
    MediaDeviceInfo[] | null
  >(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const urlCacheRef = useRef<Map<string, string>>(new Map());
  // Dummy state used only to trigger re-renders when urlCacheRef changes.
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
      setCameraActive(false);
      setCameraError(null);
      setCameraLoading(false);
      setPreferredFacingMode("environment");
      setAvailableCameras(null);
      setSelectedDeviceId(null);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
      urlCacheRef.current.forEach((url) => URL.revokeObjectURL(url));
      urlCacheRef.current.clear();
    }
  }, [open]);

  // Request camera stream when entering camera mode; cleanup on exit
  useEffect(() => {
    if (!open || !cameraActive) return;
    const video = videoRef.current;
    if (!video) return;

    setCameraLoading(true);
    setCameraError(null);
    const hasGetUserMedia =
      typeof navigator !== "undefined" &&
      typeof navigator.mediaDevices?.getUserMedia === "function";
    if (!hasGetUserMedia) {
      setCameraError("Camera not supported in this browser.");
      setCameraActive(false);
      setCameraLoading(false);
      return;
    }

    const supportsEnumerateDevices =
      typeof navigator !== "undefined" &&
      typeof navigator.mediaDevices?.enumerateDevices === "function";

    const startStream = async () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      video.srcObject = null;

      const videoConstraints: MediaTrackConstraints = {};

      if (selectedDeviceId) {
        videoConstraints.deviceId = { exact: selectedDeviceId };
      } else {
        videoConstraints.facingMode = preferredFacingMode;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
        });
        streamRef.current = stream;
        video.srcObject = stream;
        await video.play().catch(() => { });
        setCameraLoading(false);

        if (supportsEnumerateDevices) {
          try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoInputs = devices.filter(
              (d) => d.kind === "videoinput",
            );
            setAvailableCameras(videoInputs.length > 0 ? videoInputs : null);
          } catch {
            setAvailableCameras(null);
          }
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Could not access camera.";
        setCameraError(message);
        setCameraActive(false);
        setCameraLoading(false);
      }
    };

    void startStream();

    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      video.srcObject = null;
    };
  }, [open, cameraActive, preferredFacingMode, selectedDeviceId]);

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
  const hasCameraAPI =
    typeof navigator !== "undefined" &&
    typeof navigator.mediaDevices?.getUserMedia === "function";
  const hasMultipleCameras = (availableCameras?.length ?? 0) > 1;

  const handleAddClick = () => fileInputRef.current?.click();

  const handleTakePhotoClick = () => {
    setCameraError(null);
    setPreferredFacingMode("environment");
    setSelectedDeviceId(null);
    setCameraActive(true);
  };

  const handleSwitchCamera = () => {
    setCameraError(null);
    setSelectedDeviceId(null);
    setPreferredFacingMode((prev) =>
      prev === "environment" ? "user" : "environment",
    );
  };

  const handleCaptureClick = useCallback(() => {
    const video = videoRef.current;
    const stream = streamRef.current;
    if (!video || !stream || video.videoWidth === 0 || video.videoHeight === 0)
      return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const now = Date.now();
        void db.photos
          .add({
            id: crypto.randomUUID(),
            coordinateId,
            projectId,
            fileName: "camera-capture.jpg",
            mimeType: "image/jpeg",
            blob,
            createdDateTime: new Date().toISOString(),
            sortOrder: now,
          })
          .then(() => {
            setCameraActive(false);
          });
      },
      "image/jpeg",
      0.92,
    );
  }, [coordinateId, projectId]);

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
          {cameraError != null ? (
            <CameraErrorView message={cameraError} />
          ) : cameraActive ? (
            <CameraView
              videoRef={videoRef}
              preferredFacingMode={preferredFacingMode}
              hasMultipleCameras={hasMultipleCameras}
              cameraLoading={cameraLoading}
              onSwitchCamera={handleSwitchCamera}
              onCapture={handleCaptureClick}
            />
          ) : (
            <PhotoGrid
              photos={list}
              getOrCreateObjectUrl={getOrCreateObjectUrl}
              onThumbnailClick={handleThumbnailClick}
              onDelete={handleDelete}
            />
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
          {!cameraActive && (
            <>
              <Button
                variant="outlined"
                onClick={handleTakePhotoClick}
                startIcon={<CameraAlt />}
                aria-label="Take Photo"
                disabled={!hasCameraAPI}
              >
                Take Photo
              </Button>
              <Button
                variant="outlined"
                onClick={handleAddClick}
                startIcon={<AddPhotoAlternate />}
                aria-label="Choose Photo"
              >
                Choose Photo
              </Button>
            </>
          )}
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>

      <PhotoViewer
        open={viewerIndex != null && currentPhoto != null && currentUrl !== ""}
        photo={currentPhoto}
        url={currentUrl}
        hasPrev={viewerIndex != null && viewerIndex > 0}
        hasNext={
          viewerIndex != null && list.length > 0 && viewerIndex < list.length - 1
        }
        onPrev={handlePrev}
        onNext={handleNext}
        onClose={handleCloseViewer}
      />
    </>
  );
}

export default PhotosDialog;