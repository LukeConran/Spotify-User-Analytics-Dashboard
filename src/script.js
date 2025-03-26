const dotenv = require('dotenv');
dotenv.config("../.env");
import Chart from 'chart.js/auto';  // Import Chart.js

const clientId = CLIENT_ID; // Replace with your client ID
const params = new URLSearchParams(window.location.search);
const code = params.get("code");

export async function redirectToAuthCodeFlow(clientId) {
    const verifier = generateCodeVerifier(128); 
    const challenge = await generateCodeChallenge(verifier);

    localStorage.setItem("verifier", verifier);

    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("response_type", "code");
    params.append("redirect_uri", "http://localhost:5173/callback");
    params.append("scope", "user-read-private user-read-email user-top-read user-read-recently-played user-read-playback-state user-read-currently-playing");
    params.append("code_challenge_method", "S256");
    params.append("code_challenge", challenge);

    console.log(params.get("redirect_uri"));
    console.log(`Authorization URL: https://accounts.spotify.com/authorize?${params.toString()}`);


    document.location = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

function generateCodeVerifier(length) {
    let text = '';
    let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

async function generateCodeChallenge(codeVerifier) {
    const data = new TextEncoder().encode(codeVerifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}


export async function getAccessToken(clientId, code) {
    const verifier = localStorage.getItem("verifier");

    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append("redirect_uri", "http://localhost:5173/callback");
    params.append("code_verifier", verifier);

    const result = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params
    });

    const { access_token } = await result.json();
    return access_token;
}

async function fetchProfile(token) {
    const result = await fetch("https://api.spotify.com/v1/me", {
        method: "GET", headers: { Authorization: `Bearer ${token}` }
    });

    return await result.json();
}

function populateUI(profile) {
    document.getElementById("displayName").innerText = profile.display_name;
    if (profile.images[0]) {
        const profileImage = new Image(200, 200);
        profileImage.src = profile.images[0].url;
        document.getElementById("avatar").appendChild(profileImage);
        // document.getElementById("imgUrl").innerText = profile.images[0].url;
    }
    document.getElementById("id").innerText = profile.id;
    document.getElementById("email").innerText = profile.email;
    document.getElementById("uri").innerText = profile.uri;
    document.getElementById("uri").setAttribute("href", profile.external_urls.spotify);
    // document.getElementById("url").innerText = profile.href;
    // document.getElementById("url").setAttribute("href", profile.href);
}





// GET TOP ITEMS

async function fetchTopItems(token, type, time_range = 'medium_term') {
    const result = await fetch(`https://api.spotify.com/v1/me/top/${type}?time_range=${time_range}&limit=10`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` }
    });

    return await result.json();
}

function populateTopItems(type, items, time_range) {
    const container = document.getElementById(`${type}Container-${time_range}`);
    container.innerHTML = ''; // Clear any existing items
    items.forEach((item, index) => {
        const link = document.createElement('a');
        link.href = item.external_urls.spotify; // External link to Spotify
        link.target = '_blank'; // Open in a new tab

        const listItem = document.createElement('li');
        // Remove content within parentheses
        const cleanedName = item.name.replace(/\s*\(.*?\)\s*/g, '');
        listItem.innerText = `${index + 1}. ${cleanedName}`; // Add number before each song

        link.appendChild(listItem);
        container.appendChild(link);
    });
} // --- Get the url of everysong and make it clickable?





// GET LISTENING HISTORY

async function fetchListeningHistory(token) {
    const result = await fetch("https://api.spotify.com/v1/me/player/recently-played?limit=50", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` }
    });

    const data = await result.json();
    return data.items.map(track => new Date(track.played_at).getHours()); // Extract only hours
}

function categorizeListeningHours(hours) {
    const categories = { Morning: 0, Afternoon: 0, Night: 0, LateNight: 0 };

    hours.forEach(hour => {
        if (hour >= 5 && hour < 12) categories.Morning++;      // 5AM - 12PM
        else if (hour >= 12 && hour < 18) categories.Afternoon++; // 12PM - 6PM
        else if (hour >= 18 && hour < 24) categories.Night++;     // 6PM - 12AM
        else categories.LateNight++;                            // 12AM - 5AM
    });

    return categories;
}

function renderListeningChart(categories) {
    const ctx = document.getElementById('listeningChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ["Morning", "Afternoon", "Night", "Late Night"],
            datasets: [{
                label: 'Listening Activity',
                data: Object.values(categories),
                backgroundColor: ['#1DB954', '#33A852', '#14833B', '#0A4722'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}


async function fetchTopArtistsGenres(token) {
    const result = await fetch("https://api.spotify.com/v1/me/top/artists?limit=50", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` }
    });

    const data = await result.json();
    return data.items.flatMap(artist => artist.genres);
}

function categorizeGenres(genres) {
    const genreCounts = {};
    genres.forEach(genre => {
        genreCounts[genre] = (genreCounts[genre] || 0) + 1;
    });
    return genreCounts;
}

function renderGenreChart(genreCounts) {
    const ctx = document.getElementById('genreChart').getContext('2d');
    const colors = generateColors(Object.keys(genreCounts).length);
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(genreCounts),
            datasets: [{
                label: 'Top Genres',
                data: Object.values(genreCounts),
                backgroundColor: colors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            // layout: {
            //     padding: {
            //         bottom: 20 // Add space between the legend and pie chart
            //     }
            // },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20 // Add space between legend items and chart
                    }
                }
            }
        }
    });
}

function generateColors(count) {
    const colors = [];
    for (let i = 0; i < count; i++) {
        const hue = i * (360 / count);
        colors.push(`hsl(${hue}, 70%, 50%)`);
    }
    return colors;
}


// New stuff below
async function fetchTopTrackPopularity(token, endpoint) {
    const result = await fetch(endpoint, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` }
    });

    const data = await result.json();
    console.log('Fetched Data:', data); // Log the fetched data

    // Ensure that data.items is an array and map the popularity values
    if (Array.isArray(data.items)) {
        const popularities = data.items.map(item => {
            // console.log('Track:', sitem.track); // Log each track
            return item.popularity || 0; // Default to 0 if popularity is undefined
        });
        // console.log('Popularities:', popularities); // Log the popularities array
        return popularities;
    } else {
        console.error('Unexpected data structure:', data);
        return [];
    }
}

async function fetchRecentTrackPopularity(token, endpoint) {
    const result = await fetch(endpoint, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` }
    });

    const data = await result.json();
    console.log('Fetched Data:', data); // Log the fetched data

    if (Array.isArray(data.items)) {
        const popularities = data.items.map(item => {
            // console.log('Track:', item.track); // Log each track
            return item.track.popularity || 0; // Default to 0 if popularity is undefined
        });
        // console.log('Popularities:', popularities); // Log the popularities array
        return popularities;
    } else {
        console.error('Unexpected data structure:', data);
        return [];
    }
}

function renderPopularityChart(popularities, chartId, label) {
    // console.log('Popularities:', popularities); // Log the popularities array
    const bins = Array(10).fill(0); // Create 10 bins for popularity ranges
    popularities.forEach(popularity => {
        const binIndex = Math.floor(popularity / 10);
        bins[binIndex]++;
    });

    // console.log('Bins:', bins); // Log the bins array

    const ctx = document.getElementById(chartId).getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: bins.map((_, index) => `${index * 10}-${index * 10 + 9}`),
            datasets: [{
                label: label,
                data: bins,
                backgroundColor: '#1DB954',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}


async function fetchTopTrackReleaseYears(token) {
    const result = await fetch("https://api.spotify.com/v1/me/top/tracks?limit=50", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` }
    });

    const data = await result.json();
    return data.items.map(track => new Date(track.album.release_date).getFullYear());
}

function renderReleaseYearChart(years) {
    const bins = {};
    years.forEach(year => {
        const decade = Math.floor(year / 10) * 10;
        bins[decade] = (bins[decade] || 0) + 1;
    });
    for (const decade in bins) {
        bins[`${decade}s`] = bins[decade];
        delete bins[decade];
    }

    const ctx = document.getElementById('releaseYearChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(bins),
            datasets: [{
                label: 'Number of Songs',
                data: Object.values(bins),
                backgroundColor: '#1DB954',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}





(async () => {
    if (!code) {
        redirectToAuthCodeFlow(clientId);
    } else {
        try {

            //Load in profile and token
            const accessToken = await getAccessToken(clientId, code);
            const profile = await fetchProfile(accessToken);
            console.log('Profile:', profile);
            populateUI(profile);

            //Load in top items
            const timeRanges = ['long_term', 'medium_term', 'short_term'];
            for (const timeRange of timeRanges) {
                const topTracks = await fetchTopItems(accessToken, 'tracks', timeRange);
                console.log(`Top Tracks (${timeRange}):`, topTracks);
                populateTopItems('tracks', topTracks.items, timeRange);

                const topArtists = await fetchTopItems(accessToken, 'artists', timeRange);
                console.log(`Top Artists (${timeRange}):`, topArtists);
                populateTopItems('artists', topArtists.items, timeRange);
            }

            // Load in listening history
            const listeningHours = await fetchListeningHistory(accessToken);
            const categorizedHours = categorizeListeningHours(listeningHours);
            renderListeningChart(categorizedHours);

            // Load in top genres
            const topGenres = await fetchTopArtistsGenres(accessToken);
            const genreCounts = categorizeGenres(topGenres);
            renderGenreChart(genreCounts);

            // Load in track popularity
            const recentPopularities = await fetchRecentTrackPopularity(accessToken, "https://api.spotify.com/v1/me/player/recently-played?limit=50");
            renderPopularityChart(recentPopularities, 'recentPopularityChart', 'Recently Played Tracks Popularity');

            const topTrackPopularities = await fetchTopTrackPopularity(accessToken, "https://api.spotify.com/v1/me/top/tracks?limit=50");
            renderPopularityChart(topTrackPopularities, 'topTracksPopularityChart', 'Top Tracks Popularity');

            const releaseYears = await fetchTopTrackReleaseYears(accessToken);
            renderReleaseYearChart(releaseYears);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    }
})();