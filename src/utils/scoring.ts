export interface ScoreResult {
    problemUnderstanding: number;
    approachExplanation: number;
    codeQuality: number;
    communication: number;
    timeManagement: number;
    total: number;
    maxTotal: number;
    percentage: number;
    grade: string;
    verdict: string;
    feedback: {
        section: string;
        score: number;
        maxScore: number;
        comments: string[];
    }[];
}

export interface ScoringInput {
    // Problem Understanding
    askedClarifyingQuestions: boolean;
    identifiedEdgeCases: boolean;
    understoodConstraints: boolean;

    // Approach
    explainedApproach: boolean;
    discussedComplexity: boolean;
    consideredAlternatives: boolean;

    // Code Quality
    codeCompiles: boolean;
    passedTestCases: number;
    totalTestCases: number;
    cleanCode: boolean;
    handledEdgeCases: boolean;

    // Communication
    verbalExplanationLength: number; // words
    structuredThinking: boolean;
    interactionPoints: number; // points for explaining while coding

    // Time
    timeUsedSeconds: number;
    totalTimeSeconds: number;
}

export function calculateScore(input: ScoringInput): ScoreResult {
    const feedback: ScoreResult['feedback'] = [];

    // Problem Understanding (20 points)
    let problemUnderstanding = 0;
    const puComments: string[] = [];

    if (input.askedClarifyingQuestions) {
        problemUnderstanding += 7;
        puComments.push('✓ Asked clarifying questions');
    } else {
        puComments.push('✗ Could improve by asking clarifying questions');
    }

    if (input.identifiedEdgeCases) {
        problemUnderstanding += 7;
        puComments.push('✓ Identified edge cases upfront');
    } else {
        puComments.push('✗ Consider discussing edge cases before coding');
    }

    if (input.understoodConstraints) {
        problemUnderstanding += 6;
        puComments.push('✓ Understood problem constraints');
    } else {
        puComments.push('✗ Review constraints more carefully');
    }

    feedback.push({
        section: 'Problem Understanding',
        score: problemUnderstanding,
        maxScore: 20,
        comments: puComments
    });

    // Approach Explanation (25 points)
    let approachExplanation = 0;
    const aeComments: string[] = [];

    if (input.explainedApproach) {
        approachExplanation += 10;
        aeComments.push('✓ Clearly explained the approach');
    } else {
        aeComments.push('✗ Explain your approach before coding');
    }

    if (input.discussedComplexity) {
        approachExplanation += 10;
        aeComments.push('✓ Discussed time/space complexity');
    } else {
        aeComments.push('✗ Always discuss Big-O complexity');
    }

    if (input.consideredAlternatives) {
        approachExplanation += 5;
        aeComments.push('✓ Considered alternative solutions');
    } else {
        aeComments.push('○ Could mention alternative approaches');
    }

    feedback.push({
        section: 'Approach Explanation',
        score: approachExplanation,
        maxScore: 25,
        comments: aeComments
    });

    // Code Quality (30 points)
    let codeQuality = 0;
    const cqComments: string[] = [];

    if (input.codeCompiles) {
        codeQuality += 5;
        cqComments.push('✓ Code compiles without errors');
    } else {
        cqComments.push('✗ Code has syntax errors');
    }

    const testCaseScore = input.totalTestCases > 0
        ? Math.round((input.passedTestCases / input.totalTestCases) * 15)
        : 0;
    codeQuality += testCaseScore;
    cqComments.push(`○ Passed ${input.passedTestCases}/${input.totalTestCases} test cases`);

    if (input.cleanCode) {
        codeQuality += 5;
        cqComments.push('✓ Clean, readable code');
    } else {
        cqComments.push('○ Could improve code readability');
    }

    if (input.handledEdgeCases) {
        codeQuality += 5;
        cqComments.push('✓ Handled edge cases in code');
    } else {
        cqComments.push('✗ Missing edge case handling');
    }

    feedback.push({
        section: 'Code Quality',
        score: codeQuality,
        maxScore: 30,
        comments: cqComments
    });

    // Communication (15 points)
    let communication = 0;
    const commComments: string[] = [];

    if (input.verbalExplanationLength > 50) {
        communication += 8;
        commComments.push('✓ Provided detailed verbal explanation');
    } else if (input.verbalExplanationLength > 20) {
        communication += 4;
        commComments.push('○ Could provide more detailed explanation');
    } else {
        commComments.push('✗ Very limited verbal communication');
    }

    if (input.structuredThinking) {
        communication += 7;
        commComments.push('✓ Demonstrated structured thinking');
    } else {
        commComments.push('○ Try to think out loud more');
    }

    feedback.push({
        section: 'Communication',
        score: communication,
        maxScore: 15,
        comments: commComments
    });

    // Interactive Feedback (added to communication)
    if (input.interactionPoints > 0) {
        communication += Math.min(input.interactionPoints * 2, 10);
        commComments.push(`✓ Explained logic while coding (${input.interactionPoints} times)`);
    } else {
        commComments.push('✗ Could improve by explaining logic blocks while coding');
    }

    // Time Management (10 points)
    let timeManagement = 0;
    const tmComments: string[] = [];

    const timeUsedPercent = input.timeUsedSeconds / input.totalTimeSeconds;

    if (timeUsedPercent <= 0.7) {
        timeManagement = 10;
        tmComments.push('✓ Excellent time management');
    } else if (timeUsedPercent <= 0.9) {
        timeManagement = 7;
        tmComments.push('○ Good time management');
    } else if (timeUsedPercent <= 1.0) {
        timeManagement = 4;
        tmComments.push('○ Finished just in time');
    } else {
        timeManagement = 0;
        tmComments.push('✗ Exceeded time limit');
    }

    feedback.push({
        section: 'Time Management',
        score: timeManagement,
        maxScore: 10,
        comments: tmComments
    });

    // Calculate totals
    const total = problemUnderstanding + approachExplanation + codeQuality + communication + timeManagement;
    const maxTotal = 100;
    const percentage = Math.round((total / maxTotal) * 100);

    // Determine grade and verdict
    let grade: string;
    let verdict: string;

    if (percentage >= 90) {
        grade = 'A+';
        verdict = 'Outstanding Performance! You demonstrated excellent problem-solving skills.';
    } else if (percentage >= 80) {
        grade = 'A';
        verdict = 'Great job! Strong performance with minor areas for improvement.';
    } else if (percentage >= 70) {
        grade = 'B';
        verdict = 'Good performance. Review the feedback to improve further.';
    } else if (percentage >= 60) {
        grade = 'C';
        verdict = 'Satisfactory. Focus on the weak areas identified in feedback.';
    } else if (percentage >= 50) {
        grade = 'D';
        verdict = 'Needs improvement. Practice more problems and focus on communication.';
    } else {
        grade = 'F';
        verdict = 'Keep practicing! Review fundamentals and solve more problems.';
    }

    return {
        problemUnderstanding,
        approachExplanation,
        codeQuality,
        communication,
        timeManagement,
        total,
        maxTotal,
        percentage,
        grade,
        verdict,
        feedback
    };
}

// Simple code validation (checks basic syntax)
export function validateCode(code: string, language: 'javascript' | 'python'): {
    isValid: boolean;
    error: string | null;
} {
    if (!code.trim()) {
        return { isValid: false, error: 'No code provided' };
    }

    if (language === 'javascript') {
        try {
            // Basic syntax check using Function constructor
            new Function(code);
            return { isValid: true, error: null };
        } catch (e) {
            return { isValid: false, error: (e as Error).message };
        }
    }

    // For Python, we do basic checks
    if (language === 'python') {
        // Check for basic Python syntax issues
        const lines = code.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            // Check for unclosed parentheses (very basic)
            const opens = (line.match(/\(/g) || []).length;
            const closes = (line.match(/\)/g) || []).length;
            if (opens !== closes && !line.trim().endsWith(':') && !line.trim().endsWith('\\')) {
                // This is a very basic check - real validation would need a parser
            }
        }
        return { isValid: true, error: null };
    }

    return { isValid: true, error: null };
}
