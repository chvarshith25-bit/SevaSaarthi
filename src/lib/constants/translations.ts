export type SupportedLanguage = "en" | "te" | "hi";

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: "en", name: "English", nativeName: "English", flag: "🇮🇳" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు", flag: "🇮🇳" },
  { code: "hi", name: "Hindi", nativeName: "हिंदी", flag: "🇮🇳" },
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
  },
  te: {
    // Brand & App
    app_title: "సేవా సారథి",
    appTitle: "సేవా సారథి",
    app_subtitle: "ఒకే దరఖాస్తు. అభివృద్ధి పథంలో భారతదేశం.",
    appTagline: "ఒకే దరఖాస్తు. అభివృద్ధి పథంలో భారతదేశం.",
    
    // Navigation
    home: "హోమ్",
    apply_for_service: "సేవకు దరఖాస్తు",
    applyService: "సేవకు దరఖాస్తు",
    discover_services: "పథకాలను వెతకండి",
    findServices: "పథకాలను వెతకండి",
    my_applications: "నా దరఖాస్తులు",
    myApplications: "నా దరఖాస్తులు",
    documents: "నా ధ్రువపత్రాలు",
    myDocuments: "నా ధ్రువపత్రాలు",
    documentsVault: "నా ధ్రువపత్రాలు",
    tasks_reminders: "చేయవలసిన పనులు",
    tasks: "చేయవలసిన పనులు",
    notifications: "నోటిఫికేషన్లు",
    my_profile: "నా ప్రొఫైల్",
    myProfile: "నా ప్రొఫైల్",
    help_support: "సహాయం & మద్దతు",
    help: "సహాయం & మద్దతు",
    easy_mode: "సులువు మోడ్",
    easyMode: "సులువు మోడ్",

    // Greetings
    good_morning: "శుభోదయం",
    good_afternoon: "శుభ మధ్యాహ్నం",
    good_evening: "శుభ సాయంత్రం",
    welcome: "స్వాగతం",

    // Dashboard Hub
    what_help_needed: "మీకు ఏ సహాయం కావాలి?",
    whatDoYouNeedHelpWith: "మీకు ఏ సహాయం కావాలి?",
    tell_seva_saarthi: "మీకు కావలసినది సేవా సారథికి చెప్పండి",
    tellSevaSaarthi: "మీకు కావలసినది సేవా సారథికి చెప్పండి",
    tap_to_speak: "మాట్లాడటానికి నొక్కండి",
    voice_placeholder: "స్థితిని తనిఖీ చేయడానికి లేదా పత్రాలను అప్‌లోడ్ చేయడానికి మాట్లాడండి.",
    
    // Actions & Badges
    verified: "ధ్రువీకరించబడింది",
    action_required: "చర్య అవసరం",
    actionRequired: "చర్య అవసరం",
    missing: "ఇంకా కావలసినవి",
    almost_ready: "మీరు దాదాపు సిద్ధంగా ఉన్నారు",
    explore_schemes: "పథకాలను చూడండి",
    view_progress: "పురోగతి చూడండి",
    open_locker: "లాకర్ తెరవండి",
    complete_task: "పూర్తి చేయండి",
    ask_question: "ప్రశ్నించండి",
    find_services: "సేవలను వెతకండి",
    apply_now: "దరఖాస్తు చేయండి",
    view_status: "స్థితి చూడండి",
    resolve_now: "పరిష్కరించండి",

    // Dashboard Content
    digilocker_verified: "డిజిలాకర్ ధ్రువీకరించిన పౌరుడు",
    welcome_user: "స్వాగతం",
    applications_on_record: "దరఖాస్తులు రికార్డులో ఉన్నాయి",
    verified_documents_saved: "ధ్రువీకరించిన పత్రాలు భద్రపరచబడ్డాయి",
    ask_voice_saarthi: "వాయిస్ సారథిని అడగండి",
    find_schemes: "పథకాలను వెతకండి",
    find_schemes_desc: "50+ స్కాలర్‌షిప్‌లు, వ్యవసాయం, గృహ & సంక్షేమ పథకాలను అన్వేషించండి.",
    explore_all: "అన్నీ చూడండి",
    apply_for_a_service: "సేవకు దరఖాస్తు చేయండి",
    apply_service_desc: "అవసరమైన పత్రాలను తనిఖీ చేసి 1-క్లిక్ ఆటోఫిల్‌తో దరఖాస్తు చేయండి.",
    start_application: "దరఖాస్తు ప్రారంభించండి",
    my_applications_title: "నా దరఖాస్తులు",
    total: "మొత్తం",
    my_applications_desc: "ప్రభుత్వ ప్రాసెసింగ్ మైలురాళ్లు & ఆమోద దశలను ట్రాక్ చేయండి.",
    track_status: "స్థితి ట్రాక్ చేయండి",
    my_documents: "నా పత్రాలు",
    stored: "భద్రపరచబడింది",
    my_documents_desc: "ఆధార్, పాన్, మార్క్‌షీట్లు & ఆదాయ ధ్రువపత్రాలు సురక్షితంగా భద్రపరచబడ్డాయి.",
    open_vault: "వాల్ట్ తెరవండి",
    active_application_status: "యాక్టివ్ దరఖాస్తు స్థితి",
    application_id: "దరఖాస్తు ఐడి",
    applied_on: "దరఖాస్తు తేదీ",
    view_full_tracking: "పూర్తి ట్రాకింగ్ వివరాలు చూడండి",
    need_help: "దరఖాస్తు లేదా పత్రం గురించి సహాయం కావాలా?",
    help_desc: "ఉచిత పౌర సహాయ హెల్ప్‌లైన్ & AI మార్గదర్శకత్వం 24/7 అందుబాటులో.",
    get_help: "సహాయం పొందండి",
  },
  hi: {
    // Brand & App
    app_title: "सेवा सारथी",
    appTitle: "सेवा सारथी",
    app_subtitle: "एक फॉर्म. सशक्त भारत.",
    appTagline: "एक फॉर्म. सशक्त भारत.",
    
    // Navigation
    home: "होम",
    apply_for_service: "सेवा के लिए आवेदन करें",
    applyService: "सेवा के लिए आवेदन करें",
    discover_services: "योजनाएं खोजें",
    findServices: "योजनाएं खोजें",
    my_applications: "मेरे आवेदन",
    myApplications: "मेरे आवेदन",
    documents: "दस्तावेज़",
    myDocuments: "दस्तावेज़",
    documentsVault: "दस्तावेज़",
    tasks_reminders: "कार्य एवं अनुस्मारक",
    tasks: "कार्य एवं अनुस्मारक",
    notifications: "सूचनाएं",
    my_profile: "मेरी प्रोफ़ाइल",
    myProfile: "मेरी प्रोफ़ाइल",
    help_support: "सहायता एवं समर्थन",
    help: "सहायता एवं समर्थन",
    easy_mode: "सरल मोड",
    easyMode: "सरल मोड",

    // Greetings
    good_morning: "सुप्रभात",
    good_afternoon: "शुभ दोपहर",
    good_evening: "शुभ संध्या",
    welcome: "स्वागत है",

    // Dashboard Hub
    what_help_needed: "आपको किस प्रकार की सहायता चाहिए?",
    whatDoYouNeedHelpWith: "आपको किस प्रकार की सहायता चाहिए?",
    tell_seva_saarthi: "सेवा सारथी को बताएं कि आपको क्या चाहिए",
    tellSevaSaarthi: "सेवा सारथी को बताएं कि आपको क्या चाहिए",
    tap_to_speak: "बोलने के लिए टैप करें",
    voice_placeholder: "आवेदन की स्थिति जानने या दस्तावेज़ अपलोड करने के लिए बोलें।",
    
    // Actions & Badges
    verified: "सत्यापित एवं तैयार",
    action_required: "कार्रवाई आवश्यक",
    actionRequired: "कार्रवाई आवश्यक",
    missing: "आवश्यक दस्तावेज़",
    almost_ready: "आप लगभग तैयार हैं",
    explore_schemes: "योजनाएं देखें",
    view_progress: "प्रगति देखें",
    open_locker: "लॉकर खोलें",
    complete_task: "कार्य पूरा करें",
    ask_question: "सहायता लें",
    find_services: "सेवाएं खोजें",
    apply_now: "आवेदन करें",
    view_status: "स्थिति देखें",
    resolve_now: "समाधान करें",

    // Dashboard Content
    digilocker_verified: "डिजिलॉकर सत्यापित नागरिक",
    welcome_user: "स्वागत है",
    applications_on_record: "आवेदन रिकॉर्ड में हैं",
    verified_documents_saved: "सत्यापित दस्तावेज़ सुरक्षित हैं",
    ask_voice_saarthi: "वॉयस सारथी से पूछें",
    find_schemes: "योजनाएं खोजें",
    find_schemes_desc: "50+ छात्रवृत्ति, कृषि, आवास एवं कल्याण योजनाओं का पता लगाएं।",
    explore_all: "सभी देखें",
    apply_for_a_service: "सेवा के लिए आवेदन करें",
    apply_service_desc: "आवश्यक दस्तावेज़ जांचें और 1-क्लिक ऑटोफिल से आवेदन करें।",
    start_application: "आवेदन शुरू करें",
    my_applications_title: "मेरे आवेदन",
    total: "कुल",
    my_applications_desc: "सरकारी प्रोसेसिंग माइलस्टोन एवं अनुमोदन चरणों को ट्रैक करें।",
    track_status: "स्थिति ट्रैक करें",
    my_documents: "मेरे दस्तावेज़",
    stored: "संग्रहित",
    my_documents_desc: "आधार, पैन, मार्कशीट एवं आय प्रमाणपत्र सुरक्षित रूप से संग्रहित।",
    open_vault: "वॉल्ट खोलें",
    active_application_status: "सक्रिय आवेदन स्थिति",
    application_id: "आवेदन आईडी",
    applied_on: "आवेदन तिथि",
    view_full_tracking: "पूर्ण ट्रैकिंग विवरण देखें",
    need_help: "आवेदन या दस्तावेज़ में सहायता चाहिए?",
    help_desc: "निःशुल्क नागरिक सहायता हेल्पलाइन एवं AI मार्गदर्शन 24/7 उपलब्ध।",
    get_help: "सहायता लें",
  },
};

export function getTranslation(lang: SupportedLanguage, key: string, fallback?: string): string {
  const langDict = TRANSLATIONS[lang] || TRANSLATIONS.en;
  
  if (langDict && langDict[key]) {
    return langDict[key];
  }
  
  if (TRANSLATIONS.en && TRANSLATIONS.en[key]) {
    return TRANSLATIONS.en[key];
  }

  // Handle camelCase fallback if key is snake_case
  const camelKey = key.replace(/_([a-z])/g, (_, g) => g.toUpperCase());
  if (langDict && langDict[camelKey]) {
    return langDict[camelKey];
  }
  if (TRANSLATIONS.en && TRANSLATIONS.en[camelKey]) {
    return TRANSLATIONS.en[camelKey];
  }

  if (fallback) return fallback;

  // Clean fallback if key is e.g. "what_help_needed" -> "What Help Needed"
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}