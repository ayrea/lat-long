import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import type { Transaction } from "../types";
import type { AxisLabels } from "./CoordinateForm";
import { CoordinateCard } from "./CoordinateCard";

interface TransactionCardProps {
  transaction: Transaction;
  index: number;
  inputAxisLabels?: AxisLabels;
  outputAxisLabels?: AxisLabels;
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
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              Input
            </Typography>
            <CoordinateCard
              coord={transaction.inputCoord}
              axisLabels={inputLabels}
            />
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              Output
            </Typography>
            <CoordinateCard
              coord={transaction.outputCoord}
              axisLabels={outputLabels}
            />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
