"use client";

import React, { useState } from "react";
import {
  User,
  ShieldCheck,
  Edit2,
  Save,
  Sparkles,
  X,
  Check,
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
  } = useSevaSaarthi();

  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValues, setTempValues] = useState<Record<string, string>>({});
  const [isFullEditModalOpen, setIsFullEditModalOpen] = useState(false);
  const [modalActiveTab, setModalActiveTab] = useState<ProfileCategoryKey>("IDENTITY");
  const [fullFormData, setFullFormData] = useState<Record<string, string>>({});

  const fieldDefinitions = CANONICAL_PROFILE_FIELDS;
  const categories = PROFILE_CATEGORIES;

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

  const handleAutoPopulateDemoData = async () => {
    const sampleData = generateSampleProfileData(user);
    await batchUpdateProfileFields(sampleData);
    toast.success(`✨ Successfully pre-filled profile details for ${user?.name || "you"}!`);
  };

  const filledFieldsCount = profileFields.filter(
    (pf) => pf.value && pf.value.trim().length > 0
  ).length;

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
              {user ? `${user.name}'s Profile` : "Citizen Profile"}
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Your verified citizen profile details for government scheme eligibility and official services.
          </p>
        </div>

        {/* Actions & Profile Strength */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleAutoPopulateDemoData}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Pre-fill verified sample data"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Pre-Fill Sample Data</span>
          </button>

          <button
            onClick={() => handleOpenFullModal()}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs shadow-indigo-200 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </button>

          <div className="bg-white border border-slate-200/80 rounded-2xl py-2 px-3.5 shadow-xs flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-100/70 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">
                Profile Strength: <span className="text-emerald-600">{profileStrength}%</span>
              </div>
              <div className="text-[10px] text-slate-400">
                {filledFieldsCount} of {fieldDefinitions.length} details filled
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Categories Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const catFields = fieldDefinitions.filter((f) => f.category === cat.key);

          return (
            <div
              key={cat.key}
              className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs"
            >
              {/* Category Header */}
              <div className="flex items-center justify-between pb-4 mb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0",
                      cat.iconBg
                    )}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">{cat.title}</h2>
                    <p className="text-[11px] text-slate-400">{cat.subtitle}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleOpenFullModal(cat.key)}
                  className="px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-xl transition-colors border border-indigo-100 flex items-center gap-1.5 cursor-pointer shrink-0"
                  title={`Edit ${cat.title}`}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
              </div>

              {/* Fields List */}
              <div className="divide-y divide-slate-100">
                {catFields.map((fieldDef) => {
                  const storedField = profileFields.find(
                    (pf) => pf.field_name === fieldDef.fieldName
                  );
                  const isEditing = editingField === fieldDef.fieldName;
                  const currentValue = storedField?.value || "";

                  return (
                    <div
                      key={fieldDef.fieldName}
                      className="py-2.5 first:pt-1 last:pb-0 flex items-start justify-between gap-3 group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-medium text-slate-500 mb-0.5">
                          {fieldDef.label}
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
                                className="w-full px-2.5 py-1.5 bg-white border border-indigo-500 rounded-lg text-xs font-semibold text-slate-900 focus:outline-hidden"
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
                                className="w-full px-2.5 py-1.5 bg-white border border-indigo-500 rounded-lg text-xs font-semibold text-slate-900 focus:outline-hidden"
                                autoFocus
                              />
                            )}
                            <button
                              onClick={() => handleSaveField(fieldDef.fieldName)}
                              className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors cursor-pointer shrink-0"
                              title="Save"
                            >
                              <Save className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingField(null)}
                              className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-lg transition-colors cursor-pointer shrink-0"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 mt-0.5">
                            <span
                              className={cn(
                                "text-xs font-semibold break-all",
                                currentValue
                                  ? "text-slate-800"
                                  : "text-slate-400 italic font-normal"
                              )}
                            >
                              {currentValue || "Not provided"}
                            </span>
                            {storedField?.source_document_id && (
                              <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200/60 shrink-0">
                                <Check className="w-2.5 h-2.5" />
                                Verified
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {!isEditing && (
                        <button
                          onClick={() => handleStartEdit(fieldDef.fieldName, currentValue)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-all cursor-pointer shrink-0 self-center"
                          title="Edit field"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Complete Profile All-in-One Categorized Modal */}
      {isFullEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 border border-slate-100">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                  <span>Citizen Profile Editor</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Update your personal, identity, education, and banking details.
                </p>
              </div>
              <button
                onClick={() => setIsFullEditModalOpen(false)}
                className="p-2 hover:bg-slate-200/80 rounded-xl text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Category Switcher */}
            <div className="flex items-center gap-1.5 overflow-x-auto px-5 py-2.5 bg-slate-100/70 border-b border-slate-200/70 scrollbar-none">
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
            <form onSubmit={handleSaveFullForm} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
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
                        <p className="text-xs text-slate-500">{catFields.length} profile fields</p>
                      </div>
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
                          <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                            {fd.label}
                          </label>

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
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 sticky bottom-0 bg-white/95 backdrop-blur-xs py-2">
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
                  <span>Save Profile Details</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
