import Box from "@mui/material/Box";
import { useEffect, useRef } from "react";
import type { Transaction } from "../types";
import { TransactionCard } from "./TransactionCard";

interface TransactionListProps {
  transactions: Transaction[];
}

export function TransactionList({ transactions }: TransactionListProps) {
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
      {transactions.map((tx, i) => (
        <Box key={tx.id} ref={i === transactions.length - 1 ? lastCardRef : undefined}>
          <TransactionCard transaction={tx} index={i} />
        </Box>
      ))}
    </Box>
  );
}
