import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register: React.FC = () => {
    const navigate = useNavigate();
    const { register } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setErrorMessage('');

        if (password !== confirmPassword) {
            setErrorMessage('Passwords do not match.');
            return;
        }

        const result = register(email, password);
        if (!result.success) {
            setErrorMessage(result.message ?? 'Unable to create account.');
            return;
        }

        navigate('/', { replace: true });
    };

    return (
        <div className="auth-page">
            <div className="auth-card animate-fade-in">
                <h1 className="auth-title">Create Account</h1>
                <p className="auth-subtitle">Start practicing with your personalized interview journey.</p>

                <form className="auth-form" onSubmit={handleSubmit}>
                    <label className="auth-label" htmlFor="register-email">Email</label>
                    <input
                        id="register-email"
                        className="auth-input"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        autoComplete="email"
                        required
                    />

                    <label className="auth-label" htmlFor="register-password">Password</label>
                    <input
                        id="register-password"
                        className="auth-input"
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        autoComplete="new-password"
                        required
                    />

                    <label className="auth-label" htmlFor="register-confirm-password">Confirm Password</label>
                    <input
                        id="register-confirm-password"
                        className="auth-input"
                        type="password"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        autoComplete="new-password"
                        required
                    />

                    {errorMessage && <div className="auth-error">{errorMessage}</div>}

                    <button type="submit" className="btn btn-primary btn-large auth-submit">
                        Create Account
                    </button>
                </form>

                <p className="auth-switch">
                    Already have an account?
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

export default Register;
