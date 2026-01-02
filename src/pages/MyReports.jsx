// src/pages/MyReports.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MusicAPI from '../services/api';
import { FileText, ChevronLeft } from 'lucide-react';

const MyReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const response = await MusicAPI.getMyReports();
        setReports(response.data.reports);
      } catch (err) {
        setError('Failed to load reports.');
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  return (
    <div className="page-shell py-10 space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/settings" className="p-2 rounded-full hover:bg-white/10">
          <ChevronLeft size={24} />
        </Link>
        <h1 className="text-3xl font-bold">My Reports</h1>
      </div>

      {loading && <p className="text-white/70">Loading your reports...</p>}
      {error && <p className="text-red-400">{error}</p>}
      
      {!loading && !error && (
        <div className="glass-card rounded-2xl p-6 border border-white/10">
          {reports.length === 0 ? (
            <p className="text-white/60 text-center py-8">You haven't submitted any reports.</p>
          ) : (
            <div className="space-y-4">
              {reports.map(report => (
                <div key={report.id} className="p-4 rounded-xl bg-white/5 border border-white/10 flex justify-between items-center">
                  <div>
                    <p className="font-semibold">Report against: <span className="text-accent">{report.stage_name}</span></p>
                    <p className="text-sm text-white/70">Category: {report.category}</p>
                    <p className="text-xs text-white/50 mt-1">Submitted: {new Date(report.created_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                      report.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' :
                      report.status === 'resolved' ? 'bg-green-500/20 text-green-300' :
                      report.status === 'dismissed' ? 'bg-gray-500/20 text-gray-300' :
                      'bg-blue-500/20 text-blue-300'
                    }`}>
                      {report.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MyReports;
