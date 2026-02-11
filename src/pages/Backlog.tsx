import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ScoreResult } from '../utils/scoring';

type Difficulty = 'Easy' | 'Medium' | 'Hard';
type Language = 'javascript' | 'python';

interface BacklogRouteState {
    scoreResult?: ScoreResult;
    problemId?: number;
    problemTitle?: string;
    difficulty?: Difficulty;
    language?: Language;
    passedTests?: number;
    totalTests?: number;
    didSave?: boolean;
}

interface LearningBacklogItem {
    problemId: number | null;
    problemTitle: string;
    scoreOutOf5: number;
    summary: string;
    savedAt: string;
}

const LEARNING_BACKLOG_KEY = 'leetcodepro.learningBacklog';

const Backlog: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const routeState = (location.state ?? {}) as BacklogRouteState;
    const problemTitle = routeState.problemTitle ?? 'Current Problem';

    let backlogItems: LearningBacklogItem[] = [];
    try {
        const rawValue = localStorage.getItem(LEARNING_BACKLOG_KEY);
        const parsed: unknown = rawValue ? JSON.parse(rawValue) : [];
        backlogItems = Array.isArray(parsed) ? (parsed as LearningBacklogItem[]) : [];
    } catch {
        backlogItems = [];
    }

    const sortedItems = [...backlogItems].sort((a, b) => b.savedAt.localeCompare(a.savedAt));

    return (
        <div className="review-container">
            <div className="review-header animate-fade-in">
                <div className="review-chip">Learning Path</div>
                <h2 className="review-title">Skip for now</h2>
                <p className="review-subtitle">Save to learning backlog</p>
                <div className="backlog-status">
                    {routeState.didSave
                        ? `${problemTitle} saved to your learning backlog.`
                        : 'Unable to save backlog in this browser session.'}
                </div>
            </div>

            <section className="review-card animate-fade-in">
                <h3 className="review-card-title">Saved Backlog</h3>
                {sortedItems.length === 0 ? (
                    <p className="review-body-text">No saved problems yet.</p>
                ) : (
                    <div className="backlog-list">
                        {sortedItems.map((item) => (
                            <div key={`${item.problemId ?? 'unknown'}-${item.savedAt}`} className="backlog-item">
                                <div className="backlog-item-title">{item.problemTitle}</div>
                                <div className="backlog-item-meta">
                                    Readiness {item.scoreOutOf5}/5 • {item.summary}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <div className="review-actions">
                <button className="btn btn-secondary btn-large" onClick={() => navigate('/results', { state: routeState })}>
                    Back to Results
                </button>
                <button className="btn btn-primary btn-large" onClick={() => navigate('/')}>
                    Back Home
                </button>
            </div>
        </div>
    );
};

export default Backlog;
