import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import type { Transaction } from "../types";

interface TransactionCardProps {
  transaction: Transaction;
  index: number;
}

function formatCoord(c: { x: number; y: number }): string {
  return `${c.x.toFixed(6)}, ${c.y.toFixed(6)}`;
}

export function TransactionCard({
  transaction,
  index,
}: TransactionCardProps) {
  const title =
    transaction.type === "transform"
      ? `Transform to EPSG:${transaction.targetCrsCode}`
      : "Projected point";
  const subtitle =
    transaction.type === "transform"
      ? `EPSG:${transaction.sourceCrsCode} → EPSG:${transaction.targetCrsCode}`
      : `From EPSG:${transaction.sourceCrsCode} (bearing ${transaction.bearing}°, distance ${transaction.distance})`;

  return (
    <Card variant="outlined" sx={{ minWidth: 280, bgcolor: "grey.100" }}>
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
          Input: {formatCoord(transaction.inputCoord)}
        </Typography>
        <Typography variant="body2" component="p">
          Output: {formatCoord(transaction.outputCoord)}
        </Typography>
      </CardContent>
    </Card>
  );
}
