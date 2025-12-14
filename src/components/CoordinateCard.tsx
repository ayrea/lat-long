import React, { useState } from "react";
import type { SelectChangeEvent } from "@mui/material";
import {
  Card,
  CardContent,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Stack,
  Button,
} from "@mui/material";
import LatLongCard from "./LatLongCard";
import EastingNorthingCard from "./EastingNorthingCard";

type CoordinateSystem = "latlon" | "en";

const CoordinateCard: React.FC = () => {
  const [coordinateSystem, setCoordinateSystem] =
    useState<CoordinateSystem>("latlon");

  const handleSystemChange = (event: SelectChangeEvent) => {
    setCoordinateSystem(event.target.value as CoordinateSystem);
  };

  return (
    <Card variant="elevation" sx={{ maxWidth: 400 }}>
      <CardContent>
        <Stack spacing={2}>
          {/* Coordinate System Selector */}
          <FormControl fullWidth>
            <InputLabel id="coord-system-label">Coordinate System</InputLabel>
            <Select
              labelId="coord-system-label"
              value={coordinateSystem}
              label="Coordinate System"
              onChange={handleSystemChange}
            >
              <MenuItem value="latlon">Latitude / Longitude</MenuItem>
              <MenuItem value="en">Easting / Northing</MenuItem>
            </Select>
          </FormControl>

          {/* Conditional Inputs */}
          {coordinateSystem === "latlon" ? (
            <LatLongCard />
          ) : (
            <EastingNorthingCard />
          )}
          <Button variant="contained">Convert</Button>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default CoordinateCard;
