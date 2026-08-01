import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Box,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions as MuiDialogActions,
  Snackbar,
  Alert,
} from "@mui/material";

import BookmarkRemoveIcon from "@mui/icons-material/BookmarkRemove";

import {
  getBookmarks,
  removeBookmark,
} from "../services/newsService";

import { useAuth } from "../context/AuthContext";
import NewsCard from "../components/NewsCard";

function Bookmarks() {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Dialog State
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    newsId: null,
  });

  // Snackbar Toast State
  const [toast, setToast] = useState({
    open: false,
    severity: "success",
    message: "",
  });

  const showToast = (message, severity = "success") => {
    setToast({ open: true, message, severity });
  };

  useEffect(() => {
    loadBookmarks();
  }, []);

  const loadBookmarks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getBookmarks(token);

      if (data.success) {
        setBookmarks(data.bookmarks || []);
      } else {
        setError(data.message || "Failed to load bookmarks.");
      }
    } catch (err) {
      console.error(err);
      setError("Unable to load bookmarks. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const openDeleteDialog = (id) => {
    setConfirmDialog({ open: true, newsId: id });
  };

  const closeDeleteDialog = () => {
    setConfirmDialog({ open: false, newsId: null });
  };

  const handleConfirmRemove = async () => {
    const id = confirmDialog.newsId;
    closeDeleteDialog();

    if (!id) return;

    try {
      const data = await removeBookmark(id, token);

      if (data.success) {
        setBookmarks((prev) => prev.filter((news) => news._id !== id));
        showToast("Bookmark removed successfully.", "info");
      } else {
        showToast(data.message || "Failed to remove bookmark.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to remove bookmark.", "error");
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 5, mb: 5 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        📚 My Bookmarks
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {loading
          ? Array.from(new Array(6)).map((_, index) => (
              <Grid xs={12} sm={6} md={4} key={index}>
                <Card sx={{ height: "100%" }}>
                  <Skeleton variant="rectangular" height={200} />
                  <CardContent>
                    <Skeleton variant="text" width="60%" height={24} sx={{ mb: 1 }} />
                    <Skeleton variant="text" width="90%" height={32} />
                    <Skeleton variant="text" width="40%" height={20} sx={{ mb: 2 }} />
                    <Skeleton variant="rectangular" height={40} />
                  </CardContent>
                </Card>
              </Grid>
            ))
          : bookmarks.map((news) => (
              <Grid xs={12} sm={6} md={4} key={news._id}>
                <NewsCard news={news} onRemove={openDeleteDialog} />
              </Grid>
            ))}
      </Grid>

      {!loading && !error && bookmarks.length === 0 && (
        <Box
          sx={{
            textAlign: "center",
            py: 8,
            px: 2,
            backgroundColor: "background.paper",
            borderRadius: 2,
            boxShadow: 1,
            mt: 2,
          }}
        >
          <BookmarkRemoveIcon sx={{ fontSize: 60, color: "text.secondary", mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Bookmarks Saved Yet
          </Typography>

          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Bookmark articles while browsing to read them anytime later.
          </Typography>

          <Button
            variant="contained"
            onClick={() => navigate("/")}
          >
            Browse News
          </Button>
        </Box>
      )}

      {/* Confirmation Dialog for Removal */}
      <Dialog open={confirmDialog.open} onClose={closeDeleteDialog}>
        <DialogTitle>Remove Bookmark?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove this article from your bookmarks? You can re-bookmark it anytime.
          </DialogContentText>
        </DialogContent>
        <MuiDialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeDeleteDialog} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleConfirmRemove} color="error" variant="contained" autoFocus>
            Remove
          </Button>
        </MuiDialogActions>
      </Dialog>

      {/* Toast Notification */}
      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={() => setToast({ ...toast, open: false })}
      >
        <Alert severity={toast.severity} variant="filled">
          {toast.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default Bookmarks;