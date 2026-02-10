import { useState, useEffect, useCallback, useRef } from 'react';

interface UseTimerReturn {
    timeRemaining: number;
    formattedTime: string;
    isRunning: boolean;
    isPaused: boolean;
    start: () => void;
    pause: () => void;
    resume: () => void;
    reset: () => void;
    isWarning: boolean;
    isDanger: boolean;
    progress: number;
}

export function useTimer(initialMinutes: number = 60): UseTimerReturn {
    const initialSeconds = initialMinutes * 60;
    const [timeRemaining, setTimeRemaining] = useState(initialSeconds);
    const [isRunning, setIsRunning] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const clearTimer = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    useEffect(() => {
        if (isRunning && !isPaused && timeRemaining > 0) {
            intervalRef.current = setInterval(() => {
                setTimeRemaining(prev => {
                    if (prev <= 1) {
                        clearTimer();
                        setIsRunning(false);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return clearTimer;
    }, [isRunning, isPaused, clearTimer]);

    const start = useCallback(() => {
        setIsRunning(true);
        setIsPaused(false);
    }, []);

    const pause = useCallback(() => {
        setIsPaused(true);
        clearTimer();
    }, [clearTimer]);

    const resume = useCallback(() => {
        setIsPaused(false);
    }, []);

    const reset = useCallback(() => {
        clearTimer();
        setTimeRemaining(initialSeconds);
        setIsRunning(false);
        setIsPaused(false);
    }, [initialSeconds, clearTimer]);

    const formatTime = (seconds: number): string => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hrs > 0) {
            return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const isWarning = timeRemaining <= 15 * 60 && timeRemaining > 5 * 60; // 15-5 minutes
    const isDanger = timeRemaining <= 5 * 60; // < 5 minutes
    const progress = ((initialSeconds - timeRemaining) / initialSeconds) * 100;

    return {
        timeRemaining,
        formattedTime: formatTime(timeRemaining),
        isRunning,
        isPaused,
        start,
        pause,
        resume,
        reset,
        isWarning,
        isDanger,
        progress
    };
}
