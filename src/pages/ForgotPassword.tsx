import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ForgotPassword: React.FC = () => {
    const navigate = useNavigate();
    const { resetPassword } = useAuth();
    const [email, setEmail] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setErrorMessage('');
        setSuccessMessage('');
        setIsLoading(true);

        try {
            const result = await resetPassword(email);
            if (!result.success) {
                setErrorMessage(result.message ?? 'Unable to send reset link.');
                setIsLoading(false);
                return;
            }

            setSuccessMessage(result.message ?? 'Password reset link sent to your email.');
            setIsLoading(false);
        } catch (error) {
            setErrorMessage('An unexpected error occurred.');
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card animate-fade-in">
                <h1 className="auth-title">Forgot Password</h1>
                <p className="auth-subtitle">Enter your email to receive a password reset link.</p>

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

                    {errorMessage && <div className="auth-error">{errorMessage}</div>}
                    {successMessage && <div className="auth-success">{successMessage}</div>}

                    <button
                        type="submit"
                        className="btn btn-primary btn-large auth-submit"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Sending...' : 'Send Reset Link'}
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
