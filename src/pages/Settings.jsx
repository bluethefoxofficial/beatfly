import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Switch } from '../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Input } from '../components/ui/input';
import {
  LogOut,
  Mail,
  ShieldCheck,
  Settings as SettingsIcon,
  User,
  Paintbrush,
  Play,
  Share2,
  Globe,
  EyeOff,
  FileText,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import MusicAPI from '../services/api';
import { Link } from 'react-router-dom';

const PreferenceRow = ({ title, description, icon: Icon, control, to }) => {
    const content = (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl border border-white/10 bg-white/5 hover:border-white/20 transition-colors">
            <div className="flex items-start gap-3">
            {Icon && (
                <div className="mt-1 p-2 rounded-lg bg-white/5 border border-white/10">
                <Icon size={16} className="text-accent" />
                </div>
            )}
            <div>
                <p className="text-sm font-semibold text-white">{title}</p>
                <p className="text-xs sm:text-sm text-white/60">{description}</p>
            </div>
            </div>
            <div className="sm:pt-0 pt-1">{control}</div>
        </div>
    );

    if (to) {
        return <Link to={to}>{content}</Link>;
    }

    return content;
}

const Settings = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const displayName = user?.username || user?.name || user?.display_name || 'Listener';
  const email = user?.email;
  const roleLabel = user?.role || (user?.is_admin ? 'Admin' : 'Listener');
  const profileId = user?.id || user?.user_id || user?.userId;

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const response = await MusicAPI.getUserSettings();
        setSettings(response.data.settings);
      } catch (err) {
        setError('Failed to load settings.');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSettingChange = async (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    try {
      await MusicAPI.updateUserSettings({ [key]: value });
    } catch (err) {
      setError('Failed to save settings.');
      // Optionally revert state
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const goToProfile = () => {
    if (!profileId) return;
    navigate(`/profile/${profileId}`);
  };

  if (loading) {
    return <div className="p-6 text-white/70">Loading settings...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-400">{error}</div>;
  }

  return (
    <div className="page-shell py-10 space-y-6">
      <div className="glass-card rounded-3xl p-6 md:p-8 border border-white/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-accent/10 via-transparent to-indigo-500/10 pointer-events-none" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-white/60">
              <SettingsIcon size={16} />
              <span>Settings</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">Tune Beatfly to you</h1>
            <p className="text-white/70 max-w-2xl">
              Manage your account, listening preferences, and how Beatfly keeps your sessions feeling personal.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-sm flex items-center gap-2">
                <User size={14} /> {displayName}
              </span>
              {email && (
                <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm flex items-center gap-2">
                  <Mail size={14} /> {email}
                </span>
              )}
              <span className="px-3 py-1 rounded-full bg-accent/15 border border-accent/30 text-sm flex items-center gap-2">
                <ShieldCheck size={14} /> {roleLabel}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={goToProfile}
              disabled={!profileId}
              className="h-10 px-4 rounded-full border border-white/15 bg-white/5 text-white/90 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              View profile
            </button>
            <button
              onClick={handleLogout}
              className="h-10 px-4 rounded-full bg-gradient-to-r from-accent to-accent-light text-white flex items-center gap-2 hover:opacity-90"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        </div>
      </div>
      
      {settings && (
        <div className="space-y-6">
            <div className="glass-card rounded-2xl p-6 border border-white/10 space-y-4">
                <PreferenceRow
                    title="Allow Explicit Content"
                    description="Enable or disable playback of content marked as explicit."
                    icon={EyeOff}
                    control={
                        <Switch
                        checked={!!settings.allow_explicit}
                        onCheckedChange={(val) => handleSettingChange('allow_explicit', val)}
                        />
                    }
                />
                <PreferenceRow
                    title="Autoplay"
                    description="Automatically play similar songs when your music ends."
                    icon={Play}
                    control={
                        <Switch
                        checked={!!settings.autoplay}
                        onCheckedChange={(val) => handleSettingChange('autoplay', val)}
                        />
                    }
                />
                <PreferenceRow
                    title="Share Listening Activity"
                    description="Allow your friends and followers to see what you're listening to."
                    icon={Share2}
                    control={
                        <Switch
                        checked={!!settings.share_activity}
                        onCheckedChange={(val) => handleSettingChange('share_activity', val)}
                        />
                    }
                />
            </div>
            <div className="glass-card rounded-2xl p-6 border border-white/10 space-y-4">
                <PreferenceRow
                    title="Theme"
                    description="Choose how Beatfly looks."
                    icon={Paintbrush}
                    control={
                        <Select
                            value={settings.theme}
                            onValueChange={(val) => handleSettingChange('theme', val)}
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Theme" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="light">Light</SelectItem>
                                <SelectItem value="dark">Dark</SelectItem>
                                <SelectItem value="system">System</SelectItem>
                            </SelectContent>
                        </Select>
                    }
                />
                 <PreferenceRow
                    title="Language"
                    description="Set your preferred language for the interface."
                    icon={Globe}
                    control={
                        <Input
                            className="w-[180px]"
                            value={settings.language}
                            onChange={(e) => handleSettingChange('language', e.target.value)}
                        />
                    }
                />
            </div>
            <div className="glass-card rounded-2xl p-6 border border-white/10 space-y-4">
                <PreferenceRow
                    to="/my-reports"
                    title="My Reports"
                    description="View the status of reports you have submitted."
                    icon={FileText}
                    control={<ChevronRight size={20} />}
                />
            </div>
        </div>
      )}
    </div>
  );
};

export default Settings;