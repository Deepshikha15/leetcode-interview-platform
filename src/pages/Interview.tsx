import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { LeetCodeProblemDetail, fetchRandomProblem } from '../services/leetcodeApi';
import { useTimer } from '../hooks/useTimer';
import { useSpeech } from '../hooks/useSpeech';
import { calculateScore, validateCode, ScoringInput } from '../utils/scoring';

type Section = 'understand' | 'approach' | 'complexity' | 'code' | 'test';
type Language = 'javascript' | 'python';
type Difficulty = 'Easy' | 'Medium' | 'Hard';
type ComplexityStage = 'time' | 'space' | 'done';

interface InterviewRouteState {
    difficulty?: Difficulty;
    language?: Language;
}

const stripHtmlForSpeech = (text: string): string => (
    text
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
);

const trimToWords = (text: string, maxWords: number): string => {
    const words = text.split(' ').filter(Boolean);
    if (words.length <= maxWords) return text;
    return `${words.slice(0, maxWords).join(' ')}...`;
};

const getProblemSpeechSummary = (question: LeetCodeProblemDetail): string => {
    const plainDescription = stripHtmlForSpeech(question.content ?? '');
    const firstSentence = plainDescription.match(/(.+?[.!?])(\s|$)/)?.[1] ?? plainDescription;
    return trimToWords(firstSentence, 28);
};

const buildIntroSpeech = (_question: LeetCodeProblemDetail): string => (
    `Welcome to your coding interview. `
);

const buildReadAloudSpeech = (question: LeetCodeProblemDetail): string => {
    const summary = getProblemSpeechSummary(question);
    return `${question.title}. ${summary}`;
};

const getStarterCode = (question: LeetCodeProblemDetail, lang: Language): string => {
    const slugMap: Record<Language, string> = { javascript: 'javascript', python: 'python3' };
    const snippet = question.codeSnippets?.find(s => s.langSlug === slugMap[lang]);
    return snippet?.code ?? `// No starter code available for ${lang}`;
};

const BIG_O_REGEX = /^\s*O\s*\(.+\)\s*$/i;

const Interview: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const routeState = (location.state ?? {}) as InterviewRouteState;
    const {
        difficulty = 'Medium',
        language: initialLanguage = 'javascript'
    } = routeState;

    const [question, setQuestion] = useState<LeetCodeProblemDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [currentSection, setCurrentSection] = useState<Section>('understand');
    const [language, setLanguage] = useState<Language>(initialLanguage);
    const [code, setCode] = useState('');
    const [showHints, setShowHints] = useState(false);
    const [interviewStarted, setInterviewStarted] = useState(false);
    const [testResults, setTestResults] = useState<{ passed: boolean; input: string; expected: string; actual?: string }[]>([]);

    // Scoring inputs
    const [askedClarifying, setAskedClarifying] = useState(false);
    const [identifiedEdgeCases, setIdentifiedEdgeCases] = useState(false);
    const [explainedApproach, setExplainedApproach] = useState(false);
    const [discussedComplexity, setDiscussedComplexity] = useState(false);

    const [approachFeedback, setApproachFeedback] = useState<string>('');
    const [failedApproaches, setFailedApproaches] = useState(0);
    const [complexityStage, setComplexityStage] = useState<ComplexityStage>('time');
    const [timeComplexityInput, setTimeComplexityInput] = useState('');
    const [spaceComplexityInput, setSpaceComplexityInput] = useState('');
    const [isEditorDisabled, setIsEditorDisabled] = useState(true);
    const [lastLogicBlockCount, setLastLogicBlockCount] = useState(0);
    const [interactionPoints, setInteractionPoints] = useState(0);
    const [interviewEnded, setInterviewEnded] = useState(false);
    const [testFeedback, setTestFeedback] = useState<string>('');
    const [allTestsPassed, setAllTestsPassed] = useState(false);

    const timer = useTimer(60);
    const speech = useSpeech();

    // Fetch a random problem from the LeetCode API
    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setLoadError(null);

        fetchRandomProblem(difficulty).then(q => {
            if (cancelled) return;
            if (q) {
                setQuestion(q);
            } else {
                setLoadError('Failed to load a problem. Please check that the server is running and try again.');
            }
            setLoading(false);
        });

        return () => { cancelled = true; };
    }, [difficulty]);

    // Reset editor starter code when question/language changes
    useEffect(() => {
        if (!question) return;
        setCode(getStarterCode(question, language));
    }, [question, language]);

    // Start interview
    const handleStartInterview = useCallback(() => {
        setInterviewStarted(true);
        timer.start();

        // Read the question aloud
        if (question && speech.isSpeechSupported) {
            speech.speak(buildIntroSpeech(question));
        }
    }, [question, speech, timer]);

    // Handle language change
    const handleLanguageChange = (newLang: Language) => {
        setLanguage(newLang);
    };

    // Build test cases from the LeetCode API data
    const testCases = React.useMemo(() => {
        if (!question) return [];
        const inputs = question.exampleTestcaseList ?? (question.sampleTestCase ? [question.sampleTestCase] : []);
        return inputs.map(input => ({ input, expectedOutput: '' }));
    }, [question]);

    // Run tests
    const handleRunTests = () => {
        if (!question) return;

        let results: any[] = [];
        let allPassed = false;

        const starterCode = getStarterCode(question, language);

        if (language === 'javascript') {
            try {
                // Determine function name from starter code
                const functionMatch = starterCode.match(/function\s+([a-zA-Z0-9_]+)/) ||
                    starterCode.match(/var\s+([a-zA-Z0-9_]+)\s*=/);
                const functionName = functionMatch ? functionMatch[1] : '';

                // Create a runner that returns the user's function
                const runner = new Function(`
                    ${code}
                    return typeof ${functionName} !== 'undefined' ? ${functionName} : null;
                `)();

                if (typeof runner !== 'function') {
                    throw new Error(`Function ${functionName} is not defined`);
                }

                results = testCases.map((tc) => {
                    try {
                        let args: any[] = [];
                        try {
                            args = JSON.parse("[" + tc.input + "]");
                        } catch {
                            args = [tc.input];
                        }

                        const actual = runner(...args);
                        return {
                            passed: actual !== undefined && actual !== null,
                            input: tc.input,
                            expected: 'N/A (manual check)',
                            actual: JSON.stringify(actual)
                        };
                    } catch (e) {
                        return {
                            passed: false,
                            input: tc.input,
                            expected: 'N/A',
                            actual: `Error: ${(e as Error).message}`
                        };
                    }
                });
            } catch (e) {
                setTestFeedback(`Runtime Error: ${(e as Error).message}`);
                speech.speak(`There was a runtime error in your code: ${(e as Error).message}`);
                setTestResults(testCases.map(tc => ({
                    passed: false,
                    input: tc.input,
                    expected: 'N/A',
                    actual: 'Compilation/Runtime Error'
                })));
                return;
            }
        } else {
            // Python: semantic check (can't actually run Python in browser)
            const pythonStarter = getStarterCode(question, 'python');
            const hasImplementation = !code.includes('pass') &&
                code.length > (pythonStarter.length + 10);

            results = testCases.map((tc, index) => {
                const passed = hasImplementation && index < 2;
                return {
                    passed,
                    input: tc.input,
                    expected: 'N/A (manual check)',
                    actual: passed ? 'Looks implemented' : 'Incomplete'
                };
            });
        }

        setTestResults(results);
        allPassed = results.length > 0 && results.every(r => r.passed);
        setAllTestsPassed(allPassed);

        if (allPassed) {
            const feedback = "Your code ran without errors on all test inputs. You can now submit your interview.";
            setTestFeedback(feedback);
            speech.speak(feedback);
        } else {
            const hint = question.hints?.[0] || "Try to re-examine your logic for the failing test case.";
            const feedback = `One or more test cases had issues. Hint: ${hint}`;
            setTestFeedback(feedback);
            speech.speak(feedback);
        }
    };

    // Submit interview
    const handleSubmit = () => {
        if (!question) return;

        timer.pause();

        const passedTests = testResults.filter(r => r.passed).length;
        const totalTests = testResults.length || testCases.length;

        const scoringInput: ScoringInput = {
            askedClarifyingQuestions: askedClarifying,
            identifiedEdgeCases: identifiedEdgeCases,
            understoodConstraints: currentSection !== 'understand',
            explainedApproach: explainedApproach,
            discussedComplexity: discussedComplexity,
            consideredAlternatives: speech.transcript.toLowerCase().includes('alternative') ||
                speech.transcript.toLowerCase().includes('another way'),
            codeCompiles: validateCode(code, language).isValid,
            passedTestCases: passedTests,
            totalTestCases: totalTests,
            cleanCode: code.length > 50 && !code.includes('TODO'),
            handledEdgeCases: code.toLowerCase().includes('if') && code.toLowerCase().includes('null') ||
                code.toLowerCase().includes('length') && code.includes('0'),
            verbalExplanationLength: speech.transcript.split(' ').length,
            structuredThinking: speech.transcript.length > 100,
            interactionPoints: interactionPoints,
            timeUsedSeconds: 3600 - timer.timeRemaining,
            totalTimeSeconds: 3600
        };

        const scoreResult = calculateScore(scoringInput);

        navigate('/results', {
            state: {
                scoreResult,
                problemId: question.questionId,
                problemTitle: question.title,
                difficulty: question.difficulty,
                language,
                passedTests,
                totalTests,
                // Pass question data so Review page can use it without getQuestionById
                questionContent: question.content,
                questionHints: question.hints,
                questionTopicTags: question.topicTags
            }
        });
    };

    // Verify Approach (lenient – accepts any substantive explanation)
    const handleVerifyApproach = () => {
        if (!question) return;

        const transcript = speech.transcript.toLowerCase();
        const wordCount = transcript.split(/\s+/).filter(Boolean).length;

        // Accept if there's a meaningful explanation (at least 10 words)
        const isAcceptable = wordCount >= 10;

        if (isAcceptable) {
            setExplainedApproach(true);
            setApproachFeedback("That's a solid approach! Now, let's discuss the Big-O complexity.");
            speech.speak("That's a solid approach! Now, let's discuss the Big-O complexity.");
            setTimeout(() => setCurrentSection('complexity'), 2000);
        } else {
            const newFailedCount = failedApproaches + 1;
            setFailedApproaches(newFailedCount);

            if (newFailedCount >= 3) {
                setApproachFeedback("I'm sorry, we've tried a few approaches and haven't quite hit the target. I suggest you prepare well and try again later. The interview is now closed.");
                speech.speak("I'm sorry, but we've tried a few approaches and haven't quite hit the target. I suggest you prepare well and try again later. The interview is now closed.");
                setInterviewEnded(true);
                timer.pause();
            } else {
                setApproachFeedback(`Please provide a more detailed explanation of your approach. You have ${3 - newFailedCount} attempts remaining.`);
                speech.speak(`Please provide a more detailed explanation of your approach. You have ${3 - newFailedCount} attempts remaining.`);
            }
        }
    };

    // Verify Complexity (lenient – accepts any valid Big-O notation)
    const handleVerifyComplexity = () => {
        if (!question) return;

        if (complexityStage === 'time') {
            const isValid = BIG_O_REGEX.test(timeComplexityInput.trim());
            if (isValid) {
                setComplexityStage('space');
                speech.speak("Noted! Now, what is the space complexity?");
            } else {
                speech.speak("Please provide a valid Big-O notation, for example O(n) or O(n log n).");
            }
        } else {
            const isValid = BIG_O_REGEX.test(spaceComplexityInput.trim());
            if (isValid) {
                setComplexityStage('done');
                setDiscussedComplexity(true);
                setIsEditorDisabled(false);
                speech.speak("Excellent. You've discussed the complexity. You can now proceed to implement the solution. The editor is now enabled.");
                setTimeout(() => setCurrentSection('code'), 3000);
            } else {
                speech.speak("Please provide a valid Big-O notation, for example O(1) or O(n).");
            }
        }
    };

    // Monitor code for logic blocks
    useEffect(() => {
        if (currentSection !== 'code' || interviewEnded) return;

        // Simple regex to detect completed logic blocks
        const blocks = (code.match(/(for|while|if)\s*\(.*?\)\s*\{[\s\S]*?\}/g) || []).length;

        if (blocks > lastLogicBlockCount) {
            setLastLogicBlockCount(blocks);
            const blockType = code.match(/(for|while|if)\s*\(.*?\)\s*\{[\s\S]*?\}/g)?.pop()?.match(/(for|while|if)/)?.[0];

            speech.speak(`I see you've implemented a ${blockType} block. Can you quickly explain the logic here while you continue?`);
            // We'll give them some "communication points" if they're speaking while coding
            if (speech.isListening) {
                setInteractionPoints(prev => prev + 1);
            }
        }
    }, [code, currentSection, lastLogicBlockCount, speech, interviewEnded]);

    // Read question aloud
    const handleReadAloud = () => {
        if (!question) return;

        if (speech.isSpeaking) {
            speech.stopSpeaking();
        } else {
            speech.speak(buildReadAloudSpeech(question));
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: '24px' }}>
                <div className="spinner"></div>
                <div style={{ fontSize: '18px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: 'var(--accent-primary)', fontWeight: '600' }}>Preparing Interview</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Fetching a random {difficulty} problem from LeetCode...</span>
                </div>
            </div>
        );
    }

    if (loadError || !question) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: '16px' }}>
                <div style={{ fontSize: '48px' }}>⚠️</div>
                <h2 style={{ marginBottom: '8px' }}>Failed to Load Problem</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', maxWidth: '500px', textAlign: 'center' }}>
                    {loadError || 'Could not fetch a problem. Please ensure the backend server is running.'}
                </p>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn btn-primary" onClick={() => window.location.reload()}>🔄 Retry</button>
                    <button className="btn btn-secondary" onClick={() => navigate('/')}>← Go Home</button>
                </div>
            </div>
        );
    }

    if (!interviewStarted) {
        return (
            <div className="home-container">
                <div style={{ fontSize: '64px', marginBottom: '24px' }}>🎯</div>
                <h1 style={{ fontSize: '36px', marginBottom: '16px' }}>Ready to Start?</h1>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', maxWidth: '500px' }}>
                    You'll have <strong>60 minutes</strong> to solve a {difficulty} problem.
                    The interview will be read aloud to you. You can explain your approach verbally
                    and write your code in the editor.
                </p>
                <div style={{
                    background: 'var(--bg-card)',
                    padding: '24px',
                    borderRadius: 'var(--radius-lg)',
                    marginBottom: '32px',
                    border: '1px solid rgba(255,255,255,0.1)'
                }}>
                    <div className="interview-preview-info" style={{ display: 'flex', gap: '40px', flexWrap: 'wrap', justifyContent: 'center' }}>
                        <div>
                            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Problem</div>
                            <div style={{ fontSize: '18px', fontWeight: '600' }}>{question.title}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Difficulty</div>
                            <span className={`badge badge-${question.difficulty.toLowerCase()}`}>
                                {question.difficulty}
                            </span>
                        </div>
                    </div>
                </div>
                <button className="start-btn" onClick={handleStartInterview}>
                    🚀 Begin Interview
                </button>
            </div>
        );
    }

    return (
        <div className="app-container">
            {/* Header */}
            <header className="header">
                <div className="logo">
                    <div className="logo-icon">LC</div>
                    <span>Interview Pro</span>
                </div>

                <div className="header-center">
                    <div className="section-tabs">
                        {(['understand', 'approach', 'complexity', 'code', 'test'] as Section[]).map((section) => (
                            <button
                                key={section}
                                className={`section-tab ${currentSection === section ? 'active' : ''}`}
                                onClick={() => setCurrentSection(section)}
                                disabled={
                                    (section === 'complexity' && !explainedApproach) ||
                                    (section === 'code' && !discussedComplexity) ||
                                    (section === 'test' && !discussedComplexity) ||
                                    interviewEnded
                                }
                            >
                                {section.charAt(0).toUpperCase() + section.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="header-right">
                    <div className={`timer ${timer.isWarning ? 'warning' : ''} ${timer.isDanger ? 'danger' : ''}`}>
                        <span className="timer-icon">⏱️</span>
                        {timer.formattedTime}
                    </div>
                    <button
                        className={`btn ${allTestsPassed ? 'btn-primary pulse' : 'btn-success'}`}
                        onClick={handleSubmit}
                        disabled={interviewEnded}
                    >
                        {allTestsPassed ? 'Submit Interview' : 'Submit'}
                    </button>
                </div>
            </header>

            {/* Main content */}
            <div className="main-content">
                <div className="split-pane">
                    {/* Left: Question Panel */}
                    <div className="split-pane-left">
                        <div className="question-panel">
                            <div className="question-header">
                                <div>
                                    <h1 className="question-title">{question.title}</h1>
                                    <div className="question-meta">
                                        <span className={`badge badge-${question.difficulty.toLowerCase()}`}>
                                            {question.difficulty}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    className={`btn btn-secondary btn-icon ${speech.isSpeaking ? 'glow' : ''}`}
                                    onClick={handleReadAloud}
                                    title={speech.isSpeaking ? 'Stop reading' : 'Read aloud'}
                                >
                                    {speech.isSpeaking ? '🔊' : '🔈'}
                                </button>
                            </div>

                            {currentSection === 'understand' && (
                                <div className="animate-fade-in">
                                    <h3 style={{ marginBottom: '16px', color: 'var(--accent-primary)' }}>
                                        📖 Step 1: Understand the Problem
                                    </h3>
                                    <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
                                        Read the problem carefully. Ask clarifying questions and identify edge cases.
                                    </p>

                                    <div className="question-description" dangerouslySetInnerHTML={{ __html: question.content ?? '' }} />

                                    <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={askedClarifying}
                                                onChange={(e) => setAskedClarifying(e.target.checked)}
                                                disabled={interviewEnded}
                                            />
                                            I asked clarifying questions
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={identifiedEdgeCases}
                                                onChange={(e) => setIdentifiedEdgeCases(e.target.checked)}
                                                disabled={interviewEnded}
                                            />
                                            I identified edge cases
                                        </label>
                                    </div>
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => setCurrentSection('approach')}
                                        style={{ marginTop: '24px' }}
                                        disabled={interviewEnded}
                                    >
                                        Next: Explain Approach
                                    </button>
                                </div>
                            )}

                            {currentSection === 'complexity' && (
                                <div className="animate-fade-in">
                                    <h3 style={{ marginBottom: '16px', color: 'var(--accent-primary)' }}>
                                        📊 Step 2.5: Complexity Analysis
                                    </h3>
                                    <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                                        {complexityStage === 'time'
                                            ? "What is the Time Complexity of your proposed solution?"
                                            : "And what is the Space Complexity?"}
                                    </p>

                                    <div className="complexity-input-section" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        {complexityStage === 'time' ? (
                                            <input
                                                type="text"
                                                className="input-field"
                                                placeholder="e.g. O(n), O(log n)"
                                                value={timeComplexityInput}
                                                onChange={(e) => setTimeComplexityInput(e.target.value)}
                                                disabled={interviewEnded}
                                                style={{ padding: '12px', background: 'var(--bg-secondary)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: 'var(--radius-md)' }}
                                            />
                                        ) : (
                                            <input
                                                type="text"
                                                className="input-field"
                                                placeholder="e.g. O(1), O(n)"
                                                value={spaceComplexityInput}
                                                onChange={(e) => setSpaceComplexityInput(e.target.value)}
                                                disabled={interviewEnded}
                                                style={{ padding: '12px', background: 'var(--bg-secondary)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: 'var(--radius-md)' }}
                                            />
                                        )}

                                        <button
                                            className="btn btn-primary"
                                            onClick={handleVerifyComplexity}
                                            disabled={interviewEnded || (complexityStage === 'time' ? !timeComplexityInput : !spaceComplexityInput)}
                                        >
                                            ✅ Verify Complexity
                                        </button>
                                    </div>
                                </div>
                            )}

                            {currentSection === 'approach' && (
                                <div className="animate-fade-in">
                                    <h3 style={{ marginBottom: '16px', color: 'var(--accent-primary)' }}>
                                        💡 Step 2: Explain Your Approach
                                    </h3>
                                    <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                                        Explain your solution approach verbally. Discuss the algorithm,
                                        data structures, and time/space complexity.
                                    </p>

                                    <div className="verbal-section" style={{ textAlign: 'left', padding: '0' }}>
                                        <button
                                            className={`record-btn ${speech.isListening ? 'recording' : ''}`}
                                            onClick={speech.isListening ? speech.stopListening : speech.startListening}
                                            style={{ margin: '0 auto 24px', display: 'block' }}
                                        >
                                            {speech.isListening ? '⏹️' : '🎤'}
                                        </button>

                                        <p style={{ textAlign: 'center', marginBottom: '16px', color: 'var(--text-secondary)' }}>
                                            {speech.isListening ? 'Recording... Click to stop' : 'Click to start explaining'}
                                        </p>

                                        <div className="transcript-box">
                                            {speech.transcript || (
                                                <span className="transcript-placeholder">
                                                    Your verbal explanation will appear here...
                                                </span>
                                            )}
                                        </div>

                                        {approachFeedback && (
                                            <div style={{
                                                marginTop: '16px',
                                                padding: '12px',
                                                borderRadius: 'var(--radius-md)',
                                                background: failedApproaches > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                                border: `1px solid ${failedApproaches > 0 ? 'var(--danger-color)' : 'var(--success-color)'}`,
                                                color: failedApproaches > 0 ? 'var(--danger-color)' : 'var(--success-color)'
                                            }}>
                                                {approachFeedback}
                                            </div>
                                        )}

                                        <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
                                            <button
                                                className="btn btn-primary"
                                                onClick={handleVerifyApproach}
                                                disabled={!speech.transcript && !interviewEnded}
                                            >
                                                ✅ Verify Approach
                                            </button>
                                        </div>

                                        <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={explainedApproach}
                                                    onChange={(e) => setExplainedApproach(e.target.checked)}
                                                />
                                                I explained my approach
                                            </label>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={discussedComplexity}
                                                    onChange={(e) => setDiscussedComplexity(e.target.checked)}
                                                />
                                                I discussed complexity
                                            </label>
                                        </div>
                                    </div>

                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => setShowHints(!showHints)}
                                        style={{ marginTop: '24px' }}
                                    >
                                        {showHints ? 'Hide Hints' : 'Show Hints'} 💡
                                    </button>

                                    {showHints && (
                                        <div style={{ marginTop: '16px', padding: '16px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                                            {question.hints.map((hint, i) => (
                                                <p key={i} style={{ marginBottom: '8px', color: 'var(--text-secondary)' }}>
                                                    💡 {hint}
                                                </p>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {(currentSection === 'code' || currentSection === 'test') && (
                                <div className="animate-fade-in">
                                    <h3 style={{ marginBottom: '16px', color: 'var(--accent-primary)' }}>
                                        {currentSection === 'code' ? '💻 Step 3: Write Your Code' : '🧪 Step 4: Test Your Solution'}
                                    </h3>

                                    <div className="question-description" dangerouslySetInnerHTML={{ __html: question.content ?? '' }} />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Code Editor */}
                    <div className="split-pane-right">
                        <div className="editor-panel">
                            <div className="editor-header">
                                <div className="language-selector">
                                    <button
                                        className={`language-btn ${language === 'javascript' ? 'active' : ''}`}
                                        onClick={() => handleLanguageChange('javascript')}
                                    >
                                        JavaScript
                                    </button>
                                    <button
                                        className={`language-btn ${language === 'python' ? 'active' : ''}`}
                                        onClick={() => handleLanguageChange('python')}
                                    >
                                        Python
                                    </button>
                                </div>
                                <div className="editor-actions">
                                    <button className="btn btn-secondary" onClick={handleRunTests}>
                                        ▶️ Run
                                    </button>
                                    <button className="btn btn-success" onClick={handleSubmit}>
                                        Submit
                                    </button>
                                </div>
                            </div>

                            <div className="editor-wrapper">
                                <Editor
                                    height="100%"
                                    language={language}
                                    value={code}
                                    onChange={(value) => setCode(value || '')}
                                    theme="vs-dark"
                                    options={{
                                        fontSize: 14,
                                        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                                        minimap: { enabled: false },
                                        scrollBeyondLastLine: false,
                                        lineNumbers: 'on',
                                        renderLineHighlight: 'all',
                                        automaticLayout: true,
                                        tabSize: 2,
                                        wordWrap: 'on',
                                        padding: { top: 16 },
                                        readOnly: isEditorDisabled
                                    }}
                                />
                            </div>
                        </div>

                        {/* Test Results */}
                        <div className="test-panel">
                            <div className="test-header">
                                <div className="test-tabs">
                                    <span className="test-tab active">Test Cases</span>
                                </div>
                                <button className="btn btn-secondary" onClick={handleRunTests} style={{ padding: '4px 12px', fontSize: '12px' }}>
                                    Run Tests
                                </button>
                            </div>
                            <div className="test-content">
                                {testFeedback && (
                                    <div style={{
                                        padding: '12px',
                                        marginBottom: '16px',
                                        borderRadius: 'var(--radius-md)',
                                        background: allTestsPassed ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                        border: `1px solid ${allTestsPassed ? 'var(--success-color)' : 'var(--danger-color)'}`,
                                        color: 'white',
                                        fontSize: '0.9rem'
                                    }}>
                                        {testFeedback}
                                    </div>
                                )}
                                {testResults.length === 0 ? (
                                    testCases.slice(0, 3).map((tc, index) => (
                                        <div key={index} className="test-case">
                                            <div className="test-case-header">
                                                <span className="test-case-name">
                                                    <span className="test-case-status pending"></span>
                                                    Case {index + 1}
                                                </span>
                                            </div>
                                            <div className="test-case-body">
                                                <span>Input: </span>{tc.input}<br />
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    testResults.map((result, index) => (
                                        <div key={index} className="test-case">
                                            <div className="test-case-header">
                                                <span className="test-case-name">
                                                    <span className={`test-case-status ${result.passed ? 'passed' : 'failed'}`}></span>
                                                    Case {index + 1} - {result.passed ? 'Passed' : 'Failed'}
                                                </span>
                                            </div>
                                            <div className="test-case-body">
                                                <span>Input: </span>{result.input}<br />
                                                <span>Expected: </span>{result.expected}<br />
                                                {!result.passed && <><span>Actual: </span>{result.actual}</>}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Voice controls floating */}
            <div className="voice-controls">
                <button
                    className={`voice-btn voice-btn-speak ${speech.isSpeaking ? 'glow' : ''}`}
                    onClick={handleReadAloud}
                    title="Read question aloud"
                >
                    {speech.isSpeaking ? '🔊' : '🔈'}
                </button>
                <button
                    className={`voice-btn voice-btn-record ${speech.isListening ? 'recording' : ''}`}
                    onClick={speech.isListening ? speech.stopListening : speech.startListening}
                    title={speech.isListening ? 'Stop recording' : 'Start recording explanation'}
                >
                    {speech.isListening ? '⏹️' : '🎤'}
                </button>
            </div>
        </div>
    );
};

export default Interview;
