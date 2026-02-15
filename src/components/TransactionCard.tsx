import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import type { Transaction } from "../types";
import type { AxisLabels } from "./CoordinateForm";

interface TransactionCardProps {
  transaction: Transaction;
  index: number;
  inputAxisLabels?: AxisLabels;
  outputAxisLabels?: AxisLabels;
}

function formatCoordWithLabels(
  c: { x: number; y: number },
  labels: AxisLabels
): string {
  return `${labels.first} ${c.x.toFixed(6)}, ${labels.second} ${c.y.toFixed(6)}`;
}

const FALLBACK_LABELS: AxisLabels = { first: "X", second: "Y" };

export function TransactionCard({
  transaction,
  index,
  inputAxisLabels,
  outputAxisLabels,
}: TransactionCardProps) {
  const inputLabels = inputAxisLabels ?? FALLBACK_LABELS;
  const outputLabels = outputAxisLabels ?? FALLBACK_LABELS;
  const title =
    transaction.type === "transform"
      ? `Transform to EPSG:${transaction.targetCrsCode}`
      : "Projected point";
  const subtitle =
    transaction.type === "transform"
      ? `EPSG:${transaction.sourceCrsCode} → EPSG:${transaction.targetCrsCode}`
      : `From EPSG:${transaction.sourceCrsCode} (bearing ${transaction.bearing}°, distance ${transaction.distance})`;

  return (
    <Card variant="outlined" sx={{ minWidth: 280 }}>
      <CardContent>
        <Typography variant="subtitle2" color="text.secondary">
          #{index + 1}
        </Typography>
        <Typography variant="h6" component="h3" gutterBottom>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {subtitle}
        </Typography>
        <Typography variant="body2" component="p">
          Input: {formatCoordWithLabels(transaction.inputCoord, inputLabels)}
        </Typography>
        <Typography variant="body2" component="p">
          Output: {formatCoordWithLabels(transaction.outputCoord, outputLabels)}
        </Typography>
      </CardContent>
    </Card>
  );
}
