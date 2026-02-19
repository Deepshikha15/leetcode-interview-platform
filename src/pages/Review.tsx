import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ScoreResult } from '../utils/scoring';

type Difficulty = 'Easy' | 'Medium' | 'Hard';
type Language = 'javascript' | 'python';

interface ReviewRouteState {
    scoreResult?: ScoreResult;
    problemId?: number | string;
    problemTitle?: string;
    difficulty?: Difficulty;
    language?: Language;
    passedTests?: number;
    totalTests?: number;
    scoreOutOf5?: number;
    learningSummary?: string;
    questionContent?: string;
    questionHints?: string[];
    questionTopicTags?: { name: string; slug: string }[];
}

const Review: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const routeState = (location.state ?? {}) as ReviewRouteState;

    const problemTitle = routeState.problemTitle ?? 'Problem Review';
    const difficulty = routeState.difficulty ?? 'Medium';
    const hints = routeState.questionHints ?? [];
    const questionContent = routeState.questionContent ?? '';
    const hintsToShow = hints.slice(0, 3);
    const hasReviewContext = Boolean(routeState.problemTitle || routeState.scoreResult || questionContent);

    const resultsState = routeState.scoreResult
        ? {
            scoreResult: routeState.scoreResult,
            problemId: routeState.problemId,
            problemTitle,
            difficulty,
            language: routeState.language ?? 'javascript',
            passedTests: routeState.passedTests,
            totalTests: routeState.totalTests
        }
        : undefined;

    if (!hasReviewContext) {
        return (
            <div className="review-container" style={{ textAlign: 'center', paddingTop: '100px' }}>
                <h2>No review available</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                    Complete an interview and open Quick Review from results.
                </p>
                <button className="btn btn-primary btn-large" onClick={() => navigate('/')}>
                    Start Interview
                </button>
            </div>
        );
    }

    return (
        <div className="review-container">
            <div className="review-header animate-fade-in">
                <div className="review-chip">Quick Review</div>
                <h2 className="review-title">{problemTitle}</h2>
                <p className="review-subtitle">
                    Focused walkthrough with the key approach, complexity target, and checkpoints.
                </p>
                <div className="review-meta-row">
                    <span className={`badge badge-${difficulty.toLowerCase()}`}>{difficulty}</span>
                    {routeState.questionTopicTags && routeState.questionTopicTags.length > 0 && (
                        <span className="review-meta-pill">{routeState.questionTopicTags[0].name}</span>
                    )}
                    <span className="review-meta-pill">5 min path</span>
                </div>
            </div>

            <div className="review-grid">
                {questionContent && (
                    <section className="review-card review-card-full animate-fade-in">
                        <h3 className="review-card-title">Problem Recap</h3>
                        <div
                            className="question-description"
                            dangerouslySetInnerHTML={{ __html: questionContent }}
                        />
                    </section>
                )}

                <section className="review-card animate-fade-in">
                    <h3 className="review-card-title">Checkpoint Hints</h3>
                    {hintsToShow.length > 0 ? (
                        <ul className="review-list">
                            {hintsToShow.map((hint, index) => (
                                <li key={index}>{hint}</li>
                            ))}
                        </ul>
                    ) : (
                        <p className="review-body-text">No hints available.</p>
                    )}
                </section>

                {routeState.scoreResult && (
                    <section className="review-card review-card-full animate-fade-in">
                        <h3 className="review-card-title">Your Latest Attempt</h3>
                        <div className="review-score-strip">
                            <div className="review-score-item">
                                <span>Score</span>
                                <strong>{routeState.scoreResult.percentage}%</strong>
                            </div>
                            <div className="review-score-item">
                                <span>Grade</span>
                                <strong>{routeState.scoreResult.grade}</strong>
                            </div>
                            {routeState.totalTests !== undefined && routeState.totalTests > 0 && (
                                <div className="review-score-item">
                                    <span>Tests</span>
                                    <strong>{routeState.passedTests ?? 0}/{routeState.totalTests}</strong>
                                </div>
                            )}
                            {routeState.scoreOutOf5 !== undefined && routeState.learningSummary && (
                                <div className="review-score-item">
                                    <span>Readiness</span>
                                    <strong>{routeState.scoreOutOf5}/5</strong>
                                </div>
                            )}
                        </div>
                        <p className="review-body-text">{routeState.scoreResult.verdict}</p>
                    </section>
                )}
            </div>

            <div className="review-actions">
                <button
                    className="btn btn-secondary btn-large"
                    onClick={() => {
                        if (resultsState) {
                            navigate('/results', { state: resultsState });
                        } else {
                            navigate('/results');
                        }
                    }}
                >
                    Back to Results
                </button>
                <button
                    className="btn btn-primary btn-large"
                    onClick={() =>
                        navigate('/interview', {
                            state: {
                                difficulty,
                                language: routeState.language ?? 'javascript',
                                previousQuestionId: routeState.problemId
                            }
                        })
                    }
                >
                    Start New Interview
                </button>
            </div>
        </div>
    );
};

export default Review;
