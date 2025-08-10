import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Navbar from './Navbar';
import Footer from './Footer';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';

// Lazy load components
const BookForm = lazy(() => import('./BookForm'));
const BookList = lazy(() => import('./BookList'));
const BookDetail = lazy(() => import('./BookDetail'));
const TrackingManager = lazy(() => import('./TrackingManager'));
const Terms = lazy(() => import('./components/Terms'));
const Policy = lazy(() => import('./components/Policy'));
const Landing = lazy(() => import('./Landing'));
const SignIn = lazy(() => import('./components/auth/SignIn'));
const SignUp = lazy(() => import('./components/auth/SignUp'));
const ForgotPassword = lazy(() => import('./components/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./components/auth/ResetPassword'));
const MyBooks = lazy(() => import('./components/MyBooks'));
const Home = lazy(() => import('./components/Home'));
const Profile = lazy(() => import('./components/auth/Profile'));
const Users = lazy(() => import('./components/admin/Users'));
const CategoryManager = lazy(() => import('./components/admin/CategoryManager'));
import { useEffect, useState } from 'react';
import { getActiveTrackingCodes, getTrackingCodeSnippet } from './services/trackingService';

function App() {
  const [headCodes, setHeadCodes] = useState('');
  const [bodyStartCodes, setBodyStartCodes] = useState('');
  const [bodyEndCodes, setBodyEndCodes] = useState('');

  useEffect(() => {
    const loadTrackingCodes = async () => {
      try {
        const [head, bodyStart, bodyEnd] = await Promise.all([
          getActiveTrackingCodes('head'),
          getActiveTrackingCodes('body-start'),
          getActiveTrackingCodes('body-end')
        ]);

        setHeadCodes(getTrackingCodeSnippet(head));
        setBodyStartCodes(getTrackingCodeSnippet(bodyStart));
        setBodyEndCodes(getTrackingCodeSnippet(bodyEnd));

        console.log( bodyStartCodes )
      } catch (error) {
        console.error('Error loading tracking codes:', error);
      }
    };

    loadTrackingCodes();
  }, []);

  return (
    <>
      {headCodes && (
        <div id="head-codes" dangerouslySetInnerHTML={{ __html: headCodes }} />
      )}
      <AuthProvider>
        <Router>
          {bodyStartCodes && (
            <div id="body-start-code" dangerouslySetInnerHTML={{ __html: bodyStartCodes }} />
          )}
          <div className="App">
            <Navbar />
            <div>
              <Suspense fallback={<div className="center-align" style={{ padding: '20px' }}>Loading...</div>} >
                <Routes>
                {/* Public routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<SignIn />} />
                <Route path="/register" element={<SignUp />} />
                <Route path="/register" element={<SignUp />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />
                {/* Protected routes */}
                <Route
                  path="/my-books"
                  element={
                    <PrivateRoute>
                      <MyBooks />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/add"
                  element={
                    <PrivateRoute>
                      <BookForm />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/edit/:id"
                  element={
                    <PrivateRoute>
                      <BookForm />
                    </PrivateRoute>
                  }
                />
                <Route path="/books" element={<BookList />} />
                <Route path="/book/:slug" element={<BookDetail />} />
                <Route path="/landing/:slug?" element={<Landing />} />
                <Route
                  path="/tracking-codes"
                  element={
                    <PrivateRoute>
                      <TrackingManager />
                    </PrivateRoute>
                  }
                />
                <Route path="/terms" element={<Terms />} />
                <Route path="/policy" element={<Policy />} />
                <Route
                  path="/profile"
                  element={
                    <PrivateRoute>
                      <Profile />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/users"
                  element={
                    <PrivateRoute>
                      <Users />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/categories"
                  element={
                    <PrivateRoute>
                      <CategoryManager />
                    </PrivateRoute>
                  }
                />
              </Routes>
              </Suspense>
            </div>
            <Footer />
          </div>
          {/* .App */}
          {bodyEndCodes && (
            <div id="body-end-codes" dangerouslySetInnerHTML={{ __html: bodyEndCodes }} />
          )}
        </Router>
      </AuthProvider>
    </>
  );
}

export default App;