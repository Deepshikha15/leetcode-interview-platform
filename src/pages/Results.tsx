import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ScoreResult } from '../utils/scoring';

type Difficulty = 'Easy' | 'Medium' | 'Hard';
type Language = 'javascript' | 'python';
type LearningPath = 'quick-review' | 'skip';

interface ResultsRouteState {
    scoreResult?: ScoreResult;
    problemId?: number;
    problemTitle?: string;
    difficulty?: Difficulty;
    language?: Language;
    passedTests?: number;
    totalTests?: number;
}

interface LearningBacklogItem {
    problemId: number | null;
    problemTitle: string;
    scoreOutOf5: number;
    summary: string;
    savedAt: string;
}

const LEARNING_BACKLOG_KEY = 'leetcodepro.learningBacklog';

const learningJourneys: {
    id: LearningPath;
    label: string;
    description: string;
}[] = [
        {
            id: 'quick-review',
            label: 'Quick Review (5 min)',
            description: 'See optimal solution + key insights'
        },
        {
            id: 'skip',
            label: 'Skip for now',
            description: 'Save to learning backlog'
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
    const routeState = (location.state ?? {}) as ResultsRouteState;
    const scoreResult = routeState.scoreResult;
    const [showLearningSelection, setShowLearningSelection] = useState(false);
    const [selectedJourney, setSelectedJourney] = useState<LearningPath | null>(null);

    if (!scoreResult) {
        return (
            <div className="results-container" style={{ textAlign: 'center', paddingTop: '100px' }}>
                <h2>No results available</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                    Complete an interview to see your results.
                </p>
                <button className="btn btn-primary btn-large" onClick={() => navigate('/')}>
                    Start Interview
                </button>
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
                language: routeState.language ?? 'javascript',
                previousQuestionId: routeState.problemId
            }
        });
    };

    const handleTryAgain = () => {
        navigate('/interview', {
            state: {
                difficulty: routeState.difficulty ?? 'Medium',
                language: routeState.language ?? 'javascript'
            }
        });
    };

    const saveToBacklog = (): boolean => {
        try {
            const rawValue = localStorage.getItem(LEARNING_BACKLOG_KEY);
            const parsed: unknown = rawValue ? JSON.parse(rawValue) : [];
            const existing: LearningBacklogItem[] = Array.isArray(parsed)
                ? parsed as LearningBacklogItem[]
                : [];

            const deduped = existing.filter(item => item.problemId !== routeState.problemId);
            deduped.push({
                problemId: routeState.problemId ?? null,
                problemTitle,
                scoreOutOf5: learningScoreOutOf5,
                summary: learningSummary,
                savedAt: new Date().toISOString()
            });
            localStorage.setItem(LEARNING_BACKLOG_KEY, JSON.stringify(deduped));
            return true;
        } catch {
            return false;
        }
    };

    const handleJourneySelection = (journeyId: LearningPath) => {
        setSelectedJourney(prev => (prev === journeyId ? null : journeyId));
    };

    const handleConfirmJourney = () => {
        if (!selectedJourney) return;

        if (selectedJourney === 'skip') {
            const didSave = saveToBacklog();
            navigate('/backlog', {
                state: {
                    ...routeState,
                    problemTitle,
                    didSave
                }
            });
            return;
        }

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
                    {routeState.totalTests !== undefined && routeState.totalTests > 0 && (
                        <div className="learning-path-tests">
                            Tests Passed: {routeState.passedTests ?? 0}/{routeState.totalTests}
                        </div>
                    )}
                    <div className="learning-path-subtitle">Choose your learning journey:</div>
                    <div className="learning-path-options">
                        {learningJourneys.map((journey) => (
                            <label
                                key={journey.id}
                                className={`learning-path-option ${selectedJourney === journey.id ? 'selected' : ''}`}
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedJourney === journey.id}
                                    onChange={() => handleJourneySelection(journey.id)}
                                />
                                <div className="learning-path-option-content">
                                    <span className="learning-path-option-label">{journey.label}</span>
                                    <span className="learning-path-option-description">{journey.description}</span>
                                </div>
                            </label>
                        ))}
                    </div>
                    <div className="learning-path-actions">
                        <button
                            className="btn btn-primary"
                            onClick={handleConfirmJourney}
                            disabled={!selectedJourney}
                        >
                            {selectedJourney === 'skip' ? 'Save to Backlog' : 'Start Learning Path'}
                        </button>
                    </div>
                </div>
            )}

            <div className="results-actions">
                <button className="btn btn-secondary btn-large" onClick={() => navigate('/')}>
                    🏠 Back Home
                </button>
                <button className="btn btn-primary btn-large" onClick={handleTryAgain}>
                    🔄 Try Again
                </button>
            </div>
        </div>
    );
};

export default Results;
