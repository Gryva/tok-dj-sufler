// Handles loading audio files from the device into an in-memory playlist.
// Object URLs are session-only and cannot be persisted to localStorage.

const LOCAL_PREFIX = 'local:';

// Maps track id → { objectUrl, file }
const _store = {};

export function isLocalId(id){
  return typeof id === 'string' && id.startsWith(LOCAL_PREFIX);
}

export function isLocalPlaylistId(playlistId){
  return typeof playlistId === 'string' && playlistId.startsWith(LOCAL_PREFIX);
}

export function getObjectUrl(trackId){
  return _store[trackId] ? _store[trackId].objectUrl : null;
}

function parseTitleArtist(filename){
  const base = filename.replace(/\.[^.]+$/, '');
  const m = base.match(/^(.+?)\s*[-–]\s*(.+)$/);
  if (m) return { artist: m[1].trim(), title: m[2].trim() };
  return { artist: '', title: base };
}

function getFileDuration(objectUrl){
  return new Promise(resolve => {
    const a = new Audio();
    a.preload = 'metadata';
    a.src = objectUrl;
    a.addEventListener('loadedmetadata', () => resolve(Math.round(a.duration) || 0), { once: true });
    a.addEventListener('error', () => resolve(0), { once: true });
  });
}

export async function filesToTracks(files){
  const tracks = [];
  for (let i = 0; i < files.length; i++){
    const file = files[i];
    const objectUrl = URL.createObjectURL(file);
    const id = LOCAL_PREFIX + i + ':' + file.name;
    const { title, artist } = parseTitleArtist(file.name);
    const durationSec = await getFileDuration(objectUrl);
    _store[id] = { objectUrl, file };
    tracks.push({ id, title, artist, thumb: null, durationSec, isLocal: true });
  }
  return tracks;
}

export function revokeAll(){
  for (const key of Object.keys(_store)){
    URL.revokeObjectURL(_store[key].objectUrl);
    delete _store[key];
  }
}
