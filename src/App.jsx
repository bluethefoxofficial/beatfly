import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AudioProvider } from './contexts/AudioContext';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/auth/PrivateRoute';
import MainLayout from './components/layout/MainLayout';
import PageLoader from './components/shared/PageLoader';
import ErrorBoundary from './components/shared/ErrorBoundary';

// Lazy-loaded pages to keep the initial bundle lean
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));
const Home = lazy(() => import('./pages/Home'));
const Search = lazy(() => import('./pages/Search'));
const Library = lazy(() => import('./pages/Library'));
const LikedSongs = lazy(() => import('./pages/LikedSongs'));
const Recent = lazy(() => import('./pages/Recent'));
const PlaylistDetail = lazy(() => import('./pages/PlaylistDetail'));
const CreatePlaylist = lazy(() => import('./pages/CreatePlaylist'));
const AlbumDetail = lazy(() => import('./pages/AlbumDetail'));
const AlbumEditor = lazy(() => import('./pages/AlbumEditor'));
const Track = lazy(() => import('./pages/Track'));
const Profile = lazy(() => import('./pages/Profile'));
const ArtistDashboard = lazy(() => import('./pages/ArtistDashboard'));
const Report = lazy(() => import('./pages/Report'));
const YearInReview = lazy(() => import('./pages/YearInReview'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Settings = lazy(() => import('./pages/Settings'));
const MyReports = lazy(() => import('./pages/MyReports'));


const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AudioProvider>
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/register" element={<Register />} />

                {/* Protected Routes using a layout with an Outlet */}
                <Route
                  element={
                    <PrivateRoute>
                      <MainLayout />
                    </PrivateRoute>
                  }
                >
                  {/* Main Navigation */}
                  <Route index element={<Home />} />
                  <Route path="search" element={<Search />} />
                  <Route path="library" element={<Library />} />
                  <Route path="liked-songs" element={<LikedSongs />} />
                  <Route path="recent" element={<Recent />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="my-reports" element={<MyReports />} />

                  {/* Content Details */}
                  <Route path="playlist/:id" element={<PlaylistDetail />} />
                  <Route path="album/:albumId" element={<AlbumDetail />} />
                  <Route path="track/:trackId" element={<Track />} />
                  <Route path="profile/:userId" element={<Profile />} />
                  <Route path="report/:artistId" element={<Report />} />
                  <Route path="year-in-review" element={<YearInReview />} />
                  <Route path="/admin" element={<AdminDashboard />} />

                  {/* Creation/Management */}
                  <Route path="create-playlist" element={<CreatePlaylist />} />
                  <Route path="playlist/:id/edit" element={<CreatePlaylist />} />

                  {/* Artist Management */}
                  <Route path="/artist/dashboard" element={<ArtistDashboard />} />
                  <Route path="/artist/album/:albumId/edit" element={<AlbumEditor />} />
                </Route>

                {/* Catch-all redirect */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </AudioProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
