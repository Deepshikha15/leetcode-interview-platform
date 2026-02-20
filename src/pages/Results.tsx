import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ScoreResult } from '../utils/scoring';
import { useAuth } from '../context/AuthContext';

type Difficulty = 'Easy' | 'Medium' | 'Hard';
type Language = 'javascript' | 'python';
type LearningPath = 'quick-review';

interface ResultsRouteState {
    scoreResult?: ScoreResult;
    problemId?: number | string;
    problemTitle?: string;
    difficulty?: Difficulty;
    language?: Language;
    passedTests?: number;
    totalTests?: number;
    questionContent?: string;
    questionHints?: string[];
    questionTopicTags?: { name: string; slug: string }[];
}



const learningJourneys: {
    id: LearningPath;
    label: string;
    description: string;
}[] = [
        {
            id: 'quick-review',
            label: 'Quick Review (5 min)',
            description: 'See optimal solution + key insights'
        }
    ];

const getLearningSummary = (scoreOutOf5: number): string => {
    if (scoreOutOf5 >= 5) return 'Excellent and interview-ready';
    if (scoreOutOf5 === 4) return 'Strong solution with minor optimization opportunities';
    if (scoreOutOf5 === 3) return 'Solid foundation with room to optimize';
    if (scoreOutOf5 === 2) return 'Functional but not optimal';
    return 'Needs a fundamentals refresh';
};

const Results: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout } = useAuth();
    const routeState = (location.state ?? {}) as ResultsRouteState;
    const scoreResult = routeState.scoreResult;
    const [showLearningSelection, setShowLearningSelection] = useState(false);
    const [selectedJourney, setSelectedJourney] = useState<LearningPath | null>(null);

    const handleLogout = () => {
        logout();
        navigate('/login', { replace: true });
    };

    if (!scoreResult) {
        return (
            <div className="results-container" style={{ textAlign: 'center', paddingTop: '100px' }}>
                <h2>No results available</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                    Complete an interview to see your results.
                </p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button className="btn btn-primary btn-large" onClick={() => navigate('/')}>
                        Start Interview
                    </button>
                    <button className="btn btn-secondary btn-large" onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </div>
        );
    }

    const getGradeColor = (grade: string) => {
        if (grade.startsWith('A')) return 'var(--success)';
        if (grade.startsWith('B')) return 'var(--accent-primary)';
        if (grade.startsWith('C')) return 'var(--warning)';
        return 'var(--error)';
    };

    const problemTitle = routeState.problemTitle ?? 'Current Problem';
    const learningScoreOutOf5 = Math.max(1, Math.min(5, Math.round(scoreResult.percentage / 20)));
    const learningSummary = getLearningSummary(learningScoreOutOf5);

    const handleContinueToNext = () => {
        navigate('/interview', {
            state: {
                difficulty: routeState.difficulty ?? 'Medium',
                language: routeState.language ?? 'javascript'
            }
        });
    };




    const handleJourneySelection = (journeyId: LearningPath) => {
        setSelectedJourney(prev => (prev === journeyId ? null : journeyId));
    };

    const handleConfirmJourney = () => {
        if (!selectedJourney) return;

        navigate('/review', {
            state: {
                ...routeState,
                problemTitle,
                scoreOutOf5: learningScoreOutOf5,
                learningSummary
            }
        });
    };

    return (
        <div className="results-container">
            <div className="results-header animate-fade-in">
                <div
                    className="results-grade"
                    style={{ background: getGradeColor(scoreResult.grade) }}
                >
                    {scoreResult.grade}
                </div>
                <div className="results-score">
                    {scoreResult.total} / {scoreResult.maxTotal} points
                </div>
                <div className="results-verdict">{scoreResult.verdict}</div>
            </div>

            <h3 style={{ marginBottom: '24px', fontSize: '18px' }}>Score Breakdown</h3>

            <div className="score-breakdown">
                {scoreResult.feedback.map((item, index) => (
                    <div
                        key={item.section}
                        className="score-card animate-fade-in"
                        style={{ animationDelay: `${index * 100}ms` }}
                    >
                        <div className="score-card-header">
                            <span className="score-card-title">{item.section}</span>
                            <span className="score-card-points">
                                {item.score}<span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>/{item.maxScore}</span>
                            </span>
                        </div>
                        <div className="score-bar">
                            <div
                                className="score-bar-fill"
                                style={{ width: `${(item.score / item.maxScore) * 100}%` }}
                            />
                        </div>
                        <div style={{ marginTop: '12px' }}>
                            {item.comments.map((comment, i) => (
                                <div
                                    key={i}
                                    style={{
                                        fontSize: '12px',
                                        color: comment.startsWith('✓') ? 'var(--success)' :
                                            comment.startsWith('✗') ? 'var(--error)' :
                                                'var(--text-secondary)',
                                        marginBottom: '4px'
                                    }}
                                >
                                    {comment}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="performance-summary" style={{
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-lg)',
                padding: '24px',
                marginBottom: '32px',
                border: '1px solid rgba(255,255,255,0.1)'
            }}>
                <h4 style={{ marginBottom: '16px' }}>📊 Performance Summary</h4>
                <div className="performance-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '16px' }}>
                    <div>
                        <div style={{ fontSize: '32px', fontWeight: '700', color: 'var(--accent-primary)' }}>
                            {scoreResult.percentage}%
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Overall Score</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '32px', fontWeight: '700', color: 'var(--success)' }}>
                            {scoreResult.codeQuality}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Code Quality</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '32px', fontWeight: '700', color: 'var(--warning)' }}>
                            {scoreResult.communication}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Communication</div>
                    </div>
                </div>
            </div>

            <div className="results-primary-actions">
                <button className="btn btn-primary btn-large" onClick={handleContinueToNext}>
                    Continue to Next
                </button>
                <button
                    className="btn btn-secondary btn-large"
                    onClick={() => {
                        setShowLearningSelection(prev => !prev);
                    }}
                >
                    {showLearningSelection ? 'Hide Learning Paths' : 'Learn from This Problem'}
                </button>
            </div>

            {showLearningSelection && (
                <div className="learning-path-card animate-fade-in">
                    <h4 className="learning-path-title">Learning Path Selection</h4>
                    <div className="learning-path-problem">Problem: {problemTitle}</div>
                    <div className="learning-path-score">
                        Your Score: {learningScoreOutOf5}/5 ({learningSummary})
                    </div>
                    <div className="learning-path-subtitle">Choose your learning journey:</div>
                    <div className="learning-path-options">
                        {/* Simplified for a single option */}
                        <label
                            key="quick-review"
                            className={`learning-path-option ${selectedJourney === 'quick-review' ? 'selected' : ''}`}
                        >
                            <input
                                type="checkbox"
                                checked={selectedJourney === 'quick-review'}
                                onChange={() => handleJourneySelection('quick-review')}
                            />
                            <div className="learning-path-option-content">
                                <span className="learning-path-option-label">Quick Review (5 min)</span>
                                <span className="learning-path-option-description">See optimal solution + key insights</span>
                            </div>
                        </label>
                    </div>
                    <div className="learning-path-actions">
                        <button
                            className="btn btn-primary"
                            onClick={handleConfirmJourney}
                            disabled={!selectedJourney}
                        >
                            Start Learning Path
                        </button>
                    </div>
                </div>
            )}

            <div className="results-actions">
                <button className="btn btn-secondary btn-large" onClick={handleLogout}>
                    Logout
                </button>
                <button className="btn btn-secondary btn-large" onClick={() => navigate('/')}>
                    🏠 Back Home
                </button>
            </div>
        </div >
    );
};

export default Results;
