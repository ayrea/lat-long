import React, { useState } from "react";
import { Card, CardContent, TextField, Stack } from "@mui/material";

interface EastingNorthing {
  easting: number;
  northing: number;
}

const EastingNorthingCard: React.FC = () => {
  const [eastingNorthing, setLatLon] = useState<EastingNorthing>({
    easting: 0,
    northing: 0,
  });

  return (
    <Stack spacing={2}>
      <>
        <TextField
          label="Northing"
          value={eastingNorthing.northing}
          onChange={(e) => {
            const val = e.target.value;
            if (/^-?\d*\.?\d*$/.test(val)) {
              const long: number = Number.parseFloat(val);
              setLatLon({
                ...eastingNorthing,
                northing: long,
              });
            }
          }}
          fullWidth
        />
        <TextField
          label="Easting"
          value={eastingNorthing.easting}
          fullWidth
          onChange={(e) => {
            const val = e.target.value;
            if (/^-?\d*\.?\d*$/.test(val)) {
              const lat: number = Number.parseFloat(val);
              setLatLon({
                ...eastingNorthing,
                easting: lat,
              });
            }
          }}
          slotProps={{ htmlInput: { inputMode: "decimal" } }}
        />
      </>
    </Stack>
  );
};

export default EastingNorthingCard;
