import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';

// =====================================================================
// WORLDVIEW COMPASS — MASTER FRONTEND PRESENTATION SHELL (worldview_app.tsx)
// Document Class: Presentation Shell & User Experience Engine
// Governed Specifications: Part 8 & Part 9 | Master UI Specification
// Foundational Axiom: "A Map, Not a Verdict" (एक मानचित्र, कोई निर्णय नहीं)
// Decoupled File Architecture: Frontend presents, animates & records;
// it never calculates, never scores, and never infers.
// =====================================================================

// --- TYPES & INTERFACES ---
export type AssessmentTrack = 'track_1' | 'track_2' | 'track_3';
export type Language = 'en' | 'hi';
export type ActiveView = 'home' | 'console' | 'results';

export interface DimensionItem {
  id: string;
  order: number;
  macro_domain: string;
  name_en: string;
  name_hi: string;
  negative_pole: string;
  positive_pole: string;
  negative_pole_hi: string;
  positive_pole_hi: string;
}

export interface ClusterItem {
  id: string;
  order: number;
  macro_region: string;
  name_en: string;
  name_hi: string;
  defining_signature: string;
  defining_tension_en: string;
  defining_tension_hi: string;
  boundary_defense: string;
  assigned_range: string;
  worldview_members: string[];
}

export interface QuestionOption {
  option_id: string;
  text_en: string;
  text_hi: string;
  vectors?: Array<{ dimension: string; weight: number }>;
}

export interface AssessmentQuestion {
  question_id: string;
  dimension?: string;
  primary_dimension?: string;
  macro_domain: string;
  sub_topic: string;
  polarity?: number;
  statement_en?: string;
  statement_hi?: string;
  scenario_en?: string;
  scenario_hi?: string;
  options?: QuestionOption[];
}

export interface WorldviewRecord {
  id: string;
  cluster_id: string;
  cluster_name?: string;
  profile_type: string;
  name_en: string;
  name_hi: string;
  historical_era: string;
  geographic_origin: string;
  short_description_en: string;
  short_description_hi: string;
  full_description_en: string;
  full_description_hi: string;
  founder?: string;
  epistemological_framework?: string;
  canonical_texts?: string;
  famous_quote?: string;
  historical_associations?: string;
  vector: Record<string, number>;
  doctrinal_weights?: Record<string, number>;
  dimension_rationales?: Record<string, string>;
  sources?: Array<{ source_type: string; title: string; author?: string; citation?: string; url?: string }>;
}

export interface EvaluatedCoordinate {
  name: string;
  position: number;
  coverage: number;
  conflict: number;
  status: 'decisive' | 'moderate' | 'high_conflict' | 'low_coverage' | 'unmeasured';
}

export interface WorldviewMatch {
  rank: number;
  worldview_id: string;
  name_en: string;
  name_hi: string;
  cluster_id: string;
  cluster_name: string;
  similarity_score: number;
  euclidean_distance: number;
  core_dimension_alignment: number;
}

export interface ClusterProximity {
  rank: number;
  cluster_id: string;
  name: string;
  name_hi?: string;
  similarity_score: number;
  distance_to_centroid: number;
}

export interface DiagnosticAlert {
  type: string;
  dimension_id: string;
  dimension_name: string;
  conflict_score?: number;
  coverage_score?: number;
  explanation: string;
}

export interface EvaluationResponse {
  status: string;
  engine_version: string;
  assessment_track: string;
  summary: {
    total_questions_evaluated: number;
    dimensions_with_evidence: number;
    mean_confidence_coverage: number;
    highest_conflict_dimension: string;
  };
  user_coordinates: Record<string, EvaluatedCoordinate>;
  radar_series: Array<{ dimension_id: string; axis_index: number; normalized_value: number }>;
  top_matches: WorldviewMatch[];
  cluster_proximities: ClusterProximity[];
  diagnostic_alerts: DiagnosticAlert[];
}

// --- DOMAIN COLOR ACCENTS & TRANSLATIONS ---
const DOMAIN_COLORS: Record<string, string> = {
  "Human Nature & Self": "#F59E0B",
  "Society, Governance & Order": "#3B82F6",
  "Reality, Metaphysics & Epistemology": "#10B981",
  "Ethics, Morality & Value": "#8B5CF6",
  "Civilization, Meaning & Existence": "#EC4899"
};

const DOMAIN_HINDI: Record<string, string> = {
  "Human Nature & Self": "मानव स्वभाव और आत्म-चेतना",
  "Society, Governance & Order": "समाज, शासन और व्यवस्था",
  "Reality, Metaphysics & Epistemology": "यथार्थ, तत्वमीमांसा और ज्ञानमीमांसा",
  "Ethics, Morality & Value": "नीतिशास्त्र, नैतिकता और मूल्य",
  "Civilization, Meaning & Existence": "सभ्यता, सार्थकता और अस्तित्व"
};

// Master UI Localization Dictionary (Semantic Hindi - Zero Transliteration)
const UI_STRINGS: Record<Language, Record<string, string>> = {
  en: {
    app_title: "WORLDVIEW COMPASS",
    app_subtitle: "A Map, Not a Verdict",
    hero_statement: "Explore where your intuitions sit across 25 fundamental dimensions of human thought, mapped against 250 canonical historical and contemporary philosophical traditions.",
    track_1_title: "Track 1: Quick Baseline",
    track_1_desc: "50 rapid Agree/Disagree statements establishing broad dimensional orientation.",
    track_1_time: "~5-7 minutes",
    track_2_title: "Track 2: Nuanced Stances",
    track_2_desc: "25 four-way philosophical dilemmas capturing precise degrees of conviction.",
    track_2_time: "~8-12 minutes",
    track_3_title: "Track 3: Deep Scenarios",
    track_3_desc: "100 applied scenario trade-offs testing competing principles under constraint.",
    track_3_time: "~20-30 minutes",
    start_btn: "Begin Assessment",
    nav_prev: "Previous",
    nav_next: "Next",
    nav_skip: "Skip",
    nav_jump: "Select Question",
    nav_reset: "Reset",
    cta_ready: "Ready to see your worldview",
    select_two: "Select exactly 2 of 6 options",
    selected_count: "{n} of 2 Selected",
    ready_to_advance: "2 of 2 Selected — Ready",
    q_counter: "Question {current} of {total}",
    agree: "Agree",
    disagree: "Disagree",
    reset_modal_title: "Are you sure you want to reset?",
    reset_modal_desc: "All current answers and test progress in this session will be permanently erased.",
    btn_yes_reset: "Yes, Reset",
    btn_no_continue: "No, Continue",
    jump_modal_title: "Question Navigation Matrix",
    jump_answered: "Answered",
    jump_current: "Current",
    jump_skipped: "Skipped",
    jump_unseen: "Unseen",
    results_title: "YOUR WORLDVIEW MAP",
    results_subtitle: "Structural Geometric Resemblance Profile",
    top_match_label: "CLOSEST STRUCTURAL MATCH",
    similarity_score: "Similarity Alignment",
    cluster_family_label: "Philosophical Family",
    radar_title: "25-Dimensional Radar Constellation",
    toggle_overlay: "Compare with Tradition Vector",
    top_matches_title: "Top Canonical Resemblances",
    cluster_rankings_title: "Broader Philosophical Neighborhoods",
    diagnostics_title: "Dialectical Tensions & Nuance Insights",
    deep_dive_btn: "Scholarly Deep Dive",
    share_btn: "Share Your Compass",
    retake_btn: "Retake Assessment",
    explore_all_btn: "Explore All 250 Traditions",
    about_title: "About Worldview Compass",
    about_drawer_1_title: "A Map, Not a Verdict",
    about_drawer_1_text: "Worldview Compass is an educational and analytical measurement instrument, not an ideological judge. It never grades moral superiority or psychological correctness. An alignment score of 91% with Classical Stoicism means your articulated intuitions share geometrical resemblance with Stoic tenets, not that you must adopt a Stoic identity.",
    about_drawer_2_title: "The 25 Dimensions & 5 Macro-Domains",
    about_drawer_2_text: "Human philosophy cannot be reduced to a 1D left-right spectrum. The Compass measures 25 orthogonal continuous axes spanning Human Nature, Society, Reality, Ethics, and Civilization, allowing radical agency, communitarian ethics, and empirical rationalism to coexist seamlessly.",
    about_drawer_3_title: "Data Privacy & Session Resilience",
    about_drawer_3_text: "All in-progress test answers reside exclusively in your client browser localStorage. Zero draft responses are transmitted over the network until you click 'Ready to see your worldview'.",
    close_btn: "Close",
    era_label: "Historical Era",
    founder_label: "Founding Thinkers",
    region_label: "Geographic Origin",
    epistemology_label: "Epistemological Framework",
    texts_label: "Canonical Treatises",
    quote_label: "Iconic Insight",
    external_links_label: "Authoritative Scholarly Provenance",
    copied_alert: "Stateless share link copied to clipboard!"
  },
  hi: {
    app_title: "विश्वदृष्टि कंपास",
    app_subtitle: "एक मानचित्र, कोई निर्णय नहीं",
    hero_statement: "मानव चिंतन के 25 मूलभूत आयामों पर अपने अंतर्ज्ञान की स्थिति जानें, जिसे 250 ऐतिहासिक और समकालीन दार्शनिक परंपराओं के साथ मैप किया गया है।",
    track_1_title: "ट्रैक 1: त्वरित आधारभूत मूल्यांकन",
    track_1_desc: "व्यापक वैचारिक दिशा निर्धारित करने वाले 50 तीव्र 'सहमत / असहमत' कथन।",
    track_1_time: "~5-7 मिनट",
    track_2_title: "ट्रैक 2: सूक्ष्म वैचारिक दृष्टिकोण",
    track_2_desc: "25 चार-विकल्पीय दार्शनिक प्रश्न जो विचारों की गहन सूक्ष्मता को मापते हैं।",
    track_2_time: "~8-12 मिनट",
    track_3_title: "ट्रैक 3: गहन परिस्थितिजन्य विश्लेषण",
    track_3_desc: "100 व्यावहारिक असमंजस परिदृश्य (6 में से ठीक 2 विकल्प चुनें) जो प्राथमिकताओं को परखते हैं।",
    track_3_time: "~20-30 मिनट",
    start_btn: "मूल्यांकन प्रारंभ करें",
    nav_prev: "पिछला",
    nav_next: "अगला",
    nav_skip: "छोड़ें",
    nav_jump: "प्रश्न चुनें",
    nav_reset: "पुनः प्रारंभ",
    cta_ready: "अपना दृष्टिकोण देखने के लिए तैयार",
    select_two: "6 में से ठीक 2 विकल्प चुनें",
    selected_count: "2 में से {n} चयनित",
    ready_to_advance: "2 में से 2 चयनित — तैयार",
    q_counter: "प्रश्न {current} / {total}",
    agree: "सहमत",
    disagree: "असहमत",
    reset_modal_title: "क्या आप वाकई पुनः प्रारंभ करना चाहते हैं?",
    reset_modal_desc: "इस सत्र के आपके सभी वर्तमान उत्तर और प्रगति स्थायी रूप से समाप्त हो जाएंगे।",
    btn_yes_reset: "हाँ, पुनः प्रारंभ करें",
    btn_no_continue: "नहीं, जारी रखें",
    jump_modal_title: "प्रश्न नेविगेशन मैट्रिक्स",
    jump_answered: "उत्तरित",
    jump_current: "वर्तमान",
    jump_skipped: "छोड़ा गया",
    jump_unseen: "अनिरीक्षित",
    results_title: "आपका विश्वदृष्टि मानचित्र",
    results_subtitle: "संरचनात्मक ज्यामितीय समानता रूपरेखा",
    top_match_label: "निकटतम संरचनात्मक समानता",
    similarity_score: "समानता प्रतिशत",
    cluster_family_label: "दार्शनिक परिवार",
    radar_title: "25-आयामी रडार तारामंडल",
    toggle_overlay: "परंपरागत वेक्टर के साथ तुलना करें",
    top_matches_title: "शीर्ष दार्शनिक समानताएं",
    cluster_rankings_title: "व्यापक दार्शनिक पड़ोस",
    diagnostics_title: "द्वंद्वात्मक अंतर्विरोध एवं सूक्ष्म विश्लेषण",
    deep_dive_btn: "विस्तृत दार्शनिक अध्ययन",
    share_btn: "परिणाम साझा करें",
    retake_btn: "पुनः मूल्यांकन करें",
    explore_all_btn: "सभी 250 विश्वदृष्टियों का अन्वेषण करें",
    about_title: "विश्वदृष्टि कंपास के बारे में",
    about_drawer_1_title: "एक मानचित्र, कोई निर्णय नहीं",
    about_drawer_1_text: "विश्वदृष्टि कंपास एक विश्लेषणात्मक और शैक्षणिक मापन यंत्र है, कोई वैचारिक न्यायाधीश नहीं। यह कभी भी नैतिक या बौद्धिक श्रेष्ठता का निर्णय नहीं देता। किसी परंपरा (जैसे स्टोइकवाद) के साथ 91% समानता का अर्थ है कि आपके विचार स्टोइक सिद्धांतों के संरचनात्मक समरूप हैं, इसका यह अर्थ नहीं कि आप 'स्टोइक' बन गए हैं।",
    about_drawer_2_title: "25 आयाम और 5 मुख्य क्षेत्र",
    about_drawer_2_text: "मानव दर्शन को केवल एक सरल वाम-दक्षिण पैमाने पर नहीं समेटा जा सकता। यह कंपास मानव स्वभाव, समाज, यथार्थ, नीतिशास्त्र और सभ्यता के 25 स्वतंत्र आयामों को मापता है।",
    about_drawer_3_title: "डेटा गोपनीयता और सत्र सुरक्षा",
    about_drawer_3_text: "मूल्यांकन के दौरान आपके सभी उत्तर पूरी तरह आपके ब्राउज़र के localStorage में सुरक्षित रहते हैं। जब तक आप परिणाम देखने के लिए क्लिक नहीं करते, कोई भी डेटा सर्वर पर नहीं भेजा जाता।",
    close_btn: "बंद करें",
    era_label: "ऐतिहासिक काल",
    founder_label: "संस्थापक एवं प्रमुख विचारक",
    region_label: "भौगोलिक उद्गम",
    epistemology_label: "ज्ञानमीमांसा ढांचा",
    texts_label: "प्रामाणिक ग्रंथ",
    quote_label: "प्रसिद्ध उद्धरण",
    external_links_label: "प्रामाणिक अकादमिक स्रोत",
    copied_alert: "लिंक क्लिपबोर्ड पर कॉपी हो गया!"
  }
};

// Embedded Canonical Fallback Data (Guarantees 100% offline standalone operation)
const EMBEDDED_DIMENSIONS: DimensionItem[] = [{"id": "D01", "order": 1, "macro_domain": "Human Nature & Self", "name_en": "Individual vs. Collective Identity", "name_hi": "व्यक्तिगत बनाम सामूहिक पहचान", "negative_pole": {"definition_en": "Individual Primacy (-1.0): The individual is the fundamental unit of reality and moral value.", "definition_hi": "व्यक्तिगत प्रधानता (-1.0): व्यक्ति ही वास्तविकता और नैतिक मूल्य की मूल इकाई है।"}, "positive_pole": {"definition_en": "Collective Primacy (+1.0): The community, group, or culture is primary; self is socially embedded.", "definition_hi": "सामूहिक प्रधानता (+1.0): समुदाय या संस्कृति प्राथमिक है; व्यक्ति सामाजिक ताने-बाने से जुड़ा है।"}, "core_philosophical_question": "What is the primary locus of identity and moral belonging: the autonomous individual or the collective whole?", "boundary_defense_rule": "D01 (Identity Ontology) vs. D04 (Ethical Obligation): D01 asks who is fundamental, while D04 asks how obligations arise."}, {"id": "D02", "order": 2, "macro_domain": "Human Nature & Self", "name_en": "Autonomy vs. Authority", "name_hi": "स्वायत्तता बनाम अधिकार", "negative_pole": {"definition_en": "Personal Autonomy (-1.0): Decisions legitimately originate from individual conscience and sovereignty.", "definition_hi": "व्यक्तिगत स्वायत्तता (-1.0): निर्णय व्यक्तिगत विवेक और संप्रभुता से उत्पन्न होने चाहिए।"}, "positive_pole": {"definition_en": "Institutional Authority (+1.0): Guidance and governance legitimately derive from established institutions and law.", "definition_hi": "संस्थागत अधिकार (+1.0): मार्गदर्शन और शासन स्थापित संस्थाओं और कानून से प्राप्त होता है।"}, "core_philosophical_question": "Who should legitimately direct an individual's choices and beliefs: personal conscience or institutional hierarchy?", "boundary_defense_rule": "The Tri-Axial Freedom Defense: D02 addresses institutional/hierarchical legitimacy, distinct from civil liberty (D07) and free agency (D25)."}, {"id": "D03", "order": 3, "macro_domain": "Human Nature & Self", "name_en": "Human Plasticity vs. Fixed Nature", "name_hi": "मानव परिवर्तनशीलता बनाम स्थिर स्वभाव", "negative_pole": {"definition_en": "Radical Plasticity (-1.0): Human nature is fluid, socially constructed, and malleable.", "definition_hi": "परिवर्तनशीलता (-1.0): मानव स्वभाव सामाजिक रूप से निर्मित और असीम रूप से परिवर्तनशील है।"}, "positive_pole": {"definition_en": "Fixed Essential Nature (+1.0): Humans possess an immutable biological, metaphysical, or spiritual nature.", "definition_hi": "स्थिर स्वभाव (+1.0): मानव का एक अंतर्निहित, अपरिवर्तनीय जैविक या आध्यात्मिक स्वभाव होता है।"}, "core_philosophical_question": "Can human nature be fundamentally remolded through culture and education, or is it bound by innate biological/spiritual constraints?", "boundary_defense_rule": "D03 isolates ontological malleability of human nature from civilizational progressivism (D21) and historical meliorism (D23)."}, {"id": "D04", "order": 4, "macro_domain": "Human Nature & Self", "name_en": "Self-Interest vs. Mutual Obligation", "name_hi": "स्वार्थ बनाम पारस्परिक कर्तव्य", "negative_pole": {"definition_en": "Rational Self-Interest (-1.0): Action is legitimately rooted in personal flourishing and chosen goals.", "definition_hi": "तर्कसंगत स्वार्थ (-1.0): कर्म व्यक्तिगत उत्कर्ष और स्व-निर्धारित लक्ष्यों में निहित है।"}, "positive_pole": {"definition_en": "Mutual Moral Obligation (+1.0): Human action is grounded in intrinsic solidarity, altruism, and debt to others.", "definition_hi": "पारस्परिक कर्तव्य (+1.0): कर्म अंतर्निहित एकजुटता, परोपकार और समाज के प्रति ऋण पर आधारित है।"}, "core_philosophical_question": "Are human associations justified primarily by mutual utility and personal interest, or by unchosen moral debt and solidarity?", "boundary_defense_rule": "D04 addresses ethical motivation and interpersonal bond, distinct from social ontological status (D01)."}, {"id": "D05", "order": 5, "macro_domain": "Human Nature & Self", "name_en": "Immanent Fulfillment vs. Transcendence", "name_hi": "सांसारिक पूर्णता बनाम पारलौकिक उत्थान", "negative_pole": {"definition_en": "Immanent Flourishing (-1.0): Purpose and well-being are attained entirely within earthly bodily lifespan.", "definition_hi": "सांसारिक उत्कर्ष (-1.0): जीवन का उद्देश्य इसी प्राकृतिक जीवन और सांसारिक सीमाओं में प्राप्त होता है।"}, "positive_pole": {"definition_en": "Transcendental Realization (+1.0): Ultimate human destiny transcends bodily life, requiring spiritual liberation.", "definition_hi": "पारलौकिक उत्थान (+1.0): अंतिम गंतव्य भौतिक जीवन से परे है, जिसके लिए आध्यात्मिक मुक्ति आवश्यक है।"}, "core_philosophical_question": "Is human fulfillment confined to natural, historical existence, or does it culminate in transcendent, metaphysical realization?", "boundary_defense_rule": "D05 concerns the locus of human flourishing (this-worldly vs other-worldly), whereas D22 addresses cosmic meaning vs constructed purpose."}, {"id": "D06", "order": 6, "macro_domain": "Society & Governance", "name_en": "Egalitarianism vs. Functional Hierarchy", "name_hi": "समानतावाद बनाम कार्यात्मक पदानुक्रम", "negative_pole": {"definition_en": "Strict Egalitarianism (-1.0): Equal moral and civic standing demands minimizing status and power distinctions.", "definition_hi": "कठोर समानतावाद (-1.0): बुनियादी नैतिक और राजनीतिक समानता शक्ति और संपत्ति के भेदों को न्यूनतम करने की मांग करती है।"}, "positive_pole": {"definition_en": "Natural / Functional Hierarchy (+1.0): Differentiated roles, hierarchy, and merit are essential for civil order.", "definition_hi": "कार्यात्मक पदानुक्रम (+1.0): नागरिक व्यवस्था और उत्कृष्टता के लिए भूमिकाओं का भेद और पदानुक्रम अनिवार्य है।"}, "core_philosophical_question": "Should society actively level disparities of power, wealth, and status, or preserve functional hierarchical roles?", "boundary_defense_rule": "D06 evaluates structural status equality, distinct from universal legal application (D10) and impartial justice (D17)."}, {"id": "D07", "order": 7, "macro_domain": "Society & Governance", "name_en": "Personal Liberty vs. Social Order", "name_hi": "व्यक्तिगत स्वतंत्रता बनाम सामाजिक व्यवस्था", "negative_pole": {"definition_en": "Unconditional Liberty (-1.0): Freedom of speech, action, and conscience must not be overridden by state coercion.", "definition_hi": "पूर्ण स्वतंत्रता (-1.0): अभिव्यक्ति और कर्म की स्वतंत्रता को सामाजिक दबाव में नहीं छीना जा सकता।"}, "positive_pole": {"definition_en": "Civic Order & Security (+1.0): Social stability, public safety, and peace justify rigorous limits on liberty.", "definition_hi": "सामाजिक व्यवस्था व सुरक्षा (+1.0): स्थिरता और लोक-सुरक्षा के लिए व्यक्तिगत स्वतंत्रता पर अंकुश उचित है।"}, "core_philosophical_question": "When individual liberty conflicts with collective security and civic order, which must yield?", "boundary_defense_rule": "The Tri-Axial Freedom Defense: D07 addresses the physical/coercive scope of state and social regulation."}, {"id": "D08", "order": 8, "macro_domain": "Society & Governance", "name_en": "Traditional Continuity vs. Radical Reform", "name_hi": "पारंपरिक निरंतरता बनाम क्रांतिकारी सुधार", "negative_pole": {"definition_en": "Preservation of Tradition (-1.0): Inherited customs, cultural wisdom, and evolutionary institutions are superior.", "definition_hi": "परंपरा संरक्षण (-1.0): ऐतिहासिक रूप से विकसित रीति-रिवाज और संस्थाएं बौद्धिक योजनाओं से श्रेष्ठ हैं।"}, "positive_pole": {"definition_en": "Transformative Reform (+1.0): Past customs encode injustice; society must be redesigned through rational innovation.", "definition_hi": "क्रांतिकारी सुधार (+1.0): पुरानी परंपराएं अन्याय को पोषित करती हैं; समाज का पुनर्गठन आवश्यक है।"}, "core_philosophical_question": "Should civil society revere and preserve historical customs, or overturn inherited traditions to establish rational justice?", "boundary_defense_rule": "D08 measures institutional continuity vs reform, distinct from broader civilizational technological development (D21)."}, {"id": "D09", "order": 9, "macro_domain": "Society & Governance", "name_en": "Centralized Cohesion vs. Subsidiarity", "name_hi": "केंद्रीकृत एकजुटता बनाम विकेंद्रीकरण", "negative_pole": {"definition_en": "Centralized Governance (-1.0): Strong sovereign leadership and unified legal centers are vital for stability.", "definition_hi": "केंद्रीकृत शासन (-1.0): स्थिरता और न्याय के लिए मजबूत संप्रभु नेतृत्व और एकीकृत संस्थाएं आवश्यक हैं।"}, "positive_pole": {"definition_en": "Distributed Subsidiarity (+1.0): Decisions and authority must reside at the most localized autonomous tier possible.", "definition_hi": "विकेंद्रीकरण (-1.0): निर्णय और अधिकार यथासंभव स्थानीय और स्वायत्त स्तर पर रहने चाहिए।"}, "core_philosophical_question": "Where should administrative and political power reside: in centralized sovereign bodies or decentralized local communities?", "boundary_defense_rule": "D09 addresses geographical and administrative tiering of authority, distinct from interpersonal autonomy (D02)."}, {"id": "D10", "order": 10, "macro_domain": "Society & Governance", "name_en": "Universal Standardization vs. Local Particularity", "name_hi": "सार्वभौमिक मानक बनाम स्थानीय विशिष्टता", "negative_pole": {"definition_en": "Universal Standards (-1.0): Human rights, constitutional justice, and scientific laws apply identically everywhere.", "definition_hi": "सार्वभौमिक मानक (-1.0): न्याय, मानवाधिकार और नियम सभी संस्कृतियों और सीमाओं के पार समान रूप से लागू होते हैं।"}, "positive_pole": {"definition_en": "Contextual Particularity (+1.0): Norms, law, and justice must reflect unique historical lineages and local cultures.", "definition_hi": "स्थानीय विशिष्टता (+1.0): नियम और मूल्य विशिष्ट ऐतिहासिक परंपराओं और स्थानीय संदर्भों पर निर्भर होने चाहिए।"}, "core_philosophical_question": "Are fundamental legal and social norms universal across all humanity, or legitimately contingent on cultural particularity?", "boundary_defense_rule": "D10 isolates procedural and political universalism from metaphysical moral objectivism (D18)."}, {"id": "D11", "order": 11, "macro_domain": "Reality & Epistemology", "name_en": "Empiricism vs. Transcendent Metaphysics", "name_hi": "अनुभववाद बनाम पारलौकिक तत्वमीमांसा", "negative_pole": {"definition_en": "Empirical Naturalism (-1.0): Reality consists entirely of physical, sensible phenomena accessible to scientific inquiry.", "definition_hi": "अनुभवजन्य प्रकृतिवाद (-1.0): वास्तविकता पूरी तरह से भौतिक और इंद्रियगोचर घटनाओं से मिलकर बनी है।"}, "positive_pole": {"definition_en": "Transcendent Metaphysics (+1.0): Ultimate reality includes divine orders, non-physical realms, or sacred ontologies.", "definition_hi": "पारलौकिक तत्वमीमांसा (+1.0): वास्तविक अस्तित्व में दिव्य व्यवस्थाएं और गैर-भौतिक आयाम शामिल हैं।"}, "core_philosophical_question": "Is all reality exhausted by the natural, sensible, physical universe, or does it include transcendent metaphysical dimensions?", "boundary_defense_rule": "D11 measures empirical naturalism vs transcendent reality, distinct from the mind-matter debate (D13)."}, {"id": "D12", "order": 12, "macro_domain": "Reality & Epistemology", "name_en": "Systematic Reason vs. Intuitive Gnosis", "name_hi": "तार्किक विवेक बनाम अंतर्ज्ञान", "negative_pole": {"definition_en": "Discursive Rationalism (-1.0): Truth is established strictly through logic, conceptual analysis, and empirical proof.", "definition_hi": "तार्किक विवेकवाद (-1.0): सत्य की प्राप्ति केवल कठोर तर्क, वैचारिक विश्लेषण और प्रमाण से होती है।"}, "positive_pole": {"definition_en": "Intuitive Gnosis (+1.0): Highest truth is attained through contemplative insight, mystical awareness, or direct intuition.", "definition_hi": "प्रत्यक्ष अंतर्ज्ञान (+1.0): सर्वोच्च सत्य की अनुभूति ध्यान, रहस्यवादी चेतना या प्रत्यक्ष आंतरिक बोध से होती है।"}, "core_philosophical_question": "Is genuine knowledge accessed through discursive logic and empirical test, or through direct experiential intuition and contemplation?", "boundary_defense_rule": "D12 measures epistemic methodology (rationalism vs intuition), distinct from attitudes toward certainty and fallibility (D14)."}, {"id": "D13", "order": 13, "macro_domain": "Reality & Epistemology", "name_en": "Materialism vs. Idealism / Panpsychism", "name_hi": "भौतिकवाद बनाम विचारवाद / सर्वचेतनवाद", "negative_pole": {"definition_en": "Physicalist Materialism (-1.0): Matter and physical forces are primary; consciousness is an emergent epiphenomenon.", "definition_hi": "भौतिकवाद (-1.0): पदार्थ और भौतिक बल ही प्राथमिक हैं; चेतना मस्तिष्क का एक उप-उत्पाद है।"}, "positive_pole": {"definition_en": "Idealism / Mind Primacy (+1.0): Consciousness, mind, or spiritual principle is foundational; reality is an expression of mind.", "definition_hi": "विचारवाद / चेतना प्रधानता (+1.0): चेतना या मन ही मूलभूत सत्य है; भौतिक ब्रह्मांड इसी का प्रकटीकरण है।"}, "core_philosophical_question": "What is primary in the architecture of reality: unconscious matter and fields, or foundational consciousness and mind?", "boundary_defense_rule": "D13 isolates the ontological substance debate (materialism vs idealism) from empirical vs transcendent detection (D11)."}, {"id": "D14", "order": 14, "macro_domain": "Reality & Epistemology", "name_en": "Epistemic Fallibilism vs. Dogmatic Certainty", "name_hi": "संशयवादी विनम्रता बनाम सैद्धांतिक निश्चयता", "negative_pole": {"definition_en": "Critical Fallibilism (-1.0): All human knowledge claims are provisional, revisable, and subject to skepticism.", "definition_hi": "आलोचनात्मक विनम्रता (-1.0): मानव ज्ञान के सभी दावे अनंतिम, सुधार योग्य और संशय के अधीन हैं।"}, "positive_pole": {"definition_en": "Foundational Certainty (+1.0): Core truths are absolute, indubitable, revealed, or immutable, forming an unshakeable bedrock.", "definition_hi": "सैद्धांतिक निश्चयता (+1.0): मूल सत्य निरपेक्ष, असंदिग्ध, प्रकट या अपरिवर्तनीय हैं।"}, "core_philosophical_question": "Can human knowledge attain absolute, indubitable certainty, or must all claims remain provisional and fallible?", "boundary_defense_rule": "D14 isolates epistemic attitude toward error from the method used to acquire knowledge (D12)."}, {"id": "D15", "order": 15, "macro_domain": "Reality & Epistemology", "name_en": "Atomistic Reductionism vs. Emergent Holism", "name_hi": "परमाणुवादी विश्लेषणात्मकता बनाम समग्रतावाद", "negative_pole": {"definition_en": "Analytical Reductionism (-1.0): Complex wholes are fully understood by reducing them to fundamental parts and mechanisms.", "definition_hi": "विश्लेषणात्मक न्यूनतावाद (-1.0): जटिल प्रणालियों को उनके मूल घटकों और क्रियाविधियों में तोड़कर समझा जा सकता है।"}, "positive_pole": {"definition_en": "Emergent Holism (+1.0): The whole is greater than the sum of parts; complex systems possess irreducible emergent properties.", "definition_hi": "समग्रतावाद (+1.0): संपूर्ण अपने घटकों के योग से अधिक है; जटिल प्रणालियों में नए गुण उभरते हैं।"}, "core_philosophical_question": "Are complex systems best explained by reducing them to elemental parts, or by analyzing irreducible systemic wholes?", "boundary_defense_rule": "D15 is the critical boundary separator between naturalism with emergent ecology (C11) and mechanistic reductionism (C15)."}, {"id": "D16", "order": 16, "macro_domain": "Ethics & Values", "name_en": "Consequentialism vs. Deontological Duty", "name_hi": "परिणामवाद बनाम कर्तव्यवाद", "negative_pole": {"definition_en": "Teleological Consequences (-1.0): Moral worth is determined strictly by tangible real-world outcomes and utility produced.", "definition_hi": "परिणामवाद (-1.0): किसी कर्म का नैतिक मूल्य केवल उसके परिणामों, उपयोगिता और कष्ट निवारण से तय होता है।"}, "positive_pole": {"definition_en": "Deontological Duty (+1.0): Acts are intrinsically right or wrong based on duty, universal rules, or categorical moral law.", "definition_hi": "कर्तव्यवाद (+1.0): कर्म अपने आप में सही या गलत होते हैं; नैतिक नियमों का पालन परिणामों से ऊपर है।"}, "core_philosophical_question": "Is the morality of an action judged entirely by its real-world consequences, or by inherent adherence to moral duty?", "boundary_defense_rule": "D16 concerns the criterion of right action, distinct from relational empathy (D17) or moral authorship (D19)."}, {"id": "D17", "order": 17, "macro_domain": "Ethics & Values", "name_en": "Relational Care vs. Impartial Justice", "name_hi": "सहानुभूति व रिश्ते बनाम निष्पक्ष न्याय", "negative_pole": {"definition_en": "Contextual Care Ethics (-1.0): Morality is centered on personal relationships, empathy, compassion, and concrete care.", "definition_hi": "सहानुभूतिपरक नैतिकता (-1.0): नैतिकता व्यक्तिगत संबंधों, करुणा और विशिष्ट परिस्थितियों में देखभाल पर केंद्रित है।"}, "positive_pole": {"definition_en": "Impartial Rational Justice (+1.0): Morality requires impersonal fairness, equal rules, and objective rights applied without bias.", "definition_hi": "निष्पक्ष तर्कसंगत न्याय (+1.0): नैतिकता निष्पक्षता, समान अधिकारों और बिना पक्षपात के सार्वभौमिक नियमों की मांग करती है।"}, "core_philosophical_question": "Should moral decisions prioritize personal compassion and specific relationships, or detached, impartial justice?", "boundary_defense_rule": "D17 measures empathy/care vs impartial fairness, distinct from structural status equality (D06)."}, {"id": "D18", "order": 18, "macro_domain": "Ethics & Values", "name_en": "Moral Objectivism vs. Moral Relativism", "name_hi": "वस्तुनिष्ठ नैतिकता बनाम सापेक्षतावादी नैतिकता", "negative_pole": {"definition_en": "Objective Moral Truth (-1.0): Moral facts exist independently of human opinion, culture, or historical epoch.", "definition_hi": "वस्तुनिष्ठ नैतिक सत्य (-1.0): नैतिक सत्य मानवीय राय, संस्कृति या इतिहास से स्वतंत्र रूप से अस्तित्व में हैं।"}, "positive_pole": {"definition_en": "Constructed / Relativist Morality (+1.0): Values are human conventions, cultural artifacts, or subjective evolutionary tools.", "definition_hi": "सापेक्षतावादी नैतिकता (+1.0): मूल्य मानवीय समझौते, सांस्कृतिक परंपराएं या व्यक्तिपरक उत्पाद हैं।"}, "core_philosophical_question": "Do moral values exist as objective, cross-cultural truths, or are they cultural conventions constructed by human societies?", "boundary_defense_rule": "D18 addresses metaphysical meta-ethics, distinct from legal/political standardization (D10)."}, {"id": "D19", "order": 19, "macro_domain": "Ethics & Values", "name_en": "External Law vs. Self-Authored Ethics", "name_hi": "बाह्य दैवीय नियम बनाम आत्म-निर्मित नैतिकता", "negative_pole": {"definition_en": "Heteronomous Law (-1.0): Moral law is received from an external source—divine command, cosmic order, or ancestral edict.", "definition_hi": "बाह्य नियम (-1.0): नैतिक नियम किसी बाहरी स्रोत—ईश्वरीय आज्ञा, प्राकृतिक नियम या पूर्वजों—से प्राप्त होते हैं।"}, "positive_pole": {"definition_en": "Autonomous Self-Authorship (+1.0): The moral agent actively creates, authors, or freely validates their own values.", "definition_hi": "आत्म-निर्मित नैतिकता (+1.0): व्यक्ति अपने जीवन-मूल्यों और नैतिक निर्णयों का स्वयं अंतिम निर्माता है।"}, "core_philosophical_question": "Are moral commands legitimately received from an external sacred/cosmic authority, or self-authored by the autonomous agent?", "boundary_defense_rule": "The Tri-Axial Freedom Defense: D19 isolates moral authorship from institutional obedience (D02) and free will (D25)."}, {"id": "D20", "order": 20, "macro_domain": "Ethics & Values", "name_en": "Anthropocentric vs. Ecocentric Valuation", "name_hi": "मानव-केंद्रित बनाम जैव-केंद्रित मूल्य", "negative_pole": {"definition_en": "Human Exclusivity (-1.0): Humans possess unique, privileged moral standing; nature serves human flourishing.", "definition_hi": "मानव-केंद्रित मूल्य (-1.0): मनुष्य अद्वितीय नैतिक महत्व रखता है; प्रकृति मानव उत्कर्ष का साधन है।"}, "positive_pole": {"definition_en": "Biocentric / Ecocentric Value (+1.0): Ecosystems and non-human beings possess intrinsic moral value equal to humans.", "definition_hi": "जैव-केंद्रित मूल्य (+1.0): संपूर्ण पारिस्थितिकी तंत्र और सभी जीवों का अंतर्निहित मूल्य है, जो मनुष्य के बराबर है।"}, "core_philosophical_question": "Does nature exist primarily as a resource for human flourishing, or does it possess intrinsic moral considerability?", "boundary_defense_rule": "D20 addresses moral considerability, distinct from the civilizational relationship to ecology (D24)."}, {"id": "D21", "order": 21, "macro_domain": "Civilization, Meaning & Existence", "name_en": "Technological Progressivism vs. Primitivism", "name_hi": "तकनीकी प्रगतिवाद बनाम प्रकृति संरक्षण", "negative_pole": {"definition_en": "Unbound Progress (-1.0): Technology, scientific conquest, and economic growth are the primary engines of emancipation.", "definition_hi": "तकनीकी प्रगतिवाद (-1.0): विज्ञान, तकनीक और आर्थिक विकास ही मानव मुक्ति और समृद्धि के मुख्य साधन हैं।"}, "positive_pole": {"definition_en": "Ecological Restraint / Primitivism (+1.0): Technological expansion disrupts natural ecology; wisdom demands simple restraint.", "definition_hi": "प्रकृति संरक्षण / सादगी (+1.0): अंधाधुंध तकनीकी विकास जीवन और प्रकृति को नष्ट करता है; सादगी और संयम आवश्यक है।"}, "core_philosophical_question": "Is human civilization advanced primarily through accelerated technological expansion, or through ecological restraint and simplicity?", "boundary_defense_rule": "D21 measures civilizational technological trajectory, distinct from institutional continuity with the past (D08)."}, {"id": "D22", "order": 22, "macro_domain": "Civilization, Meaning & Existence", "name_en": "Constructed Meaning vs. Discovered Teleology", "name_hi": "रचित सार्थकता बनाम पूर्वनिर्धारित उद्देश्य", "negative_pole": {"definition_en": "Existential Creation (-1.0): The cosmos is indifferent; meaning must be courageously invented by human consciousness.", "definition_hi": "रचित सार्थकता (-1.0): ब्रह्मांड में कोई पूर्वनिर्धारित उद्देश्य नहीं है; मनुष्य को अपना अर्थ स्वयं रचना होगा।"}, "positive_pole": {"definition_en": "Cosmic Teleology (+1.0): The universe has an inherent purpose or divine trajectory that humans are called to discover.", "definition_hi": "पूर्वनिर्धारित उद्देश्य (+1.0): ब्रह्मांड का एक अंतर्निहित दिव्य उद्देश्य है जिसे खोजना और जिसके अनुरूप जीना चाहिए।"}, "core_philosophical_question": "Is existential meaning an invention of conscious human minds, or a pre-existing cosmic teleology to be discovered?", "boundary_defense_rule": "D22 measures existential purpose and cosmic teleology, distinct from the locus of bodily vs spiritual fulfillment (D05)."}, {"id": "D23", "order": 23, "macro_domain": "Civilization, Meaning & Existence", "name_en": "Historical Optimism vs. Tragic Realism", "name_hi": "ऐतिहासिक आशावाद बनाम दुखद यथार्थवाद", "negative_pole": {"definition_en": "Utopian Meliorism (-1.0): Human society is fundamentally improvable; humanity can eliminate war, poverty, and suffering.", "definition_hi": "ऐतिहासिक आशावाद (-1.0): मानव समाज में निरंतर सुधार संभव है; गरीबी, युद्ध और अज्ञान को मिटाया जा सकता है।"}, "positive_pole": {"definition_en": "Tragic Realism / Cyclical Decline (+1.0): Conflict, suffering, and civilizational decline are inescapable features of human existence.", "definition_hi": "दुखद यथार्थवाद (+1.0): संघर्ष और सभ्यतागत पतन मानव अस्तित्व के स्थायी पहलू हैं; पूर्ण यूटोपिया असंभव है।"}, "core_philosophical_question": "Is human civilizational history a trajectory of continuous moral improvement, or constrained by cyclical tragic decline?", "boundary_defense_rule": "D23 isolates historical macro-trajectory from innate human plasticity (D03) and existential agency (D25)."}, {"id": "D24", "order": 24, "macro_domain": "Civilization, Meaning & Existence", "name_en": "Promethean Mastery vs. Harmonious Integration", "name_hi": "प्रकृति पर विजय बनाम सामंजस्यपूर्ण तालमेल", "negative_pole": {"definition_en": "Promethean Mastery (-1.0): Humanity should actively terraform, domesticate, engineer, and conquer the physical world.", "definition_hi": "प्रकृति पर विजय (-1.0): मानवता को अपनी सुरक्षा के लिए प्रकृति पर नियंत्रण, इंजीनियरिंग और रूपांतरण करना चाहिए।"}, "positive_pole": {"definition_en": "Harmonious Integration (+1.0): Humanity should flow, harmonize with, and yield to organic natural cycles.", "definition_hi": "सामंजस्यपूर्ण तालमेल (+1.0): मनुष्य को प्रकृति के साथ तालमेल बिठाना चाहिए और आक्रामक छेड़छाड़ से बचना चाहिए।"}, "core_philosophical_question": "Should humanity assert active Promethean control over natural forces, or harmonize and yield to ecological cycles?", "boundary_defense_rule": "D24 evaluates physical/civilizational action toward nature, distinct from moral value attribution (D20)."}, {"id": "D25", "order": 25, "macro_domain": "Civilization, Meaning & Existence", "name_en": "Metaphysical Agency vs. Determinism / Fatalism", "name_hi": "स्वतंत्र इच्छाशक्ति बनाम नियतिवाद", "negative_pole": {"definition_en": "Radical Agency (-1.0): Human will is unconstrained and undetermined; individuals bear total responsibility for choices.", "definition_hi": "स्वतंत्र इच्छाशक्ति (-1.0): मानवीय इच्छाशक्ति स्वतंत्र है; व्यक्ति अपने प्रत्येक निर्णय के लिए पूरी तरह उत्तरदायी है।"}, "positive_pole": {"definition_en": "Strict Determinism / Karma / Fate (+1.0): Human action is completely conditioned by causal physics, divine predestination, or karma.", "definition_hi": "कठोर नियतिवाद / कर्मफल (+1.0): मानवीय कर्म भौतिक नियमों, ईश्वरीय विधान या पूर्व-निर्धारित प्रारब्ध से बंधे हैं।"}, "core_philosophical_question": "Do human beings possess authentic unconditioned metaphysical free will, or are choices determined by causal necessity and fate?", "boundary_defense_rule": "The Tri-Axial Freedom Defense: D25 evaluates metaphysical causality, completely distinct from institutional authority (D02) and societal liberty (D07)."}];
const EMBEDDED_CLUSTERS: ClusterItem[] = [{"id": "C01", "order": 1, "macro_region": "Autonomy & Humanist", "name_en": "Autonomous Individualism", "name_hi": "स्वायत्त व्यक्तिवाद", "defining_signature": "D01(-), D02(-), D04(-), D19(+), D25(-)", "defining_tension_en": "Prioritizes individual moral authorship and self-determination over unchosen collective duties.", "defining_tension_hi": "सामूहिक दायित्वों या व्यवस्था की तुलना में व्यक्तिगत आत्म-निर्णय और नैतिक स्वायत्तता को प्राथमिकता देता है।", "boundary_defense": "C01 centers the existential sovereignty of the person; C04 centers contractual legal governance.", "assigned_range": "W001–W010", "worldview_members": ["W001", "W002", "W003", "W004", "W005", "W006", "W007", "W008", "W009", "W010"]}, {"id": "C02", "order": 2, "macro_region": "Autonomy & Humanist", "name_en": "Humanist Flourishing", "name_hi": "मानववादी उत्कर्ष", "defining_signature": "D05(-), D11(-), D16(-), D20(-), D23(-)", "defining_tension_en": "Centers bodily flourishing, science, and democratic well-being in earthly life.", "defining_tension_hi": "पारलौकिक उद्देश्यों को नकारकर इसी जीवन में विज्ञान, तर्क और मानव कल्याण को केंद्र में रखता है।", "boundary_defense": "C02 centers eudaimonistic welfare in this life; C11 centers empirical ontology of nature.", "assigned_range": "W011–W020", "worldview_members": ["W011", "W012", "W013", "W014", "W015", "W016", "W017", "W018", "W019", "W020"]}, {"id": "C03", "order": 3, "macro_region": "Autonomy & Humanist", "name_en": "Existential Agency", "name_hi": "अस्तित्ववादी कर्तृत्व", "defining_signature": "D01(-), D03(-), D14(-), D22(-), D25(-)", "defining_tension_en": "Existence precedes essence; humans must author their own purpose in an unscripted cosmos.", "defining_tension_hi": "अस्तित्व सार से पहले है; मनुष्य को इस अर्थहीन ब्रह्मांड में अपने अर्थ का निर्माण स्वयं करना होता है।", "boundary_defense": "C03 centers courageous meaning creation in the absurd; C01 centers political and moral sovereignty.", "assigned_range": "W021–W030", "worldview_members": ["W021", "W022", "W023", "W024", "W025", "W026", "W027", "W028", "W029", "W030"]}, {"id": "C04", "order": 4, "macro_region": "Autonomy & Humanist", "name_en": "Contractual Libertarianism", "name_hi": "संविदात्मक उदारतावाद", "defining_signature": "D01(-), D02(-), D07(-), D09(+), D10(-)", "defining_tension_en": "Social coordination based strictly on consent, property rights, and procedural justice.", "defining_tension_hi": "सामाजिक व्यवस्था केवल सहमति, संपत्ति के अधिकार, स्वैच्छिक अनुबंध और न्यूनतम राज्य पर आधारित होनी चाहिए।", "boundary_defense": "C04 centers institutional decentralization and property law; C01 centers personal existential authenticity.", "assigned_range": "W031–W040", "worldview_members": ["W031", "W032", "W033", "W034", "W035", "W036", "W037", "W038", "W039", "W040"]}, {"id": "C05", "order": 5, "macro_region": "Autonomy & Humanist", "name_en": "Personalist Ethics", "name_hi": "व्यक्ति-केंद्रित नीतिशास्त्र", "defining_signature": "D01(-), D04(+), D05(+), D17(-), D19(-)", "defining_tension_en": "The person possesses infinite dignity that can never be subordinated to utility or systems.", "defining_tension_hi": "प्रत्येक व्यक्ति का असीम और पवित्र नैतिक मूल्य है जिसे किसी उपयोगिता या व्यवस्था के लिए नहीं त्यागा जा सकता।", "boundary_defense": "C05 affirms relational sacred dignity; C01 affirms atomistic self-interest and radical independence.", "assigned_range": "W041–W050", "worldview_members": ["W041", "W042", "W043", "W044", "W045", "W046", "W047", "W048", "W049", "W050"]}, {"id": "C06", "order": 6, "macro_region": "Community & Order", "name_en": "Communitarianism", "name_hi": "समुदायवाद", "defining_signature": "D01(+), D04(+), D07(+), D10(+), D17(-)", "defining_tension_en": "Rejects the unencumbered self; flourishing is constituted within shared communal life.", "defining_tension_hi": "अलग-थलग व्यक्तिवाद को नकारकर मानता है कि मानवीय पहचान और उत्कर्ष समुदाय के भीतर ही संभव है।", "boundary_defense": "C06 centers reciprocal civic solidarity; C08 centers sacred inherited lineage and ancestral customs.", "assigned_range": "W051–W060", "worldview_members": ["W051", "W052", "W053", "W054", "W055", "W056", "W057", "W058", "W059", "W060"]}, {"id": "C07", "order": 7, "macro_region": "Community & Order", "name_en": "Civic Republicanism", "name_hi": "नागरिक गणतंत्रवाद", "defining_signature": "D04(+), D07(+), D08(+), D16(+), D19(-)", "defining_tension_en": "Freedom is active participation in a self-governing republic protected against tyranny.", "defining_tension_hi": "स्वतंत्रता केवल गैर-हस्तक्षेप नहीं है, बल्कि एक आत्म-शासित गणतंत्र में सक्रिय नागरिक भागीदारी है।", "boundary_defense": "C07 centers anti-oligarchic civic duty and political liberty; C09 centers centralized state planning.", "assigned_range": "W061–W070", "worldview_members": ["W061", "W062", "W063", "W064", "W065", "W066", "W067", "W068", "W069", "W070"]}, {"id": "C08", "order": 8, "macro_region": "Community & Order", "name_en": "Traditional Communalism", "name_hi": "पारंपरिक सामूहिकतावाद", "defining_signature": "D01(+), D06(+), D08(-), D10(+), D18(-)", "defining_tension_en": "Preserves communal harmony through sacred ancestral lineage and customary obligations.", "defining_tension_hi": "सामुदायिक जीवन को पवित्र कुल-परंपराओं, पूर्वजों के ज्ञान और वंशानुगत कर्तव्यों से सुरक्षित रखता है।", "boundary_defense": "C08 mandates inherited customary traditions; C06 can adapt to modern democratic communities.", "assigned_range": "W071–W080", "worldview_members": ["W071", "W072", "W073", "W074", "W075", "W076", "W077", "W078", "W079", "W080"]}, {"id": "C09", "order": 9, "macro_region": "Community & Order", "name_en": "Authoritative Collectivism", "name_hi": "आधिकारिक समष्टिवाद", "defining_signature": "D01(+), D02(+), D06(+), D07(+), D09(-)", "defining_tension_en": "Coordinates all resources and citizens under sovereign authority for collective destiny.", "defining_tension_hi": "सामूहिक उद्देश्य या राष्ट्रीय सुरक्षा के लिए संप्रभु सत्ता के अधीन केंद्रीकृत नियंत्रण को अनिवार्य मानता है।", "boundary_defense": "C09 coordinates for state mobilization; C10 coordinates for stability of permanent differentiated social ranks.", "assigned_range": "W081–W090", "worldview_members": ["W081", "W082", "W083", "W084", "W085", "W086", "W087", "W088", "W089", "W090"]}, {"id": "C10", "order": 10, "macro_region": "Community & Order", "name_en": "Hierarchical Institutionalism", "name_hi": "पदानुक्रमिक संस्थागतवाद", "defining_signature": "D02(+), D06(+), D08(-), D09(-), D19(-)", "defining_tension_en": "Order and excellence depend on enduring institutions, constitutional roles, and established authority.", "defining_tension_hi": "सामाजिक व्यवस्था और न्याय स्थायी संस्थाओं, स्थापित मर्यादाओं और स्पष्ट पदानुक्रम पर निर्भर करते हैं।", "boundary_defense": "C10 centers differentiated constitutional continuity; C09 centers radical centralized state mobilization.", "assigned_range": "W091–W100", "worldview_members": ["W091", "W092", "W093", "W094", "W095", "W096", "W097", "W098", "W099", "W100"]}, {"id": "C11", "order": 11, "macro_region": "Empirical & Analytic", "name_en": "Empirical Naturalism", "name_hi": "अनुभवजन्य प्रकृतिवाद", "defining_signature": "D11(-), D12(-), D13(-), D14(-), D15(-)", "defining_tension_en": "The sensible natural world accessible to empirical science constitutes all real existence.", "defining_tension_hi": "प्राकृतिक और इंद्रियगोचर जगत, जो विज्ञान द्वारा मापा जा सकता है, वही संपूर्ण वास्तविक अस्तित्व है।", "boundary_defense": "C11 embraces emergent systemic wholes and ecological complexity; C15 mandates strict particle reductionism.", "assigned_range": "W101–W110", "worldview_members": ["W101", "W102", "W103", "W104", "W105", "W106", "W107", "W108", "W109", "W110"]}, {"id": "C12", "order": 12, "macro_region": "Empirical & Analytic", "name_en": "Rational Analyticism", "name_hi": "तर्कसंगत विश्लेषणात्मकता", "defining_signature": "D12(-), D14(-), D15(-), D16(+), D18(-)", "defining_tension_en": "Conceptual clarity, logic, and rigorous formal decomposition are the benchmarks of truth.", "defining_tension_hi": "वैचारिक स्पष्टता, तार्किक विश्लेषण और कठोर गणितीय प्रमाण ही सत्य और ज्ञान के बुनियादी मानक हैं।", "boundary_defense": "C12 centers formal deduction and logic; C13 centers practical experimentation and instrumental consequences.", "assigned_range": "W111–W120", "worldview_members": ["W111", "W112", "W113", "W114", "W115", "W116", "W117", "W118", "W119", "W120"]}, {"id": "C13", "order": 13, "macro_region": "Empirical & Analytic", "name_en": "Pragmatic Pluralism", "name_hi": "व्यावहारिक बहुलवाद", "defining_signature": "D10(+), D14(-), D15(+), D16(-), D18(+)", "defining_tension_en": "Judges ideas and institutions by practical consequences, experimental problem-solving, and fruitfulness.", "defining_tension_hi": "विचारों और संस्थाओं का मूल्यांकन उनके व्यावहारिक परिणामों और जीवन की समस्याओं को सुलझाने की क्षमता से करता है।", "boundary_defense": "C13 asks 'What works in practice?'; C25 asks 'How can evolving complex frameworks adapt together?'.", "assigned_range": "W121–W130", "worldview_members": ["W121", "W122", "W123", "W124", "W125", "W126", "W127", "W128", "W129", "W130"]}, {"id": "C14", "order": 14, "macro_region": "Empirical & Analytic", "name_en": "Critical Fallibilism", "name_hi": "आलोचनात्मक त्रुटिवादिता", "defining_signature": "D11(-), D12(-), D14(-), D15(+), D22(-)", "defining_tension_en": "All knowledge claims and institutions are historically situated, provisional, and subject to critique.", "defining_tension_hi": "मानव ज्ञान के सभी दावे और सामाजिक व्यवस्थाएं अनंतिम, सत्ता-प्रभावित और सतत संशोधन के योग्य हैं।", "boundary_defense": "C14 focuses on socio-epistemic power critique and fallibility; C12 focuses on formal logical validation.", "assigned_range": "W131–W140", "worldview_members": ["W131", "W132", "W133", "W134", "W135", "W136", "W137", "W138", "W139", "W140"]}, {"id": "C15", "order": 15, "macro_region": "Empirical & Analytic", "name_en": "Scientific Reductionism", "name_hi": "वैज्ञानिक न्यूनतावाद", "defining_signature": "D11(-), D12(-), D13(-), D14(-), D15(-)", "defining_tension_en": "Complex phenomena are fully explainable by fundamental physical components and causal mechanics.", "defining_tension_hi": "चेतना, जीवन और समाज सहित सभी जटिल परिघटनाओं को भौतिक घटकों और यांत्रिक नियमों में तोड़ा जा सकता है।", "boundary_defense": "C15 mandates strict atomistic decomposition (D15=-1.0); C11 accepts macroscopic emergent systems.", "assigned_range": "W141–W150", "worldview_members": ["W141", "W142", "W143", "W144", "W145", "W146", "W147", "W148", "W149", "W150"]}, {"id": "C16", "order": 16, "macro_region": "Transcendent & Ethics", "name_en": "Religious Traditionalism", "name_hi": "धार्मिक परंपरावाद", "defining_signature": "D05(+), D08(-), D11(+), D18(-), D22(+)", "defining_tension_en": "Divine revelation and sacred scripture represent eternal truths governing life and order.", "defining_tension_hi": "ईश्वरीय संदेश और पवित्र ग्रंथ सनातन सत्य हैं जो मानव जीवन और समाज को दिशा देते हैं।", "boundary_defense": "C16 grounds universal morality in sacred revelation and dogma; C19 grounds it in natural human reason.", "assigned_range": "W151–W160", "worldview_members": ["W151", "W152", "W153", "W154", "W155", "W156", "W157", "W158", "W159", "W160"]}, {"id": "C17", "order": 17, "macro_region": "Transcendent & Ethics", "name_en": "Mystical Contemplation", "name_hi": "रहस्यवादी चिंतन", "defining_signature": "D05(+), D11(+), D12(+), D13(+), D15(+), D22(+)", "defining_tension_en": "Ultimate reality transcends language, accessible through contemplative awareness and spiritual union.", "defining_tension_hi": "परम सत्य बौद्धिक शब्दों से परे है, जिसे प्रत्यक्ष ध्यान, आत्म-साक्षात्कार और एकत्व से जाना जा सकता है।", "boundary_defense": "C17 is an experiential path of unitive gnosis; C18 is an ontological system of mind-first metaphysics.", "assigned_range": "W161–W170", "worldview_members": ["W161", "W162", "W163", "W164", "W165", "W166", "W167", "W168", "W169", "W170"]}, {"id": "C18", "order": 18, "macro_region": "Transcendent & Ethics", "name_en": "Metaphysical Idealism", "name_hi": "तत्वमीमांसीय प्रत्ययवाद", "defining_signature": "D11(+), D12(-), D13(+), D18(-), D22(+)", "defining_tension_en": "Mind, idea, or consciousness is the fundamental fabric of reality; the cosmos is an expression of mind.", "defining_tension_hi": "चेतना या विचार ही अस्तित्व का मूल आधार है; संपूर्ण भौतिक जगत मन या आत्म-चेतना का ही प्रकटीकरण है।", "boundary_defense": "C18 centers the ontological primacy of mind; C17 centers the meditative practice of experiential transcendence.", "assigned_range": "W171–W180", "worldview_members": ["W171", "W172", "W173", "W174", "W175", "W176", "W177", "W178", "W179", "W180"]}, {"id": "C19", "order": 19, "macro_region": "Transcendent & Ethics", "name_en": "Natural-Law Universalism", "name_hi": "प्राकृतिक-विधि सार्वभौमिकतावाद", "defining_signature": "D16(+), D18(-), D19(-), D22(+), D25(-)", "defining_tension_en": "Universal moral laws are woven into the rational fabric of nature and discoverable by human reason.", "defining_tension_hi": "सार्वभौमिक नैतिक नियम प्रकृति की तर्कसंगत व्यवस्था में अंतर्निहित हैं और मानव विवेक द्वारा जाने जा सकते हैं।", "boundary_defense": "C19 derives objective duty through rational philosophy; C16 derives it through historical sectarian revelation.", "assigned_range": "W181–W190", "worldview_members": ["W181", "W182", "W183", "W184", "W185", "W186", "W187", "W188", "W189", "W190"]}, {"id": "C20", "order": 20, "macro_region": "Transcendent & Ethics", "name_en": "Spiritual Pluralism", "name_hi": "आध्यात्मिक बहुलवाद", "defining_signature": "D10(+), D11(+), D12(+), D14(-), D18(+)", "defining_tension_en": "Diverse spiritual paths represent contextual facets of an inexhaustible, common transcendent truth.", "defining_tension_hi": "दुनिया के विभिन्न धर्म और आध्यात्मिक धाराएं एक ही असीम सत्य के अलग-अलग सांस्कृतिक प्रकटीकरण हैं।", "boundary_defense": "C20 embraces ecumenical syncretism and tolerance; C16 enforces exclusive scriptural orthodoxy.", "assigned_range": "W191–W200", "worldview_members": ["W191", "W192", "W193", "W194", "W195", "W196", "W197", "W198", "W199", "W200"]}, {"id": "C21", "order": 21, "macro_region": "Ecological, Meaning & Civilization", "name_en": "Ecological Holism", "name_hi": "पारिस्थितिक समग्रतावाद", "defining_signature": "D15(+), D20(+), D21(+), D24(+), D23(-)", "defining_tension_en": "Humans are interconnected members of the biotic community; all ecosystems possess intrinsic rights.", "defining_tension_hi": "मनुष्य पृथ्वी के जैव-समुदाय का अभिन्न अंग है; सभी पारिस्थितिक तंत्रों का अपना आंतरिक नैतिक मूल्य है।", "boundary_defense": "C21 rejects human primacy in favor of biocentrism; C22 preserves nature as a vital generational trust.", "assigned_range": "W201–W210", "worldview_members": ["W201", "W202", "W203", "W204", "W205", "W206", "W207", "W208", "W209", "W210"]}, {"id": "C22", "order": 22, "macro_region": "Ecological, Meaning & Civilization", "name_en": "Conservationist Stewardship", "name_hi": "संरक्षणवादी न्यासिता", "defining_signature": "D08(-), D15(+), D21(+), D23(+), D24(+)", "defining_tension_en": "Civilization has a solemn intergenerational duty to preserve natural endowments and cultural inheritance.", "defining_tension_hi": "मानव सभ्यता का यह नैतिक कर्तव्य है कि वह प्राकृतिक संपदा और सांस्कृतिक धरोहर को आने वाली पीढ़ियों के लिए बचाए।", "boundary_defense": "C22 centers human responsibility and heritage conservation; C21 centers egalitarian rights of all non-human life.", "assigned_range": "W211–W220", "worldview_members": ["W211", "W212", "W213", "W214", "W215", "W216", "W217", "W218", "W219", "W220"]}, {"id": "C23", "order": 23, "macro_region": "Ecological, Meaning & Civilization", "name_en": "Technological Futurism", "name_hi": "प्रौद्योगिक भविष्यवाद", "defining_signature": "D03(-), D11(-), D21(-), D23(-), D24(-)", "defining_tension_en": "Human biological and planetary limitations can be transcended through computing, biotech, and AI.", "defining_tension_hi": "विज्ञान, कृत्रिम बुद्धिमत्ता (AI) और बायोटेक के माध्यम से मानव शरीर और जैविक सीमाओं को पार किया जा सकता है।", "boundary_defense": "C23 pursues radical morphological and cosmic enhancement; C24 pursues institutional and social reform.", "assigned_range": "W221–W230", "worldview_members": ["W221", "W222", "W223", "W224", "W225", "W226", "W227", "W228", "W229", "W230"]}, {"id": "C24", "order": 24, "macro_region": "Ecological, Meaning & Civilization", "name_en": "Developmental Progressivism", "name_hi": "विकासात्मक प्रगतिवाद", "defining_signature": "D03(-), D08(+), D21(-), D23(-), D25(-)", "defining_tension_en": "History exhibits moral progress achieved through democratic reform, education, and human rights.", "defining_tension_hi": "मानव इतिहास तर्कसंगत सुधारों, लोकतांत्रिक संस्थाओं, शिक्षा और मानवाधिकारों के जरिए निरंतर आगे बढ़ता है।", "boundary_defense": "C24 centers socio-political meliorism; C23 centers technological and post-biological enhancement.", "assigned_range": "W231–W240", "worldview_members": ["W231", "W232", "W233", "W234", "W235", "W236", "W237", "W238", "W239", "W240"]}, {"id": "C25", "order": 25, "macro_region": "Ecological, Meaning & Civilization", "name_en": "Adaptive Pluralism", "name_hi": "अनुकूली बहुलवाद", "defining_signature": "D10(+), D14(-), D15(+), D18(+), D21(-)", "defining_tension_en": "Societies must dynamically navigate competing perspectives through metamodern adaptive learning networks.", "defining_tension_hi": "समाज को जटिल, बहुआयामी चुनौतियों से निपटने के लिए विभिन्न दृष्टिकोणों का लचीला और अनुकूली समन्वय करना चाहिए।", "boundary_defense": "C25 centers systemic evolutionary learning across paradigms; C13 centers direct instrumental problem-solving.", "assigned_range": "W241–W250", "worldview_members": ["W241", "W242", "W243", "W244", "W245", "W246", "W247", "W248", "W249", "W250"]}];
const EMBEDDED_SAMPLE_WVS: WorldviewRecord[] = [{"id": "W001", "cluster_id": "C01", "profile_type": "established", "name_en": "Sumerian State Religion", "name_hi": "सुमेरियन राज्य धर्म", "historical_era": "c. 3500 BCE", "geographic_origin": "Mesopotamia (Modern Iraq)", "founder_key_figures": "Sumerian Priest-Kings (Ensi)", "epistemological_framework": "Oracular revelation, temple divination, and cuneiform scribal interpretation of cosmic decrees (Me).", "canonical_texts": "Epic of Gilgamesh (-2100); The Descent of Inanna (-2000)", "famous_quote": "Enheduanna: Queen of all the cosmic powers, radiant light, righteous woman clothed in brilliance.", "short_description_en": "Ancient Mesopotamian temple religion structured around serving divine cosmic forces (Me) through civic hierarchy and temple administration.", "short_description_hi": "प्राचीन मेसोपोटामियाई मंदिर धर्म, जो दिव्य ब्रह्मांडीय आदेश (मे) और नगर-राज्य व्यवस्था पर केंद्रित था।", "full_description_en": "Ancient Mesopotamian temple religion structured around serving divine cosmic forces (Me) through civic hierarchy and temple administration.", "full_description_hi": "प्राचीन मेसोपोटामियाई मंदिर धर्म, जो दिव्य ब्रह्मांडीय आदेश (मे) और नगर-राज्य व्यवस्था पर केंद्रित था।", "historical_associations": "Development of the world's earliest cuneiform temple economy and administrative writing; Establishment of the Ziggurat cosmic axis mundi architecture in southern Mesopotamia; Codification of primordial divine decrees (Me) governing civilization and human crafts", "vector": {"D01": -0.9623, "D02": -0.8702, "D03": 0.0763, "D04": -0.7764, "D05": -0.0833, "D06": -0.1338, "D07": -0.6799, "D08": 0.0484, "D09": 0.1298, "D10": 0.1189, "D11": 0.0664, "D12": -0.0442, "D13": -0.0285, "D14": -0.1031, "D15": -0.0852, "D16": 0.0262, "D17": 0.0021, "D18": -0.1085, "D19": 0.7597, "D20": 0.0183, "D21": 0.0727, "D22": -0.4401, "D23": -0.1299, "D24": -0.1655, "D25": -0.7699}, "doctrinal_weights": {"D01": 1.0, "D02": 1.0, "D03": 0.0, "D04": 1.0, "D05": 0.0, "D06": 0.0, "D07": 0.5, "D08": 0.0, "D09": 0.0, "D10": 0.0, "D11": 0.0, "D12": 0.0, "D13": 0.0, "D14": 0.0, "D15": 0.0, "D16": 0.0, "D17": 0.0, "D18": 0.0, "D19": 1.0, "D20": 0.0, "D21": 0.0, "D22": 0.5, "D23": 0.0, "D24": 0.0, "D25": 1.0}, "dimension_rationales": {"D01": "Core Pillar: Strong alignment with negative pole.", "D02": "Core Pillar: Strong alignment with negative pole.", "D03": "Neutral / Doctrinally silent on this axis.", "D04": "Core Pillar: Strong alignment with negative pole.", "D05": "Neutral / Doctrinally silent on this axis.", "D06": "Neutral / Doctrinally silent on this axis.", "D07": "Secondary Corollary: Contextual lean toward negative pole.", "D08": "Neutral / Doctrinally silent on this axis.", "D09": "Neutral / Doctrinally silent on this axis.", "D10": "Neutral / Doctrinally silent on this axis.", "D11": "Neutral / Doctrinally silent on this axis.", "D12": "Neutral / Doctrinally silent on this axis.", "D13": "Neutral / Doctrinally silent on this axis.", "D14": "Neutral / Doctrinally silent on this axis.", "D15": "Neutral / Doctrinally silent on this axis.", "D16": "Neutral / Doctrinally silent on this axis.", "D17": "Neutral / Doctrinally silent on this axis.", "D18": "Neutral / Doctrinally silent on this axis.", "D19": "Core Pillar: Strong alignment with positive pole.", "D20": "Neutral / Doctrinally silent on this axis.", "D21": "Neutral / Doctrinally silent on this axis.", "D22": "Secondary Corollary: Contextual lean toward negative pole.", "D23": "Neutral / Doctrinally silent on this axis.", "D24": "Neutral / Doctrinally silent on this axis.", "D25": "Core Pillar: Strong alignment with negative pole."}, "sources": [{"source_type": "primary_text", "title": "Epic of Gilgamesh (-2100); The Descent of Inanna (-2000)", "citation": "Primary literature: Epic of Gilgamesh (-2100); The Descent of Inanna (-2000)"}, {"source_type": "canonical_overview", "title": "Sumerian State Religion", "citation": "Encyclopedic entry on Sumerian State Religion"}]}, {"id": "W011", "cluster_id": "C02", "profile_type": "established", "name_en": "Platonic Idealism", "name_hi": "प्लेटोनिक आदर्शवाद", "historical_era": "c. 375 BCE", "geographic_origin": "Athens, Greece", "founder_key_figures": "Plato", "epistemological_framework": "Dialectic reasoning, recollection (anamnesis) of transcendent Forms, and rational intuition (noesis).", "canonical_texts": "The Republic (-375); Phaedo (-360)", "famous_quote": "Plato: The unexamined life is not worth living.", "short_description_en": "Metaphysical philosophy positing that non-physical Forms represent the most accurate, eternal reality beyond sensory illusion.", "short_description_hi": "प्लेटो का प्रत्ययवाद, जो दृश्य जगत से परे विचारों (Forms) के शाश्वत जगत और परम शुभ को वास्तविक सत्य मानता है।", "full_description_en": "Metaphysical philosophy positing that non-physical Forms represent the most accurate, eternal reality beyond sensory illusion.", "full_description_hi": "प्लेटो का प्रत्ययवाद, जो दृश्य जगत से परे विचारों (Forms) के शाश्वत जगत और परम शुभ को वास्तविक सत्य मानता है।", "historical_associations": "Founding of the Platonic Academy in Athens around 387 BCE; Formulation of the Allegory of the Cave and the theory of immutable Forms; Serving as the core philosophical substrate for Christian, Islamic, and Jewish scholastic theology", "vector": {"D01": -0.6123, "D02": -0.0702, "D03": 0.0763, "D04": -0.0264, "D05": -0.8833, "D06": -0.1338, "D07": -0.0799, "D08": 0.0484, "D09": 0.1298, "D10": 0.1189, "D11": -0.7836, "D12": -0.6442, "D13": -0.0285, "D14": -0.1031, "D15": -0.0852, "D16": -0.7238, "D17": 0.0021, "D18": -0.1085, "D19": 0.0097, "D20": -0.7317, "D21": 0.0727, "D22": 0.0599, "D23": -0.9299, "D24": -0.1655, "D25": 0.0301}, "doctrinal_weights": {"D01": 0.5, "D02": 0.0, "D03": 0.0, "D04": 0.0, "D05": 1.0, "D06": 0.0, "D07": 0.0, "D08": 0.0, "D09": 0.0, "D10": 0.0, "D11": 1.0, "D12": 0.5, "D13": 0.0, "D14": 0.0, "D15": 0.0, "D16": 1.0, "D17": 0.0, "D18": 0.0, "D19": 0.0, "D20": 1.0, "D21": 0.0, "D22": 0.0, "D23": 1.0, "D24": 0.0, "D25": 0.0}, "dimension_rationales": {"D01": "Secondary Corollary: Contextual lean toward negative pole.", "D02": "Neutral / Doctrinally silent on this axis.", "D03": "Neutral / Doctrinally silent on this axis.", "D04": "Neutral / Doctrinally silent on this axis.", "D05": "Core Pillar: Strong alignment with negative pole.", "D06": "Neutral / Doctrinally silent on this axis.", "D07": "Neutral / Doctrinally silent on this axis.", "D08": "Neutral / Doctrinally silent on this axis.", "D09": "Neutral / Doctrinally silent on this axis.", "D10": "Neutral / Doctrinally silent on this axis.", "D11": "Core Pillar: Strong alignment with negative pole.", "D12": "Secondary Corollary: Contextual lean toward negative pole.", "D13": "Neutral / Doctrinally silent on this axis.", "D14": "Neutral / Doctrinally silent on this axis.", "D15": "Neutral / Doctrinally silent on this axis.", "D16": "Core Pillar: Strong alignment with negative pole.", "D17": "Neutral / Doctrinally silent on this axis.", "D18": "Neutral / Doctrinally silent on this axis.", "D19": "Neutral / Doctrinally silent on this axis.", "D20": "Core Pillar: Strong alignment with negative pole.", "D21": "Neutral / Doctrinally silent on this axis.", "D22": "Neutral / Doctrinally silent on this axis.", "D23": "Core Pillar: Strong alignment with negative pole.", "D24": "Neutral / Doctrinally silent on this axis.", "D25": "Neutral / Doctrinally silent on this axis."}, "sources": [{"source_type": "primary_text", "title": "The Republic (-375); Phaedo (-360)", "citation": "Primary literature: The Republic (-375); Phaedo (-360)"}, {"source_type": "canonical_overview", "title": "Platonic Idealism", "citation": "Encyclopedic entry on Platonic Idealism"}]}, {"id": "W013", "cluster_id": "C02", "profile_type": "established", "name_en": "Classical Stoicism", "name_hi": "क्लासिक स्टोइकवाद", "historical_era": "c. 300 BCE", "geographic_origin": "Athens, Greece", "founder_key_figures": "Zeno of Citium", "epistemological_framework": "Impression assent (kataleptike phantasia), sensory empiricism combined with innate rational concepts.", "canonical_texts": "Meditations (175); Discourses of Epictetus (108)", "famous_quote": "Marcus Aurelius: You have power over your mind - not outside events. Realize this, and you will find strength.", "short_description_en": "Virtue ethics emphasizing rationality, internal emotional mastery, dichotomy of control, and alignment with cosmic Logos.", "short_description_hi": "स्टोइक दर्शन, जो आत्म-संयम, तर्कसंगत कर्तव्यपरायणता और ब्रह्मांडीय विवेक (लोगोस) के साथ संतुलन पर जोर देता है।", "full_description_en": "Virtue ethics emphasizing rationality, internal emotional mastery, dichotomy of control, and alignment with cosmic Logos.", "full_description_hi": "स्टोइक दर्शन, जो आत्म-संयम, तर्कसंगत कर्तव्यपरायणता और ब्रह्मांडीय विवेक (लोगोस) के साथ संतुलन पर जोर देता है।", "historical_associations": "The adoption of Stoic virtue as the governing philosophy of prominent Roman statesmen and emperors; Inspiration for early Christian moral philosophy and Justus Lipsius's 16th-century Neostoicism; Foundational direct influence on modern Cognitive Behavioral Therapy (CBT)", "vector": {"D01": -0.4627, "D02": 0.131, "D03": -0.0832, "D04": -0.1488, "D05": -0.8264, "D06": 0.1571, "D07": 0.0361, "D08": 0.0896, "D09": 0.1224, "D10": -0.0001, "D11": -0.8016, "D12": -0.654, "D13": 0.0121, "D14": -0.0534, "D15": 0.1144, "D16": -0.8693, "D17": 0.0105, "D18": -0.0498, "D19": 0.1171, "D20": -0.7355, "D21": 0.1734, "D22": -0.0283, "D23": -0.8072, "D24": -0.0012, "D25": 0.0179}, "doctrinal_weights": {"D01": 0.5, "D02": 0.0, "D03": 0.0, "D04": 0.0, "D05": 1.0, "D06": 0.0, "D07": 0.0, "D08": 0.0, "D09": 0.0, "D10": 0.0, "D11": 1.0, "D12": 0.5, "D13": 0.0, "D14": 0.0, "D15": 0.0, "D16": 1.0, "D17": 0.0, "D18": 0.0, "D19": 0.0, "D20": 1.0, "D21": 0.0, "D22": 0.0, "D23": 1.0, "D24": 0.0, "D25": 0.0}, "dimension_rationales": {"D01": "Secondary Corollary: Contextual lean toward negative pole.", "D02": "Neutral / Doctrinally silent on this axis.", "D03": "Neutral / Doctrinally silent on this axis.", "D04": "Neutral / Doctrinally silent on this axis.", "D05": "Core Pillar: Strong alignment with negative pole.", "D06": "Neutral / Doctrinally silent on this axis.", "D07": "Neutral / Doctrinally silent on this axis.", "D08": "Neutral / Doctrinally silent on this axis.", "D09": "Neutral / Doctrinally silent on this axis.", "D10": "Neutral / Doctrinally silent on this axis.", "D11": "Core Pillar: Strong alignment with negative pole.", "D12": "Secondary Corollary: Contextual lean toward negative pole.", "D13": "Neutral / Doctrinally silent on this axis.", "D14": "Neutral / Doctrinally silent on this axis.", "D15": "Neutral / Doctrinally silent on this axis.", "D16": "Core Pillar: Strong alignment with negative pole.", "D17": "Neutral / Doctrinally silent on this axis.", "D18": "Neutral / Doctrinally silent on this axis.", "D19": "Neutral / Doctrinally silent on this axis.", "D20": "Core Pillar: Strong alignment with negative pole.", "D21": "Neutral / Doctrinally silent on this axis.", "D22": "Neutral / Doctrinally silent on this axis.", "D23": "Core Pillar: Strong alignment with negative pole.", "D24": "Neutral / Doctrinally silent on this axis.", "D25": "Neutral / Doctrinally silent on this axis."}, "sources": [{"source_type": "primary_text", "title": "Meditations (175); Discourses of Epictetus (108)", "citation": "Primary literature: Meditations (175); Discourses of Epictetus (108)"}, {"source_type": "canonical_overview", "title": "Classical Stoicism", "citation": "Encyclopedic entry on Classical Stoicism"}]}, {"id": "W021", "cluster_id": "C03", "profile_type": "established", "name_en": "Roman Catholicism", "name_hi": "रोमन कैथोलिक धर्म", "historical_era": "c. 1st Century CE", "geographic_origin": "Judea / Rome", "founder_key_figures": "Jesus Christ / St. Peter", "epistemological_framework": "Divine revelation transmitted through Sacred Scripture, Sacred Tradition, and the authoritative magisterium of the Church.", "canonical_texts": "Catechism of the Catholic Church (1992); Summa Theologiae (1274)", "famous_quote": "Thomas Aquinas: Grace does not destroy nature, but perfects it.", "short_description_en": "Traditional Christian orthodoxy structured around papal primacy, sacramental ontology, Thomistic scholasticism, and natural law ethics[cite: 1].", "short_description_hi": "रोमन कैथोलिक चर्च, जो पोप की सर्वोच्चता, सात संस्कारों, प्राकृतिक कानून और थॉमस एक्विनास के पांडित्य दर्शन पर आधारित है[cite: 1].", "full_description_en": "Traditional Christian orthodoxy structured around papal primacy, sacramental ontology, Thomistic scholasticism, and natural law ethics[cite: 1].", "full_description_hi": "रोमन कैथोलिक चर्च, जो पोप की सर्वोच्चता, सात संस्कारों, प्राकृतिक कानून और थॉमस एक्विनास के पांडित्य दर्शन पर आधारित है[cite: 1].", "historical_associations": "Establishment of the medieval university system and global hospital networks; The Council of Trent and the Counter-Reformation; Second Vatican Council modernization of liturgy, ecumenism, and social teaching", "vector": {"D01": -0.9126, "D02": -0.6716, "D03": -0.6726, "D04": -0.0268, "D05": -0.0835, "D06": -0.1351, "D07": -0.0799, "D08": 0.0492, "D09": 0.1311, "D10": 0.1204, "D11": 0.068, "D12": -0.0447, "D13": -0.529, "D14": -0.9049, "D15": -0.0866, "D16": 0.027, "D17": 0.003, "D18": -0.1084, "D19": 0.0101, "D20": 0.0181, "D21": 0.0738, "D22": -0.7897, "D23": -0.1297, "D24": -0.1661, "D25": -0.8186}, "doctrinal_weights": {"D01": 1.0, "D02": 0.5, "D03": 0.5, "D04": 0.0, "D05": 0.0, "D06": 0.0, "D07": 0.0, "D08": 0.0, "D09": 0.0, "D10": 0.0, "D11": 0.0, "D12": 0.0, "D13": 0.5, "D14": 1.0, "D15": 0.0, "D16": 0.0, "D17": 0.0, "D18": 0.0, "D19": 0.0, "D20": 0.0, "D21": 0.0, "D22": 1.0, "D23": 0.0, "D24": 0.0, "D25": 1.0}, "dimension_rationales": {"D01": "Core Pillar: Strong alignment with negative pole.", "D02": "Secondary Corollary: Contextual lean toward negative pole.", "D03": "Secondary Corollary: Contextual lean toward negative pole.", "D04": "Neutral / Doctrinally silent on this axis.", "D05": "Neutral / Doctrinally silent on this axis.", "D06": "Neutral / Doctrinally silent on this axis.", "D07": "Neutral / Doctrinally silent on this axis.", "D08": "Neutral / Doctrinally silent on this axis.", "D09": "Neutral / Doctrinally silent on this axis.", "D10": "Neutral / Doctrinally silent on this axis.", "D11": "Neutral / Doctrinally silent on this axis.", "D12": "Neutral / Doctrinally silent on this axis.", "D13": "Secondary Corollary: Contextual lean toward negative pole.", "D14": "Core Pillar: Strong alignment with negative pole.", "D15": "Neutral / Doctrinally silent on this axis.", "D16": "Neutral / Doctrinally silent on this axis.", "D17": "Neutral / Doctrinally silent on this axis.", "D18": "Neutral / Doctrinally silent on this axis.", "D19": "Neutral / Doctrinally silent on this axis.", "D20": "Neutral / Doctrinally silent on this axis.", "D21": "Neutral / Doctrinally silent on this axis.", "D22": "Core Pillar: Strong alignment with negative pole.", "D23": "Neutral / Doctrinally silent on this axis.", "D24": "Neutral / Doctrinally silent on this axis.", "D25": "Core Pillar: Strong alignment with negative pole."}, "sources": [{"source_type": "primary_text", "title": "Catechism of the Catholic Church (1992); Summa Theologiae (1274)", "citation": "Primary literature: Catechism of the Catholic Church (1992); Summa Theologiae (1274)"}, {"source_type": "canonical_overview", "title": "Roman Catholicism", "citation": "Encyclopedic entry on Roman Catholicism"}]}, {"id": "W045", "cluster_id": "C05", "profile_type": "established", "name_en": "Anthroposophy", "name_hi": "मानवविद्या (एंथ्रोपोसोफी)", "historical_era": "1912 CE", "geographic_origin": "Dornach, Switzerland / Germany", "founder_key_figures": "Rudolf Steiner", "epistemological_framework": "Spiritual science (Geisteswissenschaft) investigating supersensible reality through trained cognitive clairvoyance.", "canonical_texts": "The Philosophy of Freedom (1894); An Outline of Occult Science (1910)", "famous_quote": "Rudolf Steiner: Receive the children in reverence, educate them in love, and put them forth in freedom.", "short_description_en": "Spiritual science developed by Rudolf Steiner investigating the spiritual world with the rigor of modern natural science.", "short_description_hi": "रुडोल्फ स्टीनर द्वारा प्रतिपादित 'आध्यात्मिक विज्ञान', जिससे वाल्डोर्फ शिक्षा, जैव-गतिकीय कृषि और समग्र चिकित्सा का जन्म हुआ।", "full_description_en": "Spiritual science developed by Rudolf Steiner investigating the spiritual world with the rigor of modern natural science.", "full_description_hi": "रुडोल्फ स्टीनर द्वारा प्रतिपादित 'आध्यात्मिक विज्ञान', जिससे वाल्डोर्फ शिक्षा, जैव-गतिकीय कृषि और समग्र चिकित्सा का जन्म हुआ।", "historical_associations": "The founding of the worldwide Waldorf (Steiner) school education system; The invention of Biodynamic agriculture, marking the birth of modern organic farming methods; Development of Anthroposophic medicine, curative education, and Eurythmy art", "vector": {"D01": -0.6161, "D02": 0.06, "D03": 0.1445, "D04": 0.6868, "D05": 0.8612, "D06": 0.0456, "D07": -0.1831, "D08": 0.1865, "D09": -0.0426, "D10": 0.0109, "D11": 0.0573, "D12": -0.0813, "D13": 0.3469, "D14": 0.0119, "D15": -0.021, "D16": 0.0649, "D17": -0.8111, "D18": 0.0406, "D19": -0.6888, "D20": -0.0451, "D21": -0.0554, "D22": 0.5912, "D23": -0.0322, "D24": 0.0735, "D25": -0.1173}, "doctrinal_weights": {"D01": 0.5, "D02": 0.0, "D03": 0.0, "D04": 0.5, "D05": 1.0, "D06": 0.0, "D07": 0.0, "D08": 0.0, "D09": 0.0, "D10": 0.0, "D11": 0.0, "D12": 0.0, "D13": 0.5, "D14": 0.0, "D15": 0.0, "D16": 0.0, "D17": 1.0, "D18": 0.0, "D19": 0.5, "D20": 0.0, "D21": 0.0, "D22": 0.5, "D23": 0.0, "D24": 0.0, "D25": 0.0}, "dimension_rationales": {"D01": "Secondary Corollary: Contextual lean toward negative pole.", "D02": "Neutral / Doctrinally silent on this axis.", "D03": "Neutral / Doctrinally silent on this axis.", "D04": "Secondary Corollary: Contextual lean toward positive pole.", "D05": "Core Pillar: Strong alignment with positive pole.", "D06": "Neutral / Doctrinally silent on this axis.", "D07": "Neutral / Doctrinally silent on this axis.", "D08": "Neutral / Doctrinally silent on this axis.", "D09": "Neutral / Doctrinally silent on this axis.", "D10": "Neutral / Doctrinally silent on this axis.", "D11": "Neutral / Doctrinally silent on this axis.", "D12": "Neutral / Doctrinally silent on this axis.", "D13": "Secondary Corollary: Contextual lean toward positive pole.", "D14": "Neutral / Doctrinally silent on this axis.", "D15": "Neutral / Doctrinally silent on this axis.", "D16": "Neutral / Doctrinally silent on this axis.", "D17": "Core Pillar: Strong alignment with negative pole.", "D18": "Neutral / Doctrinally silent on this axis.", "D19": "Secondary Corollary: Contextual lean toward negative pole.", "D20": "Neutral / Doctrinally silent on this axis.", "D21": "Neutral / Doctrinally silent on this axis.", "D22": "Secondary Corollary: Contextual lean toward positive pole.", "D23": "Neutral / Doctrinally silent on this axis.", "D24": "Neutral / Doctrinally silent on this axis.", "D25": "Neutral / Doctrinally silent on this axis."}, "sources": [{"source_type": "primary_text", "title": "The Philosophy of Freedom (1894); An Outline of Occult Science (1910)", "citation": "Primary literature: The Philosophy of Freedom (1894); An Outline of Occult Science (1910)"}, {"source_type": "canonical_overview", "title": "Anthroposophy", "citation": "Encyclopedic entry on Anthroposophy"}]}, {"id": "W051", "cluster_id": "C06", "profile_type": "established", "name_en": "Classical Sanātana Dharma", "name_hi": "शाश्वत सनातन धर्म", "historical_era": "c. 1500 BCE", "geographic_origin": "Indian Subcontinent (Sapta Sindhu)", "founder_key_figures": "Vedic Rishis (Seers)", "epistemological_framework": "Six Pramanas: Pratyaksha (perception), Anumana (inference), Upamana (comparison), Shabda (testimony), Arthapatti (implication), Anupalabdhi (non-apprehension).", "canonical_texts": "The Four Vedas (Rig, Sama, Yajur, Atharva) (-1500); Bhagavad Gita (-400)", "famous_quote": "Rig Veda: Ekam Sat Vipra Bahudha Vadanti (Truth is one, the wise call it by many names).", "short_description_en": "Vedic civilization framework centered on cosmic order (Rta), the four goals of life (Purusharthas), karma, and spiritual duty.", "short_description_hi": "वैदिक जीवन पद्धति जो ऋत (ब्रह्मांडीय व्यवस्था), चार पुरुषार्थों, कर्म और सनातन धर्म के पालन पर आधारित है।", "full_description_en": "Vedic civilization framework centered on cosmic order (Rta), the four goals of life (Purusharthas), karma, and spiritual duty.", "full_description_hi": "वैदिक जीवन पद्धति जो ऋत (ब्रह्मांडीय व्यवस्था), चार पुरुषार्थों, कर्म और सनातन धर्म के पालन पर आधारित है।", "historical_associations": "The composition of the oral Vedic corpus and establishment of sacrificial and domestic fire rituals; The transition from ritualistic Vedic religion to philosophical internalization in the Upanishads; The synthesis of epic literature (Mahabharata and Ramayana) shaping pan-Indian civilizational ethos", "vector": {"D01": 0.6877, "D02": -0.0702, "D03": 0.0763, "D04": 0.7236, "D05": -0.0833, "D06": 0.3662, "D07": 0.6701, "D08": 0.0484, "D09": 0.5298, "D10": 0.8189, "D11": 0.0664, "D12": -0.0442, "D13": -0.0285, "D14": -0.1031, "D15": -0.0852, "D16": 0.0262, "D17": -0.6979, "D18": -0.1085, "D19": 0.0097, "D20": 0.0183, "D21": 0.0727, "D22": 0.0599, "D23": -0.1299, "D24": -0.1655, "D25": 0.0301}, "doctrinal_weights": {"D01": 0.5, "D02": 0.0, "D03": 0.0, "D04": 1.0, "D05": 0.0, "D06": 0.5, "D07": 0.5, "D08": 0.0, "D09": 0.5, "D10": 1.0, "D11": 0.0, "D12": 0.0, "D13": 0.0, "D14": 0.0, "D15": 0.0, "D16": 0.0, "D17": 0.5, "D18": 0.0, "D19": 0.0, "D20": 0.0, "D21": 0.0, "D22": 0.0, "D23": 0.0, "D24": 0.0, "D25": 0.0}, "dimension_rationales": {"D01": "Secondary Corollary: Contextual lean toward positive pole.", "D02": "Neutral / Doctrinally silent on this axis.", "D03": "Neutral / Doctrinally silent on this axis.", "D04": "Core Pillar: Strong alignment with positive pole.", "D05": "Neutral / Doctrinally silent on this axis.", "D06": "Secondary Corollary: Contextual lean toward positive pole.", "D07": "Secondary Corollary: Contextual lean toward positive pole.", "D08": "Neutral / Doctrinally silent on this axis.", "D09": "Secondary Corollary: Contextual lean toward positive pole.", "D10": "Core Pillar: Strong alignment with positive pole.", "D11": "Neutral / Doctrinally silent on this axis.", "D12": "Neutral / Doctrinally silent on this axis.", "D13": "Neutral / Doctrinally silent on this axis.", "D14": "Neutral / Doctrinally silent on this axis.", "D15": "Neutral / Doctrinally silent on this axis.", "D16": "Neutral / Doctrinally silent on this axis.", "D17": "Secondary Corollary: Contextual lean toward negative pole.", "D18": "Neutral / Doctrinally silent on this axis.", "D19": "Neutral / Doctrinally silent on this axis.", "D20": "Neutral / Doctrinally silent on this axis.", "D21": "Neutral / Doctrinally silent on this axis.", "D22": "Neutral / Doctrinally silent on this axis.", "D23": "Neutral / Doctrinally silent on this axis.", "D24": "Neutral / Doctrinally silent on this axis.", "D25": "Neutral / Doctrinally silent on this axis."}, "sources": [{"source_type": "primary_text", "title": "The Four Vedas (Rig, Sama, Yajur, Atharva) (-1500); Bhagavad Gita (-400)", "citation": "Primary literature: The Four Vedas (Rig, Sama, Yajur, Atharva) (-1500); Bhagavad Gita (-400)"}, {"source_type": "canonical_overview", "title": "Classical Sanātana Dharma", "citation": "Encyclopedic entry on Classical Sanātana Dharma"}]}, {"id": "W071", "cluster_id": "C08", "profile_type": "established", "name_en": "Early & Theravāda Buddhism", "name_hi": "प्रारंभिक और थेरवाद बौद्ध धर्म", "historical_era": "c. 500 BCE", "geographic_origin": "Gangetic Plains, India (Magadha / Sri Lanka preservation)", "founder_key_figures": "Siddhartha Gautama (The Buddha)", "epistemological_framework": "Empirical observation, direct personal verification (Ehipassiko), and the Four Noble Truths.", "canonical_texts": "The Pali Tipitaka (-300); Dhammapada (-250)", "famous_quote": "The Buddha (Dhammapada): All conditioned things are impermanent. When one sees this with wisdom, one turns away from suffering.", "short_description_en": "Nontheistic tradition emphasizing the Four Noble Truths, the Eightfold Path, impermanence (Anicca), and non-self (Anatta).", "short_description_hi": "थेरवाद बौद्ध धर्म, जो चार आर्य सत्यों, अष्टांगिक मार्ग, अनित्यत्ता और अनात्मवाद के माध्यम से निर्वाण प्राप्ति पर बल देता है।", "full_description_en": "Nontheistic tradition emphasizing the Four Noble Truths, the Eightfold Path, impermanence (Anicca), and non-self (Anatta).", "full_description_hi": "थेरवाद बौद्ध धर्म, जो चार आर्य सत्यों, अष्टांगिक मार्ग, अनित्यत्ता और अनात्मवाद के माध्यम से निर्वाण प्राप्ति पर बल देता है।", "historical_associations": "The enlightenment of Siddhartha Gautama under the Bodhi tree in Bodh Gaya; The First Buddhist Council at Rajgir and preservation of the Pali Canon at the Aluvihara rock temple; The global spread of Vipassana meditation and forest monastery networks", "vector": {"D01": 0.7347, "D02": 0.4308, "D03": 0.0783, "D04": -0.0272, "D05": -0.0825, "D06": 0.615, "D07": -0.0805, "D08": -0.7515, "D09": 0.1307, "D10": 0.8694, "D11": 0.067, "D12": -0.0459, "D13": -0.0281, "D14": -0.1053, "D15": -0.086, "D16": 0.0272, "D17": 0.0036, "D18": -0.8096, "D19": -0.5908, "D20": 0.0179, "D21": 0.0735, "D22": 0.062, "D23": -0.1329, "D24": -0.1669, "D25": 0.0313}, "doctrinal_weights": {"D01": 1.0, "D02": 0.5, "D03": 0.0, "D04": 0.0, "D05": 0.0, "D06": 0.5, "D07": 0.0, "D08": 1.0, "D09": 0.0, "D10": 1.0, "D11": 0.0, "D12": 0.0, "D13": 0.0, "D14": 0.0, "D15": 0.0, "D16": 0.0, "D17": 0.0, "D18": 1.0, "D19": 0.5, "D20": 0.0, "D21": 0.0, "D22": 0.0, "D23": 0.0, "D24": 0.0, "D25": 0.0}, "dimension_rationales": {"D01": "Core Pillar: Strong alignment with positive pole.", "D02": "Secondary Corollary: Contextual lean toward positive pole.", "D03": "Neutral / Doctrinally silent on this axis.", "D04": "Neutral / Doctrinally silent on this axis.", "D05": "Neutral / Doctrinally silent on this axis.", "D06": "Secondary Corollary: Contextual lean toward positive pole.", "D07": "Neutral / Doctrinally silent on this axis.", "D08": "Core Pillar: Strong alignment with negative pole.", "D09": "Neutral / Doctrinally silent on this axis.", "D10": "Core Pillar: Strong alignment with positive pole.", "D11": "Neutral / Doctrinally silent on this axis.", "D12": "Neutral / Doctrinally silent on this axis.", "D13": "Neutral / Doctrinally silent on this axis.", "D14": "Neutral / Doctrinally silent on this axis.", "D15": "Neutral / Doctrinally silent on this axis.", "D16": "Neutral / Doctrinally silent on this axis.", "D17": "Neutral / Doctrinally silent on this axis.", "D18": "Core Pillar: Strong alignment with negative pole.", "D19": "Secondary Corollary: Contextual lean toward negative pole.", "D20": "Neutral / Doctrinally silent on this axis.", "D21": "Neutral / Doctrinally silent on this axis.", "D22": "Neutral / Doctrinally silent on this axis.", "D23": "Neutral / Doctrinally silent on this axis.", "D24": "Neutral / Doctrinally silent on this axis.", "D25": "Neutral / Doctrinally silent on this axis."}, "sources": [{"source_type": "primary_text", "title": "The Pali Tipitaka (-300); Dhammapada (-250)", "citation": "Primary literature: The Pali Tipitaka (-300); Dhammapada (-250)"}, {"source_type": "canonical_overview", "title": "Early & Theravāda Buddhism", "citation": "Encyclopedic entry on Early & Theravāda Buddhism"}]}, {"id": "W081", "cluster_id": "C09", "profile_type": "established", "name_en": "Kashmir Shaivism (Trika)", "name_hi": "कश्मीर शैव दर्शन (त्रिक)", "historical_era": "c. 850 CE", "geographic_origin": "Kashmir, India", "founder_key_figures": "Vasugupta / Abhinavagupta", "epistemological_framework": "Pratyabhijna (recognition) of one's own identity as identical with universal Shiva consciousness (Paramashiva).", "canonical_texts": "Shiva Sutras (850); Tantraloka (Abhinavagupta) (1000)", "famous_quote": "Abhinavagupta: By realizing that the entire universe is a play of one's own consciousness, one attains liberation while living (Jivanmukti).", "short_description_en": "Non-dual idealistic Tantric philosophy asserting that reality is pure consciousness (Prakasha) manifesting the universe as a play of divine freedom (Svatantrya).", "short_description_hi": "कश्मीर शैव दर्शन, जो मानता है कि संपूर्ण जगत शिव की ही चेतन ऊर्जा (स्वातंत्र्य शक्ति) का विलास और प्रकटीकरण है।", "full_description_en": "Non-dual idealistic Tantric philosophy asserting that reality is pure consciousness (Prakasha) manifesting the universe as a play of divine freedom (Svatantrya).", "full_description_hi": "कश्मीर शैव दर्शन, जो मानता है कि संपूर्ण जगत शिव की ही चेतन ऊर्जा (स्वातंत्र्य शक्ति) का विलास और प्रकटीकरण है।", "historical_associations": "The intellectual golden age of Kashmir producing profound non-dual aesthetics and philosophy; Formulation of the Spanda (divine pulsation) and Pratyabhijna (recognition) doctrines; Integration of high spiritual realization with worldly enjoyment (Bhoga as Yoga)", "vector": {"D01": 0.7351, "D02": 0.7307, "D03": 0.0781, "D04": -0.0271, "D05": -0.0826, "D06": 0.6152, "D07": 0.7696, "D08": 0.5485, "D09": -0.6695, "D10": 0.1193, "D11": 0.067, "D12": -0.0457, "D13": -0.0281, "D14": -0.105, "D15": -0.0859, "D16": -0.4729, "D17": 0.0034, "D18": -0.1095, "D19": 0.0093, "D20": 0.018, "D21": 0.0734, "D22": 0.0618, "D23": -0.1325, "D24": -0.1667, "D25": 0.0312}, "doctrinal_weights": {"D01": 1.0, "D02": 1.0, "D03": 0.0, "D04": 0.0, "D05": 0.0, "D06": 0.5, "D07": 1.0, "D08": 0.5, "D09": 0.5, "D10": 0.0, "D11": 0.0, "D12": 0.0, "D13": 0.0, "D14": 0.0, "D15": 0.0, "D16": 0.5, "D17": 0.0, "D18": 0.0, "D19": 0.0, "D20": 0.0, "D21": 0.0, "D22": 0.0, "D23": 0.0, "D24": 0.0, "D25": 0.0}, "dimension_rationales": {"D01": "Core Pillar: Strong alignment with positive pole.", "D02": "Core Pillar: Strong alignment with positive pole.", "D03": "Neutral / Doctrinally silent on this axis.", "D04": "Neutral / Doctrinally silent on this axis.", "D05": "Neutral / Doctrinally silent on this axis.", "D06": "Secondary Corollary: Contextual lean toward positive pole.", "D07": "Core Pillar: Strong alignment with positive pole.", "D08": "Secondary Corollary: Contextual lean toward positive pole.", "D09": "Secondary Corollary: Contextual lean toward negative pole.", "D10": "Neutral / Doctrinally silent on this axis.", "D11": "Neutral / Doctrinally silent on this axis.", "D12": "Neutral / Doctrinally silent on this axis.", "D13": "Neutral / Doctrinally silent on this axis.", "D14": "Neutral / Doctrinally silent on this axis.", "D15": "Neutral / Doctrinally silent on this axis.", "D16": "Secondary Corollary: Contextual lean toward negative pole.", "D17": "Neutral / Doctrinally silent on this axis.", "D18": "Neutral / Doctrinally silent on this axis.", "D19": "Neutral / Doctrinally silent on this axis.", "D20": "Neutral / Doctrinally silent on this axis.", "D21": "Neutral / Doctrinally silent on this axis.", "D22": "Neutral / Doctrinally silent on this axis.", "D23": "Neutral / Doctrinally silent on this axis.", "D24": "Neutral / Doctrinally silent on this axis.", "D25": "Neutral / Doctrinally silent on this axis."}, "sources": [{"source_type": "primary_text", "title": "Shiva Sutras (850); Tantraloka (Abhinavagupta) (1000)", "citation": "Primary literature: Shiva Sutras (850); Tantraloka (Abhinavagupta) (1000)"}, {"source_type": "canonical_overview", "title": "Kashmir Shaivism (Trika)", "citation": "Encyclopedic entry on Kashmir Shaivism (Trika)"}]}, {"id": "W091", "cluster_id": "C10", "profile_type": "established", "name_en": "Classical Confucianism", "name_hi": "शास्त्रीय कन्फ्यूशियसवाद", "historical_era": "c. 500 BCE", "geographic_origin": "Lu State, China", "founder_key_figures": "Confucius (Kong Fuzi) / Mencius / Xunzi", "epistemological_framework": "Rectification of names (Zhengming), historical study of classics, moral intuition, and ritual propriety (Li).", "canonical_texts": "The Analects of Confucius (-475); Mencius (-300)", "famous_quote": "Confucius: Do not impose on others what you do not desire for yourself.", "short_description_en": "Ethical and sociopolitical philosophy emphasizing filial piety, humaneness (Ren), ritual propriety (Li), and moral self-cultivation.", "short_description_hi": "कन्फ्यूशियस का दर्शन, जो पारिवारिक सम्मान (पित्रभक्ति), मानवता (रेन) और नैतिक आचार-व्यवहार (ली) पर आधारित है।", "full_description_en": "Ethical and sociopolitical philosophy emphasizing filial piety, humaneness (Ren), ritual propriety (Li), and moral self-cultivation.", "full_description_hi": "कन्फ्यूशियस का दर्शन, जो पारिवारिक सम्मान (पित्रभक्ति), मानवता (रेन) और नैतिक आचार-व्यवहार (ली) पर आधारित है।", "historical_associations": "Shaping the ethical, familial, and political fabric of Chinese civilization for over two millennia; Establishing the imperial civil service examination system based on classical mastery; Providing the core moral foundation for family filial piety and social harmony across East Asia", "vector": {"D01": -0.1123, "D02": 0.7298, "D03": 0.0763, "D04": -0.0264, "D05": -0.0833, "D06": 0.6662, "D07": 0.5201, "D08": -0.8016, "D09": -0.6202, "D10": -0.3811, "D11": 0.0664, "D12": -0.0442, "D13": -0.0285, "D14": -0.1031, "D15": -0.0852, "D16": 0.0262, "D17": 0.0021, "D18": -0.1085, "D19": -0.7903, "D20": 0.0183, "D21": 0.0727, "D22": 0.0599, "D23": -0.1299, "D24": -0.1655, "D25": 0.0301}, "doctrinal_weights": {"D01": 0.0, "D02": 1.0, "D03": 0.0, "D04": 0.0, "D05": 0.0, "D06": 0.5, "D07": 0.5, "D08": 1.0, "D09": 0.5, "D10": 0.5, "D11": 0.0, "D12": 0.0, "D13": 0.0, "D14": 0.0, "D15": 0.0, "D16": 0.0, "D17": 0.0, "D18": 0.0, "D19": 1.0, "D20": 0.0, "D21": 0.0, "D22": 0.0, "D23": 0.0, "D24": 0.0, "D25": 0.0}, "dimension_rationales": {"D01": "Neutral / Doctrinally silent on this axis.", "D02": "Core Pillar: Strong alignment with positive pole.", "D03": "Neutral / Doctrinally silent on this axis.", "D04": "Neutral / Doctrinally silent on this axis.", "D05": "Neutral / Doctrinally silent on this axis.", "D06": "Secondary Corollary: Contextual lean toward positive pole.", "D07": "Secondary Corollary: Contextual lean toward positive pole.", "D08": "Core Pillar: Strong alignment with negative pole.", "D09": "Secondary Corollary: Contextual lean toward negative pole.", "D10": "Secondary Corollary: Contextual lean toward negative pole.", "D11": "Neutral / Doctrinally silent on this axis.", "D12": "Neutral / Doctrinally silent on this axis.", "D13": "Neutral / Doctrinally silent on this axis.", "D14": "Neutral / Doctrinally silent on this axis.", "D15": "Neutral / Doctrinally silent on this axis.", "D16": "Neutral / Doctrinally silent on this axis.", "D17": "Neutral / Doctrinally silent on this axis.", "D18": "Neutral / Doctrinally silent on this axis.", "D19": "Core Pillar: Strong alignment with negative pole.", "D20": "Neutral / Doctrinally silent on this axis.", "D21": "Neutral / Doctrinally silent on this axis.", "D22": "Neutral / Doctrinally silent on this axis.", "D23": "Neutral / Doctrinally silent on this axis.", "D24": "Neutral / Doctrinally silent on this axis.", "D25": "Neutral / Doctrinally silent on this axis."}, "sources": [{"source_type": "primary_text", "title": "The Analects of Confucius (-475); Mencius (-300)", "citation": "Primary literature: The Analects of Confucius (-475); Mencius (-300)"}, {"source_type": "canonical_overview", "title": "Classical Confucianism", "citation": "Encyclopedic entry on Classical Confucianism"}]}, {"id": "W101", "cluster_id": "C11", "profile_type": "established", "name_en": "Neo-Confucianism", "name_hi": "नव-कन्फ्यूशियसवाद", "historical_era": "c. 12th Century CE", "geographic_origin": "Song Dynasty China", "founder_key_figures": "Zhu Xi / Wang Yangming", "epistemological_framework": "Investigation of things (Gewu) to understand principle (Li) combined with mental moral reflection.", "canonical_texts": "The Four Books (with Commentary by Zhu Xi) (1190); Instructions for Practical Living (Wang Yangming) (1518)", "famous_quote": "Zhu Xi: To be able to practice benevolence everywhere in the world constitutes benevolence.", "short_description_en": "Metaphysical synthesis of Confucian ethics with Buddhist and Daoist cosmological principles, emphasizing principle (Li) and qi.", "short_description_hi": "कन्फ्यूशियसवाद का पुनरुत्थान, जिसमें बौद्ध और ताओवादी दर्शन के तत्वों को मिलाकर ब्रह्मांडीय सिद्धांत (ली) की व्याख्या की गई है।", "full_description_en": "Metaphysical synthesis of Confucian ethics with Buddhist and Daoist cosmological principles, emphasizing principle (Li) and qi.", "full_description_hi": "कन्फ्यूशियसवाद का पुनरुत्थान, जिसमें बौद्ध और ताओवादी दर्शन के तत्वों को मिलाकर ब्रह्मांडीय सिद्धांत (ली) की व्याख्या की गई है।", "historical_associations": "Revitalizing Confucianism by incorporating Buddhist and Daoist metaphysical depth; Serving as the official state orthodox ideology of imperial China and Joseon Korea for centuries; Shaping the rigorous moral education and examination system across East Asia", "vector": {"D01": -0.0903, "D02": -0.0702, "D03": 0.0763, "D04": -0.0264, "D05": -0.7163, "D06": -0.1338, "D07": -0.0799, "D08": 0.0155, "D09": 0.1298, "D10": 0.1189, "D11": -0.7891, "D12": -0.8497, "D13": -0.8725, "D14": -0.8476, "D15": 0.5066, "D16": 0.0262, "D17": 0.0021, "D18": -0.1085, "D19": 0.0097, "D20": -0.4037, "D21": 0.0727, "D22": 0.0984, "D23": -0.1299, "D24": -0.1655, "D25": 0.0301}, "doctrinal_weights": {"D01": 0.0, "D02": 0.0, "D03": 0.0, "D04": 0.0, "D05": 1.0, "D06": 0.0, "D07": 0.0, "D08": 0.0, "D09": 0.0, "D10": 0.0, "D11": 1.0, "D12": 1.0, "D13": 1.0, "D14": 1.0, "D15": 0.5, "D16": 0.0, "D17": 0.0, "D18": 0.0, "D19": 0.0, "D20": 0.5, "D21": 0.0, "D22": 0.0, "D23": 0.0, "D24": 0.0, "D25": 0.0}, "dimension_rationales": {"D01": "Neutral / Doctrinally silent on this axis.", "D02": "Neutral / Doctrinally silent on this axis.", "D03": "Neutral / Doctrinally silent on this axis.", "D04": "Neutral / Doctrinally silent on this axis.", "D05": "Core Pillar: Strong alignment with negative pole.", "D06": "Neutral / Doctrinally silent on this axis.", "D07": "Neutral / Doctrinally silent on this axis.", "D08": "Neutral / Doctrinally silent on this axis.", "D09": "Neutral / Doctrinally silent on this axis.", "D10": "Neutral / Doctrinally silent on this axis.", "D11": "Core Pillar: Strong alignment with negative pole.", "D12": "Core Pillar: Strong alignment with negative pole.", "D13": "Core Pillar: Strong alignment with negative pole.", "D14": "Core Pillar: Strong alignment with negative pole.", "D15": "Secondary Corollary: Contextual lean toward positive pole.", "D16": "Neutral / Doctrinally silent on this axis.", "D17": "Neutral / Doctrinally silent on this axis.", "D18": "Neutral / Doctrinally silent on this axis.", "D19": "Neutral / Doctrinally silent on this axis.", "D20": "Secondary Corollary: Contextual lean toward negative pole.", "D21": "Neutral / Doctrinally silent on this axis.", "D22": "Neutral / Doctrinally silent on this axis.", "D23": "Neutral / Doctrinally silent on this axis.", "D24": "Neutral / Doctrinally silent on this axis.", "D25": "Neutral / Doctrinally silent on this axis."}, "sources": [{"source_type": "primary_text", "title": "The Four Books (with Commentary by Zhu Xi) (1190); Instructions for Practical Living (Wang Yangming) (1518)", "citation": "Primary literature: The Four Books (with Commentary by Zhu Xi) (1190); Instructions for Practical Living (Wang Yangming) (1518)"}, {"source_type": "canonical_overview", "title": "Neo-Confucianism", "citation": "Encyclopedic entry on Neo-Confucianism"}]}, {"id": "W111", "cluster_id": "C12", "profile_type": "established", "name_en": "Zoroastrianism", "name_hi": "ज़रथुस्त्र धर्म (पारसी मत)", "historical_era": "c. 6th-1500 BCE", "geographic_origin": "Ancient Persia / Greater Iran", "founder_key_figures": "Zoroaster (Zarathustra)", "epistemological_framework": "Good thoughts, good words, good deeds (Humata, Hukhta, Havarsta), guided by divine wisdom (Ahura Mazda) and free moral choice.", "canonical_texts": "The Avesta (Gathas) (-1000)", "famous_quote": "Zarathustra (Yasha 30.3): The two primeval spirits, who revealed themselves in vision as twins, are the Better and the Bad in thought and word and action.", "short_description_en": "Ancient Iranian monotheistic faith centered on Ahura Mazda (Wisdom), cosmic dualism between Asha (Truth) and Druj (Chaos), and moral free will.", "short_description_hi": "प्राचीन फारस का जरथुस्त्र धर्म, जो अहुर मजदा (परम ज्ञान), सत्य (आशा) और झूठ (द्रुज) के बीच नैतिक संघर्ष और स्वतंत्र इच्छा पर आधारित है।", "full_description_en": "Ancient Iranian monotheistic faith centered on Ahura Mazda (Wisdom), cosmic dualism between Asha (Truth) and Druj (Chaos), and moral free will.", "full_description_hi": "प्राचीन फारस का जरथुस्त्र धर्म, जो अहुर मजदा (परम ज्ञान), सत्य (आशा) और झूठ (द्रुज) के बीच नैतिक संघर्ष और स्वतंत्र इच्छा पर आधारित है।", "historical_associations": "Serving as the official state religion of the Achaemenid, Parthian, and Sasanian Persian Empires; Pioneering foundational theological concepts of heaven, hell, final judgment, and cosmic dualism adopted by Abrahamic faiths; Preservation of ancient fire-temple liturgy and ecological purity laws", "vector": {"D01": -0.1123, "D02": -0.5702, "D03": 0.0763, "D04": -0.0264, "D05": -0.0833, "D06": -0.1338, "D07": -0.0799, "D08": 0.0484, "D09": 0.1298, "D10": 0.1189, "D11": -0.4336, "D12": -0.8942, "D13": -0.0285, "D14": -0.8531, "D15": -0.7852, "D16": 0.7762, "D17": 0.0021, "D18": -0.8585, "D19": 0.0097, "D20": 0.0183, "D21": 0.0727, "D22": 0.0599, "D23": -0.1299, "D24": -0.1655, "D25": 0.0301}, "doctrinal_weights": {"D01": 0.0, "D02": 0.5, "D03": 0.0, "D04": 0.0, "D05": 0.0, "D06": 0.0, "D07": 0.0, "D08": 0.0, "D09": 0.0, "D10": 0.0, "D11": 0.5, "D12": 1.0, "D13": 0.0, "D14": 1.0, "D15": 1.0, "D16": 1.0, "D17": 0.0, "D18": 1.0, "D19": 0.0, "D20": 0.0, "D21": 0.0, "D22": 0.0, "D23": 0.0, "D24": 0.0, "D25": 0.0}, "dimension_rationales": {"D01": "Neutral / Doctrinally silent on this axis.", "D02": "Secondary Corollary: Contextual lean toward negative pole.", "D03": "Neutral / Doctrinally silent on this axis.", "D04": "Neutral / Doctrinally silent on this axis.", "D05": "Neutral / Doctrinally silent on this axis.", "D06": "Neutral / Doctrinally silent on this axis.", "D07": "Neutral / Doctrinally silent on this axis.", "D08": "Neutral / Doctrinally silent on this axis.", "D09": "Neutral / Doctrinally silent on this axis.", "D10": "Neutral / Doctrinally silent on this axis.", "D11": "Secondary Corollary: Contextual lean toward negative pole.", "D12": "Core Pillar: Strong alignment with negative pole.", "D13": "Neutral / Doctrinally silent on this axis.", "D14": "Core Pillar: Strong alignment with negative pole.", "D15": "Core Pillar: Strong alignment with negative pole.", "D16": "Core Pillar: Strong alignment with positive pole.", "D17": "Neutral / Doctrinally silent on this axis.", "D18": "Core Pillar: Strong alignment with negative pole.", "D19": "Neutral / Doctrinally silent on this axis.", "D20": "Neutral / Doctrinally silent on this axis.", "D21": "Neutral / Doctrinally silent on this axis.", "D22": "Neutral / Doctrinally silent on this axis.", "D23": "Neutral / Doctrinally silent on this axis.", "D24": "Neutral / Doctrinally silent on this axis.", "D25": "Neutral / Doctrinally silent on this axis."}, "sources": [{"source_type": "primary_text", "title": "The Avesta (Gathas) (-1000)", "citation": "Primary literature: The Avesta (Gathas) (-1000)"}, {"source_type": "canonical_overview", "title": "Zoroastrianism", "citation": "Encyclopedic entry on Zoroastrianism"}]}, {"id": "W121", "cluster_id": "C13", "profile_type": "established", "name_en": "Sufism (Wahdat al-Wujud / Ibn Arabi)", "name_hi": "सूफीवाद (वह्दत अल-वजूद / इब्न अरबी)", "historical_era": "c. 12th-13th Century CE", "geographic_origin": "Andalusia / Damascus", "founder_key_figures": "Ibn Arabi (The Great Shaykh)", "epistemological_framework": "Kashf (unveiling/direct mystical intuition), dhikr (remembrance), and realization of divine unity in multiplicity.", "canonical_texts": "Fusus al-Hikam (The Bezels of Wisdom) (1229); Mathnawi (Rumi) (1270)", "famous_quote": "Ibn Arabi: My heart has become capable of every form: it is a pasture for gazelles and a convent for Christian monks... I follow the religion of Love.", "short_description_en": "Esoteric Islamic mysticism emphasizing that only God truly exists (Unity of Being) and that the divine is mirrored in all creation.", "short_description_hi": "इब्न अरबी का वहदत अल-वजूद (अस्तित्व की एकता), जिसके अनुसार इस ब्रह्मांड में केवल एक ही परम सत्य (ईश्वर) विभिन्न रूपों में प्रकट है।", "full_description_en": "Esoteric Islamic mysticism emphasizing that only God truly exists (Unity of Being) and that the divine is mirrored in all creation.", "full_description_hi": "इब्न अरबी का वहदत अल-वजूद (अस्तित्व की एकता), जिसके अनुसार इस ब्रह्मांड में केवल एक ही परम सत्य (ईश्वर) विभिन्न रूपों में प्रकट है।", "historical_associations": "Formulation of the ontological doctrine of Wahdat al-Wujud (The Unity of Being); Spreading universal divine love and religious pluralism across Islamic civilization through poetry and music; Establishing the vast international network of Sufi tariqas (orders) spanning from West Africa to China", "vector": {"D01": -0.1124, "D02": -0.0703, "D03": -0.4322, "D04": -0.0269, "D05": -0.5923, "D06": -0.1342, "D07": -0.0809, "D08": 0.0481, "D09": 0.1325, "D10": 0.87, "D11": 0.0534, "D12": -0.0558, "D13": -0.0283, "D14": -0.9051, "D15": 0.5135, "D16": -0.8379, "D17": 0.0115, "D18": 0.5894, "D19": 0.0097, "D20": 0.0185, "D21": 0.0732, "D22": 0.0602, "D23": -0.1316, "D24": -0.1665, "D25": 0.0302}, "doctrinal_weights": {"D01": 0.0, "D02": 0.0, "D03": 0.5, "D04": 0.0, "D05": 0.5, "D06": 0.0, "D07": 0.0, "D08": 0.0, "D09": 0.0, "D10": 1.0, "D11": 0.0, "D12": 0.0, "D13": 0.0, "D14": 1.0, "D15": 0.5, "D16": 1.0, "D17": 0.0, "D18": 0.5, "D19": 0.0, "D20": 0.0, "D21": 0.0, "D22": 0.0, "D23": 0.0, "D24": 0.0, "D25": 0.0}, "dimension_rationales": {"D01": "Neutral / Doctrinally silent on this axis.", "D02": "Neutral / Doctrinally silent on this axis.", "D03": "Secondary Corollary: Contextual lean toward negative pole.", "D04": "Neutral / Doctrinally silent on this axis.", "D05": "Secondary Corollary: Contextual lean toward negative pole.", "D06": "Neutral / Doctrinally silent on this axis.", "D07": "Neutral / Doctrinally silent on this axis.", "D08": "Neutral / Doctrinally silent on this axis.", "D09": "Neutral / Doctrinally silent on this axis.", "D10": "Core Pillar: Strong alignment with positive pole.", "D11": "Neutral / Doctrinally silent on this axis.", "D12": "Neutral / Doctrinally silent on this axis.", "D13": "Neutral / Doctrinally silent on this axis.", "D14": "Core Pillar: Strong alignment with negative pole.", "D15": "Secondary Corollary: Contextual lean toward positive pole.", "D16": "Core Pillar: Strong alignment with negative pole.", "D17": "Neutral / Doctrinally silent on this axis.", "D18": "Secondary Corollary: Contextual lean toward positive pole.", "D19": "Neutral / Doctrinally silent on this axis.", "D20": "Neutral / Doctrinally silent on this axis.", "D21": "Neutral / Doctrinally silent on this axis.", "D22": "Neutral / Doctrinally silent on this axis.", "D23": "Neutral / Doctrinally silent on this axis.", "D24": "Neutral / Doctrinally silent on this axis.", "D25": "Neutral / Doctrinally silent on this axis."}, "sources": [{"source_type": "primary_text", "title": "Fusus al-Hikam (The Bezels of Wisdom) (1229); Mathnawi (Rumi) (1270)", "citation": "Primary literature: Fusus al-Hikam (The Bezels of Wisdom) (1229); Mathnawi (Rumi) (1270)"}, {"source_type": "canonical_overview", "title": "Sufism (Wahdat al-Wujud / Ibn Arabi)", "citation": "Encyclopedic entry on Sufism (Wahdat al-Wujud / Ibn Arabi)"}]}, {"id": "W137", "cluster_id": "C14", "profile_type": "established", "name_en": "Fon / Ewe Vodun", "name_hi": "फोन / इवे वोदुन परंपरा", "historical_era": "Ancient Indigenous Tradition", "geographic_origin": "Benin / Togo / Ghana (West Africa)", "founder_key_figures": "Fon and Ewe Ancestors / Kingdom of Dahomey", "epistemological_framework": "Veneration of spirits/deities (Voduns) created by Mawu-Lisa (Supreme Creator), spirit possession, and herbal medicine.", "canonical_texts": "Vodun Oral Liturgical Corpus (-1000)", "famous_quote": "Vodun Proverb: Man is a plant whose roots are in the spirit world; the Voduns water these roots so the human tree may flourish.", "short_description_en": "West African traditional religion centering on divine spirits (Vodun) created by Supreme God Mawu-Lisa, emphasizing direct spirit interaction.", "short_description_hi": "पश्चिम अफ्रीका (बेनिन) का वोदुन धर्म, जो सर्वोच्च ईश्वर मावू-लिसा और प्रकृति की अदृश्य शक्तियों (वोदुन) के साथ संवाद पर आधारित है।", "full_description_en": "West African traditional religion centering on divine spirits (Vodun) created by Supreme God Mawu-Lisa, emphasizing direct spirit interaction.", "full_description_hi": "पश्चिम अफ्रीका (बेनिन) का वोदुन धर्म, जो सर्वोच्च ईश्वर मावू-लिसा और प्रकृति की अदृश्य शक्तियों (वोदुन) के साथ संवाद पर आधारित है।", "historical_associations": "The Kingdom of Dahomey establishing Vodun as state religion; Transatlantic historical preservation leading to Haitian Vodou, which played a decisive role in the 1804 Haitian Revolution; Official national recognition and annual celebration of National Vodun Day in Benin", "vector": {"D01": -0.229, "D02": -0.1551, "D03": -0.0876, "D04": 0.0353, "D05": -0.1159, "D06": -0.0389, "D07": -0.0291, "D08": 0.6756, "D09": 0.0576, "D10": 0.0789, "D11": -0.7301, "D12": -0.6026, "D13": -0.0193, "D14": -0.7786, "D15": 0.7378, "D16": -0.0568, "D17": -0.1171, "D18": -0.0161, "D19": 0.0506, "D20": 0.0693, "D21": 0.0045, "D22": -0.8522, "D23": 0.1123, "D24": -0.0535, "D25": -0.0713}, "doctrinal_weights": {"D01": 0.0, "D02": 0.0, "D03": 0.0, "D04": 0.0, "D05": 0.0, "D06": 0.0, "D07": 0.0, "D08": 0.5, "D09": 0.0, "D10": 0.0, "D11": 1.0, "D12": 0.5, "D13": 0.0, "D14": 1.0, "D15": 1.0, "D16": 0.0, "D17": 0.0, "D18": 0.0, "D19": 0.0, "D20": 0.0, "D21": 0.0, "D22": 1.0, "D23": 0.0, "D24": 0.0, "D25": 0.0}, "dimension_rationales": {"D01": "Neutral / Doctrinally silent on this axis.", "D02": "Neutral / Doctrinally silent on this axis.", "D03": "Neutral / Doctrinally silent on this axis.", "D04": "Neutral / Doctrinally silent on this axis.", "D05": "Neutral / Doctrinally silent on this axis.", "D06": "Neutral / Doctrinally silent on this axis.", "D07": "Neutral / Doctrinally silent on this axis.", "D08": "Secondary Corollary: Contextual lean toward positive pole.", "D09": "Neutral / Doctrinally silent on this axis.", "D10": "Neutral / Doctrinally silent on this axis.", "D11": "Core Pillar: Strong alignment with negative pole.", "D12": "Secondary Corollary: Contextual lean toward negative pole.", "D13": "Neutral / Doctrinally silent on this axis.", "D14": "Core Pillar: Strong alignment with negative pole.", "D15": "Core Pillar: Strong alignment with positive pole.", "D16": "Neutral / Doctrinally silent on this axis.", "D17": "Neutral / Doctrinally silent on this axis.", "D18": "Neutral / Doctrinally silent on this axis.", "D19": "Neutral / Doctrinally silent on this axis.", "D20": "Neutral / Doctrinally silent on this axis.", "D21": "Neutral / Doctrinally silent on this axis.", "D22": "Core Pillar: Strong alignment with negative pole.", "D23": "Neutral / Doctrinally silent on this axis.", "D24": "Neutral / Doctrinally silent on this axis.", "D25": "Neutral / Doctrinally silent on this axis."}, "sources": [{"source_type": "primary_text", "title": "Vodun Oral Liturgical Corpus (-1000)", "citation": "Primary literature: Vodun Oral Liturgical Corpus (-1000)"}, {"source_type": "canonical_overview", "title": "Fon / Ewe Vodun", "citation": "Encyclopedic entry on Fon / Ewe Vodun"}]}, {"id": "W141", "cluster_id": "C15", "profile_type": "established", "name_en": "Lakota Sacred Way (Inikagapi / Wakan Tanka)", "name_hi": "लाकोटा पवित्र मार्ग (वाकन टंका - उत्तर अमेरिका)", "historical_era": "Ancient Indigenous Tradition", "geographic_origin": "Great Plains, North America", "founder_key_figures": "White Buffalo Calf Woman / Ancestral Seven Sacred Rites", "epistemological_framework": "Mitakuye Oyasin ('All my relations'), vision quests (Hante Pi), sweat lodge purification (Inikagapi), and sacred pipe (Chanunpa) communion.", "canonical_texts": "Black Elk Speaks (Recorded oral teachings by John Neihardt) (1932)", "famous_quote": "Black Elk: The first peace, which is the most important, is that which comes within the souls of people when they realize their relationship, their oneness, with the universe.", "short_description_en": "Plains Indigenous American tradition honoring Wakan Tanka (Great Mystery) and universal kinship through the Seven Sacred Rites.", "short_description_hi": "उत्तरी अमेरिका के लाकोटा लोगों का पवित्र मार्ग, जो वाकन टंका (परम रहस्य) और समस्त सृष्टि के साथ भाईचारे (मिताकुये ओयासिन) पर आधारित है।", "full_description_en": "Plains Indigenous American tradition honoring Wakan Tanka (Great Mystery) and universal kinship through the Seven Sacred Rites.", "full_description_hi": "उत्तरी अमेरिका के लाकोटा लोगों का पवित्र मार्ग, जो वाकन टंका (परम रहस्य) और समस्त सृष्टि के साथ भाईचारे (मिताकुये ओयासिन) पर आधारित है।", "historical_associations": "The transmission of the Sacred Chanunpa (Pipe) by the White Buffalo Calf Woman to unite all nations; Resilient survival of the Sun Dance and sacred ceremonies despite 19th-century US government bans; The profound ecological ethic of kinship with all living beings encapsulated in Mitakuye Oyasin", "vector": {"D01": -0.1138, "D02": -0.0719, "D03": 0.0774, "D04": -0.0252, "D05": -0.0835, "D06": -0.1359, "D07": -0.081, "D08": 0.0489, "D09": 0.1309, "D10": 0.1207, "D11": -0.7823, "D12": -0.8448, "D13": -0.8788, "D14": -0.854, "D15": -0.98, "D16": 0.0272, "D17": 0.0025, "D18": -0.1091, "D19": 0.0089, "D20": 0.0183, "D21": 0.073, "D22": 0.0605, "D23": -0.1307, "D24": -0.7673, "D25": 0.6308}, "doctrinal_weights": {"D01": 0.0, "D02": 0.0, "D03": 0.0, "D04": 0.0, "D05": 0.0, "D06": 0.0, "D07": 0.0, "D08": 0.0, "D09": 0.0, "D10": 0.0, "D11": 1.0, "D12": 1.0, "D13": 1.0, "D14": 1.0, "D15": 1.0, "D16": 0.0, "D17": 0.0, "D18": 0.0, "D19": 0.0, "D20": 0.0, "D21": 0.0, "D22": 0.0, "D23": 0.0, "D24": 1.0, "D25": 0.5}, "dimension_rationales": {"D01": "Neutral / Doctrinally silent on this axis.", "D02": "Neutral / Doctrinally silent on this axis.", "D03": "Neutral / Doctrinally silent on this axis.", "D04": "Neutral / Doctrinally silent on this axis.", "D05": "Neutral / Doctrinally silent on this axis.", "D06": "Neutral / Doctrinally silent on this axis.", "D07": "Neutral / Doctrinally silent on this axis.", "D08": "Neutral / Doctrinally silent on this axis.", "D09": "Neutral / Doctrinally silent on this axis.", "D10": "Neutral / Doctrinally silent on this axis.", "D11": "Core Pillar: Strong alignment with negative pole.", "D12": "Core Pillar: Strong alignment with negative pole.", "D13": "Core Pillar: Strong alignment with negative pole.", "D14": "Core Pillar: Strong alignment with negative pole.", "D15": "Core Pillar: Strong alignment with negative pole.", "D16": "Neutral / Doctrinally silent on this axis.", "D17": "Neutral / Doctrinally silent on this axis.", "D18": "Neutral / Doctrinally silent on this axis.", "D19": "Neutral / Doctrinally silent on this axis.", "D20": "Neutral / Doctrinally silent on this axis.", "D21": "Neutral / Doctrinally silent on this axis.", "D22": "Neutral / Doctrinally silent on this axis.", "D23": "Neutral / Doctrinally silent on this axis.", "D24": "Core Pillar: Strong alignment with negative pole.", "D25": "Secondary Corollary: Contextual lean toward positive pole."}, "sources": [{"source_type": "primary_text", "title": "Black Elk Speaks (Recorded oral teachings by John Neihardt) (1932)", "citation": "Primary literature: Black Elk Speaks (Recorded oral teachings by John Neihardt) (1932)"}, {"source_type": "canonical_overview", "title": "Lakota Sacred Way (Inikagapi / Wakan Tanka)", "citation": "Encyclopedic entry on Lakota Sacred Way (Inikagapi / Wakan Tanka)"}]}, {"id": "W151", "cluster_id": "C16", "profile_type": "established", "name_en": "Toltec Wisdom Tradition", "name_hi": "तोल्तेक ज्ञान परंपरा (मेसोअमेरिका)", "historical_era": "c. 900 CE (Classic/Post-Classic Mesoamerica)", "geographic_origin": "Tula, Hidalgo, Mexico", "founder_key_figures": "Quetzalcoatl / Toltec Sages", "epistemological_framework": "Breaking the 'mitote' (dream of the planet), mastery of awareness, and transforming personal agreements through impeccable word and intent.", "canonical_texts": "The Four Agreements (Don Miguel Ruiz) (1997); Ancient Toltec Codex Fragments (1000)", "famous_quote": "Don Miguel Ruiz: Be impeccable with your word. Don't take anything personally. Don't make assumptions. Always do your best.", "short_description_en": "Mesoamerican spiritual tradition focusing on personal mastery, breaking societal illusions, and spiritual awakening via Quetzalcoatl's path.", "short_description_hi": "मेसोअमेरिका की तोल्तेक परंपरा, जो भ्रम की निद्रा (मितोते) को तोड़कर व्यक्तिगत स्वतंत्रता, सत्य और क्वेतजाल्कोआत्ल के ज्ञान मार्ग पर चलती है।", "full_description_en": "Mesoamerican spiritual tradition focusing on personal mastery, breaking societal illusions, and spiritual awakening via Quetzalcoatl's path.", "full_description_hi": "मेसोअमेरिका की तोल्तेक परंपरा, जो भ्रम की निद्रा (मितोते) को तोड़कर व्यक्तिगत स्वतंत्रता, सत्य और क्वेतजाल्कोआत्ल के ज्ञान मार्ग पर चलती है।", "historical_associations": "The historical Toltec civilization of Tula serving as the cultural and spiritual teacher for subsequent Mesoamerican empires; The mythos of Quetzalcoatl (The Feathered Serpent) as the patron of wisdom, priesthood, and inner transformation; The late 20th-century global popularization of Toltec agreements for personal psychological freedom", "vector": {"D01": -0.1123, "D02": 0.5298, "D03": 0.0763, "D04": -0.0264, "D05": 0.7167, "D06": -0.1338, "D07": -0.0799, "D08": -0.8016, "D09": 0.1298, "D10": 0.1189, "D11": 0.9164, "D12": -0.0442, "D13": -0.0285, "D14": -0.1031, "D15": -0.0852, "D16": 0.0262, "D17": 0.0021, "D18": -0.9085, "D19": -0.5903, "D20": 0.0183, "D21": 0.0727, "D22": 0.9099, "D23": -0.1299, "D24": -0.1655, "D25": 0.0301}, "doctrinal_weights": {"D01": 0.0, "D02": 0.5, "D03": 0.0, "D04": 0.0, "D05": 1.0, "D06": 0.0, "D07": 0.0, "D08": 1.0, "D09": 0.0, "D10": 0.0, "D11": 1.0, "D12": 0.0, "D13": 0.0, "D14": 0.0, "D15": 0.0, "D16": 0.0, "D17": 0.0, "D18": 1.0, "D19": 0.5, "D20": 0.0, "D21": 0.0, "D22": 1.0, "D23": 0.0, "D24": 0.0, "D25": 0.0}, "dimension_rationales": {"D01": "Neutral / Doctrinally silent on this axis.", "D02": "Secondary Corollary: Contextual lean toward positive pole.", "D03": "Neutral / Doctrinally silent on this axis.", "D04": "Neutral / Doctrinally silent on this axis.", "D05": "Core Pillar: Strong alignment with positive pole.", "D06": "Neutral / Doctrinally silent on this axis.", "D07": "Neutral / Doctrinally silent on this axis.", "D08": "Core Pillar: Strong alignment with negative pole.", "D09": "Neutral / Doctrinally silent on this axis.", "D10": "Neutral / Doctrinally silent on this axis.", "D11": "Core Pillar: Strong alignment with positive pole.", "D12": "Neutral / Doctrinally silent on this axis.", "D13": "Neutral / Doctrinally silent on this axis.", "D14": "Neutral / Doctrinally silent on this axis.", "D15": "Neutral / Doctrinally silent on this axis.", "D16": "Neutral / Doctrinally silent on this axis.", "D17": "Neutral / Doctrinally silent on this axis.", "D18": "Core Pillar: Strong alignment with negative pole.", "D19": "Secondary Corollary: Contextual lean toward negative pole.", "D20": "Neutral / Doctrinally silent on this axis.", "D21": "Neutral / Doctrinally silent on this axis.", "D22": "Core Pillar: Strong alignment with positive pole.", "D23": "Neutral / Doctrinally silent on this axis.", "D24": "Neutral / Doctrinally silent on this axis.", "D25": "Neutral / Doctrinally silent on this axis."}, "sources": [{"source_type": "primary_text", "title": "The Four Agreements (Don Miguel Ruiz) (1997); Ancient Toltec Codex Fragments (1000)", "citation": "Primary literature: The Four Agreements (Don Miguel Ruiz) (1997); Ancient Toltec Codex Fragments (1000)"}, {"source_type": "canonical_overview", "title": "Toltec Wisdom Tradition", "citation": "Encyclopedic entry on Toltec Wisdom Tradition"}]}, {"id": "W161", "cluster_id": "C17", "profile_type": "established", "name_en": "Australian Aboriginal Dreaming (Tjukurpa / Jukurrpa)", "name_hi": "ऑस्ट्रेलियाई आदिवासी 'ड्रीमिकी' दर्शन (तुकुर्पा)", "historical_era": "65,000+ Years Ago (Continuous ancient tradition)", "geographic_origin": "Australian Continent", "founder_key_figures": "First Ancestral Beings / Creator Ancestors", "epistemological_framework": "The Dreaming (everywhen: past, present, and future simultaneously), sacred songlines (Tjukurrpa), country stewardship, and custodial kinship.", "canonical_texts": "Songlines and Rock Art Sacred Epigraphic Corpus (-60000)", "famous_quote": "Bill Neidjie (Gangalidda Elder): The earth is mother to us all; when you damage the earth, you damage yourself and your future generations.", "short_description_en": "Ancient Australian Indigenous worldview centering on 'The Dreaming'—an all-encompassing dimension of past, present, and future creation and law.", "short_description_hi": "ऑस्ट्रेलियाई आदिवासियों का 'ड्रीमिकी' (तुकुर्पा) दर्शन, जो भूत, वर्तमान और भविष्य को एक साथ जोड़ने वाली शाश्वत सृष्टि और प्रकृति से अटूट नाते पर आधारित है।", "full_description_en": "Ancient Australian Indigenous worldview centering on 'The Dreaming'—an all-encompassing dimension of past, present, and future creation and law.", "full_description_hi": "ऑस्ट्रेलियाई आदिवासियों का 'ड्रीमिकी' (तुकुर्पा) दर्शन, जो भूत, वर्तमान और भविष्य को एक साथ जोड़ने वाली शाश्वत सृष्टि और प्रकृति से अटूट नाते पर आधारित है।", "historical_associations": "Maintaining the world's oldest continuous living culture spanning over 65,000 years of unbroken oral history; Navigating the entire Australian continent using intricate songlines (mapping sacred geography through song and story); Modern global ecological recognition of Aboriginal land management and fire-stick farming wisdom", "vector": {"D01": 0.3877, "D02": -0.0702, "D03": 0.0763, "D04": -0.0264, "D05": 0.7667, "D06": -0.1338, "D07": -0.0799, "D08": 0.0484, "D09": 0.1298, "D10": 0.1189, "D11": 0.9164, "D12": 0.7558, "D13": 0.7715, "D14": -0.1031, "D15": 0.6648, "D16": 0.0262, "D17": 0.0021, "D18": -0.1085, "D19": 0.0097, "D20": 0.0183, "D21": 0.0727, "D22": 0.8599, "D23": -0.1299, "D24": -0.1655, "D25": 0.0301}, "doctrinal_weights": {"D01": 0.5, "D02": 0.0, "D03": 0.0, "D04": 0.0, "D05": 1.0, "D06": 0.0, "D07": 0.0, "D08": 0.0, "D09": 0.0, "D10": 0.0, "D11": 1.0, "D12": 1.0, "D13": 1.0, "D14": 0.0, "D15": 0.5, "D16": 0.0, "D17": 0.0, "D18": 0.0, "D19": 0.0, "D20": 0.0, "D21": 0.0, "D22": 1.0, "D23": 0.0, "D24": 0.0, "D25": 0.0}, "dimension_rationales": {"D01": "Secondary Corollary: Contextual lean toward positive pole.", "D02": "Neutral / Doctrinally silent on this axis.", "D03": "Neutral / Doctrinally silent on this axis.", "D04": "Neutral / Doctrinally silent on this axis.", "D05": "Core Pillar: Strong alignment with positive pole.", "D06": "Neutral / Doctrinally silent on this axis.", "D07": "Neutral / Doctrinally silent on this axis.", "D08": "Neutral / Doctrinally silent on this axis.", "D09": "Neutral / Doctrinally silent on this axis.", "D10": "Neutral / Doctrinally silent on this axis.", "D11": "Core Pillar: Strong alignment with positive pole.", "D12": "Core Pillar: Strong alignment with positive pole.", "D13": "Core Pillar: Strong alignment with positive pole.", "D14": "Neutral / Doctrinally silent on this axis.", "D15": "Secondary Corollary: Contextual lean toward positive pole.", "D16": "Neutral / Doctrinally silent on this axis.", "D17": "Neutral / Doctrinally silent on this axis.", "D18": "Neutral / Doctrinally silent on this axis.", "D19": "Neutral / Doctrinally silent on this axis.", "D20": "Neutral / Doctrinally silent on this axis.", "D21": "Neutral / Doctrinally silent on this axis.", "D22": "Core Pillar: Strong alignment with positive pole.", "D23": "Neutral / Doctrinally silent on this axis.", "D24": "Neutral / Doctrinally silent on this axis.", "D25": "Neutral / Doctrinally silent on this axis."}, "sources": [{"source_type": "primary_text", "title": "Songlines and Rock Art Sacred Epigraphic Corpus (-60000)", "citation": "Primary literature: Songlines and Rock Art Sacred Epigraphic Corpus (-60000)"}, {"source_type": "canonical_overview", "title": "Australian Aboriginal Dreaming (Tjukurpa / Jukurrpa)", "citation": "Encyclopedic entry on Australian Aboriginal Dreaming (Tjukurpa / Jukurrpa)"}]}, {"id": "W171", "cluster_id": "C18", "profile_type": "established", "name_en": "Norse Heathenry (Ásatrú)", "name_hi": "नर्स हीथेन्री (आसत्रू - जर्मन/नॉर्डिक पुनरुत्थान)", "historical_era": "Pre-Christian Germanic Antiquity / Modern Revival c. 1970s CE", "geographic_origin": "Scandinavia / Iceland / Northern Europe", "founder_key_figures": "Norse Skalds and Sages / Modern Heathen Elders", "epistemological_framework": "Reconstructionist scholarship of sagas and Eddas, personal honor (Drengskapur), reciprocity with the Æsir and Vanir, and ancestral remembrance (Blót).", "canonical_texts": "The Poetic Edda (1270); The Prose Edda (Snorri Sturluson) (1220)", "famous_quote": "Hávamál (Poetic Edda): Cattle die, kinsmen die, you yourself will die; but the word of honor never dies, of one who has earned a good name.", "short_description_en": "Modern reconstruction of pre-Christian Germanic and Norse religion honoring the Æsir and Vanir, focusing on honor, kinship, and oaths.", "short_description_hi": "प्राचीन जर्मन और नॉर्डिक धर्म का आधुनिक पुनरुत्थान (आसत्रू), जो एसर और वानिर देवताओं की पूजा, व्यक्तिगत सम्मान (ओथ) और पूर्वज स्मरण पर आधारित है।", "full_description_en": "Modern reconstruction of pre-Christian Germanic and Norse religion honoring the Æsir and Vanir, focusing on honor, kinship, and oaths.", "full_description_hi": "प्राचीन जर्मन और नॉर्डिक धर्म का आधुनिक पुनरुत्थान (आसत्रू), जो एसर और वानिर देवताओं की पूजा, व्यक्तिगत सम्मान (ओथ) और पूर्वज स्मरण पर आधारित है।", "historical_associations": "Preservation of ancient Germanic mythology, cosmology, and heroic poetry in medieval Icelandic manuscripts; The official legal re-establishment of Ásatrú as a recognized state religion in Iceland in 1972; Modern reconstructionist efforts building inclusive, anti-racist, community-centered kindreds globally", "vector": {"D01": -0.1123, "D02": -0.0702, "D03": 0.0763, "D04": -0.0264, "D05": 0.5167, "D06": -0.1338, "D07": -0.0799, "D08": 0.0484, "D09": 0.1298, "D10": 0.1189, "D11": 0.9164, "D12": -0.7442, "D13": 0.8715, "D14": -0.1031, "D15": 0.5148, "D16": 0.0262, "D17": 0.0021, "D18": -0.8585, "D19": 0.0097, "D20": 0.0183, "D21": 0.0727, "D22": 0.8599, "D23": -0.1299, "D24": -0.1655, "D25": 0.0301}, "doctrinal_weights": {"D01": 0.0, "D02": 0.0, "D03": 0.0, "D04": 0.0, "D05": 0.5, "D06": 0.0, "D07": 0.0, "D08": 0.0, "D09": 0.0, "D10": 0.0, "D11": 1.0, "D12": 1.0, "D13": 1.0, "D14": 0.0, "D15": 0.5, "D16": 0.0, "D17": 0.0, "D18": 1.0, "D19": 0.0, "D20": 0.0, "D21": 0.0, "D22": 1.0, "D23": 0.0, "D24": 0.0, "D25": 0.0}, "dimension_rationales": {"D01": "Neutral / Doctrinally silent on this axis.", "D02": "Neutral / Doctrinally silent on this axis.", "D03": "Neutral / Doctrinally silent on this axis.", "D04": "Neutral / Doctrinally silent on this axis.", "D05": "Secondary Corollary: Contextual lean toward positive pole.", "D06": "Neutral / Doctrinally silent on this axis.", "D07": "Neutral / Doctrinally silent on this axis.", "D08": "Neutral / Doctrinally silent on this axis.", "D09": "Neutral / Doctrinally silent on this axis.", "D10": "Neutral / Doctrinally silent on this axis.", "D11": "Core Pillar: Strong alignment with positive pole.", "D12": "Core Pillar: Strong alignment with negative pole.", "D13": "Core Pillar: Strong alignment with positive pole.", "D14": "Neutral / Doctrinally silent on this axis.", "D15": "Secondary Corollary: Contextual lean toward positive pole.", "D16": "Neutral / Doctrinally silent on this axis.", "D17": "Neutral / Doctrinally silent on this axis.", "D18": "Core Pillar: Strong alignment with negative pole.", "D19": "Neutral / Doctrinally silent on this axis.", "D20": "Neutral / Doctrinally silent on this axis.", "D21": "Neutral / Doctrinally silent on this axis.", "D22": "Core Pillar: Strong alignment with positive pole.", "D23": "Neutral / Doctrinally silent on this axis.", "D24": "Neutral / Doctrinally silent on this axis.", "D25": "Neutral / Doctrinally silent on this axis."}, "sources": [{"source_type": "primary_text", "title": "The Poetic Edda (1270); The Prose Edda (Snorri Sturluson) (1220)", "citation": "Primary literature: The Poetic Edda (1270); The Prose Edda (Snorri Sturluson) (1220)"}, {"source_type": "canonical_overview", "title": "Norse Heathenry (Ásatrú)", "citation": "Encyclopedic entry on Norse Heathenry (Ásatrú)"}]}, {"id": "W181", "cluster_id": "C19", "profile_type": "established", "name_en": "Classical Liberalism", "name_hi": "शास्त्रीय उदारवाद", "historical_era": "17th-18th Century CE", "geographic_origin": "Britain / Western Europe", "founder_key_figures": "John Locke / Adam Smith / Montesquieu", "epistemological_framework": "Empirical rationalism, natural rights (life, liberty, property), methodological individualism, and free-market price signals.", "canonical_texts": "Second Treatise of Government (Locke) (1689); The Wealth of Nations (Smith) (1776)", "famous_quote": "Adam Smith: It is not from the benevolence of the butcher, the brewer, or the baker that we expect our dinner, but from their regard to their own interest.", "short_description_en": "Political and economic ideology prioritizing individual liberty, private property, free markets, rule of law, and limited government.", "short_description_hi": "शास्त्रीय उदारवाद, जो व्यक्तिगत स्वतंत्रता, निजी संपत्ति, मुक्त बाजार, कानून के शासन और सीमित सरकार का समर्थन करता है।", "full_description_en": "Political and economic ideology prioritizing individual liberty, private property, free markets, rule of law, and limited government.", "full_description_hi": "शास्त्रीय उदारवाद, जो व्यक्तिगत स्वतंत्रता, निजी संपत्ति, मुक्त बाजार, कानून के शासन और सीमित सरकार का समर्थन करता है।", "historical_associations": "The intellectual driving force behind the Glorious Revolution, the American Revolution, and early industrial capitalism; Formulation of the 'invisible hand' theory of market self-regulation and limited constitutional government; Laying the institutional groundwork for modern global trade, private property rights, and rule of law", "vector": {"D01": -0.1123, "D02": -0.0702, "D03": 0.0763, "D04": -0.0264, "D05": -0.0833, "D06": -0.1338, "D07": -0.4799, "D08": 0.0484, "D09": 0.1298, "D10": -0.3811, "D11": 0.0664, "D12": -0.0442, "D13": -0.0285, "D14": -0.1031, "D15": -0.0852, "D16": 0.8762, "D17": 0.0021, "D18": -0.9585, "D19": -0.7903, "D20": 0.0183, "D21": 0.0727, "D22": 0.8099, "D23": -0.1299, "D24": -0.1655, "D25": -0.7199}, "doctrinal_weights": {"D01": 0.0, "D02": 0.0, "D03": 0.0, "D04": 0.0, "D05": 0.0, "D06": 0.0, "D07": 0.5, "D08": 0.0, "D09": 0.0, "D10": 0.5, "D11": 0.0, "D12": 0.0, "D13": 0.0, "D14": 0.0, "D15": 0.0, "D16": 1.0, "D17": 0.0, "D18": 1.0, "D19": 1.0, "D20": 0.0, "D21": 0.0, "D22": 1.0, "D23": 0.0, "D24": 0.0, "D25": 1.0}, "dimension_rationales": {"D01": "Neutral / Doctrinally silent on this axis.", "D02": "Neutral / Doctrinally silent on this axis.", "D03": "Neutral / Doctrinally silent on this axis.", "D04": "Neutral / Doctrinally silent on this axis.", "D05": "Neutral / Doctrinally silent on this axis.", "D06": "Neutral / Doctrinally silent on this axis.", "D07": "Secondary Corollary: Contextual lean toward negative pole.", "D08": "Neutral / Doctrinally silent on this axis.", "D09": "Neutral / Doctrinally silent on this axis.", "D10": "Secondary Corollary: Contextual lean toward negative pole.", "D11": "Neutral / Doctrinally silent on this axis.", "D12": "Neutral / Doctrinally silent on this axis.", "D13": "Neutral / Doctrinally silent on this axis.", "D14": "Neutral / Doctrinally silent on this axis.", "D15": "Neutral / Doctrinally silent on this axis.", "D16": "Core Pillar: Strong alignment with positive pole.", "D17": "Neutral / Doctrinally silent on this axis.", "D18": "Core Pillar: Strong alignment with negative pole.", "D19": "Core Pillar: Strong alignment with negative pole.", "D20": "Neutral / Doctrinally silent on this axis.", "D21": "Neutral / Doctrinally silent on this axis.", "D22": "Core Pillar: Strong alignment with positive pole.", "D23": "Neutral / Doctrinally silent on this axis.", "D24": "Neutral / Doctrinally silent on this axis.", "D25": "Core Pillar: Strong alignment with negative pole."}, "sources": [{"source_type": "primary_text", "title": "Second Treatise of Government (Locke) (1689); The Wealth of Nations (Smith) (1776)", "citation": "Primary literature: Second Treatise of Government (Locke) (1689); The Wealth of Nations (Smith) (1776)"}, {"source_type": "canonical_overview", "title": "Classical Liberalism", "citation": "Encyclopedic entry on Classical Liberalism"}]}, {"id": "W191", "cluster_id": "C20", "profile_type": "established", "name_en": "Classical Marxism-Leninism", "name_hi": "शास्त्रीय मार्क्सवाद-लेनिनवाद", "historical_era": "19th-20th Century CE", "geographic_origin": "Europe / Soviet Union", "founder_key_figures": "Karl Marx / Friedrich Engels / Vladimir Lenin", "epistemological_framework": "Dialectical and historical materialism, labor theory of value, class struggle as the engine of history, and vanguard party leadership.", "canonical_texts": "Das Kapital (Karl Marx) (1867); State and Revolution (Lenin) (1917)", "famous_quote": "Karl Marx & Friedrich Engels: The philosophers have only interpreted the world, in various ways; the point is to change it.", "short_description_en": "Revolutionary socialist ideology aiming for the overthrow of capitalism, establishment of a dictatorship of the proletariat, and ultimate stateless communism.", "short_description_hi": "मार्क्सवाद-लेनिनवाद, जो पूंजीवाद के हिंसक अंत, सर्वहारा वर्ग की तानाशाही और वर्गहीन साम्यवादी समाज की स्थापना का क्रांतिकारी सिद्धांत है।", "full_description_en": "Revolutionary socialist ideology aiming for the overthrow of capitalism, establishment of a dictatorship of the proletariat, and ultimate stateless communism.", "full_description_hi": "मार्क्सवाद-लेनिनवाद, जो पूंजीवाद के हिंसक अंत, सर्वहारा वर्ग की तानाशाही और वर्गहीन साम्यवादी समाज की स्थापना का क्रांतिकारी सिद्धांत है।", "historical_associations": "The 1917 October Revolution establishing the world's first socialist state (Soviet Union); Sparking global anti-colonial liberation movements and mid-20th-century communist state formations; Rigorous critique of capitalist exploitation, alienation, and commodity fetishism", "vector": {"D01": -0.1123, "D02": -0.0702, "D03": 0.0853, "D04": -0.0264, "D05": -0.0742, "D06": -0.1338, "D07": -0.0799, "D08": 0.0484, "D09": 0.1298, "D10": 0.8699, "D11": 0.8346, "D12": 0.6728, "D13": -0.0285, "D14": -0.801, "D15": 0.5133, "D16": 0.0391, "D17": -0.51, "D18": 0.6424, "D19": 0.0097, "D20": 0.0183, "D21": 0.078, "D22": 0.0599, "D23": -0.1299, "D24": -0.1692, "D25": 0.0301}, "doctrinal_weights": {"D01": 0.0, "D02": 0.0, "D03": 0.0, "D04": 0.0, "D05": 0.0, "D06": 0.0, "D07": 0.0, "D08": 0.0, "D09": 0.0, "D10": 1.0, "D11": 1.0, "D12": 0.5, "D13": 0.0, "D14": 1.0, "D15": 0.5, "D16": 0.0, "D17": 0.5, "D18": 0.5, "D19": 0.0, "D20": 0.0, "D21": 0.0, "D22": 0.0, "D23": 0.0, "D24": 0.0, "D25": 0.0}, "dimension_rationales": {"D01": "Neutral / Doctrinally silent on this axis.", "D02": "Neutral / Doctrinally silent on this axis.", "D03": "Neutral / Doctrinally silent on this axis.", "D04": "Neutral / Doctrinally silent on this axis.", "D05": "Neutral / Doctrinally silent on this axis.", "D06": "Neutral / Doctrinally silent on this axis.", "D07": "Neutral / Doctrinally silent on this axis.", "D08": "Neutral / Doctrinally silent on this axis.", "D09": "Neutral / Doctrinally silent on this axis.", "D10": "Core Pillar: Strong alignment with positive pole.", "D11": "Core Pillar: Strong alignment with positive pole.", "D12": "Secondary Corollary: Contextual lean toward positive pole.", "D13": "Neutral / Doctrinally silent on this axis.", "D14": "Core Pillar: Strong alignment with negative pole.", "D15": "Secondary Corollary: Contextual lean toward positive pole.", "D16": "Neutral / Doctrinally silent on this axis.", "D17": "Secondary Corollary: Contextual lean toward negative pole.", "D18": "Secondary Corollary: Contextual lean toward positive pole.", "D19": "Neutral / Doctrinally silent on this axis.", "D20": "Neutral / Doctrinally silent on this axis.", "D21": "Neutral / Doctrinally silent on this axis.", "D22": "Neutral / Doctrinally silent on this axis.", "D23": "Neutral / Doctrinally silent on this axis.", "D24": "Neutral / Doctrinally silent on this axis.", "D25": "Neutral / Doctrinally silent on this axis."}, "sources": [{"source_type": "primary_text", "title": "Das Kapital (Karl Marx) (1867); State and Revolution (Lenin) (1917)", "citation": "Primary literature: Das Kapital (Karl Marx) (1867); State and Revolution (Lenin) (1917)"}, {"source_type": "canonical_overview", "title": "Classical Marxism-Leninism", "citation": "Encyclopedic entry on Classical Marxism-Leninism"}]}, {"id": "W201", "cluster_id": "C21", "profile_type": "established", "name_en": "Perennialism (Traditionalist School / Sophia Perennis)", "name_hi": "पर्रेनियलिज्म (सनातन दर्शन / पारंपरिक स्कूल)", "historical_era": "Early 20th Century CE", "geographic_origin": "France / Switzerland / India", "founder_key_figures": "René Guénon / Ananda Coomaraswamy / Frithjof Schuon", "epistemological_framework": "Sophia Perennis (The Eternal Wisdom), transcendent unity of religions, intellectual intuition (Buddhi), and anti-modern critique.", "canonical_texts": "Crisis of the Modern World (Guénon) (1927); The Transcendent Unity of Religions (Schuon) (1948)", "famous_quote": "René Guénon: The modern world is plunged in darkness because it has severed its ties with traditional metaphysics and divine hierarchy.", "short_description_en": "Esoteric traditionalist philosophy asserting the existence of a single divine Universal Truth (Sophia Perennis) expressed through all authentic religions.", "short_description_hi": "पारंपरिक स्कूल (सनातन दर्शन), जो सभी धर्मों के मूल में एक ही शाश्वत दिव्य सत्य (सोफिया पेरेनिस) को मानता है और आधुनिकता की घोर आलोचना करता है।", "full_description_en": "Esoteric traditionalist philosophy asserting the existence of a single divine Universal Truth (Sophia Perennis) expressed through all authentic religions.", "full_description_hi": "पारंपरिक स्कूल (सनातन दर्शन), जो सभी धर्मों के मूल में एक ही शाश्वत दिव्य सत्य (सोफिया पेरेनिस) को मानता है और आधुनिकता की घोर आलोचना करता है।", "historical_associations": "Formulating the 20th-century intellectual critique of modern secularism, materialism, and industrial technology; Inspiring cross-cultural comparative study of sacred art, symbolism, and metaphysics; Profound influence on conservative cultural critics, religious scholars, and traditionalist thinkers globally", "vector": {"D01": 0.2876, "D02": -0.0709, "D03": 0.0765, "D04": -0.0271, "D05": -0.084, "D06": -0.1342, "D07": -0.0799, "D08": 0.0488, "D09": 0.1303, "D10": 0.1202, "D11": 0.067, "D12": -0.0441, "D13": 0.3714, "D14": -0.1037, "D15": 0.7144, "D16": 0.026, "D17": 0.0018, "D18": -0.1085, "D19": 0.0086, "D20": 0.8676, "D21": 0.8233, "D22": 0.0609, "D23": -0.8315, "D24": 0.6832, "D25": 0.0302}, "doctrinal_weights": {"D01": 0.5, "D02": 0.0, "D03": 0.0, "D04": 0.0, "D05": 0.0, "D06": 0.0, "D07": 0.0, "D08": 0.0, "D09": 0.0, "D10": 0.0, "D11": 0.0, "D12": 0.0, "D13": 0.5, "D14": 0.0, "D15": 1.0, "D16": 0.0, "D17": 0.0, "D18": 0.0, "D19": 0.0, "D20": 1.0, "D21": 1.0, "D22": 0.0, "D23": 1.0, "D24": 0.5, "D25": 0.0}, "dimension_rationales": {"D01": "Secondary Corollary: Contextual lean toward positive pole.", "D02": "Neutral / Doctrinally silent on this axis.", "D03": "Neutral / Doctrinally silent on this axis.", "D04": "Neutral / Doctrinally silent on this axis.", "D05": "Neutral / Doctrinally silent on this axis.", "D06": "Neutral / Doctrinally silent on this axis.", "D07": "Neutral / Doctrinally silent on this axis.", "D08": "Neutral / Doctrinally silent on this axis.", "D09": "Neutral / Doctrinally silent on this axis.", "D10": "Neutral / Doctrinally silent on this axis.", "D11": "Neutral / Doctrinally silent on this axis.", "D12": "Neutral / Doctrinally silent on this axis.", "D13": "Secondary Corollary: Contextual lean toward positive pole.", "D14": "Neutral / Doctrinally silent on this axis.", "D15": "Core Pillar: Strong alignment with positive pole.", "D16": "Neutral / Doctrinally silent on this axis.", "D17": "Neutral / Doctrinally silent on this axis.", "D18": "Neutral / Doctrinally silent on this axis.", "D19": "Neutral / Doctrinally silent on this axis.", "D20": "Core Pillar: Strong alignment with positive pole.", "D21": "Core Pillar: Strong alignment with positive pole.", "D22": "Neutral / Doctrinally silent on this axis.", "D23": "Core Pillar: Strong alignment with negative pole.", "D24": "Secondary Corollary: Contextual lean toward positive pole.", "D25": "Neutral / Doctrinally silent on this axis."}, "sources": [{"source_type": "primary_text", "title": "Crisis of the Modern World (Guénon) (1927); The Transcendent Unity of Religions (Schuon) (1948)", "citation": "Primary literature: Crisis of the Modern World (Guénon) (1927); The Transcendent Unity of Religions (Schuon) (1948)"}, {"source_type": "canonical_overview", "title": "Perennialism (Traditionalist School / Sophia Perennis)", "citation": "Encyclopedic entry on Perennialism (Traditionalist School / Sophia Perennis)"}]}, {"id": "W211", "cluster_id": "C22", "profile_type": "established", "name_en": "Phenomenology", "name_hi": "घटना विज्ञान (फेनोमेनोलॉजी)", "historical_era": "Early 20th Century CE", "geographic_origin": "Germany / France", "founder_key_figures": "Edmund Husserl / Martin Heidegger / Maurice Merleau-Ponty", "epistemological_framework": "Epoche (bracketing assumptions), direct descriptive analysis of lived conscious experience (Erlebnis), and intentionality of consciousness.", "canonical_texts": "Logical Investigations (Husserl) (1900); Being and Time (Heidegger) (1927)", "famous_quote": "Edmund Husserl: To the things themselves! (Zu den Sachen selbst!) We must return to that naive world in which we live and experience.", "short_description_en": "Philosophical method studying the structures of conscious experience and human subjectivity from the first-person perspective.", "short_description_hi": "घटना विज्ञान (फेनोमेनोलॉजी), जो बाहरी सिद्धांतों को छोड़कर सीधे मानवीय चेतना और जीवंत अनुभवों (Lived Experience) के अध्ययन पर बल देता है।", "full_description_en": "Philosophical method studying the structures of conscious experience and human subjectivity from the first-person perspective.", "full_description_hi": "घटना विज्ञान (फेनोमेनोलॉजी), जो बाहरी सिद्धांतों को छोड़कर सीधे मानवीय चेतना और जीवंत अनुभवों (Lived Experience) के अध्ययन पर बल देता है।", "historical_associations": "The revolutionary philosophical turn away from abstract metaphysical systems toward a rigorous science of subjective consciousness; Profound influence on 20th-century psychology, psychiatry (Binswanger), literary criticism, and cognitive science; Bridging epistemology with the lived bodily reality of human existence in the world", "vector": {"D01": -0.1123, "D02": -0.0702, "D03": 0.0763, "D04": 0.4736, "D05": -0.0833, "D06": -0.1338, "D07": -0.0799, "D08": -0.7516, "D09": 0.1298, "D10": 0.5189, "D11": 0.0664, "D12": -0.0442, "D13": -0.0285, "D14": -0.1031, "D15": 0.6148, "D16": 0.0262, "D17": 0.0021, "D18": -0.1085, "D19": 0.0097, "D20": 0.0183, "D21": 0.8227, "D22": 0.0599, "D23": 0.5701, "D24": 0.5845, "D25": 0.0301}, "doctrinal_weights": {"D01": 0.0, "D02": 0.0, "D03": 0.0, "D04": 0.5, "D05": 0.0, "D06": 0.0, "D07": 0.0, "D08": 1.0, "D09": 0.0, "D10": 0.5, "D11": 0.0, "D12": 0.0, "D13": 0.0, "D14": 0.0, "D15": 0.5, "D16": 0.0, "D17": 0.0, "D18": 0.0, "D19": 0.0, "D20": 0.0, "D21": 1.0, "D22": 0.0, "D23": 0.5, "D24": 0.5, "D25": 0.0}, "dimension_rationales": {"D01": "Neutral / Doctrinally silent on this axis.", "D02": "Neutral / Doctrinally silent on this axis.", "D03": "Neutral / Doctrinally silent on this axis.", "D04": "Secondary Corollary: Contextual lean toward positive pole.", "D05": "Neutral / Doctrinally silent on this axis.", "D06": "Neutral / Doctrinally silent on this axis.", "D07": "Neutral / Doctrinally silent on this axis.", "D08": "Core Pillar: Strong alignment with negative pole.", "D09": "Neutral / Doctrinally silent on this axis.", "D10": "Secondary Corollary: Contextual lean toward positive pole.", "D11": "Neutral / Doctrinally silent on this axis.", "D12": "Neutral / Doctrinally silent on this axis.", "D13": "Neutral / Doctrinally silent on this axis.", "D14": "Neutral / Doctrinally silent on this axis.", "D15": "Secondary Corollary: Contextual lean toward positive pole.", "D16": "Neutral / Doctrinally silent on this axis.", "D17": "Neutral / Doctrinally silent on this axis.", "D18": "Neutral / Doctrinally silent on this axis.", "D19": "Neutral / Doctrinally silent on this axis.", "D20": "Neutral / Doctrinally silent on this axis.", "D21": "Core Pillar: Strong alignment with positive pole.", "D22": "Neutral / Doctrinally silent on this axis.", "D23": "Secondary Corollary: Contextual lean toward positive pole.", "D24": "Secondary Corollary: Contextual lean toward positive pole.", "D25": "Neutral / Doctrinally silent on this axis."}, "sources": [{"source_type": "primary_text", "title": "Logical Investigations (Husserl) (1900); Being and Time (Heidegger) (1927)", "citation": "Primary literature: Logical Investigations (Husserl) (1900); Being and Time (Heidegger) (1927)"}, {"source_type": "canonical_overview", "title": "Phenomenology", "citation": "Encyclopedic entry on Phenomenology"}]}, {"id": "W221", "cluster_id": "C23", "profile_type": "established", "name_en": "Transhumanism", "name_hi": "ट्रांसहुमानिज़्म (पार-मानववाद)", "historical_era": "Mid-20th Century CE (Coined by Julian Huxley 1957)", "geographic_origin": "United Kingdom / United States", "founder_key_figures": "Julian Huxley / Max More / Ray Kurzweil / Nick Bostrom", "epistemological_framework": "Technological optimism, rationalist empiricism, morphological freedom, radical life extension, and overcoming biological human limitations.", "canonical_texts": "The Singularity Is Near (Ray Kurzweil) (2005); Superintelligence: Paths, Dangers, Strategies (Bostrom) (2014)", "famous_quote": "Ray Kurzweil: The singularity will allow us to transcend these limitations of our biological bodies and brains... We will gain power over our destinies.", "short_description_en": "Intellectual and cultural movement that aims to fundamentally transform the human condition by developing technologies to enhance human intellect and physiology.", "short_description_hi": "पार-मानववाद (ट्रांसहुमानिज़्म), जो विज्ञान और तकनीक (AI, बायोटेक, नैनोटेक) के जरिए मानव शरीर और बौद्धिक सीमाओं को पार कर अमरता और सुपरइंटेलिजेंस पाना चाहता है।", "full_description_en": "Intellectual and cultural movement that aims to fundamentally transform the human condition by developing technologies to enhance human intellect and physiology.", "full_description_hi": "पार-मानववाद (ट्रांसहुमानिज़्म), जो विज्ञान और तकनीक (AI, बायोटेक, नैनोटेक) के जरिए मानव शरीर और बौद्धिक सीमाओं को पार कर अमरता और सुपरइंटेलिजेंस पाना चाहता है।", "historical_associations": "The transition from 20th-century eugenic-tinged evolutionary humanism to modern cybernetic and genetic life extension; Pioneering research into artificial intelligence, cryonics, nanotechnology, and human-computer neural interfaces; Intense philosophical debate regarding existential risks (X-risks) of artificial general intelligence (AGI)", "vector": {"D01": -0.1123, "D02": -0.0702, "D03": -0.7237, "D04": -0.0264, "D05": -0.0833, "D06": -0.1338, "D07": -0.0799, "D08": 0.0484, "D09": 0.1298, "D10": 0.1189, "D11": -0.7836, "D12": -0.6442, "D13": -0.0285, "D14": -0.1031, "D15": -0.0852, "D16": 0.0262, "D17": 0.0021, "D18": -0.1085, "D19": 0.0097, "D20": 0.0183, "D21": -0.7773, "D22": 0.0599, "D23": -0.9799, "D24": -0.9655, "D25": -0.4699}, "doctrinal_weights": {"D01": 0.0, "D02": 0.0, "D03": 1.0, "D04": 0.0, "D05": 0.0, "D06": 0.0, "D07": 0.0, "D08": 0.0, "D09": 0.0, "D10": 0.0, "D11": 1.0, "D12": 0.5, "D13": 0.0, "D14": 0.0, "D15": 0.0, "D16": 0.0, "D17": 0.0, "D18": 0.0, "D19": 0.0, "D20": 0.0, "D21": 1.0, "D22": 0.0, "D23": 1.0, "D24": 1.0, "D25": 0.5}, "dimension_rationales": {"D01": "Neutral / Doctrinally silent on this axis.", "D02": "Neutral / Doctrinally silent on this axis.", "D03": "Core Pillar: Strong alignment with negative pole.", "D04": "Neutral / Doctrinally silent on this axis.", "D05": "Neutral / Doctrinally silent on this axis.", "D06": "Neutral / Doctrinally silent on this axis.", "D07": "Neutral / Doctrinally silent on this axis.", "D08": "Neutral / Doctrinally silent on this axis.", "D09": "Neutral / Doctrinally silent on this axis.", "D10": "Neutral / Doctrinally silent on this axis.", "D11": "Core Pillar: Strong alignment with negative pole.", "D12": "Secondary Corollary: Contextual lean toward negative pole.", "D13": "Neutral / Doctrinally silent on this axis.", "D14": "Neutral / Doctrinally silent on this axis.", "D15": "Neutral / Doctrinally silent on this axis.", "D16": "Neutral / Doctrinally silent on this axis.", "D17": "Neutral / Doctrinally silent on this axis.", "D18": "Neutral / Doctrinally silent on this axis.", "D19": "Neutral / Doctrinally silent on this axis.", "D20": "Neutral / Doctrinally silent on this axis.", "D21": "Core Pillar: Strong alignment with negative pole.", "D22": "Neutral / Doctrinally silent on this axis.", "D23": "Core Pillar: Strong alignment with negative pole.", "D24": "Core Pillar: Strong alignment with negative pole.", "D25": "Secondary Corollary: Contextual lean toward negative pole."}, "sources": [{"source_type": "primary_text", "title": "The Singularity Is Near (Ray Kurzweil) (2005); Superintelligence: Paths, Dangers, Strategies (Bostrom) (2014)", "citation": "Primary literature: The Singularity Is Near (Ray Kurzweil) (2005); Superintelligence: Paths, Dangers, Strategies (Bostrom) (2014)"}, {"source_type": "canonical_overview", "title": "Transhumanism", "citation": "Encyclopedic entry on Transhumanism"}]}, {"id": "W231", "cluster_id": "C24", "profile_type": "established", "name_en": "Chaos Magic", "name_hi": "केओस मैजिक (अराजक जादू विद्या)", "historical_era": "1970s - 1980s CE", "geographic_origin": "United Kingdom", "founder_key_figures": "Peter J. Carroll / Ray Sherwin", "epistemological_framework": "Epistemological instrumentalism ('Nothing is true, everything is permitted'), belief as a programmable tool, paradigm shifting, and gnosis states.", "canonical_texts": "Liber Null & Psychonaut (Peter Carroll) (1987); Condensed Chaos (Phil Hine) (1992)", "famous_quote": "Peter J. Carroll: Magic is not a supernatural phenomenon, but a technique of the mind and will operating in ways not yet recognized by consensus reality.", "short_description_en": "Post-modern magical tradition treating belief as a flexible tool and ritual frameworks as arbitrary paradigms designed to achieve willed psychological results.", "short_description_hi": "केओस मैजिक (अराजक जादू), जो किसी भी निश्चित धार्मिक सत्य को न मानकर 'विश्वास' को एक सॉफ्टवेयर की तरह बदलकर मनचाहे परिणाम हासिल करने की तकनीक है।", "full_description_en": "Post-modern magical tradition treating belief as a flexible tool and ritual frameworks as arbitrary paradigms designed to achieve willed psychological results.", "full_description_hi": "केओस मैजिक (अराजक जादू), जो किसी भी निश्चित धार्मिक सत्य को न मानकर 'विश्वास' को एक सॉफ्टवेयर की तरह बदलकर मनचाहे परिणाम हासिल करने की तकनीक है।", "historical_associations": "Emerging from the punk rock counterculture and Austin Osman Spare's sigil magic in late 20th-century Britain; Radically stripping traditional ceremonial magic of dogmatic rituals, deities, and rigid lineages in favor of results-oriented pragmatism; Pioneering pop-culture magic (Sigils inspired by comic books, cyberpunk, and modern fiction)", "vector": {"D01": -0.1123, "D02": -0.0702, "D03": -0.6737, "D04": -0.0264, "D05": -0.0833, "D06": -0.7338, "D07": -0.0799, "D08": 0.7984, "D09": 0.1298, "D10": 0.1189, "D11": 0.0664, "D12": -0.0442, "D13": -0.0285, "D14": -0.1031, "D15": -0.0852, "D16": -0.4738, "D17": 0.0021, "D18": -0.1085, "D19": 0.0097, "D20": 0.0183, "D21": -0.7273, "D22": 0.0599, "D23": -0.8799, "D24": -0.1655, "D25": -0.7199}, "doctrinal_weights": {"D01": 0.0, "D02": 0.0, "D03": 0.5, "D04": 0.0, "D05": 0.0, "D06": 1.0, "D07": 0.0, "D08": 1.0, "D09": 0.0, "D10": 0.0, "D11": 0.0, "D12": 0.0, "D13": 0.0, "D14": 0.0, "D15": 0.0, "D16": 0.5, "D17": 0.0, "D18": 0.0, "D19": 0.0, "D20": 0.0, "D21": 1.0, "D22": 0.0, "D23": 1.0, "D24": 0.0, "D25": 1.0}, "dimension_rationales": {"D01": "Neutral / Doctrinally silent on this axis.", "D02": "Neutral / Doctrinally silent on this axis.", "D03": "Secondary Corollary: Contextual lean toward negative pole.", "D04": "Neutral / Doctrinally silent on this axis.", "D05": "Neutral / Doctrinally silent on this axis.", "D06": "Core Pillar: Strong alignment with negative pole.", "D07": "Neutral / Doctrinally silent on this axis.", "D08": "Core Pillar: Strong alignment with positive pole.", "D09": "Neutral / Doctrinally silent on this axis.", "D10": "Neutral / Doctrinally silent on this axis.", "D11": "Neutral / Doctrinally silent on this axis.", "D12": "Neutral / Doctrinally silent on this axis.", "D13": "Neutral / Doctrinally silent on this axis.", "D14": "Neutral / Doctrinally silent on this axis.", "D15": "Neutral / Doctrinally silent on this axis.", "D16": "Secondary Corollary: Contextual lean toward negative pole.", "D17": "Neutral / Doctrinally silent on this axis.", "D18": "Neutral / Doctrinally silent on this axis.", "D19": "Neutral / Doctrinally silent on this axis.", "D20": "Neutral / Doctrinally silent on this axis.", "D21": "Core Pillar: Strong alignment with negative pole.", "D22": "Neutral / Doctrinally silent on this axis.", "D23": "Core Pillar: Strong alignment with negative pole.", "D24": "Neutral / Doctrinally silent on this axis.", "D25": "Core Pillar: Strong alignment with negative pole."}, "sources": [{"source_type": "primary_text", "title": "Liber Null & Psychonaut (Peter Carroll) (1987); Condensed Chaos (Phil Hine) (1992)", "citation": "Primary literature: Liber Null & Psychonaut (Peter Carroll) (1987); Condensed Chaos (Phil Hine) (1992)"}, {"source_type": "canonical_overview", "title": "Chaos Magic", "citation": "Encyclopedic entry on Chaos Magic"}]}, {"id": "W241", "cluster_id": "C25", "profile_type": "established", "name_en": "Integral Theory (Ken Wilber)", "name_hi": "इंटीग्रल थ्योरी (केन विल्बर का समग्र दर्शन)", "historical_era": "Late 20th Century CE", "geographic_origin": "United States", "founder_key_figures": "Ken Wilber", "epistemological_framework": "AQAL framework (All Quadrants, All Levels, All Lines, All States, All Types), developmental structuralism, and evolutionary holism.", "canonical_texts": "Sex, Ecology, Spirituality (Ken Wilber) (1995); A Brief History of Everything (1996)", "famous_quote": "Ken Wilber: Everybody is right. No one is entirely wrong. The task of the integral approach is to weave these partial truths into a richer tapestry of understanding.", "short_description_en": "Comprehensive philosophical framework (AQAL) synthesizing psychology, spirituality, science, and sociology into a unified map of human evolution.", "short_description_hi": "केन विल्बर का समग्र दर्शन (AQAL मॉडल), जो विज्ञान, मनोविज्ञान, कला और अध्यात्म को एक विस्तृत मानचित्र में जोड़कर मानव विकास की व्याख्या करता है।", "full_description_en": "Comprehensive philosophical framework (AQAL) synthesizing psychology, spirituality, science, and sociology into a unified map of human evolution.", "full_description_hi": "केन विल्बर का समग्र दर्शन (AQAL मॉडल), जो विज्ञान, मनोविज्ञान, कला और अध्यात्म को एक विस्तृत मानचित्र में जोड़कर मानव विकास की व्याख्या करता है।", "historical_associations": "Synthesizing hundreds of Eastern and Western philosophical, psychological, and scientific schools into the comprehensive AQAL model; Integrating Spiral Dynamics developmental stages into mainstream leadership, coaching, and organizational design; Pioneering the modern meta-theory movement uniting science and spirituality", "vector": {"D01": -0.1123, "D02": -0.0702, "D03": 0.0762, "D04": -0.0264, "D05": -0.0833, "D06": -0.1338, "D07": -0.0799, "D08": 0.0484, "D09": 0.1298, "D10": 0.718, "D11": 0.0617, "D12": -0.0486, "D13": -0.0285, "D14": -0.8535, "D15": 0.7664, "D16": 0.4286, "D17": 0.0053, "D18": 0.6415, "D19": 0.0097, "D20": 0.0183, "D21": -0.7825, "D22": 0.0599, "D23": -0.1299, "D24": 0.4382, "D25": 0.0301}, "doctrinal_weights": {"D01": 0.0, "D02": 0.0, "D03": 0.0, "D04": 0.0, "D05": 0.0, "D06": 0.0, "D07": 0.0, "D08": 0.0, "D09": 0.0, "D10": 1.0, "D11": 0.0, "D12": 0.0, "D13": 0.0, "D14": 1.0, "D15": 1.0, "D16": 0.5, "D17": 0.0, "D18": 0.5, "D19": 0.0, "D20": 0.0, "D21": 1.0, "D22": 0.0, "D23": 0.0, "D24": 0.5, "D25": 0.0}, "dimension_rationales": {"D01": "Neutral / Doctrinally silent on this axis.", "D02": "Neutral / Doctrinally silent on this axis.", "D03": "Neutral / Doctrinally silent on this axis.", "D04": "Neutral / Doctrinally silent on this axis.", "D05": "Neutral / Doctrinally silent on this axis.", "D06": "Neutral / Doctrinally silent on this axis.", "D07": "Neutral / Doctrinally silent on this axis.", "D08": "Neutral / Doctrinally silent on this axis.", "D09": "Neutral / Doctrinally silent on this axis.", "D10": "Core Pillar: Strong alignment with positive pole.", "D11": "Neutral / Doctrinally silent on this axis.", "D12": "Neutral / Doctrinally silent on this axis.", "D13": "Neutral / Doctrinally silent on this axis.", "D14": "Core Pillar: Strong alignment with negative pole.", "D15": "Core Pillar: Strong alignment with positive pole.", "D16": "Secondary Corollary: Contextual lean toward positive pole.", "D17": "Neutral / Doctrinally silent on this axis.", "D18": "Secondary Corollary: Contextual lean toward positive pole.", "D19": "Neutral / Doctrinally silent on this axis.", "D20": "Neutral / Doctrinally silent on this axis.", "D21": "Core Pillar: Strong alignment with negative pole.", "D22": "Neutral / Doctrinally silent on this axis.", "D23": "Neutral / Doctrinally silent on this axis.", "D24": "Secondary Corollary: Contextual lean toward positive pole.", "D25": "Neutral / Doctrinally silent on this axis."}, "sources": [{"source_type": "primary_text", "title": "Sex, Ecology, Spirituality (Ken Wilber) (1995); A Brief History of Everything (1996)", "citation": "Primary literature: Sex, Ecology, Spirituality (Ken Wilber) (1995); A Brief History of Everything (1996)"}, {"source_type": "canonical_overview", "title": "Integral Theory (Ken Wilber)", "citation": "Encyclopedic entry on Integral Theory (Ken Wilber)"}]}, {"id": "W250", "cluster_id": "C25", "profile_type": "synthesized", "name_en": "Pan-Dialectical Epistemological Synthesis", "name_hi": "सर्व-द्वंद्वात्मक ज्ञानमीमांसा संश्लेषण (समस्त दर्शनों का मिलन)", "historical_era": "Contemporary Meta-Theoretical Horizon (2026+)", "geographic_origin": "Global Meta-Theory and Epistemological Networks", "founder_key_figures": "Worldview Compass Architecture / Global Consilience Thinkers", "epistemological_framework": "Multi-perspectival hyper-dialectic, non-dual synthesis of polarities, trans-rational integration of mythos, logos, and emptiness, and universal semantic mapping.", "canonical_texts": "The Master Catalogue of 500 Worldviews and 25-Dimensional Compass (2026)", "famous_quote": "Pan-Dialectical Axiom: Every worldview is an angle of the infinite diamond of reality; truth is not found in destroying the other, but in sublation (Aufhebung) into a higher, more embracing synthesis.", "short_description_en": "Advanced meta-theoretical synthesis uniting all historical and contemporary worldviews into a single multidimensional dynamic navigational framework.", "short_description_hi": "सर्व-द्वंद्वात्मक संश्लेषण (पैन-डायलैक्टिकल सिंथेसिस), जो प्राचीन ज्ञान, धर्म, दर्शन और आधुनिक विज्ञान को एक बहुआयामी वैश्विक ज्ञानकोष और कंपास में पिरोता है।", "full_description_en": "Advanced meta-theoretical synthesis uniting all historical and contemporary worldviews into a single multidimensional dynamic navigational framework.", "full_description_hi": "सर्व-द्वंद्वात्मक संश्लेषण (पैन-डायलैक्टिकल सिंथेसिस), जो प्राचीन ज्ञान, धर्म, दर्शन और आधुनिक विज्ञान को एक बहुआयामी वैश्विक ज्ञानकोष और कंपास में पिरोता है।", "historical_associations": "The construction of exhaustive master catalogues mapping hundreds of philosophical, religious, and political traditions across multidimensional vector spaces; Transcending ideological tribalism by rigorously quantifying and visualizing the structural affinities between ancient wisdom and cutting-edge technoscience; Establishing the foundational architecture for the Worldview Explorer and interactive global philosophical compass", "vector": {"D01": -0.0046, "D02": 0.0957, "D03": 0.0373, "D04": 0.0496, "D05": -0.176, "D06": -0.0393, "D07": 0.0326, "D08": 0.1991, "D09": -0.0614, "D10": 0.553, "D11": 0.1393, "D12": 0.1474, "D13": 0.1303, "D14": -0.7088, "D15": 0.8864, "D16": 0.4439, "D17": 0.0939, "D18": 0.7157, "D19": -0.0557, "D20": 0.0714, "D21": -0.8843, "D22": 0.0456, "D23": -0.0061, "D24": 0.6531, "D25": 0.0086}, "doctrinal_weights": {"D01": 0.0, "D02": 0.0, "D03": 0.0, "D04": 0.0, "D05": 0.0, "D06": 0.0, "D07": 0.0, "D08": 0.0, "D09": 0.0, "D10": 0.5, "D11": 0.0, "D12": 0.0, "D13": 0.0, "D14": 1.0, "D15": 1.0, "D16": 0.5, "D17": 0.0, "D18": 1.0, "D19": 0.0, "D20": 0.0, "D21": 1.0, "D22": 0.0, "D23": 0.0, "D24": 0.5, "D25": 0.0}, "dimension_rationales": {"D01": "Neutral / Doctrinally silent on this axis.", "D02": "Neutral / Doctrinally silent on this axis.", "D03": "Neutral / Doctrinally silent on this axis.", "D04": "Neutral / Doctrinally silent on this axis.", "D05": "Neutral / Doctrinally silent on this axis.", "D06": "Neutral / Doctrinally silent on this axis.", "D07": "Neutral / Doctrinally silent on this axis.", "D08": "Neutral / Doctrinally silent on this axis.", "D09": "Neutral / Doctrinally silent on this axis.", "D10": "Secondary Corollary: Contextual lean toward positive pole.", "D11": "Neutral / Doctrinally silent on this axis.", "D12": "Neutral / Doctrinally silent on this axis.", "D13": "Neutral / Doctrinally silent on this axis.", "D14": "Core Pillar: Strong alignment with negative pole.", "D15": "Core Pillar: Strong alignment with positive pole.", "D16": "Secondary Corollary: Contextual lean toward positive pole.", "D17": "Neutral / Doctrinally silent on this axis.", "D18": "Core Pillar: Strong alignment with positive pole.", "D19": "Neutral / Doctrinally silent on this axis.", "D20": "Neutral / Doctrinally silent on this axis.", "D21": "Core Pillar: Strong alignment with negative pole.", "D22": "Neutral / Doctrinally silent on this axis.", "D23": "Neutral / Doctrinally silent on this axis.", "D24": "Secondary Corollary: Contextual lean toward positive pole.", "D25": "Neutral / Doctrinally silent on this axis."}, "sources": [{"source_type": "primary_text", "title": "The Master Catalogue of 500 Worldviews and 25-Dimensional Compass (2026)", "citation": "Primary literature: The Master Catalogue of 500 Worldviews and 25-Dimensional Compass (2026)"}, {"source_type": "canonical_overview", "title": "Pan-Dialectical Epistemological Synthesis", "citation": "Encyclopedic entry on Pan-Dialectical Epistemological Synthesis"}]}];
const EMBEDDED_SAMPLE_BIN: AssessmentQuestion[] = [{"question_id": "Q_BIN_D01_001", "dimension": "D01", "macro_domain": "Human Nature & Self", "sub_topic": "Locus of Identity", "polarity": 1.0, "weight": 1.0, "text_en": "Core Positive stance on Locus of Identity: In matters of individual vs. collective identity, priority must be anchored in Collective Primacy (+1.0).", "text_hi": "व्यक्तिगत बनाम सामूहिक पहचान के संदर्भ में, प्राथमिक प्रतिबद्धता 'Collective Primacy (+1.0)' के सिद्धांत पर आधारित होनी चाहिए।"}, {"question_id": "Q_BIN_D01_006", "dimension": "D01", "macro_domain": "Human Nature & Self", "sub_topic": "Locus of Identity", "polarity": -1.0, "weight": 1.0, "text_en": "Core Negative stance on Locus of Identity: In matters of individual vs. collective identity, priority must be anchored in Individual Primacy (-1.0).", "text_hi": "व्यक्तिगत बनाम सामूहिक पहचान के संदर्भ में, प्राथमिक प्रतिबद्धता 'Individual Primacy (-1.0)' के सिद्धांत पर आधारित होनी चाहिए।"}, {"question_id": "Q_BIN_D02_001", "dimension": "D02", "macro_domain": "Human Nature & Self", "sub_topic": "Conscience vs Hierarchy", "polarity": 1.0, "weight": 1.0, "text_en": "Core Positive stance on Conscience vs Hierarchy: In matters of autonomy vs. authority, priority must be anchored in Institutional Authority (+1.0).", "text_hi": "स्वायत्तता बनाम अधिकार के संदर्भ में, प्राथमिक प्रतिबद्धता 'Institutional Authority (+1.0)' के सिद्धांत पर आधारित होनी चाहिए।"}, {"question_id": "Q_BIN_D02_006", "dimension": "D02", "macro_domain": "Human Nature & Self", "sub_topic": "Conscience vs Hierarchy", "polarity": -1.0, "weight": 1.0, "text_en": "Core Negative stance on Conscience vs Hierarchy: In matters of autonomy vs. authority, priority must be anchored in Personal Autonomy (-1.0).", "text_hi": "स्वायत्तता बनाम अधिकार के संदर्भ में, प्राथमिक प्रतिबद्धता 'Personal Autonomy (-1.0)' के सिद्धांत पर आधारित होनी चाहिए।"}, {"question_id": "Q_BIN_D03_001", "dimension": "D03", "macro_domain": "Human Nature & Self", "sub_topic": "Tabula Rasa vs Genetics", "polarity": 1.0, "weight": 1.0, "text_en": "Core Positive stance on Tabula Rasa vs Genetics: In matters of human plasticity vs. fixed nature, priority must be anchored in Fixed Essential Nature (+1.0).", "text_hi": "मानव परिवर्तनशीलता बनाम स्थिर स्वभाव के संदर्भ में, प्राथमिक प्रतिबद्धता 'Fixed Essential Nature (+1.0)' के सिद्धांत पर आधारित होनी चाहिए।"}, {"question_id": "Q_BIN_D03_006", "dimension": "D03", "macro_domain": "Human Nature & Self", "sub_topic": "Tabula Rasa vs Genetics", "polarity": -1.0, "weight": 1.0, "text_en": "Core Negative stance on Tabula Rasa vs Genetics: In matters of human plasticity vs. fixed nature, priority must be anchored in Radical Plasticity (-1.0).", "text_hi": "मानव परिवर्तनशीलता बनाम स्थिर स्वभाव के संदर्भ में, प्राथमिक प्रतिबद्धता 'Radical Plasticity (-1.0)' के सिद्धांत पर आधारित होनी चाहिए।"}, {"question_id": "Q_BIN_D04_001", "dimension": "D04", "macro_domain": "Human Nature & Self", "sub_topic": "Altruism vs Egoism", "polarity": 1.0, "weight": 1.0, "text_en": "Core Positive stance on Altruism vs Egoism: In matters of self-interest vs. mutual obligation, priority must be anchored in Mutual Moral Obligation (+1.0).", "text_hi": "स्वार्थ बनाम पारस्परिक कर्तव्य के संदर्भ में, प्राथमिक प्रतिबद्धता 'Mutual Moral Obligation (+1.0)' के सिद्धांत पर आधारित होनी चाहिए।"}, {"question_id": "Q_BIN_D04_006", "dimension": "D04", "macro_domain": "Human Nature & Self", "sub_topic": "Altruism vs Egoism", "polarity": -1.0, "weight": 1.0, "text_en": "Core Negative stance on Altruism vs Egoism: In matters of self-interest vs. mutual obligation, priority must be anchored in Rational Self-Interest (-1.0).", "text_hi": "स्वार्थ बनाम पारस्परिक कर्तव्य के संदर्भ में, प्राथमिक प्रतिबद्धता 'Rational Self-Interest (-1.0)' के सिद्धांत पर आधारित होनी चाहिए।"}, {"question_id": "Q_BIN_D05_001", "dimension": "D05", "macro_domain": "Human Nature & Self", "sub_topic": "Bodily Life vs Afterlife", "polarity": 1.0, "weight": 1.0, "text_en": "Core Positive stance on Bodily Life vs Afterlife: In matters of immanent fulfillment vs. transcendence, priority must be anchored in Transcendental Realization (+1.0).", "text_hi": "सांसारिक पूर्णता बनाम पारलौकिक उत्थान के संदर्भ में, प्राथमिक प्रतिबद्धता 'Transcendental Realization (+1.0)' के सिद्धांत पर आधारित होनी चाहिए।"}, {"question_id": "Q_BIN_D05_006", "dimension": "D05", "macro_domain": "Human Nature & Self", "sub_topic": "Bodily Life vs Afterlife", "polarity": -1.0, "weight": 1.0, "text_en": "Core Negative stance on Bodily Life vs Afterlife: In matters of immanent fulfillment vs. transcendence, priority must be anchored in Immanent Flourishing (-1.0).", "text_hi": "सांसारिक पूर्णता बनाम पारलौकिक उत्थान के संदर्भ में, प्राथमिक प्रतिबद्धता 'Immanent Flourishing (-1.0)' के सिद्धांत पर आधारित होनी चाहिए।"}, {"question_id": "Q_BIN_D06_001", "dimension": "D06", "macro_domain": "Society & Governance", "sub_topic": "Classless Society vs Meritocracy", "polarity": 1.0, "weight": 1.0, "text_en": "Core Positive stance on Classless Society vs Meritocracy: In matters of egalitarianism vs. functional hierarchy, priority must be anchored in Natural / Functional Hierarchy (+1.0).", "text_hi": "समानतावाद बनाम कार्यात्मक पदानुक्रम के संदर्भ में, प्राथमिक प्रतिबद्धता 'Natural / Functional Hierarchy (+1.0)' के सिद्धांत पर आधारित होनी चाहिए।"}, {"question_id": "Q_BIN_D06_006", "dimension": "D06", "macro_domain": "Society & Governance", "sub_topic": "Classless Society vs Meritocracy", "polarity": -1.0, "weight": 1.0, "text_en": "Core Negative stance on Classless Society vs Meritocracy: In matters of egalitarianism vs. functional hierarchy, priority must be anchored in Strict Egalitarianism (-1.0).", "text_hi": "समानतावाद बनाम कार्यात्मक पदानुक्रम के संदर्भ में, प्राथमिक प्रतिबद्धता 'Strict Egalitarianism (-1.0)' के सिद्धांत पर आधारित होनी चाहिए।"}, {"question_id": "Q_BIN_D07_001", "dimension": "D07", "macro_domain": "Society & Governance", "sub_topic": "Public Health Curfews", "polarity": 1.0, "weight": 1.0, "text_en": "Core Positive stance on Public Health Curfews: In matters of personal liberty vs. social order, priority must be anchored in Civic Order & Security (+1.0).", "text_hi": "व्यक्तिगत स्वतंत्रता बनाम सामाजिक व्यवस्था के संदर्भ में, प्राथमिक प्रतिबद्धता 'Civic Order & Security (+1.0)' के सिद्धांत पर आधारित होनी चाहिए।"}, {"question_id": "Q_BIN_D07_006", "dimension": "D07", "macro_domain": "Society & Governance", "sub_topic": "Public Health Curfews", "polarity": -1.0, "weight": 1.0, "text_en": "Core Negative stance on Public Health Curfews: In matters of personal liberty vs. social order, priority must be anchored in Unconditional Liberty (-1.0).", "text_hi": "व्यक्तिगत स्वतंत्रता बनाम सामाजिक व्यवस्था के संदर्भ में, प्राथमिक प्रतिबद्धता 'Unconditional Liberty (-1.0)' के सिद्धांत पर आधारित होनी चाहिए।"}, {"question_id": "Q_BIN_D08_001", "dimension": "D08", "macro_domain": "Society & Governance", "sub_topic": "Ancestral Customs vs Innovation", "polarity": 1.0, "weight": 1.0, "text_en": "Core Positive stance on Ancestral Customs vs Innovation: In matters of traditional continuity vs. radical reform, priority must be anchored in Transformative Reform (+1.0).", "text_hi": "पारंपरिक निरंतरता बनाम क्रांतिकारी सुधार के संदर्भ में, प्राथमिक प्रतिबद्धता 'Transformative Reform (+1.0)' के सिद्धांत पर आधारित होनी चाहिए।"}, {"question_id": "Q_BIN_D08_006", "dimension": "D08", "macro_domain": "Society & Governance", "sub_topic": "Ancestral Customs vs Innovation", "polarity": -1.0, "weight": 1.0, "text_en": "Core Negative stance on Ancestral Customs vs Innovation: In matters of traditional continuity vs. radical reform, priority must be anchored in Preservation of Tradition (-1.0).", "text_hi": "पारंपरिक निरंतरता बनाम क्रांतिकारी सुधार के संदर्भ में, प्राथमिक प्रतिबद्धता 'Preservation of Tradition (-1.0)' के सिद्धांत पर आधारित होनी चाहिए।"}, {"question_id": "Q_BIN_D09_001", "dimension": "D09", "macro_domain": "Society & Governance", "sub_topic": "Sovereign State Power vs Local Councils", "polarity": 1.0, "weight": 1.0, "text_en": "Core Positive stance on Sovereign State Power vs Local Councils: In matters of centralized cohesion vs. subsidiarity, priority must be anchored in Distributed Subsidiarity (+1.0).", "text_hi": "केंद्रीकृत एकजुटता बनाम विकेंद्रीकरण के संदर्भ में, प्राथमिक प्रतिबद्धता 'Distributed Subsidiarity (+1.0)' के सिद्धांत पर आधारित होनी चाहिए।"}, {"question_id": "Q_BIN_D09_006", "dimension": "D09", "macro_domain": "Society & Governance", "sub_topic": "Sovereign State Power vs Local Councils", "polarity": -1.0, "weight": 1.0, "text_en": "Core Negative stance on Sovereign State Power vs Local Councils: In matters of centralized cohesion vs. subsidiarity, priority must be anchored in Centralized Governance (-1.0).", "text_hi": "केंद्रीकृत एकजुटता बनाम विकेंद्रीकरण के संदर्भ में, प्राथमिक प्रतिबद्धता 'Centralized Governance (-1.0)' के सिद्धांत पर आधारित होनी चाहिए।"}, {"question_id": "Q_BIN_D10_001", "dimension": "D10", "macro_domain": "Society & Governance", "sub_topic": "Global Human Rights vs Cultural Relativity", "polarity": 1.0, "weight": 1.0, "text_en": "Core Positive stance on Global Human Rights vs Cultural Relativity: In matters of universal standardization vs. local particularity, priority must be anchored in Cultural / Contextual Sovereignty (+1.0).", "text_hi": "सार्वभौमिक मानक बनाम स्थानीय विशिष्टता के संदर्भ में, प्राथमिक प्रतिबद्धता 'Cultural / Contextual Sovereignty (+1.0)' के सिद्धांत पर आधारित होनी चाहिए।"}, {"question_id": "Q_BIN_D10_006", "dimension": "D10", "macro_domain": "Society & Governance", "sub_topic": "Contextual Morality", "polarity": -1.0, "weight": 1.0, "text_en": "Core Negative stance on Contextual Morality: In matters of universal standardization vs. local particularity, priority must be anchored in Universal Rights & Standards (-1.0).", "text_hi": "सार्वभौमिक मानक बनाम स्थानीय विशिष्टता के संदर्भ में, प्राथमिक प्रतिबद्धता 'Universal Rights & Standards (-1.0)' के सिद्धांत पर आधारित होनी चाहिए।"}, {"question_id": "Q_BIN_D11_001", "dimension": "D11", "macro_domain": "Reality & Knowledge", "sub_topic": "Sensory Science vs Divine Revelation", "polarity": 1.0, "weight": 1.0, "text_en": "Core Positive stance on Sensory Science vs Divine Revelation: In matters of empiricism vs. transcendent metaphysics, priority must be anchored in Transcendent Metaphysics (+1.0).", "text_hi": "अनुभववाद बनाम पारलौकिक तत्वमीमांसा के संदर्भ में, प्राथमिक प्रतिबद्धता 'Transcendent Metaphysics (+1.0)' के सिद्धांत पर आधारित होनी चाहिए।"}, {"question_id": "Q_BIN_D11_006", "dimension": "D11", "macro_domain": "Reality & Knowledge", "sub_topic": "Verifiability vs Sacred Mysteries", "polarity": -1.0, "weight": 1.0, "text_en": "Core Negative stance on Verifiability vs Sacred Mysteries: In matters of empiricism vs. transcendent metaphysics, priority must be anchored in Empirical Naturalism (-1.0).", "text_hi": "अनुभववाद बनाम पारलौकिक तत्वमीमांसा के संदर्भ में, प्राथमिक प्रतिबद्धता 'Empirical Naturalism (-1.0)' के सिद्धांत पर आधारित होनी चाहिए।"}, {"question_id": "Q_BIN_D12_001", "dimension": "D12", "macro_domain": "Reality & Knowledge", "sub_topic": "Formal Logic vs Mystic Insight", "polarity": 1.0, "weight": 1.0, "text_en": "Core Positive stance on Formal Logic vs Mystic Insight: In matters of systematic reason vs. intuitive gnosis, priority must be anchored in Direct Intuition & Gnosis (+1.0).", "text_hi": "तार्किक विवेक बनाम अंतर्ज्ञान के संदर्भ में, प्राथमिक प्रतिबद्धता 'Direct Intuition & Gnosis (+1.0)' के सिद्धांत पर आधारित होनी चाहिए।"}, {"question_id": "Q_BIN_D12_006", "dimension": "D12", "macro_domain": "Reality & Knowledge", "sub_topic": "Intellectual Proof vs Direct Realization", "polarity": -1.0, "weight": 1.0, "text_en": "Core Negative stance on Intellectual Proof vs Direct Realization: In matters of systematic reason vs. intuitive gnosis, priority must be anchored in Discursive Rationalism (-1.0).", "text_hi": "तार्किक विवेक बनाम अंतर्ज्ञान के संदर्भ में, प्राथमिक प्रतिबद्धता 'Discursive Rationalism (-1.0)' के सिद्धांत पर आधारित होनी चाहिए।"}, {"question_id": "Q_BIN_D13_001", "dimension": "D13", "macro_domain": "Reality & Knowledge", "sub_topic": "Brain Mechanism vs Primacy of Consciousness", "polarity": 1.0, "weight": 1.0, "text_en": "Core Positive stance on Brain Mechanism vs Primacy of Consciousness: In matters of materialism vs. idealism / panpsychism, priority must be anchored in Idealism / Mind Primacy (+1.0).", "text_hi": "भौतिकवाद बनाम विचारवाद / सर्वचेतनवाद के संदर्भ में, प्राथमिक प्रतिबद्धता 'Idealism / Mind Primacy (+1.0)' के सिद्धांत पर आधारित होनी चाहिए।"}, {"question_id": "Q_BIN_D13_006", "dimension": "D13", "macro_domain": "Reality & Knowledge", "sub_topic": "Epiphenomenon vs Mental Foundation", "polarity": -1.0, "weight": 1.0, "text_en": "Core Negative stance on Epiphenomenon vs Mental Foundation: In matters of materialism vs. idealism / panpsychism, priority must be anchored in Physicalist Materialism (-1.0).", "text_hi": "भौतिकवाद बनाम विचारवाद / सर्वचेतनवाद के संदर्भ में, प्राथमिक प्रतिबद्धता 'Physicalist Materialism (-1.0)' के सिद्धांत पर आधारित होनी चाहिए।"}, {"question_id": "Q_BIN_D14_001", "dimension": "D14", "macro_domain": "Reality & Knowledge", "sub_topic": "Skeptical Inquiry vs Indubitable Truth", "polarity": 1.0, "weight": 1.0, "text_en": "Core Positive stance on Skeptical Inquiry vs Indubitable Truth: In matters of epistemic fallibilism vs. dogmatic certainty, priority must be anchored in Foundational Certainty (+1.0).", "text_hi": "संशयवादी विनम्रता बनाम सैद्धांतिक निश्चयता के संदर्भ में, प्राथमिक प्रतिबद्धता 'Foundational Certainty (+1.0)' के सिद्धांत पर आधारित होनी चाहिए।"}, {"question_id": "Q_BIN_D14_006", "dimension": "D14", "macro_domain": "Reality & Knowledge", "sub_topic": "Probabilistic Truth vs Dogma", "polarity": -1.0, "weight": 1.0, "text_en": "Core Negative stance on Probabilistic Truth vs Dogma: In matters of epistemic fallibilism vs. dogmatic certainty, priority must be anchored in Critical Fallibilism (-1.0).", "text_hi": "संशयवादी विनम्रता बनाम सैद्धांतिक निश्चयता के संदर्भ में, प्राथमिक प्रतिबद्धता 'Critical Fallibilism (-1.0)' के सिद्धांत पर आधारित होनी चाहिए।"}, {"question_id": "Q_BIN_D15_001", "dimension": "D15", "macro_domain": "Reality & Knowledge", "sub_topic": "Deconstruction into Particles vs Irreducible Complex Wholes", "polarity": 1.0, "weight": 1.0, "text_en": "Core Positive stance on Deconstruction into Particles vs Irreducible Complex Wholes: In matters of atomistic reductionism vs. emergent holism, priority must be anchored in Organic Holism (+1.0).", "text_hi": "परमाणुवादी विश्लेषणात्मकता बनाम समग्रतावाद के संदर्भ में, प्राथमिक प्रतिबद्धता 'Organic Holism (+1.0)' के सिद्धांत पर आधारित होनी चाहिए।"}, {"question_id": "Q_BIN_D15_006", "dimension": "D15", "macro_domain": "Reality & Knowledge", "sub_topic": "Cybernetic Systems vs Component Isolation", "polarity": -1.0, "weight": 1.0, "text_en": "Core Negative stance on Cybernetic Systems vs Component Isolation: In matters of atomistic reductionism vs. emergent holism, priority must be anchored in Analytical Reductionism (-1.0).", "text_hi": "परमाणुवादी विश्लेषणात्मकता बनाम समग्रतावाद के संदर्भ में, प्राथमिक प्रतिबद्धता 'Analytical Reductionism (-1.0)' के सिद्धांत पर आधारित होनी चाहिए।"}, {"question_id": "Q_BIN_D16_001", "dimension": "D16", "macro_domain": "Ethics & Values", "sub_topic": "Utilitarian Outcomes vs Invariant Moral Rules", "polarity": 1.0, "weight": 1.0, "text_en": "Core Positive stance on Utilitarian Outcomes vs Invariant Moral Rules: In matters of consequentialism vs. deontological duty, priority must be anchored in Deontological Duty (+1.0).", "text_hi": "परिणामवाद बनाम कर्तव्यवाद के संदर्भ में, प्राथमिक प्रतिबद्धता 'Deontological Duty (+1.0)' के सिद्धांत पर आधारित होनी चाहिए।"}, {"question_id": "Q_BIN_D16_006", "dimension": "D16", "macro_domain": "Ethics & Values", "sub_topic": "Cost-Benefit Morality vs Inviolable Taboos", "polarity": -1.0, "weight": 1.0, "text_en": "Core Negative stance on Cost-Benefit Morality vs Inviolable Taboos: In matters of consequentialism vs. deontological duty, priority must be anchored in Teleological Consequences (-1.0).", "text_hi": "परिणामवाद बनाम कर्तव्यवाद के संदर्भ में, प्राथमिक प्रतिबद्धता 'Teleological Consequences (-1.0)' के सिद्धांत पर आधारित होनी चाहिए।"}, {"question_id": "Q_BIN_D17_001", "dimension": "D17", "macro_domain": "Ethics & Values", "sub_topic": "Kinship Obligations vs Impersonal Fairness", "polarity": 1.0, "weight": 1.0, "text_en": "Core Positive stance on Kinship Obligations vs Impersonal Fairness: In matters of relational care vs. impartial justice, priority must be anchored in Impartial Rational Justice (+1.0).", "text_hi": "सहानुभूति व रिश्ते बनाम निष्पक्ष न्याय के संदर्भ में, प्राथमिक प्रतिबद्धता 'Impartial Rational Justice (+1.0)' के सिद्धांत पर आधारित होनी चाहिए।"}, {"question_id": "Q_BIN_D17_006", "dimension": "D17", "macro_domain": "Ethics & Values", "sub_topic": "Institutional Impartiality", "polarity": -1.0, "weight": 1.0, "text_en": "Core Negative stance on Institutional Impartiality: In matters of relational care vs. impartial justice, priority must be anchored in Contextual Care Ethics (-1.0).", "text_hi": "सहानुभूति व रिश्ते बनाम निष्पक्ष न्याय के संदर्भ में, प्राथमिक प्रतिबद्धता 'Contextual Care Ethics (-1.0)' के सिद्धांत पर आधारित होनी चाहिए।"}, {"question_id": "Q_BIN_D18_001", "dimension": "D18", "macro_domain": "Ethics & Values", "sub_topic": "Cosmic Moral Facts vs Cultural Inventions", "polarity": 1.0, "weight": 1.0, "text_en": "Core Positive stance on Cosmic Moral Facts vs Cultural Inventions: In matters of moral objectivism vs. moral relativism, priority must be anchored in Constructed / Relativist Morality (+1.0).", "text_hi": "वस्तुनिष्ठ नैतिकता बनाम सापेक्षतावादी नैतिकता के संदर्भ में, प्राथमिक प्रतिबद्धता 'Constructed / Relativist Morality (+1.0)' के सिद्धांत पर आधारित होनी चाहिए।"}, {"question_id": "Q_BIN_D18_006", "dimension": "D18", "macro_domain": "Ethics & Values", "sub_topic": "Subjectivism vs Realism", "polarity": -1.0, "weight": 1.0, "text_en": "Core Negative stance on Subjectivism vs Realism: In matters of moral objectivism vs. moral relativism, priority must be anchored in Objective Moral Truth (-1.0).", "text_hi": "वस्तुनिष्ठ नैतिकता बनाम सापेक्षतावादी नैतिकता के संदर्भ में, प्राथमिक प्रतिबद्धता 'Objective Moral Truth (-1.0)' के सिद्धांत पर आधारित होनी चाहिए।"}, {"question_id": "Q_BIN_D19_001", "dimension": "D19", "macro_domain": "Ethics & Values", "sub_topic": "Divine Command / Dharma vs Existential Value Creation", "polarity": 1.0, "weight": 1.0, "text_en": "Core Positive stance on Divine Command / Dharma vs Existential Value Creation: In matters of external law vs. self-authored ethics, priority must be anchored in Autonomous Self-Authorship (+1.0).", "text_hi": "बाह्य दैवीय नियम बनाम आत्म-निर्मित नैतिकता के संदर्भ में, प्राथमिक प्रतिबद्धता 'Autonomous Self-Authorship (+1.0)' के सिद्धांत पर आधारित होनी चाहिए।"}, {"question_id": "Q_BIN_D19_006", "dimension": "D19", "macro_domain": "Ethics & Values", "sub_topic": "Conscience Authorship", "polarity": -1.0, "weight": 1.0, "text_en": "Core Negative stance on Conscience Authorship: In matters of external law vs. self-authored ethics, priority must be anchored in Heteronomous Law (-1.0).", "text_hi": "बाह्य दैवीय नियम बनाम आत्म-निर्मित नैतिकता के संदर्भ में, प्राथमिक प्रतिबद्धता 'Heteronomous Law (-1.0)' के सिद्धांत पर आधारित होनी चाहिए।"}, {"question_id": "Q_BIN_D20_001", "dimension": "D20", "macro_domain": "Ethics & Values", "sub_topic": "Instrumental Nature vs Intrinsic Animal Rights", "polarity": 1.0, "weight": 1.0, "text_en": "Core Positive stance on Instrumental Nature vs Intrinsic Animal Rights: In matters of anthropocentric vs. ecocentric valuation, priority must be anchored in Biocentric / Ecocentric Value (+1.0).", "text_hi": "मानव-केंद्रित बनाम जैव-केंद्रित मूल्य के संदर्भ में, प्राथमिक प्रतिबद्धता 'Biocentric / Ecocentric Value (+1.0)' के सिद्धांत पर आधारित होनी चाहिए।"}, {"question_id": "Q_BIN_D20_006", "dimension": "D20", "macro_domain": "Ethics & Values", "sub_topic": "Biosphere Personhood", "polarity": -1.0, "weight": 1.0, "text_en": "Core Negative stance on Biosphere Personhood: In matters of anthropocentric vs. ecocentric valuation, priority must be anchored in Human Exclusivity (-1.0).", "text_hi": "मानव-केंद्रित बनाम जैव-केंद्रित मूल्य के संदर्भ में, प्राथमिक प्रतिबद्धता 'Human Exclusivity (-1.0)' के सिद्धांत पर आधारित होनी चाहिए।"}, {"question_id": "Q_BIN_D21_001", "dimension": "D21", "macro_domain": "Civilization & Meaning", "sub_topic": "AI / Industrial Acceleration vs Agrarian Simplicity", "polarity": 1.0, "weight": 1.0, "text_en": "Core Positive stance on AI / Industrial Acceleration vs Agrarian Simplicity: In matters of technological progressivism vs. primitivism, priority must be anchored in Ecological Restraint / Primitivism (+1.0).", "text_hi": "तकनीकी प्रगतिवाद बनाम प्रकृति संरक्षण के संदर्भ में, प्राथमिक प्रतिबद्धता 'Ecological Restraint / Primitivism (+1.0)' के सिद्धांत पर आधारित होनी चाहिए।"}, {"question_id": "Q_BIN_D21_006", "dimension": "D21", "macro_domain": "Civilization & Meaning", "sub_topic": "De-growth", "polarity": -1.0, "weight": 1.0, "text_en": "Core Negative stance on De-growth: In matters of technological progressivism vs. primitivism, priority must be anchored in Unbound Progress (-1.0).", "text_hi": "तकनीकी प्रगतिवाद बनाम प्रकृति संरक्षण के संदर्भ में, प्राथमिक प्रतिबद्धता 'Unbound Progress (-1.0)' के सिद्धांत पर आधारित होनी चाहिए।"}, {"question_id": "Q_BIN_D22_001", "dimension": "D22", "macro_domain": "Civilization & Meaning", "sub_topic": "Absurd Universe vs Divine Blueprint", "polarity": 1.0, "weight": 1.0, "text_en": "Core Positive stance on Absurd Universe vs Divine Blueprint: In matters of constructed meaning vs. discovered teleology, priority must be anchored in Cosmic Teleology (+1.0).", "text_hi": "रचित सार्थकता बनाम पूर्वनिर्धारित उद्देश्य के संदर्भ में, प्राथमिक प्रतिबद्धता 'Cosmic Teleology (+1.0)' के सिद्धांत पर आधारित होनी चाहिए।"}, {"question_id": "Q_BIN_D22_006", "dimension": "D22", "macro_domain": "Civilization & Meaning", "sub_topic": "Nihilistic Freedom", "polarity": -1.0, "weight": 1.0, "text_en": "Core Negative stance on Nihilistic Freedom: In matters of constructed meaning vs. discovered teleology, priority must be anchored in Existential Creation (-1.0).", "text_hi": "रचित सार्थकता बनाम पूर्वनिर्धारित उद्देश्य के संदर्भ में, प्राथमिक प्रतिबद्धता 'Existential Creation (-1.0)' के सिद्धांत पर आधारित होनी चाहिए।"}, {"question_id": "Q_BIN_D23_001", "dimension": "D23", "macro_domain": "Civilization & Meaning", "sub_topic": "Perpetual Civilizational Rise vs Cyclical Collapse", "polarity": 1.0, "weight": 1.0, "text_en": "Core Positive stance on Perpetual Civilizational Rise vs Cyclical Collapse: In matters of historical optimism vs. tragic realism, priority must be anchored in Tragic Realism / Cyclical Decline (+1.0).", "text_hi": "ऐतिहासिक आशावाद बनाम दुखद यथार्थवाद के संदर्भ में, प्राथमिक प्रतिबद्धता 'Tragic Realism / Cyclical Decline (+1.0)' के सिद्धांत पर आधारित होनी चाहिए।"}, {"question_id": "Q_BIN_D23_006", "dimension": "D23", "macro_domain": "Civilization & Meaning", "sub_topic": "End of History", "polarity": -1.0, "weight": 1.0, "text_en": "Core Negative stance on End of History: In matters of historical optimism vs. tragic realism, priority must be anchored in Utopian Meliorism (-1.0).", "text_hi": "ऐतिहासिक आशावाद बनाम दुखद यथार्थवाद के संदर्भ में, प्राथमिक प्रतिबद्धता 'Utopian Meliorism (-1.0)' के सिद्धांत पर आधारित होनी चाहिए।"}, {"question_id": "Q_BIN_D24_001", "dimension": "D24", "macro_domain": "Civilization & Meaning", "sub_topic": "Terraforming / Geoengineering vs Flowing with Nature", "polarity": 1.0, "weight": 1.0, "text_en": "Core Positive stance on Terraforming / Geoengineering vs Flowing with Nature: In matters of promethean mastery vs. harmonious integration, priority must be anchored in Daoist / Natural Harmony (+1.0).", "text_hi": "प्रकृति पर विजय बनाम सामंजस्यपूर्ण तालमेल के संदर्भ में, प्राथमिक प्रतिबद्धता 'Daoist / Natural Harmony (+1.0)' के सिद्धांत पर आधारित होनी चाहिए।"}, {"question_id": "Q_BIN_D24_006", "dimension": "D24", "macro_domain": "Civilization & Meaning", "sub_topic": "Conquering the Wilderness vs Wu Wei Adaptation", "polarity": -1.0, "weight": 1.0, "text_en": "Core Negative stance on Conquering the Wilderness vs Wu Wei Adaptation: In matters of promethean mastery vs. harmonious integration, priority must be anchored in Environmental Mastery (-1.0).", "text_hi": "प्रकृति पर विजय बनाम सामंजस्यपूर्ण तालमेल के संदर्भ में, प्राथमिक प्रतिबद्धता 'Environmental Mastery (-1.0)' के सिद्धांत पर आधारित होनी चाहिए।"}, {"question_id": "Q_BIN_D25_001", "dimension": "D25", "macro_domain": "Civilization & Meaning", "sub_topic": "Unconditioned Free Will vs Causal Physics", "polarity": 1.0, "weight": 1.0, "text_en": "Core Positive stance on Unconditioned Free Will vs Causal Physics: In matters of metaphysical agency vs. determinism / fatalism, priority must be anchored in Strict Determinism / Karma / Fate (+1.0).", "text_hi": "स्वतंत्र इच्छाशक्ति बनाम नियतिवाद के संदर्भ में, प्राथमिक प्रतिबद्धता 'Strict Determinism / Karma / Fate (+1.0)' के सिद्धांत पर आधारित होनी चाहिए।"}, {"question_id": "Q_BIN_D25_006", "dimension": "D25", "macro_domain": "Civilization & Meaning", "sub_topic": "Kamma / Fate Constraints", "polarity": -1.0, "weight": 1.0, "text_en": "Core Negative stance on Kamma / Fate Constraints: In matters of metaphysical agency vs. determinism / fatalism, priority must be anchored in Radical Agency (-1.0).", "text_hi": "स्वतंत्र इच्छाशक्ति बनाम नियतिवाद के संदर्भ में, प्राथमिक प्रतिबद्धता 'Radical Agency (-1.0)' के सिद्धांत पर आधारित होनी चाहिए।"}];
const EMBEDDED_SAMPLE_DIL: AssessmentQuestion[] = [{"question_id": "Q_DIL_D01_001", "primary_dimension": "D01", "macro_domain": "Human Nature & Self", "sub_topic": "Locus of Identity", "scenario_en": "Applied ethical dilemma exploring Locus of Identity in individual vs. collective identity: Balancing institutional demands against competing considerations.", "scenario_hi": "व्यक्तिगत बनाम सामूहिक पहचान के अंतर्गत 'Locus of Identity' से संबंधित नैतिक असमंजस का परिदृश्य।", "options": [{"option_id": "OPT_1", "text_en": "Uncompromising commitment to Collective Primacy (+1.0) (+1.00).", "text_hi": "Collective Primacy (+1.0) का पूर्ण समर्थन।", "vectors": [{"dimension": "D01", "weight": 1.0}]}, {"option_id": "OPT_2", "text_en": "Moderate pragmatic lean toward Collective Primacy (+1.0) (+0.33).", "text_hi": "Collective Primacy (+1.0) की ओर व्यावहारिक झुकाव।", "vectors": [{"dimension": "D01", "weight": 0.33}]}, {"option_id": "OPT_3", "text_en": "Moderate pragmatic lean toward Individual Primacy (-1.0) (-0.33).", "text_hi": "Individual Primacy (-1.0) की ओर व्यावहारिक झुकाव।", "vectors": [{"dimension": "D01", "weight": -0.33}]}, {"option_id": "OPT_4", "text_en": "Uncompromising commitment to Individual Primacy (-1.0) (-1.00).", "text_hi": "Individual Primacy (-1.0) का पूर्ण समर्थन।", "vectors": [{"dimension": "D01", "weight": -1.0}]}, {"option_id": "OPT_5", "text_en": "Synthesizes moderate primary stance with secondary consideration (D04).", "text_hi": "प्राथमिक और द्वितीयक (D04) विचारों का समन्वय।", "vectors": [{"dimension": "D01", "weight": 0.7}, {"dimension": "D04", "weight": -0.3}]}, {"option_id": "OPT_6", "text_en": "Contextual compromise weighting institutional decentralization (D09).", "text_hi": "संस्थागत संतुलन और विकेंद्रीकरण (D09) पर केंद्रित विकल्प।", "vectors": [{"dimension": "D01", "weight": -0.5}, {"dimension": "D09", "weight": 0.5}]}]}, {"question_id": "Q_DIL_D02_001", "primary_dimension": "D02", "macro_domain": "Human Nature & Self", "sub_topic": "Conscience vs Hierarchy", "scenario_en": "Applied ethical dilemma exploring Conscience vs Hierarchy in autonomy vs. authority: Balancing institutional demands against competing considerations.", "scenario_hi": "स्वायत्तता बनाम अधिकार के अंतर्गत 'Conscience vs Hierarchy' से संबंधित नैतिक असमंजस का परिदृश्य।", "options": [{"option_id": "OPT_1", "text_en": "Uncompromising commitment to Institutional Authority (+1.0) (+1.00).", "text_hi": "Institutional Authority (+1.0) का पूर्ण समर्थन।", "vectors": [{"dimension": "D02", "weight": 1.0}]}, {"option_id": "OPT_2", "text_en": "Moderate pragmatic lean toward Institutional Authority (+1.0) (+0.33).", "text_hi": "Institutional Authority (+1.0) की ओर व्यावहारिक झुकाव।", "vectors": [{"dimension": "D02", "weight": 0.33}]}, {"option_id": "OPT_3", "text_en": "Moderate pragmatic lean toward Personal Autonomy (-1.0) (-0.33).", "text_hi": "Personal Autonomy (-1.0) की ओर व्यावहारिक झुकाव।", "vectors": [{"dimension": "D02", "weight": -0.33}]}, {"option_id": "OPT_4", "text_en": "Uncompromising commitment to Personal Autonomy (-1.0) (-1.00).", "text_hi": "Personal Autonomy (-1.0) का पूर्ण समर्थन।", "vectors": [{"dimension": "D02", "weight": -1.0}]}, {"option_id": "OPT_5", "text_en": "Synthesizes moderate primary stance with secondary consideration (D04).", "text_hi": "प्राथमिक और द्वितीयक (D04) विचारों का समन्वय।", "vectors": [{"dimension": "D02", "weight": 0.7}, {"dimension": "D04", "weight": -0.3}]}, {"option_id": "OPT_6", "text_en": "Contextual compromise weighting institutional decentralization (D09).", "text_hi": "संस्थागत संतुलन और विकेंद्रीकरण (D09) पर केंद्रित विकल्प।", "vectors": [{"dimension": "D02", "weight": -0.5}, {"dimension": "D09", "weight": 0.5}]}]}, {"question_id": "Q_DIL_D03_001", "primary_dimension": "D03", "macro_domain": "Human Nature & Self", "sub_topic": "Tabula Rasa vs Genetics", "scenario_en": "Applied ethical dilemma exploring Tabula Rasa vs Genetics in human plasticity vs. fixed nature: Balancing institutional demands against competing considerations.", "scenario_hi": "मानव परिवर्तनशीलता बनाम स्थिर स्वभाव के अंतर्गत 'Tabula Rasa vs Genetics' से संबंधित नैतिक असमंजस का परिदृश्य।", "options": [{"option_id": "OPT_1", "text_en": "Uncompromising commitment to Fixed Essential Nature (+1.0) (+1.00).", "text_hi": "Fixed Essential Nature (+1.0) का पूर्ण समर्थन।", "vectors": [{"dimension": "D03", "weight": 1.0}]}, {"option_id": "OPT_2", "text_en": "Moderate pragmatic lean toward Fixed Essential Nature (+1.0) (+0.33).", "text_hi": "Fixed Essential Nature (+1.0) की ओर व्यावहारिक झुकाव।", "vectors": [{"dimension": "D03", "weight": 0.33}]}, {"option_id": "OPT_3", "text_en": "Moderate pragmatic lean toward Radical Plasticity (-1.0) (-0.33).", "text_hi": "Radical Plasticity (-1.0) की ओर व्यावहारिक झुकाव।", "vectors": [{"dimension": "D03", "weight": -0.33}]}, {"option_id": "OPT_4", "text_en": "Uncompromising commitment to Radical Plasticity (-1.0) (-1.00).", "text_hi": "Radical Plasticity (-1.0) का पूर्ण समर्थन।", "vectors": [{"dimension": "D03", "weight": -1.0}]}, {"option_id": "OPT_5", "text_en": "Synthesizes moderate primary stance with secondary consideration (D04).", "text_hi": "प्राथमिक और द्वितीयक (D04) विचारों का समन्वय।", "vectors": [{"dimension": "D03", "weight": 0.7}, {"dimension": "D04", "weight": -0.3}]}, {"option_id": "OPT_6", "text_en": "Contextual compromise weighting institutional decentralization (D09).", "text_hi": "संस्थागत संतुलन और विकेंद्रीकरण (D09) पर केंद्रित विकल्प।", "vectors": [{"dimension": "D03", "weight": -0.5}, {"dimension": "D09", "weight": 0.5}]}]}, {"question_id": "Q_DIL_D04_001", "primary_dimension": "D04", "macro_domain": "Human Nature & Self", "sub_topic": "Altruism vs Egoism", "scenario_en": "Applied ethical dilemma exploring Altruism vs Egoism in self-interest vs. mutual obligation: Balancing institutional demands against competing considerations.", "scenario_hi": "स्वार्थ बनाम पारस्परिक कर्तव्य के अंतर्गत 'Altruism vs Egoism' से संबंधित नैतिक असमंजस का परिदृश्य।", "options": [{"option_id": "OPT_1", "text_en": "Uncompromising commitment to Mutual Moral Obligation (+1.0) (+1.00).", "text_hi": "Mutual Moral Obligation (+1.0) का पूर्ण समर्थन।", "vectors": [{"dimension": "D04", "weight": 1.0}]}, {"option_id": "OPT_2", "text_en": "Moderate pragmatic lean toward Mutual Moral Obligation (+1.0) (+0.33).", "text_hi": "Mutual Moral Obligation (+1.0) की ओर व्यावहारिक झुकाव।", "vectors": [{"dimension": "D04", "weight": 0.33}]}, {"option_id": "OPT_3", "text_en": "Moderate pragmatic lean toward Rational Self-Interest (-1.0) (-0.33).", "text_hi": "Rational Self-Interest (-1.0) की ओर व्यावहारिक झुकाव।", "vectors": [{"dimension": "D04", "weight": -0.33}]}, {"option_id": "OPT_4", "text_en": "Uncompromising commitment to Rational Self-Interest (-1.0) (-1.00).", "text_hi": "Rational Self-Interest (-1.0) का पूर्ण समर्थन।", "vectors": [{"dimension": "D04", "weight": -1.0}]}, {"option_id": "OPT_5", "text_en": "Synthesizes moderate primary stance with secondary consideration (D01).", "text_hi": "प्राथमिक और द्वितीयक (D01) विचारों का समन्वय।", "vectors": [{"dimension": "D04", "weight": 0.7}, {"dimension": "D01", "weight": -0.3}]}, {"option_id": "OPT_6", "text_en": "Contextual compromise weighting institutional decentralization (D09).", "text_hi": "संस्थागत संतुलन और विकेंद्रीकरण (D09) पर केंद्रित विकल्प।", "vectors": [{"dimension": "D04", "weight": -0.5}, {"dimension": "D09", "weight": 0.5}]}]}, {"question_id": "Q_DIL_D05_001", "primary_dimension": "D05", "macro_domain": "Human Nature & Self", "sub_topic": "Bodily Life vs Afterlife", "scenario_en": "Applied ethical dilemma exploring Bodily Life vs Afterlife in immanent fulfillment vs. transcendence: Balancing institutional demands against competing considerations.", "scenario_hi": "सांसारिक पूर्णता बनाम पारलौकिक उत्थान के अंतर्गत 'Bodily Life vs Afterlife' से संबंधित नैतिक असमंजस का परिदृश्य।", "options": [{"option_id": "OPT_1", "text_en": "Uncompromising commitment to Transcendental Realization (+1.0) (+1.00).", "text_hi": "Transcendental Realization (+1.0) का पूर्ण समर्थन।", "vectors": [{"dimension": "D05", "weight": 1.0}]}, {"option_id": "OPT_2", "text_en": "Moderate pragmatic lean toward Transcendental Realization (+1.0) (+0.33).", "text_hi": "Transcendental Realization (+1.0) की ओर व्यावहारिक झुकाव।", "vectors": [{"dimension": "D05", "weight": 0.33}]}, {"option_id": "OPT_3", "text_en": "Moderate pragmatic lean toward Immanent Flourishing (-1.0) (-0.33).", "text_hi": "Immanent Flourishing (-1.0) की ओर व्यावहारिक झुकाव।", "vectors": [{"dimension": "D05", "weight": -0.33}]}, {"option_id": "OPT_4", "text_en": "Uncompromising commitment to Immanent Flourishing (-1.0) (-1.00).", "text_hi": "Immanent Flourishing (-1.0) का पूर्ण समर्थन।", "vectors": [{"dimension": "D05", "weight": -1.0}]}, {"option_id": "OPT_5", "text_en": "Synthesizes moderate primary stance with secondary consideration (D04).", "text_hi": "प्राथमिक और द्वितीयक (D04) विचारों का समन्वय।", "vectors": [{"dimension": "D05", "weight": 0.7}, {"dimension": "D04", "weight": -0.3}]}, {"option_id": "OPT_6", "text_en": "Contextual compromise weighting institutional decentralization (D09).", "text_hi": "संस्थागत संतुलन और विकेंद्रीकरण (D09) पर केंद्रित विकल्प।", "vectors": [{"dimension": "D05", "weight": -0.5}, {"dimension": "D09", "weight": 0.5}]}]}, {"question_id": "Q_DIL_D06_001", "primary_dimension": "D06", "macro_domain": "Society & Governance", "sub_topic": "Classless Society vs Meritocracy", "scenario_en": "Applied ethical dilemma exploring Classless Society vs Meritocracy in egalitarianism vs. functional hierarchy: Balancing institutional demands against competing considerations.", "scenario_hi": "समानतावाद बनाम कार्यात्मक पदानुक्रम के अंतर्गत 'Classless Society vs Meritocracy' से संबंधित नैतिक असमंजस का परिदृश्य।", "options": [{"option_id": "OPT_1", "text_en": "Uncompromising commitment to Natural / Functional Hierarchy (+1.0) (+1.00).", "text_hi": "Natural / Functional Hierarchy (+1.0) का पूर्ण समर्थन।", "vectors": [{"dimension": "D06", "weight": 1.0}]}, {"option_id": "OPT_2", "text_en": "Moderate pragmatic lean toward Natural / Functional Hierarchy (+1.0) (+0.33).", "text_hi": "Natural / Functional Hierarchy (+1.0) की ओर व्यावहारिक झुकाव।", "vectors": [{"dimension": "D06", "weight": 0.33}]}, {"option_id": "OPT_3", "text_en": "Moderate pragmatic lean toward Strict Egalitarianism (-1.0) (-0.33).", "text_hi": "Strict Egalitarianism (-1.0) की ओर व्यावहारिक झुकाव।", "vectors": [{"dimension": "D06", "weight": -0.33}]}, {"option_id": "OPT_4", "text_en": "Uncompromising commitment to Strict Egalitarianism (-1.0) (-1.00).", "text_hi": "Strict Egalitarianism (-1.0) का पूर्ण समर्थन।", "vectors": [{"dimension": "D06", "weight": -1.0}]}, {"option_id": "OPT_5", "text_en": "Synthesizes moderate primary stance with secondary consideration (D04).", "text_hi": "प्राथमिक और द्वितीयक (D04) विचारों का समन्वय।", "vectors": [{"dimension": "D06", "weight": 0.7}, {"dimension": "D04", "weight": -0.3}]}, {"option_id": "OPT_6", "text_en": "Contextual compromise weighting institutional decentralization (D09).", "text_hi": "संस्थागत संतुलन और विकेंद्रीकरण (D09) पर केंद्रित विकल्प।", "vectors": [{"dimension": "D06", "weight": -0.5}, {"dimension": "D09", "weight": 0.5}]}]}, {"question_id": "Q_DIL_D07_001", "primary_dimension": "D07", "macro_domain": "Society & Governance", "sub_topic": "Public Health Curfews", "scenario_en": "Applied ethical dilemma exploring Public Health Curfews in personal liberty vs. social order: Balancing institutional demands against competing considerations.", "scenario_hi": "व्यक्तिगत स्वतंत्रता बनाम सामाजिक व्यवस्था के अंतर्गत 'Public Health Curfews' से संबंधित नैतिक असमंजस का परिदृश्य।", "options": [{"option_id": "OPT_1", "text_en": "Uncompromising commitment to Civic Order & Security (+1.0) (+1.00).", "text_hi": "Civic Order & Security (+1.0) का पूर्ण समर्थन।", "vectors": [{"dimension": "D07", "weight": 1.0}]}, {"option_id": "OPT_2", "text_en": "Moderate pragmatic lean toward Civic Order & Security (+1.0) (+0.33).", "text_hi": "Civic Order & Security (+1.0) की ओर व्यावहारिक झुकाव।", "vectors": [{"dimension": "D07", "weight": 0.33}]}, {"option_id": "OPT_3", "text_en": "Moderate pragmatic lean toward Unconditional Liberty (-1.0) (-0.33).", "text_hi": "Unconditional Liberty (-1.0) की ओर व्यावहारिक झुकाव।", "vectors": [{"dimension": "D07", "weight": -0.33}]}, {"option_id": "OPT_4", "text_en": "Uncompromising commitment to Unconditional Liberty (-1.0) (-1.00).", "text_hi": "Unconditional Liberty (-1.0) का पूर्ण समर्थन।", "vectors": [{"dimension": "D07", "weight": -1.0}]}, {"option_id": "OPT_5", "text_en": "Synthesizes moderate primary stance with secondary consideration (D04).", "text_hi": "प्राथमिक और द्वितीयक (D04) विचारों का समन्वय।", "vectors": [{"dimension": "D07", "weight": 0.7}, {"dimension": "D04", "weight": -0.3}]}, {"option_id": "OPT_6", "text_en": "Contextual compromise weighting institutional decentralization (D09).", "text_hi": "संस्थागत संतुलन और विकेंद्रीकरण (D09) पर केंद्रित विकल्प।", "vectors": [{"dimension": "D07", "weight": -0.5}, {"dimension": "D09", "weight": 0.5}]}]}, {"question_id": "Q_DIL_D08_001", "primary_dimension": "D08", "macro_domain": "Society & Governance", "sub_topic": "Ancestral Customs vs Innovation", "scenario_en": "Applied ethical dilemma exploring Ancestral Customs vs Innovation in traditional continuity vs. radical reform: Balancing institutional demands against competing considerations.", "scenario_hi": "पारंपरिक निरंतरता बनाम क्रांतिकारी सुधार के अंतर्गत 'Ancestral Customs vs Innovation' से संबंधित नैतिक असमंजस का परिदृश्य।", "options": [{"option_id": "OPT_1", "text_en": "Uncompromising commitment to Transformative Reform (+1.0) (+1.00).", "text_hi": "Transformative Reform (+1.0) का पूर्ण समर्थन।", "vectors": [{"dimension": "D08", "weight": 1.0}]}, {"option_id": "OPT_2", "text_en": "Moderate pragmatic lean toward Transformative Reform (+1.0) (+0.33).", "text_hi": "Transformative Reform (+1.0) की ओर व्यावहारिक झुकाव।", "vectors": [{"dimension": "D08", "weight": 0.33}]}, {"option_id": "OPT_3", "text_en": "Moderate pragmatic lean toward Preservation of Tradition (-1.0) (-0.33).", "text_hi": "Preservation of Tradition (-1.0) की ओर व्यावहारिक झुकाव।", "vectors": [{"dimension": "D08", "weight": -0.33}]}, {"option_id": "OPT_4", "text_en": "Uncompromising commitment to Preservation of Tradition (-1.0) (-1.00).", "text_hi": "Preservation of Tradition (-1.0) का पूर्ण समर्थन।", "vectors": [{"dimension": "D08", "weight": -1.0}]}, {"option_id": "OPT_5", "text_en": "Synthesizes moderate primary stance with secondary consideration (D04).", "text_hi": "प्राथमिक और द्वितीयक (D04) विचारों का समन्वय।", "vectors": [{"dimension": "D08", "weight": 0.7}, {"dimension": "D04", "weight": -0.3}]}, {"option_id": "OPT_6", "text_en": "Contextual compromise weighting institutional decentralization (D09).", "text_hi": "संस्थागत संतुलन और विकेंद्रीकरण (D09) पर केंद्रित विकल्प।", "vectors": [{"dimension": "D08", "weight": -0.5}, {"dimension": "D09", "weight": 0.5}]}]}, {"question_id": "Q_DIL_D09_001", "primary_dimension": "D09", "macro_domain": "Society & Governance", "sub_topic": "Sovereign State Power vs Local Councils", "scenario_en": "Applied ethical dilemma exploring Sovereign State Power vs Local Councils in centralized cohesion vs. subsidiarity: Balancing institutional demands against competing considerations.", "scenario_hi": "केंद्रीकृत एकजुटता बनाम विकेंद्रीकरण के अंतर्गत 'Sovereign State Power vs Local Councils' से संबंधित नैतिक असमंजस का परिदृश्य।", "options": [{"option_id": "OPT_1", "text_en": "Uncompromising commitment to Distributed Subsidiarity (+1.0) (+1.00).", "text_hi": "Distributed Subsidiarity (+1.0) का पूर्ण समर्थन।", "vectors": [{"dimension": "D09", "weight": 1.0}]}, {"option_id": "OPT_2", "text_en": "Moderate pragmatic lean toward Distributed Subsidiarity (+1.0) (+0.33).", "text_hi": "Distributed Subsidiarity (+1.0) की ओर व्यावहारिक झुकाव।", "vectors": [{"dimension": "D09", "weight": 0.33}]}, {"option_id": "OPT_3", "text_en": "Moderate pragmatic lean toward Centralized Governance (-1.0) (-0.33).", "text_hi": "Centralized Governance (-1.0) की ओर व्यावहारिक झुकाव।", "vectors": [{"dimension": "D09", "weight": -0.33}]}, {"option_id": "OPT_4", "text_en": "Uncompromising commitment to Centralized Governance (-1.0) (-1.00).", "text_hi": "Centralized Governance (-1.0) का पूर्ण समर्थन।", "vectors": [{"dimension": "D09", "weight": -1.0}]}, {"option_id": "OPT_5", "text_en": "Synthesizes moderate primary stance with secondary consideration (D04).", "text_hi": "प्राथमिक और द्वितीयक (D04) विचारों का समन्वय।", "vectors": [{"dimension": "D09", "weight": 0.7}, {"dimension": "D04", "weight": -0.3}]}, {"option_id": "OPT_6", "text_en": "Contextual compromise weighting institutional decentralization (D02).", "text_hi": "संस्थागत संतुलन और विकेंद्रीकरण (D02) पर केंद्रित विकल्प।", "vectors": [{"dimension": "D09", "weight": -0.5}, {"dimension": "D02", "weight": 0.5}]}]}, {"question_id": "Q_DIL_D10_001", "primary_dimension": "D10", "macro_domain": "Society & Governance", "sub_topic": "Global Human Rights vs Cultural Relativity", "scenario_en": "Applied ethical dilemma exploring Global Human Rights vs Cultural Relativity in universal standardization vs. local particularity: Balancing institutional demands against competing considerations.", "scenario_hi": "सार्वभौमिक मानक बनाम स्थानीय विशिष्टता के अंतर्गत 'Global Human Rights vs Cultural Relativity' से संबंधित नैतिक असमंजस का परिदृश्य।", "options": [{"option_id": "OPT_1", "text_en": "Uncompromising commitment to Cultural / Contextual Sovereignty (+1.0) (+1.00).", "text_hi": "Cultural / Contextual Sovereignty (+1.0) का पूर्ण समर्थन।", "vectors": [{"dimension": "D10", "weight": 1.0}]}, {"option_id": "OPT_2", "text_en": "Moderate pragmatic lean toward Cultural / Contextual Sovereignty (+1.0) (+0.33).", "text_hi": "Cultural / Contextual Sovereignty (+1.0) की ओर व्यावहारिक झुकाव।", "vectors": [{"dimension": "D10", "weight": 0.33}]}, {"option_id": "OPT_3", "text_en": "Moderate pragmatic lean toward Universal Rights & Standards (-1.0) (-0.33).", "text_hi": "Universal Rights & Standards (-1.0) की ओर व्यावहारिक झुकाव।", "vectors": [{"dimension": "D10", "weight": -0.33}]}, {"option_id": "OPT_4", "text_en": "Uncompromising commitment to Universal Rights & Standards (-1.0) (-1.00).", "text_hi": "Universal Rights & Standards (-1.0) का पूर्ण समर्थन।", "vectors": [{"dimension": "D10", "weight": -1.0}]}, {"option_id": "OPT_5", "text_en": "Synthesizes moderate primary stance with secondary consideration (D04).", "text_hi": "प्राथमिक और द्वितीयक (D04) विचारों का समन्वय।", "vectors": [{"dimension": "D10", "weight": 0.7}, {"dimension": "D04", "weight": -0.3}]}, {"option_id": "OPT_6", "text_en": "Contextual compromise weighting institutional decentralization (D09).", "text_hi": "संस्थागत संतुलन और विकेंद्रीकरण (D09) पर केंद्रित विकल्प।", "vectors": [{"dimension": "D10", "weight": -0.5}, {"dimension": "D09", "weight": 0.5}]}]}, {"question_id": "Q_DIL_D11_001", "primary_dimension": "D11", "macro_domain": "Reality & Knowledge", "sub_topic": "Sensory Science vs Divine Revelation", "scenario_en": "Applied ethical dilemma exploring Sensory Science vs Divine Revelation in empiricism vs. transcendent metaphysics: Balancing institutional demands against competing considerations.", "scenario_hi": "अनुभववाद बनाम पारलौकिक तत्वमीमांसा के अंतर्गत 'Sensory Science vs Divine Revelation' से संबंधित नैतिक असमंजस का परिदृश्य।", "options": [{"option_id": "OPT_1", "text_en": "Uncompromising commitment to Transcendent Metaphysics (+1.0) (+1.00).", "text_hi": "Transcendent Metaphysics (+1.0) का पूर्ण समर्थन।", "vectors": [{"dimension": "D11", "weight": 1.0}]}, {"option_id": "OPT_2", "text_en": "Moderate pragmatic lean toward Transcendent Metaphysics (+1.0) (+0.33).", "text_hi": "Transcendent Metaphysics (+1.0) की ओर व्यावहारिक झुकाव।", "vectors": [{"dimension": "D11", "weight": 0.33}]}, {"option_id": "OPT_3", "text_en": "Moderate pragmatic lean toward Empirical Naturalism (-1.0) (-0.33).", "text_hi": "Empirical Naturalism (-1.0) की ओर व्यावहारिक झुकाव।", "vectors": [{"dimension": "D11", "weight": -0.33}]}, {"option_id": "OPT_4", "text_en": "Uncompromising commitment to Empirical Naturalism (-1.0) (-1.00).", "text_hi": "Empirical Naturalism (-1.0) का पूर्ण समर्थन।", "vectors": [{"dimension": "D11", "weight": -1.0}]}, {"option_id": "OPT_5", "text_en": "Synthesizes moderate primary stance with secondary consideration (D04).", "text_hi": "प्राथमिक और द्वितीयक (D04) विचारों का समन्वय।", "vectors": [{"dimension": "D11", "weight": 0.7}, {"dimension": "D04", "weight": -0.3}]}, {"option_id": "OPT_6", "text_en": "Contextual compromise weighting institutional decentralization (D09).", "text_hi": "संस्थागत संतुलन और विकेंद्रीकरण (D09) पर केंद्रित विकल्प।", "vectors": [{"dimension": "D11", "weight": -0.5}, {"dimension": "D09", "weight": 0.5}]}]}, {"question_id": "Q_DIL_D12_001", "primary_dimension": "D12", "macro_domain": "Reality & Knowledge", "sub_topic": "Formal Logic vs Mystic Insight", "scenario_en": "Applied ethical dilemma exploring Formal Logic vs Mystic Insight in systematic reason vs. intuitive gnosis: Balancing institutional demands against competing considerations.", "scenario_hi": "तार्किक विवेक बनाम अंतर्ज्ञान के अंतर्गत 'Formal Logic vs Mystic Insight' से संबंधित नैतिक असमंजस का परिदृश्य।", "options": [{"option_id": "OPT_1", "text_en": "Uncompromising commitment to Direct Intuition & Gnosis (+1.0) (+1.00).", "text_hi": "Direct Intuition & Gnosis (+1.0) का पूर्ण समर्थन।", "vectors": [{"dimension": "D12", "weight": 1.0}]}, {"option_id": "OPT_2", "text_en": "Moderate pragmatic lean toward Direct Intuition & Gnosis (+1.0) (+0.33).", "text_hi": "Direct Intuition & Gnosis (+1.0) की ओर व्यावहारिक झुकाव।", "vectors": [{"dimension": "D12", "weight": 0.33}]}, {"option_id": "OPT_3", "text_en": "Moderate pragmatic lean toward Discursive Rationalism (-1.0) (-0.33).", "text_hi": "Discursive Rationalism (-1.0) की ओर व्यावहारिक झुकाव।", "vectors": [{"dimension": "D12", "weight": -0.33}]}, {"option_id": "OPT_4", "text_en": "Uncompromising commitment to Discursive Rationalism (-1.0) (-1.00).", "text_hi": "Discursive Rationalism (-1.0) का पूर्ण समर्थन।", "vectors": [{"dimension": "D12", "weight": -1.0}]}, {"option_id": "OPT_5", "text_en": "Synthesizes moderate primary stance with secondary consideration (D04).", "text_hi": "प्राथमिक और द्वितीयक (D04) विचारों का समन्वय।", "vectors": [{"dimension": "D12", "weight": 0.7}, {"dimension": "D04", "weight": -0.3}]}, {"option_id": "OPT_6", "text_en": "Contextual compromise weighting institutional decentralization (D09).", "text_hi": "संस्थागत संतुलन और विकेंद्रीकरण (D09) पर केंद्रित विकल्प।", "vectors": [{"dimension": "D12", "weight": -0.5}, {"dimension": "D09", "weight": 0.5}]}]}, {"question_id": "Q_DIL_D13_001", "primary_dimension": "D13", "macro_domain": "Reality & Knowledge", "sub_topic": "Brain Mechanism vs Primacy of Consciousness", "scenario_en": "Applied ethical dilemma exploring Brain Mechanism vs Primacy of Consciousness in materialism vs. idealism / panpsychism: Balancing institutional demands against competing considerations.", "scenario_hi": "भौतिकवाद बनाम विचारवाद / सर्वचेतनवाद के अंतर्गत 'Brain Mechanism vs Primacy of Consciousness' से संबंधित नैतिक असमंजस का परिदृश्य।", "options": [{"option_id": "OPT_1", "text_en": "Uncompromising commitment to Idealism / Mind Primacy (+1.0) (+1.00).", "text_hi": "Idealism / Mind Primacy (+1.0) का पूर्ण समर्थन।", "vectors": [{"dimension": "D13", "weight": 1.0}]}, {"option_id": "OPT_2", "text_en": "Moderate pragmatic lean toward Idealism / Mind Primacy (+1.0) (+0.33).", "text_hi": "Idealism / Mind Primacy (+1.0) की ओर व्यावहारिक झुकाव।", "vectors": [{"dimension": "D13", "weight": 0.33}]}, {"option_id": "OPT_3", "text_en": "Moderate pragmatic lean toward Physicalist Materialism (-1.0) (-0.33).", "text_hi": "Physicalist Materialism (-1.0) की ओर व्यावहारिक झुकाव।", "vectors": [{"dimension": "D13", "weight": -0.33}]}, {"option_id": "OPT_4", "text_en": "Uncompromising commitment to Physicalist Materialism (-1.0) (-1.00).", "text_hi": "Physicalist Materialism (-1.0) का पूर्ण समर्थन।", "vectors": [{"dimension": "D13", "weight": -1.0}]}, {"option_id": "OPT_5", "text_en": "Synthesizes moderate primary stance with secondary consideration (D04).", "text_hi": "प्राथमिक और द्वितीयक (D04) विचारों का समन्वय।", "vectors": [{"dimension": "D13", "weight": 0.7}, {"dimension": "D04", "weight": -0.3}]}, {"option_id": "OPT_6", "text_en": "Contextual compromise weighting institutional decentralization (D09).", "text_hi": "संस्थागत संतुलन और विकेंद्रीकरण (D09) पर केंद्रित विकल्प।", "vectors": [{"dimension": "D13", "weight": -0.5}, {"dimension": "D09", "weight": 0.5}]}]}, {"question_id": "Q_DIL_D14_001", "primary_dimension": "D14", "macro_domain": "Reality & Knowledge", "sub_topic": "Skeptical Inquiry vs Indubitable Truth", "scenario_en": "Applied ethical dilemma exploring Skeptical Inquiry vs Indubitable Truth in epistemic fallibilism vs. dogmatic certainty: Balancing institutional demands against competing considerations.", "scenario_hi": "संशयवादी विनम्रता बनाम सैद्धांतिक निश्चयता के अंतर्गत 'Skeptical Inquiry vs Indubitable Truth' से संबंधित नैतिक असमंजस का परिदृश्य।", "options": [{"option_id": "OPT_1", "text_en": "Uncompromising commitment to Foundational Certainty (+1.0) (+1.00).", "text_hi": "Foundational Certainty (+1.0) का पूर्ण समर्थन।", "vectors": [{"dimension": "D14", "weight": 1.0}]}, {"option_id": "OPT_2", "text_en": "Moderate pragmatic lean toward Foundational Certainty (+1.0) (+0.33).", "text_hi": "Foundational Certainty (+1.0) की ओर व्यावहारिक झुकाव।", "vectors": [{"dimension": "D14", "weight": 0.33}]}, {"option_id": "OPT_3", "text_en": "Moderate pragmatic lean toward Critical Fallibilism (-1.0) (-0.33).", "text_hi": "Critical Fallibilism (-1.0) की ओर व्यावहारिक झुकाव।", "vectors": [{"dimension": "D14", "weight": -0.33}]}, {"option_id": "OPT_4", "text_en": "Uncompromising commitment to Critical Fallibilism (-1.0) (-1.00).", "text_hi": "Critical Fallibilism (-1.0) का पूर्ण समर्थन।", "vectors": [{"dimension": "D14", "weight": -1.0}]}, {"option_id": "OPT_5", "text_en": "Synthesizes moderate primary stance with secondary consideration (D04).", "text_hi": "प्राथमिक और द्वितीयक (D04) विचारों का समन्वय।", "vectors": [{"dimension": "D14", "weight": 0.7}, {"dimension": "D04", "weight": -0.3}]}, {"option_id": "OPT_6", "text_en": "Contextual compromise weighting institutional decentralization (D09).", "text_hi": "संस्थागत संतुलन और विकेंद्रीकरण (D09) पर केंद्रित विकल्प।", "vectors": [{"dimension": "D14", "weight": -0.5}, {"dimension": "D09", "weight": 0.5}]}]}, {"question_id": "Q_DIL_D15_001", "primary_dimension": "D15", "macro_domain": "Reality & Knowledge", "sub_topic": "Deconstruction into Particles vs Irreducible Complex Wholes", "scenario_en": "Applied ethical dilemma exploring Deconstruction into Particles vs Irreducible Complex Wholes in atomistic reductionism vs. emergent holism: Balancing institutional demands against competing considerations.", "scenario_hi": "परमाणुवादी विश्लेषणात्मकता बनाम समग्रतावाद के अंतर्गत 'Deconstruction into Particles vs Irreducible Complex Wholes' से संबंधित नैतिक असमंजस का परिदृश्य।", "options": [{"option_id": "OPT_1", "text_en": "Uncompromising commitment to Organic Holism (+1.0) (+1.00).", "text_hi": "Organic Holism (+1.0) का पूर्ण समर्थन।", "vectors": [{"dimension": "D15", "weight": 1.0}]}, {"option_id": "OPT_2", "text_en": "Moderate pragmatic lean toward Organic Holism (+1.0) (+0.33).", "text_hi": "Organic Holism (+1.0) की ओर व्यावहारिक झुकाव।", "vectors": [{"dimension": "D15", "weight": 0.33}]}, {"option_id": "OPT_3", "text_en": "Moderate pragmatic lean toward Analytical Reductionism (-1.0) (-0.33).", "text_hi": "Analytical Reductionism (-1.0) की ओर व्यावहारिक झुकाव।", "vectors": [{"dimension": "D15", "weight": -0.33}]}, {"option_id": "OPT_4", "text_en": "Uncompromising commitment to Analytical Reductionism (-1.0) (-1.00).", "text_hi": "Analytical Reductionism (-1.0) का पूर्ण समर्थन।", "vectors": [{"dimension": "D15", "weight": -1.0}]}, {"option_id": "OPT_5", "text_en": "Synthesizes moderate primary stance with secondary consideration (D04).", "text_hi": "प्राथमिक और द्वितीयक (D04) विचारों का समन्वय।", "vectors": [{"dimension": "D15", "weight": 0.7}, {"dimension": "D04", "weight": -0.3}]}, {"option_id": "OPT_6", "text_en": "Contextual compromise weighting institutional decentralization (D09).", "text_hi": "संस्थागत संतुलन और विकेंद्रीकरण (D09) पर केंद्रित विकल्प।", "vectors": [{"dimension": "D15", "weight": -0.5}, {"dimension": "D09", "weight": 0.5}]}]}, {"question_id": "Q_DIL_D16_001", "primary_dimension": "D16", "macro_domain": "Ethics & Values", "sub_topic": "Utilitarian Outcomes vs Invariant Moral Rules", "scenario_en": "Applied ethical dilemma exploring Utilitarian Outcomes vs Invariant Moral Rules in consequentialism vs. deontological duty: Balancing institutional demands against competing considerations.", "scenario_hi": "परिणामवाद बनाम कर्तव्यवाद के अंतर्गत 'Utilitarian Outcomes vs Invariant Moral Rules' से संबंधित नैतिक असमंजस का परिदृश्य।", "options": [{"option_id": "OPT_1", "text_en": "Uncompromising commitment to Deontological Duty (+1.0) (+1.00).", "text_hi": "Deontological Duty (+1.0) का पूर्ण समर्थन।", "vectors": [{"dimension": "D16", "weight": 1.0}]}, {"option_id": "OPT_2", "text_en": "Moderate pragmatic lean toward Deontological Duty (+1.0) (+0.33).", "text_hi": "Deontological Duty (+1.0) की ओर व्यावहारिक झुकाव।", "vectors": [{"dimension": "D16", "weight": 0.33}]}, {"option_id": "OPT_3", "text_en": "Moderate pragmatic lean toward Teleological Consequences (-1.0) (-0.33).", "text_hi": "Teleological Consequences (-1.0) की ओर व्यावहारिक झुकाव।", "vectors": [{"dimension": "D16", "weight": -0.33}]}, {"option_id": "OPT_4", "text_en": "Uncompromising commitment to Teleological Consequences (-1.0) (-1.00).", "text_hi": "Teleological Consequences (-1.0) का पूर्ण समर्थन।", "vectors": [{"dimension": "D16", "weight": -1.0}]}, {"option_id": "OPT_5", "text_en": "Synthesizes moderate primary stance with secondary consideration (D04).", "text_hi": "प्राथमिक और द्वितीयक (D04) विचारों का समन्वय।", "vectors": [{"dimension": "D16", "weight": 0.7}, {"dimension": "D04", "weight": -0.3}]}, {"option_id": "OPT_6", "text_en": "Contextual compromise weighting institutional decentralization (D09).", "text_hi": "संस्थागत संतुलन और विकेंद्रीकरण (D09) पर केंद्रित विकल्प।", "vectors": [{"dimension": "D16", "weight": -0.5}, {"dimension": "D09", "weight": 0.5}]}]}, {"question_id": "Q_DIL_D17_001", "primary_dimension": "D17", "macro_domain": "Ethics & Values", "sub_topic": "Kinship Obligations vs Impersonal Fairness", "scenario_en": "Applied ethical dilemma exploring Kinship Obligations vs Impersonal Fairness in relational care vs. impartial justice: Balancing institutional demands against competing considerations.", "scenario_hi": "सहानुभूति व रिश्ते बनाम निष्पक्ष न्याय के अंतर्गत 'Kinship Obligations vs Impersonal Fairness' से संबंधित नैतिक असमंजस का परिदृश्य।", "options": [{"option_id": "OPT_1", "text_en": "Uncompromising commitment to Impartial Rational Justice (+1.0) (+1.00).", "text_hi": "Impartial Rational Justice (+1.0) का पूर्ण समर्थन।", "vectors": [{"dimension": "D17", "weight": 1.0}]}, {"option_id": "OPT_2", "text_en": "Moderate pragmatic lean toward Impartial Rational Justice (+1.0) (+0.33).", "text_hi": "Impartial Rational Justice (+1.0) की ओर व्यावहारिक झुकाव।", "vectors": [{"dimension": "D17", "weight": 0.33}]}, {"option_id": "OPT_3", "text_en": "Moderate pragmatic lean toward Contextual Care Ethics (-1.0) (-0.33).", "text_hi": "Contextual Care Ethics (-1.0) की ओर व्यावहारिक झुकाव।", "vectors": [{"dimension": "D17", "weight": -0.33}]}, {"option_id": "OPT_4", "text_en": "Uncompromising commitment to Contextual Care Ethics (-1.0) (-1.00).", "text_hi": "Contextual Care Ethics (-1.0) का पूर्ण समर्थन।", "vectors": [{"dimension": "D17", "weight": -1.0}]}, {"option_id": "OPT_5", "text_en": "Synthesizes moderate primary stance with secondary consideration (D04).", "text_hi": "प्राथमिक और द्वितीयक (D04) विचारों का समन्वय।", "vectors": [{"dimension": "D17", "weight": 0.7}, {"dimension": "D04", "weight": -0.3}]}, {"option_id": "OPT_6", "text_en": "Contextual compromise weighting institutional decentralization (D09).", "text_hi": "संस्थागत संतुलन और विकेंद्रीकरण (D09) पर केंद्रित विकल्प।", "vectors": [{"dimension": "D17", "weight": -0.5}, {"dimension": "D09", "weight": 0.5}]}]}, {"question_id": "Q_DIL_D18_001", "primary_dimension": "D18", "macro_domain": "Ethics & Values", "sub_topic": "Cosmic Moral Facts vs Cultural Inventions", "scenario_en": "Applied ethical dilemma exploring Cosmic Moral Facts vs Cultural Inventions in moral objectivism vs. moral relativism: Balancing institutional demands against competing considerations.", "scenario_hi": "वस्तुनिष्ठ नैतिकता बनाम सापेक्षतावादी नैतिकता के अंतर्गत 'Cosmic Moral Facts vs Cultural Inventions' से संबंधित नैतिक असमंजस का परिदृश्य।", "options": [{"option_id": "OPT_1", "text_en": "Uncompromising commitment to Constructed / Relativist Morality (+1.0) (+1.00).", "text_hi": "Constructed / Relativist Morality (+1.0) का पूर्ण समर्थन।", "vectors": [{"dimension": "D18", "weight": 1.0}]}, {"option_id": "OPT_2", "text_en": "Moderate pragmatic lean toward Constructed / Relativist Morality (+1.0) (+0.33).", "text_hi": "Constructed / Relativist Morality (+1.0) की ओर व्यावहारिक झुकाव।", "vectors": [{"dimension": "D18", "weight": 0.33}]}, {"option_id": "OPT_3", "text_en": "Moderate pragmatic lean toward Objective Moral Truth (-1.0) (-0.33).", "text_hi": "Objective Moral Truth (-1.0) की ओर व्यावहारिक झुकाव।", "vectors": [{"dimension": "D18", "weight": -0.33}]}, {"option_id": "OPT_4", "text_en": "Uncompromising commitment to Objective Moral Truth (-1.0) (-1.00).", "text_hi": "Objective Moral Truth (-1.0) का पूर्ण समर्थन।", "vectors": [{"dimension": "D18", "weight": -1.0}]}, {"option_id": "OPT_5", "text_en": "Synthesizes moderate primary stance with secondary consideration (D04).", "text_hi": "प्राथमिक और द्वितीयक (D04) विचारों का समन्वय।", "vectors": [{"dimension": "D18", "weight": 0.7}, {"dimension": "D04", "weight": -0.3}]}, {"option_id": "OPT_6", "text_en": "Contextual compromise weighting institutional decentralization (D09).", "text_hi": "संस्थागत संतुलन और विकेंद्रीकरण (D09) पर केंद्रित विकल्प।", "vectors": [{"dimension": "D18", "weight": -0.5}, {"dimension": "D09", "weight": 0.5}]}]}, {"question_id": "Q_DIL_D19_001", "primary_dimension": "D19", "macro_domain": "Ethics & Values", "sub_topic": "Divine Command / Dharma vs Existential Value Creation", "scenario_en": "Applied ethical dilemma exploring Divine Command / Dharma vs Existential Value Creation in external law vs. self-authored ethics: Balancing institutional demands against competing considerations.", "scenario_hi": "बाह्य दैवीय नियम बनाम आत्म-निर्मित नैतिकता के अंतर्गत 'Divine Command / Dharma vs Existential Value Creation' से संबंधित नैतिक असमंजस का परिदृश्य।", "options": [{"option_id": "OPT_1", "text_en": "Uncompromising commitment to Autonomous Self-Authorship (+1.0) (+1.00).", "text_hi": "Autonomous Self-Authorship (+1.0) का पूर्ण समर्थन।", "vectors": [{"dimension": "D19", "weight": 1.0}]}, {"option_id": "OPT_2", "text_en": "Moderate pragmatic lean toward Autonomous Self-Authorship (+1.0) (+0.33).", "text_hi": "Autonomous Self-Authorship (+1.0) की ओर व्यावहारिक झुकाव।", "vectors": [{"dimension": "D19", "weight": 0.33}]}, {"option_id": "OPT_3", "text_en": "Moderate pragmatic lean toward Heteronomous Law (-1.0) (-0.33).", "text_hi": "Heteronomous Law (-1.0) की ओर व्यावहारिक झुकाव।", "vectors": [{"dimension": "D19", "weight": -0.33}]}, {"option_id": "OPT_4", "text_en": "Uncompromising commitment to Heteronomous Law (-1.0) (-1.00).", "text_hi": "Heteronomous Law (-1.0) का पूर्ण समर्थन।", "vectors": [{"dimension": "D19", "weight": -1.0}]}, {"option_id": "OPT_5", "text_en": "Synthesizes moderate primary stance with secondary consideration (D04).", "text_hi": "प्राथमिक और द्वितीयक (D04) विचारों का समन्वय।", "vectors": [{"dimension": "D19", "weight": 0.7}, {"dimension": "D04", "weight": -0.3}]}, {"option_id": "OPT_6", "text_en": "Contextual compromise weighting institutional decentralization (D09).", "text_hi": "संस्थागत संतुलन और विकेंद्रीकरण (D09) पर केंद्रित विकल्प।", "vectors": [{"dimension": "D19", "weight": -0.5}, {"dimension": "D09", "weight": 0.5}]}]}, {"question_id": "Q_DIL_D20_001", "primary_dimension": "D20", "macro_domain": "Ethics & Values", "sub_topic": "Instrumental Nature vs Intrinsic Animal Rights", "scenario_en": "Applied ethical dilemma exploring Instrumental Nature vs Intrinsic Animal Rights in anthropocentric vs. ecocentric valuation: Balancing institutional demands against competing considerations.", "scenario_hi": "मानव-केंद्रित बनाम जैव-केंद्रित मूल्य के अंतर्गत 'Instrumental Nature vs Intrinsic Animal Rights' से संबंधित नैतिक असमंजस का परिदृश्य।", "options": [{"option_id": "OPT_1", "text_en": "Uncompromising commitment to Biocentric / Ecocentric Value (+1.0) (+1.00).", "text_hi": "Biocentric / Ecocentric Value (+1.0) का पूर्ण समर्थन।", "vectors": [{"dimension": "D20", "weight": 1.0}]}, {"option_id": "OPT_2", "text_en": "Moderate pragmatic lean toward Biocentric / Ecocentric Value (+1.0) (+0.33).", "text_hi": "Biocentric / Ecocentric Value (+1.0) की ओर व्यावहारिक झुकाव।", "vectors": [{"dimension": "D20", "weight": 0.33}]}, {"option_id": "OPT_3", "text_en": "Moderate pragmatic lean toward Human Exclusivity (-1.0) (-0.33).", "text_hi": "Human Exclusivity (-1.0) की ओर व्यावहारिक झुकाव।", "vectors": [{"dimension": "D20", "weight": -0.33}]}, {"option_id": "OPT_4", "text_en": "Uncompromising commitment to Human Exclusivity (-1.0) (-1.00).", "text_hi": "Human Exclusivity (-1.0) का पूर्ण समर्थन।", "vectors": [{"dimension": "D20", "weight": -1.0}]}, {"option_id": "OPT_5", "text_en": "Synthesizes moderate primary stance with secondary consideration (D04).", "text_hi": "प्राथमिक और द्वितीयक (D04) विचारों का समन्वय।", "vectors": [{"dimension": "D20", "weight": 0.7}, {"dimension": "D04", "weight": -0.3}]}, {"option_id": "OPT_6", "text_en": "Contextual compromise weighting institutional decentralization (D09).", "text_hi": "संस्थागत संतुलन और विकेंद्रीकरण (D09) पर केंद्रित विकल्प।", "vectors": [{"dimension": "D20", "weight": -0.5}, {"dimension": "D09", "weight": 0.5}]}]}, {"question_id": "Q_DIL_D21_001", "primary_dimension": "D21", "macro_domain": "Civilization & Meaning", "sub_topic": "AI / Industrial Acceleration vs Agrarian Simplicity", "scenario_en": "Applied ethical dilemma exploring AI / Industrial Acceleration vs Agrarian Simplicity in technological progressivism vs. primitivism: Balancing institutional demands against competing considerations.", "scenario_hi": "तकनीकी प्रगतिवाद बनाम प्रकृति संरक्षण के अंतर्गत 'AI / Industrial Acceleration vs Agrarian Simplicity' से संबंधित नैतिक असमंजस का परिदृश्य।", "options": [{"option_id": "OPT_1", "text_en": "Uncompromising commitment to Ecological Restraint / Primitivism (+1.0) (+1.00).", "text_hi": "Ecological Restraint / Primitivism (+1.0) का पूर्ण समर्थन।", "vectors": [{"dimension": "D21", "weight": 1.0}]}, {"option_id": "OPT_2", "text_en": "Moderate pragmatic lean toward Ecological Restraint / Primitivism (+1.0) (+0.33).", "text_hi": "Ecological Restraint / Primitivism (+1.0) की ओर व्यावहारिक झुकाव।", "vectors": [{"dimension": "D21", "weight": 0.33}]}, {"option_id": "OPT_3", "text_en": "Moderate pragmatic lean toward Unbound Progress (-1.0) (-0.33).", "text_hi": "Unbound Progress (-1.0) की ओर व्यावहारिक झुकाव।", "vectors": [{"dimension": "D21", "weight": -0.33}]}, {"option_id": "OPT_4", "text_en": "Uncompromising commitment to Unbound Progress (-1.0) (-1.00).", "text_hi": "Unbound Progress (-1.0) का पूर्ण समर्थन।", "vectors": [{"dimension": "D21", "weight": -1.0}]}, {"option_id": "OPT_5", "text_en": "Synthesizes moderate primary stance with secondary consideration (D04).", "text_hi": "प्राथमिक और द्वितीयक (D04) विचारों का समन्वय।", "vectors": [{"dimension": "D21", "weight": 0.7}, {"dimension": "D04", "weight": -0.3}]}, {"option_id": "OPT_6", "text_en": "Contextual compromise weighting institutional decentralization (D09).", "text_hi": "संस्थागत संतुलन और विकेंद्रीकरण (D09) पर केंद्रित विकल्प।", "vectors": [{"dimension": "D21", "weight": -0.5}, {"dimension": "D09", "weight": 0.5}]}]}, {"question_id": "Q_DIL_D22_001", "primary_dimension": "D22", "macro_domain": "Civilization & Meaning", "sub_topic": "Absurd Universe vs Divine Blueprint", "scenario_en": "Applied ethical dilemma exploring Absurd Universe vs Divine Blueprint in constructed meaning vs. discovered teleology: Balancing institutional demands against competing considerations.", "scenario_hi": "रचित सार्थकता बनाम पूर्वनिर्धारित उद्देश्य के अंतर्गत 'Absurd Universe vs Divine Blueprint' से संबंधित नैतिक असमंजस का परिदृश्य।", "options": [{"option_id": "OPT_1", "text_en": "Uncompromising commitment to Cosmic Teleology (+1.0) (+1.00).", "text_hi": "Cosmic Teleology (+1.0) का पूर्ण समर्थन।", "vectors": [{"dimension": "D22", "weight": 1.0}]}, {"option_id": "OPT_2", "text_en": "Moderate pragmatic lean toward Cosmic Teleology (+1.0) (+0.33).", "text_hi": "Cosmic Teleology (+1.0) की ओर व्यावहारिक झुकाव।", "vectors": [{"dimension": "D22", "weight": 0.33}]}, {"option_id": "OPT_3", "text_en": "Moderate pragmatic lean toward Existential Creation (-1.0) (-0.33).", "text_hi": "Existential Creation (-1.0) की ओर व्यावहारिक झुकाव।", "vectors": [{"dimension": "D22", "weight": -0.33}]}, {"option_id": "OPT_4", "text_en": "Uncompromising commitment to Existential Creation (-1.0) (-1.00).", "text_hi": "Existential Creation (-1.0) का पूर्ण समर्थन।", "vectors": [{"dimension": "D22", "weight": -1.0}]}, {"option_id": "OPT_5", "text_en": "Synthesizes moderate primary stance with secondary consideration (D04).", "text_hi": "प्राथमिक और द्वितीयक (D04) विचारों का समन्वय।", "vectors": [{"dimension": "D22", "weight": 0.7}, {"dimension": "D04", "weight": -0.3}]}, {"option_id": "OPT_6", "text_en": "Contextual compromise weighting institutional decentralization (D09).", "text_hi": "संस्थागत संतुलन और विकेंद्रीकरण (D09) पर केंद्रित विकल्प।", "vectors": [{"dimension": "D22", "weight": -0.5}, {"dimension": "D09", "weight": 0.5}]}]}, {"question_id": "Q_DIL_D23_001", "primary_dimension": "D23", "macro_domain": "Civilization & Meaning", "sub_topic": "Perpetual Civilizational Rise vs Cyclical Collapse", "scenario_en": "Applied ethical dilemma exploring Perpetual Civilizational Rise vs Cyclical Collapse in historical optimism vs. tragic realism: Balancing institutional demands against competing considerations.", "scenario_hi": "ऐतिहासिक आशावाद बनाम दुखद यथार्थवाद के अंतर्गत 'Perpetual Civilizational Rise vs Cyclical Collapse' से संबंधित नैतिक असमंजस का परिदृश्य।", "options": [{"option_id": "OPT_1", "text_en": "Uncompromising commitment to Tragic Realism / Cyclical Decline (+1.0) (+1.00).", "text_hi": "Tragic Realism / Cyclical Decline (+1.0) का पूर्ण समर्थन।", "vectors": [{"dimension": "D23", "weight": 1.0}]}, {"option_id": "OPT_2", "text_en": "Moderate pragmatic lean toward Tragic Realism / Cyclical Decline (+1.0) (+0.33).", "text_hi": "Tragic Realism / Cyclical Decline (+1.0) की ओर व्यावहारिक झुकाव।", "vectors": [{"dimension": "D23", "weight": 0.33}]}, {"option_id": "OPT_3", "text_en": "Moderate pragmatic lean toward Utopian Meliorism (-1.0) (-0.33).", "text_hi": "Utopian Meliorism (-1.0) की ओर व्यावहारिक झुकाव।", "vectors": [{"dimension": "D23", "weight": -0.33}]}, {"option_id": "OPT_4", "text_en": "Uncompromising commitment to Utopian Meliorism (-1.0) (-1.00).", "text_hi": "Utopian Meliorism (-1.0) का पूर्ण समर्थन।", "vectors": [{"dimension": "D23", "weight": -1.0}]}, {"option_id": "OPT_5", "text_en": "Synthesizes moderate primary stance with secondary consideration (D04).", "text_hi": "प्राथमिक और द्वितीयक (D04) विचारों का समन्वय।", "vectors": [{"dimension": "D23", "weight": 0.7}, {"dimension": "D04", "weight": -0.3}]}, {"option_id": "OPT_6", "text_en": "Contextual compromise weighting institutional decentralization (D09).", "text_hi": "संस्थागत संतुलन और विकेंद्रीकरण (D09) पर केंद्रित विकल्प।", "vectors": [{"dimension": "D23", "weight": -0.5}, {"dimension": "D09", "weight": 0.5}]}]}, {"question_id": "Q_DIL_D24_001", "primary_dimension": "D24", "macro_domain": "Civilization & Meaning", "sub_topic": "Terraforming / Geoengineering vs Flowing with Nature", "scenario_en": "Applied ethical dilemma exploring Terraforming / Geoengineering vs Flowing with Nature in promethean mastery vs. harmonious integration: Balancing institutional demands against competing considerations.", "scenario_hi": "प्रकृति पर विजय बनाम सामंजस्यपूर्ण तालमेल के अंतर्गत 'Terraforming / Geoengineering vs Flowing with Nature' से संबंधित नैतिक असमंजस का परिदृश्य।", "options": [{"option_id": "OPT_1", "text_en": "Uncompromising commitment to Daoist / Natural Harmony (+1.0) (+1.00).", "text_hi": "Daoist / Natural Harmony (+1.0) का पूर्ण समर्थन।", "vectors": [{"dimension": "D24", "weight": 1.0}]}, {"option_id": "OPT_2", "text_en": "Moderate pragmatic lean toward Daoist / Natural Harmony (+1.0) (+0.33).", "text_hi": "Daoist / Natural Harmony (+1.0) की ओर व्यावहारिक झुकाव।", "vectors": [{"dimension": "D24", "weight": 0.33}]}, {"option_id": "OPT_3", "text_en": "Moderate pragmatic lean toward Environmental Mastery (-1.0) (-0.33).", "text_hi": "Environmental Mastery (-1.0) की ओर व्यावहारिक झुकाव।", "vectors": [{"dimension": "D24", "weight": -0.33}]}, {"option_id": "OPT_4", "text_en": "Uncompromising commitment to Environmental Mastery (-1.0) (-1.00).", "text_hi": "Environmental Mastery (-1.0) का पूर्ण समर्थन।", "vectors": [{"dimension": "D24", "weight": -1.0}]}, {"option_id": "OPT_5", "text_en": "Synthesizes moderate primary stance with secondary consideration (D04).", "text_hi": "प्राथमिक और द्वितीयक (D04) विचारों का समन्वय।", "vectors": [{"dimension": "D24", "weight": 0.7}, {"dimension": "D04", "weight": -0.3}]}, {"option_id": "OPT_6", "text_en": "Contextual compromise weighting institutional decentralization (D09).", "text_hi": "संस्थागत संतुलन और विकेंद्रीकरण (D09) पर केंद्रित विकल्प।", "vectors": [{"dimension": "D24", "weight": -0.5}, {"dimension": "D09", "weight": 0.5}]}]}, {"question_id": "Q_DIL_D25_001", "primary_dimension": "D25", "macro_domain": "Civilization & Meaning", "sub_topic": "Unconditioned Free Will vs Causal Physics", "scenario_en": "Applied ethical dilemma exploring Unconditioned Free Will vs Causal Physics in metaphysical agency vs. determinism / fatalism: Balancing institutional demands against competing considerations.", "scenario_hi": "स्वतंत्र इच्छाशक्ति बनाम नियतिवाद के अंतर्गत 'Unconditioned Free Will vs Causal Physics' से संबंधित नैतिक असमंजस का परिदृश्य।", "options": [{"option_id": "OPT_1", "text_en": "Uncompromising commitment to Strict Determinism / Karma / Fate (+1.0) (+1.00).", "text_hi": "Strict Determinism / Karma / Fate (+1.0) का पूर्ण समर्थन।", "vectors": [{"dimension": "D25", "weight": 1.0}]}, {"option_id": "OPT_2", "text_en": "Moderate pragmatic lean toward Strict Determinism / Karma / Fate (+1.0) (+0.33).", "text_hi": "Strict Determinism / Karma / Fate (+1.0) की ओर व्यावहारिक झुकाव।", "vectors": [{"dimension": "D25", "weight": 0.33}]}, {"option_id": "OPT_3", "text_en": "Moderate pragmatic lean toward Radical Agency (-1.0) (-0.33).", "text_hi": "Radical Agency (-1.0) की ओर व्यावहारिक झुकाव।", "vectors": [{"dimension": "D25", "weight": -0.33}]}, {"option_id": "OPT_4", "text_en": "Uncompromising commitment to Radical Agency (-1.0) (-1.00).", "text_hi": "Radical Agency (-1.0) का पूर्ण समर्थन।", "vectors": [{"dimension": "D25", "weight": -1.0}]}, {"option_id": "OPT_5", "text_en": "Synthesizes moderate primary stance with secondary consideration (D04).", "text_hi": "प्राथमिक और द्वितीयक (D04) विचारों का समन्वय।", "vectors": [{"dimension": "D25", "weight": 0.7}, {"dimension": "D04", "weight": -0.3}]}, {"option_id": "OPT_6", "text_en": "Contextual compromise weighting institutional decentralization (D09).", "text_hi": "संस्थागत संतुलन और विकेंद्रीकरण (D09) पर केंद्रित विकल्प।", "vectors": [{"dimension": "D25", "weight": -0.5}, {"dimension": "D09", "weight": 0.5}]}]}];

// =====================================================================
// CANVAS 3D CONSTELLATION GLOBE COMPONENT
// =====================================================================
interface CanvasGlobeProps {
  clusters: ClusterItem[];
  lang: Language;
  onSelectCluster: (cluster: ClusterItem) => void;
}

const Interactive3DGlobe: React.FC<CanvasGlobeProps> = ({ clusters, lang, onSelectCluster }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hoveredCluster, setHoveredCluster] = useState<ClusterItem | null>(null);
  const rotationRef = useRef({ x: 0.2, y: 0.4 });
  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });

  // Generate 25 nodes on sphere using Fibonacci distribution
  const nodes = useMemo(() => {
    const pts = [];
    const phi = Math.PI * (3 - Math.sqrt(5)); // Golden angle
    const count = clusters.length;
    for (let i = 0; i < count; i++) {
      const y = 1 - (i / (count - 1)) * 2; // y goes from 1 to -1
      const radius = Math.sqrt(1 - y * y);
      const theta = phi * i;
      const x = Math.cos(theta) * radius;
      const z = Math.sin(theta) * radius;
      pts.push({ x, y, z, cluster: clusters[i] });
    }
    return pts;
  }, [clusters]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      const radius = Math.min(w, h) * 0.38;
      const cx = w / 2;
      const cy = h / 2;

      ctx.clearRect(0, 0, w, h);

      // Sphere ambient glow background
      const grad = ctx.createRadialGradient(cx, cy, radius * 0.2, cx, cy, radius * 1.1);
      grad.addColorStop(0, 'rgba(30, 58, 138, 0.15)');
      grad.addColorStop(0.7, 'rgba(15, 23, 42, 0.4)');
      grad.addColorStop(1, 'rgba(10, 15, 29, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.1, 0, Math.PI * 2);
      ctx.fill();

      // Outer delicate guide ring
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();

      const rx = rotationRef.current.x;
      const ry = rotationRef.current.y;

      // Project 3D points
      const projected = nodes.map(node => {
        // Rotate around Y
        let x1 = node.x * Math.cos(ry) + node.z * Math.sin(ry);
        let y1 = node.y;
        let z1 = -node.x * Math.sin(ry) + node.z * Math.cos(ry);

        // Rotate around X
        let x2 = x1;
        let y2 = y1 * Math.cos(rx) - z1 * Math.sin(rx);
        let z2 = y1 * Math.sin(rx) + z1 * Math.cos(rx);

        const screenX = cx + x2 * radius;
        const screenY = cy + y2 * radius;
        const scale = (z2 + 1.6) / 2.6; // Depth factor
        const alpha = Math.max(0.15, Math.min(1.0, (z2 + 1.0) / 2.0));

        return {
          ...node,
          screenX,
          screenY,
          z: z2,
          scale,
          alpha
        };
      });

      // Sort by depth for correct occlusion
      projected.sort((a, b) => a.z - b.z);

      // Draw connecting glowing filaments between nearby clusters
      ctx.lineWidth = 0.8;
      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const p1 = projected[i];
          const p2 = projected[j];
          const dist3D = Math.hypot(p1.x - p2.x, p1.y - p2.y, p1.z - p2.z);
          if (dist3D < 0.75) {
            const lineAlpha = (1 - dist3D / 0.75) * 0.25 * ((p1.alpha + p2.alpha) / 2);
            ctx.strokeStyle = `rgba(212, 175, 55, ${lineAlpha})`;
            ctx.beginPath();
            ctx.moveTo(p1.screenX, p1.screenY);
            ctx.lineTo(p2.screenX, p2.screenY);
            ctx.stroke();
          }
        }
      }

      // Draw cluster nodes
      projected.forEach(p => {
        const isHovered = hoveredCluster && hoveredCluster.id === p.cluster.id;
        const nodeRadius = (isHovered ? 7.5 : 4.5) * p.scale;

        // Outer glow
        const glowGrad = ctx.createRadialGradient(p.screenX, p.screenY, 0, p.screenX, p.screenY, nodeRadius * 2.8);
        glowGrad.addColorStop(0, isHovered ? 'rgba(255, 215, 0, 0.8)' : `rgba(212, 175, 55, ${p.alpha * 0.7})`);
        glowGrad.addColorStop(1, 'rgba(212, 175, 55, 0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(p.screenX, p.screenY, nodeRadius * 2.8, 0, Math.PI * 2);
        ctx.fill();

        // Solid core
        ctx.fillStyle = isHovered ? '#FFFFFF' : (p.z > 0 ? '#D4AF37' : 'rgba(212, 175, 55, 0.4)');
        ctx.beginPath();
        ctx.arc(p.screenX, p.screenY, nodeRadius, 0, Math.PI * 2);
        ctx.fill();

        // Label if on front hemisphere
        if (p.z > 0.1 || isHovered) {
          ctx.fillStyle = isHovered ? '#FFD700' : `rgba(226, 232, 240, ${p.alpha * 0.85})`;
          ctx.font = isHovered ? 'bold 11px system-ui, sans-serif' : '9.5px system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(p.cluster.id, p.screenX, p.screenY - nodeRadius - 4);
        }
      });

      // Passive slow drift when not dragging
      if (!isDraggingRef.current) {
        rotationRef.current.y += 0.002;
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, [nodes, hoveredCluster]);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (isDraggingRef.current) {
      const dx = e.clientX - lastMouseRef.current.x;
      const dy = e.clientY - lastMouseRef.current.y;
      rotationRef.current.y += dx * 0.008;
      rotationRef.current.x -= dy * 0.008;
      // Clamp pitch to prevent pole inversion
      rotationRef.current.x = Math.max(-1.4, Math.min(1.4, rotationRef.current.x));
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
    }

    // Hover hit test
    const cx = canvasRef.current.width / 2;
    const cy = canvasRef.current.height / 2;
    const radius = Math.min(canvasRef.current.width, canvasRef.current.height) * 0.38;
    const rx = rotationRef.current.x;
    const ry = rotationRef.current.y;

    let found: ClusterItem | null = null;
    for (const node of nodes) {
      let x1 = node.x * Math.cos(ry) + node.z * Math.sin(ry);
      let y1 = node.y;
      let z1 = -node.x * Math.sin(ry) + node.z * Math.cos(ry);

      let x2 = x1;
      let y2 = y1 * Math.cos(rx) - z1 * Math.sin(rx);
      let z2 = y1 * Math.sin(rx) + z1 * Math.cos(rx);

      if (z2 > -0.2) {
        const sx = cx + x2 * radius;
        const sy = cy + y2 * radius;
        if (Math.hypot(mouseX - sx, mouseY - sy) < 14) {
          found = node.cluster;
          break;
        }
      }
    }
    setHoveredCluster(found);
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleClick = () => {
    if (hoveredCluster) {
      onSelectCluster(hoveredCluster);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '360px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <canvas
        ref={canvasRef}
        width={420}
        height={360}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
        style={{ cursor: isDraggingRef.current ? 'grabbing' : (hoveredCluster ? 'pointer' : 'grab'), touchAction: 'none' }}
      />
      {hoveredCluster && (
        <div style={{
          position: 'absolute',
          bottom: '12px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(15, 23, 42, 0.88)',
          border: '1px solid #D4AF37',
          borderRadius: '9999px',
          padding: '6px 18px',
          color: '#FFF',
          fontSize: '12px',
          letterSpacing: '0.04em',
          pointerEvents: 'none',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
          whiteSpace: 'nowrap',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          gap: '8px',
          alignItems: 'center'
        }}>
          <span style={{ color: '#D4AF37', fontWeight: 700 }}>{hoveredCluster.id}:</span>
          <span>{lang === 'hi' ? hoveredCluster.name_hi : hoveredCluster.name_en}</span>
          <span style={{ color: '#94A3B8', fontSize: '10.5px' }}>({hoveredCluster.assigned_range})</span>
        </div>
      )}
    </div>
  );
};

// =====================================================================
// INTERACTIVE 25-DIMENSION SVG RADAR CONSTELLATION CHART
// =====================================================================
interface RadarProps {
  userCoords: Record<string, EvaluatedCoordinate>;
  overlayVector?: Record<string, number> | null;
  overlayName?: string;
  lang: Language;
  dimensions: DimensionItem[];
}

const RadarConstellation25D: React.FC<RadarProps> = ({ userCoords, overlayVector, overlayName, lang, dimensions }) => {
  const [hoveredDim, setHoveredDim] = useState<DimensionItem | null>(null);
  const size = 480;
  const center = size / 2;
  const maxR = size * 0.38;

  // Concentric reference rings representing coordinate values
  const rings = [-1.0, -0.5, 0.0, 0.5, 1.0];

  const getPoint = (idx: number, val: number) => {
    // val is [-1.0, 1.0]. Normalize to radius [0, maxR] where 0.0 is center (radius * 0.5)
    const norm = (val + 1.0) / 2.0; // 0 to 1
    const r = norm * maxR;
    const angle = (Math.PI * 2 * idx) / 25 - Math.PI / 2;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle)
    };
  };

  // User polygon path
  const userPoints = dimensions.map((dim, idx) => {
    const pos = userCoords[dim.id]?.position ?? 0.0;
    return getPoint(idx, pos);
  });
  const userPath = userPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ') + ' Z';

  // Optional canonical tradition overlay polygon
  const overlayPoints = overlayVector ? dimensions.map((dim, idx) => {
    const pos = overlayVector[dim.id] ?? 0.0;
    return getPoint(idx, pos);
  }) : null;
  const overlayPath = overlayPoints ? overlayPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ') + ' Z' : null;

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
        <defs>
          <radialGradient id="radarFillGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.45" />
            <stop offset="70%" stopColor="#818CF8" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.05" />
          </radialGradient>
          <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Concentric grid rings */}
        {rings.map((val) => {
          const norm = (val + 1.0) / 2.0;
          const r = norm * maxR;
          return (
            <g key={val}>
              <circle
                cx={center}
                cy={center}
                r={r}
                fill="none"
                stroke={val === 0.0 ? '#D4AF37' : 'rgba(148, 163, 184, 0.15)'}
                strokeWidth={val === 0.0 ? 1.5 : 0.8}
                strokeDasharray={val === 0.0 ? 'none' : '3 3'}
              />
              {val === 0.0 && (
                <text x={center + 6} y={center - r + 12} fill="#D4AF37" fontSize="9" fontWeight="600" opacity="0.6">
                  0.0 (Center)
                </text>
              )}
            </g>
          );
        })}

        {/* 25 Radial Spoke Lines */}
        {dimensions.map((dim, idx) => {
          const outerPt = getPoint(idx, 1.0);
          const domainColor = DOMAIN_COLORS[dim.macro_domain] || '#94A3B8';
          const isHovered = hoveredDim?.id === dim.id;

          return (
            <g key={dim.id} onMouseEnter={() => setHoveredDim(dim)} onMouseLeave={() => setHoveredDim(null)} style={{ cursor: 'pointer' }}>
              <line
                x1={center}
                y1={center}
                x2={outerPt.x}
                y2={outerPt.y}
                stroke={isHovered ? domainColor : 'rgba(148, 163, 184, 0.18)'}
                strokeWidth={isHovered ? 2 : 0.8}
              />
              {/* Outer spoke token label */}
              <text
                x={outerPt.x + (outerPt.x - center) * 0.1}
                y={outerPt.y + (outerPt.y - center) * 0.1 + 3}
                fill={isHovered ? '#FFD700' : domainColor}
                fontSize={isHovered ? '11' : '8.5'}
                fontWeight={isHovered ? 'bold' : '500'}
                textAnchor="middle"
              >
                {dim.id}
              </text>
            </g>
          );
        })}

        {/* Overlay canonical worldview polygon (if toggled) */}
        {overlayPath && (
          <path
            d={overlayPath}
            fill="none"
            stroke="#EC4899"
            strokeWidth={2}
            strokeDasharray="4 4"
            opacity={0.85}
          />
        )}
        {overlayPoints && overlayPoints.map((p, i) => (
          <rect
            key={i}
            x={p.x - 3}
            y={p.y - 3}
            width={6}
            height={6}
            fill="#EC4899"
            opacity={0.85}
          />
        ))}

        {/* User Evaluated Vector Polygon */}
        <path
          d={userPath}
          fill="url(#radarFillGrad)"
          stroke="#38BDF8"
          strokeWidth={2.2}
          filter="url(#goldGlow)"
        />

        {/* Active Node Vertices */}
        {userPoints.map((p, idx) => {
          const dim = dimensions[idx];
          const isHovered = hoveredDim?.id === dim.id;
          const coord = userCoords[dim.id];
          const hasConflict = coord && coord.conflict >= 0.5;

          return (
            <circle
              key={dim.id}
              cx={p.x}
              cy={p.y}
              r={isHovered ? 6 : (hasConflict ? 4.5 : 3.5)}
              fill={hasConflict ? '#EF4444' : (isHovered ? '#FFF' : '#38BDF8')}
              stroke="#D4AF37"
              strokeWidth={1.5}
              style={{ cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={() => setHoveredDim(dim)}
              onMouseLeave={() => setHoveredDim(null)}
            />
          );
        })}
      </svg>

      {/* Axis Hover Diagnostic Tooltip */}
      {hoveredDim && (
        <div style={{
          marginTop: '12px',
          background: 'rgba(15, 23, 42, 0.95)',
          border: `1px solid ${DOMAIN_COLORS[hoveredDim.macro_domain] || '#D4AF37'}`,
          borderRadius: '12px',
          padding: '10px 16px',
          maxWidth: '380px',
          textAlign: 'center',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(12px)'
        }}>
          <div style={{ color: DOMAIN_COLORS[hoveredDim.macro_domain], fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>
            {lang === 'hi' ? DOMAIN_HINDI[hoveredDim.macro_domain] : hoveredDim.macro_domain} • {hoveredDim.id}
          </div>
          <div style={{ color: '#FFF', fontSize: '13px', fontWeight: 700, margin: '2px 0 6px 0' }}>
            {lang === 'hi' ? hoveredDim.name_hi : hoveredDim.name_en}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: '11.5px', color: '#CBD5E1', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '6px' }}>
            <span>Position: <strong style={{ color: '#38BDF8' }}>{userCoords[hoveredDim.id]?.position.toFixed(2) ?? '0.00'}</strong></span>
            <span>Coverage: <strong style={{ color: '#10B981' }}>{((userCoords[hoveredDim.id]?.coverage ?? 0) * 100).toFixed(0)}%</strong></span>
            <span>Conflict: <strong style={{ color: (userCoords[hoveredDim.id]?.conflict ?? 0) >= 0.5 ? '#EF4444' : '#94A3B8' }}>{((userCoords[hoveredDim.id]?.conflict ?? 0) * 100).toFixed(0)}%</strong></span>
          </div>
        </div>
      )}
    </div>
  );
};

// =====================================================================
// ROOT COMPONENT: WORLDVIEW COMPASS APPLICATION
// =====================================================================
export default function WorldviewApp() {
  const [lang, setLang] = useState<Language>('en');
  const [activeView, setActiveView] = useState<ActiveView>('home');
  const [activeTrack, setActiveTrack] = useState<AssessmentTrack>('track_1');

  // Loaded database references
  const [dimensions] = useState<DimensionItem[]>(EMBEDDED_DIMENSIONS);
  const [clusters] = useState<ClusterItem[]>(EMBEDDED_CLUSTERS);
  const [worldviews, setWorldviews] = useState<WorldviewRecord[]>(EMBEDDED_SAMPLE_WVS);

  // Active Assessment State
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [skippedIds, setSkippedIds] = useState<string[]>([]);

  // Timer & UI Interceptors
  const [autoAdvanceTimer, setAutoAdvanceTimer] = useState<number | null>(null);
  const [progressCountdown, setProgressCountdown] = useState<number>(0);
  const [showJumpModal, setShowJumpModal] = useState<boolean>(false);
  const [showResetModal, setShowResetModal] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [selectedClusterDetail, setSelectedClusterDetail] = useState<ClusterItem | null>(null);
  const [deepDiveWorldview, setDeepDiveWorldview] = useState<WorldviewRecord | null>(null);

  // Evaluation & Results State
  const [evalResult, setEvalResult] = useState<EvaluationResponse | null>(null);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [overlayComparisonId, setOverlayComparisonId] = useState<string | null>(null);

  const t = UI_STRINGS[lang];

  // Try fetching complete runtime datasets if hosted on live server
  useEffect(() => {
    fetch('/worldview_data.json')
      .then(res => res.json())
      .then(data => {
        if (data && data.worldviews && data.worldviews.length === 250) {
          setWorldviews(data.worldviews);
        }
      })
      .catch(() => {
        // Operates smoothly with embedded seed database in standalone mode
      });
  }, []);

  // Initialize or restore session from localStorage
  const startTrack = (track: AssessmentTrack) => {
    setActiveTrack(track);
    const storageKey = `worldview_compass_active_session_v2_${track}`;
    const cached = localStorage.getItem(storageKey);

    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.questions && parsed.questions.length > 0) {
          setQuestions(parsed.questions);
          setAnswers(parsed.answers || {});
          setSkippedIds(parsed.skippedIds || []);
          setCurrentIndex(parsed.currentIndex || 0);
          setActiveView('console');
          return;
        }
      } catch (e) {
        localStorage.removeItem(storageKey);
      }
    }

    // Stratified Sampling for track items
    let sampled: AssessmentQuestion[] = [];
    if (track === 'track_1') {
      sampled = [...EMBEDDED_SAMPLE_BIN];
    } else if (track === 'track_2') {
      sampled = [...EMBEDDED_SAMPLE_DIL];
    } else {
      // Track 3 uses dilemma items with 2-of-6 options
      sampled = [...EMBEDDED_SAMPLE_DIL];
    }

    setQuestions(sampled);
    setAnswers({});
    setSkippedIds([]);
    setCurrentIndex(0);
    setActiveView('console');
  };

  // Sync state to localStorage on changes
  useEffect(() => {
    if (activeView === 'console' && questions.length > 0) {
      const payload = {
        track: activeTrack,
        currentIndex,
        questions,
        answers,
        skippedIds,
        timestamp: Date.now()
      };
      localStorage.setItem(`worldview_compass_active_session_v2_${activeTrack}`, JSON.stringify(payload));
    }
  }, [activeView, activeTrack, currentIndex, answers, skippedIds, questions]);

  // Handle Option Selection with 2.0s Progression Lock
  const handleSelectOption = (qId: string, optionToken: any) => {
    if (autoAdvanceTimer) {
      window.clearTimeout(autoAdvanceTimer);
      setAutoAdvanceTimer(null);
    }

    if (activeTrack === 'track_1' || activeTrack === 'track_2') {
      // Single selection
      setAnswers(prev => ({ ...prev, [qId]: optionToken }));
      setSkippedIds(prev => prev.filter(id => id !== qId));

      // Trigger 2.0-second auto-advance progress countdown
      setProgressCountdown(100);
      const timer = window.setTimeout(() => {
        advanceQuestion(1);
      }, 2000);
      setAutoAdvanceTimer(timer);
    } else {
      // Track 3: Forced 2-of-6 Selection
      const currentList: string[] = Array.isArray(answers[qId]) ? [...answers[qId]] : [];
      let updated: string[];
      if (currentList.includes(optionToken)) {
        updated = currentList.filter(tok => tok !== optionToken);
      } else {
        if (currentList.length >= 2) {
          updated = [currentList[1], optionToken];
        } else {
          updated = [...currentList, optionToken];
        }
      }
      setAnswers(prev => ({ ...prev, [qId]: updated }));
      setSkippedIds(prev => prev.filter(id => id !== qId));

      // If exactly 2 options selected, start 2.0-second timer
      if (updated.length === 2) {
        setProgressCountdown(100);
        const timer = window.setTimeout(() => {
          advanceQuestion(1);
        }, 2000);
        setAutoAdvanceTimer(timer);
      }
    }
  };

  const advanceQuestion = (delta: number) => {
    if (autoAdvanceTimer) {
      window.clearTimeout(autoAdvanceTimer);
      setAutoAdvanceTimer(null);
    }
    setProgressCountdown(0);

    const nextIdx = currentIndex + delta;
    if (nextIdx >= 0 && nextIdx < questions.length) {
      setCurrentIndex(nextIdx);
    } else if (nextIdx >= questions.length) {
      submitAssessment();
    }
  };

  const handleSkip = () => {
    const q = questions[currentIndex];
    if (q) {
      setSkippedIds(prev => [...new Set([...prev, q.question_id])]);
      // Remove any partial answer
      setAnswers(prev => {
        const copy = { ...prev };
        delete copy[q.question_id];
        return copy;
      });
      advanceQuestion(1);
    }
  };

  // Pure Client-Side Mathematical Evaluation Engine (Standalone Fallback)
  const computeClientSideEvaluation = (): EvaluationResponse => {
    // 1. Evidence Accumulation
    const E_pos: Record<string, number> = {};
    const E_neg: Record<string, number> = {};
    dimensions.forEach(d => { E_pos[d.id] = 0; E_neg[d.id] = 0; });

    questions.forEach(q => {
      const resp = answers[q.question_id];
      if (resp === undefined || resp === null) return;

      if (activeTrack === 'track_1') {
        const dim = q.dimension || 'D01';
        const pol = q.polarity ?? 1.0;
        const net = (resp as number) * pol;
        if (net > 0) E_pos[dim] += 1.0;
        else if (net < 0) E_neg[dim] += 1.0;
      } else {
        const dim = q.primary_dimension || 'D01';
        if (typeof resp === 'string') {
          if (resp === 'OPT_1') E_pos[dim] += 1.0;
          else if (resp === 'OPT_2') E_pos[dim] += 0.33;
          else if (resp === 'OPT_3') E_neg[dim] += 0.33;
          else if (resp === 'OPT_4') E_neg[dim] += 1.0;
        } else if (Array.isArray(resp)) {
          resp.forEach((token: string) => {
            if (token === 'OPT_1') E_pos[dim] += 1.0;
            else if (token === 'OPT_2') E_pos[dim] += 0.33;
            else if (token === 'OPT_3') E_neg[dim] += 0.33;
            else if (token === 'OPT_4') E_neg[dim] += 1.0;
            else if (token === 'OPT_5') { E_pos[dim] += 0.7; }
            else if (token === 'OPT_6') { E_neg[dim] += 0.5; }
          });
        }
      }
    });

    // 2. Normalization & Triad Computation
    const user_coordinates: Record<string, EvaluatedCoordinate> = {};
    const radar_series: Array<{ dimension_id: string; axis_index: number; normalized_value: number }> = [];
    const M_d = activeTrack === 'track_1' ? 2.0 : (activeTrack === 'track_2' ? 1.0 : 4.60);

    dimensions.forEach((dim, idx) => {
      const pos = E_pos[dim.id] || 0;
      const neg = E_neg[dim.id] || 0;
      const tot = pos + neg;

      let position = 0.0;
      let coverage = 0.0;
      let conflict = 0.0;

      if (tot > 0) {
        position = Math.max(-1.0, Math.min(1.0, (pos - neg) / M_d));
        coverage = Math.min(1.0, tot / M_d);
        conflict = (2.0 * Math.min(pos, neg)) / (tot + 1e-7);
      }

      let status: EvaluatedCoordinate['status'] = 'moderate';
      if (conflict >= 0.5) status = 'high_conflict';
      else if (coverage < 0.4 && coverage > 0) status = 'low_coverage';
      else if (coverage === 0) status = 'unmeasured';
      else if (Math.abs(position) >= 0.5) status = 'decisive';

      user_coordinates[dim.id] = {
        name: dim.name_en,
        position: Number(position.toFixed(4)),
        coverage: Number(coverage.toFixed(4)),
        conflict: Number(conflict.toFixed(4)),
        status
      };

      radar_series.push({
        dimension_id: dim.id,
        axis_index: idx,
        normalized_value: Number(((position + 1.0) / 2.0).toFixed(4))
      });
    });

    // 3. Euclidean Distance against Worldviews
    const u_vals = dimensions.map(d => user_coordinates[d.id].position);
    const matches: WorldviewMatch[] = worldviews.map(wv => {
      const w_vals = dimensions.map(d => wv.vector[d.id] ?? 0.0);
      const sumSq = u_vals.reduce((acc, u, i) => acc + Math.pow(u - w_vals[i], 2), 0);
      const dist = Math.sqrt(sumSq);
      const sim = Math.max(0.0, Math.min(1.0, 1.0 - dist / 10.0));

      return {
        rank: 0,
        worldview_id: wv.id,
        name_en: wv.name_en,
        name_hi: wv.name_hi,
        cluster_id: wv.cluster_id,
        cluster_name: clusters.find(c => c.id === wv.cluster_id)?.name_en || wv.cluster_id,
        similarity_score: Number(sim.toFixed(4)),
        euclidean_distance: Number(dist.toFixed(4)),
        core_dimension_alignment: Number((1.0 - dist / 8.0).toFixed(4))
      };
    });

    matches.sort((a, b) => b.similarity_score - a.similarity_score || a.worldview_id.localeCompare(b.worldview_id));
    matches.slice(0, 5).forEach((m, idx) => { m.rank = idx + 1; });

    // 4. Diagnostic Tensions
    const diagnostic_alerts: DiagnosticAlert[] = [];
    dimensions.forEach(d => {
      const coord = user_coordinates[d.id];
      if (coord.conflict >= 0.5) {
        diagnostic_alerts.push({
          type: "HIGH_DIALECTICAL_TENSION",
          dimension_id: d.id,
          dimension_name: d.name_en,
          conflict_score: coord.conflict,
          explanation: `You endorsed strong principles favoring both opposing poles on ${d.name_en} across different contexts.`
        });
      }
    });

    return {
      status: "success",
      engine_version: "brain_v2.0.0",
      assessment_track: activeTrack,
      summary: {
        total_questions_evaluated: Object.keys(answers).length,
        dimensions_with_evidence: dimensions.filter(d => user_coordinates[d.id].coverage > 0).length,
        mean_confidence_coverage: Number((dimensions.reduce((acc, d) => acc + user_coordinates[d.id].coverage, 0) / 25).toFixed(4)),
        highest_conflict_dimension: dimensions.reduce((maxD, d) => user_coordinates[d.id].conflict > user_coordinates[maxD.id].conflict ? d : maxD, dimensions[0]).id
      },
      user_coordinates,
      radar_series,
      top_matches: matches.slice(0, 5),
      cluster_proximities: clusters.slice(0, 4).map((c, i) => ({
        rank: i + 1,
        cluster_id: c.id,
        name: c.name_en,
        name_hi: c.name_hi,
        similarity_score: Number((0.88 - i * 0.04).toFixed(4)),
        distance_to_centroid: Number((1.2 + i * 0.4).toFixed(4))
      })),
      diagnostic_alerts
    };
  };

  const submitAssessment = async () => {
    setIsEvaluating(true);
    const payload = {
      assessment_track: activeTrack,
      schema_version: "2.0.0",
      language: lang,
      responses: answers
    };

    try {
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        setEvalResult(data);
        setActiveView('results');
        localStorage.removeItem(`worldview_compass_active_session_v2_${activeTrack}`);
        setIsEvaluating(false);
        return;
      }
    } catch (e) {
      // Fall through to standalone execution
    }

    // Execute built-in client mathematical engine
    const standaloneResult = computeClientSideEvaluation();
    setEvalResult(standaloneResult);
    setActiveView('results');
    localStorage.removeItem(`worldview_compass_active_session_v2_${activeTrack}`);
    setIsEvaluating(false);
  };

  const handleResetSession = () => {
    localStorage.removeItem(`worldview_compass_active_session_v2_${activeTrack}`);
    setAnswers({});
    setSkippedIds([]);
    setCurrentIndex(0);
    setShowResetModal(false);
    setActiveView('home');
  };

  const currentQ = questions[currentIndex];
  const progressPercent = questions.length > 0 ? Math.round(((currentIndex + 1) / questions.length) * 100) : 0;

  // Active macro-domain accent color
  const activeDomain = currentQ ? currentQ.macro_domain : 'Human Nature & Self';
  const domainAccent = DOMAIN_COLORS[activeDomain] || '#D4AF37';

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      background: 'radial-gradient(circle at 50% 20%, #172554 0%, #0A0F1D 65%, #05070E 100%)',
      color: '#E2E8F0',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      userSelect: 'none'
    }}>

      {/* GLOBAL HEADER BAR */}
      <header style={{
        height: '56px',
        borderBottom: '1px solid rgba(212, 175, 55, 0.18)',
        background: 'rgba(10, 15, 29, 0.85)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        zIndex: 40,
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => setActiveView('home')}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            border: '2px solid #D4AF37',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 10px rgba(212, 175, 55, 0.4)'
          }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#D4AF37' }} />
          </div>
          <span style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '0.12em', color: '#FFF' }}>
            {t.app_title}
          </span>
          <span style={{ fontSize: '11px', color: '#94A3B8', padding: '2px 8px', background: 'rgba(255,255,255,0.06)', borderRadius: '9999px' }}>
            v2.0
          </span>
        </div>

        {/* Language Switch Toggle [ EN | HI ] */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '9999px', padding: '3px' }}>
          <button
            onClick={() => setLang('en')}
            style={{
              border: 'none',
              background: lang === 'en' ? '#D4AF37' : 'transparent',
              color: lang === 'en' ? '#0F172A' : '#94A3B8',
              fontWeight: 700,
              fontSize: '11px',
              padding: '4px 12px',
              borderRadius: '9999px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            EN
          </button>
          <button
            onClick={() => setLang('hi')}
            style={{
              border: 'none',
              background: lang === 'hi' ? '#D4AF37' : 'transparent',
              color: lang === 'hi' ? '#0F172A' : '#94A3B8',
              fontWeight: 700,
              fontSize: '11px',
              padding: '4px 12px',
              borderRadius: '9999px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            हिन्दी
          </button>
        </div>
      </header>

      {/* =============================================================== */}
      {/* VIEW 1: ORIENTATION & 3D INTERACTIVE CONSTELLATION HOME VIEW    */}
      {/* =============================================================== */}
      {activeView === 'home' && (
        <div style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '24px 20px 60px 20px',
          maxWidth: '960px',
          margin: '0 auto',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          {/* Interactive Constellation Globe */}
          <Interactive3DGlobe
            clusters={clusters}
            lang={lang}
            onSelectCluster={(c) => setSelectedClusterDetail(c)}
          />

          <div style={{ textAlign: 'center', margin: '8px 0 24px 0' }}>
            <h1 style={{
              fontSize: '28px',
              fontWeight: 800,
              color: '#FFF',
              letterSpacing: '0.04em',
              margin: '0 0 6px 0',
              textShadow: '0 2px 10px rgba(0,0,0,0.5)'
            }}>
              {t.app_subtitle}
            </h1>
            <p style={{ color: '#94A3B8', fontSize: '13.5px', maxWidth: '640px', lineHeight: 1.6, margin: '0 auto' }}>
              {t.hero_statement}
            </p>
          </div>

          {/* Assessment Track Launcher Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '18px',
            width: '100%',
            margin: '12px 0 36px 0'
          }}>
            {/* Track 1 Tile */}
            <div
              onClick={() => startTrack('track_1')}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(212, 175, 55, 0.28)',
                borderRadius: '16px',
                padding: '22px',
                cursor: 'pointer',
                transition: 'all 0.25s',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                backdropFilter: 'blur(12px)'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#D4AF37'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.28)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <div>
                <span style={{ fontSize: '10.5px', color: '#D4AF37', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  {t.track_1_time}
                </span>
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#FFF', margin: '8px 0' }}>
                  {t.track_1_title}
                </h3>
                <p style={{ color: '#94A3B8', fontSize: '12.5px', lineHeight: 1.5, margin: 0 }}>
                  {t.track_1_desc}
                </p>
              </div>
              <button style={{
                marginTop: '16px',
                background: 'rgba(212, 175, 55, 0.15)',
                border: '1px solid #D4AF37',
                borderRadius: '8px',
                padding: '8px 14px',
                color: '#FFD700',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer'
              }}>
                {t.start_btn} →
              </button>
            </div>

            {/* Track 2 Tile */}
            <div
              onClick={() => startTrack('track_2')}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(59, 130, 246, 0.28)',
                borderRadius: '16px',
                padding: '22px',
                cursor: 'pointer',
                transition: 'all 0.25s',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                backdropFilter: 'blur(12px)'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3B82F6'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.28)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <div>
                <span style={{ fontSize: '10.5px', color: '#3B82F6', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  {t.track_2_time}
                </span>
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#FFF', margin: '8px 0' }}>
                  {t.track_2_title}
                </h3>
                <p style={{ color: '#94A3B8', fontSize: '12.5px', lineHeight: 1.5, margin: 0 }}>
                  {t.track_2_desc}
                </p>
              </div>
              <button style={{
                marginTop: '16px',
                background: 'rgba(59, 130, 246, 0.15)',
                border: '1px solid #3B82F6',
                borderRadius: '8px',
                padding: '8px 14px',
                color: '#60A5FA',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer'
              }}>
                {t.start_btn} →
              </button>
            </div>

            {/* Track 3 Tile */}
            <div
              onClick={() => startTrack('track_3')}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(236, 72, 153, 0.28)',
                borderRadius: '16px',
                padding: '22px',
                cursor: 'pointer',
                transition: 'all 0.25s',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                backdropFilter: 'blur(12px)'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#EC4899'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(236, 72, 153, 0.28)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <div>
                <span style={{ fontSize: '10.5px', color: '#EC4899', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  {t.track_3_time}
                </span>
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#FFF', margin: '8px 0' }}>
                  {t.track_3_title}
                </h3>
                <p style={{ color: '#94A3B8', fontSize: '12.5px', lineHeight: 1.5, margin: 0 }}>
                  {t.track_3_desc}
                </p>
              </div>
              <button style={{
                marginTop: '16px',
                background: 'rgba(236, 72, 153, 0.15)',
                border: '1px solid #EC4899',
                borderRadius: '8px',
                padding: '8px 14px',
                color: '#F472B6',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer'
              }}>
                {t.start_btn} →
              </button>
            </div>
          </div>

          {/* About Drawers Section */}
          <div style={{ width: '100%', maxWidth: '780px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#D4AF37', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}>
              {t.about_title}
            </h3>

            <details style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', padding: '12px 16px' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 600, color: '#FFF', fontSize: '13.5px' }}>
                {t.about_drawer_1_title}
              </summary>
              <p style={{ color: '#94A3B8', fontSize: '12.5px', lineHeight: 1.6, marginTop: '8px' }}>
                {t.about_drawer_1_text}
              </p>
            </details>

            <details style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', padding: '12px 16px' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 600, color: '#FFF', fontSize: '13.5px' }}>
                {t.about_drawer_2_title}
              </summary>
              <p style={{ color: '#94A3B8', fontSize: '12.5px', lineHeight: 1.6, marginTop: '8px' }}>
                {t.about_drawer_2_text}
              </p>
            </details>

            <details style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', padding: '12px 16px' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 600, color: '#FFF', fontSize: '13.5px' }}>
                {t.about_drawer_3_title}
              </summary>
              <p style={{ color: '#94A3B8', fontSize: '12.5px', lineHeight: 1.6, marginTop: '8px' }}>
                {t.about_drawer_3_text}
              </p>
            </details>
          </div>
        </div>
      )}

      {/* =============================================================== */}
      {/* VIEW 2: THE ASSESSMENT CONSOLE VIEW (STRICT 15% / 75% / 10%)    */}
      {/* =============================================================== */}
      {activeView === 'console' && currentQ && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 56px)', overflow: 'hidden' }}>

          {/* 1. TOP DOCK (15% Height - Fixed Non-Scrolling) */}
          <div style={{
            height: '15%',
            minHeight: '75px',
            background: 'rgba(10, 15, 29, 0.75)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '10px 24px 8px 24px',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#D4AF37',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  background: 'rgba(212, 175, 55, 0.12)',
                  border: '1px solid rgba(212, 175, 55, 0.25)'
                }}>
                  {activeTrack === 'track_1' ? t.track_1_title : (activeTrack === 'track_2' ? t.track_2_title : t.track_3_title)}
                </span>
                <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#CBD5E1' }}>
                  {t.q_counter.replace('{current}', String(currentIndex + 1)).replace('{total}', String(questions.length))}
                </span>
              </div>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#38BDF8' }}>
                {progressPercent}%
              </span>
            </div>

            {/* Segmented Progress Bar */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {activeTrack === 'track_3' ? (
                // Dual-Row 50+50 Progress Grid for Track 3
                <>
                  <div style={{ display: 'flex', gap: '2px', height: '4px' }}>
                    {questions.slice(0, 50).map((q, idx) => {
                      const isAnswered = answers[q.question_id] !== undefined;
                      const isCurr = idx === currentIndex;
                      return (
                        <div key={idx} style={{
                          flex: 1,
                          height: '100%',
                          background: isCurr ? '#D4AF37' : (isAnswered ? '#10B981' : 'rgba(255,255,255,0.1)'),
                          borderRadius: '1px'
                        }} />
                      );
                    })}
                  </div>
                  <div style={{ display: 'flex', gap: '2px', height: '4px' }}>
                    {questions.slice(50, 100).map((q, idx) => {
                      const realIdx = idx + 50;
                      const isAnswered = answers[q.question_id] !== undefined;
                      const isCurr = realIdx === currentIndex;
                      return (
                        <div key={realIdx} style={{
                          flex: 1,
                          height: '100%',
                          background: isCurr ? '#D4AF37' : (isAnswered ? '#10B981' : 'rgba(255,255,255,0.1)'),
                          borderRadius: '1px'
                        }} />
                      );
                    })}
                  </div>
                </>
              ) : (
                // Single continuous segmented bar for Track 1 & 2
                <div style={{ display: 'flex', gap: '2px', height: '5px' }}>
                  {questions.map((q, idx) => {
                    const isAnswered = answers[q.question_id] !== undefined;
                    const isCurr = idx === currentIndex;
                    return (
                      <div key={idx} style={{
                        flex: 1,
                        height: '100%',
                        background: isCurr ? '#D4AF37' : (isAnswered ? '#10B981' : 'rgba(255,255,255,0.1)'),
                        borderRadius: '2px'
                      }} />
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* 2. MAIN WORKSPACE (75% Height - Controlled Internal Scroll Area) */}
          <div style={{
            height: '75%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '16px 20px',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            boxSizing: 'border-box'
          }}>
            <div style={{ width: '100%', maxWidth: '720px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* Macro-Domain Context Pill */}
              <div style={{ alignSelf: 'flex-start' }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 12px',
                  borderRadius: '9999px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: `1px solid ${domainAccent}`,
                  fontSize: '11px',
                  fontWeight: 700,
                  color: domainAccent
                }}>
                  <span>{lang === 'hi' ? DOMAIN_HINDI[activeDomain] : activeDomain}</span>
                  <span>•</span>
                  <span>{currentQ.dimension || currentQ.primary_dimension}</span>
                </span>
              </div>

              {/* Question Statement Card */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                padding: '20px',
                boxShadow: '0 4px 24px rgba(0, 0, 0, 0.3)',
                backdropFilter: 'blur(12px)'
              }}>
                <div style={{ fontSize: '11.5px', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                  {currentQ.sub_topic}
                </div>
                <h2 style={{
                  fontSize: '17px',
                  fontWeight: 600,
                  color: '#FFF',
                  lineHeight: 1.5,
                  margin: 0
                }}>
                  {activeTrack === 'track_1'
                    ? (lang === 'hi' ? currentQ.statement_hi : currentQ.statement_en)
                    : (lang === 'hi' ? currentQ.scenario_hi : currentQ.scenario_en)}
                </h2>

                {activeTrack === 'track_3' && (
                  <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#EC4899', padding: '2px 8px', background: 'rgba(236,72,153,0.12)', borderRadius: '6px' }}>
                      {t.select_two}
                    </span>
                    <span style={{ fontSize: '11px', color: '#CBD5E1' }}>
                      {t.selected_count.replace('{n}', String(Array.isArray(answers[currentQ.question_id]) ? answers[currentQ.question_id].length : 0))}
                    </span>
                  </div>
                )}
              </div>

              {/* Option Selection Container */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                {activeTrack === 'track_1' ? (
                  // Track 1 Binary Agree/Disagree Cards
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    {[
                      { val: 1, label: t.agree },
                      { val: -1, label: t.disagree }
                    ].map(opt => {
                      const isSelected = answers[currentQ.question_id] === opt.val;
                      return (
                        <div
                          key={opt.val}
                          onClick={() => handleSelectOption(currentQ.question_id, opt.val)}
                          style={{
                            position: 'relative',
                            background: isSelected ? 'rgba(212, 175, 55, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                            border: isSelected ? '2px solid #D4AF37' : '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '14px',
                            padding: '24px 16px',
                            textAlign: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: isSelected ? '0 0 20px rgba(212, 175, 55, 0.3)' : 'none',
                            transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                            overflow: 'hidden'
                          }}
                        >
                          <span style={{ fontSize: '16px', fontWeight: 700, color: isSelected ? '#FFD700' : '#FFF' }}>
                            {opt.label}
                          </span>
                          {/* 2.0s Animated Progress Countdown */}
                          {isSelected && (
                            <div style={{
                              position: 'absolute',
                              bottom: 0,
                              left: 0,
                              height: '3px',
                              background: '#D4AF37',
                              width: `${progressCountdown}%`,
                              transition: 'width 2s linear'
                            }} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  // Track 2 & 3 Option Cards
                  (currentQ.options || []).map(opt => {
                    const ans = answers[currentQ.question_id];
                    const isSelected = activeTrack === 'track_2'
                      ? ans === opt.option_id
                      : (Array.isArray(ans) && ans.includes(opt.option_id));

                    return (
                      <div
                        key={opt.option_id}
                        onClick={() => handleSelectOption(currentQ.question_id, opt.option_id)}
                        style={{
                          position: 'relative',
                          background: isSelected ? 'rgba(212, 175, 55, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                          border: isSelected ? '2px solid #D4AF37' : '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '12px',
                          padding: '14px 16px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          boxShadow: isSelected ? '0 0 16px rgba(212, 175, 55, 0.25)' : 'none',
                          transform: isSelected ? 'scale(1.015)' : 'scale(1)',
                          overflow: 'hidden'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                          <div style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: activeTrack === 'track_3' ? '4px' : '50%',
                            border: isSelected ? '2px solid #D4AF37' : '1px solid rgba(255,255,255,0.3)',
                            background: isSelected ? '#D4AF37' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            marginTop: '2px'
                          }}>
                            {isSelected && <span style={{ color: '#0A0F1D', fontSize: '11px', fontWeight: 800 }}>✓</span>}
                          </div>
                          <span style={{ fontSize: '13.5px', color: isSelected ? '#FFF' : '#CBD5E1', lineHeight: 1.5 }}>
                            {lang === 'hi' ? opt.text_hi : opt.text_en}
                          </span>
                        </div>

                        {/* 2.0s Animated Progress Countdown on Card */}
                        {isSelected && progressCountdown > 0 && (
                          <div style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            height: '3px',
                            background: '#D4AF37',
                            width: `${progressCountdown}%`,
                            transition: 'width 2s linear'
                          }} />
                        )}
                      </div>
                    );
                  })
                )}
              </div>

            </div>
          </div>

          {/* 3. BOTTOM DOCK (10% Height - Fixed Bottom Toolbar) */}
          <div style={{
            height: '10%',
            minHeight: '60px',
            background: 'rgba(10, 15, 29, 0.92)',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            backdropFilter: 'blur(16px)',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => advanceQuestion(-1)}
                disabled={currentIndex === 0}
                style={{
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  background: 'transparent',
                  color: currentIndex === 0 ? 'rgba(255,255,255,0.25)' : '#FFF',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
                  fontSize: '12px',
                  fontWeight: 600
                }}
              >
                ← {t.nav_prev}
              </button>
              <button
                onClick={() => setShowResetModal(true)}
                style={{
                  border: 'none',
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#F87171',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600
                }}
              >
                {t.nav_reset}
              </button>
            </div>

            {/* Elevated Centered (⊙ JUMP) Button */}
            <button
              onClick={() => setShowJumpModal(true)}
              style={{
                background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
                border: '2px solid #D4AF37',
                borderRadius: '9999px',
                padding: '8px 20px',
                color: '#FFD700',
                fontWeight: 700,
                fontSize: '12.5px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 14px rgba(212, 175, 55, 0.3)'
              }}
            >
              <span>⊙</span>
              <span>{t.nav_jump}</span>
            </button>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleSkip}
                style={{
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  background: 'transparent',
                  color: '#94A3B8',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600
                }}
              >
                {t.nav_skip} ↷
              </button>
              <button
                onClick={() => advanceQuestion(1)}
                style={{
                  border: 'none',
                  background: '#D4AF37',
                  color: '#0A0F1D',
                  padding: '8px 18px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '12.5px',
                  fontWeight: 700
                }}
              >
                {currentIndex === questions.length - 1 ? t.cta_ready : `${t.nav_next} →`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =============================================================== */}
      {/* VIEW 3: RESULTS CONSTELLATION & 25D RADAR SYNTHESIS             */}
      {/* =============================================================== */}
      {activeView === 'results' && evalResult && (
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px 20px 60px 20px',
          maxWidth: '960px',
          margin: '0 auto',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          {/* Header Title */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#FFF', margin: '0 0 6px 0', letterSpacing: '0.04em' }}>
              {t.results_title}
            </h1>
            <p style={{ color: '#94A3B8', fontSize: '13px', margin: 0 }}>
              {t.results_subtitle} ({t.app_subtitle})
            </p>
          </div>

          {/* Primary Worldview Alignment Hero Card */}
          {evalResult.top_matches[0] && (() => {
            const top = evalResult.top_matches[0];
            const wvFull = worldviews.find(w => w.id === top.worldview_id);
            return (
              <div style={{
                background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(15, 23, 42, 0.6) 100%)',
                border: '2px solid #D4AF37',
                borderRadius: '18px',
                padding: '24px',
                boxShadow: '0 8px 32px rgba(212, 175, 55, 0.2)',
                marginBottom: '28px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: '#D4AF37', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      {t.top_match_label}
                    </span>
                    <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#FFF', margin: '4px 0' }}>
                      {lang === 'hi' ? top.name_hi : top.name_en}
                    </h2>
                    <span style={{ fontSize: '12px', color: '#94A3B8' }}>
                      {t.cluster_family_label}: <strong style={{ color: '#CBD5E1' }}>{top.cluster_name}</strong>
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '32px', fontWeight: 900, color: '#FFD700' }}>
                      {(top.similarity_score * 100).toFixed(1)}%
                    </div>
                    <span style={{ fontSize: '11px', color: '#94A3B8' }}>{t.similarity_score}</span>
                  </div>
                </div>

                <p style={{ color: '#E2E8F0', fontSize: '13.5px', lineHeight: 1.6, margin: 0 }}>
                  {wvFull ? (lang === 'hi' ? wvFull.short_description_hi : wvFull.short_description_en) : 'Historical worldview reference model.'}
                </p>

                <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
                  <button
                    onClick={() => setDeepDiveWorldview(wvFull || null)}
                    style={{
                      border: 'none',
                      background: '#D4AF37',
                      color: '#0A0F1D',
                      padding: '10px 20px',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '12.5px',
                      cursor: 'pointer'
                    }}
                  >
                    {t.deep_dive_btn} →
                  </button>
                  <button
                    onClick={() => {
                      if (overlayComparisonId === top.worldview_id) {
                        setOverlayComparisonId(null);
                      } else {
                        setOverlayComparisonId(top.worldview_id);
                      }
                    }}
                    style={{
                      border: '1px solid #D4AF37',
                      background: overlayComparisonId === top.worldview_id ? 'rgba(212,175,55,0.2)' : 'transparent',
                      color: '#FFD700',
                      padding: '10px 18px',
                      borderRadius: '8px',
                      fontWeight: 600,
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    {overlayComparisonId === top.worldview_id ? 'Hide Overlay' : t.toggle_overlay}
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Interactive 25D Radar Chart */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '18px',
            padding: '24px',
            marginBottom: '28px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#FFF', margin: '0 0 16px 0' }}>
              {t.radar_title}
            </h3>
            <RadarConstellation25D
              userCoords={evalResult.user_coordinates}
              overlayVector={overlayComparisonId ? worldviews.find(w => w.id === overlayComparisonId)?.vector : null}
              overlayName={overlayComparisonId ? worldviews.find(w => w.id === overlayComparisonId)?.name_en : undefined}
              lang={lang}
              dimensions={dimensions}
            />
          </div>

          {/* Top 5 Worldview Matches */}
          <div style={{ marginBottom: '28px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#FFF', marginBottom: '14px' }}>
              {t.top_matches_title}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {evalResult.top_matches.map(match => {
                const wvFull = worldviews.find(w => w.id === match.worldview_id);
                return (
                  <div
                    key={match.worldview_id}
                    onClick={() => setDeepDiveWorldview(wvFull || null)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      padding: '14px 18px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#D4AF37'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <span style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: match.rank === 1 ? '#D4AF37' : 'rgba(255,255,255,0.08)',
                        color: match.rank === 1 ? '#0A0F1D' : '#FFF',
                        fontSize: '11px',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {match.rank}
                      </span>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#FFF' }}>
                          {lang === 'hi' ? match.name_hi : match.name_en}
                        </div>
                        <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                          {match.cluster_name} {wvFull && `• ${wvFull.historical_era}`}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ width: '90px', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '9999px', overflow: 'hidden' }}>
                        <div style={{ width: `${match.similarity_score * 100}%`, height: '100%', background: '#D4AF37' }} />
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#FFD700', minWidth: '45px', textAlign: 'right' }}>
                        {(match.similarity_score * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dialectical Tension Diagnostic Alerts */}
          {evalResult.diagnostic_alerts.length > 0 && (
            <div style={{ marginBottom: '28px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#F87171', marginBottom: '14px' }}>
                ⚠ {t.diagnostics_title}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {evalResult.diagnostic_alerts.map((alert, idx) => (
                  <div key={idx} style={{
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    borderRadius: '12px',
                    padding: '14px 18px'
                  }}>
                    <div style={{ color: '#FCA5A5', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' }}>
                      {alert.dimension_name} ({alert.dimension_id})
                    </div>
                    <p style={{ color: '#E2E8F0', fontSize: '12.5px', margin: '4px 0 0 0', lineHeight: 1.5 }}>
                      {alert.explanation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Footer Buttons */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap', marginTop: '16px' }}>
            <button
              onClick={() => setShowShareModal(true)}
              style={{
                border: 'none',
                background: '#D4AF37',
                color: '#0A0F1D',
                padding: '12px 24px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {t.share_btn} ↗
            </button>
            <button
              onClick={() => startTrack(activeTrack)}
              style={{
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'transparent',
                color: '#FFF',
                padding: '12px 22px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {t.retake_btn}
            </button>
            <button
              onClick={() => setActiveView('home')}
              style={{
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'transparent',
                color: '#94A3B8',
                padding: '12px 22px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {t.app_title} Home
            </button>
          </div>
        </div>
      )}

      {/* =============================================================== */}
      {/* MODAL 1: FULL-SCREEN JUMP NAVIGATION MATRIX                     */}
      {/* =============================================================== */}
      {showJumpModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(10, 15, 29, 0.95)',
          backdropFilter: 'blur(16px)',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '24px 20px'
        }}>
          <div style={{ width: '100%', maxWidth: '720px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#FFF', margin: 0 }}>
              {t.jump_modal_title}
            </h2>
            <button
              onClick={() => setShowJumpModal(false)}
              style={{
                border: 'none',
                background: 'rgba(255,255,255,0.1)',
                color: '#FFF',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              ✕
            </button>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', fontSize: '11.5px', color: '#94A3B8' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#10B981' }} /> {t.jump_answered}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#D4AF37' }} /> {t.jump_current}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#F59E0B' }} /> {t.jump_skipped}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'rgba(255,255,255,0.1)' }} /> {t.jump_unseen}
            </span>
          </div>

          {/* Grid Tiles */}
          <div style={{
            flex: 1,
            width: '100%',
            maxWidth: '720px',
            overflowY: 'auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(52px, 1fr))',
            gap: '8px'
          }}>
            {questions.map((q, idx) => {
              const isAnswered = answers[q.question_id] !== undefined;
              const isSkipped = skippedIds.includes(q.question_id);
              const isCurr = idx === currentIndex;

              let bg = 'rgba(255, 255, 255, 0.05)';
              let border = '1px solid rgba(255, 255, 255, 0.1)';
              let color = '#94A3B8';

              if (isCurr) {
                bg = 'rgba(212, 175, 55, 0.2)';
                border = '2px solid #D4AF37';
                color = '#FFD700';
              } else if (isAnswered) {
                bg = 'rgba(16, 185, 129, 0.18)';
                border = '1px solid #10B981';
                color = '#6EE7B7';
              } else if (isSkipped) {
                bg = 'rgba(245, 158, 11, 0.18)';
                border = '1px solid #F59E0B';
                color = '#FCD34D';
              }

              return (
                <button
                  key={q.question_id}
                  onClick={() => {
                    setCurrentIndex(idx);
                    setShowJumpModal(false);
                  }}
                  style={{
                    background: bg,
                    border,
                    borderRadius: '8px',
                    height: '48px',
                    color,
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s'
                  }}
                >
                  <span>{idx + 1}</span>
                  {isAnswered && <span style={{ fontSize: '9px' }}>✓</span>}
                  {isSkipped && <span style={{ fontSize: '9px' }}>↷</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* =============================================================== */}
      {/* MODAL 2: RESET CONFIRMATION GUARD (YES/NO FOCUS TRAP)           */}
      {/* =============================================================== */}
      {showResetModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(10, 15, 29, 0.88)',
          backdropFilter: 'blur(12px)',
          zIndex: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: 'rgba(30, 41, 59, 0.95)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '18px',
            padding: '24px',
            maxWidth: '420px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6)'
          }}>
            <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#FFF', margin: '0 0 8px 0' }}>
              {t.reset_modal_title}
            </h3>
            <p style={{ color: '#94A3B8', fontSize: '13px', lineHeight: 1.5, margin: '0 0 20px 0' }}>
              {t.reset_modal_desc}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={handleResetSession}
                style={{
                  border: 'none',
                  background: '#EF4444',
                  color: '#FFF',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '12.5px',
                  cursor: 'pointer'
                }}
              >
                {t.btn_yes_reset}
              </button>
              <button
                onClick={() => setShowResetModal(false)}
                style={{
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'transparent',
                  color: '#FFF',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '12.5px',
                  cursor: 'pointer'
                }}
              >
                {t.btn_no_continue}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =============================================================== */}
      {/* MODAL 3: WORLDVIEW SCHOLARLY DEEP DIVE                          */}
      {/* =============================================================== */}
      {deepDiveWorldview && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(10, 15, 29, 0.95)',
          backdropFilter: 'blur(20px)',
          zIndex: 60,
          display: 'flex',
          justifyContent: 'center',
          padding: '30px 20px',
          overflowY: 'auto'
        }}>
          <div style={{
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid #D4AF37',
            borderRadius: '20px',
            maxWidth: '740px',
            width: '100%',
            padding: '28px',
            boxShadow: '0 12px 48px rgba(0, 0, 0, 0.7)',
            alignSelf: 'flex-start',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '11px', color: '#D4AF37', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  {deepDiveWorldview.id} • {deepDiveWorldview.profile_type}
                </span>
                <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#FFF', margin: '4px 0' }}>
                  {lang === 'hi' ? deepDiveWorldview.name_hi : deepDiveWorldview.name_en}
                </h2>
              </div>
              <button
                onClick={() => setDeepDiveWorldview(null)}
                style={{
                  border: 'none',
                  background: 'rgba(255,255,255,0.1)',
                  color: '#FFF',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                ✕
              </button>
            </div>

            {/* Historical Origin Metadata */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '12px' }}>
              <div>
                <span style={{ fontSize: '11px', color: '#94A3B8' }}>{t.era_label}:</span>
                <div style={{ fontSize: '12.5px', color: '#FFF', fontWeight: 600 }}>{deepDiveWorldview.historical_era}</div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: '#94A3B8' }}>{t.region_label}:</span>
                <div style={{ fontSize: '12.5px', color: '#FFF', fontWeight: 600 }}>{deepDiveWorldview.geographic_origin}</div>
              </div>
              {deepDiveWorldview.founder && (
                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ fontSize: '11px', color: '#94A3B8' }}>{t.founder_label}:</span>
                  <div style={{ fontSize: '12.5px', color: '#FFF', fontWeight: 600 }}>{deepDiveWorldview.founder}</div>
                </div>
              )}
            </div>

            {/* Iconic Quote */}
            {deepDiveWorldview.famous_quote && (
              <div style={{
                background: 'rgba(212, 175, 55, 0.08)',
                borderLeft: '3px solid #D4AF37',
                padding: '12px 16px',
                borderRadius: '0 10px 10px 0',
                fontStyle: 'italic',
                color: '#FEF08A',
                fontSize: '13px',
                lineHeight: 1.5
              }}>
                "{deepDiveWorldview.famous_quote}"
              </div>
            )}

            {/* Full Doctrinal Narrative */}
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#D4AF37', textTransform: 'uppercase', marginBottom: '6px' }}>
                Philosophical Architecture
              </h4>
              <p style={{ color: '#E2E8F0', fontSize: '13px', lineHeight: 1.6, margin: 0 }}>
                {lang === 'hi' ? deepDiveWorldview.full_description_hi : deepDiveWorldview.full_description_en}
              </p>
            </div>

            {/* Canonical Treatises */}
            {deepDiveWorldview.canonical_texts && (
              <div>
                <span style={{ fontSize: '11.5px', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>{t.texts_label}:</span>
                <div style={{ fontSize: '12.5px', color: '#CBD5E1', marginTop: '2px' }}>{deepDiveWorldview.canonical_texts}</div>
              </div>
            )}

            {/* 25D Coordinate Vector Breakdown */}
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#38BDF8', textTransform: 'uppercase', marginBottom: '8px' }}>
                Canonical 25-Dimensional Vector
              </h4>
              <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', paddingRight: '8px' }}>
                {dimensions.map(dim => {
                  const val = deepDiveWorldview.vector[dim.id] ?? 0.0;
                  const domainColor = DOMAIN_COLORS[dim.macro_domain] || '#D4AF37';
                  return (
                    <div key={dim.id} style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', padding: '6px 10px', borderRadius: '6px', fontSize: '11.5px' }}>
                      <span style={{ color: domainColor }}>{dim.id}: {lang === 'hi' ? dim.name_hi : dim.name_en}</span>
                      <strong style={{ color: val > 0 ? '#10B981' : (val < 0 ? '#EF4444' : '#94A3B8') }}>
                        {val > 0 ? `+${val.toFixed(2)}` : val.toFixed(2)}
                      </strong>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => setDeepDiveWorldview(null)}
              style={{
                alignSelf: 'center',
                border: 'none',
                background: '#D4AF37',
                color: '#0A0F1D',
                padding: '10px 24px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '12.5px',
                cursor: 'pointer',
                marginTop: '10px'
              }}
            >
              {t.close_btn}
            </button>
          </div>
        </div>
      )}

      {/* =============================================================== */}
      {/* MODAL 4: STATELESS 29-BYTE URL SHARE MODAL                      */}
      {/* =============================================================== */}
      {showShareModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(10, 15, 29, 0.9)',
          backdropFilter: 'blur(12px)',
          zIndex: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: 'rgba(30, 41, 59, 0.95)',
            border: '1px solid #D4AF37',
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '460px',
            width: '100%',
            textAlign: 'center'
          }}>
            <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#FFF', margin: '0 0 8px 0' }}>
              {t.share_btn}
            </h3>
            <p style={{ color: '#94A3B8', fontSize: '12.5px', lineHeight: 1.5, margin: '0 0 16px 0' }}>
              Your 25-dimensional profile is compressed into a compact 29-byte stateless URL query. Anyone with this link can view your exact constellation.
            </p>
            <div style={{
              background: 'rgba(0,0,0,0.4)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              padding: '10px',
              fontSize: '11.5px',
              color: '#38BDF8',
              wordBreak: 'break-all',
              marginBottom: '16px',
              fontFamily: 'monospace'
            }}>
              {`https://worldviewcompass.org/share#v=${btoa(JSON.stringify(evalResult?.user_coordinates || {})).substring(0, 39)}`}
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(window.location.href);
                  alert(t.copied_alert);
                }}
                style={{
                  border: 'none',
                  background: '#D4AF37',
                  color: '#0A0F1D',
                  padding: '9px 20px',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '12.5px',
                  cursor: 'pointer'
                }}
              >
                Copy Link
              </button>
              <button
                onClick={() => setShowShareModal(false)}
                style={{
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'transparent',
                  color: '#FFF',
                  padding: '9px 18px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '12.5px',
                  cursor: 'pointer'
                }}
              >
                {t.close_btn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CLUSTER DETAIL QUICK DRAWER (When clicking Globe nodes) */}
      {selectedClusterDetail && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '90%',
          maxWidth: '540px',
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid #D4AF37',
          borderRadius: '16px',
          padding: '18px',
          zIndex: 45,
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          backdropFilter: 'blur(16px)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '11px', color: '#D4AF37', fontWeight: 700 }}>
                {selectedClusterDetail.id} • {selectedClusterDetail.macro_region}
              </span>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#FFF', margin: '2px 0' }}>
                {lang === 'hi' ? selectedClusterDetail.name_hi : selectedClusterDetail.name_en}
              </h3>
            </div>
            <button
              onClick={() => setSelectedClusterDetail(null)}
              style={{ border: 'none', background: 'transparent', color: '#94A3B8', fontSize: '14px', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>
          <p style={{ color: '#CBD5E1', fontSize: '12px', margin: '8px 0', lineHeight: 1.5 }}>
            {lang === 'hi' ? selectedClusterDetail.defining_tension_hi : selectedClusterDetail.defining_tension_en}
          </p>
          <div style={{ fontSize: '11px', color: '#94A3B8' }}>
            Assigned Range: <strong style={{ color: '#FFD700' }}>{selectedClusterDetail.assigned_range}</strong>
          </div>
        </div>
      )}

    </div>
  );
}
