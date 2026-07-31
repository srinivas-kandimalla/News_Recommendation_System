import { Container, Typography, Button } from "@mui/material";
import { Link } from "react-router-dom";

function NotFound() {
  return (
    <Container sx={{ mt: 10, textAlign: "center" }}>
      <Typography variant="h2" fontWeight="bold">
        404
      </Typography>

      <Typography variant="h5" sx={{ mt: 2 }}>
        Page Not Found
      </Typography>

      <Typography color="text.secondary" sx={{ mt: 1 }}>
        The page you are looking for does not exist.
      </Typography>

      <Button
        component={Link}
        to="/"
        variant="contained"
        sx={{ mt: 4 }}
      >
        Go Home
      </Button>
    </Container>
  );
}

export default NotFound;