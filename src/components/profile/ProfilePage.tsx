"use client";

import React, { useState, useMemo } from "react";
import {
  User,
  ShieldCheck,
  Edit2,
  Save,
  Sparkles,
  X,
  Check,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  ArrowRight,
  Fingerprint,
  FileCheck2,
} from "lucide-react";
import { useSevaSaarthi } from "@/lib/store/formly-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  CANONICAL_PROFILE_FIELDS,
  PROFILE_CATEGORIES,
  ProfileCategoryKey,
  generateSampleProfileData,
} from "@/lib/constants/profile";

export function ProfilePage() {
  const {
    profileFields,
    updateProfileField,
    batchUpdateProfileFields,
    profileStrength,
    user,
    easyMode,
    t,
  } = useSevaSaarthi();

  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValues, setTempValues] = useState<Record<string, string>>({});
  const [isFullEditModalOpen, setIsFullEditModalOpen] = useState(false);
  const [modalActiveTab, setModalActiveTab] = useState<ProfileCategoryKey>("IDENTITY");
  const [fullFormData, setFullFormData] = useState<Record<string, string>>({});
  
  // State for showing/hiding sensitive fields (Aadhaar, PAN, Bank account)
  const [unmaskedFields, setUnmaskedFields] = useState<Record<string, boolean>>({});
  
  // State for progressive disclosure expansion per category
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    PERSONAL: false,
    IDENTITY: false,
    CONTACT: false,
    ADDRESS: false,
    EDUCATION: false,
    BANKING: false,
    SOCIAL: false,
  });

  const fieldDefinitions = CANONICAL_PROFILE_FIELDS;
  const categories = PROFILE_CATEGORIES;

  const toggleCategoryExpand = (catKey: string) => {
    setExpandedCategories((prev) => ({ ...prev, [catKey]: !prev[catKey] }));
  };

  const toggleMaskField = (fieldName: string) => {
    setUnmaskedFields((prev) => ({ ...prev, [fieldName]: !prev[fieldName] }));
  };

  const maskValue = (fieldName: string, value: string) => {
    if (!value) return "";
    if (unmaskedFields[fieldName]) return value;

    if (fieldName === "aadhaar_number") {
      const cleaned = value.replace(/\s+/g, "");
      if (cleaned.length >= 12) {
        return `XXXX XXXX ${cleaned.slice(-4)}`;
      }
      return "XXXX-XXXX-" + value.slice(-4);
    }
    if (fieldName === "pan_card_number") {
      if (value.length >= 10) {
        return `${value.slice(0, 3)}XXXX${value.slice(-3)}`;
      }
      return "XXXX" + value.slice(-4);
    }
    if (fieldName === "bank_account_number") {
      return `XXXX-XXXX-${value.slice(-4)}`;
    }
    return value;
  };

  const handleStartEdit = (fieldName: string, currentValue: string) => {
    setEditingField(fieldName);
    setTempValues((prev) => ({ ...prev, [fieldName]: currentValue }));
  };

  const handleSaveField = async (fieldName: string) => {
    const val = tempValues[fieldName] !== undefined ? tempValues[fieldName] : "";
    await updateProfileField(fieldName, val);
    setEditingField(null);
    toast.success("Profile field updated successfully");
  };

  const handleOpenFullModal = (initialTab?: ProfileCategoryKey) => {
    if (initialTab) setModalActiveTab(initialTab);
    const initialValues: Record<string, string> = {};
    fieldDefinitions.forEach((fd) => {
      const existing = profileFields.find((pf) => pf.field_name === fd.fieldName);
      if (existing?.value) {
        initialValues[fd.fieldName] = existing.value;
      } else if (fd.fieldName === "full_name" && user?.name) {
        initialValues[fd.fieldName] = user.name;
      } else if (fd.fieldName === "email" && user?.email) {
        initialValues[fd.fieldName] = user.email;
      } else if (fd.fieldName === "phone_number" && user?.phone) {
        initialValues[fd.fieldName] = user.phone;
      } else {
        initialValues[fd.fieldName] = "";
      }
    });
    setFullFormData(initialValues);
    setIsFullEditModalOpen(true);
  };

  const handleSaveFullForm = async (e: React.FormEvent) => {
    e.preventDefault();
    await batchUpdateProfileFields(fullFormData);
    setIsFullEditModalOpen(false);
    toast.success("Profile saved successfully");
  };

  const handleAutoPopulateDemoData = async () => {
    const sampleData = generateSampleProfileData(user);
    await batchUpdateProfileFields(sampleData);
    toast.success(`✨ Pre-filled verified sample details for ${user?.name || "you"}!`);
  };

  const filledFieldsCount = profileFields.filter(
    (pf) => pf.value && pf.value.trim().length > 0
  ).length;

  const missingFieldsCount = Math.max(0, fieldDefinitions.length - filledFieldsCount);

  // Group categories into 2 clean columns for masonry layout without row gaps
  const leftColCategories = categories.filter((c, i) => i % 2 === 0); // PERSONAL, CONTACT, EDUCATION, SOCIAL
  const rightColCategories = categories.filter((c, i) => i % 2 !== 0); // IDENTITY, ADDRESS, BANKING

  const renderCategoryCard = (cat: typeof categories[0]) => {
    const Icon = cat.icon;
    const catFields = fieldDefinitions.filter((f) => f.category === cat.key);
    const isExpanded = expandedCategories[cat.key];
    const previewCount = 3;
    const visibleFields = isExpanded ? catFields : catFields.slice(0, previewCount);
    const hiddenCount = catFields.length - previewCount;

    return (
      <div
        key={cat.key}
        className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs hover:border-slate-300 transition-all space-y-4"
      >
        {/* Category Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs",
                cat.iconBg
              )}
            >
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h2 className={cn("font-bold text-slate-900", easyMode ? "text-base" : "text-sm")}>
                {cat.title}
              </h2>
              <p className="text-xs text-slate-500 font-medium">{cat.subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleOpenFullModal(cat.key)}
            className="px-3.5 py-2 text-xs font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-colors border border-blue-100 flex items-center gap-1.5 cursor-pointer shrink-0 min-h-[40px]"
            title={`Edit ${cat.title}`}
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit</span>
          </button>
        </div>

        {/* Fields List */}
        <div className="divide-y divide-slate-100">
          {visibleFields.map((fieldDef) => {
            const storedField = profileFields.find(
              (pf) => pf.field_name === fieldDef.fieldName
            );
            const isEditing = editingField === fieldDef.fieldName;
            const currentValue = storedField?.value || "";
            const isSensitive = [
              "aadhaar_number",
              "pan_card_number",
              "bank_account_number",
            ].includes(fieldDef.fieldName);

            return (
              <div
                key={fieldDef.fieldName}
                className="py-3 first:pt-1 last:pb-1 flex items-start justify-between gap-3 group"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1.5">
                    <span>{fieldDef.label}</span>
                    {fieldDef.required && (
                      <span className="text-rose-500 text-xs">*</span>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="flex items-center gap-2 mt-1.5">
                      {fieldDef.options ? (
                        <select
                          value={tempValues[fieldDef.fieldName] ?? currentValue}
                          onChange={(e) =>
                            setTempValues((prev) => ({
                              ...prev,
                              [fieldDef.fieldName]: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 bg-white border border-blue-500 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                          autoFocus
                        >
                          <option value="">Select option...</option>
                          {fieldDef.options.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={fieldDef.type || "text"}
                          value={tempValues[fieldDef.fieldName] ?? currentValue}
                          onChange={(e) =>
                            setTempValues((prev) => ({
                              ...prev,
                              [fieldDef.fieldName]: e.target.value,
                            }))
                          }
                          placeholder={fieldDef.placeholder}
                          className="w-full px-3 py-2 bg-white border border-blue-500 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                          autoFocus
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => handleSaveField(fieldDef.fieldName)}
                        className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors cursor-pointer shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
                        title="Save"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingField(null)}
                        className="p-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl transition-colors cursor-pointer shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
                        title="Cancel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span
                        className={cn(
                          "font-semibold break-all",
                          easyMode ? "text-sm" : "text-xs",
                          currentValue ? "text-slate-900 font-bold" : "text-slate-400 italic font-normal"
                        )}
                      >
                        {currentValue
                          ? maskValue(fieldDef.fieldName, currentValue)
                          : "Not provided"}
                      </span>

                      {/* Show / Hide toggle for sensitive fields */}
                      {isSensitive && currentValue && (
                        <button
                          type="button"
                          onClick={() => toggleMaskField(fieldDef.fieldName)}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded-md transition-colors cursor-pointer"
                          title={unmaskedFields[fieldDef.fieldName] ? "Hide Number" : "Show Number"}
                          aria-label={unmaskedFields[fieldDef.fieldName] ? "Hide Number" : "Show Number"}
                        >
                          {unmaskedFields[fieldDef.fieldName] ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}

                      {storedField?.source_document_id && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/80 shrink-0">
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Verified</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {!isEditing && (
                  <button
                    type="button"
                    onClick={() => handleStartEdit(fieldDef.fieldName, currentValue)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer shrink-0 self-center min-h-[36px] min-w-[36px] flex items-center justify-center"
                    title="Edit field"
                    aria-label={`Edit ${fieldDef.label}`}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Progressive Disclosure Toggle */}
        {hiddenCount > 0 && (
          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => toggleCategoryExpand(cat.key)}
              className="w-full py-2 px-3 text-xs font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50/70 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px]"
            >
              <span>
                {isExpanded
                  ? `Show fewer details`
                  : `Show ${hiddenCount} more details`}
              </span>
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-16 w-full min-w-0">
      {/* 1. Page Header */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1 max-w-xl">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              <User className="w-3.5 h-3.5 text-blue-600" />
              <span>Unified Citizen Profile</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Fingerprint className="w-3 h-3 text-emerald-600" />
              <span>DigiLocker Linked</span>
            </span>
          </div>

          <h1 className={cn("font-black text-slate-900 tracking-tight", easyMode ? "text-2xl sm:text-3xl" : "text-xl sm:text-2xl")}>
            {user ? `${user.name}'s Citizen Profile` : "Citizen Profile"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
            Your verified personal and demographic data. These details auto-fill your government applications so you never have to type them again.
          </p>
        </div>

        {/* Profile Strength & Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleAutoPopulateDemoData}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold shadow-sm flex items-center gap-2 transition-all cursor-pointer min-h-[48px]"
          >
            <Sparkles className="w-4 h-4" />
            <span>Pre-Fill Sample Details</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenFullModal()}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all cursor-pointer min-h-[48px]"
          >
            <Edit2 className="w-4 h-4" />
            <span>Edit Full Profile</span>
          </button>
        </div>
      </div>

      {/* 2. Profile Completeness Callout Banner */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50/60 to-white rounded-3xl border border-blue-200 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-lg shadow-md shadow-blue-500/20 shrink-0">
            {profileStrength}%
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Your profile is {profileStrength}% complete
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              {missingFieldsCount > 0
                ? `${missingFieldsCount} important details are missing for 1-click scheme matching.`
                : "All major details are filled and verified for 1-click applications."}
            </p>
          </div>
        </div>

        {missingFieldsCount > 0 && (
          <button
            type="button"
            onClick={() => handleOpenFullModal()}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-all min-h-[44px] shrink-0"
          >
            <span>Complete Missing Details</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 3. True 2-Column Masonry Stacks (Eliminates vertical gap caused by CSS Grid rows) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Column Stack */}
        <div className="flex flex-col gap-6">
          {leftColCategories.map(renderCategoryCard)}
        </div>

        {/* Right Column Stack */}
        <div className="flex flex-col gap-6">
          {rightColCategories.map(renderCategoryCard)}
        </div>
      </div>

      {/* 4. Complete Profile All-in-One Categorized Modal */}
      {isFullEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 select-none">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 border border-slate-200">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Citizen Profile Editor
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Update personal, identity, education, address, and banking details.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFullEditModalOpen(false)}
                className="p-2 hover:bg-slate-200 rounded-xl text-slate-400 hover:text-slate-700 transition-colors cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Category Switcher */}
            <div className="flex items-center gap-1.5 overflow-x-auto px-5 py-2.5 bg-slate-100/80 border-b border-slate-200 scrollbar-none">
              {categories.map((cat) => {
                const isActive = modalActiveTab === cat.key;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setModalActiveTab(cat.key)}
                    className={cn(
                      "px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer min-h-[40px]",
                      isActive
                        ? "bg-white text-blue-700 shadow-sm border border-slate-200"
                        : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                    )}
                  >
                    {cat.title}
                  </button>
                );
              })}
            </div>

            {/* Modal Body / Scrollable Form */}
            <form onSubmit={handleSaveFullForm} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              {(() => {
                const currentCategory = categories.find((c) => c.key === modalActiveTab);
                const catFields = fieldDefinitions.filter((f) => f.category === modalActiveTab);

                return (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">
                          {currentCategory?.title}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium">{catFields.length} profile fields</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {catFields.map((fieldDef) => {
                        const val = fullFormData[fieldDef.fieldName] || "";

                        return (
                          <div key={fieldDef.fieldName} className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 block">
                              {fieldDef.label}{" "}
                              {fieldDef.required && <span className="text-rose-500">*</span>}
                            </label>

                            {fieldDef.options ? (
                              <select
                                value={val}
                                onChange={(e) =>
                                  setFullFormData((prev) => ({
                                    ...prev,
                                    [fieldDef.fieldName]: e.target.value,
                                  }))
                                }
                                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white min-h-[48px]"
                              >
                                <option value="">Select option...</option>
                                {fieldDef.options.map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type={fieldDef.type || "text"}
                                value={val}
                                onChange={(e) =>
                                  setFullFormData((prev) => ({
                                    ...prev,
                                    [fieldDef.fieldName]: e.target.value,
                                  }))
                                }
                                placeholder={fieldDef.placeholder}
                                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white min-h-[48px]"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 sticky bottom-0 bg-white">
                <button
                  type="button"
                  onClick={() => setIsFullEditModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 min-h-[48px] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-2 min-h-[48px] cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save All Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
