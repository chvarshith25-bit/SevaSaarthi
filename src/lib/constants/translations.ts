export type SupportedLanguage = "en";

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: "en", name: "English", nativeName: "English", flag: "🇮🇳" },
];

export const TRANSLATIONS: Record<SupportedLanguage, Record<string, string>> = {
  en: {
    // Brand & App
    app_title: "Seva Saarthi",
    appTitle: "Seva Saarthi",
    app_subtitle: "One Form. A Smarter India.",
    appTagline: "One Form. A Smarter India.",
    
    // Navigation
    home: "Home",
    apply_for_service: "Apply for a Service",
    applyService: "Apply for a Service",
    discover_services: "Discover Services",
    findServices: "Discover Services",
    my_applications: "My Applications",
    myApplications: "My Applications",
    documents: "Documents",
    myDocuments: "Documents",
    documentsVault: "Documents",
    tasks_reminders: "Tasks & Reminders",
    tasks: "Tasks & Reminders",
    notifications: "Notifications",
    my_profile: "My Profile",
    myProfile: "My Profile",
    help_support: "Help & Support",
    help: "Help & Support",
    easy_mode: "Easy Mode",
    easyMode: "Easy Mode",

    // Greetings
    good_morning: "Good morning",
    good_afternoon: "Good afternoon",
    good_evening: "Good evening",
    welcome: "Welcome",

    // Dashboard Hub
    what_help_needed: "What do you need help with?",
    whatDoYouNeedHelpWith: "What do you need help with?",
    tell_seva_saarthi: "Tell Seva Saarthi what you need",
    tellSevaSaarthi: "Tell Seva Saarthi what you need",
    tap_to_speak: "Tap to Speak",
    voice_placeholder: "Speak or tap any prompt to check status, upload documents, or find benefits.",
    
    // Actions & Badges
    verified: "Verified & Ready",
    action_required: "Action Required",
    actionRequired: "Action Required",
    missing: "What you still need",
    almost_ready: "You are almost ready",
    explore_schemes: "Explore Schemes",
    view_progress: "View Progress",
    open_locker: "Open Locker",
    complete_task: "Complete Task",
    ask_question: "Ask a Question",
    find_services: "Find Services",
    apply_now: "Apply Now",
    view_status: "View Status",
    resolve_now: "Resolve Now",

    // Dashboard Content
    digilocker_verified: "DigiLocker Verified Citizen",
    welcome_user: "Welcome",
    applications_on_record: "applications on record",
    verified_documents_saved: "verified documents saved",
    ask_voice_saarthi: "Ask Voice Saarthi",
    find_schemes: "Find Schemes",
    find_schemes_desc: "Explore 50+ scholarships, farming, housing & welfare schemes.",
    explore_all: "Explore All",
    apply_for_a_service: "Apply for a Service",
    apply_service_desc: "Check required documents and apply with 1-click autofill.",
    start_application: "Start Application",
    my_applications_title: "My Applications",
    total: "Total",
    my_applications_desc: "Track live government processing milestones and approval stages.",
    track_status: "Track Status",
    my_documents: "My Documents",
    stored: "Stored",
    my_documents_desc: "Aadhaar, PAN, Marksheets & Income certificates stored securely.",
    open_vault: "Open Vault",
    active_application_status: "Active Application Status",
    application_id: "Application ID",
    applied_on: "Applied on",
    view_full_tracking: "View Full Tracking Details",
    need_help: "Need help with an application or missing document?",
    help_desc: "Free citizen support helpline & AI guidance available 24/7.",
    get_help: "Get Help",

    // Page Specific Headers & Labels
    my_application_tracker: "My Application Tracker",
    tracker_desc: "Real-time lifecycle tracking, stage milestones, exception handling, and officer decisions for all government schemes.",
    apply_for_new_service: "Apply for New Service",
    direct_pan_tracker: "Direct PAN Tracker",
    total_applied: "Total Applied",
    in_progress: "In Progress",
    completed: "Completed",

    discover_schemes_title: "Discover Government Schemes",
    discover_schemes_desc: "Explore 50+ central & state welfare schemes, scholarships, and subsidies.",
    search_schemes_placeholder: "Search schemes by name, keyword or category...",
    all_categories: "All Categories",
    scholarships: "Scholarships",
    housing: "Housing",
    healthcare: "Healthcare",
    agriculture: "Agriculture",
    welfare: "Welfare",
    eligible_only: "Eligible Only",

    service_readiness_checklist: "Service Readiness Checklist",
    checklist_desc: "Check required documents and satisfied criteria before submitting your government application.",
    missing_requirements: "Missing Requirements",
    satisfied_requirements: "Satisfied Criteria",

    document_vault_title: "Document Vault",
    vault_desc: "Secure encrypted repository for Aadhaar, PAN, marksheets and income certificates with OCR extraction.",
    upload_document: "Upload Document",
    all_documents: "All Documents",
    identity_proofs: "Identity Proofs",
    income_proofs: "Income & Domicile",
    education_proofs: "Education",
    banking_proofs: "Banking",

    tasks_and_reminders: "Tasks & Reminders",
    tasks_desc: "Action items to complete your readiness checklist for target government schemes.",
    high_priority_missing: "High Priority: Missing Scheme Requirements",
    verify_mobile: "Verify your mobile number with Aadhaar OTP",
    check_bank_dbt: "Check Aadhaar DBT Seeding on NPCI Portal",

    help_and_support: "Help & Support",
    help_page_desc: "Get guidance on government scheme applications, missing documents, and certificate procedures.",
    book_free_call: "Book a Free Guidance Call",
    call_desc: "Need help obtaining an Income Certificate or Bonafide? Our scheme specialists can walk you through the exact procedures.",
    submit_request: "Submit Request",

    notifications_center: "Notifications Center",
    notifications_desc: "Real-time updates on application status changes, officer actions, and system verification results.",
    mark_all_read: "Mark All as Read",
    clear_all: "Clear All",
    all_tab: "All",
    unread_tab: "Unread",
    action_tab: "Action Needed",

    select_scheme_service: "Select Scheme / Service:",
    available_schemes: "Available Government Schemes & Certificates",
    click_to_check: "click any card to check eligibility",
    ready: "Ready",
    verified_scheme: "Verified Scheme",
    official_portal: "Official Portal",
    autofill_assistant: "Autofill Assistant",
    process_guidelines: "Application Process & Guidelines",
    hide_process_guide: "Hide Process Guide",
    copy_summary: "Copy Summary",
    readiness_score: "Readiness Score",
    requirements_satisfied: "requirements satisfied",
    satisfied: "Satisfied",
    missing_label: "Missing",
    resolved: "Resolved",
    missing_requirements_title: "Missing Requirements (What You Still Need)",
    missing_requirements_desc: "Upload or confirm these items to achieve 100% readiness for this scheme",
    how_to_get: "How to get",
    mark_resolved: "Mark Resolved",
    satisfied_requirements_title: "Satisfied Requirements (What You Already Have)",
    satisfied_requirements_desc: "Verified and ready from your profile fields and vault documents",
    search_placeholder: "What are you looking for? (e.g. Scholarship, Income Certificate, PAN Card...)",
    reduce_doc_size: "Reduce Document Size",
    portal_limits: "Portal Limits",
  },
};

export function getTranslation(lang: SupportedLanguage, key: string, fallback?: string): string {
  const langDict = TRANSLATIONS.en;
  
  if (langDict && langDict[key]) {
    return langDict[key];
  }

  // Handle camelCase fallback if key is snake_case
  const camelKey = key.replace(/_([a-z])/g, (_, g) => g.toUpperCase());
  if (langDict && langDict[camelKey]) {
    return langDict[camelKey];
  }

  if (fallback) return fallback;

  // Clean fallback if key is e.g. "what_help_needed" -> "What Help Needed"
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}