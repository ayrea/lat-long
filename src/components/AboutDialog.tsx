import Close from "@mui/icons-material/Close";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Typography from "@mui/material/Typography";

interface AboutDialogProps {
  open: boolean;
  onClose: () => void;
}

export function AboutDialog({ open, onClose }: AboutDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        About - Coordinate Helper (Lat-Long)
        <IconButton
          aria-label="Close"
          onClick={onClose}
          size="small"
          sx={{ mr: -1 }}
        >
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ overflowY: "auto", maxHeight: "60vh" }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 1 }}>
            <Box>
              <Typography variant="body2" component="div">
                Coordinate Helper is a Progressive Web App (PWA) for working
                with spatial coordinates. You can install it for offline use.
              </Typography>
              <Typography variant="body2" component="div" sx={{ mt: 1 }}>
                <strong>What it does:</strong>
              </Typography>
              <List
                component="ul"
                dense
                disablePadding
                sx={{ listStyleType: "disc", pl: 2.5, mt: 0.5 }}
              >
                <ListItem component="li" disablePadding sx={{ display: "list-item" }}>
                  <Typography variant="body2" component="span">
                    <strong>Transform coordinates</strong> — Convert coordinates
                    between different Coordinate Reference Systems (CRS), e.g. WGS
                    84 (EPSG:4326), Web Mercator (EPSG:3857), British National Grid
                    (EPSG:27700), UTM zones, and others from the EPSG registry.
                  </Typography>
                </ListItem>
                <ListItem component="li" disablePadding sx={{ display: "list-item" }}>
                  <Typography variant="body2" component="span">
                    <strong>Project by bearing and distance</strong> — From a point
                    in a projected CRS, compute a new point given bearing (degrees
                    from North, clockwise) and distance (in the CRS units, e.g.
                    metres).
                  </Typography>
                </ListItem>
                <ListItem component="li" disablePadding sx={{ display: "list-item" }}>
                  <Typography variant="body2" component="span">
                    <strong>Find bearing and distance</strong> — Between two points in
                    a projected CRS, compute bearing and distance.
                  </Typography>
                </ListItem>
                <ListItem component="li" disablePadding sx={{ display: "list-item" }}>
                  <Typography variant="body2" component="span">
                    <strong>Manage a list</strong> — Add, rename, and delete
                    coordinates; each can have a name and notes.
                  </Typography>
                </ListItem>
                <ListItem component="li" disablePadding sx={{ display: "list-item" }}>
                  <Typography variant="body2" component="span">
                    <strong>Export</strong> — Export the coordinate list to CSV.
                  </Typography>
                </ListItem>
              </List>
              <Typography variant="body2" component="div" sx={{ mt: 1 }}>
                All coordinate math runs in your browser; no data is sent to a
                server. The app works offline after the first load.
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle1" component="h2" gutterBottom>
                Disclaimer
              </Typography>
              <Typography variant="body2">
                Do not rely on the calculated coordinate output at this time. The
                functionality and accuracy of the calculations have not yet been
                independently verified.
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle1" component="h2" gutterBottom>
                Data &amp; Privacy
              </Typography>
              <Typography variant="body2">
                All data you enter and generate within this app stays securely
                on your device and is never transmitted to external servers. We
                do not collect, store, or share your personal information. Every
                feature is designed with privacy in mind, ensuring that your
                data remains fully under your control at all times. You can use
                the app with confidence, knowing that your information never
                leaves the app and your privacy is fully respected.
              </Typography>
            </Box>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
