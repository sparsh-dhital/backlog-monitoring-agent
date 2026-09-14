import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Volume2 } from "lucide-react";

interface RecognitionResultEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface RecognitionErrorEvent extends Event {
  error?: string;
}

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: RecognitionResultEvent) => void) | null;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: RecognitionErrorEvent) => void) | null;
  start: () => void;
  stop: () => void;
}

type RecognitionConstructor = new () => SpeechRecognitionLike;

type VoiceAssistantProps = {
  onCommand: (command: string) => Promise<string> | string;
};

function getRecognitionConstructor() {
  const browserWindow = window as Window & {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  };
  return browserWindow.SpeechRecognition || browserWindow.webkitSpeechRecognition;
}

export default function VoiceAssistant({ onCommand }: VoiceAssistantProps) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [message, setMessage] = useState("Ask about backlog, promotion, simulation, or notifications.");
  const [commandInput, setCommandInput] = useState("");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const activeRef = useRef(false);
  const speakingRef = useRef(false);
  const commandInFlightRef = useRef(false);
  const restartTimerRef = useRef<number | null>(null);

  useEffect(() => () => {
    activeRef.current = false;
    speakingRef.current = false;
    commandInFlightRef.current = false;
    if (restartTimerRef.current !== null) window.clearTimeout(restartTimerRef.current);
    recognitionRef.current?.stop();
    window.speechSynthesis?.cancel();
  }, []);

  const startRecognition = () => {
    const recognition = recognitionRef.current;
    if (!recognition || !activeRef.current || speakingRef.current) return;
    try {
      recognition.start();
    } catch (error) {
      if (error instanceof DOMException && error.name === "InvalidStateError") return;
      setMessage("Restarting listener...");
      if (restartTimerRef.current === null) {
        restartTimerRef.current = window.setTimeout(() => {
          restartTimerRef.current = null;
          startRecognition();
        }, 700);
      }
    }
  };

  const toggleListening = () => {
    const Recognition = getRecognitionConstructor();
    if (!Recognition) {
      setMessage("Voice commands are not supported here. Type a command below.");
      return;
    }
    if (listening) {
      activeRef.current = false;
      speakingRef.current = false;
      commandInFlightRef.current = false;
      if (restartTimerRef.current !== null) {
        window.clearTimeout(restartTimerRef.current);
        restartTimerRef.current = null;
      }
      recognitionRef.current?.stop();
      window.speechSynthesis?.cancel();
      setListening(false);
      setMessage("Voice assistant stopped.");
      return;
    }

    const recognition = new Recognition();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.continuous = true;
    recognition.onresult = (event) => {
      if (commandInFlightRef.current || speakingRef.current) return;
      const heard = Array.from(event.results)
        .slice(event.resultIndex)
        .map((result) => result[0]?.transcript || "")
        .join(" ")
        .trim();
      setTranscript(heard);
      void runCommand(heard);
    };
    recognition.onstart = () => setMessage("Listening. Say a command now...");
    recognition.onerror = (event) => {
      const reason = event.error === "not-allowed"
        ? "Microphone permission was denied."
        : event.error === "no-speech"
          ? "No speech was detected."
          : "The microphone could not be used.";
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        activeRef.current = false;
        setListening(false);
        setMessage(`${reason} You can type a command below.`);
      } else if (activeRef.current) {
        setMessage(`${reason} Restarting listener...`);
      }
    };
    recognition.onend = () => {
      if (!activeRef.current) {
        setListening(false);
        return;
      }
      if (speakingRef.current) {
        setMessage("Speaking response. Listener paused.");
        return;
      }
      setMessage("Restarting listener...");
      if (restartTimerRef.current === null) {
        restartTimerRef.current = window.setTimeout(() => {
          restartTimerRef.current = null;
          startRecognition();
        }, 350);
      }
    };
    recognitionRef.current = recognition;
    activeRef.current = true;
    setTranscript("");
    setMessage("Listening...");
    setListening(true);
    try {
      startRecognition();
    } catch {
      activeRef.current = false;
      setListening(false);
      setMessage("The microphone could not start. Type a command below.");
    }
  };

  const runCommand = async (command: string) => {
    const trimmed = command.trim();
    if (!trimmed || commandInFlightRef.current) return;
    commandInFlightRef.current = true;
    setTranscript(trimmed);

    if (activeRef.current && recognitionRef.current) {
      speakingRef.current = true;
      setMessage("Processing command. Listener paused.");
      recognitionRef.current.stop();
    }

    const resumeListening = () => {
      speakingRef.current = false;
      commandInFlightRef.current = false;
      if (activeRef.current) {
        setMessage("Restarting listener...");
        startRecognition();
      }
    };

    try {
      const response = await onCommand(trimmed);
      setMessage(response);
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(response);
        utterance.lang = "en-IN";
        utterance.rate = 0.9;
        utterance.onend = resumeListening;
        utterance.onerror = resumeListening;
        window.speechSynthesis.speak(utterance);
      } else {
        resumeListening();
      }
    } catch {
      setMessage("That command could not be completed. Please try again.");
      resumeListening();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 w-[min(320px,calc(100vw-32px))] rounded-2xl border border-indigo-200 bg-white/95 p-3 shadow-2xl backdrop-blur">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggleListening}
          aria-label={listening ? "Stop listening" : "Start voice assistant"}
          className={`grid h-12 w-12 shrink-0 place-items-center rounded-full text-white transition ${listening ? "bg-rose-500 shadow-lg shadow-rose-300" : "bg-indigo-600 hover:bg-indigo-700"}`}
        >
          {listening ? <MicOff size={20} /> : <Mic size={20} />}
        </button>
        <span className="sr-only">{listening ? "Stop listening" : "Start Voice Assistant"}</span>
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-700">
            <Volume2 size={13} /> {listening ? "Listening..." : "Start Voice Assistant"}
            {listening && <span className="voice-wave" aria-label="Listening" />}
          </div>
          <p className="mt-1 truncate text-xs text-slate-600">{message}</p>
          {transcript && <p className="mt-1 truncate text-[11px] font-medium text-slate-400">“{transcript}”</p>}
        </div>
      </div>
      <form
        className="mt-3 flex gap-2 border-t border-slate-100 pt-3"
        onSubmit={(event) => {
          event.preventDefault();
          void runCommand(commandInput);
          setCommandInput("");
        }}
      >
        <input
          value={commandInput}
          onChange={(event) => setCommandInput(event.target.value)}
          placeholder="Type a voice command"
          aria-label="Type a voice command"
          className="min-w-0 flex-1 rounded-lg border border-slate-200 px-2.5 py-2 text-xs text-slate-700 outline-none focus:border-indigo-400"
        />
        <button type="submit" className="rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700">
          Run
        </button>
      </form>
    </div>
  );
}
