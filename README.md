# Spotify Data Visualization

This project creates an interactive web application to visualize Spotify user data using Chart.js. It authenticates with Spotify's API and displays profile information, top tracks, top artists, listening history, genre distribution, track popularity, and release year distribution.

## Setup

1. **Prerequisites**:
   - Node.js and npm installed.
   - A Spotify Developer account to obtain a Client ID.

2. **Installation**:
   - Clone the repository.
   - Run `npm install` to install dependencies, including `chart.js/auto`.

3. **Configuration**:
   - Create a `.env` file in the root directory.
   - Add the following environment variables:
     ```
     VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id
     VITE_PORT=5173
     ```
   - Replace `your_spotify_client_id` with your Spotify Client ID.

4. **Running the Application**:
   - Start the development server with `npm run dev`.
   - Open your browser and navigate to `http://localhost:5173`.
   - Follow the authentication flow to log in with Spotify.

## Features

- Displays user profile information (display name, avatar, ID, email, URI).
- Shows top tracks and artists for short, medium, and long-term periods.
- Visualizes listening history by time of day using a bar chart.
- Displays genre distribution with a pie chart.
- Analyzes track popularity with bar charts for recent and top tracks.
- Shows release year distribution of top tracks with a bar chart.

## Usage

- After authentication, the app automatically fetches and displays your Spotify data.
- Click on track/artist names to visit their Spotify pages.
- Charts update dynamically based on fetched data.

## Development

- The app uses Vite for development and bundling.
- Authentication follows Spotify's typical PKCE flow for secure OAuth 2.0.
- Charts are rendered using Chart.js with custom styling.
