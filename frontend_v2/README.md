# Pulse frontend v2

An independent Vite + React frontend for the existing AI News Recommendation System. It uses the Flask backend without changing its routes or code.

## Run locally

1. Copy `.env.example` to `.env.local` if the backend is not at `http://127.0.0.1:5000`.
2. Run `npm install`.
3. Run `npm run dev`.

For a deployable production bundle, run `npm run build`.

## Backend compatibility

Authentication is stored as a JWT in browser local storage and attached to protected calls automatically. Reactions use the backend's implemented endpoints: `POST /news/:id/like` and `POST /news/:id/dislike`.
