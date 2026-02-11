import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface LoginLocationState {
    from?: string;
}

const Login: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const from = ((location.state as LoginLocationState | null)?.from ?? '/') || '/';

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setErrorMessage('');

        const result = login(email, password);
        if (!result.success) {
            setErrorMessage(result.message ?? 'Unable to sign in.');
            return;
        }

        navigate(from, { replace: true });
    };

    return (
        <div className="auth-page">
            <div className="auth-card animate-fade-in">
                <h1 className="auth-title">Welcome Back</h1>
                <p className="auth-subtitle">Sign in to continue your interview practice.</p>

                <form className="auth-form" onSubmit={handleSubmit}>
                    <label className="auth-label" htmlFor="login-email">Email</label>
                    <input
                        id="login-email"
                        className="auth-input"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        autoComplete="email"
                        required
                    />

                    <label className="auth-label" htmlFor="login-password">Password</label>
                    <input
                        id="login-password"
                        className="auth-input"
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        autoComplete="current-password"
                        required
                    />

                    {errorMessage && <div className="auth-error">{errorMessage}</div>}

                    <button type="submit" className="btn btn-primary btn-large auth-submit">
                        Sign In
                    </button>
                </form>

                <p className="auth-switch">
                    Don&apos;t have an account?
                    <button
                        type="button"
                        className="auth-link-btn"
                        onClick={() => navigate('/register')}
                    >
                        Create one
                    </button>
                </p>
            </div>
        </div>
    );
};

export default Login;
