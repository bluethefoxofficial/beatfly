import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  Album,
  Edit3,
  Trash2,
  Loader2,
  Music,
  Play,
  Clock,
  AlertTriangle,
  FileText,
  X,
  CheckCircle2,
  AlertCircle,
  Plus,
  ImageIcon,
  Info,
  User,
  Disc3,
  Calendar,
  MoreVertical,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAudio } from '../contexts/AudioContext';
import MusicAPI from '../services/api';

const ArtistDashboard = () => {
  const navigate = useNavigate();
  const { playTrack } = useAudio();
  const fileInputRef = useRef(null);

  // Core state
  const [activeTab, setActiveTab] = useState('albums');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [userId, setUserId] = useState(null);
  const [profile, setProfile] = useState(null);
  const [albums, setAlbums] = useState([]);
  const [singles, setSingles] = useState([]);
  const [showProfileWizard, setShowProfileWizard] = useState(false);

  // Profile state for editing
  const [profileData, setProfileData] = useState({
    stageName: '',
    bio: '',
    profilePic: null
  });

  // Profile wizard state
  const [wizardData, setWizardData] = useState({
    stageName: '',
    bio: '',
    acceptedTerms: false,
    copyrightAnswer: '',
    ipAnswer: '',
    profilePic: null
  });
  const [wizardStep, setWizardStep] = useState(1);

  // UI state
  const [expandedAlbumId, setExpandedAlbumId] = useState(null);
  const [deletingAlbumId, setDeletingAlbumId] = useState(null);
  const [deletingTrackId, setDeletingTrackId] = useState(null);
  const [editingLyricsTrackId, setEditingLyricsTrackId] = useState(null);
  const [lyricsText, setLyricsText] = useState('');
  const [uploadingTrack, setUploadingTrack] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(-1);
  const [saving, setSaving] = useState(false);

  // Album creation state
  const [albumData, setAlbumData] = useState({
    title: '',
    artist: '',
    description: '',
    isExplicit: false,
    albumArt: null
  });

  // Track queue for a specific album
  const [selectedAlbumId, setSelectedAlbumId] = useState(null);
  const [showTrackUploadModal, setShowTrackUploadModal] = useState(false);
  const [selectedTracks, setSelectedTracks] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});

  // Clear success message after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Clear error after 8 seconds
  useEffect(() => {
    if (error && profile) {
      const timer = setTimeout(() => setError(''), 8000);
      return () => clearTimeout(timer);
    }
  }, [error, profile]);

  // Load artist data on mount
  const loadArtistData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const userResponse = await MusicAPI.getProfile();
      const currentUserId = userResponse?.data?.id;

      if (!currentUserId) {
        throw new Error('Could not retrieve user ID. Please log in again.');
      }

      setUserId(currentUserId);

      const artistResponse = await MusicAPI.getArtistProfile(currentUserId);
      const artistData = artistResponse?.data;

      if (artistData && artistData.stage_name) {
        setProfile(artistData);
        setAlbums(artistData.albums || []);
        setSingles(artistData.tracks || []);
        setProfileData({
          stageName: artistData.stage_name || '',
          bio: artistData.bio || '',
          profilePic: null
        });
        setShowProfileWizard(false);
      } else {
        setShowProfileWizard(true);
        setWizardData(prev => ({
          ...prev,
          stageName: userResponse.data.username || ''
        }));
      }
    } catch (err) {
      console.error('Error loading artist data:', err);

      if (err.response?.status === 404) {
        try {
          const userResponse = await MusicAPI.getProfile();
          setUserId(userResponse?.data?.id);
          setShowProfileWizard(true);
          setWizardData(prev => ({
            ...prev,
            stageName: userResponse.data.username || ''
          }));
        } catch (userErr) {
          setError('Failed to load user profile. Please log in again.');
        }
      } else {
        setError(err.response?.data?.error || 'Failed to load artist dashboard.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadArtistData();
  }, [loadArtistData]);

  const handleDeleteAlbum = async (albumId) => {
    if (!window.confirm('Are you sure you want to delete this album and all its tracks? This action cannot be undone.')) return;

    try {
      setDeletingAlbumId(albumId);
      await MusicAPI.deleteAlbum(albumId);
      setSuccessMessage('Album deleted successfully!');
      await loadArtistData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete album.');
    } finally {
      setDeletingAlbumId(null);
    }
  };

  const handleDeleteTrack = async (albumId, trackId) => {
    if (!window.confirm('Are you sure you want to delete this track?')) return;

    try {
      setDeletingTrackId(trackId);
      await MusicAPI.deleteTrack(albumId, trackId);
      setSuccessMessage('Track deleted successfully!');
      await loadArtistData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete track.');
    } finally {
      setDeletingTrackId(null);
    }
  };

  const updateLyrics = async (albumId, trackId) => {
    try {
      setSaving(true);
      await MusicAPI.editAlbum(albumId, {
        trackLyrics: { [trackId]: lyricsText }
      });
      await loadArtistData();
      setEditingLyricsTrackId(null);
      setLyricsText('');
      setSuccessMessage('Lyrics updated successfully!');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update lyrics.');
    } finally {
      setSaving(false);
    }
  };

  const updateProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      await MusicAPI.updateArtistProfile({
        stage_name: profileData.stageName,
        bio: profileData.bio
      });

      if (profileData.profilePic) {
        const formData = new FormData();
        formData.append('biography', profileData.bio);
        formData.append('profilePic', profileData.profilePic);
        await MusicAPI.updateUserProfile(formData);
      }

      await loadArtistData();
      setSuccessMessage('Profile updated successfully!');
      setActiveTab('albums');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const completeWizard = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    const correctAnswers =
      wizardData.copyrightAnswer.trim().toLowerCase() === 'me' &&
      wizardData.ipAnswer.trim().toLowerCase().includes('creativity');

    if (!correctAnswers) {
      setError('Quiz answers incorrect. Please review the questions and try again.');
      setSaving(false);
      return;
    }

    try {
      await MusicAPI.updateArtistProfile({
        stage_name: wizardData.stageName,
        bio: wizardData.bio
      });

      if (wizardData.profilePic) {
        const formData = new FormData();
        formData.append('biography', wizardData.bio);
        formData.append('profilePic', wizardData.profilePic);
        await MusicAPI.updateUserProfile(formData);
      }

      await loadArtistData();
      setShowProfileWizard(false);
      setSuccessMessage('Artist profile created successfully!');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create artist profile.');
    } finally {
      setSaving(false);
    }
  };

  const createAlbum = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const formData = new FormData();
      formData.append('title', albumData.title);
      formData.append('artist', albumData.artist || profile?.stage_name);
      formData.append('description', albumData.description || '');
      formData.append('isExplicit', albumData.isExplicit);

      if (albumData.albumArt) {
        formData.append('albumArt', albumData.albumArt);
      }

      const response = await MusicAPI.createAlbum(formData);
      const albumId = response.data.albumId;

      await loadArtistData();
      setSuccessMessage('Album created successfully!');
      setAlbumData({ title: '', artist: '', description: '', isExplicit: false, albumArt: null });
      setExpandedAlbumId(albumId);
      setActiveTab('albums');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create album.');
    } finally {
      setSaving(false);
    }
  };

  const handleTrackSelection = (files) => {
    const newTracks = Array.from(files).map(file => ({
      file,
      id: `track-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: file.name.replace(/\.[^/.]+$/, ''),
      artist: profile?.stage_name || '',
      status: 'pending',
      progress: 0
    }));

    setSelectedTracks(newTracks);
    setShowTrackUploadModal(true);
  };

  const updateTrackDetail = (id, field, value) => {
    setSelectedTracks(prevTracks =>
      prevTracks.map(track =>
        track.id === id ? { ...track, [field]: value } : track
      )
    );
  };

  const removeTrackFromSelection = (id) => {
    setSelectedTracks(prevTracks => prevTracks.filter(track => track.id !== id));
  };

  const uploadSingleTrack = async (albumId, track) => {
    const updateStatus = (status, errorMessage = null) => {
      setSelectedTracks(prev =>
        prev.map(t => t.id === track.id ? { ...t, status, ...(errorMessage && { errorMessage }) } : t)
      );
    };

    const updateProgressValue = (progress) => {
      setUploadProgress(prev => ({ ...prev, [track.id]: progress }));
      setSelectedTracks(prev =>
        prev.map(t => t.id === track.id ? { ...t, progress } : t)
      );
    };

    try {
      updateStatus('uploading');
      const formData = new FormData();
      formData.append('trackFile', track.file);
      formData.append('title', track.title);
      formData.append('artist', track.artist || profile?.stage_name);

      const token = localStorage.getItem('token');

      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `https://api.beatfly-music.xyz/xrpc/album.addtrack/${albumId}`);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            updateProgressValue(percent);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            updateStatus('complete');
            resolve(JSON.parse(xhr.responseText));
          } else {
            let errorMessage = 'Upload failed';
            try {
              errorMessage = JSON.parse(xhr.responseText).error || errorMessage;
            } catch (e) {}
            updateStatus('error', errorMessage);
            reject(new Error(errorMessage));
          }
        };

        xhr.onerror = () => {
          updateStatus('error', 'Network error during upload');
          reject(new Error('Network error'));
        };

        xhr.send(formData);
      });
    } catch (error) {
      updateStatus('error', error.message);
      throw error;
    }
  };

  const startTrackUploads = async () => {
    if (!selectedAlbumId || selectedTracks.length === 0) return;

    setUploadingTrack(true);
    setCurrentTrackIndex(0);

    for (let i = 0; i < selectedTracks.length; i++) {
      setCurrentTrackIndex(i);
      try {
        await uploadSingleTrack(selectedAlbumId, selectedTracks[i]);
      } catch (error) {
        console.error(`Failed to upload track ${i + 1}:`, error);
      }
      if (i < selectedTracks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    await loadArtistData();
    setSuccessMessage('Track uploads completed!');
    setUploadingTrack(false);
    setCurrentTrackIndex(-1);

    setTimeout(() => {
      setShowTrackUploadModal(false);
      setSelectedTracks([]);
      setUploadProgress({});
    }, 1500);
  };

  const getTrackStatusIcon = (status) => {
    switch (status) {
      case 'complete': return <CheckCircle2 size={18} className="text-emerald-400" />;
      case 'error': return <AlertCircle size={18} className="text-red-400" />;
      case 'uploading': return <Loader2 size={18} className="animate-spin text-accent" />;
      default: return <Clock size={18} className="text-white/40" />;
    }
  };

  const totalTracks = albums.reduce((acc, album) => acc + (album.tracks?.length || 0), 0);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-accent/20 border-t-accent animate-spin" />
          <Disc3 size={28} className="absolute inset-0 m-auto text-accent" />
        </div>
        <p className="text-white/60 text-sm font-medium">Loading your dashboard...</p>
      </div>
    );
  }

  // Error state (only show if no profile and no wizard)
  if (error && !showProfileWizard && !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
            <AlertTriangle size={40} className="text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Something went wrong</h2>
          <p className="text-white/60 mb-8">{error}</p>
          <button
            onClick={loadArtistData}
            className="px-8 py-3 bg-accent hover:bg-accent/90 rounded-xl text-white font-medium transition-all duration-200 hover:scale-105 active:scale-95"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Profile wizard
  if (showProfileWizard) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg"
        >
          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`h-2 rounded-full transition-all duration-300 ${
                  step === wizardStep ? 'w-8 bg-accent' : step < wizardStep ? 'w-8 bg-accent/50' : 'w-2 bg-white/20'
                }`}
              />
            ))}
          </div>

          <div className="bg-surface/80 backdrop-blur-xl rounded-2xl border border-white/10 p-8 shadow-2xl">
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-accent to-purple-600 flex items-center justify-center">
                <Music size={32} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Become an Artist</h1>
              <p className="text-white/60 text-sm">Set up your artist profile to start sharing your music</p>
            </div>

            <form onSubmit={completeWizard} className="space-y-6">
              {wizardStep === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-5"
                >
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">Stage Name</label>
                    <input
                      type="text"
                      value={wizardData.stageName}
                      onChange={(e) => setWizardData(prev => ({ ...prev, stageName: e.target.value }))}
                      required
                      className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all"
                      placeholder="How should we call you?"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">Bio</label>
                    <textarea
                      value={wizardData.bio}
                      onChange={(e) => setWizardData(prev => ({ ...prev, bio: e.target.value }))}
                      required
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all resize-none"
                      placeholder="Tell fans about yourself..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">Profile Picture</label>
                    <div className="flex items-center gap-4">
                      <div className="relative w-20 h-20 rounded-full overflow-hidden bg-white/5 border-2 border-dashed border-white/20 flex items-center justify-center group cursor-pointer hover:border-accent/50 transition-colors">
                        {wizardData.profilePic ? (
                          <img src={URL.createObjectURL(wizardData.profilePic)} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <User size={28} className="text-white/30 group-hover:text-white/50 transition-colors" />
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setWizardData(prev => ({ ...prev, profilePic: e.target.files?.[0] || null }))}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </div>
                      <div className="text-sm text-white/50">
                        <p>Click to upload</p>
                        <p className="text-xs">JPG, PNG up to 5MB</p>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setWizardStep(2)}
                    disabled={!wizardData.stageName || !wizardData.bio}
                    className="w-full h-12 bg-accent hover:bg-accent/90 disabled:bg-white/10 disabled:text-white/30 rounded-xl text-white font-medium transition-all duration-200 disabled:cursor-not-allowed"
                  >
                    Continue
                  </button>
                </motion.div>
              )}

              {wizardStep === 2 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-5"
                >
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <div className="flex items-start gap-3">
                      <Info size={20} className="text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-amber-200 text-sm font-medium">Copyright Quiz</p>
                        <p className="text-amber-200/70 text-xs mt-1">Answer these questions to verify you understand copyright</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Who owns the copyright to music you create and upload?
                    </label>
                    <input
                      type="text"
                      value={wizardData.copyrightAnswer}
                      onChange={(e) => setWizardData(prev => ({ ...prev, copyrightAnswer: e.target.value }))}
                      required
                      className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all"
                      placeholder="Your answer..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      What is the most important factor in determining if a work is original?
                    </label>
                    <input
                      type="text"
                      value={wizardData.ipAnswer}
                      onChange={(e) => setWizardData(prev => ({ ...prev, ipAnswer: e.target.value }))}
                      required
                      className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all"
                      placeholder="Your answer..."
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setWizardStep(1)}
                      className="flex-1 h-12 bg-white/5 hover:bg-white/10 rounded-xl text-white/80 font-medium transition-all"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setWizardStep(3)}
                      disabled={!wizardData.copyrightAnswer || !wizardData.ipAnswer}
                      className="flex-1 h-12 bg-accent hover:bg-accent/90 disabled:bg-white/10 disabled:text-white/30 rounded-xl text-white font-medium transition-all disabled:cursor-not-allowed"
                    >
                      Continue
                    </button>
                  </div>
                </motion.div>
              )}

              {wizardStep === 3 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-5"
                >
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={wizardData.acceptedTerms}
                        onChange={(e) => setWizardData(prev => ({ ...prev, acceptedTerms: e.target.checked }))}
                        className="mt-1 w-5 h-5 rounded border-white/20 bg-white/5 text-accent focus:ring-accent/20 cursor-pointer"
                      />
                      <span className="text-sm text-white/70 leading-relaxed">
                        I agree to the terms of service and confirm that I have the rights to all content I upload. I understand that uploading copyrighted content without permission may result in account termination.
                      </span>
                    </label>
                  </div>

                  {error && (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                      <p className="text-red-400 text-sm flex items-center gap-2">
                        <AlertCircle size={16} />
                        {error}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setWizardStep(2)}
                      className="flex-1 h-12 bg-white/5 hover:bg-white/10 rounded-xl text-white/80 font-medium transition-all"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={saving || !wizardData.acceptedTerms}
                      className="flex-1 h-12 bg-gradient-to-r from-accent to-purple-600 hover:opacity-90 disabled:opacity-50 rounded-xl text-white font-medium transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed"
                    >
                      {saving ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Complete Setup'
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </form>
          </div>
        </motion.div>
      </div>
    );
  }

  // No profile state
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-white/60">No artist profile found.</p>
      </div>
    );
  }

  // Main dashboard
  return (
    <div className="min-h-screen pb-32">
      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/20 via-accent/5 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent/10 via-transparent to-transparent" />

        <div className="relative z-10 px-6 lg:px-8 pt-8 pb-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end gap-6">
              {/* Profile Image */}
              <div className="relative group">
                <div className="w-36 h-36 md:w-44 md:h-44 rounded-2xl overflow-hidden shadow-2xl ring-4 ring-white/10 bg-gradient-to-br from-accent/50 to-purple-600/50">
                  {profile.profile_pic ? (
                    <img src={profile.profile_pic} alt={profile.stage_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music size={56} className="text-white/30" />
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setActiveTab('profile')}
                  className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-accent hover:bg-accent/90 shadow-lg flex items-center justify-center transition-transform hover:scale-110"
                >
                  <Edit3 size={16} className="text-white" />
                </button>
              </div>

              {/* Profile Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-3 py-1 rounded-full bg-accent/20 text-accent text-xs font-medium uppercase tracking-wide">
                    Artist
                  </span>
                </div>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 truncate">
                  {profile.stage_name}
                </h1>
                {profile.bio && (
                  <p className="text-white/60 text-sm md:text-base line-clamp-2 max-w-2xl mb-4">
                    {profile.bio}
                  </p>
                )}
                <div className="flex items-center gap-4 text-sm text-white/50">
                  <span className="flex items-center gap-1.5">
                    <Album size={16} />
                    {albums.length} album{albums.length !== 1 ? 's' : ''}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Music size={16} />
                    {totalTracks} track{totalTracks !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 mt-8 overflow-x-auto pb-2 scrollbar-hide">
              {[
                { id: 'albums', label: 'Albums', icon: Album },
                { id: 'new-album', label: 'New Album', icon: Plus },
                { id: 'profile', label: 'Edit Profile', icon: Edit3 },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-sm whitespace-nowrap transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-white text-black shadow-lg'
                      : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <tab.icon size={18} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Toast Messages */}
      <AnimatePresence>
        {(successMessage || error) && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 max-w-md"
          >
            <div className={`px-5 py-4 rounded-xl shadow-2xl backdrop-blur-xl flex items-center gap-3 ${
              successMessage ? 'bg-emerald-500/90' : 'bg-red-500/90'
            }`}>
              {successMessage ? (
                <CheckCircle2 size={20} className="text-white flex-shrink-0" />
              ) : (
                <AlertCircle size={20} className="text-white flex-shrink-0" />
              )}
              <p className="text-white font-medium text-sm">{successMessage || error}</p>
              <button
                onClick={() => successMessage ? setSuccessMessage('') : setError('')}
                className="ml-2 text-white/80 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="px-6 lg:px-8 mt-8">
        <div className="max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            {/* Albums Tab */}
            {activeTab === 'albums' && (
              <motion.div
                key="albums"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                {/* Singles Section */}
                {singles.length > 0 && (
                  <div className="mb-10">
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <Disc3 size={22} className="text-accent" />
                      Singles
                    </h2>
                    <div className="grid gap-3">
                      {singles.map((track, index) => (
                        <motion.div
                          key={track.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="group flex items-center gap-4 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-200"
                        >
                          <button
                            onClick={() => playTrack(track)}
                            className="w-12 h-12 rounded-lg bg-accent/20 group-hover:bg-accent flex items-center justify-center transition-all duration-200"
                          >
                            <Play size={20} fill="currentColor" className="text-accent group-hover:text-white ml-0.5" />
                          </button>
                          {track.track_image && (
                            <img src={track.track_image} alt={track.title} className="w-12 h-12 rounded-lg object-cover" />
                          )}
                          <div className="flex-1 min-w-0">
                            <h5 className="font-medium text-white truncate">{track.title}</h5>
                            <p className="text-sm text-white/50 truncate">{track.artist || profile.stage_name}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Albums Section */}
                {albums.length > 0 ? (
                  <div className="space-y-4">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <Album size={22} className="text-accent" />
                      Your Albums
                    </h2>
                    <div className="grid gap-4">
                      {albums.map((album, index) => (
                        <motion.div
                          key={album.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="bg-white/5 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/5 hover:border-white/10 transition-all duration-300"
                        >
                          {/* Album Header */}
                          <div className="flex p-4 gap-4">
                            <div className="w-24 h-24 md:w-28 md:h-28 rounded-xl overflow-hidden flex-shrink-0 shadow-lg">
                              {album.album_art ? (
                                <img src={album.album_art} alt={album.title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-accent/30 to-purple-600/30 flex items-center justify-center">
                                  <Music size={32} className="text-white/30" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                              <div>
                                <h3 className="text-lg md:text-xl font-bold text-white truncate">{album.title}</h3>
                                <p className="text-sm text-white/50">{album.artist}</p>
                              </div>
                              <div className="flex items-center gap-4 text-xs text-white/40">
                                <span className="flex items-center gap-1">
                                  <Music size={14} />
                                  {album.tracks?.length || 0} track{(album.tracks?.length || 0) !== 1 ? 's' : ''}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar size={14} />
                                  {new Date(album.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2">
                              <button
                                onClick={() => setExpandedAlbumId(expandedAlbumId === album.id ? null : album.id)}
                                className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all"
                              >
                                {expandedAlbumId === album.id ? <EyeOff size={18} /> : <Eye size={18} />}
                              </button>
                              <button
                                onClick={() => handleDeleteAlbum(album.id)}
                                disabled={deletingAlbumId === album.id}
                                className="w-10 h-10 rounded-lg bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center text-red-400 hover:text-red-300 transition-all disabled:opacity-50"
                              >
                                {deletingAlbumId === album.id ? (
                                  <Loader2 size={18} className="animate-spin" />
                                ) : (
                                  <Trash2 size={18} />
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Expanded Tracks */}
                          <AnimatePresence>
                            {expandedAlbumId === album.id && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="px-4 pb-4 pt-2 border-t border-white/5">
                                  <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-sm font-medium text-white/70">Tracks</h4>
                                    <button
                                      onClick={() => {
                                        setSelectedAlbumId(album.id);
                                        if (fileInputRef.current) fileInputRef.current.click();
                                      }}
                                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent hover:bg-accent/90 text-white text-sm font-medium transition-all hover:scale-105 active:scale-95"
                                    >
                                      <Upload size={16} />
                                      Add Tracks
                                    </button>
                                  </div>

                                  {album.tracks?.length > 0 ? (
                                    <div className="space-y-2">
                                      {album.tracks.map((track, trackIndex) => (
                                        <motion.div
                                          key={track.id}
                                          initial={{ opacity: 0, x: -10 }}
                                          animate={{ opacity: 1, x: 0 }}
                                          transition={{ delay: trackIndex * 0.03 }}
                                          className="group flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
                                        >
                                          <span className="w-6 text-center text-sm text-white/30 group-hover:hidden">
                                            {trackIndex + 1}
                                          </span>
                                          <button
                                            onClick={() => playTrack(track)}
                                            className="hidden group-hover:flex w-6 h-6 items-center justify-center"
                                          >
                                            <Play size={14} fill="currentColor" className="text-accent" />
                                          </button>
                                          <div className="flex-1 min-w-0">
                                            <h5 className="font-medium text-white text-sm truncate">{track.title}</h5>
                                            <p className="text-xs text-white/40 truncate">{track.artist || album.artist}</p>
                                          </div>
                                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                              onClick={() => {
                                                setEditingLyricsTrackId(track.id);
                                                setLyricsText(track.lyrics || '');
                                              }}
                                              className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all"
                                            >
                                              <FileText size={16} />
                                            </button>
                                            <button
                                              onClick={() => handleDeleteTrack(album.id, track.id)}
                                              disabled={deletingTrackId === track.id}
                                              className="w-8 h-8 rounded-lg hover:bg-red-500/20 flex items-center justify-center text-white/50 hover:text-red-400 transition-all disabled:opacity-50"
                                            >
                                              {deletingTrackId === track.id ? (
                                                <Loader2 size={16} className="animate-spin" />
                                              ) : (
                                                <Trash2 size={16} />
                                              )}
                                            </button>
                                          </div>
                                        </motion.div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="py-8 text-center">
                                      <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-white/5 flex items-center justify-center">
                                        <Music size={28} className="text-white/20" />
                                      </div>
                                      <p className="text-white/50 text-sm">No tracks yet</p>
                                      <p className="text-white/30 text-xs mt-1">Upload tracks to this album</p>
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="py-16 text-center">
                    <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-accent/20 to-purple-600/20 flex items-center justify-center">
                      <Album size={40} className="text-white/30" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">No Albums Yet</h3>
                    <p className="text-white/50 mb-6 max-w-md mx-auto">
                      Start building your music portfolio by creating your first album.
                    </p>
                    <button
                      onClick={() => setActiveTab('new-album')}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent/90 rounded-xl text-white font-medium transition-all hover:scale-105 active:scale-95"
                    >
                      <Plus size={20} />
                      Create Your First Album
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* New Album Tab */}
            {activeTab === 'new-album' && (
              <motion.div
                key="new-album"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="max-w-2xl"
              >
                <h2 className="text-2xl font-bold text-white mb-6">Create New Album</h2>

                <form onSubmit={createAlbum} className="space-y-6">
                  <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/5 space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">Album Title *</label>
                      <input
                        type="text"
                        value={albumData.title}
                        onChange={(e) => setAlbumData(prev => ({ ...prev, title: e.target.value }))}
                        required
                        className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all"
                        placeholder="Enter album title"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">Artist Name</label>
                      <input
                        type="text"
                        value={albumData.artist}
                        onChange={(e) => setAlbumData(prev => ({ ...prev, artist: e.target.value }))}
                        className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all"
                        placeholder={profile?.stage_name || 'Your stage name'}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">Description</label>
                      <textarea
                        value={albumData.description}
                        onChange={(e) => setAlbumData(prev => ({ ...prev, description: e.target.value }))}
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all resize-none"
                        placeholder="Tell listeners about this album..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">Album Art</label>
                      <div className="flex items-start gap-4">
                        <div className="relative w-32 h-32 rounded-xl overflow-hidden bg-white/5 border-2 border-dashed border-white/20 flex items-center justify-center group cursor-pointer hover:border-accent/50 transition-colors">
                          {albumData.albumArt ? (
                            <img src={URL.createObjectURL(albumData.albumArt)} alt="Preview" className="w-full h-full object-cover" />
                          ) : (
                            <div className="text-center">
                              <ImageIcon size={28} className="mx-auto text-white/30 group-hover:text-white/50 transition-colors" />
                              <p className="text-xs text-white/30 mt-2">Click to upload</p>
                            </div>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setAlbumData(prev => ({ ...prev, albumArt: e.target.files?.[0] || null }))}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                          />
                        </div>
                        <div className="text-sm text-white/40 pt-2">
                          <p>Recommended: 1000x1000px</p>
                          <p>JPG, PNG, WebP up to 5MB</p>
                        </div>
                      </div>
                    </div>

                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={albumData.isExplicit}
                        onChange={(e) => setAlbumData(prev => ({ ...prev, isExplicit: e.target.checked }))}
                        className="w-5 h-5 rounded border-white/20 bg-white/5 text-accent focus:ring-accent/20 cursor-pointer"
                      />
                      <span className="text-sm text-white/70 group-hover:text-white/90 transition-colors">
                        This album contains explicit content
                      </span>
                    </label>
                  </div>

                  <div className="p-4 rounded-xl bg-accent/10 border border-accent/20 flex items-start gap-3">
                    <Info size={18} className="text-accent flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-white/70">
                      After creating the album, you'll be able to upload tracks from the Albums tab.
                    </p>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={saving || !albumData.title}
                      className="flex-1 h-12 bg-accent hover:bg-accent/90 disabled:bg-white/10 disabled:text-white/30 rounded-xl text-white font-medium transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed"
                    >
                      {saving ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Plus size={18} />
                          Create Album
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('albums')}
                      className="px-6 h-12 bg-white/5 hover:bg-white/10 rounded-xl text-white/70 hover:text-white font-medium transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="max-w-2xl"
              >
                <h2 className="text-2xl font-bold text-white mb-6">Edit Profile</h2>

                <form onSubmit={updateProfile} className="space-y-6">
                  <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/5 space-y-5">
                    <div className="flex items-center gap-6 pb-5 border-b border-white/5">
                      <div className="relative w-24 h-24 rounded-full overflow-hidden bg-white/5 border-2 border-dashed border-white/20 flex items-center justify-center group cursor-pointer hover:border-accent/50 transition-colors">
                        {profileData.profilePic ? (
                          <img src={URL.createObjectURL(profileData.profilePic)} alt="Preview" className="w-full h-full object-cover" />
                        ) : profile?.profile_pic ? (
                          <img src={profile.profile_pic} alt={profile.stage_name} className="w-full h-full object-cover" />
                        ) : (
                          <User size={32} className="text-white/30" />
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Edit3 size={20} className="text-white" />
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setProfileData(prev => ({ ...prev, profilePic: e.target.files?.[0] || null }))}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </div>
                      <div>
                        <p className="text-white font-medium">Profile Picture</p>
                        <p className="text-sm text-white/40">Click to change</p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">Stage Name</label>
                      <input
                        type="text"
                        value={profileData.stageName}
                        onChange={(e) => setProfileData(prev => ({ ...prev, stageName: e.target.value }))}
                        required
                        className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all"
                        placeholder="Your stage name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">Bio</label>
                      <textarea
                        value={profileData.bio}
                        onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                        rows={5}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all resize-none"
                        placeholder="Tell the world about yourself..."
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-1 h-12 bg-accent hover:bg-accent/90 disabled:bg-white/10 disabled:text-white/30 rounded-xl text-white font-medium transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed"
                    >
                      {saving ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={18} />
                          Save Changes
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('albums')}
                      className="px-6 h-12 bg-white/5 hover:bg-white/10 rounded-xl text-white/70 hover:text-white font-medium transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Lyrics Editor Modal */}
      <AnimatePresence>
        {editingLyricsTrackId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setEditingLyricsTrackId(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface rounded-2xl w-full max-w-2xl p-6 shadow-2xl border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-xl font-bold text-white">Edit Lyrics</h3>
                <button
                  onClick={() => setEditingLyricsTrackId(null)}
                  className="w-10 h-10 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all"
                >
                  <X size={22} />
                </button>
              </div>

              <textarea
                value={lyricsText}
                onChange={(e) => setLyricsText(e.target.value)}
                className="w-full h-72 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all resize-none font-mono text-sm"
                placeholder="Enter lyrics here..."
              />

              <div className="flex justify-end gap-3 mt-5">
                <button
                  type="button"
                  onClick={() => setEditingLyricsTrackId(null)}
                  className="px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-white/70 hover:text-white font-medium transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const album = albums.find(a => a.tracks?.some(t => t.id === editingLyricsTrackId));
                    if (album) {
                      updateLyrics(album.id, editingLyricsTrackId);
                    }
                  }}
                  disabled={saving}
                  className="px-5 py-2.5 bg-accent hover:bg-accent/90 rounded-xl text-white font-medium transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  Save Lyrics
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        accept="audio/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleTrackSelection(e.target.files);
          }
          e.target.value = '';
        }}
      />

      {/* Track Upload Modal */}
      <AnimatePresence>
        {showTrackUploadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => !uploadingTrack && setShowTrackUploadModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface rounded-2xl w-full max-w-3xl p-6 shadow-2xl border border-white/10 max-h-[85vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-5">
                <div>
                  <h3 className="text-xl font-bold text-white">Upload Tracks</h3>
                  <p className="text-sm text-white/50 mt-1">Edit track details before uploading</p>
                </div>
                {!uploadingTrack && (
                  <button
                    onClick={() => setShowTrackUploadModal(false)}
                    className="w-10 h-10 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all"
                  >
                    <X size={22} />
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                {selectedTracks.map((track) => (
                  <div
                    key={track.id}
                    className={`p-4 rounded-xl border transition-all ${
                      track.status === 'error'
                        ? 'border-red-500/30 bg-red-500/10'
                        : track.status === 'complete'
                        ? 'border-emerald-500/30 bg-emerald-500/10'
                        : track.status === 'uploading'
                        ? 'border-accent/30 bg-accent/10'
                        : 'border-white/10 bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                        {getTrackStatusIcon(track.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate font-medium">{track.file.name}</p>
                        <p className="text-xs text-white/40">{(track.file.size / (1024 * 1024)).toFixed(2)} MB</p>
                      </div>
                      {track.status === 'pending' && (
                        <button
                          onClick={() => removeTrackFromSelection(track.id)}
                          className="w-8 h-8 rounded-lg hover:bg-red-500/20 flex items-center justify-center text-white/40 hover:text-red-400 transition-all"
                        >
                          <X size={18} />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <input
                        type="text"
                        value={track.title}
                        onChange={(e) => updateTrackDetail(track.id, 'title', e.target.value)}
                        placeholder="Track title"
                        disabled={track.status !== 'pending'}
                        className="h-10 px-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-white/30 focus:border-accent focus:outline-none disabled:opacity-50 transition-all"
                      />
                      <input
                        type="text"
                        value={track.artist}
                        onChange={(e) => updateTrackDetail(track.id, 'artist', e.target.value)}
                        placeholder={profile?.stage_name || 'Artist name'}
                        disabled={track.status !== 'pending'}
                        className="h-10 px-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-white/30 focus:border-accent focus:outline-none disabled:opacity-50 transition-all"
                      />
                    </div>

                    {(track.status === 'uploading' || track.status === 'complete' || track.status === 'error') && (
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${track.progress || 0}%` }}
                          className={`h-full rounded-full ${track.status === 'error' ? 'bg-red-500' : 'bg-accent'}`}
                        />
                      </div>
                    )}

                    {track.status === 'error' && track.errorMessage && (
                      <p className="mt-2 text-sm text-red-400">{track.errorMessage}</p>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center mt-5 pt-5 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingTrack}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-white/70 hover:text-white text-sm font-medium transition-all disabled:opacity-50"
                >
                  <Plus size={16} />
                  Add More
                </button>
                <div className="flex gap-3">
                  {!uploadingTrack && (
                    <button
                      type="button"
                      onClick={() => setShowTrackUploadModal(false)}
                      className="px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-white/70 hover:text-white font-medium transition-all"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={startTrackUploads}
                    disabled={uploadingTrack || selectedTracks.length === 0}
                    className="px-6 py-2.5 bg-accent hover:bg-accent/90 rounded-xl text-white font-medium transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {uploadingTrack ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Uploading {currentTrackIndex + 1}/{selectedTracks.length}
                      </>
                    ) : (
                      <>
                        <Upload size={16} />
                        Upload {selectedTracks.length} Track{selectedTracks.length !== 1 ? 's' : ''}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ArtistDashboard;
