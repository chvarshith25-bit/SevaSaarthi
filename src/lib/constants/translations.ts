export type SupportedLanguage = "en" | "te" | "hi" | "mr" | "ta" | "kn";

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
  { code: "mr", name: "Marathi", nativeName: "मराठी", flag: "🇮🇳" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", flag: "🇮🇳" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ", flag: "🇮🇳" },
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
  mr: {
    // Brand & App
    app_title: "सेवा सारथी",
    appTitle: "सेवा सारथी",
    app_subtitle: "एक अर्ज. सक्षम भारत.",
    appTagline: "एक अर्ज. सक्षम भारत.",
    
    // Navigation
    home: "मुख्यपृष्ठ",
    apply_for_service: "योजनेसाठी अर्ज करा",
    applyService: "योजनेसाठी अर्ज करा",
    discover_services: "योजना शोधा",
    findServices: "योजना शोधा",
    my_applications: "माझे अर्ज",
    myApplications: "माझे अर्ज",
    documents: "कागदपत्रे",
    myDocuments: "कागदपत्रे",
    documentsVault: "कागदपत्रे",
    tasks_reminders: "कार्ये व स्मरणपत्रे",
    tasks: "कार्ये व स्मरणपत्रे",
    notifications: "सूचना",
    my_profile: "माझी प्रोफाईल",
    myProfile: "माझी प्रोफाईल",
    help_support: "मदत व सपोर्ट",
    help: "मदत व सपोर्ट",
    easy_mode: "सोपा मोड",
    easyMode: "सोपा मोड",

    // Greetings
    good_morning: "शुभ प्रभात",
    good_afternoon: "शुभ दुपार",
    good_evening: "शुभ संध्याकाळ",
    welcome: "स्वागत आहे",

    // Dashboard Hub
    what_help_needed: "तुम्हाला कशात मदत हवी आहे?",
    whatDoYouNeedHelpWith: "तुम्हाला कशात मदत हवी आहे?",
    tell_seva_saarthi: "सेवा सारथीला सांगा तुम्हाला काय हवे आहे",
    tellSevaSaarthi: "सेवा सारथीला सांगा तुम्हाला काय हवे आहे",
    tap_to_speak: "बोलण्यासाठी टॅप करा",
    voice_placeholder: "स्थिती तपासण्यासाठी किंवा कागदपत्रे जोडण्यासाठी बोला.",
    
    // Actions & Badges
    verified: "तपासलेले व तयार",
    action_required: "कार्रवाई आवश्यक",
    actionRequired: "कार्रवाई आवश्यक",
    missing: "उर्वरित कागदपत्रे",
    almost_ready: "तुम्ही जवळजवळ तयार आहात",
    explore_schemes: "योजना पहा",
    view_progress: "प्रगती पहा",
    open_locker: "लॉकर उघडा",
    complete_task: "कार्य पूर्ण करा",
    ask_question: "प्रश्न विचारा",
    find_services: "सेवा शोधा",
    apply_now: "अर्ज करा",
    view_status: "स्थिती पहा",
    resolve_now: "निवारण करा",

    // Dashboard Content
    digilocker_verified: "डिजिलॉकर सत्यापित नागरिक",
    welcome_user: "स्वागत आहे",
    applications_on_record: "अर्ज नोंदणीत आहेत",
    verified_documents_saved: "सत्यापित कागदपत्रे जतन केली",
    ask_voice_saarthi: "व्हॉइस सारथीला विचारा",
    find_schemes: "योजना शोधा",
    find_schemes_desc: "50+ शिष्यवृत्ती, शेती, गृहनिर्माण व कल्याण योजना शोधा.",
    explore_all: "सर्व पहा",
    apply_for_a_service: "सेवेसाठी अर्ज करा",
    apply_service_desc: "आवश्यक कागदपत्रे तपासा आणि 1-क्लिक ऑटोफिल ने अर्ज करा.",
    start_application: "अर्ज सुरू करा",
    my_applications_title: "माझे अर्ज",
    total: "एकूण",
    my_applications_desc: "शासकीय प्रक्रिया टप्पे व मंजुरी स्थिती पहा.",
    track_status: "स्थिती ट्रॅक करा",
    my_documents: "माझी कागदपत्रे",
    stored: "जतन केले",
    my_documents_desc: "आधार, पॅन, मार्कशीट व उत्पन्न प्रमाणपत्रे सुरक्षित जतन.",
    open_vault: "व्हॉल्ट उघडा",
    active_application_status: "सक्रिय अर्ज स्थिती",
    application_id: "अर्ज आयडी",
    applied_on: "अर्ज तारीख",
    view_full_tracking: "संपूर्ण ट्रॅकिंग तपशील पहा",
    need_help: "अर्ज किंवा कागदपत्रांबद्दल मदत हवी आहे?",
    help_desc: "मोफत नागरिक सहाय्य हेल्पलाइन व AI मार्गदर्शन 24/7 उपलब्ध.",
    get_help: "मदत घ्या",
  },
  ta: {
    // Brand & App
    app_title: "சேவா சாரதி",
    appTitle: "சேவா சாரதி",
    app_subtitle: "ஒற்றை விண்ணப்பம். வளர்ந்த இந்தியா.",
    appTagline: "ஒற்றை விண்ணப்பம். வளர்ந்த இந்தியா.",
    
    // Navigation
    home: "முகப்பு",
    apply_for_service: "சேவைக்கு விண்ணப்பிக்கவும்",
    applyService: "சேவைக்கு விண்ணப்பிக்கவும்",
    discover_services: "திட்டங்களை கண்டறியவும்",
    findServices: "திட்டங்களை கண்டறியவும்",
    my_applications: "எனது விண்ணப்பங்கள்",
    myApplications: "எனது விண்ணப்பங்கள்",
    documents: "ஆவணங்கள்",
    myDocuments: "ஆவணங்கள்",
    documentsVault: "ஆவணங்கள்",
    tasks_reminders: "செய்யவேண்டிய பணிகள்",
    tasks: "செய்யவேண்டிய பணிகள்",
    notifications: "அறிவிப்புகள்",
    my_profile: "எனது சுயவிவரம்",
    myProfile: "எனது சுயவிவரம்",
    help_support: "உதவி & ஆதரவு",
    help: "உதவி & ஆதரவு",
    easy_mode: "எளிய முறை",
    easyMode: "எளிய முறை",

    // Greetings
    good_morning: "காலை வணக்கம்",
    good_afternoon: "மதிய வணக்கம்",
    good_evening: "மாலை வணக்கம்",
    welcome: "நல்வரவு",

    // Dashboard Hub
    what_help_needed: "உங்களுக்கு என்ன உதவி தேவை?",
    whatDoYouNeedHelpWith: "உங்களுக்கு என்ன உதவி தேவை?",
    tell_seva_saarthi: "உங்களுக்கு தேவையானதை சேவா சாரதியிடம் சொல்லுங்கள்",
    tellSevaSaarthi: "உங்களுக்கு தேவையானதை சேவா சாரதியிடம் சொல்லுங்கள்",
    tap_to_speak: "பேச தட்டவும்",
    voice_placeholder: "நிலை சரிபார்க்க அல்லது ஆவணங்களை பதிவேற்ற பேசவும்.",
    
    // Actions & Badges
    verified: "சரிபார்க்கப்பட்டது",
    action_required: "நடவடிக்கை தேவை",
    actionRequired: "நடவடிக்கை தேவை",
    missing: "தேவைப்படும் ஆவணங்கள்",
    almost_ready: "நீங்கள் தயாராகிவிட்டீர்கள்",
    explore_schemes: "திட்டங்களை காண்க",
    view_progress: "நிலையை காண்க",
    open_locker: "லாக்கரை திறக்கவும்",
    complete_task: "முடிக்கவும்",
    ask_question: "கேள்வி கேட்க",
    find_services: "சேவைகளை தேட",
    apply_now: "விண்ணப்பிக்கவும்",
    view_status: "நிலை காண்க",
    resolve_now: "சரிசெய்யவும்",

    // Dashboard Content
    digilocker_verified: "டிஜிலாக்கர் சரிபார்க்கப்பட்ட குடிமகன்",
    welcome_user: "நல்வரவு",
    applications_on_record: "விண்ணப்பங்கள் பதிவில் உள்ளன",
    verified_documents_saved: "சரிபார்க்கப்பட்ட ஆவணங்கள் சேமிக்கப்பட்டன",
    ask_voice_saarthi: "வாய்ஸ் சாரதியிடம் கேளுங்கள்",
    find_schemes: "திட்டங்களை கண்டறியுங்கள்",
    find_schemes_desc: "50+ உதவித்தொகை, விவசாயம், வீட்டுவசதி & நலத் திட்டங்களை ஆராயுங்கள்.",
    explore_all: "அனைத்தும் காண்க",
    apply_for_a_service: "சேவைக்கு விண்ணப்பிக்கவும்",
    apply_service_desc: "தேவையான ஆவணங்களை சரிபார்த்து 1-கிளிக் ஆட்டோஃபில்லில் விண்ணப்பிக்கவும்.",
    start_application: "விண்ணப்பம் தொடங்கவும்",
    my_applications_title: "எனது விண்ணப்பங்கள்",
    total: "மொத்தம்",
    my_applications_desc: "அரசு செயலாக்க நிலைகள் & ஒப்புதல் கட்டங்களை கண்காணிக்கவும்.",
    track_status: "நிலையை கண்காணி",
    my_documents: "எனது ஆவணங்கள்",
    stored: "சேமிக்கப்பட்டது",
    my_documents_desc: "ஆதார், பான், மார்க்ஷீட் & வருமான சான்றிதழ்கள் பாதுகாப்பாக சேமிக்கப்பட்டன.",
    open_vault: "வால்ட் திறக்கவும்",
    active_application_status: "செயலில் உள்ள விண்ணப்ப நிலை",
    application_id: "விண்ணப்ப ஐடி",
    applied_on: "விண்ணப்பித்த தேதி",
    view_full_tracking: "முழு கண்காணிப்பு விவரங்களை காண்க",
    need_help: "விண்ணப்பம் அல்லது ஆவணம் குறித்து உதவி வேண்டுமா?",
    help_desc: "இலவச குடிமகன் உதவி ஹெல்ப்லைன் & AI வழிகாட்டுதல் 24/7 கிடைக்கும்.",
    get_help: "உதவி பெறுங்கள்",
  },
  kn: {
    // Brand & App
    app_title: "ಸೇವಾ ಸಾರಥಿ",
    appTitle: "ಸೇವಾ ಸಾರಥಿ",
    app_subtitle: "ಒಂದು ಅರ್ಜಿ. ಸಮರ್ಥ ಭಾರತ.",
    appTagline: "ಒಂದು ಅರ್ಜಿ. ಸಮರ್ಥ ಭಾರತ.",
    
    // Navigation
    home: "ಮುಖಪುಟ",
    apply_for_service: "ಸೇವೆಗೆ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ",
    applyService: "ಸೇವೆಗೆ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ",
    discover_services: "ಯೋಜನೆಗಳನ್ನು ಹುಡುಕಿ",
    findServices: "ಯೋಜನೆಗಳನ್ನು ಹುಡುಕಿ",
    my_applications: "ನನ್ನ ಅರ್ಜಿಗಳು",
    myApplications: "ನನ್ನ ಅರ್ಜಿಗಳು",
    documents: "ದಾಖಲೆಗಳು",
    myDocuments: "ದಾಖಲೆಗಳು",
    documentsVault: "ದಾಖಲೆಗಳು",
    tasks_reminders: "ಮಾಡಬೇಕಾದ ಕೆಲಸಗಳು",
    tasks: "ಮಾಡಬೇಕಾದ ಕೆಲಸಗಳು",
    notifications: "ಸೂಚನೆಗಳು",
    my_profile: "ನನ್ನ ವಿವರಗಳು",
    myProfile: "ನನ್ನ ವಿವರಗಳು",
    help_support: "ಸಹಾಯ & ಬೆಂಬಲ",
    help: "ಸಹಾಯ & ಬೆಂಬಲ",
    easy_mode: "ಸುಲಭ ಮೋಡ್",
    easyMode: "ಸುಲಭ ಮೋಡ್",

    // Greetings
    good_morning: "ಶುಭೋದಯ",
    good_afternoon: "ಶುಭ ಮಧ್ಯಾಹ್ನ",
    good_evening: "ಶುಭ ಸಂಜೆ",
    welcome: "ಸ್ವಾಗತ",

    // Dashboard Hub
    what_help_needed: "ನಿಮಗೆ ಯಾವ ಸಹಾಯ ಬೇಕು?",
    whatDoYouNeedHelpWith: "ನಿಮಗೆ ಯಾವ ಸಹಾಯ ಬೇಕು?",
    tell_seva_saarthi: "ಸೇವಾ ಸಾರಥಿಗೆ ಧ್ವನಿಯ ಮೂಲಕ ತಿಳಿಸಿ",
    tellSevaSaarthi: "ಸೇವಾ ಸಾರಥಿಗೆ ಧ್ವನಿಯ ಮೂಲಕ ತಿಳಿಸಿ",
    tap_to_speak: "ಮಾತನಾಡಲು ಒತ್ತಿರಿ",
    voice_placeholder: "ಅರ್ಜಿ ಸ್ಥಿತಿ ನೋಡಲು ಅಥವಾ ದಾಖಲೆಗಳನ್ನು ಅಪ್ಲೋಡ್ ಮಾಡಲು ಮಾತನಾಡಿ.",
    
    // Actions & Badges
    verified: "ಪರಿಶೀಲಿಸಲಾಗಿದೆ",
    action_required: "ಕ್ರಮ ಅಗತ್ಯವಿದೆ",
    actionRequired: "ಕ್ರಮ ಅಗತ್ಯವಿದೆ",
    missing: "ಇನ್ನೂ ಅಗತ್ಯವಿರುವ ದಾಖಲೆಗಳು",
    almost_ready: "ನೀವು ಸಿದ್ಧರಾಗಿದ್ದೀರಿ",
    explore_schemes: "ಯೋಜನೆಗಳನ್ನು ನೋಡಿ",
    view_progress: "ಪ್ರಗತಿ ನೋಡಿ",
    open_locker: "ಲಾಕರ್ ತೆರೆಯಿರಿ",
    complete_task: "ಪೂರ್ಣಗೊಳಿಸಿ",
    ask_question: "ಸಹಾಯ ಕೇಳಿ",
    find_services: "ಸೇವೆಗಳನ್ನು ಹುಡುಕಿ",
    apply_now: "ಅರ್ಜಿ ಸಲ್ಲಿಸಿ",
    view_status: "ಸ್ಥಿತಿ ನೋಡಿ",
    resolve_now: "ಪರಿಹರಿಸಿ",

    // Dashboard Content
    digilocker_verified: "ಡಿಜಿಲಾಕರ್ ಪರಿಶೀಲಿಸಿದ ನಾಗರಿಕ",
    welcome_user: "ಸ್ವಾಗತ",
    applications_on_record: "ಅರ್ಜಿಗಳು ದಾಖಲೆಯಲ್ಲಿವೆ",
    verified_documents_saved: "ಪರಿಶೀಲಿಸಿದ ದಾಖಲೆಗಳು ಉಳಿಸಲಾಗಿದೆ",
    ask_voice_saarthi: "ವಾಯ್ಸ್ ಸಾರಥಿ ಕೇಳಿ",
    find_schemes: "ಯೋಜನೆಗಳನ್ನು ಹುಡುಕಿ",
    find_schemes_desc: "50+ ಶಿಷ್ಯವೇತನ, ಕೃಷಿ, ವಸತಿ ಮತ್ತು ಕಲ್ಯಾಣ ಯೋಜನೆಗಳನ್ನು ಪರಿಶೀಲಿಸಿ.",
    explore_all: "ಎಲ್ಲವನ್ನೂ ನೋಡಿ",
    apply_for_a_service: "ಸೇವೆಗೆ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ",
    apply_service_desc: "ಅಗತ್ಯವಿರುವ ದಾಖಲೆಗಳನ್ನು ಪರಿಶೀಲಿಸಿ ಮತ್ತು 1-ಕ್ಲಿಕ್ ಆಟೋಫಿಲ್‌ನೊಂದಿಗೆ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ.",
    start_application: "ಅರ್ಜಿ ಪ್ರಾರಂಭಿಸಿ",
    my_applications_title: "ನನ್ನ ಅರ್ಜಿಗಳು",
    total: "ಒಟ್ಟು",
    my_applications_desc: "ಸರ್ಕಾರಿ ಪ್ರಕ್ರಿಯೆಯ ಹಂತಗಳು ಮತ್ತು ಅನುಮೋದನೆ ಸ್ಥಿತಿ ಪರಿಶೀಲಿಸಿ.",
    track_status: "ಸ್ಥಿತಿ ಟ್ರ್ಯಾಕ್ ಮಾಡಿ",
    my_documents: "ನನ್ನ ದಾಖಲೆಗಳು",
    stored: "ಉಳಿಸಲಾಗಿದೆ",
    my_documents_desc: "ಆಧಾರ್, ಪಾನ್, ಅಂಕಪಟ್ಟಿ ಮತ್ತು ಆದಾಯ ಪ್ರಮಾಣಪತ್ರ ಸುರಕ್ಷಿತವಾಗಿ ಸಂಗ್ರಹಿಸಲಾಗಿದೆ.",
    open_vault: "ವಾಲ್ಟ್ ತೆರೆಯಿರಿ",
    active_application_status: "ಸಕ್ರಿಯ ಅರ್ಜಿಯ ಸ್ಥಿತಿ",
    application_id: "ಅರ್ಜಿ ಐಡಿ",
    applied_on: "ಅರ್ಜಿ ಸಲ್ಲಿಸಿದ ದಿನಾಂಕ",
    view_full_tracking: "ಪೂರ್ಣ ಟ್ರ್ಯಾಕಿಂಗ್ ವಿವರಗಳನ್ನು ನೋಡಿ",
    need_help: "ಅರ್ಜಿ ಅಥವಾ ದಾಖಲೆಯ ಬಗ್ಗೆ ಸಹಾಯ ಬೇಕೇ?",
    help_desc: "ಉಚಿತ ನಾಗರಿಕ ಸಹಾಯವಾಣಿ & AI ಮಾರ್ಗದರ್ಶನ 24/7 ಲಭ್ಯವಿದೆ.",
    get_help: "ಸಹಾಯ ಪಡೆಯಿರಿ",
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