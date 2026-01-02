import React, {
  useState,
  useEffect,
  useCallback,
  useDeferredValue,
  useMemo,
  useRef,
} from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search as SearchIcon,
  Play,
  Pause,
  ChevronRight,
  Loader,
  Music,
  User,
} from 'lucide-react';
import { useAudio, useCurrentTrack, useIsPlaying } from '../contexts/AudioContext';
import MusicAPI from '../services/api';
import VirtualList from '../components/shared/VirtualList';

const DEFAULT_ALBUM_ART = '/default-album-art.png';
const DEFAULT_PROFILE_PIC = '/default-profile-pic.png';
const TRACK_ROW_HEIGHT = 86;

// Track result row
const TrackResult = React.memo(({
  track,
  index,
  currentTrackId,
  isPlaying,
  onTrackAction,
  getImageUrl,
}) => {
  const isCurrentTrack = currentTrackId === track.id;
  const imageUrl = getImageUrl('albumArt', track.album_art);

  const handleClick = useCallback(() => {
    onTrackAction(track, isCurrentTrack);
  }, [isCurrentTrack, onTrackAction, track]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="group grid grid-cols-[auto,4fr,2fr,1fr] gap-4 items-center px-4 py-2 rounded-md hover:bg-surface-light"
      role="listitem"
    >
      <div className="flex items-center justify-center w-8">
        <button onClick={handleClick} className="text-gray-400 hover:text-white">
          {isCurrentTrack && isPlaying ? <Pause size={16} /> : <Play size={16} />}
        </button>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative w-12 h-12 bg-surface rounded overflow-hidden">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={track.title}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                e.target.src = DEFAULT_ALBUM_ART;
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Music size={24} className="text-white/20" />
            </div>
          )}
        </div>
        <div>
          <div className={`font-medium ${isCurrentTrack ? 'text-accent' : ''}`}>
            {track.title}
          </div>
          <Link to={`/profile/${track.user_id}`} className="text-sm text-gray-400 hover:text-white">
            {track.artist}
          </Link>
        </div>
      </div>
      <div className="text-gray-400 truncate">{track.album_title || 'Single'}</div>
      <div className="text-sm text-gray-400 text-right">{track.duration}</div>
    </motion.div>
  );
});

// Artist card
const ArtistResult = React.memo(({ artist, getImageUrl }) => {
  const imageUrl = getImageUrl('profilePics', artist.profile_pic) + '?h=232';
  return (
    <Link
      to={`/profile/${artist.id}`}
      className="p-4 bg-surface rounded-lg block hover:bg-surface-light transition-colors"
    >
      <div className="w-full aspect-square mb-4 rounded-full overflow-hidden bg-surface">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={artist.username}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              e.target.src = DEFAULT_PROFILE_PIC;
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <User size={32} className="text-white/20" />
          </div>
        )}
      </div>
      <h3 className="font-medium text-center truncate">{artist.username}</h3>
      <p className="text-sm text-gray-400 text-center">Artist</p>
    </Link>
  );
});

// Album card
const AlbumResult = React.memo(({ album, getImageUrl }) => {
  const imageUrl = getImageUrl('albumArt', album.album_art) + '?h=232';
  return (
    <Link
      to={`/album/${album.id}`}
      className="p-4 bg-surface rounded-lg block hover:bg-surface-light transition-colors"
    >
      <div className="w-full aspect-square mb-4 rounded overflow-hidden bg-surface">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={album.title}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              e.target.src = DEFAULT_ALBUM_ART;
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Music size={32} className="text-white/20" />
          </div>
        )}
      </div>
      <h3 className="font-medium truncate">{album.title}</h3>
      <p className="text-sm text-gray-400 truncate">{album.artist}</p>
    </Link>
  );
});

const Search = () => {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Show all toggles for each section
  const [showAllTracks, setShowAllTracks] = useState(false);
  const [showAllArtists, setShowAllArtists] = useState(false);
  const [showAllAlbums, setShowAllAlbums] = useState(false);

  const abortRef = useRef(null);

  const currentTrack = useCurrentTrack();
  const isPlaying = useIsPlaying();
  const { togglePlay, playTrack } = useAudio();
  const currentTrackId = currentTrack?.id;

  const getImageUrl = useCallback((folder, filename) => {
    if (!filename) return '';
    return MusicAPI.getImage(folder, filename);
  }, []);

  const handleTrackAction = useCallback(
    (track, isCurrent) => {
      if (!track) return;
      if (isCurrent) {
        togglePlay();
      } else {
        playTrack(track);
      }
    },
    [playTrack, togglePlay]
  );

  const handleSearch = useCallback(async (searchQuery, signal) => {
    if (!searchQuery.trim()) {
      setResults(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await MusicAPI.search(searchQuery, { signal });
      if (!signal?.aborted) {
        setResults(response.data);
      }
    } catch (err) {
      if (signal?.aborted) return;
      setError('Error fetching search results');
      console.error(err);
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const trimmed = deferredQuery.trim();

    // Cancel any inflight request
    abortRef.current?.abort();

    if (!trimmed) {
      setResults(null);
      setError('');
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    const debounceId = setTimeout(() => handleSearch(trimmed, controller.signal), 200);

    return () => {
      clearTimeout(debounceId);
      controller.abort();
    };
  }, [deferredQuery, handleSearch]);

  const trackList = useMemo(() => {
    if (!results?.tracks?.length) return [];
    if (results.tracks.length > 5 && !showAllTracks) {
      return results.tracks.slice(0, 5);
    }
    return results.tracks;
  }, [results?.tracks, showAllTracks]);

  const shouldVirtualizeTracks = trackList.length > 14 || showAllTracks;
  const trackListHeight = Math.max(
    TRACK_ROW_HEIGHT * Math.min(trackList.length || 1, 12) + 12,
    TRACK_ROW_HEIGHT * 3
  );

  const renderTrackItem = useCallback(
    (track, index) => (
      <div key={track.id} style={{ height: TRACK_ROW_HEIGHT }} className="flex items-stretch">
        <TrackResult
          track={track}
          index={index}
          currentTrackId={currentTrackId}
          isPlaying={isPlaying}
          onTrackAction={handleTrackAction}
          getImageUrl={getImageUrl}
        />
      </div>
    ),
    [currentTrackId, getImageUrl, handleTrackAction, isPlaying]
  );

  return (
    <div className="min-h-full p-8">
      <div className="relative max-w-2xl mb-8">
        <SearchIcon size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="What do you want to listen to?"
          className="w-full h-12 bg-surface rounded-full pl-12 pr-4 text-white 
                     focus:outline-none focus:ring-2 focus:ring-accent transition-all"
        />
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader size={24} className="animate-spin text-accent" />
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
          <div className="text-red-500">{error}</div>
        </div>
      )}

      {results && !loading && (
        <div className="space-y-8">
          {/* Songs Section */}
          {trackList.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Songs</h2>
                {results.tracks.length > 5 && (
                  <button
                    onClick={() => setShowAllTracks(!showAllTracks)}
                    className="text-gray-400 hover:text-white flex items-center gap-1"
                  >
                    {showAllTracks ? 'Show Less' : 'Show All'} <ChevronRight size={20} />
                  </button>
                )}
              </div>
              {shouldVirtualizeTracks ? (
                <VirtualList
                  items={trackList}
                  itemHeight={TRACK_ROW_HEIGHT}
                  height={trackListHeight}
                  renderItem={renderTrackItem}
                  innerClassName="space-y-1"
                />
              ) : (
                <div className="space-y-1">
                  {trackList.map((track, index) => renderTrackItem(track, index))}
                </div>
              )}
            </div>
          )}

          {/* Artists Section */}
          {results.users?.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Artists</h2>
                {results.users.length > 5 && (
                  <button
                    onClick={() => setShowAllArtists(!showAllArtists)}
                    className="text-gray-400 hover:text-white flex items-center gap-1"
                  >
                    {showAllArtists ? 'Show Less' : 'Show All'} <ChevronRight size={20} />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {(results.users.length > 5 && !showAllArtists
                  ? results.users.slice(0, 5)
                  : results.users
                ).map((artist) => (
                  <motion.div
                    key={artist.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <ArtistResult artist={artist} getImageUrl={getImageUrl} />
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Albums Section */}
          {results.albums?.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Albums</h2>
                {results.albums.length > 5 && (
                  <button
                    onClick={() => setShowAllAlbums(!showAllAlbums)}
                    className="text-gray-400 hover:text-white flex items-center gap-1"
                  >
                    {showAllAlbums ? 'Show Less' : 'Show All'} <ChevronRight size={20} />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {(results.albums.length > 5 && !showAllAlbums
                  ? results.albums.slice(0, 5)
                  : results.albums
                ).map((album) => (
                  <motion.div
                    key={album.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <AlbumResult album={album} getImageUrl={getImageUrl} />
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {(!results.tracks?.length &&
            !results.albums?.length &&
            !results.users?.length) && (
              <div className="text-center py-12">
                <p className="text-gray-400">No results found for "{query}"</p>
              </div>
            )}
        </div>
      )}
    </div>
  );
};

export default Search;
