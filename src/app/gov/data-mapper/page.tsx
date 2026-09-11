"use client";

import React, { useState } from "react";
import {
  GitPullRequest,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Code,
  Copy,
  Check,
  Layers,
  Database,
  RefreshCw,
} from "lucide-react";
import { SYSTEM_SCHEMAS, mapToCanonical, mapFromCanonical } from "@/lib/server/data-mapper";
import { toast } from "sonner";

export default function DataMapperPage() {
  const [selectedSystem, setSelectedSystem] = useState("uidai");
  const [testPayload, setTestPayload] = useState(
    JSON.stringify(
      {
        full_name: "Sai Sankeerth",
        care_of: "S/O Suresh Kumar",
        date_of_birth: "23/07/2004",
        gender_code: "M",
        mobile_no: "+91-1234567890",
        email_id: "sankeerths615@gmail.com",
        uid: "1234 5678 9876",
        address_line: "H.No 4-12/A, Gandhi Nagar, Gachibowli",
        district: "Hyderabad",
        state_name: "Telangana",
        pin_code: "500081",
      },
      null,
      2
    )
  );
  const [normalizedOutput, setNormalizedOutput] = useState<any>(null);

  const activeSchema = SYSTEM_SCHEMAS[selectedSystem] || SYSTEM_SCHEMAS.uidai;

  const handleSystemChange = (sysKey: string) => {
    setSelectedSystem(sysKey);
    if (sysKey === "uidai") {
      setTestPayload(
        JSON.stringify(
          {
            full_name: "Sai Sankeerth",
            care_of: "S/O Suresh Kumar",
            date_of_birth: "23/07/2004",
            gender_code: "M",
            mobile_no: "+91-1234567890",
            email_id: "sankeerths615@gmail.com",
            uid: "1234 5678 9876",
            address_line: "H.No 4-12/A, Gandhi Nagar, Gachibowli",
            district: "Hyderabad",
            state_name: "Telangana",
            pin_code: "500081",
          },
          null,
          2
        )
      );
    } else if (sysKey === "nsdl_pan") {
      setTestPayload(
        JSON.stringify(
          {
            personName: "SAI SANKEERTH",
            parentName: "SURESH KUMAR",
            dob: "23-07-2004",
            sex: "MALE",
            phone: "1234567890",
            emailAddress: "sankeerths615@gmail.com",
            aadhaarRef: "123456789876",
            residentialAddress: "H.No 4-12/A, Gandhi Nagar, Gachibowli",
            cityTown: "Hyderabad",
            stateProvince: "Telangana",
            postalCode: "500081",
          },
          null,
          2
        )
      );
    } else if (sysKey === "digilocker") {
      setTestPayload(
        JSON.stringify(
          {
            candidate_name: "Sai Sankeerth",
            guardian_name: "Suresh Kumar",
            birth_date: "2004-07-23",
            gender: "Male",
            contact_number: "1234567890",
            user_email: "sankeerths615@gmail.com",
            aadhaar_id: "123456789876",
            permanent_address: "H.No 4-12/A, Gandhi Nagar, Gachibowli",
            locality: "Hyderabad",
            state: "Telangana",
            zip: "500081",
          },
          null,
          2
        )
      );
    }
    setNormalizedOutput(null);
  };

  const handleRunNormalization = () => {
    try {
      const parsed = JSON.parse(testPayload);
      const canonical = mapToCanonical(selectedSystem, parsed);
      setNormalizedOutput(canonical);
      toast.success("Successfully normalized payload to Formly Canonical Schema!");
    } catch (err: any) {
      toast.error(`JSON Parse or mapping error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold mb-2">
            <GitPullRequest className="w-3.5 h-3.5 text-amber-600" />
            <span>Semantic Translation Engine</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            GOVERNMENT DATA MAPPER
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Normalizing disparate state & central department schema vocabularies into Formly Canonical Model.
          </p>
        </div>

        {/* System Selector Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl">
          {Object.keys(SYSTEM_SCHEMAS).map((key) => {
            const sch = SYSTEM_SCHEMAS[key];
            const isSelected = selectedSystem === key;
            return (
              <button
                key={key}
                onClick={() => handleSystemChange(key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isSelected
                    ? "bg-white text-slate-950 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {key === "uidai" ? "UIDAI (Aadhaar)" : key === "nsdl_pan" ? "Income Tax / NSDL" : key === "digilocker" ? "DigiLocker" : "India Post"}
              </button>
            );
          })}
        </div>
      </div>

      {/* Schema Mapping Dictionary Table */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              {activeSchema.systemName} ➔ Formly Canonical
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Protocol: {activeSchema.protocol} • Spec: {activeSchema.version} • {activeSchema.organization}
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
            {activeSchema.rules.length} mapped fields
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="pb-3">Source Field (External Department)</th>
                <th className="pb-3">Formly Canonical Field</th>
                <th className="pb-3">Source Data Type</th>
                <th className="pb-3">Transformation Function</th>
                <th className="pb-3">Semantic Purpose</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {activeSchema.rules.map((rule) => (
                <tr key={rule.sourceField} className="hover:bg-slate-50/80">
                  <td className="py-3 font-mono font-bold text-indigo-700">
                    {rule.sourceField}
                  </td>
                  <td className="py-3">
                    <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      {rule.canonicalField}
                    </span>
                  </td>
                  <td className="py-3 text-slate-500 font-mono text-[11px]">
                    {rule.dataType}
                  </td>
                  <td className="py-3 text-slate-700 text-[11px]">
                    {rule.transformation}
                  </td>
                  <td className="py-3 text-slate-500 text-[11px]">
                    {rule.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Live Normalizer Tool */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-bold text-slate-900">INTERACTIVE LIVE TRANSLATION PLAYGROUND</h2>
          </div>
          <button
            onClick={handleRunNormalization}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Execute Schema Mapping</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left: Raw Department JSON Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span>Raw Payload from {activeSchema.systemName}:</span>
              <span className="text-[10px] text-slate-400 font-normal">Editable JSON</span>
            </div>
            <textarea
              value={testPayload}
              onChange={(e) => setTestPayload(e.target.value)}
              rows={13}
              className="w-full font-mono text-xs p-3.5 bg-slate-900 text-amber-300 rounded-2xl border border-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 leading-relaxed"
            />
          </div>

          {/* Right: Normalized Formly Canonical Output */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span>Normalized Formly Canonical Record:</span>
              <span className="text-[10px] text-emerald-600 font-bold">Standardized Across All Services</span>
            </div>
            <div className="w-full font-mono text-xs p-3.5 bg-slate-900 text-emerald-300 rounded-2xl border border-slate-800 min-h-[280px] overflow-auto leading-relaxed">
              {normalizedOutput ? (
                <pre>{JSON.stringify(normalizedOutput, null, 2)}</pre>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs py-20">
                  <Database className="w-8 h-8 mb-2 opacity-50 text-slate-400" />
                  <p>Click &quot;Execute Schema Mapping&quot; to inspect translation</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
