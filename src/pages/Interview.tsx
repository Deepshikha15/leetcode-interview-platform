import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { questions, Question, getRandomQuestion } from '../data/questions';
import { useTimer } from '../hooks/useTimer';
import { useSpeech } from '../hooks/useSpeech';
import { calculateScore, validateCode, ScoringInput } from '../utils/scoring';

type Section = 'understand' | 'approach' | 'code' | 'test';
type Language = 'javascript' | 'python';

const Interview: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { difficulty = 'Medium', language: initialLanguage = 'javascript' } = location.state || {};

    const [question, setQuestion] = useState<Question | null>(null);
    const [currentSection, setCurrentSection] = useState<Section>('understand');
    const [language, setLanguage] = useState<Language>(initialLanguage);
    const [code, setCode] = useState('');
    const [testResults, setTestResults] = useState<{ passed: boolean; input: string; expected: string; actual?: string }[]>([]);
    const [showHints, setShowHints] = useState(false);
    const [interviewStarted, setInterviewStarted] = useState(false);

    // Scoring inputs
    const [askedClarifying, setAskedClarifying] = useState(false);
    const [identifiedEdgeCases, setIdentifiedEdgeCases] = useState(false);
    const [explainedApproach, setExplainedApproach] = useState(false);
    const [discussedComplexity, setDiscussedComplexity] = useState(false);

    const timer = useTimer(60);
    const speech = useSpeech();

    // Initialize question and code
    useEffect(() => {
        const q = getRandomQuestion(difficulty);
        setQuestion(q);
        setCode(q.starterCode[language as keyof typeof q.starterCode]);
    }, [difficulty, language]);

    // Start interview
    const handleStartInterview = useCallback(() => {
        setInterviewStarted(true);
        timer.start();

        // Read the question aloud
        if (question && speech.isSpeechSupported) {
            const introText = `Welcome to your coding interview. Today's question is: ${question.title}. 
        This is a ${question.difficulty} level ${question.category} problem. 
        ${question.description}`;
            speech.speak(introText);
        }
    }, [question, speech, timer]);

    // Handle language change
    const handleLanguageChange = (newLang: Language) => {
        setLanguage(newLang);
        if (question) {
            setCode(question.starterCode[newLang]);
        }
    };

    // Run tests
    const handleRunTests = () => {
        if (!question) return;

        // Simple validation
        const validation = validateCode(code, language);

        // For demo purposes, we'll simulate test results
        // In a real app, this would execute the code safely
        const results = question.testCases.map((tc, index) => {
            // Simulate some passes and fails based on code content
            const hasImplementation = !code.includes('// Your code here') &&
                !code.includes('# Your code here') &&
                !code.includes('pass');
            const passed = hasImplementation && Math.random() > 0.3;

            return {
                passed,
                input: tc.input,
                expected: tc.expectedOutput,
                actual: passed ? tc.expectedOutput : 'undefined'
            };
        });

        setTestResults(results);
    };

    // Submit interview
    const handleSubmit = () => {
        timer.pause();

        const passedTests = testResults.filter(r => r.passed).length;
        const totalTests = testResults.length || (question?.testCases.length || 0);

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
            timeUsedSeconds: 3600 - timer.timeRemaining,
            totalTimeSeconds: 3600
        };

        const scoreResult = calculateScore(scoringInput);

        navigate('/results', { state: { scoreResult } });
    };

    // Read question aloud
    const handleReadAloud = () => {
        if (!question) return;

        if (speech.isSpeaking) {
            speech.stopSpeaking();
        } else {
            const text = `${question.title}. ${question.description}. 
        Example: Input: ${question.examples[0].input}. Output: ${question.examples[0].output}.`;
            speech.speak(text);
        }
    };

    if (!question) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
                <div className="animate-pulse" style={{ fontSize: '24px' }}>Loading question...</div>
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
                        <div>
                            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Category</div>
                            <div style={{ fontSize: '18px', fontWeight: '600' }}>{question.category}</div>
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
                        {(['understand', 'approach', 'code', 'test'] as Section[]).map((section) => (
                            <button
                                key={section}
                                className={`section-tab ${currentSection === section ? 'active' : ''}`}
                                onClick={() => setCurrentSection(section)}
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
                    <button className="btn btn-success" onClick={handleSubmit}>
                        Submit
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
                                        <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                                            {question.category}
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

                                    <div className="question-description" dangerouslySetInnerHTML={{ __html: question.description }} />

                                    {question.examples.map((example, index) => (
                                        <div key={index} className="example-block">
                                            <div className="example-title">Example {index + 1}</div>
                                            <div className="example-content">
                                                <div><strong>Input:</strong> {example.input}</div>
                                                <div><strong>Output:</strong> {example.output}</div>
                                                {example.explanation && (
                                                    <div><strong>Explanation:</strong> {example.explanation}</div>
                                                )}
                                            </div>
                                        </div>
                                    ))}

                                    <div className="constraints">
                                        <div className="constraints-title">Constraints:</div>
                                        <ul>
                                            {question.constraints.map((c, i) => (
                                                <li key={i}>{c}</li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={askedClarifying}
                                                onChange={(e) => setAskedClarifying(e.target.checked)}
                                            />
                                            I asked clarifying questions
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={identifiedEdgeCases}
                                                onChange={(e) => setIdentifiedEdgeCases(e.target.checked)}
                                            />
                                            I identified edge cases
                                        </label>
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

                                    <div className="question-description" dangerouslySetInnerHTML={{ __html: question.description }} />

                                    {question.examples.slice(0, 1).map((example, index) => (
                                        <div key={index} className="example-block">
                                            <div className="example-title">Example</div>
                                            <div className="example-content">
                                                <div><strong>Input:</strong> {example.input}</div>
                                                <div><strong>Output:</strong> {example.output}</div>
                                            </div>
                                        </div>
                                    ))}
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
                                        padding: { top: 16 }
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
                                {testResults.length === 0 ? (
                                    question.testCases.slice(0, 3).map((tc, index) => (
                                        <div key={index} className="test-case">
                                            <div className="test-case-header">
                                                <span className="test-case-name">
                                                    <span className="test-case-status pending"></span>
                                                    Case {index + 1}
                                                </span>
                                            </div>
                                            <div className="test-case-body">
                                                <span>Input: </span>{tc.input}<br />
                                                <span>Expected: </span>{tc.expectedOutput}
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
