"use client";

import React, { useState, useMemo } from "react";
import {
  User,
  ShieldCheck,
  Building,
  GraduationCap,
  Banknote,
  Landmark,
  CheckCircle2,
  Edit2,
  Save,
  Sparkles,
  X,
  FileCheck2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Filter,
  Check,
  Copy,
  Info,
} from "lucide-react";
import { useSevaSaarthi } from "@/lib/store/formly-store";
import { cn, getConfidenceBadgeClass } from "@/lib/utils";
import { toast } from "sonner";
import {
  CANONICAL_PROFILE_FIELDS,
  PROFILE_CATEGORIES,
  APPLICATION_PORTAL_PRESETS,
  calculatePortalReadiness,
  getProfileCompleteness,
  ProfileCategoryKey,
} from "@/lib/constants/profile";

export function ProfilePage() {
  const {
    profileFields,
    documents,
    updateProfileField,
    batchUpdateProfileFields,
    profileStrength,
    user,
  } = useSevaSaarthi();

  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValues, setTempValues] = useState<Record<string, string>>({});
  const [isFullEditModalOpen, setIsFullEditModalOpen] = useState(false);
  const [modalActiveTab, setModalActiveTab] = useState<ProfileCategoryKey>("IDENTITY");
  const [fullFormData, setFullFormData] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");

  const fieldDefinitions = CANONICAL_PROFILE_FIELDS;
  const categories = PROFILE_CATEGORIES;

  // Calculate readiness for each portal preset
  const portalReadinessList = useMemo(() => {
    return APPLICATION_PORTAL_PRESETS.map((preset) => ({
      preset,
      readiness: calculatePortalReadiness(profileFields, preset.id),
    }));
  }, [profileFields]);

  const completeness = getProfileCompleteness(profileFields);
  const emptyFieldsCount = completeness.emptyCount;

  const handleStartEdit = (fieldName: string, currentValue: string) => {
    setEditingField(fieldName);
    setTempValues((prev) => ({ ...prev, [fieldName]: currentValue }));
  };

  const handleSaveField = async (fieldName: string) => {
    const val = tempValues[fieldName] !== undefined ? tempValues[fieldName] : "";
    await updateProfileField(fieldName, val);
    setEditingField(null);
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
  };

  const getSourceBadge = (sourceDocId: string | null, confidence: number | null) => {
    if (!sourceDocId) {
      return {
        label: "Manually entered",
        bg: "bg-slate-100 text-slate-700 border-slate-200",
      };
    }
    const doc = documents.find((d) => d.id === sourceDocId);
    const docName = doc ? doc.original_filename || doc.document_type : "Uploaded Document";
    return {
      label: `From ${docName}`,
      bg: "bg-emerald-50 text-emerald-800 border-emerald-200",
    };
  };

  // Filter fields based on category tab and search query
  const filteredCategories = useMemo(() => {
    return categories
      .filter((cat) => selectedCategory === "ALL" || cat.key === selectedCategory)
      .map((cat) => {
        const catFields = fieldDefinitions.filter((f) => {
          if (f.category !== cat.key) return false;
          if (!searchQuery.trim()) return true;
          const query = searchQuery.toLowerCase();
          const storedField = profileFields.find((pf) => pf.field_name === f.fieldName);
          return (
            f.label.toLowerCase().includes(query) ||
            f.fieldName.toLowerCase().includes(query) ||
            (storedField?.value && storedField.value.toLowerCase().includes(query)) ||
            (f.portalTags && f.portalTags.some((tag) => tag.toLowerCase().includes(query)))
          );
        });
        return { ...cat, fields: catFields };
      })
      .filter((cat) => cat.fields.length > 0);
  }, [categories, selectedCategory, fieldDefinitions, profileFields, searchQuery]);

  return (
    <div className="space-y-6 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">
              {user ? `${user.name}'s Profile` : "Your Verified Profile"}
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Universal Citizen Profile with statutory field mapping for instant autofill across 7+ Indian statutory portals.
          </p>
        </div>

        {/* Action Button & Profile Strength */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleOpenFullModal()}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-indigo-200 flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Complete All Details</span>
          </button>

          <div className="bg-white border border-slate-100 rounded-2xl p-3 px-4 shadow-xs flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-100/70 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">
                Profile Strength: <span className="text-emerald-600">{profileStrength}%</span>
              </div>
              <div className="text-[10px] text-slate-400">
                {profileFields.filter((pf) => pf.verified && pf.value.trim().length > 0).length} of {fieldDefinitions.length} fields filled
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Application Portal Readiness Dashboard */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <div>
              <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>One-Click Government Autofill Readiness</span>
              </div>
              <h2 className="text-lg font-bold text-white">
                Statutory Portal Compatibility Matrix
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Your profile details are mapped directly to official form schemas. When applying, Formly autofills all mandatory fields.
              </p>
            </div>
            <a
              href="/assistant"
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-500/30 hover:bg-indigo-500/50 border border-indigo-400/40 rounded-xl text-xs font-bold text-white transition-colors"
            >
              <span>Launch Autofill Assistant</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {portalReadinessList.map(({ preset, readiness }) => {
              const isFull = readiness.percentage === 100;
              const isHigh = readiness.percentage >= 80;
              return (
                <div
                  key={preset.id}
                  className="bg-white/10 hover:bg-white/15 border border-white/10 rounded-2xl p-3.5 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-xs font-bold text-white truncate" title={preset.name}>
                        {preset.shortName}
                      </span>
                      <span
                        className={cn(
                          "text-[10px] font-extrabold px-2 py-0.5 rounded-md",
                          isFull
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                            : isHigh
                            ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
                            : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                        )}
                      >
                        {readiness.percentage}%
                      </span>
                    </div>

                    <p className="text-[10px] text-slate-300 mb-2.5 truncate" title={preset.description}>
                      {preset.name}
                    </p>

                    {/* Progress Bar */}
                    <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mb-2">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          isFull ? "bg-emerald-400" : isHigh ? "bg-indigo-400" : "bg-amber-400"
                        )}
                        style={{ width: `${readiness.percentage}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-white/5">
                    <span>
                      {readiness.satisfiedCount}/{readiness.totalCount} fields ready
                    </span>
                    {readiness.missingCount === 0 ? (
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3" /> Ready
                      </span>
                    ) : (
                      <span className="text-amber-300 font-medium">
                        {readiness.missingCount} missing
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Incomplete Profile Alert Banner */}
      {emptyFieldsCount > 0 && (
        <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-indigo-950">
                {emptyFieldsCount} fields remaining for 100% universal readiness
              </div>
              <div className="text-[11px] text-indigo-700">
                Complete your remaining demographics, family, and banking details to unlock one-click application filing everywhere.
              </div>
            </div>
          </div>
          <button
            onClick={() => handleOpenFullModal()}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shrink-0 transition-colors cursor-pointer"
          >
            Fill All Now
          </button>
        </div>
      )}

      {/* Category Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        {/* Horizontal Category Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none">
          <button
            onClick={() => setSelectedCategory("ALL")}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer",
              selectedCategory === "ALL"
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            )}
          >
            All Fields ({fieldDefinitions.length})
          </button>
          {categories.map((cat) => {
            const count = fieldDefinitions.filter((f) => f.category === cat.key).length;
            const isSelected = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer",
                  isSelected
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                )}
              >
                <span>{cat.title}</span>
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.2 rounded-full",
                    isSelected ? "bg-indigo-700 text-indigo-100" : "bg-slate-100 text-slate-500"
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Quick Search */}
        <div className="relative min-w-[220px]">
          <input
            type="text"
            placeholder="Search profile fields or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-3 pr-8 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredCategories.map((cat) => {
          const Icon = cat.icon;

          return (
            <div key={cat.key} className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs flex flex-col justify-between">
              <div>
                {/* Category Header */}
                <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-50">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center", cat.iconBg)}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">{cat.title}</h2>
                      <p className="text-[11px] text-slate-400">{cat.fields.length} statutory fields</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleOpenFullModal(cat.key)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors cursor-pointer"
                    title={`Edit ${cat.title}`}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Fields List */}
                <div className="space-y-4">
                  {cat.fields.map((fieldDef) => {
                    const storedField = profileFields.find((pf) => pf.field_name === fieldDef.fieldName);
                    const isEditing = editingField === fieldDef.fieldName;
                    const currentValue = storedField?.value || "";
                    const sourceBadge = getSourceBadge(
                      storedField?.source_document_id || null,
                      storedField?.confidence ?? null
                    );
                    const confidenceBadge = getConfidenceBadgeClass(storedField?.confidence);

                    return (
                      <div
                        key={fieldDef.fieldName}
                        className="p-3.5 bg-slate-50/70 border border-slate-100/90 rounded-2xl hover:border-slate-200 transition-all"
                      >
                        <div className="flex items-center justify-between mb-1.5 gap-2">
                          <div className="flex items-center gap-1.5">
                            <label className="text-[11px] font-bold text-slate-700">
                              {fieldDef.label}
                            </label>
                            {fieldDef.isKeyField && (
                              <span className="text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-200/80 px-1 py-0.2 rounded">
                                Mandatory
                              </span>
                            )}
                          </div>

                          {/* Badges */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            {storedField?.confidence !== null && storedField?.confidence !== undefined && (
                              <span
                                className={cn(
                                  "text-[9px] font-bold px-1.5 py-0.2 rounded-md border",
                                  confidenceBadge.bg,
                                  confidenceBadge.text
                                )}
                              >
                                OCR {Math.round((storedField.confidence || 0) * 100)}%
                              </span>
                            )}
                            <span
                              className={cn(
                                "text-[9px] font-semibold px-2 py-0.2 rounded-md border truncate max-w-[120px]",
                                sourceBadge.bg
                              )}
                              title={sourceBadge.label}
                            >
                              {sourceBadge.label}
                            </span>
                          </div>
                        </div>

                        {/* Value Display / Inline Edit Input */}
                        {isEditing ? (
                          <div className="flex items-center gap-2 mt-2">
                            {fieldDef.options ? (
                              <select
                                value={tempValues[fieldDef.fieldName] ?? currentValue}
                                onChange={(e) =>
                                  setTempValues((prev) => ({
                                    ...prev,
                                    [fieldDef.fieldName]: e.target.value,
                                  }))
                                }
                                className="flex-1 px-3 py-1.5 bg-white border border-indigo-400 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
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
                                className="flex-1 px-3 py-1.5 bg-white border border-indigo-400 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                                autoFocus
                              />
                            )}
                            <button
                              onClick={() => handleSaveField(fieldDef.fieldName)}
                              className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors shrink-0 shadow-2xs cursor-pointer"
                              title="Save"
                            >
                              <Save className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingField(null)}
                              className="p-2 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-xl transition-colors shrink-0 cursor-pointer"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between group">
                            <span
                              className={cn(
                                "text-xs font-bold",
                                currentValue ? "text-slate-900" : "text-slate-400 italic"
                              )}
                            >
                              {currentValue || "Not entered"}
                            </span>

                            <button
                              onClick={() => handleStartEdit(fieldDef.fieldName, currentValue)}
                              className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors opacity-60 group-hover:opacity-100 cursor-pointer"
                              title="Edit value"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        {/* Portal tags & help text */}
                        <div className="flex items-center justify-between gap-2 mt-2 pt-1 border-t border-slate-100">
                          {fieldDef.helpText ? (
                            <span className="text-[10px] text-slate-400 truncate" title={fieldDef.helpText}>
                              {fieldDef.helpText}
                            </span>
                          ) : (
                            <span />
                          )}
                          {fieldDef.portalTags && fieldDef.portalTags.length > 0 && (
                            <div className="flex items-center gap-1 shrink-0">
                              {fieldDef.portalTags.slice(0, 3).map((tag) => (
                                <span
                                  key={tag}
                                  className="text-[8px] font-extrabold uppercase px-1 py-0.2 rounded bg-indigo-50 text-indigo-600 border border-indigo-100"
                                >
                                  {tag}
                                </span>
                              ))}
                              {fieldDef.portalTags.length > 3 && (
                                <span className="text-[8px] text-slate-400 font-bold">
                                  +{fieldDef.portalTags.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Complete Profile All-in-One Categorized Modal */}
      {isFullEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 border border-slate-100">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                  <span>Universal Citizen Profile Editor</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Update and complete your statutory profile details across all 7 categories.
                </p>
              </div>
              <button
                onClick={() => setIsFullEditModalOpen(false)}
                className="p-2 hover:bg-slate-200/80 rounded-xl text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Category Navigation Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto px-6 py-2.5 bg-slate-100/70 border-b border-slate-200/70 scrollbar-none">
              {categories.map((cat) => {
                const isActive = modalActiveTab === cat.key;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setModalActiveTab(cat.key)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer",
                      isActive
                        ? "bg-white text-indigo-700 shadow-xs border border-slate-200"
                        : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                    )}
                  >
                    {cat.title}
                  </button>
                );
              })}
            </div>

            {/* Modal Body / Scrollable Form */}
            <form onSubmit={handleSaveFullForm} className="flex-1 overflow-y-auto p-6 space-y-6">
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
                        <p className="text-xs text-slate-500">{catFields.length} statutory fields</p>
                      </div>
                      <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                        {currentCategory?.key}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {catFields.map((fd) => (
                        <div
                          key={fd.fieldName}
                          className={cn(
                            "p-3 bg-slate-50/80 border border-slate-200/70 rounded-2xl",
                            fd.fieldName.includes("address_line") || fd.fieldName === "college_name"
                              ? "sm:col-span-2"
                              : ""
                          )}
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <label className="block text-[11px] font-bold text-slate-700">
                              {fd.label}
                            </label>
                            {fd.isKeyField && (
                              <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded">
                                Mandatory
                              </span>
                            )}
                          </div>

                          {fd.options ? (
                            <select
                              value={fullFormData[fd.fieldName] || ""}
                              onChange={(e) =>
                                setFullFormData((prev) => ({
                                  ...prev,
                                  [fd.fieldName]: e.target.value,
                                }))
                              }
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                            >
                              <option value="">Select option...</option>
                              {fd.options.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type={fd.type || "text"}
                              value={fullFormData[fd.fieldName] || ""}
                              onChange={(e) =>
                                setFullFormData((prev) => ({
                                  ...prev,
                                  [fd.fieldName]: e.target.value,
                                }))
                              }
                              placeholder={fd.placeholder}
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                            />
                          )}

                          {fd.helpText && (
                            <p className="text-[10px] text-slate-400 mt-1">{fd.helpText}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between sticky bottom-0 bg-white/95 backdrop-blur-xs py-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">
                    Switch tabs above to edit all 7 statutory categories.
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsFullEditModalOpen(false)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save All Profile Details</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
