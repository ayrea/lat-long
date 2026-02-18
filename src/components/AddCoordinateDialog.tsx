import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import type { CRSOption } from "../crs";
import { VirtualizedListbox } from "./VirtualizedListbox";

function LocationIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
    </svg>
  );
}

function GpsAveragingIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
        opacity="0.35"
        transform="translate(-4, 0)"
      />
      <path
        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
        opacity="0.6"
        transform="translate(4, 0)"
      />
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
    </svg>
  );
}

export type AxisLabels = { first: string; second: string };

interface AddCoordinateDialogProps {
  open: boolean;
  onClose: () => void;
  nextSuggestedName: string;
  formCrsValue: CRSOption;
  formName: string;
  formX: string;
  formY: string;
  options: CRSOption[];
  crsLoading: boolean;
  loadCrsOptions: () => void;
  onFormCrsChange: (code: string) => void;
  onFormNameChange: (value: string) => void;
  onFormXChange: (value: string) => void;
  onFormYChange: (value: string) => void;
  labels: AxisLabels;
  addValid: boolean;
  onAddCoordinate: () => void;
  isWgs84Form: boolean;
  geoButtonDisabled: boolean;
  geoPermissionDenied: boolean;
  onUseCurrentPosition: () => void;
  geoLoading: boolean;
  onOpenGpsAveraging?: () => void;
}

export function AddCoordinateDialog({
  open,
  onClose,
  nextSuggestedName,
  formCrsValue,
  formName,
  formX,
  formY,
  options,
  crsLoading,
  loadCrsOptions,
  onFormCrsChange,
  onFormNameChange,
  onFormXChange,
  onFormYChange,
  labels,
  addValid,
  onAddCoordinate,
  isWgs84Form,
  geoButtonDisabled,
  geoPermissionDenied,
  onUseCurrentPosition,
  geoLoading,
  onOpenGpsAveraging,
}: AddCoordinateDialogProps) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Add coordinate</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <Autocomplete<CRSOption>
            fullWidth
            size="small"
            options={options}
            value={formCrsValue}
            loading={crsLoading}
            onOpen={loadCrsOptions}
            getOptionLabel={(opt) => opt.label}
            isOptionEqualToValue={(a, b) => a.code === b.code}
            onChange={(_, newValue) => {
              if (newValue) onFormCrsChange(newValue.code);
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
                label="Coordinate reference system"
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
          <Box
            sx={{
              display: "flex",
              gap: 2,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <TextField
              label="Name"
              size="small"
              value={formName || nextSuggestedName}
              onChange={(e) => onFormNameChange(e.target.value)}
            />
            <TextField
              label={labels.first}
              type="number"
              value={formX}
              onChange={(e) => onFormXChange(e.target.value)}
              size="small"
              fullWidth
              slotProps={{ htmlInput: { step: "any" } }}
            />
            <TextField
              label={labels.second}
              type="number"
              value={formY}
              onChange={(e) => onFormYChange(e.target.value)}
              size="small"
              fullWidth
              slotProps={{ htmlInput: { step: "any" } }}
            />
            {isWgs84Form && (
              <>
                <Tooltip
                  title={
                    geoPermissionDenied
                      ? "Location services must be enabled for this site to use this feature"
                      : "Use current location"
                  }
                >
                  <span>
                    <IconButton
                      color="primary"
                      onClick={onUseCurrentPosition}
                      disabled={geoButtonDisabled}
                      aria-label="Use current location"
                      size="small"
                      sx={{ flexShrink: 0 }}
                    >
                      {geoLoading ? (
                        <CircularProgress color="inherit" size={24} />
                      ) : (
                        <LocationIcon />
                      )}
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip
                  title={
                    geoPermissionDenied
                      ? "Location services must be enabled for this site to use this feature"
                      : "GPS averaging (10 samples)"
                  }
                >
                  <span>
                    <IconButton
                      color="primary"
                      onClick={onOpenGpsAveraging}
                      disabled={geoButtonDisabled}
                      aria-label="GPS averaging (10 samples)"
                      size="small"
                      sx={{ flexShrink: 0 }}
                    >
                      <GpsAveragingIcon />
                    </IconButton>
                  </span>
                </Tooltip>
              </>
            )}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={onAddCoordinate}
          disabled={!addValid}
        >
          Add
        </Button>
      </DialogActions>
    </Dialog>
  );
}
