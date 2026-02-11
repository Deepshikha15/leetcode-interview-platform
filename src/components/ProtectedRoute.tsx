import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const location = useLocation();

    if (!isAuthenticated) {
        const from = `${location.pathname}${location.search}${location.hash}`;
        return <Navigate to="/login" replace state={{ from }} />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
