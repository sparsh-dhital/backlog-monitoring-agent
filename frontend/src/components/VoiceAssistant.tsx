import { useEffect, useRef, useState } from "react";
import {
  CircleAlert,
  Info,
  Mic,
  MicOff,
  SendHorizontal,
  Sparkles,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { api } from "../api";
import type { UserRole } from "../types/roles";
import { voiceSuggestions } from "../shared/voiceCommands";
import "../styles/voice-assistant.css";

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
  maxAlternatives: number;
  onresult: ((event: RecognitionResultEvent) => void) | null;
  onaudiostart: (() => void) | null;
  onspeechstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: RecognitionErrorEvent) => void) | null;
  start: () => void;
  abort: () => void;
}

type RecognitionConstructor = new () => SpeechRecognitionLike;

type Status =
  | "idle"
  | "starting"
  | "listening"
  | "hearing"
  | "transcribing"
  | "thinking"
  | "speaking";

/** "cloud": record the mic and transcribe with Whisper. "browser": Web Speech API. */
type Engine = "cloud" | "browser";

type ChatMessage = { id: number; from: "user" | "assistant"; text: string };

type Notice = { text: string; tone: "error" | "info" } | null;

type VoiceAssistantProps = {
  role: UserRole;
  onCommand: (command: string) => Promise<string> | string;
};

const STOP_PHRASE = /^(stop|stop listening|goodbye|bye|that'?s all|cancel)[.!]?$/i;
const VOICE_REPLIES_KEY = "edurecover-voice-replies";
const DEVANAGARI = /[ऀ-ॿ]/;

// Browser engine limits.
const MAX_NETWORK_RETRIES = 2;
const MAX_FAILED_STARTS = 3;

// Voice-activity detection for the recorded engine.
const MONITOR_MS = 50;
const END_OF_SPEECH_MS = 900;
const MIN_SPEECH_MS = 250;
const MAX_TAKE_MS = 15000;
const IDLE_TAKE_MS = 12000;
const RECORDER_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/ogg;codecs=opus",
  "audio/mp4",
];
/** Whisper's usual output for a cough or a click; ignored when the sound was brief. */
const FILLER = /^(thank you|thanks|thanks for watching|you|bye)[.!]*$/i;
/** Timestamps for capture timing; only ever called from event and timer callbacks. */
const clock = () => performance.now();

const statusLabel: Record<Status, string> = {
  idle: "Mic off",
  starting: "Starting microphone...",
  listening: "Listening...",
  hearing: "Hearing you...",
  transcribing: "Transcribing...",
  thinking: "Thinking...",
  speaking: "Speaking...",
};

const BLOCKED_MIC =
  "Microphone access is blocked. Click the icon at the left of the address bar, allow the microphone for this site, then press the mic again.";
const NO_MIC =
  "No microphone was found. Connect one or choose an input device in your system sound settings, then try again.";
const NO_VOICE_INPUT =
  "Voice input isn't available in this browser. Type your request below.";
const NOT_HEARING =
  "I can't hear anything from your microphone. Check it isn't muted and is the selected input device, or type your request below.";
const NOT_HEARING_BROWSER =
  "I'm not hearing you. This browser's speech recognition listens to your system's default microphone - check that device in your sound settings, or type your request below.";
const BROWSER_FALLBACK =
  "Cloud transcription isn't available right now, so I switched to this browser's speech recognition. Please say that again.";
const SPEECH_SERVICE_UNREACHABLE =
  "The speech recognition service couldn't be reached. Check your internet connection, or type your request below.";
const RECOGNITION_DID_NOT_START =
  "Speech recognition didn't start in this browser. Use Google Chrome or Microsoft Edge, or type your request below.";

function getRecognitionConstructor() {
  const browserWindow = window as Window & {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  };
  return browserWindow.SpeechRecognition || browserWindow.webkitSpeechRecognition;
}

function canRecordAudio() {
  return typeof MediaRecorder !== "undefined" && typeof AudioContext !== "undefined";
}

function pickVoice(voices: SpeechSynthesisVoice[], language: "en" | "hi") {
  return (
    voices.find((voice) => voice.lang === `${language}-IN`) ??
    voices.find((voice) => voice.lang.startsWith(language) && voice.localService) ??
    voices.find((voice) => voice.lang.startsWith(language)) ??
    null
  );
}

function readVoiceReplies() {
  try {
    return localStorage.getItem(VOICE_REPLIES_KEY) !== "off";
  } catch {
    return true;
  }
}

export default function VoiceAssistant({ role, onCommand }: VoiceAssistantProps) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [sessionOn, setSessionOn] = useState(false);
  const [engine, setEngine] = useState<Engine>("cloud");
  const [interim, setInterim] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [notice, setNotice] = useState<Notice>(null);
  const [input, setInput] = useState("");
  const [voiceReplies, setVoiceReplies] = useState(readVoiceReplies);

  // Capture callbacks outlive the render that created them, so anything they
  // read that can change lives in a ref.
  const onCommandRef = useRef(onCommand);
  const voiceRepliesRef = useRef(voiceReplies);
  const sessionRef = useRef(false);
  const startingRef = useRef(false);
  const busyRef = useRef(false);
  const engineRef = useRef<Engine>("cloud");
  const cloudFailedRef = useRef(false);
  // Browser engine
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const languageRef = useRef("en-IN");
  const networkRetriesRef = useRef(0);
  const failedStartsRef = useRef(0);
  const silentRoundsRef = useRef(0);
  const restartTimerRef = useRef<number | null>(null);
  // Recorded engine
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const monitorRef = useRef<number | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const takeRef = useRef({ startedAt: 0, speechAt: 0, lastVoiceAt: 0 });
  const meterRef = useRef<HTMLSpanElement>(null);
  // Output and conversation
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const messageIdRef = useRef(0);
  const conversationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onCommandRef.current = onCommand;
  }, [onCommand]);

  useEffect(() => {
    voiceRepliesRef.current = voiceReplies;
    try {
      localStorage.setItem(VOICE_REPLIES_KEY, voiceReplies ? "on" : "off");
    } catch {
      // Storage can be unavailable (private mode); the toggle still works for this visit.
    }
  }, [voiceReplies]);

  useEffect(() => {
    const conversation = conversationRef.current;
    if (conversation) conversation.scrollTop = conversation.scrollHeight;
  }, [messages, interim, status]);

  useEffect(() => {
    // Chrome loads synthesis voices lazily; ask early so the first reply has one.
    window.speechSynthesis?.getVoices();
    return () => {
      sessionRef.current = false;
      if (restartTimerRef.current !== null) window.clearTimeout(restartTimerRef.current);
      if (monitorRef.current !== null) window.clearInterval(monitorRef.current);
      recognitionRef.current?.abort();
      const recorder = recorderRef.current;
      if (recorder) {
        recorder.ondataavailable = null;
        recorder.onstop = null;
        if (recorder.state !== "inactive") recorder.stop();
      }
      void audioContextRef.current?.close().catch(() => undefined);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      window.speechSynthesis?.cancel();
    };
  }, []);

  const showNotice = (text: string, tone: "error" | "info" = "error") =>
    setNotice(text ? { text, tone } : null);

  const addMessage = (from: ChatMessage["from"], text: string) => {
    messageIdRef.current += 1;
    const id = messageIdRef.current;
    setMessages((current) => [...current.slice(-29), { id, from, text }]);
  };

  const speak = (text: string) =>
    new Promise<void>((resolve) => {
      const synth = window.speechSynthesis;
      if (!voiceRepliesRef.current || !synth) {
        resolve();
        return;
      }
      const hindi = DEVANAGARI.test(text);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = hindi ? "hi-IN" : "en-IN";
      utterance.voice = pickVoice(synth.getVoices(), hindi ? "hi" : "en");
      let finished = false;
      const finish = () => {
        if (finished) return;
        finished = true;
        window.clearTimeout(watchdog);
        utteranceRef.current = null;
        resolve();
      };
      // Chrome sometimes never fires onend; don't let that freeze the microphone.
      const watchdog = window.setTimeout(finish, 4000 + text.length * 90);
      utterance.onend = finish;
      utterance.onerror = finish;
      // Holding a reference stops Chrome from garbage-collecting it mid-sentence.
      utteranceRef.current = utterance;
      setStatus("speaking");
      if (synth.speaking || synth.pending) synth.cancel();
      synth.speak(utterance);
    });

  /* ── Recorded engine: level monitor + one MediaRecorder take per request ── */

  const discardTake = () => {
    const recorder = recorderRef.current;
    recorderRef.current = null;
    if (recorder) {
      recorder.ondataavailable = null;
      recorder.onstop = null;
      if (recorder.state !== "inactive") recorder.stop();
    }
    chunksRef.current = [];
  };

  const stopCapture = () => {
    if (monitorRef.current !== null) {
      window.clearInterval(monitorRef.current);
      monitorRef.current = null;
    }
    discardTake();
    void audioContextRef.current?.close().catch(() => undefined);
    audioContextRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  const beginTake = () => {
    const stream = streamRef.current;
    if (!stream || !sessionRef.current || busyRef.current || recorderRef.current) return;
    const mimeType = RECORDER_TYPES.find((type) => MediaRecorder.isTypeSupported(type));
    const recorder = mimeType
      ? new MediaRecorder(stream, { mimeType })
      : new MediaRecorder(stream);
    chunksRef.current = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.start(250);
    recorderRef.current = recorder;
    takeRef.current = { startedAt: clock(), speechAt: 0, lastVoiceAt: 0 };
    setStatus("listening");
  };

  const finishTake = () => {
    const recorder = recorderRef.current;
    if (!recorder) return;
    recorderRef.current = null;
    const speechMs = takeRef.current.lastVoiceAt - takeRef.current.speechAt;
    busyRef.current = true;
    setStatus("transcribing");
    recorder.onstop = () => {
      const audio = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
      chunksRef.current = [];
      void transcribeTake(audio, speechMs);
    };
    recorder.stop();
  };

  const transcribeTake = async (audio: Blob, speechMs: number) => {
    if (!sessionRef.current) {
      busyRef.current = false;
      setStatus("idle");
      return;
    }
    if (speechMs < MIN_SPEECH_MS) {
      busyRef.current = false;
      beginTake();
      return;
    }
    let text: string;
    try {
      text = (await api.transcribe(audio)).text.trim();
    } catch {
      busyRef.current = false;
      if (!sessionRef.current) {
        setStatus("idle");
        return;
      }
      // Transcription is unreachable (offline, no API key): keep the session
      // alive on the browser's own recognizer instead.
      cloudFailedRef.current = true;
      stopCapture();
      if (getRecognitionConstructor()) {
        engineRef.current = "browser";
        setEngine("browser");
        showNotice(BROWSER_FALLBACK, "info");
        listen();
      } else {
        endSession(NO_VOICE_INPUT);
      }
      return;
    }
    busyRef.current = false;
    if (!sessionRef.current) {
      setStatus("idle");
      return;
    }
    if (!text || (speechMs < 900 && FILLER.test(text))) {
      beginTake();
      return;
    }
    void runCommand(text);
  };

  const startMonitor = (stream: MediaStream) => {
    streamRef.current = stream;
    const context = new AudioContext();
    void context.resume().catch(() => undefined);
    const analyser = context.createAnalyser();
    analyser.fftSize = 1024;
    context.createMediaStreamSource(stream).connect(analyser);
    audioContextRef.current = context;
    const samples = new Float32Array(analyser.fftSize);
    const sessionStart = clock();
    let noiseFloor = 0.008;
    let heardSound = false;

    monitorRef.current = window.setInterval(() => {
      analyser.getFloatTimeDomainData(samples);
      let energy = 0;
      for (let index = 0; index < samples.length; index += 1) {
        energy += samples[index] * samples[index];
      }
      const level = Math.sqrt(energy / samples.length);
      // Adaptive gate: a few times the room's noise floor, within sane bounds.
      const threshold = Math.min(0.09, Math.max(0.012, noiseFloor * 3.2));
      // Written straight to the DOM: no React render per audio frame.
      meterRef.current?.style.setProperty(
        "--va-level",
        Math.min(1, level / (threshold * 3)).toFixed(2),
      );
      if (busyRef.current || !recorderRef.current) return;

      const now = performance.now();
      const take = takeRef.current;
      if (level > threshold) {
        if (!heardSound) {
          heardSound = true;
          setNotice((current) => (current?.text === NOT_HEARING ? null : current));
        }
        if (!take.speechAt) {
          take.speechAt = now;
          setStatus("hearing");
        }
        take.lastVoiceAt = now;
      } else if (!take.speechAt) {
        noiseFloor = noiseFloor * 0.97 + level * 0.03;
      }

      if (take.speechAt) {
        if (now - take.lastVoiceAt > END_OF_SPEECH_MS || now - take.speechAt > MAX_TAKE_MS) {
          finishTake();
        }
      } else if (now - take.startedAt > IDLE_TAKE_MS) {
        // Keep idle recordings short; start a fresh take.
        discardTake();
        beginTake();
        if (!heardSound && now - sessionStart > IDLE_TAKE_MS) showNotice(NOT_HEARING, "info");
      }
    }, MONITOR_MS);
  };

  /* ── Session control ── */

  const endSession = (message = "", tone: "error" | "info" = "error") => {
    sessionRef.current = false;
    setSessionOn(false);
    if (restartTimerRef.current !== null) {
      window.clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
    const recognition = recognitionRef.current;
    recognitionRef.current = null;
    recognition?.abort();
    stopCapture();
    window.speechSynthesis?.cancel();
    setInterim("");
    showNotice(message, tone);
    if (!busyRef.current) setStatus("idle");
  };

  const scheduleListen = (delay: number) => {
    if (restartTimerRef.current !== null) window.clearTimeout(restartTimerRef.current);
    restartTimerRef.current = window.setTimeout(() => {
      restartTimerRef.current = null;
      listen();
    }, delay);
  };

  /* ── Browser engine: one fresh recognizer per phrase ── */

  const listen = () => {
    const Recognition = getRecognitionConstructor();
    if (!Recognition || !sessionRef.current || busyRef.current || recognitionRef.current) {
      return;
    }
    const recognition = new Recognition();
    recognition.lang = languageRef.current;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    let heard = "";
    let failure: string | undefined;
    let started = false;

    recognition.onaudiostart = () => {
      started = true;
      failedStartsRef.current = 0;
      if (recognitionRef.current === recognition) setStatus("listening");
    };
    recognition.onspeechstart = () => {
      if (recognitionRef.current === recognition) setStatus("hearing");
    };
    recognition.onresult = (event) => {
      if (recognitionRef.current !== recognition) return;
      let finalText = "";
      let pendingText = "";
      for (const result of Array.from(event.results)) {
        if (result.isFinal) finalText += result[0]?.transcript ?? "";
        else pendingText += result[0]?.transcript ?? "";
      }
      heard = `${finalText} ${pendingText}`.trim();
      networkRetriesRef.current = 0;
      silentRoundsRef.current = 0;
      setNotice((current) => (current?.text === NOT_HEARING_BROWSER ? null : current));
      setInterim(heard);
      setStatus("hearing");
    };
    recognition.onerror = (event) => {
      failure = event.error;
    };
    recognition.onend = () => {
      if (recognitionRef.current !== recognition) return;
      recognitionRef.current = null;
      // Use the last transcript even if the engine never marked it final.
      if (heard) {
        void runCommand(heard);
        return;
      }
      setInterim("");
      if (failure === "not-allowed") return endSession(BLOCKED_MIC);
      if (failure === "service-not-allowed") return endSession(RECOGNITION_DID_NOT_START);
      if (failure === "audio-capture") return endSession(NO_MIC);
      if (failure === "language-not-supported") languageRef.current = "en-US";
      if (failure === "no-speech") {
        silentRoundsRef.current += 1;
        if (silentRoundsRef.current === 2) showNotice(NOT_HEARING_BROWSER, "info");
      }
      if (failure === "network") {
        networkRetriesRef.current += 1;
        if (networkRetriesRef.current > MAX_NETWORK_RETRIES) {
          return endSession(SPEECH_SERVICE_UNREACHABLE);
        }
      }
      if (!started) {
        failedStartsRef.current += 1;
        if (failedStartsRef.current > MAX_FAILED_STARTS) {
          return endSession(RECOGNITION_DID_NOT_START);
        }
      }
      setStatus("listening");
      scheduleListen(failure === "network" || !started ? 700 : 150);
    };

    recognitionRef.current = recognition;
    setStatus("starting");
    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
      scheduleListen(700);
      return;
    }
    // Some browsers accept start() but never open the microphone; retry, then say so.
    window.setTimeout(() => {
      if (started || recognitionRef.current !== recognition) return;
      recognitionRef.current = null;
      recognition.abort();
      failedStartsRef.current += 1;
      if (failedStartsRef.current > MAX_FAILED_STARTS) endSession(RECOGNITION_DID_NOT_START);
      else scheduleListen(700);
    }, 8000);
  };

  const startSession = async () => {
    setOpen(true);
    if (sessionRef.current || startingRef.current) return;
    const recordable = canRecordAudio() && !cloudFailedRef.current;
    if (!recordable && !getRecognitionConstructor()) {
      showNotice(NO_VOICE_INPUT);
      return;
    }
    if (!window.isSecureContext || !navigator.mediaDevices) {
      showNotice(
        `The microphone only works on https or localhost. Open http://localhost:${window.location.port || "5173"} instead.`,
      );
      return;
    }
    showNotice("");
    startingRef.current = true;
    if (!busyRef.current) setStatus("starting");
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
    } catch (error) {
      startingRef.current = false;
      if (!busyRef.current) setStatus("idle");
      const name = error instanceof DOMException ? error.name : "";
      showNotice(
        name === "NotFoundError"
          ? NO_MIC
          : name === "NotReadableError"
            ? "Another app is using the microphone. Close it and press the mic again."
            : BLOCKED_MIC,
      );
      return;
    }
    startingRef.current = false;
    sessionRef.current = true;
    setSessionOn(true);
    networkRetriesRef.current = 0;
    failedStartsRef.current = 0;
    silentRoundsRef.current = 0;
    if (recordable) {
      engineRef.current = "cloud";
      setEngine("cloud");
      startMonitor(stream);
      beginTake();
    } else {
      stream.getTracks().forEach((track) => track.stop());
      engineRef.current = "browser";
      setEngine("browser");
      listen();
    }
  };

  const runCommand = async (raw: string) => {
    const text = raw.trim();
    if (!text || busyRef.current) return;
    setInterim("");
    addMessage("user", text);
    if (STOP_PHRASE.test(text)) {
      endSession();
      addMessage("assistant", "Okay, I've stopped listening.");
      return;
    }
    busyRef.current = true;
    // Pause capture so the microphone doesn't hear the spoken reply.
    discardTake();
    const recognition = recognitionRef.current;
    recognitionRef.current = null;
    recognition?.abort();
    setStatus("thinking");
    let reply: string;
    try {
      reply = await onCommandRef.current(text);
    } catch {
      reply = "Sorry, that didn't work. Please try again.";
    }
    addMessage("assistant", reply);
    await speak(reply);
    busyRef.current = false;
    if (!sessionRef.current) setStatus("idle");
    else if (engineRef.current === "cloud") beginTake();
    else listen();
  };

  const closePanel = () => {
    endSession();
    setOpen(false);
  };

  const toggleMic = () => {
    if (sessionOn) endSession();
    else void startSession();
  };

  const live = status === "listening" || status === "hearing";

  return (
    <div className="va-root" data-voice-assistant data-engine={engine}>
      {open && (
        <section
          className="va-panel"
          aria-label="Voice assistant"
          onKeyDown={(event) => {
            if (event.key === "Escape") closePanel();
          }}
        >
          <header className="va-header">
            <span className={`va-orb va-orb-${status}`} aria-hidden="true">
              <Sparkles size={17} />
            </span>
            <div className="va-title">
              <strong>EduRecover Assistant</strong>
              <span className={`va-status va-status-${status}`}>
                {live && engine === "cloud" ? (
                  <span className="va-meter" ref={meterRef} aria-hidden="true">
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                  </span>
                ) : live ? (
                  <span className="va-bars" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                    <i />
                  </span>
                ) : (
                  <i />
                )}
                {statusLabel[status]}
              </span>
            </div>
            <button
              type="button"
              className="va-icon-button"
              onClick={() => setVoiceReplies((current) => !current)}
              aria-pressed={voiceReplies}
              aria-label={voiceReplies ? "Mute spoken replies" : "Speak replies aloud"}
              title={voiceReplies ? "Mute spoken replies" : "Speak replies aloud"}
            >
              {voiceReplies ? <Volume2 size={17} /> : <VolumeX size={17} />}
            </button>
            <button
              type="button"
              className="va-icon-button"
              onClick={closePanel}
              aria-label="Close voice assistant"
              title="Close"
            >
              <X size={17} />
            </button>
          </header>

          <div className="va-conversation" ref={conversationRef} aria-live="polite">
            {messages.length === 0 && (
              <div className="va-welcome">
                <p className="va-welcome-title">Hi! How can I help?</p>
                <p>
                  Talk to me naturally, in English or Hindi. I can open pages,
                  find students, answer questions about backlogs, and more.
                </p>
                <div className="va-suggestions">
                  {voiceSuggestions[role].map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => void runCommand(suggestion)}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((message) => (
              <p key={message.id} className={`va-bubble va-bubble-${message.from}`}>
                {message.text}
              </p>
            ))}
            {interim && <p className="va-bubble va-bubble-user va-bubble-interim">{interim}</p>}
            {(status === "thinking" || status === "transcribing") && (
              <p
                className="va-bubble va-bubble-assistant va-typing"
                aria-label={status === "thinking" ? "Thinking" : "Transcribing"}
              >
                <i />
                <i />
                <i />
              </p>
            )}
          </div>

          {notice && (
            <div
              className={`va-notice${notice.tone === "info" ? " is-info" : ""}`}
              role={notice.tone === "error" ? "alert" : "status"}
            >
              {notice.tone === "info" ? <Info size={16} /> : <CircleAlert size={16} />}
              <span>{notice.text}</span>
            </div>
          )}

          <footer className="va-footer">
            <button
              type="button"
              onClick={toggleMic}
              className={`va-mic${sessionOn ? " is-on" : ""}${live ? " is-live" : ""}`}
              aria-pressed={sessionOn}
              aria-label={sessionOn ? "Stop listening" : "Start listening"}
              title={sessionOn ? "Stop listening" : "Start listening"}
            >
              {sessionOn ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
            <form
              className="va-input"
              onSubmit={(event) => {
                event.preventDefault();
                void runCommand(input);
                setInput("");
              }}
            >
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={sessionOn ? "Speak, or type here" : "Type a request"}
                aria-label="Type a request for the assistant"
              />
              <button type="submit" aria-label="Send" disabled={!input.trim()}>
                <SendHorizontal size={16} />
              </button>
            </form>
          </footer>
        </section>
      )}

      <button
        type="button"
        className={`va-fab${sessionOn ? " is-on" : ""}${live ? " is-live" : ""}`}
        onClick={open ? closePanel : () => void startSession()}
        aria-expanded={open}
        aria-label={open ? "Close voice assistant" : "Open voice assistant"}
        title={open ? "Close voice assistant" : "Voice assistant"}
      >
        {open ? <X size={24} /> : <Mic size={24} />}
      </button>
    </div>
  );
}
