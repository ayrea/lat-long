import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import { useEffect, useState } from "react";
import {
  DEFAULT_CRS_CODE,
  DEFAULT_CRS_LABEL,
} from "../crs";
import type { CRSOption } from "../crs";
import type { Coordinate } from "../types";
import { VirtualizedListbox } from "./VirtualizedListbox";

function optionForCode(code: string, options: CRSOption[]): CRSOption {
  const found = options.find((o) => o.code === code);
  if (found) return found;
  return {
    code,
    name: "",
    label: code === DEFAULT_CRS_CODE ? DEFAULT_CRS_LABEL : `EPSG:${code}`,
  };
}

interface TransformCrsDialogProps {
  open: boolean;
  onClose: () => void;
  coordinateId: string | null;
  coordinates: Coordinate[];
  options: CRSOption[];
  crsLoading: boolean;
  loadCrsOptions: () => void;
  onTransform: (coordinateId: string, targetCrsCode: string) => void;
}

export function TransformCrsDialog({
  open,
  onClose,
  coordinateId,
  coordinates,
  options,
  crsLoading,
  loadCrsOptions,
  onTransform,
}: TransformCrsDialogProps) {
  const coord = coordinates.find((c) => c.id === coordinateId);
  const sourceCrsCode = coord?.crsCode ?? DEFAULT_CRS_CODE;
  const targetOptions = options.filter((o) => o.code !== sourceCrsCode);
  const fallback =
    sourceCrsCode === DEFAULT_CRS_CODE ? "3857" : DEFAULT_CRS_CODE;
  const initialCode = targetOptions[0]?.code ?? fallback;

  const [targetCrsCode, setTargetCrsCode] = useState(initialCode);

  useEffect(() => {
    if (open && coordinateId != null) {
      const opts = options.filter((o) => o.code !== sourceCrsCode);
      const next = opts[0]?.code ?? fallback;
      setTargetCrsCode(next);
    }
  }, [open, coordinateId, sourceCrsCode, fallback, options]);

  const targetCrsValue = optionForCode(targetCrsCode, targetOptions);

  const handleClose = () => {
    onClose();
  };

  const handleConfirm = () => {
    if (coordinateId) {
      onTransform(coordinateId, targetCrsCode);
      handleClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Transform to CRS</DialogTitle>
      <DialogContent>
        <Autocomplete<CRSOption>
          fullWidth
          size="small"
          sx={{ mt: 1, minWidth: 280 }}
          options={targetOptions}
          value={targetCrsValue}
          loading={crsLoading}
          onOpen={loadCrsOptions}
          getOptionLabel={(opt) => opt.label}
          isOptionEqualToValue={(a, b) => a.code === b.code}
          onChange={(_, newValue) => {
            if (newValue) setTargetCrsCode(newValue.code);
          }}
          slots={{ listbox: VirtualizedListbox }}
          renderOption={(props, option) => (
            <li {...props}>
              <Box
                component="span"
                sx={{
                  whiteSpace: "normal",
                  wordBreak: "break-word",
                  display: "block",
                  lineHeight: 1.4,
                  py: 0.5,
                }}
              >
                {option.label}
              </Box>
            </li>
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Target CRS"
              slotProps={{
                input: {
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {crsLoading ? (
                        <CircularProgress color="inherit" size={20} />
                      ) : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                },
              }}
            />
          )}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleConfirm} variant="contained">
          Transform
        </Button>
      </DialogActions>
    </Dialog>
  );
}
