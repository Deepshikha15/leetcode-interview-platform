import { useState, useCallback, useRef, useEffect } from 'react';

interface UseSpeechReturn {
    // Text to Speech
    speak: (text: string) => void;
    stopSpeaking: () => void;
    isSpeaking: boolean;

    // Speech to Text
    startListening: () => void;
    stopListening: () => void;
    isListening: boolean;
    transcript: string;
    resetTranscript: () => void;

    // Support
    isSpeechSupported: boolean;
    isRecognitionSupported: boolean;
}

export function useSpeech(): UseSpeechReturn {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');

    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

    const isSpeechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
    const isRecognitionSupported = typeof window !== 'undefined' &&
        ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

    // Initialize speech recognition
    useEffect(() => {
        if (isRecognitionSupported) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
                let finalTranscript = '';
                let interimTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript + ' ';
                    } else {
                        interimTranscript += transcript;
                    }
                }

                setTranscript(prev => prev + finalTranscript);
            };

            recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
                console.error('Speech recognition error:', event.error);
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, [isRecognitionSupported]);

    // Keep an up-to-date list of available voices for better quality selection.
    useEffect(() => {
        if (!isSpeechSupported) return;

        const loadVoices = () => {
            const voices = window.speechSynthesis.getVoices();
            if (voices.length > 0) {
                voicesRef.current = voices;
            }
        };

        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;

        return () => {
            window.speechSynthesis.onvoiceschanged = null;
        };
    }, [isSpeechSupported]);

    // Text to Speech
    const speak = useCallback((text: string) => {
        if (!isSpeechSupported) return;

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        // Clean HTML tags from text
        const cleanText = text.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ');

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = 0.92;
        utterance.pitch = 1;
        utterance.volume = 1;

        // Try to use a more natural, human-like voice when available.
        const availableVoices = window.speechSynthesis.getVoices();
        const voices = availableVoices.length > 0 ? availableVoices : voicesRef.current;

        const getVoiceScore = (voice: SpeechSynthesisVoice): number => {
            const name = voice.name.toLowerCase();
            const lang = voice.lang.toLowerCase();
            let score = 0;

            if (lang.startsWith('en-us')) score += 40;
            else if (lang.startsWith('en')) score += 20;

            if (voice.default) score += 10;
            if (voice.localService) score += 5;

            if (
                name.includes('jenny') ||
                name.includes('aria') ||
                name.includes('samantha') ||
                name.includes('alex') ||
                name.includes('google us english')
            ) {
                score += 45;
            }

            if (
                name.includes('neural') ||
                name.includes('natural') ||
                name.includes('premium') ||
                name.includes('enhanced') ||
                name.includes('online')
            ) {
                score += 30;
            }

            return score;
        };

        const preferredVoice = [...voices].sort((a, b) => getVoiceScore(b) - getVoiceScore(a))[0];

        if (preferredVoice) {
            utterance.voice = preferredVoice;
            utterance.lang = preferredVoice.lang || 'en-US';
        } else {
            utterance.lang = 'en-US';
        }

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
    }, [isSpeechSupported]);

    const stopSpeaking = useCallback(() => {
        if (isSpeechSupported) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        }
    }, [isSpeechSupported]);

    // Speech to Text
    const startListening = useCallback(() => {
        if (recognitionRef.current && !isListening) {
            try {
                recognitionRef.current.start();
                setIsListening(true);
            } catch (error) {
                console.error('Failed to start recognition:', error);
            }
        }
    }, [isListening]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
    }, [isListening]);

    const resetTranscript = useCallback(() => {
        setTranscript('');
    }, []);

    return {
        speak,
        stopSpeaking,
        isSpeaking,
        startListening,
        stopListening,
        isListening,
        transcript,
        resetTranscript,
        isSpeechSupported,
        isRecognitionSupported
    };
}

// Type declarations for Web Speech API
interface SpeechRecognitionErrorEvent extends Event {
    error: string;
    message: string;
}

interface SpeechRecognitionEvent extends Event {
    resultIndex: number;
    results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
    length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
    isFinal: boolean;
    length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
    transcript: string;
    confidence: number;
}

interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start(): void;
    stop(): void;
    abort(): void;
    onresult: (event: SpeechRecognitionEvent) => void;
    onerror: (event: SpeechRecognitionErrorEvent) => void;
    onend: () => void;
}

interface SpeechRecognitionConstructor {
    new(): SpeechRecognition;
}

declare global {
    interface Window {
        SpeechRecognition: SpeechRecognitionConstructor;
        webkitSpeechRecognition: SpeechRecognitionConstructor;
    }
}
