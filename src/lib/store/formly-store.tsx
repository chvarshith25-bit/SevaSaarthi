"use client";

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import {
  ProfileField,
  DocumentRow,
  ExtractedField,
  ServiceRow,
  ServiceRequirement,
  RequirementStatusRow,
  ChecklistSummary,
  ChecklistItemViewModel,
  DocumentType,
} from "@/types";
import {
  INITIAL_SERVICES,
  INITIAL_REQUIREMENTS,
} from "@/lib/mock-data/initial-state";
import { extractDocumentFields } from "@/lib/ocr/ocr-engine";
import { toast } from "sonner";
import { CANONICAL_PROFILE_FIELDS, computeProfileStrength, getProfileCompleteness } from "@/lib/constants/profile";

export interface UserSession {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  avatar?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  desc: string;
  time: string;
  category: "DOCUMENT" | "PROFILE" | "READINESS" | "SECURITY";
  href: string;
  read: boolean;
}

interface SevaSaarthiContextType {
  user: UserSession | null;
  isAuthenticated: boolean;
  isLoadingAuth: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string, phone?: string) => Promise<boolean>;
  logout: () => Promise<void>;

  services: ServiceRow[];
  requirements: ServiceRequirement[];
  documents: DocumentRow[];
  extractedFields: ExtractedField[];
  profileFields: ProfileField[];
  requirementStatuses: RequirementStatusRow[];
  activeServiceId: string;
  setActiveServiceId: (id: string) => void;
  checklistSummary: ChecklistSummary;
  profileStrength: number;
  stats: {
    activeApplications: number;
    completedApplications: number;
    totalDocuments: number;
    verifiedDocuments: number;
    pendingTasks: number;
    missingDocuments: number;
    expiringSoonDocuments: number;
  };

  // Real Notifications
  notifications: AppNotification[];
  unreadNotificationsCount: number;
  markNotificationAsRead: (id: string) => void;
  clearAllNotifications: () => void;

  // Actions
  uploadDocument: (file: File, documentType?: DocumentType) => Promise<string>;
  acceptExtractedField: (documentId: string, fieldId: string, customValue?: string) => Promise<void>;
  rejectExtractedField: (documentId: string, fieldId: string) => Promise<void>;
  acceptAllExtractedFields: (documentId: string) => Promise<void>;
  updateProfileField: (fieldName: string, value: string) => Promise<void>;
  batchUpdateProfileFields: (fields: Record<string, string>) => Promise<void>;
  deleteDocument: (documentId: string) => Promise<void>;
  retryOcr: (documentId: string) => Promise<void>;
  markRequirementResolved: (requirementId: string, note?: string) => Promise<void>;
  unmarkRequirementResolved: (requirementId: string) => Promise<void>;
  recomputeRequirements: () => void;
  resetToPreset: (preset: "default" | "first_run" | "completed") => void;
}

const SevaSaarthiContext = createContext<SevaSaarthiContextType | null>(null);

const STORAGE_SESSION_KEY = "seva_saarthi_active_session";

export function SevaSaarthiProvider({ children }: { children: React.ReactNode }) {
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [user, setUser] = useState<UserSession | null>(null);

  const [services, setServices] = useState<ServiceRow[]>(INITIAL_SERVICES);
  const [requirements, setRequirements] = useState<ServiceRequirement[]>(INITIAL_REQUIREMENTS);
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [extractedFields, setExtractedFields] = useState<ExtractedField[]>([]);
  const [profileFields, setProfileFields] = useState<ProfileField[]>([]);
  const [requirementStatuses, setRequirementStatuses] = useState<RequirementStatusRow[]>([]);
  const [activeServiceId, setActiveServiceId] = useState<string>("s001");
  const isDataLoadedRef = React.useRef(false);

  // Load user data from server / localStorage for this specific authenticated user
  const loadUserData = useCallback(async (activeUser: UserSession) => {
    try {
      // 1. Try fetching from server APIs independently
      const [profRes, docsRes, checkRes] = await Promise.allSettled([
        fetch("/api/profile"),
        fetch("/api/documents"),
        fetch(`/api/services/s001/checklist`),
      ]);

      let loadedProfile: ProfileField[] | null = null;
      let loadedDocs: DocumentRow[] | null = null;
      let loadedExtracted: ExtractedField[] = [];
      let loadedStatuses: RequirementStatusRow[] | null = null;

      if (profRes.status === "fulfilled" && profRes.value.ok) {
        const profData = await profRes.value.json();
        if (profData.success && Array.isArray(profData.data)) {
          loadedProfile = profData.data;
          setProfileFields(profData.data);
        }
      }

      if (docsRes.status === "fulfilled" && docsRes.value.ok) {
        const docsData = await docsRes.value.json();
        if (docsData.success && Array.isArray(docsData.data)) {
          loadedDocs = docsData.data;
          setDocuments(docsData.data);
          loadedExtracted = docsData.data.flatMap((d: any) => d.extracted_fields || []);
          setExtractedFields(loadedExtracted);
        }
      }

      if (checkRes.status === "fulfilled" && checkRes.value.ok) {
        const checkData = await checkRes.value.json();
        if (checkData.success && Array.isArray(checkData.items)) {
          const statuses: RequirementStatusRow[] = checkData.items.map((item: any) => ({
            id: `reqstat_${activeUser.id}_${item.requirement.id}`,
            user_id: activeUser.id,
            requirement_id: item.requirement.id,
            status: item.status,
            satisfied_by_document_id: item.satisfiedByDocument?.id || null,
            satisfied_by_field_name: item.satisfiedByProfileField?.field_name || null,
            resolved_note: item.resolvedNote || null,
            locked: item.locked || false,
            updated_at: new Date().toISOString(),
          }));
          loadedStatuses = statuses;
          setRequirementStatuses(statuses);
        }
      }

      // If we received server data, cache it locally and mark loaded
      if (loadedProfile !== null || loadedDocs !== null || loadedStatuses !== null) {
        isDataLoadedRef.current = true;
        const userStorageKey = `seva_saarthi_data_${activeUser.id}`;
        localStorage.setItem(
          userStorageKey,
          JSON.stringify({
            documents: loadedDocs ?? [],
            extractedFields: loadedExtracted,
            profileFields: loadedProfile ?? [],
            requirementStatuses: loadedStatuses ?? [],
          })
        );
        return;
      }
    } catch (e) {
      console.warn("[Formly Store] API load failed, checking local storage cache", e);
    }

    // Fallback to local storage keyed by user ID
    try {
      const userStorageKey = `seva_saarthi_data_${activeUser.id}`;
      const saved = localStorage.getItem(userStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.documents) setDocuments(parsed.documents);
        if (parsed.extractedFields) setExtractedFields(parsed.extractedFields);
        if (parsed.profileFields) setProfileFields(parsed.profileFields);
        if (parsed.requirementStatuses) setRequirementStatuses(parsed.requirementStatuses);
        isDataLoadedRef.current = true;
      } else {
        // Fresh user: initialize empty profile with their registration name & email
        const initialProfile: ProfileField[] = [
          {
            id: `pf_${activeUser.id}_fullname`,
            user_id: activeUser.id,
            field_name: "full_name",
            value: activeUser.name,
            source_document_id: null,
            confidence: 1.0,
            verified: true,
            confirmed_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: `pf_${activeUser.id}_email`,
            user_id: activeUser.id,
            field_name: "email",
            value: activeUser.email,
            source_document_id: null,
            confidence: 1.0,
            verified: true,
            confirmed_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ];
        if (activeUser.phone) {
          initialProfile.push({
            id: `pf_${activeUser.id}_phone`,
            user_id: activeUser.id,
            field_name: "phone_number",
            value: activeUser.phone,
            source_document_id: null,
            confidence: 1.0,
            verified: true,
            confirmed_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }
        setProfileFields(initialProfile);
        setDocuments([]);
        setExtractedFields([]);
        isDataLoadedRef.current = true;
      }
    } catch (err) {
      console.error("[Formly Store] Failed to load local user cache", err);
    }
  }, []);

  // Save changes locally per user ONLY after data is loaded (prevents wiping cache with empty array)
  useEffect(() => {
    if (!user || !isDataLoadedRef.current) return;
    try {
      const userStorageKey = `seva_saarthi_data_${user.id}`;
      localStorage.setItem(
        userStorageKey,
        JSON.stringify({
          documents,
          extractedFields,
          profileFields,
          requirementStatuses,
        })
      );
    } catch (e) {
      console.warn("Could not persist user data locally", e);
    }
  }, [user, documents, extractedFields, profileFields, requirementStatuses]);

  // Check active session on mount
  useEffect(() => {
    const initSession = async () => {
      // 1. Immediately check client local session to restore user & data without flash
      try {
        const localSaved = localStorage.getItem(STORAGE_SESSION_KEY);
        if (localSaved) {
          const parsedUser = JSON.parse(localSaved);
          if (parsedUser && parsedUser.id) {
            setUser(parsedUser);
            const userStorageKey = `seva_saarthi_data_${parsedUser.id}`;
            const cached = localStorage.getItem(userStorageKey);
            if (cached) {
              const parsedData = JSON.parse(cached);
              if (Array.isArray(parsedData.documents) && parsedData.documents.length > 0) {
                setDocuments(parsedData.documents);
              }
              if (Array.isArray(parsedData.extractedFields) && parsedData.extractedFields.length > 0) {
                setExtractedFields(parsedData.extractedFields);
              }
              if (Array.isArray(parsedData.profileFields) && parsedData.profileFields.length > 0) {
                setProfileFields(parsedData.profileFields);
              }
              if (Array.isArray(parsedData.requirementStatuses) && parsedData.requirementStatuses.length > 0) {
                setRequirementStatuses(parsedData.requirementStatuses);
              }
            }
          }
        }
      } catch (err) {
        console.warn("Error restoring preliminary local session", err);
      }

      // 2. Fetch verified server session and live data
      try {
        const res = await fetch("/api/auth/session");
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            setUser(data.user);
            localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(data.user));
            await loadUserData(data.user);
            setIsLoadingAuth(false);
            return;
          }
        }
      } catch (err) {
        console.warn("Server auth check failed, using local session", err);
      }

      setIsLoadingAuth(false);
    };

    initSession();
  }, [loadUserData]);

  // Login handler
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error || "Login failed. Please check your credentials.");
        return false;
      }

      setUser(data.user);
      localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(data.user));
      await loadUserData(data.user);
      toast.success(`Welcome back, ${data.user.name}!`);
      return true;
    } catch (err: any) {
      toast.error(err.message || "Network error while signing in.");
      return false;
    }
  };

  // Signup handler
  const signup = async (name: string, email: string, password: string, phone?: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, phone }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error || "Signup failed. Please try again.");
        return false;
      }

      setUser(data.user);
      localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(data.user));
      await loadUserData(data.user);
      toast.success(`Account created successfully! Welcome to Seva Saarthi, ${data.user.name}.`);
      return true;
    } catch (err: any) {
      toast.error(err.message || "Network error while signing up.");
      return false;
    }
  };

  // Logout handler
  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}

    localStorage.removeItem(STORAGE_SESSION_KEY);
    setUser(null);
    setDocuments([]);
    setExtractedFields([]);
    setProfileFields([]);
    setRequirementStatuses([]);
    toast.info("You have signed out.");
    window.location.href = "/login";
  };

  // Recompute Requirement Status Function
  const recomputeRequirements = useCallback(() => {
    if (!user) return;

    setRequirementStatuses((prevStatuses) => {
      const activeReqs = requirements.filter((r) => r.service_id === activeServiceId);
      const nextMap = new Map<string, RequirementStatusRow>();

      activeReqs.forEach((req) => {
        const existing = prevStatuses.find((rs) => rs.requirement_id === req.id);
        if (existing) {
          nextMap.set(req.id, { ...existing });
        } else {
          nextMap.set(req.id, {
            id: `rs_${Date.now()}_${req.id}`,
            user_id: user.id,
            requirement_id: req.id,
            status: "MISSING",
            satisfied_by_document_id: null,
            satisfied_by_field_name: null,
            resolved_note: null,
            locked: false,
            updated_at: new Date().toISOString(),
          });
        }
      });

      // Apply recompute rules
      activeReqs.forEach((req) => {
        const current = nextMap.get(req.id);
        if (!current || current.locked) return; // Locked manual overrides are protected

        if (req.requirement_type === "PERSONAL_INFORMATION") {
          const matchingProfileField = profileFields.find(
            (pf) => pf.field_name === req.field_name && pf.verified && pf.value && pf.value.trim().length > 0
          );
          if (matchingProfileField) {
            current.status = "SATISFIED";
            current.satisfied_by_field_name = matchingProfileField.field_name;
            current.satisfied_by_document_id = null;
            current.updated_at = new Date().toISOString();
          } else {
            current.status = "MISSING";
            current.satisfied_by_field_name = null;
            current.satisfied_by_document_id = null;
          }
        } else {
          // Document requirements
          const matchingDoc = documents.find(
            (d) => !d.is_superseded && (d.status === "VERIFIED" || d.status === "EXTRACTED") && d.document_type === req.notes
          );
          if (matchingDoc) {
            current.status = "SATISFIED";
            current.satisfied_by_document_id = matchingDoc.id;
            current.satisfied_by_field_name = null;
            current.updated_at = new Date().toISOString();
          } else {
            current.status = "MISSING";
            current.satisfied_by_document_id = null;
            current.satisfied_by_field_name = null;
          }
        }
      });

      return Array.from(nextMap.values());
    });
  }, [requirements, activeServiceId, user, profileFields, documents]);

  // Upload document
  const uploadDocument = async (file: File, documentType?: DocumentType): Promise<string> => {
    if (!user) throw new Error("Please log in to upload documents.");

    const docId = `doc_${Date.now()}`;
    const newDoc: DocumentRow = {
      id: docId,
      user_id: user.id,
      document_type: documentType || "OTHER",
      storage_path: `vault/${file.name}`,
      original_filename: file.name,
      mime_type: file.type || "application/octet-stream",
      status: "PROCESSING",
      ocr_raw_text: null,
      is_superseded: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setDocuments((prev) => [newDoc, ...prev]);
    toast.loading("Scanning document and extracting fields with OCR...", { id: docId });

    try {
      // Send to backend API
      const formData = new FormData();
      formData.append("file", file);
      if (documentType) formData.append("document_type", documentType);

      const apiRes = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });

      if (apiRes.ok) {
        const data = await apiRes.json();
        if (data.success && data.document) {
          setDocuments((prev) => prev.map((d) => (d.id === docId ? data.document : d)));
          setExtractedFields((prev) => [...(data.extracted_fields || []), ...prev]);
          toast.success(`OCR Complete! ${data.extracted_fields?.length || 0} fields extracted. Click "Review Fields" to confirm.`, {
            id: docId,
            duration: 5000,
          });
          setTimeout(recomputeRequirements, 50);
          return data.document.id;
        }
      }

      // Local extraction fallback
      const ocrResult = await extractDocumentFields(file, documentType);
      const newExtracted: ExtractedField[] = ocrResult.fields.map((f, i) => ({
        id: `ef_${Date.now()}_${i}`,
        document_id: docId,
        field_name: f.fieldName,
        raw_value: f.rawValue,
        normalized_value: f.normalizedValue || null,
        confidence: f.confidence,
        accepted: false,
        created_at: new Date().toISOString(),
      }));

      setExtractedFields((prev) => [...newExtracted, ...prev]);
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === docId
            ? {
                ...d,
                document_type: ocrResult.documentType,
                status: "EXTRACTED",
                ocr_raw_text: ocrResult.rawText,
                updated_at: new Date().toISOString(),
              }
            : d
        )
      );

      toast.success(`OCR Complete! ${newExtracted.length} fields extracted. Review them to add to your profile.`, {
        id: docId,
        duration: 5000,
      });
      setTimeout(recomputeRequirements, 50);
      return docId;
    } catch (err: any) {
      setDocuments((prev) =>
        prev.map((d) => (d.id === docId ? { ...d, status: "FAILED", updated_at: new Date().toISOString() } : d))
      );
      toast.error("OCR Extraction failed. You can retry or enter fields manually.", { id: docId });
      throw err;
    }
  };

  // Retry OCR
  const retryOcr = async (documentId: string) => {
    const doc = documents.find((d) => d.id === documentId);
    if (!doc) return;

    setDocuments((prev) =>
      prev.map((d) => (d.id === documentId ? { ...d, status: "PROCESSING" } : d))
    );
    toast.loading("Retrying OCR on stored document...", { id: documentId });

    try {
      const ocrResult = await extractDocumentFields(
        { name: doc.original_filename || "document.pdf", type: doc.mime_type || "application/pdf", size: 1024 * 100 },
        doc.document_type as DocumentType
      );

      const newExtracted: ExtractedField[] = ocrResult.fields.map((f, i) => ({
        id: `ef_${Date.now()}_${i}`,
        document_id: documentId,
        field_name: f.fieldName,
        raw_value: f.rawValue,
        normalized_value: f.normalizedValue || null,
        confidence: f.confidence,
        accepted: false,
        created_at: new Date().toISOString(),
      }));

      setExtractedFields((prev) => [
        ...newExtracted,
        ...prev.filter((ef) => ef.document_id !== documentId),
      ]);

      setDocuments((prev) =>
        prev.map((d) =>
          d.id === documentId
            ? {
                ...d,
                document_type: ocrResult.documentType,
                status: "EXTRACTED",
                ocr_raw_text: ocrResult.rawText,
                updated_at: new Date().toISOString(),
              }
            : d
        )
      );

      toast.success("OCR completed successfully!", { id: documentId });
    } catch {
      setDocuments((prev) =>
        prev.map((d) => (d.id === documentId ? { ...d, status: "FAILED" } : d))
      );
      toast.error("Retry failed. Please re-upload a clearer document.", { id: documentId });
    }
  };

  // Accept extracted field
  const acceptExtractedField = async (documentId: string, fieldId: string, customValue?: string) => {
    const field = extractedFields.find((f) => f.id === fieldId);
    if (!field || !user) return;

    const valueToWrite = customValue !== undefined ? customValue : field.raw_value;
    const isManualOverride = customValue !== undefined && customValue !== field.raw_value;

    try {
      await fetch(`/api/documents/${documentId}/extracted-fields/${fieldId}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ custom_value: valueToWrite }),
      });
    } catch {}

    setExtractedFields((prev) =>
      prev.map((f) => (f.id === fieldId ? { ...f, accepted: true, raw_value: valueToWrite } : f))
    );

    setProfileFields((prev) => {
      const existingIndex = prev.findIndex((pf) => pf.field_name === field.field_name);
      const newField: ProfileField = {
        id: existingIndex >= 0 ? prev[existingIndex].id : `pf_${Date.now()}`,
        user_id: user.id,
        field_name: field.field_name,
        value: valueToWrite,
        source_document_id: documentId,
        confidence: isManualOverride ? null : field.confidence,
        verified: true,
        confirmed_at: new Date().toISOString(),
        created_at: existingIndex >= 0 ? prev[existingIndex].created_at : new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (existingIndex >= 0) {
        const next = [...prev];
        next[existingIndex] = newField;
        return next;
      }
      return [...prev, newField];
    });

    setDocuments((prev) =>
      prev.map((d) => (d.id === documentId ? { ...d, status: "VERIFIED", updated_at: new Date().toISOString() } : d))
    );

    toast.success(`Confirmed "${field.field_name}" into profile!`);
    setTimeout(recomputeRequirements, 50);
  };

  // Reject extracted field
  const rejectExtractedField = async (documentId: string, fieldId: string) => {
    try {
      await fetch(`/api/documents/${documentId}/extracted-fields/${fieldId}/reject`, {
        method: "POST",
      });
    } catch {}

    setExtractedFields((prev) => prev.filter((f) => f.id !== fieldId));
    toast.info("Extracted field discarded.");
  };

  // Accept all fields from document
  const acceptAllExtractedFields = async (documentId: string) => {
    const fieldsToAccept = extractedFields.filter((f) => f.document_id === documentId && !f.accepted);
    for (const f of fieldsToAccept) {
      await acceptExtractedField(documentId, f.id);
    }
    setDocuments((prev) =>
      prev.map((d) => (d.id === documentId ? { ...d, status: "VERIFIED", updated_at: new Date().toISOString() } : d))
    );
    toast.success("All extracted fields verified and saved to profile!");
    setTimeout(recomputeRequirements, 100);
  };

  // Update single profile field manually
  const updateProfileField = async (fieldName: string, value: string) => {
    if (!user) return;

    try {
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field_name: fieldName, value }),
      });
    } catch {}

    setProfileFields((prev) => {
      const existingIndex = prev.findIndex((pf) => pf.field_name === fieldName);
      const newField: ProfileField = {
        id: existingIndex >= 0 ? prev[existingIndex].id : `pf_${Date.now()}`,
        user_id: user.id,
        field_name: fieldName,
        value,
        source_document_id: existingIndex >= 0 ? prev[existingIndex].source_document_id : null,
        confidence: null,
        verified: true,
        confirmed_at: new Date().toISOString(),
        created_at: existingIndex >= 0 ? prev[existingIndex].created_at : new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (existingIndex >= 0) {
        const next = [...prev];
        next[existingIndex] = newField;
        return next;
      }
      return [...prev, newField];
    });

    toast.success("Profile field saved!");
    setTimeout(recomputeRequirements, 50);
  };

  // Batch update multiple profile fields at once
  const batchUpdateProfileFields = async (fields: Record<string, string>) => {
    if (!user) return;

    try {
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields }),
      });
    } catch (e) {
      console.warn("Batch profile update API failed", e);
    }

    setProfileFields((prev) => {
      let next = [...prev];
      const now = new Date().toISOString();

      Object.entries(fields).forEach(([fieldName, value]) => {
        const idx = next.findIndex((pf) => pf.field_name === fieldName);
        if (idx >= 0) {
          next[idx] = {
            ...next[idx],
            value,
            verified: true,
            confirmed_at: now,
            updated_at: now,
          };
        } else {
          next.push({
            id: `pf_${Date.now()}_${fieldName}`,
            user_id: user.id,
            field_name: fieldName,
            value,
            source_document_id: null,
            confidence: null,
            verified: true,
            confirmed_at: now,
            created_at: now,
            updated_at: now,
          });
        }
      });
      return next;
    });

    toast.success("All profile details updated successfully!");
    setTimeout(recomputeRequirements, 50);
  };

  // Delete document
  const deleteDocument = async (documentId: string) => {
    try {
      await fetch(`/api/documents/${documentId}`, { method: "DELETE" });
    } catch {}

    setDocuments((prev) => prev.filter((d) => d.id !== documentId));
    setExtractedFields((prev) => prev.filter((ef) => ef.document_id !== documentId));

    setProfileFields((prev) =>
      prev.map((pf) =>
        pf.source_document_id === documentId
          ? { ...pf, source_document_id: null, confidence: null }
          : pf
      )
    );

    toast.info("Document removed from vault.");
    setTimeout(recomputeRequirements, 50);
  };

  // Manual Resolution (F10)
  const markRequirementResolved = async (requirementId: string, note?: string) => {
    if (!user) return;

    try {
      await fetch(`/api/requirements/${requirementId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
      });
    } catch {}

    setRequirementStatuses((prev) => {
      const existingIndex = prev.findIndex((rs) => rs.requirement_id === requirementId);
      const newStatus: RequirementStatusRow = {
        id: existingIndex >= 0 ? prev[existingIndex].id : `rs_${Date.now()}`,
        user_id: user.id,
        requirement_id: requirementId,
        status: "MANUALLY_RESOLVED",
        satisfied_by_document_id: null,
        satisfied_by_field_name: null,
        resolved_note: note || "Resolved manually by applicant.",
        locked: true,
        updated_at: new Date().toISOString(),
      };

      if (existingIndex >= 0) {
        const next = [...prev];
        next[existingIndex] = newStatus;
        return next;
      }
      return [...prev, newStatus];
    });

    toast.success("Requirement marked as manually resolved.");
  };

  // Unmark resolution
  const unmarkRequirementResolved = async (requirementId: string) => {
    try {
      await fetch(`/api/requirements/${requirementId}/unresolve`, {
        method: "POST",
      });
    } catch {}

    setRequirementStatuses((prev) =>
      prev.map((rs) =>
        rs.requirement_id === requirementId
          ? { ...rs, locked: false, resolved_note: null, status: "MISSING" }
          : rs
      )
    );
    toast.info("Reverted to automatic verification.");
    setTimeout(recomputeRequirements, 50);
  };

  // Reset presets
  const resetToPreset = (preset: "default" | "first_run" | "completed") => {
    if (!user) return;

    if (preset === "first_run") {
      setDocuments([]);
      setExtractedFields([]);
      setProfileFields([
        {
          id: `pf_${user.id}_fullname`,
          user_id: user.id,
          field_name: "full_name",
          value: user.name,
          source_document_id: null,
          confidence: 1.0,
          verified: true,
          confirmed_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);
      setRequirementStatuses([]);
      toast.success("Reset to Clean / First-Run State.");
      setTimeout(recomputeRequirements, 50);
    } else {
      recomputeRequirements();
      toast.info("Recomputed live requirements.");
    }
  };

  // Calculate dynamic checklist summary
  const checklistSummary: ChecklistSummary = useMemo(() => {
    const activeReqs = requirements.filter((r) => r.service_id === activeServiceId);
    const items: ChecklistItemViewModel[] = activeReqs.map((req) => {
      const statusRow = requirementStatuses.find((rs) => rs.requirement_id === req.id);
      const status = statusRow?.status || "MISSING";

      const satisfiedDoc = statusRow?.satisfied_by_document_id
        ? documents.find((d) => d.id === statusRow.satisfied_by_document_id) || null
        : null;

      const satisfiedField = statusRow?.satisfied_by_field_name
        ? profileFields.find((pf) => pf.field_name === statusRow.satisfied_by_field_name) || null
        : null;

      return {
        requirement: req,
        status,
        satisfiedByDocument: satisfiedDoc,
        satisfiedByProfileField: satisfiedField,
        resolvedNote: statusRow?.resolved_note || null,
        locked: statusRow?.locked || false,
        updatedAt: statusRow?.updated_at || new Date().toISOString(),
      };
    });

    const currentService = services.find((s) => s.id === activeServiceId) || services[0];
    const total = items.filter((i) => i.requirement.required).length;
    const satisfied = items.filter((i) => i.requirement.required && i.status === "SATISFIED").length;
    const manuallyResolved = items.filter((i) => i.requirement.required && i.status === "MANUALLY_RESOLVED").length;
    const missing = items.filter((i) => i.requirement.required && i.status === "MISSING").length;
    const percentage = total > 0 ? Math.round(((satisfied + manuallyResolved) / total) * 100) : 0;

    return {
      service: currentService,
      totalRequirements: total,
      satisfiedCount: satisfied,
      missingCount: missing,
      manuallyResolvedCount: manuallyResolved,
      percentageComplete: percentage,
      items,
    };
  }, [services, requirements, activeServiceId, requirementStatuses, documents, profileFields]);

  // Dynamic Profile Strength (Unified from Canonical Fields)
  const profileStrength = useMemo(() => {
    return computeProfileStrength(profileFields);
  }, [profileFields]);

  // Overall Stats
  const stats = useMemo(() => {
    const verifiedDocs = documents.filter((d) => !d.is_superseded && d.status === "VERIFIED").length;
    const totalDocs = documents.filter((d) => !d.is_superseded).length;
    const isCompleted = checklistSummary.percentageComplete === 100;

    return {
      activeApplications: isCompleted ? 0 : 1,
      completedApplications: isCompleted ? 1 : 0,
      totalDocuments: totalDocs,
      verifiedDocuments: verifiedDocs,
      pendingTasks: checklistSummary.missingCount,
      missingDocuments: checklistSummary.items.filter(
        (i) => i.status === "MISSING" && i.requirement.requirement_type !== "PERSONAL_INFORMATION"
      ).length,
      expiringSoonDocuments: 0,
    };
  }, [documents, checklistSummary]);

  // Real Notification State
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("seva_saarthi_read_notifications");
        return saved ? JSON.parse(saved) : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  const markNotificationAsRead = (id: string) => {
    setReadNotificationIds((prev) => {
      const next = prev.includes(id) ? prev : [...prev, id];
      if (typeof window !== "undefined") {
        localStorage.setItem("seva_saarthi_read_notifications", JSON.stringify(next));
      }
      return next;
    });
  };

  const clearAllNotifications = () => {
    const allIds = notifications.map((n) => n.id);
    setReadNotificationIds(allIds);
    if (typeof window !== "undefined") {
      localStorage.setItem("seva_saarthi_read_notifications", JSON.stringify(allIds));
    }
  };

  // Real Dynamic Notifications
  const notifications: AppNotification[] = useMemo(() => {
    const list: AppNotification[] = [];

    // 1. Real Document Events
    documents.forEach((doc) => {
      const filename = doc.original_filename || doc.document_type;
      if (doc.status === "EXTRACTED") {
        list.push({
          id: `doc_ext_${doc.id}`,
          title: `OCR Extracted: ${filename}`,
          desc: `New fields were extracted from this file. Click to review and confirm in your vault.`,
          time: "Recent Upload",
          category: "DOCUMENT",
          href: "/vault",
          read: readNotificationIds.includes(`doc_ext_${doc.id}`),
        });
      } else if (doc.status === "VERIFIED") {
        list.push({
          id: `doc_ver_${doc.id}`,
          title: `Document Verified: ${filename}`,
          desc: `All fields have been confirmed and locked into your citizen profile.`,
          time: "Verified",
          category: "DOCUMENT",
          href: "/vault",
          read: readNotificationIds.includes(`doc_ver_${doc.id}`),
        });
      }
    });

    // 2. Real Profile Completeness Alert (Aligned with 27 Canonical Fields)
    const completeness = getProfileCompleteness(profileFields);

    if (!completeness.isComplete) {
      list.push({
        id: "profile_incomplete",
        title: `Profile Incomplete (${completeness.emptyCount} details remaining)`,
        desc: `Your citizen profile is at ${completeness.strength}% strength. Fill in remaining academic, income, or bank details.`,
        time: "Action Required",
        category: "PROFILE",
        href: "/profile",
        read: readNotificationIds.includes("profile_incomplete"),
      });
    } else {
      list.push({
        id: "profile_complete",
        title: `Profile 100% Complete & Verified!`,
        desc: `All personal, academic, and banking records are in order for instant 1-click portal autofill.`,
        time: "Completed",
        category: "PROFILE",
        href: "/profile",
        read: readNotificationIds.includes("profile_complete"),
      });
    }

    // 3. Real Scheme Readiness Alert
    const currentService = services.find((s) => s.id === activeServiceId) || services[0];
    if (currentService) {
      list.push({
        id: `scheme_readiness_${currentService.id}`,
        title: `${currentService.name}: ${checklistSummary.percentageComplete}% Ready`,
        desc: `${checklistSummary.satisfiedCount} of ${checklistSummary.totalRequirements} criteria met. ${checklistSummary.missingCount} requirement(s) remaining.`,
        time: "Active Scheme",
        category: "READINESS",
        href: "/checklist",
        read: readNotificationIds.includes(`scheme_readiness_${currentService.id}`),
      });
    }

    // 4. Real Account & Security Alert
    if (user) {
      list.push({
        id: `security_session_${user.id}`,
        title: `Logged in as ${user.name}`,
        desc: `Verified session active for ${user.email}. Multi-tenant vault encryption active.`,
        time: "Active",
        category: "SECURITY",
        href: "/profile",
        read: readNotificationIds.includes(`security_session_${user.id}`),
      });
    }

    return list;
  }, [documents, profileFields, services, activeServiceId, checklistSummary, user, readNotificationIds]);

  const unreadNotificationsCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  return (
    <SevaSaarthiContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoadingAuth,
        login,
        signup,
        logout,

        services,
        requirements,
        documents,
        extractedFields,
        profileFields,
        requirementStatuses,
        activeServiceId,
        setActiveServiceId,
        checklistSummary,
        profileStrength,
        stats,

        // Real Notifications
        notifications,
        unreadNotificationsCount,
        markNotificationAsRead,
        clearAllNotifications,

        uploadDocument,
        acceptExtractedField,
        rejectExtractedField,
        acceptAllExtractedFields,
        updateProfileField,
        batchUpdateProfileFields,
        deleteDocument,
        retryOcr,
        markRequirementResolved,
        unmarkRequirementResolved,
        recomputeRequirements,
        resetToPreset,
      }}
    >
      {children}
    </SevaSaarthiContext.Provider>
  );
}

export function useSevaSaarthi() {
  const context = useContext(SevaSaarthiContext);
  if (!context) {
    throw new Error("useSevaSaarthi must be used within a SevaSaarthiProvider");
  }
  return context;
}
