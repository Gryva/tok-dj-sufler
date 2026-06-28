// Keeps a local copy of the last successfully fetched playlist (tracks +
// playlist info) so the app can still boot and play when the YouTube API is
// unreachable — flaky venue wifi, no signal, API quota exhausted, etc.
// Keyed by playlist id so switching playlists doesn't mix up cached data.

function tracksKey(playlistId){ return 'tok_cache_tracks_' + playlistId; }
function infoKey(playlistId){ return 'tok_cache_info_' + playlistId; }

export function saveTracksCache(playlistId, tracks){
  try {
    localStorage.setItem(tracksKey(playlistId), JSON.stringify({ tracks, savedAt: Date.now() }));
  } catch (e) { /* localStorage full/unavailable — caching is best-effort */ }
}

export function loadTracksCache(playlistId){
  try {
    const raw = localStorage.getItem(tracksKey(playlistId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return (parsed && Array.isArray(parsed.tracks) && parsed.tracks.length) ? parsed : null;
  } catch (e) {
    return null;
  }
}

export function savePlaylistInfoCache(playlistId, info){
  try {
    localStorage.setItem(infoKey(playlistId), JSON.stringify(info));
  } catch (e) { /* best-effort */ }
}

export function loadPlaylistInfoCache(playlistId){
  try {
    const raw = localStorage.getItem(infoKey(playlistId));
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}
