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