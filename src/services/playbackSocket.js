import { io } from 'socket.io-client';

/**
 * Create a Socket.IO client for playback sync.
 * The server shares host/port with the API and uses the default /socket.io path.
 */
export const createPlaybackSocket = (token) => {
  const socket = io('https://api.beatfly-music.xyz', {
    path: '/socket.io',
    transports: ['websocket'],
    auth: { token },
    autoConnect: true,
  });

  return socket;
};

export default createPlaybackSocket;
