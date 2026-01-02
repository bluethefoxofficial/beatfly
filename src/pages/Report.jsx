// src/pages/Report.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ChevronDown, Send } from 'lucide-react';
import MusicAPI from '../services/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

const reportCategories = [
  'Copyright',
  'Inappropriate Content',
  'Spam',
  'Harassment',
  'Impersonation',
  'Fraud',
  'Other',
];

const Report = () => {
  const { artistId } = useParams();
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!category) {
      setError('Please select a category.');
      return;
    }

    if (!description) {
      setError('Please provide a description of the issue.');
      return;
    }

    setLoading(true);
    try {
      const reportData = {
        artistID: parseInt(artistId, 10),
        category,
        description,
      };
      
      const res = await MusicAPI.reportArtist(reportData);
      setSuccess(res.data.message || 'Your report has been submitted successfully.');
      setDescription('');
      setCategory('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit report.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full bg-background">
      <header className="relative h-60 flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-b from-red-500/30 to-background" />
        <div className="relative z-10 text-center p-4">
          <AlertTriangle size={48} className="text-red-400 mb-4 inline-block" />
          <h1 className="text-4xl font-bold text-white mb-2">Report Artist</h1>
          <p className="text-white/60 max-w-md mx-auto">
            Help us keep BeatFly safe. Please provide accurate information in your report.
          </p>
        </div>
      </header>

      <div className="px-4 py-8 sm:py-10 max-w-xl mx-auto bg-surface-light rounded-lg shadow-lg mt-6">
        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded">
            <p className="text-red-400">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-500/10 border border-green-500/20 rounded">
            <p className="text-green-400">{success}</p>
          </div>
        )}

        <form onSubmit={handleReportSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-white/80">
              Report Category
            </label>
            <Select onValueChange={setCategory} value={category}>
                <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                    {reportCategories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-2 text-white/80">
              Description
            </label>
            <textarea
              id="description"
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a detailed description of the issue..."
              required
              className="w-full px-4 py-3 rounded-lg bg-surface border border-white/10 text-white placeholder-white/40 focus:border-accent"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:flex-1 px-8 h-12 bg-red-500 rounded-full text-white font-medium hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <motion.div
                  className="w-6 h-6 border-2 border-t-transparent border-white rounded-full animate-spin"
                  initial={{ rotate: 0 }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
              ) : (
                <>
                  <Send size={20} /> Submit Report
                </>
              )}
            </button>
            <Link to={artistId ? `/artist/${artistId}`: '/'} className="text-sm text-gray-400 hover:underline">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Report;