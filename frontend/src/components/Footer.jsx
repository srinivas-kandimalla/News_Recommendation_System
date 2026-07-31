import { Box, Typography } from "@mui/material";

function Footer() {
  return (
    <Box
      sx={{
        mt: 6,
        py: 3,
        textAlign: "center",
        bgcolor: "#f5f5f5",
      }}
    >
      <Typography variant="body2">
        © {new Date().getFullYear()} AI News Recommendation System
      </Typography>

      <Typography variant="caption">
        Flask • React • MongoDB • Sentence Transformers
      </Typography>
    </Box>
  );
}

export default Footer;