import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Interview from './pages/Interview';
import Results from './pages/Results';
import Review from './pages/Review';
import Backlog from './pages/Backlog';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';
import PublicOnlyRoute from './components/PublicOnlyRoute';

const App: React.FC = () => {
    return (
        <Routes>
            <Route
                path="/login"
                element={(
                    <PublicOnlyRoute>
                        <Login />
                    </PublicOnlyRoute>
                )}
            />
            <Route
                path="/register"
                element={(
                    <PublicOnlyRoute>
                        <Register />
                    </PublicOnlyRoute>
                )}
            />
            <Route
                path="/"
                element={(
                    <ProtectedRoute>
                        <Home />
                    </ProtectedRoute>
                )}
            />
            <Route
                path="/interview"
                element={(
                    <ProtectedRoute>
                        <Interview />
                    </ProtectedRoute>
                )}
            />
            <Route
                path="/results"
                element={(
                    <ProtectedRoute>
                        <Results />
                    </ProtectedRoute>
                )}
            />
            <Route
                path="/review"
                element={(
                    <ProtectedRoute>
                        <Review />
                    </ProtectedRoute>
                )}
            />
            <Route
                path="/backlog"
                element={(
                    <ProtectedRoute>
                        <Backlog />
                    </ProtectedRoute>
                )}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

export default App;
