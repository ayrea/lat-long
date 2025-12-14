import React, { useState } from "react";
import { Card, CardContent, TextField, Stack } from "@mui/material";

interface LatLon {
  latitude: number;
  longitude: number;
}

const LatLongCard: React.FC = () => {
  const [latLon, setLatLon] = useState<LatLon>({
    latitude: 0,
    longitude: 0,
  });

  return (
    <Stack spacing={2}>
      <>
        <TextField
          label="Latitude"
          value={latLon.latitude}
          fullWidth
          onChange={(e) => {
            const val = e.target.value;
            if (/^-?\d*\.?\d*$/.test(val)) {
              const lat: number = Number.parseFloat(val);
              setLatLon({
                ...latLon,
                latitude: lat,
              });
            }
          }}
          slotProps={{ htmlInput: { inputMode: "decimal" } }}
        />

        <TextField
          label="Longitude"
          value={latLon.longitude}
          onChange={(e) => {
            const val = e.target.value;
            if (/^-?\d*\.?\d*$/.test(val)) {
              const long: number = Number.parseFloat(val);
              setLatLon({
                ...latLon,
                longitude: long,
              });
            }
          }}
          fullWidth
        />
      </>
    </Stack>
  );
};

export default LatLongCard;
