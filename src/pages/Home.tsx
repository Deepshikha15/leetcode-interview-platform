import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

type Difficulty = 'Easy' | 'Medium' | 'Hard';
type Language = 'javascript' | 'python';

const Home: React.FC = () => {
    const navigate = useNavigate();
    const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('Medium');
    const [selectedLanguage, setSelectedLanguage] = useState<Language>('javascript');

    const difficulties: { value: Difficulty; label: string; icon: string; desc: string }[] = [
        { value: 'Easy', label: 'Easy', icon: '🌱', desc: 'Warm up questions' },
        { value: 'Medium', label: 'Medium', icon: '⚡', desc: 'Interview level' },
        { value: 'Hard', label: 'Hard', icon: '🔥', desc: 'Challenge yourself' }
    ];

    const languages: { value: Language; label: string; icon: string }[] = [
        { value: 'javascript', label: 'JavaScript', icon: '📜' },
        { value: 'python', label: 'Python', icon: '🐍' }
    ];

    const handleStart = () => {
        navigate('/interview', {
            state: {
                difficulty: selectedDifficulty,
                language: selectedLanguage
            }
        });
    };

    return (
        <div className="home-container">
            <div className="home-logo">💻</div>
            <h1 className="home-title">
                <span className="gradient-text">LeetCode Interview Pro</span>
            </h1>
            <p className="home-subtitle">
                Practice coding interviews with AI-powered feedback, speech interaction,
                and comprehensive scoring. Experience a realistic 1-hour mock interview.
            </p>

            <div style={{ marginBottom: '32px' }}>
                <h3 style={{ marginBottom: '16px', color: 'var(--text-secondary)', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Select Difficulty
                </h3>
                <div className="home-options">
                    {difficulties.map(diff => (
                        <div
                            key={diff.value}
                            className={`option-card ${selectedDifficulty === diff.value ? 'selected' : ''}`}
                            onClick={() => setSelectedDifficulty(diff.value)}
                        >
                            <div className="option-icon">{diff.icon}</div>
                            <div className="option-title">{diff.label}</div>
                            <div className="option-desc">{diff.desc}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ marginBottom: '48px' }}>
                <h3 style={{ marginBottom: '16px', color: 'var(--text-secondary)', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Select Language
                </h3>
                <div className="home-options" style={{ justifyContent: 'center' }}>
                    {languages.map(lang => (
                        <div
                            key={lang.value}
                            className={`option-card ${selectedLanguage === lang.value ? 'selected' : ''}`}
                            onClick={() => setSelectedLanguage(lang.value)}
                            style={{ width: '160px' }}
                        >
                            <div className="option-icon">{lang.icon}</div>
                            <div className="option-title">{lang.label}</div>
                        </div>
                    ))}
                </div>
            </div>

            <button className="start-btn" onClick={handleStart}>
                🚀 Start Interview
            </button>

            <div className="home-stats" style={{ marginTop: '48px', display: 'flex', gap: '32px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--accent-primary)' }}>60 min</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Interview Duration</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--accent-primary)' }}>5</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Scoring Categories</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--accent-primary)' }}>🎤</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Voice Enabled</div>
                </div>
            </div>
        </div>
    );
};

export default Home;
