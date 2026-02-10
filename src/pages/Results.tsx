import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ScoreResult } from '../utils/scoring';

const Results: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const scoreResult = location.state?.scoreResult as ScoreResult | undefined;

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

            <div className="results-actions">
                <button className="btn btn-secondary btn-large" onClick={() => navigate('/')}>
                    🏠 Back Home
                </button>
                <button className="btn btn-primary btn-large" onClick={() => navigate('/')}>
                    🔄 Try Again
                </button>
            </div>
        </div>
    );
};

export default Results;
