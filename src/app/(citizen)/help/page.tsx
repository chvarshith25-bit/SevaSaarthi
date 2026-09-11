"use client";

import React, { useState } from "react";
import { HelpCircle, Headphones, MessageSquare, BookOpen, ExternalLink, Send } from "lucide-react";
import { toast } from "sonner";

export default function HelpPage() {
  const [query, setQuery] = useState("");

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    toast.success("Support ticket created! An advisor will reach out to you within 30 minutes.");
    setQuery("");
  };

  return (
    <div className="space-y-6 pb-16">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
          <HelpCircle className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Help & Support</h1>
          <p className="text-xs text-slate-500">Get guidance on government scheme applications, missing documents, and certificate procedures.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Headphones className="w-6 h-6" />
          </div>
          <h2 className="text-sm font-bold text-slate-900">Book a Free Guidance Call</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Need help obtaining an Income Certificate or Bonafide? Our scheme specialists can walk you through the exact Mandal Tahsildar or college registrar procedures.
          </p>

          <form onSubmit={handleSend} className="space-y-3 pt-2">
            <textarea
              rows={3}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Describe what certificate or portal issue you need help with..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 resize-none"
            />
            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Request</span>
            </button>
          </form>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
          <h2 className="text-sm font-bold text-slate-900">Official Portal FAQs</h2>
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="font-bold text-slate-800 mb-1">How does Seva Saarthi extract fields from Aadhaar?</div>
              <div className="text-slate-500 leading-relaxed text-[11px]">
                Seva Saarthi uses managed OCR to detect Name, DOB, UID, and address, then presents them for your confirmation before adding them to your verified profile.
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="font-bold text-slate-800 mb-1">Does Seva Saarthi submit the application automatically?</div>
              <div className="text-slate-500 leading-relaxed text-[11px]">
                No. Seva Saarthi is a preparation and guidance layer. Once 100% satisfied, you apply directly on the official portal (e.g. scholarships.gov.in) with zero guesswork.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
