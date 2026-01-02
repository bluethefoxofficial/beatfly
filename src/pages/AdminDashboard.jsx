import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import {
  ShieldCheck, BarChart3, Users, Mic2, UserX, Ban,
  Music2, ListMusic, AlertTriangle, Search, Trash2,
  RefreshCw, FileText, CheckCircle2, XCircle, Loader2,
  ChevronRight, Shield, X, Calendar, Clock
} from 'lucide-react';
import MusicAPI from '../services/api';

// Stat Card Component
const StatCard = ({ label, value, icon: Icon, color = 'accent', delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-5 group hover:bg-white/[0.08] transition-all duration-300"
  >
    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    <div className="relative flex items-center gap-4">
      <div className={`p-3 rounded-xl bg-${color}/20 border border-${color}/30`}>
        <Icon size={22} className={`text-${color}`} />
      </div>
      <div>
        <p className="text-white/50 text-sm font-medium">{label}</p>
        <p className="text-3xl font-bold text-white">{value}</p>
      </div>
    </div>
  </motion.div>
);

// Tab Button Component
const TabButton = ({ active, onClick, icon: Icon, label, count }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2.5 px-5 py-3 rounded-xl font-medium text-sm whitespace-nowrap transition-all duration-200 ${
      active
        ? 'bg-accent text-white shadow-lg shadow-accent/25'
        : 'text-white/60 hover:text-white hover:bg-white/5'
    }`}
  >
    <Icon size={18} />
    <span>{label}</span>
    {count !== undefined && count > 0 && (
      <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
        active ? 'bg-white/20' : 'bg-white/10'
      }`}>
        {count}
      </span>
    )}
  </button>
);

// Data Table Component
const DataTable = ({ columns, data, loading, error, emptyMessage, renderRow }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="animate-spin text-accent" />
        <span className="ml-3 text-white/60">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12 text-red-400">
        <AlertTriangle size={20} className="mr-2" />
        {error}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-white/40">
        <ListMusic size={40} className="mb-3" />
        <p>{emptyMessage || 'No data found'}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/10 bg-white/5">
            {columns.map((col, i) => (
              <th key={i} className="px-4 py-3 text-left text-sm font-medium text-white/60">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {data.map((item, index) => renderRow(item, index))}
        </tbody>
      </table>
    </div>
  );
};

// Search Input Component
const SearchInput = ({ value, onChange, placeholder }) => (
  <div className="relative">
    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full h-11 pl-11 pr-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all"
    />
  </div>
);

// Modal Component
const Modal = ({ isOpen, onClose, title, children }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-surface rounded-2xl w-full max-w-md p-6 shadow-2xl border border-white/10"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-xl font-bold text-white">{title}</h3>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all"
            >
              <X size={20} />
            </button>
          </div>
          {children}
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

// Status Badge Component
const StatusBadge = ({ status }) => {
  const styles = {
    pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    reviewed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    resolved: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    dismissed: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    banned: 'bg-red-500/20 text-red-400 border-red-500/30',
    admin: 'bg-accent/20 text-accent border-accent/30',
    artist: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${styles[status] || styles.pending}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

// Stats Tab Component
const StatsTab = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await MusicAPI.getAdminStats();
        setStats(res.data?.stats || res.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Unable to load stats');
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-accent/20 border-t-accent animate-spin" />
          <BarChart3 size={24} className="absolute inset-0 m-auto text-accent" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-red-400">
        <AlertTriangle size={40} className="mb-3" />
        <p>{error}</p>
      </div>
    );
  }

  if (!stats) {
    return <div className="text-center py-16 text-white/50">No stats available.</div>;
  }

  const statItems = [
    { label: 'Total Users', value: stats.users ?? 0, icon: Users, color: 'accent' },
    { label: 'Artists', value: stats.artists ?? 0, icon: Mic2, color: 'purple-500' },
    { label: 'Albums', value: stats.albums ?? 0, icon: Music2, color: 'blue-500' },
    { label: 'Tracks', value: stats.tracks ?? 0, icon: ListMusic, color: 'cyan-500' },
    { label: 'Playlists', value: stats.playlists ?? 0, icon: ListMusic, color: 'emerald-500' },
    { label: 'Banned Users', value: stats.banned_users ?? 0, icon: UserX, color: 'red-500' },
    { label: 'Banned Artists', value: stats.banned_artists ?? 0, icon: Ban, color: 'orange-500' },
    { label: 'Pending Reports', value: stats.pending_reports ?? 0, icon: AlertTriangle, color: 'amber-500' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statItems.map((item, index) => (
        <StatCard key={item.label} {...item} delay={index * 0.05} />
      ))}
    </div>
  );
};

// Users Tab Component
const UsersTab = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [banModal, setBanModal] = useState({ open: false, user: null });
  const [banForm, setBanForm] = useState({ reason: '', expiresAt: '' });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await MusicAPI.getAdminUsers({ search });
      setUsers(res.data.users || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleBan = async () => {
    if (!banModal.user) return;
    setActionLoading(true);
    try {
      await MusicAPI.banUser({
        userId: banModal.user.id,
        reason: banForm.reason,
        expiresAt: banForm.expiresAt || null
      });
      setBanModal({ open: false, user: null });
      setBanForm({ reason: '', expiresAt: '' });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to ban user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to permanently delete this user?')) return;
    try {
      await MusicAPI.deleteUser(userId);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete user');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <h2 className="text-xl font-bold text-white">Manage Users</h2>
        <div className="w-full sm:w-72">
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
          />
        </div>
      </div>

      <DataTable
        columns={['User', 'Email', 'Status', 'Actions']}
        data={users}
        loading={loading}
        error={error}
        emptyMessage="No users found"
        renderRow={(user) => (
          <tr key={user.id} className="hover:bg-white/5 transition-colors">
            <td className="px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
                  <Users size={16} className="text-white/60" />
                </div>
                <span className="font-medium text-white">{user.username}</span>
              </div>
            </td>
            <td className="px-4 py-3 text-white/60">{user.email}</td>
            <td className="px-4 py-3">
              <div className="flex flex-wrap gap-1">
                {user.is_admin && <StatusBadge status="admin" />}
                {user.is_artist && <StatusBadge status="artist" />}
                {user.is_banned && <StatusBadge status="banned" />}
                {!user.is_admin && !user.is_banned && <StatusBadge status="active" />}
              </div>
            </td>
            <td className="px-4 py-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setBanModal({ open: true, user })}
                  disabled={user.is_admin}
                  className="px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 text-sm font-medium hover:bg-amber-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
                >
                  <Ban size={14} />
                  Ban
                </button>
                <button
                  onClick={() => handleDelete(user.id)}
                  disabled={user.is_admin}
                  className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-sm font-medium hover:bg-red-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            </td>
          </tr>
        )}
      />

      <Modal
        isOpen={banModal.open}
        onClose={() => setBanModal({ open: false, user: null })}
        title={`Ban ${banModal.user?.username}?`}
      >
        <p className="text-white/60 text-sm mb-4">
          This will prevent the user from accessing the platform.
        </p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Reason</label>
            <input
              type="text"
              value={banForm.reason}
              onChange={(e) => setBanForm(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="Enter ban reason..."
              className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-accent focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Expires At (optional)</label>
            <input
              type="datetime-local"
              value={banForm.expiresAt}
              onChange={(e) => setBanForm(prev => ({ ...prev, expiresAt: e.target.value }))}
              className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/10 text-white focus:border-accent focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setBanModal({ open: false, user: null })}
              className="px-4 py-2 rounded-xl bg-white/5 text-white/70 hover:bg-white/10 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleBan}
              disabled={actionLoading}
              className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <Ban size={16} />}
              Confirm Ban
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// Artists Tab Component
const ArtistsTab = () => {
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [banModal, setBanModal] = useState({ open: false, artist: null });
  const [banForm, setBanForm] = useState({ reason: '', expiresAt: '' });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchArtists = useCallback(async () => {
    setLoading(true);
    try {
      const res = await MusicAPI.getAdminArtists({ search });
      setArtists(res.data.artists || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch artists');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchArtists();
  }, [fetchArtists]);

  const handleBan = async () => {
    if (!banModal.artist) return;
    setActionLoading(true);
    try {
      await MusicAPI.banArtist({
        artistId: banModal.artist.artistId,
        reason: banForm.reason,
        expiresAt: banForm.expiresAt || null
      });
      setBanModal({ open: false, artist: null });
      setBanForm({ reason: '', expiresAt: '' });
      fetchArtists();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to ban artist');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <h2 className="text-xl font-bold text-white">Manage Artists</h2>
        <div className="w-full sm:w-72">
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search artists..."
          />
        </div>
      </div>

      <DataTable
        columns={['Artist', 'Albums', 'Tracks', 'Status', 'Actions']}
        data={artists}
        loading={loading}
        error={error}
        emptyMessage="No artists found"
        renderRow={(artist) => (
          <tr key={artist.artistId} className="hover:bg-white/5 transition-colors">
            <td className="px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <Mic2 size={16} className="text-purple-400" />
                </div>
                <span className="font-medium text-white">{artist.stage_name}</span>
              </div>
            </td>
            <td className="px-4 py-3 text-white/60">{artist.album_count}</td>
            <td className="px-4 py-3 text-white/60">{artist.track_count}</td>
            <td className="px-4 py-3">
              <StatusBadge status={artist.is_banned ? 'banned' : 'active'} />
            </td>
            <td className="px-4 py-3">
              <button
                onClick={() => setBanModal({ open: true, artist })}
                className="px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 text-sm font-medium hover:bg-amber-500/20 transition-all flex items-center gap-1.5"
              >
                <Ban size={14} />
                Ban
              </button>
            </td>
          </tr>
        )}
      />

      <Modal
        isOpen={banModal.open}
        onClose={() => setBanModal({ open: false, artist: null })}
        title={`Ban ${banModal.artist?.stage_name}?`}
      >
        <p className="text-white/60 text-sm mb-4">
          This will prevent the artist from uploading new music.
        </p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Reason</label>
            <input
              type="text"
              value={banForm.reason}
              onChange={(e) => setBanForm(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="Enter ban reason..."
              className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-accent focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Expires At (optional)</label>
            <input
              type="datetime-local"
              value={banForm.expiresAt}
              onChange={(e) => setBanForm(prev => ({ ...prev, expiresAt: e.target.value }))}
              className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/10 text-white focus:border-accent focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setBanModal({ open: false, artist: null })}
              className="px-4 py-2 rounded-xl bg-white/5 text-white/70 hover:bg-white/10 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleBan}
              disabled={actionLoading}
              className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <Ban size={16} />}
              Confirm Ban
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// Reports Tab Component
const ReportsTab = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await MusicAPI.getAdminReports();
      setReports(res.data.reports || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleUpdateStatus = async (reportId, status) => {
    try {
      await MusicAPI.updateAdminReportStatus(reportId, status);
      fetchReports();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update report');
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white">Manage Reports</h2>

      <DataTable
        columns={['Artist', 'Reporter', 'Category', 'Status', 'Actions']}
        data={reports}
        loading={loading}
        error={error}
        emptyMessage="No reports found"
        renderRow={(report) => (
          <tr key={report.id} className="hover:bg-white/5 transition-colors">
            <td className="px-4 py-3 text-white">{report.stage_name || `ID: ${report.artist_id}`}</td>
            <td className="px-4 py-3 text-white/60">{report.reporter_username}</td>
            <td className="px-4 py-3 text-white/60">{report.category}</td>
            <td className="px-4 py-3">
              <StatusBadge status={report.status} />
            </td>
            <td className="px-4 py-3">
              <select
                value=""
                onChange={(e) => e.target.value && handleUpdateStatus(report.id, e.target.value)}
                className="h-9 px-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:border-accent focus:outline-none cursor-pointer"
              >
                <option value="" disabled>Update Status</option>
                <option value="pending">Pending</option>
                <option value="reviewed">Reviewed</option>
                <option value="resolved">Resolved</option>
                <option value="dismissed">Dismissed</option>
              </select>
            </td>
          </tr>
        )}
      />
    </div>
  );
};

// Banned Users Tab Component
const BannedUsersTab = () => {
  const [bannedUsers, setBannedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchBannedUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await MusicAPI.getBannedUsers();
      setBannedUsers(res.data.banned_users || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch banned users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBannedUsers();
  }, [fetchBannedUsers]);

  const handleUnban = async (userId) => {
    try {
      await MusicAPI.unbanUser(userId);
      fetchBannedUsers();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to unban user');
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white">Banned Users</h2>

      <DataTable
        columns={['User', 'Reason', 'Banned At', 'Expires', 'Actions']}
        data={bannedUsers}
        loading={loading}
        error={error}
        emptyMessage="No banned users"
        renderRow={(user) => (
          <tr key={user.id} className="hover:bg-white/5 transition-colors">
            <td className="px-4 py-3 text-white font-medium">{user.username}</td>
            <td className="px-4 py-3 text-white/60 max-w-xs truncate">{user.reason || 'No reason given'}</td>
            <td className="px-4 py-3 text-white/60 text-sm">
              <div className="flex items-center gap-1.5">
                <Calendar size={14} />
                {new Date(user.banned_at).toLocaleDateString()}
              </div>
            </td>
            <td className="px-4 py-3 text-white/60 text-sm">
              {user.expires_at ? (
                <div className="flex items-center gap-1.5">
                  <Clock size={14} />
                  {new Date(user.expires_at).toLocaleDateString()}
                </div>
              ) : (
                <span className="text-red-400">Permanent</span>
              )}
            </td>
            <td className="px-4 py-3">
              <button
                onClick={() => handleUnban(user.user_id)}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-sm font-medium hover:bg-emerald-500/20 transition-all flex items-center gap-1.5"
              >
                <RefreshCw size={14} />
                Unban
              </button>
            </td>
          </tr>
        )}
      />
    </div>
  );
};

// Banned Artists Tab Component
const BannedArtistsTab = () => {
  const [bannedArtists, setBannedArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchBannedArtists = useCallback(async () => {
    setLoading(true);
    try {
      const res = await MusicAPI.getBannedArtists();
      setBannedArtists(res.data.banned_artists || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch banned artists');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBannedArtists();
  }, [fetchBannedArtists]);

  const handleUnban = async (artistId) => {
    try {
      await MusicAPI.unbanArtist(artistId);
      fetchBannedArtists();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to unban artist');
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white">Banned Artists</h2>

      <DataTable
        columns={['Artist', 'Reason', 'Banned At', 'Expires', 'Actions']}
        data={bannedArtists}
        loading={loading}
        error={error}
        emptyMessage="No banned artists"
        renderRow={(artist) => (
          <tr key={artist.id} className="hover:bg-white/5 transition-colors">
            <td className="px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <Mic2 size={16} className="text-purple-400" />
                </div>
                <span className="font-medium text-white">{artist.stage_name}</span>
              </div>
            </td>
            <td className="px-4 py-3 text-white/60 max-w-xs truncate">{artist.reason || 'No reason given'}</td>
            <td className="px-4 py-3 text-white/60 text-sm">
              <div className="flex items-center gap-1.5">
                <Calendar size={14} />
                {new Date(artist.banned_at).toLocaleDateString()}
              </div>
            </td>
            <td className="px-4 py-3 text-white/60 text-sm">
              {artist.expires_at ? (
                <div className="flex items-center gap-1.5">
                  <Clock size={14} />
                  {new Date(artist.expires_at).toLocaleDateString()}
                </div>
              ) : (
                <span className="text-red-400">Permanent</span>
              )}
            </td>
            <td className="px-4 py-3">
              <button
                onClick={() => handleUnban(artist.artist_id)}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-sm font-medium hover:bg-emerald-500/20 transition-all flex items-center gap-1.5"
              >
                <RefreshCw size={14} />
                Unban
              </button>
            </td>
          </tr>
        )}
      />
    </div>
  );
};

// Main Admin Dashboard Component
const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('stats');
  const isAdmin = !!(user?.is_admin || user?.isAdmin || user?.role === 'admin');

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
            <ShieldCheck size={40} className="text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Access Denied</h2>
          <p className="text-white/60">You need administrator privileges to view this panel.</p>
        </motion.div>
      </div>
    );
  }

  const tabs = [
    { id: 'stats', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'artists', label: 'Artists', icon: Mic2 },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'banned-users', label: 'Banned Users', icon: UserX },
    { id: 'banned-artists', label: 'Banned Artists', icon: Ban },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'stats': return <StatsTab />;
      case 'users': return <UsersTab />;
      case 'artists': return <ArtistsTab />;
      case 'reports': return <ReportsTab />;
      case 'banned-users': return <BannedUsersTab />;
      case 'banned-artists': return <BannedArtistsTab />;
      default: return <StatsTab />;
    }
  };

  return (
    <div className="min-h-screen pb-32">
      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-red-500/10 via-accent/5 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent/10 via-transparent to-transparent" />

        <div className="relative z-10 px-6 lg:px-8 pt-8 pb-6">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-red-600 flex items-center justify-center shadow-lg">
                  <Shield size={32} className="text-white" />
                </div>
                <div>
                  <p className="text-sm uppercase tracking-wider text-white/50 font-medium">Control Center</p>
                  <h1 className="text-3xl md:text-4xl font-bold text-white">Admin Dashboard</h1>
                </div>
              </div>
            </motion.div>

            {/* Tab Navigation */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {tabs.map((tab) => (
                <TabButton
                  key={tab.id}
                  active={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  icon={tab.icon}
                  label={tab.label}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-6 lg:px-8 mt-6">
        <div className="max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderTabContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
