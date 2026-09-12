"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Mic,
  MicOff,
  X,
  Sparkles,
  Volume2,
  ArrowRight,
  Search,
  FileCheck2,
  FolderOpen,
  User,
  HelpCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { useSevaSaarthi } from "@/lib/store/formly-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface SaarthiVoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string;
}

export function SaarthiVoiceAssistantModal({
  isOpen,
  onClose,
  initialPrompt = "",
}: SaarthiVoiceAssistantModalProps) {
  const router = useRouter();
  const { currentLanguage, easyMode, t } = useSevaSaarthi();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState(initialPrompt);
  const [responseMessage, setResponseMessage] = useState<string | null>(null);
  const [detectedAction, setDetectedAction] = useState<{
    label: string;
    url: string;
    icon: React.ElementType;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Language mapping for Web Speech API
  const getLanguageCode = () => {
    switch (currentLanguage) {
      case "hi":
        return "hi-IN";
      case "te":
        return "te-IN";
      case "mr":
        return "mr-IN";
      case "ta":
        return "ta-IN";
      case "kn":
        return "kn-IN";
      default:
        return "en-IN";
    }
  };

  useEffect(() => {
    if (initialPrompt) {
      setTranscript(initialPrompt);
      processIntent(initialPrompt);
    }
  }, [initialPrompt]);

  useEffect(() => {
    if (typeof window !== "undefined" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = getLanguageCode();

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setResponseMessage("Listening to your voice... Speak now.");
      };

      recognitionRef.current.onresult = (event: any) => {
        const current = event.resultIndex;
        const text = event.results[current][0].transcript;
        setTranscript(text);
      };

      recognitionRef.current.onerror = (event: any) => {
        setIsListening(false);
        if (event.error === "no-speech") {
          setResponseMessage("No speech detected. Please tap the mic and try again.");
        } else {
          setResponseMessage("Microphone error. You can also type your request below.");
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, [currentLanguage]);

  const startListening = () => {
    setResponseMessage(null);
    setDetectedAction(null);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.lang = getLanguageCode();
        recognitionRef.current.start();
      } catch {
        recognitionRef.current.stop();
        setTimeout(() => {
          recognitionRef.current.start();
        }, 150);
      }
    } else {
      toast.info("Speech recognition not supported in this browser. Please type your query below.");
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const processIntent = (queryText: string) => {
    const q = queryText.toLowerCase().trim();
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);

      if (q.includes("scholarship") || q.includes("nsp") || q.includes("matric")) {
        setResponseMessage("Opening your Scholarship application status and readiness requirements.");
        setDetectedAction({
          label: "View Post-Matric Scholarship",
          url: "/track/NSP-2026-8812",
          icon: FileCheck2,
        });
      } else if (q.includes("kisan") || q.includes("pm kisan") || q.includes("farmer") || q.includes("agriculture")) {
        setResponseMessage("Found PM-Kisan Samman Nidhi scheme. Showing eligibility and required documents.");
        setDetectedAction({
          label: "Apply for PM Kisan (₹6,000/yr)",
          url: "/checklist?service=s004",
          icon: Sparkles,
        });
      } else if (q.includes("pan") || q.includes("tax") || q.includes("49a")) {
        setResponseMessage("Found Instant e-PAN card application service.");
        setDetectedAction({
          label: "Check PAN Card Application",
          url: "/applications/PAN-2026-0001/status",
          icon: FileCheck2,
        });
      } else if (q.includes("aadhaar") || q.includes("document") || q.includes("vault") || q.includes("upload") || q.includes("certificate")) {
        setResponseMessage("Opening your secure Document Vault with DigiLocker verified files.");
        setDetectedAction({
          label: "Open Document Vault",
          url: "/vault",
          icon: FolderOpen,
        });
      } else if (q.includes("profile") || q.includes("edit") || q.includes("name") || q.includes("phone")) {
        setResponseMessage("Opening your verified Citizen Profile to view or edit details.");
        setDetectedAction({
          label: "Open My Profile",
          url: "/profile",
          icon: User,
        });
      } else if (q.includes("help") || q.includes("support") || q.includes("call") || q.includes("agent")) {
        setResponseMessage("Connecting you to Citizen Help & Support specialists.");
        setDetectedAction({
          label: "Get Official Help",
          url: "/help",
          icon: HelpCircle,
        });
      } else if (q.includes("apply") || q.includes("scheme") || q.includes("service")) {
        setResponseMessage("Opening Discover Services to explore all central and state schemes.");
        setDetectedAction({
          label: "Discover 50+ Schemes",
          url: "/discover",
          icon: Search,
        });
      } else {
        setResponseMessage(`I understood: "${queryText}". Let's search all government schemes for this.`);
        setDetectedAction({
          label: "Search Schemes",
          url: `/discover?q=${encodeURIComponent(queryText)}`,
          icon: Search,
        });
      }
    }, 400);
  };

  const handleExecuteAction = () => {
    if (detectedAction) {
      router.push(detectedAction.url);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 select-none">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center text-white shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base">Seva Saarthi Voice Assistant</h2>
              <p className="text-xs text-blue-100">Ask in English, Hindi, Telugu, or your local language</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-center">
          {/* Animated Mic Button */}
          <div className="flex justify-center my-2">
            <button
              type="button"
              onClick={isListening ? stopListening : startListening}
              className={cn(
                "w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl cursor-pointer relative",
                isListening
                  ? "bg-rose-600 text-white scale-110 shadow-rose-500/30 animate-pulse ring-8 ring-rose-100"
                  : "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/30 hover:scale-105"
              )}
            >
              {isListening ? <MicOff className="w-10 h-10" /> : <Mic className="w-10 h-10" />}
              {isListening && (
                <span className="absolute -bottom-2 px-2.5 py-0.5 rounded-full bg-slate-900 text-white text-[10px] font-bold">
                  Listening...
                </span>
              )}
            </button>
          </div>

          <p className="text-xs font-semibold text-slate-500">
            {isListening ? "Listening... Speak your request clearly" : "Tap the microphone to speak, or select a quick topic below"}
          </p>

          {/* Transcript / Input Box */}
          <div className="space-y-2">
            <div className="relative">
              <input
                type="text"
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && transcript.trim()) {
                    processIntent(transcript);
                  }
                }}
                placeholder="e.g. Track my scholarship, Apply for PM Kisan..."
                className="w-full pl-4 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all min-h-[48px]"
              />
              <button
                type="button"
                onClick={() => transcript.trim() && processIntent(transcript)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors cursor-pointer"
                title="Search"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Response / Action Card */}
          {isProcessing ? (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-center gap-2 text-xs font-bold text-slate-600">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span>Analyzing government services...</span>
            </div>
          ) : (
            responseMessage && (
              <div className="p-4 bg-blue-50/80 rounded-2xl border border-blue-200 text-left space-y-3">
                <div className="flex items-start gap-2.5">
                  <Volume2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-950 font-medium leading-relaxed">
                    {responseMessage}
                  </p>
                </div>

                {detectedAction && (
                  <button
                    type="button"
                    onClick={handleExecuteAction}
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 flex items-center justify-between transition-all cursor-pointer min-h-[48px]"
                  >
                    <div className="flex items-center gap-2">
                      <detectedAction.icon className="w-4 h-4" />
                      <span>{detectedAction.label}</span>
                    </div>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            )
          )}

          {/* Quick Voice Chips */}
          <div className="pt-2 border-t border-slate-100 text-left">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Or Choose a Quick Action
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Track Scholarship", query: "Track My Scholarship" },
                { label: "Apply for PM Kisan", query: "Apply for PM Kisan" },
                { label: "My Aadhaar Card", query: "My Aadhaar Card" },
                { label: "Get Help & Call", query: "Get Help" },
              ].map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => {
                    setTranscript(chip.query);
                    processIntent(chip.query);
                  }}
                  className="p-2.5 text-left bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:text-blue-700 transition-colors flex items-center gap-2 min-h-[44px] cursor-pointer"
                >
                  <span className="text-sm">🎙️</span>
                  <span className="truncate">{chip.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
