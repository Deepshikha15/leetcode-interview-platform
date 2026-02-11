import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ForgotPassword: React.FC = () => {
    const navigate = useNavigate();
    const { resetPassword } = useAuth();
    const [email, setEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setErrorMessage('');
        setSuccessMessage('');

        if (newPassword !== confirmPassword) {
            setErrorMessage('Passwords do not match.');
            return;
        }

        const result = resetPassword(email, newPassword);
        if (!result.success) {
            setErrorMessage(result.message ?? 'Unable to reset password.');
            return;
        }

        setSuccessMessage(result.message ?? 'Password reset successful. Please sign in.');
        setNewPassword('');
        setConfirmPassword('');
    };

    return (
        <div className="auth-page">
            <div className="auth-card animate-fade-in">
                <h1 className="auth-title">Forgot Password</h1>
                <p className="auth-subtitle">Set a new password for your existing account.</p>

                <form className="auth-form" onSubmit={handleSubmit}>
                    <label className="auth-label" htmlFor="forgot-email">Email</label>
                    <input
                        id="forgot-email"
                        className="auth-input"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        autoComplete="email"
                        required
                    />

                    <label className="auth-label" htmlFor="forgot-password">New Password</label>
                    <input
                        id="forgot-password"
                        className="auth-input"
                        type="password"
                        value={newPassword}
                        onChange={(event) => setNewPassword(event.target.value)}
                        autoComplete="new-password"
                        required
                    />

                    <label className="auth-label" htmlFor="forgot-confirm-password">Confirm New Password</label>
                    <input
                        id="forgot-confirm-password"
                        className="auth-input"
                        type="password"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        autoComplete="new-password"
                        required
                    />

                    {errorMessage && <div className="auth-error">{errorMessage}</div>}
                    {successMessage && <div className="auth-success">{successMessage}</div>}

                    <button type="submit" className="btn btn-primary btn-large auth-submit">
                        Reset Password
                    </button>
                </form>

                <p className="auth-switch">
                    Remembered your password?
                    <button
                        type="button"
                        className="auth-link-btn"
                        onClick={() => navigate('/login')}
                    >
                        Sign in
                    </button>
                </p>
            </div>
        </div>
    );
};

export default ForgotPassword;
