import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import IconButton from "@mui/material/IconButton";
import Snackbar from "@mui/material/Snackbar";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import ContentCopy from "@mui/icons-material/ContentCopy";
import { useState } from "react";
import type { AxisLabels } from "./CoordinateForm";

interface CoordinateCardProps {
  coord: { x: number; y: number };
  axisLabels: AxisLabels;
}

function copyText(text: string): Promise<void> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  }
  return Promise.reject(new Error("Clipboard not available"));
}

export function CoordinateCard({ coord, axisLabels }: CoordinateCardProps) {
  const [copied, setCopied] = useState(false);
  const copyValue = `${coord.x.toFixed(6)},${coord.y.toFixed(6)}`;

  const handleCopy = () => {
    copyText(copyValue)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {});
  };

  return (
    <>
      <Card variant="outlined" sx={{ display: "inline-block" }}>
        <CardContent
          sx={{
            py: 1,
            px: 1.5,
            "&:last-child": { pb: 1 },
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <div>
            <Typography variant="body2" component="div">
              {axisLabels.first} {coord.x.toFixed(6)}
            </Typography>
            <Typography variant="body2" component="div">
              {axisLabels.second} {coord.y.toFixed(6)}
            </Typography>
          </div>
          <Tooltip title={copied ? "Copied" : "Copy coordinates"}>
            <IconButton
              size="small"
              onClick={handleCopy}
              aria-label="Copy coordinates"
              sx={{ ml: 0.5 }}
            >
              <ContentCopy fontSize="small" />
            </IconButton>
          </Tooltip>
        </CardContent>
      </Card>
      <Snackbar
        open={copied}
        autoHideDuration={2000}
        onClose={() => setCopied(false)}
        message="Coordinates copied to clipboard"
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      />
    </>
  );
}
