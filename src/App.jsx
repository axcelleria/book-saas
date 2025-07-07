// import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Navbar from './Navbar';
import BookForm from './BookForm';
import BookList from './BookList';
import BookDetail from './BookDetail';
import TrackingManager from './TrackingManager';
import Terms from './components/Terms';
import Landing from './Landing';
import SignIn from './components/auth/SignIn';
import SignUp from './components/auth/SignUp';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';
import MyBooks from './components/MyBooks';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Home from './components/Home';
import Profile from './components/auth/Profile';
import Users from './components/admin/Users';
import CategoryManager from './components/admin/CategoryManager';
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
            </div>
          </div>
          {bodyEndCodes && (
            <div id="body-end-codes" dangerouslySetInnerHTML={{ __html: bodyEndCodes }} />
          )}
        </Router>
      </AuthProvider>
    </>
  );
}

export default App;