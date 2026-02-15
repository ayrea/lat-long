import Box from "@mui/material/Box";
import { useEffect, useRef } from "react";
import type { Transaction } from "../types";
import type { AxisLabels } from "./CoordinateForm";
import { TransactionCard } from "./TransactionCard";

const FALLBACK_LABELS: AxisLabels = { first: "X", second: "Y" };

interface TransactionListProps {
  transactions: Transaction[];
  crsLabelsByCode?: Record<string, AxisLabels>;
}

function getLabels(
  code: string,
  crsLabelsByCode?: Record<string, AxisLabels>
): AxisLabels {
  if (crsLabelsByCode && crsLabelsByCode[code]) return crsLabelsByCode[code];
  return FALLBACK_LABELS;
}

export function TransactionList({
  transactions,
  crsLabelsByCode,
}: TransactionListProps) {
  const lastCardRef = useRef<HTMLDivElement>(null);
  const prevLengthRef = useRef(0);

  useEffect(() => {
    if (transactions.length > prevLengthRef.current) {
      lastCardRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevLengthRef.current = transactions.length;
  }, [transactions.length]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        overflow: "auto",
        flex: 1,
        minHeight: 0,
        py: 2,
      }}
    >
      {transactions.map((tx, i) => {
        const inputAxisLabels = getLabels(tx.sourceCrsCode, crsLabelsByCode);
        const outputAxisLabels =
          tx.type === "transform"
            ? getLabels(tx.targetCrsCode, crsLabelsByCode)
            : getLabels(tx.sourceCrsCode, crsLabelsByCode);
        return (
          <Box
            key={tx.id}
            ref={i === transactions.length - 1 ? lastCardRef : undefined}
          >
            <TransactionCard
              transaction={tx}
              index={i}
              inputAxisLabels={inputAxisLabels}
              outputAxisLabels={outputAxisLabels}
            />
          </Box>
        );
      })}
    </Box>
  );
}
