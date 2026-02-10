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

            recognitionRef.current.onresult = (event) => {
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

            recognitionRef.current.onerror = (event) => {
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

    // Text to Speech
    const speak = useCallback((text: string) => {
        if (!isSpeechSupported) return;

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        // Clean HTML tags from text
        const cleanText = text.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ');

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;

        // Try to use a natural voice
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v =>
            v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Alex')
        ) || voices[0];

        if (preferredVoice) {
            utterance.voice = preferredVoice;
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
declare global {
    interface Window {
        SpeechRecognition: typeof SpeechRecognition;
        webkitSpeechRecognition: typeof SpeechRecognition;
    }
}
