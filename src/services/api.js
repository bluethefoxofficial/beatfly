import axios from 'axios';

const api = axios.create({
  baseURL: 'https://api.beatfly-music.xyz/xrpc',
  headers: {
    'Content-Type': 'application/json',
  },
  validateStatus: function (status) {
    return status >= 200 && status < 300 || status === 304;
  },
});

// Automatically attach the token (if any) to every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const MusicAPI = {
  // ========== Auth Endpoints ==========
  login: (email, password) => api.post('/account.login', { email, password }),
  register: (data) => api.post('/account.register', data),
  getProfile: () => api.get('/account.profile'),
  forgotPassword: (email) => api.post('/account.forgotPassword', { email }),
  resetPassword: (data) => api.post('/account.resetPassword', data),

  // ========== Music Management ==========
  createAlbum: (data, progressCallback) => {
    return api.post('/music/album.create', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: progressCallback
    });
  },
  getAlbum: (albumId) => api.get(`/music/album/${albumId}`),
  editAlbum: (albumId, data) => api.put(`/music/album.edit/${albumId}`, data),
  deleteAlbum: (albumId) => api.delete(`/music/album.delete/${albumId}`),

  // ========== Individual Track Upload ==========
  addTrackToAlbum: (albumId, trackFile, metadata, progressCallback) => {
    const formData = new FormData();
    formData.append('trackFile', trackFile);

    if (metadata) {
      Object.keys(metadata).forEach(key => {
        formData.append(key, metadata[key]);
      });
    }

    return api.post(`/music/album/${albumId}/track.add`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: progressCallback
    });
  },
  deleteTrack: (albumId, trackId) => api.delete(`/music/album/${albumId}/track/${trackId}`),

  // ========== Track Management ==========
  getTrack: (trackId) => api.get(`/music/track/${trackId}`),
  streamTrack: (trackId) => {
    const token = localStorage.getItem('token');
    return {
      url: `${api.defaults.baseURL}/music/stream/${trackId}`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  },

  // ========== Playlist Management ==========
  getPlaylists: () => api.get('/music/playlists'),
  getPlaylist: (playlistId) => api.get(`/music/playlist/${playlistId}`),
  createPlaylist: (data) => api.post('/music/playlist.create', data),
  editPlaylist: (playlistId, data) => api.put(`/music/playlist.edit/${playlistId}`, data),
  deletePlaylist: (playlistId) => api.delete(`/music/playlist.delete/${playlistId}`),
  addToPlaylist: (playlistId, trackId) => api.post('/music/playlist.addTrack', { playlistId, trackId }),
  removeFromPlaylist: (playlistId, trackId) =>
    api.delete('/music/playlist.removeTrack', { data: { playlistId, trackId } }),

  // ========== Favorite Management ==========
  getFavorites: () => api.get('/music/favourite.all'),
  favoriteTrack: (trackId) => api.post('/music/favourite.track', { trackId }),
  unfavoriteTrack: (trackId) => api.delete(`/music/favourite.track/${trackId}`),
  favoriteAlbum: (albumId) => api.post('/music/favourite.album', { albumId }),
  unfavoriteAlbum: (albumId) => api.delete(`/music/favourite.album/${albumId}`),
  favoriteArtist: (artistId) => api.post('/music/favourite.artist', { artistId }),
  unfavoriteArtist: (artistId) => api.delete(`/music/favourite.artist/${artistId}`),
  getFavoriteTracks: () => api.get('/music/favourite.tracks'),
  getFavoriteAlbums: () => api.get('/music/favourite.albums'),
  getFavoriteArtists: () => api.get('/music/favourite.artists'),

  // ========== Disliked Tracks ==========
  dislikeTrack: (trackId) => api.post('/user.dislike.track', { trackId }),
  removeDislike: (trackId) => api.delete(`/user.dislike.track/${trackId}`),
  getDislikedTracks: () => api.get('/user.dislike.tracks'),

  // ========== Blocked Artists ==========
  blockArtist: (artistId) => api.post('/user.block.artist', { artistId }),
  unblockArtist: (artistId) => api.delete(`/user.block.artist/${artistId}`),
  getBlockedArtists: () => api.get('/user.blocked.artists'),

  // ========== Profile Management ==========
  getUserProfile: () => api.get('/profile.get'),
  updateUserProfile: (data) =>
    api.post('/profile.update', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getArtistProfile: (user_id) => api.get('/artist.getProfile', { params: { user_id } }),
  updateArtistProfile: (data) => api.post('/artist.updateProfile', data),

  // ========== User Settings ==========
  getUserSettings: () => api.get('/user.settings'),
  updateUserSettings: (data) => api.patch('/user.settings', data),

  // ========== Search ==========
  search: (query, options = {}) => api.get('/search', { params: { q: query }, ...options }),

  // ========== Featured Content ==========
  getFeaturedAlbums: () => api.get('/music.featuredAlbums'),

  // ========== Recommendations ==========
  getRecommendations: () => api.get('/music.recommendations'),

  // ========== Images ==========
  getImage: (folder, imageName) => {
    if (typeof imageName !== 'string') return '';
    if (imageName.startsWith('uploads/')) {
      imageName = imageName.substring(imageName.lastIndexOf('/') + 1);
    }
    return `https://api.beatfly-music.xyz/xrpc/images/${folder}/${imageName}`;
  },

  // ========== Reporting ==========
  reportArtist: (data) => api.post('/report.artist', data),
  getMyReports: (params) => api.get('/report.myreports', { params }),

  // ========== Year in Review ==========
  getYearInReview: () => api.get('/user.yearinreview'),
  getAdminYearInReview: (userId, year) =>
    api.get(`/admin/user/${userId}/yearinreview`, { params: { year } }),
  getAdminUserOverview: (userId) => api.get(`/admin/user/${userId}/overview`),

  // ========== Admin ==========
  getAdminStats: () => api.get('/admin/stats'),
  getAdminUsers: (params = {}) => api.get('/admin/users', { params }),
  getAdminArtists: (params = {}) => api.get('/admin/artists', { params }),
  getAdminReports: (params = {}) => api.get('/admin/reports', { params }),
  updateAdminReportStatus: (reportId, status) =>
    api.patch(`/admin/report/${reportId}`, { status }),
  banUser: ({ userId, reason, expiresAt }) => api.post('/admin/user/ban', { userId, reason, expiresAt }),
  unbanUser: (userId) => api.delete(`/admin/user/ban/${userId}`),
  getBannedUsers: () => api.get('/admin/user/banned'),
  deleteUser: (userId) => api.delete(`/admin/user/${userId}`),
  banArtist: ({ artistId, reason, expiresAt }) => api.post('/admin/artist/ban', { artistId, reason, expiresAt }),
  unbanArtist: (artistId) => api.delete(`/admin/artist/ban/${artistId}`),
  getBannedArtists: () => api.get('/admin/artist/banned'),
  updateAdminAlbum: (albumId, data) => api.patch(`/admin/album/${albumId}`, data),
  deleteAdminAlbum: (albumId) => api.delete(`/admin/album/${albumId}`),
  updateAdminTrack: (trackId, data) => api.patch(`/admin/track/${trackId}`, data),
  deleteAdminTrack: (trackId) => api.delete(`/admin/track/${trackId}`),
};

export default MusicAPI;
