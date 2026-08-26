import streamlit as st
import json
import math
import numpy as np
import urllib.parse
import plotly.graph_objects as go
from io import BytesIO
from PIL import Image, ImageDraw

# ==============================================================================
# STREAMLIT CONFIGURATION & STANDALONE WEBAPP STYLING
# ==============================================================================
st.set_page_config(
    page_title="The Compass of Human Perspectives",
    page_icon="🧭",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Custom premium CSS for editorial styling, standalone dark theme look, and interactive cards
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;800&family=Lora:ital,wght@0,400;0,600;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600&display=swap');
    
    html, body, [data-testid="stAppViewContainer"] {
        background-color: #090D16;
        color: #F8FAFC;
        font-family: 'Plus Jakarta Sans', sans-serif;
    }
    
    /* Header cinematic titles */
    .app-title {
        font-family: 'Cinzel', serif;
        font-weight: 800;
        font-size: 2.6rem;
        background: linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FF8C00 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        letter-spacing: 0.1em;
        text-align: center;
        margin-top: 1.5rem;
    }
    .app-subtitle {
        font-family: 'Lora', serif;
        font-style: italic;
        color: #94A3B8;
        font-size: 1.25rem;
        text-align: center;
        margin-bottom: 2rem;
    }
    
    /* Hero landing box */
    .hero-container {
        border: 1px solid rgba(255, 215, 0, 0.15);
        background: radial-gradient(circle at top, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%);
        border-radius: 16px;
        padding: 40px;
        text-align: center;
        max-width: 900px;
        margin: 2rem auto;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    }
    
    /* Interactive Slideshow Cards */
    .question-card {
        background: #0F172A;
        border: 1px solid rgba(255, 215, 0, 0.1);
        border-radius: 12px;
        padding: 30px;
        margin-bottom: 25px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    }
    
    .question-dim {
        font-family: 'Cinzel', serif;
        font-size: 0.9rem;
        color: #FFD700;
        letter-spacing: 0.15em;
        text-transform: uppercase;
        margin-bottom: 10px;
    }
    
    .question-text {
        font-family: 'Lora', serif;
        font-size: 1.45rem;
        font-weight: 600;
        line-height: 1.5;
        color: #FFFFFF;
        margin-bottom: 20px;
    }
    
    /* Profile Reveal styling */
    .profile-card {
        background: linear-gradient(145deg, #101B2B, #0A101C);
        border-radius: 16px;
        border: 1px solid rgba(255,215,0,0.2);
        padding: 40px;
        margin-bottom: 30px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.6);
    }
    
    .profile-header {
        font-family: 'Cinzel', serif;
        font-size: 1.1rem;
        color: #FFD700;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        margin-bottom: 5px;
    }
    
    .profile-tags {
        font-family: 'Cinzel', serif;
        font-size: 1.7rem;
        font-weight: 700;
        color: #FFFFFF;
        margin-bottom: 25px;
        border-bottom: 1px solid rgba(255,215,0,0.1);
        padding-bottom: 15px;
    }
    
    /* Cognitive Tension Warning */
    .tension-box {
        background: linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(220, 38, 38, 0.05) 100%);
        border: 1px solid rgba(239, 68, 68, 0.35);
        border-radius: 12px;
        padding: 25px;
        margin-top: 20px;
    }
    
    .tension-title {
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-weight: 700;
        font-size: 1.15rem;
        color: #EF4444;
        margin-bottom: 8px;
        display: flex;
        align-items: center;
        gap: 8px;
    }
    
    .tension-desc {
        font-size: 0.98rem;
        line-height: 1.6;
        color: #E2E8F0;
    }
</style>
""", unsafe_allow_html=True)

# ==============================================================================
# 1. CORE SCORING DATABASE (13 SCHOOLS OF THOUGHT)
# ==============================================================================
WORLDVIEWS = {
    "Secular Scientific Humanism": {
        "vector": [-1.0, 0.1, 0.8, 1.0],
        "thinkers": ["Carl Sagan", "John Dewey", "Richard Dawkins"],
        "description": "A progressive philosophy based on science, reason, human agency, and ethical responsibility, completely rejecting supernatural claims."
    },
    "Stoicism": {
        "vector": [-0.3, -0.4, -0.1, -0.5],
        "thinkers": ["Marcus Aurelius", "Seneca", "Epictetus"],
        "description": "An ancient Greek and Roman philosophy teaching the development of self-control and fortitude to overcome destructive emotions and align with natural cosmic reason."
    },
    "Advaita Vedanta": {
        "vector": [1.0, -0.2, -0.7, -0.8],
        "thinkers": ["Adi Shankara", "Ramana Maharshi"],
        "description": "An orthodox school of Hindu philosophy asserting that the individual self (Atman) and ultimate absolute reality (Brahman) are identical and non-dual."
    },
    "Marxism": {
        "vector": [-1.0, 1.0, 0.9, 0.5],
        "thinkers": ["Karl Marx", "Friedrich Engels", "Rosa Luxemburg"],
        "description": "A materialist philosophy and socio-economic analysis of class relations and historical progress through social struggle and collective ownership."
    },
    "Daoism": {
        "vector": [0.4, -0.3, -0.3, -0.4],
        "thinkers": ["Laozi", "Zhuangzi"],
        "description": "A tradition of Chinese origin that emphasizes living in effortless harmony with the Dao (the natural, spontaneous flow of the cosmos)."
    },
    "Early Buddhism": {
        "vector": [0.2, -0.1, 0.1, -0.6],
        "thinkers": ["Siddhartha Gautama (The Buddha)", "Nagarjuna"],
        "description": "A non-theistic spiritual path focused on overcoming suffering by understanding impermanence, non-attachment, and the illusion of a permanent self (Anatta)."
    },
    "Christian Theism": {
        "vector": [0.9, 0.1, -0.6, -0.4],
        "thinkers": ["Thomas Aquinas", "Augustine of Hippo", "C.S. Lewis"],
        "description": "A monotheistic faith based on the life and teachings of Jesus Christ, asserting a transcendent personal Creator and moral savior."
    },
    "Ubuntu": {
        "vector": [0.2, 0.9, 0.3, -0.2],
        "thinkers": ["Desmond Tutu", "Nelson Mandela"],
        "description": "An African communalist philosophy asserting that personhood is relational, encapsulated in the phrase: 'I am because we are.'"
    },
    "Confucianism": {
        "vector": [-0.1, 0.5, -0.9, -0.5],
        "thinkers": ["Confucius", "Mencius"],
        "description": "An East Asian ethical and philosophical system emphasizing filial piety, social order, ritual propriety, and moral governance."
    },
    "Deep Ecology": {
        "vector": [0.3, 0.4, 0.2, 0.4],
        "thinkers": ["Arne Naess", "Aldo Leopold"],
        "description": "An environmental philosophy advocating for the inherent moral rights of all living beings and ecosystems, rejecting human-centric exploitation."
    },
    "Transhumanism": {
        "vector": [-0.8, -0.2, 1.0, 0.9],
        "thinkers": ["Nick Bostrom", "Ray Kurzweil", "Max More"],
        "description": "An intellectual movement advocating for the enhancement of human biological, cognitive, and physical capabilities using advanced technology."
    },
    "Existentialism": {
        "vector": [-0.3, -0.8, 0.6, -0.2],
        "thinkers": ["Jean-Paul Sartre", "Albert Camus", "Friedrich Nietzsche"],
        "description": "A modern movement asserting that existence precedes essence; humans are radically free and must author their own meaning and moral value."
    },
    "Classical Liberalism": {
        "vector": [-0.6, -0.9, 0.4, 0.5],
        "thinkers": ["John Locke", "Adam Smith", "John Stuart Mill"],
        "description": "A political and economic philosophy championing individual liberty, private property, limited state governance, and voluntary market cooperation."
    }
}

# ==============================================================================
# 2. STANDALONE FALLBACK QUESTIONS DATASET (25 REPRESENTATIVE DIMENSIONS)
# ==============================================================================
FALLBACK_QUESTIONS = [
    {
        "id": 1,
        "dimension": "Metaphysics & Reality",
        "text_en": "What ultimately constitutes the fundamental fabric of reality?",
        "text_hi": "वास्तविकता का मूल तत्व अंततः किस रूप में मौजूद है?",
        "options": [
            {"code": "A", "text_en": "Only physical matter, energy, and natural physical laws.", "text_hi": "केवल भौतिक पदार्थ, ऊर्जा और प्राकृतिक भौतिक नियम।", "deltas": {"materialism": 1.0, "spirituality": -1.0}, "weights": {"secular_humanism": 0.9, "marxism": 0.8}},
            {"code": "B", "text_en": "An uncreated, non-dual cosmic consciousness (Brahman / Absolute).", "text_hi": "अनादि, अद्वैत ब्रह्मांडीय चेतना (ब्रह्म या परम तत्व)।", "deltas": {"nondualism": 1.0, "spirituality": 1.0}, "weights": {"advaita_vedanta": 1.0}},
            {"code": "C", "text_en": "A purposeful physical universe created and sustained by God.", "text_hi": "ईश्वर द्वारा निर्मित और संचालित एक सोद्देश्य ब्रह्मांड।", "deltas": {"theism": 1.0, "spirituality": 0.8}, "weights": {"christian_theism": 1.0}},
            {"code": "D", "text_en": "An interconnected dynamic flow with no permanent substance (Dao / Flux).", "text_hi": "परस्पर जुड़ा हुआ, गतिशील प्रवाह जिसका कोई स्थायी सार नहीं (दाओ)।", "deltas": {"impermanence": 0.9, "nature_harmony": 0.9}, "weights": {"daoism": 1.0, "early_buddhism": 0.8}},
            {"code": "E", "text_en": "An empirical web of relations; metaphysical assertions are untestable.", "text_hi": "संबंधों का अनुभवजन्य जाल; तत्वमीमांसा के दावे अप्रमाणित हैं।", "deltas": {"empiricism": 0.9, "skepticism": 0.8}, "weights": {"secular_humanism": 0.8}}
        ]
    },
    {
        "id": 5,
        "dimension": "Consciousness & Mind",
        "text_en": "What is the true nature of human consciousness and subjective experience?",
        "text_hi": "मानव चेतना और व्यक्तिपरक अनुभव का वास्तविक स्वरूप क्या है?",
        "options": [
            {"code": "A", "text_en": "A neurological computation emergent from physical brain architecture.", "text_hi": "मस्तिष्क के जैविक न्यूरोलॉजिकल तंत्र का भौतिक परिणाम।", "deltas": {"materialism": 1.0, "rationalism": 0.8}, "weights": {"secular_humanism": 0.9}},
            {"code": "B", "text_en": "An uncreated ground of awareness that cannot be reduced to physical matter.", "text_hi": "ब्रह्मांड का एक मौलिक गुण जिसे केवल भौतिक पदार्थ में नहीं समेटा जा सकता।", "deltas": {"idealism": 0.9, "spirituality": 0.8}, "weights": {"advaita_vedanta": 0.9}},
            {"code": "C", "text_en": "A dynamic stream of fleeting mental events with no permanent underlying ego.", "text_hi": "क्षणिक मानसिक घटनाओं का अनवरत प्रवाह, जिसमें कोई स्थायी 'अहम' नहीं है।", "deltas": {"no_self": 1.0, "impermanence": 0.9}, "weights": {"early_buddhism": 1.0}},
            {"code": "D", "text_en": "An immortal soul endowed by the divine with moral responsibility.", "text_hi": "ईश्वर प्रदत्त एक अमर आत्मा जिसमें नैतिक उत्तरदायित्व निहित है।", "deltas": {"theism": 0.9, "soul_self": 1.0}, "weights": {"christian_theism": 0.9}},
            {"code": "E", "text_en": "An evolving information pattern capable of synthetic substrate transfer.", "text_hi": "एक विकासशील संज्ञान प्रणाली जिसे डिजिटल रूप से संवर्धित किया जा सकता है।", "deltas": {"tech_optimism": 0.9, "transhumanism": 1.0}, "weights": {"transhumanism": 1.0}}
        ]
    },
    {
        "id": 9,
        "dimension": "Epistemology & Knowledge",
        "text_en": "How do human beings reliably acquire genuine truth and knowledge?",
        "text_hi": "मनुष्य को सत्य और वास्तविक ज्ञान की प्राप्ति सबसे प्रामाणिक रूप से कैसे होती है?",
        "options": [
            {"code": "A", "text_en": "Through systematic empirical observation, repeatable tests, and scientific falsification.", "text_hi": "अनुभवजन्य अवलोकन, दोहराए जा सकने वाले प्रयोगों और वैज्ञानिक पद्धति से।", "deltas": {"empiricism": 1.0, "rationalism": 0.8}, "weights": {"secular_humanism": 1.0}},
            {"code": "B", "text_en": "By combining rigorous rational logic with direct contemplative discernment.", "text_hi": "तर्कसंगत विवेक और प्रत्यक्ष अंतर्मुखी साधना के समन्वय द्वारा।", "deltas": {"rationalism": 0.8, "mysticism": 0.7}, "weights": {"advaita_vedanta": 0.8, "stoicism": 0.7}},
            {"code": "C", "text_en": "Pragmatic verification: ideas are true if they resolve real human challenges.", "text_hi": "व्यावहारिक पुष्टि: सत्य वही है जो जीवन की वास्तविक समस्याओं का समाधान करे।", "deltas": {"pragmatism": 1.0, "secularism": 0.6}, "weights": {"secular_humanism": 0.7}},
            {"code": "D", "text_en": "Through sacred revelation transmitted across holy scriptures and lineages.", "text_hi": "धर्मग्रंथों और पवित्र परंपराओं में प्रकट ईश्वरीय ज्ञान के माध्यम से।", "deltas": {"religious_authority": 1.0, "traditionalism": 0.8}, "weights": {"confucianism": 0.6, "christian_theism": 0.7}},
            {"code": "E", "text_en": "Through multifaceted viewpoints; no single system grasps totality (Anekānta).", "text_hi": "अनेक दृष्टिकोणों (अनेकांतवाद) से; कोई एक दृष्टिकोण पूर्ण सत्य नहीं समेट सकता।", "deltas": {"pluralism": 1.0, "skepticism": 0.7}, "weights": {"daoism": 0.8}}
        ]
    },
    {
        "id": 13,
        "dimension": "Truth & Realism",
        "text_en": "Does objective truth exist independently of human language and social constructs?",
        "text_hi": "क्या वस्तुनिष्ठ सत्य मानवीय भाषा और सामाजिक ढाँचों से स्वतंत्र रूप से मौजूद है?",
        "options": [
            {"code": "A", "text_en": "Yes: physical facts exist and are discovered through empirical science.", "text_hi": "हाँ: भौतिक जगत में वस्तुनिष्ठ तथ्य हैं जिन्हें वैज्ञानिक खोज से जाना जा सकता है।", "deltas": {"rationalism": 1.0, "empiricism": 0.9}, "weights": {"secular_humanism": 0.9}},
            {"code": "B", "text_en": "Objective cosmic and moral order (Ṛta / Logos) exists woven into the universe.", "text_hi": "ब्रह्मांड में एक वस्तुनिष्ठ आध्यात्मिक व नैतिक व्यवस्था (ऋत / लोगोस) विद्यमान है।", "deltas": {"virtue": 0.8, "spirituality": 0.8}, "weights": {"stoicism": 0.9}},
            {"code": "C", "text_en": "Truth is socially constructed, contextual, and deeply shaped by power dynamics.", "text_hi": "समस्त ज्ञान सामाजिक रूप से निर्मित, प्रासंगिक और भाषा द्वारा मध्यस्थ है।", "deltas": {"skepticism": 0.9, "pluralism": 0.8}, "weights": {"existentialism": 0.7}},
            {"code": "D", "text_en": "Absolute truth exists in transcendent oneness; worldly claims are relative.", "text_hi": "परम सत्य केवल पारलौकिक एकता में है, जबकि सांसारिक रूप सापेक्ष हैं।", "deltas": {"nondualism": 0.9, "mysticism": 0.8}, "weights": {"advaita_vedanta": 0.9}},
            {"code": "E", "text_en": "Truth is an evolving pragmatic toolkit refined through ongoing human experiment.", "text_hi": "सत्य एक निरंतर विकसित होने वाला व्यावहारिक अनुमान है जो अनुभव से सुधरे।", "deltas": {"pragmatism": 0.9, "rationalism": 0.6}, "weights": {"secular_humanism": 0.7}}
        ]
    },
    {
        "id": 17,
        "dimension": "Religion & Sacredness",
        "text_en": "What is the rightful role of religion and the sacred in modern civilization?",
        "text_hi": "आधुनीक सभ्यता में धर्म और पवित्रता की उचित भूमिका क्या है?",
        "options": [
            {"code": "A", "text_en": "Prescientific mythology that societies must replace with secular scientific reason.", "text_hi": "पुराने मिथक जिन्हें मानव सभ्यता को धर्मनिरपेक्ष विवेक से बदल देना चाहिए।", "deltas": {"secularism": 1.0, "materialism": 0.8}, "weights": {"secular_humanism": 1.0, "marxism": 0.9}},
            {"code": "B", "text_en": "An indispensable vehicle for inner self-discovery and transcendent realization.", "text_hi": "व्यक्तिगत आत्म-साक्षात्कार और ब्रह्मांडीय चेतना के बोध का एक अनिवार्य माध्यम।", "deltas": {"spirituality": 1.0, "mysticism": 0.9}, "weights": {"advaita_vedanta": 0.9}},
            {"code": "C", "text_en": "The divine foundation of moral duty, holy devotion, and eternal salvation.", "text_hi": "नैतिक व्यवस्था, पवित्र उपासना और शाश्वत मुक्ति का ईश्वरीय आधार।", "deltas": {"theism": 1.0, "religious_authority": 0.8}, "weights": {"christian_theism": 1.0}},
            {"code": "D", "text_en": "Deep reverence for the self-sustaining organic harmony of the biosphere.", "text_hi": "पारिस्थितिकी तंत्र और प्रकृति के अद्भुत संतुलन के प्रति सहज श्रद्धा।", "deltas": {"nature_harmony": 1.0, "biocentrism": 0.9}, "weights": {"daoism": 0.9, "deep_ecology": 0.8}},
            {"code": "E", "text_en": "Cultural heritage and rites that preserve intergenerational community cohesion.", "text_hi": "उपयोगी सांस्कृतिक परंपराएं जो समाज को जोड़ती हैं और धरोहर को संभालती हैं।", "deltas": {"traditionalism": 0.9, "order": 0.7}, "weights": {"confucianism": 0.9}}
        ]
    },
    {
        "id": 21,
        "dimension": "Death & Afterlife",
        "text_en": "What occurs to personal consciousness upon biological death?",
        "text_hi": "जैविक मृत्यु के समय मनुष्य की चेतना के साथ क्या घटित होता है?",
        "options": [
            {"code": "A", "text_en": "Complete biological cessation: subjective experience ends permanently.", "text_hi": "चेतना का पूर्ण जैविक अंत; कोई व्यक्तिपरक तत्व शेष नहीं रहता।", "deltas": {"materialism": 1.0, "secularism": 0.9}, "weights": {"secular_humanism": 1.0, "marxism": 0.8}},
            {"code": "B", "text_en": "Karmic continuation: awareness dissolves and re-emerges in ongoing life cycles.", "text_hi": "कर्मों का प्रवाह: चेतना नए जीवन चक्रों (पुनर्जन्म) में रूपांतरित होती है।", "deltas": {"reincarnation": 1.0, "impermanence": 0.8}, "weights": {"early_buddhism": 0.9, "advaita_vedanta": 0.8}},
            {"code": "C", "text_en": "The immortal soul enters a transcendent afterlife to be judged by God.", "text_hi": "अमर आत्मा ईश्वरीय न्याय के अनुसार शाश्वत परलोक में प्रवेश करती है।", "deltas": {"afterlife": 1.0, "theism": 0.9}, "weights": {"christian_theism": 1.0}},
            {"code": "D", "text_en": "Individual form dissolves back into the boundless flow of cosmic energy.", "text_hi": "व्यक्तिगत रूप प्रकृति के अनंत ऊर्जावान प्रवाह में पुनः विलीन हो जाता है।", "deltas": {"nature_harmony": 0.9, "nondualism": 0.8}, "weights": {"daoism": 0.9, "stoicism": 0.8}},
            {"code": "E", "text_en": "Biological death is an engineering obstacle that biotechnology will overcome.", "text_hi": "जैविक मृत्यु एक तकनीकी समस्या है जिसे विज्ञान द्वारा हल किया जा सकता है।", "deltas": {"transhumanism": 1.0, "tech_optimism": 1.0}, "weights": {"transhumanism": 1.0}}
        ]
    },
    {
        "id": 25,
        "dimension": "Purpose & Meaning",
        "text_en": "Where does genuine meaning and purpose in human existence originate?",
        "text_hi": "मानव जीवन में वास्तविक सार्थकता और उद्देश्य की उत्पत्ति कहाँ से होती है?",
        "options": [
            {"code": "A", "text_en": "Meaning is self-authored: individuals freely construct purpose in an open cosmos.", "text_hi": "कोई पूर्व-निर्धारित उद्देश्य नहीं है; मनुष्य को स्वयं अपना अर्थ रचना होगा।", "deltas": {"existentialism": 1.0, "individualism": 0.8}, "weights": {"existentialism": 1.0}},
            {"code": "B", "text_en": "From cultivating excellence of character and fulfilling rational virtue.", "text_hi": "नैतिक कर्तव्यों के पालन और चारित्रिक सद्गुणों के विकास से।", "deltas": {"virtue": 1.0, "self_discipline": 0.9}, "weights": {"stoicism": 1.0, "confucianism": 0.8}},
            {"code": "C", "text_en": "From dedicating one's life to divine service, worship, and loving God.", "text_hi": "ईश्वरीय इच्छा के प्रति समर्पण और आध्यात्मिक प्रेम से।", "deltas": {"theism": 1.0, "spirituality": 0.9}, "weights": {"christian_theism": 1.0}},
            {"code": "D", "text_en": "From participating in collective struggles to eradicate social oppression.", "text_hi": "समाज को शोषण, अन्याय और गरीबी से मुक्त कराने के सामूहिक संघर्ष से।", "deltas": {"social_justice": 1.0, "collectivism": 0.8}, "weights": {"marxism": 1.0}},
            {"code": "E", "text_en": "From overcoming the illusion of separate ego and ending suffering for all beings.", "text_hi": "अहंकार के भ्रम से मुक्ति पाने और समस्त प्राणियों के दुःख निवारण से।", "deltas": {"ahimsa": 0.9, "no_self": 0.9}, "weights": {"early_buddhism": 1.0}}
        ]
    },
    {
        "id": 29,
        "dimension": "Ethics & Meta-Ethics",
        "text_en": "What should serve as the ultimate foundation for ethical decisions?",
        "text_hi": "नैतिक निर्णयों का अंतिम व सर्वोपरि आधार क्या होना चाहिए?",
        "options": [
            {"code": "A", "text_en": "Cultivating internal character virtues such as wisdom, courage, and temperance.", "text_hi": "बुद्धिमत्ता, साहस और संयम जैसे आंतरिक चारित्रिक सद्गुणों का विकास।", "deltas": {"virtue": 1.0, "self_discipline": 0.9}, "weights": {"stoicism": 1.0, "confucianism": 0.9}},
            {"code": "B", "text_en": "Maximizing flourishing, happiness, and wellbeing for the greatest number.", "text_hi": "अधिकतम लोगों के लिए खुशहाली, सुख और समग्र कल्याण में वृद्धि करना।", "deltas": {"consequentialism": 1.0, "humanism": 0.8}, "weights": {"secular_humanism": 0.9}},
            {"code": "C", "text_en": "Universal, categorical moral duties that must be upheld regardless of outcome.", "text_hi": "सार्वभौमिक नैतिक कर्तव्य जिनका पालन बिना परिणाम की परवाह किए होना चाहिए।", "deltas": {"deontology": 1.0, "order": 0.6}, "weights": {"stoicism": 0.6}},
            {"code": "D", "text_en": "Relational empathy, community care, and restorative justice (Ubuntu).", "text_hi": "मानवीय संबंधों में संवेदनशीलता, आपसी देखभाल और सामुदायिक न्याय (उबुन्टु)।", "deltas": {"care_ethics": 1.0, "collectivism": 0.8}, "weights": {"ubuntu": 1.0}},
            {"code": "E", "text_en": "Universal non-violence (Ahimsa) extended across all living sentient beings.", "text_hi": "समस्त सचेतन प्राणी जगत के प्रति पूर्ण अहिंसा और करुणा।", "deltas": {"ahimsa": 1.0, "animal_ethics": 1.0}, "weights": {"early_buddhism": 0.9, "deep_ecology": 0.8}}
        ]
    },
    {
        "id": 33,
        "dimension": "Moral Action & Practical Virtue",
        "text_en": "When confronting a complex practical dilemma, what is the most trustworthy guide?",
        "text_hi": "जटिल नैतिक दुविधा में सबसे भरोसेमंद मार्गदर्शक सिद्धांत क्या है?",
        "options": [
            {"code": "A", "text_en": "Focus strictly on what is in your control and maintain rational moral integrity.", "text_hi": "केवल उस पर ध्यान दें जो आपके नियंत्रण में है और चारित्रिक निष्ठा बनाए रखें।", "deltas": {"virtue": 1.0, "self_discipline": 1.0}, "weights": {"stoicism": 1.0}},
            {"code": "B", "text_en": "Weigh measurable real-world outcomes and minimize total systemic harm.", "text_hi": "व्यावहारिक परिणामों का निष्पक्ष आकलन करें और होने वाले नुकसान को न्यूनतम करें।", "deltas": {"consequentialism": 1.0, "rationalism": 0.8}, "weights": {"secular_humanism": 0.9}},
            {"code": "C", "text_en": "Follow established religious commandments and sacred ancestral codes.", "text_hi": "धर्मग्रंथों, पवित्र आदेशों और स्थापित परंपराओं का मार्गदर्शन लें।", "deltas": {"traditionalism": 0.9, "religious_authority": 0.9}, "weights": {"christian_theism": 0.8}},
            {"code": "D", "text_en": "Seek consensus and prioritize the mutual harmony of the affected group.", "text_hi": "प्रभावित समुदाय की सहमति, सामंजस्य और आपसी रिश्तों को प्राथमिकता दें।", "deltas": {"community": 1.0, "care_ethics": 0.8}, "weights": {"ubuntu": 0.9}},
            {"code": "E", "text_en": "Act with effortless spontaneity (Wu-Wei), yielding to natural balance without force.", "text_hi": "बिना किसी हठधर्मिता के सहज व स्वाभाविक संतुलन (वू-वेई) का पालन करें।", "deltas": {"nature_harmony": 1.0, "anti_authoritarian": 0.7}, "weights": {"daoism": 1.0}}
        ]
    },
    {
        "id": 37,
        "dimension": "Human Nature",
        "text_en": "What is the foundational starting state of human nature?",
        "text_hi": "मानव स्वभाव का बुनियादी और प्रारंभिक स्वरूप क्या है?",
        "options": [
            {"code": "A", "text_en": "Naturally prosocial, cooperative, and oriented toward virtue when properly nurtured.", "text_hi": "स्वाभाविक रूप से सामाजिक, सहयोगी और सही वातावरण मिलने पर अच्छाई की ओर प्रवृत्त।", "deltas": {"humanism": 0.9, "equality": 0.8}, "weights": {"secular_humanism": 0.9, "confucianism": 0.7}},
            {"code": "B", "text_en": "Flawed and self-interested; requiring moral discipline, rule of law, or divine grace.", "text_hi": "त्रुटिपूर्ण या स्वार्थी; जिसे अनुशासन, कानून या दैवीय कृपा की आवश्यकता है।", "deltas": {"order": 0.8, "traditionalism": 0.8}, "weights": {"christian_theism": 0.8}},
            {"code": "C", "text_en": "A malleable blank slate formed entirely by material socio-economic conditions.", "text_hi": "एक कोरी पट्टी जो पूरी तरह से आर्थिक और भौतिक सामाजिक परिस्थितियों से आकार लेती है।", "deltas": {"materialism": 1.0, "socialism": 0.9}, "weights": {"marxism": 1.0}},
            {"code": "D", "text_en": "Radically unconditioned: existence precedes essence and we author our nature through choice.", "text_hi": "पूर्णतः स्वतंत्र जिसका कोई पूर्व-निर्धारित स्वभाव नहीं; हम अपने निर्णयों से स्वयं को गढ़ते हैं।", "deltas": {"existentialism": 1.0, "individualism": 0.9}, "weights": {"existentialism": 1.0}},
            {"code": "E", "text_en": "An imperfect biological platform ready for rational genetic and cognitive enhancement.", "text_hi": "एक परिवर्तनशील जैविक ढांचा जो तकनीकी संवर्धन के लिए तैयार है।", "deltas": {"transhumanism": 1.0, "tech_optimism": 0.9}, "weights": {"transhumanism": 1.0}}
        ]
    },
    {
        "id": 41,
        "dimension": "Self & Identity",
        "text_en": "How should a person understand their individual identity and selfhood?",
        "text_hi": "व्यक्ति को अपनी व्यक्तिगत पहचान और 'स्वयं' (Self) को किस प्रकार समझना चाहिए?",
        "options": [
            {"code": "A", "text_en": "An autonomous, rational individual entitled to self-determination and liberty.", "text_hi": "एक स्वायत्त, विवेकशील व्यक्ति जो आत्म-निर्णय और स्वतंत्रता का अधिकारी है।", "deltas": {"individualism": 1.0, "liberty": 0.9}, "weights": {"classical_liberalism": 1.0}},
            {"code": "B", "text_en": "Inextricably relational: personhood exists only through communal kinship (Ubuntu).", "text_hi": "अनिवार्य रूप से संबंधपरक: मनुष्य का अस्तित्व केवल समाज और रिश्तों के माध्यम से है।", "deltas": {"collectivism": 1.0, "community": 0.9}, "weights": {"ubuntu": 1.0, "confucianism": 0.8}},
            {"code": "C", "text_en": "An illusion: the separate ego is a cognitive construct causing craving and suffering.", "text_hi": "एक भ्रम: अलग 'अहंकार' केवल एक मानसिक रचना है जो आसक्ति और दुःख का कारण बनती है।", "deltas": {"no_self": 1.0, "impermanence": 0.9}, "weights": {"early_buddhism": 1.0}},
            {"code": "D", "text_en": "An individualized manifestation of singular universal awareness (Atman = Brahman).", "text_hi": "एकमात्र सार्वभौमिक चेतना की व्यक्तिगत अभिव्यक्ति (आत्मा = ब्रह्म)।", "deltas": {"nondualism": 1.0, "spirituality": 0.9}, "weights": {"advaita_vedanta": 1.0}},
            {"code": "E", "text_en": "A dynamic, self-authoring narrative constantly forged through authentic choice.", "text_hi": "एक गतिशील और स्वयं-निर्मित कहानी जिसे कर्म और रचनात्मकता से लगातार गढ़ा जाता है।", "deltas": {"existentialism": 0.9, "humanism": 0.7}, "weights": {"existentialism": 0.8}}
        ]
    },
    {
        "id": 45,
        "dimension": "Free Will & Agency",
        "text_en": "To what extent do human beings possess genuine free will?",
        "text_hi": "मनुष्य के पास किस सीमा तक वास्तविक स्वतंत्र इच्छाशक्ति (Free Will) है?",
        "options": [
            {"code": "A", "text_en": "Radical agency: we have unyielding existential freedom and total moral accountability.", "text_hi": "पूर्ण स्वायत्तता: हमारे पास पूर्ण नैतिक स्वतंत्रता और उत्तरदायित्व है।", "deltas": {"existentialism": 1.0, "liberty": 0.8}, "weights": {"existentialism": 1.0}},
            {"code": "B", "text_en": "Compatibilism: physical laws condition us, but rational deliberation remains meaningful.", "text_hi": "अनुकूलतावाद: भौतिक नियम हमें प्रभावित करते हैं, फिर भी विवेकपूर्ण निर्णय सार्थक हैं।", "deltas": {"compatibilism": 1.0, "rationalism": 0.7}, "weights": {"secular_humanism": 0.8}},
            {"code": "C", "text_en": "Hard determinism: human choices are the strict products of prior physical/neural causes.", "text_hi": "भौतिक नियतिवाद: निर्णय पूरी तरह मस्तिष्क और भौतिक स्थितियों के अनिवार्य परिणाम हैं।", "deltas": {"determinism": 1.0, "materialism": 0.9}, "weights": {"stoicism": 0.8}},
            {"code": "D", "text_en": "Interdependent co-arising: volition exists within a web of causal conditions.", "text_hi": "प्रतीत्यसमुत्पाद: इच्छाशक्ति स्वतंत्र नहीं, बल्कि कारणों और परिस्थितियों के जाल में कार्य करती है।", "deltas": {"impermanence": 0.9, "no_self": 0.8}, "weights": {"early_buddhism": 0.9}},
            {"code": "E", "text_en": "Human agency is divine purpose operating through mortal cooperation.", "text_hi": "मानवीय कर्म वस्तुतः ईश्वरीय इच्छा और नैतिक व्यवस्था का एक माध्यम है।", "deltas": {"theism": 0.9, "spirituality": 0.7}, "weights": {"christian_theism": 0.8}}
        ]
    },
    {
        "id": 49,
        "dimension": "Society & Community",
        "text_en": "What is the primary overarching goal of human civilization?",
        "text_hi": "मानव समाज और सभ्यता का प्राथमिक उद्देश्य क्या होना चाहिए?",
        "options": [
            {"code": "A", "text_en": "To secure individual liberty, natural rights, and personal autonomy.", "text_hi": "व्यक्तिगत स्वतंत्रता, मौलिक अधिकारों और स्वायत्तता की रक्षा करना।", "deltas": {"liberty": 1.0, "individualism": 0.9}, "weights": {"classical_liberalism": 1.0}},
            {"code": "B", "text_en": "To nurture deep mutual solidarity, equality, and shared community welfare.", "text_hi": "गहरी आपसी एकजुटता, सामाजिक समानता और साझा कल्याण को बढ़ावा देना।", "deltas": {"collectivism": 1.0, "equality": 0.9}, "weights": {"ubuntu": 1.0, "marxism": 0.8}},
            {"code": "C", "text_en": "To maintain ethical order, civic virtue, and intergenerational cultural stability.", "text_hi": "नैतिक व्यवस्था, चारित्रिक सद्गुण और पीढ़ी-दर-पीढ़ी चली आ रही मर्यादा को बनाए रखना।", "deltas": {"order": 0.9, "traditionalism": 0.9}, "weights": {"confucianism": 1.0}},
            {"code": "D", "text_en": "To accelerate scientific discovery, technology, and cosmic human potential.", "text_hi": "वैज्ञानिक प्रगति, तकनीकी विकास और मानव उत्थान को सक्षम बनाना।", "deltas": {"progressivism": 0.9, "tech_optimism": 0.9}, "weights": {"secular_humanism": 0.8, "transhumanism": 0.8}},
            {"code": "E", "text_en": "To dwell in sustainable, reciprocal balance within the planetary biosphere.", "text_hi": "प्राकृतिक पारिस्थितिकी तंत्र के साथ टिकाऊ और सामंजस्यपूर्ण संतुलन में जीना।", "deltas": {"biocentrism": 1.0, "environmentalism": 1.0}, "weights": {"deep_ecology": 1.0}}
        ]
    },
    {
        "id": 53,
        "dimension": "Liberty & Governance",
        "text_en": "What constitutes the optimal relationship between individual freedom and state power?",
        "text_hi": "व्यक्तिगत स्वतंत्रता और सरकारी सत्ता के बीच आदर्श संतुलन क्या होना चाहिए?",
        "options": [
            {"code": "A", "text_en": "Minimal government: the state exists solely to defend property, contracts, and bodily liberty.", "text_hi": "सीमित सरकार: शासन का कार्य केवल अधिकारों, संपत्ति और अनुबंधों की रक्षा तक सीमित हो।", "deltas": {"liberty": 1.0, "capitalism": 0.8}, "weights": {"classical_liberalism": 1.0}},
            {"code": "B", "text_en": "Democratic welfare state: public institutions balancing open markets with strong safety nets.", "text_hi": "लोकतांत्रिक कल्याणकारी राज्य: मजबूत संस्थाएं जो बाज़ार और सुरक्षा का संतुलन बनाएं।", "deltas": {"equality": 0.7, "liberty": 0.7, "secularism": 0.7}, "weights": {"secular_humanism": 0.9}},
            {"code": "C", "text_en": "Decentralized voluntary federations without coercive centralized hierarchies.", "text_hi": "केंद्रीकृत सत्ता से मुक्त, स्थानीय स्तर पर स्वैच्छिक और स्व-शासित समुदाय।", "deltas": {"anti_authoritarian": 1.0, "liberty": 0.8}, "weights": {"daoism": 0.8}},
            {"code": "D", "text_en": "Collective democratic planning to ensure resource distribution and social justice.", "text_hi": "संसाधोनों के समान वितरण और सामाजिक न्याय के लिए सामूहिक आर्थिक योजना।", "deltas": {"socialism": 1.0, "equality": 1.0}, "weights": {"marxism": 1.0}},
            {"code": "E", "text_en": "Virtuous leadership and meritocratic institutions maintaining civic discipline.", "text_hi": "सदाचारी नेतृत्व और योग्यता-आधारित संस्थाएं जो सामाजिक अनुशासन बनाए रखें।", "deltas": {"order": 0.9, "authority": 0.8}, "weights": {"confucianism": 0.9}}
        ]
    },
    {
        "id": 57,
        "dimension": "Authority & Institutional Order",
        "text_en": "What gives political authority and civic institutions their moral legitimacy?",
        "text_hi": "राजनीतिक सत्ता और नागरिक संस्थाओं को उनकी वैधता कहाँ से प्राप्त होती है?",
        "options": [
            {"code": "A", "text_en": "The transparent consent of the governed expressed via free elections and the rule of law.", "text_hi": "पारदर्शी चुनावों और कानून के शासन द्वारा नागरिकों की स्पष्ट सहमति से।", "deltas": {"secularism": 0.9, "liberty": 0.8}, "weights": {"secular_humanism": 0.9, "classical_liberalism": 0.8}},
            {"code": "B", "text_en": "Demonstrated administrative competence, moral character, and dedication to common welfare.", "text_hi": "नेतृत्व की योग्यता, चारित्रिक नैतिकता और लोक-कल्याण के प्रति समर्पण से।", "deltas": {"virtue": 0.9, "order": 0.8}, "weights": {"confucianism": 0.9, "stoicism": 0.7}},
            {"code": "C", "text_en": "Uncompromising fidelity to constitutional egalitarianism and systemic social justice.", "text_hi": "समानता और सामाजिक न्याय के संवैधानिक सिद्धांतों के निष्पक्ष क्रियान्वयन से।", "deltas": {"equality": 1.0, "social_justice": 0.9}, "weights": {"marxism": 0.8}},
            {"code": "D", "text_en": "Alignment with divine commandments and time-tested sacred traditions.", "text_hi": "ईश्वरीय व्यवस्था या समय की कसौटी पर खरी उतरी धार्मिक मर्यादा से।", "deltas": {"religious_authority": 1.0, "traditionalism": 0.9}, "weights": {"christian_theism": 0.8}},
            {"code": "E", "text_en": "Spontaneous voluntary association; coercive institutional hierarchy is inherently suspect.", "text_hi": "स्वैच्छिक सहयोग से; संस्थागत सत्ता स्वभावतः संदेहास्पद होती है।", "deltas": {"anti_authoritarian": 1.0, "liberty": 0.9}, "weights": {"daoism": 0.8}}
        ]
    },
    {
        "id": 61,
        "dimension": "Equality & Hierarchy",
        "text_en": "How should society structure human equality and existing hierarchies?",
        "text_hi": "मानवीय समानता और सामाजिक पदानुक्रम को समाज द्वारा किस रूप में देखा जाना चाहिए?",
        "options": [
            {"code": "A", "text_en": "Radical egalitarianism: dismantle systemic hierarchies to establish genuine social equality.", "text_hi": "पूर्ण समानता: समान गरिमा सुनिश्चित करने के लिए सभी पदानुक्रमों को समाप्त किया जाना चाहिए।", "deltas": {"equality": 1.0, "social_justice": 0.9}, "weights": {"marxism": 1.0, "ubuntu": 0.8}},
            {"code": "B", "text_en": "Equal legal rights and equal opportunity, while allowing unequal outcomes based on merit.", "text_hi": "समान अधिकार और समान अवसर, किंतु योग्यता व परिश्रम के आधार पर विभिन्न परिणामों की छूट।", "deltas": {"liberty": 0.9, "capitalism": 0.7}, "weights": {"classical_liberalism": 1.0}},
            {"code": "C", "text_en": "Hierarchical roles are natural and beneficial if guided by mutual obligation and benevolent care.", "text_hi": "पारस्परिक उत्तरदायित्व और स्नेह पर आधारित पदानुक्रम स्वाभाविक और सामंजस्यपूर्ण हैं।", "deltas": {"order": 0.9, "traditionalism": 0.8}, "weights": {"confucianism": 1.0}},
            {"code": "D", "text_en": "Spiritual egalitarianism: all souls share identical divine essence despite worldly rank.", "text_hi": "सांसारिक स्थिति से परे, सभी आत्माओं की समान आध्यात्मिक गरिमा।", "deltas": {"spirituality": 0.9, "nondualism": 0.8}, "weights": {"advaita_vedanta": 0.9}},
            {"code": "E", "text_en": "Biocentric equality: extend moral consideration beyond humans to all sentient creatures.", "text_hi": "जैव-समानता: नैतिक समानता का विस्तार केवल मनुष्यों तक नहीं बल्कि सभी प्राणियों तक।", "deltas": {"biocentrism": 1.0, "animal_ethics": 1.0}, "weights": {"deep_ecology": 1.0, "early_buddhism": 0.8}}
        ]
    },
    {
        "id": 65,
        "dimension": "Economics & Distribution",
        "text_en": "How should productive economic assets and material wealth be organized?",
        "text_hi": "आर्थिक संपदा और उत्पादन के संसाधनों की व्यवस्था किस प्रकार की जानी चाहिए?",
        "options": [
            {"code": "A", "text_en": "Private enterprise, voluntary competitive market exchange, and strong property rights.", "text_hi": "मुक्त बाज़ार व्यवस्था, निजी उद्यम और संपत्ति के अधिकारों की मजबूत सुरक्षा।", "deltas": {"capitalism": 1.0, "liberty": 0.9}, "weights": {"classical_liberalism": 1.0}},
            {"code": "B", "text_en": "Democratic public ownership of core infrastructure to abolish economic exploitation.", "text_hi": "शोषण समाप्त करने के लिए प्रमुख संसाधनों पर लोकतांत्रिक व सामूहिक स्वामित्व।", "deltas": {"socialism": 1.0, "equality": 1.0}, "weights": {"marxism": 1.0}},
            {"code": "C", "text_en": "A mixed economy: market competition regulated to fund comprehensive universal welfare.", "text_hi": "मिश्रित अर्थव्यवस्था: उद्यमशीलता को बढ़ावा देते हुए सार्वजनिक कल्याण योजनाओं का वित्तपोषण।", "deltas": {"equality": 0.6, "capitalism": 0.5, "secularism": 0.6}, "weights": {"secular_humanism": 0.9}},
            {"code": "D", "text_en": "Cooperative, localized gift economies anchored in mutual aid and modest consumption.", "text_hi": "पारस्परिक सहयोग और सादगी पर आधारित स्थानीय सहकारी नेटवर्क।", "deltas": {"community": 0.9, "care_ethics": 0.9}, "weights": {"ubuntu": 0.9, "daoism": 0.7}},
            {"code": "E", "text_en": "Automated post-scarcity abundance engineered through robotics and synthetic biology.", "text_hi": "उन्नत स्वचालन और तकनीक आधारित प्रचुरता जो परंपरागत अर्थशास्त्र को पीछे छोड़ दे।", "deltas": {"tech_optimism": 1.0, "transhumanism": 0.9}, "weights": {"transhumanism": 0.9}}
        ]
    },
    {
        "id": 69,
        "dimension": "Culture & Tradition",
        "text_en": "How should a society view its inherited traditions, customs, and ancestral rites?",
        "text_hi": "समाज को अपनी विरासत में मिली परंपराओं और ऐतिहासिक रीति-रिवाजों को कैसे देखना चाहिए?",
        "options": [
            {"code": "A", "text_en": "With deep reverence: traditions embody accumulated wisdom that ensures civic order.", "text_hi": "गहरे सम्मान के साथ: परंपराएं संचित ज्ञान का प्रतीक हैं जो स्थिरता प्रदान करती हैं।", "deltas": {"traditionalism": 1.0, "order": 0.8}, "weights": {"confucianism": 1.0}},
            {"code": "B", "text_en": "With critical rationalism: retain uplifting elements while reforming outdated dogmas.", "text_hi": "तर्कसंगत विवेक से: प्रेरणादायी तत्वों को अपनाएं और रूढ़िवादिता को त्यागें।", "deltas": {"progressivism": 0.8, "rationalism": 0.8}, "weights": {"secular_humanism": 0.9}},
            {"code": "C", "text_en": "With skepticism: traditional structures often entrench historic injustice and hierarchy.", "text_hi": "संदेह की दृष्टि से: पारंपरिक ढांचे अक्सर स्थापित असमानताओं को जायज ठहराते हैं।", "deltas": {"radicalism": 0.9, "social_justice": 0.9}, "weights": {"marxism": 0.9}},
            {"code": "D", "text_en": "As dynamic, organic cultural currents that adapt naturally over evolutionary time.", "text_hi": "परिवर्तनशील सांस्कृतिक अभिव्यक्ति के रूप में जो समय के साथ स्वाभाविक रूप से ढलती है।", "deltas": {"pluralism": 0.8, "impermanence": 0.7}, "weights": {"daoism": 0.8}},
            {"code": "E", "text_en": "As biological human legacies destined to be transcended in our digital future.", "text_hi": "मानव इतिहास के पुराने चरणों के रूप में, जिन्हें भविष्य की तकनीकी प्रगति में पीछे छोड़ना है।", "deltas": {"transhumanism": 1.0, "progressivism": 1.0}, "weights": {"transhumanism": 1.0}}
        ]
    },
    {
        "id": 73,
        "dimension": "Political Change",
        "text_en": "What is the most legitimate and effective strategy for correcting systemic social injustice?",
        "text_hi": "अन्यायपूर्ण सामाजिक व्यवस्थाओं में सुधार का सबसे प्रभावी और उचित तरीका क्या है?",
        "options": [
            {"code": "A", "text_en": "Gradual constitutional reform, electoral deliberation, and judicial rule of law.", "text_hi": "कानून के शासन और लोकतांत्रिक विमर्श के माध्यम से क्रमिक व संवैधानिक सुधार।", "deltas": {"progressivism": 0.7, "order": 0.7}, "weights": {"secular_humanism": 0.9, "classical_liberalism": 0.8}},
            {"code": "B", "text_en": "Mass collective mobilization and structural revolution to dismantle oligarchic power.", "text_hi": "उत्पीड़क सत्ता संरचनाओं को समाप्त करने के लिए सामूहिक जन-आंदोलन और आमूलचूल बदलाव।", "deltas": {"radicalism": 1.0, "socialism": 0.9}, "weights": {"marxism": 1.0}},
            {"code": "C", "text_en": "Principled non-violent civil resistance and moral appeals to conscience (Satyagraha).", "text_hi": "सार्वभौमिक अंतरात्मा को झकझोरने वाला अहिंसक प्रतिरोध और नैतिक सत्याग्रह।", "deltas": {"ahimsa": 1.0, "virtue": 0.8}, "weights": {"early_buddhism": 0.8, "ubuntu": 0.8}},
            {"code": "D", "text_en": "Focus on personal moral cultivation; outward institutional reform mirrors inner virtue.", "text_hi": "आंतरिक आत्म-सुधार पर ध्यान दें; व्यक्तिगत सद्गुणों से ही सामाजिक संतुलन संभव है।", "deltas": {"virtue": 1.0, "self_discipline": 0.9}, "weights": {"stoicism": 0.9, "confucianism": 0.8}},
            {"code": "E", "text_en": "Technological innovation that renders legacy political struggles obsolete.", "text_hi": "ऐसी तकनीकी खोजें जो पुरानी राजनीतिक समस्याओं को अप्रासंगिक बना दें।", "deltas": {"tech_optimism": 1.0, "transhumanism": 0.8}, "weights": {"transhumanism": 0.9}}
        ]
    },
    {
        "id": 76,
        "dimension": "Political Change Continued",
        "text_en": "How should society balance individual liberties against public safety during severe crises?",
        "text_hi": "संकट के समय व्यक्तिगत स्वतंत्रता और सार्वजनिक सुरक्षा के तनाव को कैसे संभालना चाहिए?",
        "options": [
            {"code": "A", "text_en": "Individual liberties must remain the supreme baseline, strictly limiting emergency powers.", "text_hi": "व्यक्तिगत स्वतंत्रता सर्वोच्च होनी चाहिए; आपातकालीन सरकारी नियमों की सख्त सीमाएं हों।", "deltas": {"liberty": 1.0, "individualism": 0.9}, "weights": {"classical_liberalism": 1.0}},
            {"code": "B", "text_en": "Temporary, transparent scientific restrictions are justified to protect vulnerable lives.", "text_hi": "सामूहिक जीवन की रक्षा के लिए साक्ष्य-आधारित और पारदर्शी नियम पूरी तरह उचित हैं।", "deltas": {"humanism": 0.9, "equality": 0.8}, "weights": {"secular_humanism": 0.9}},
            {"code": "C", "text_en": "Civic solidarity and mutual duty require citizens to willingly comply for collective defense.", "text_hi": "नागरिक कर्तव्य और आपसी सहयोग की मांग है कि समाज हित में अनुशासन अपनाया जाए।", "deltas": {"community": 0.9, "order": 0.9}, "weights": {"confucianism": 0.9, "ubuntu": 0.8}},
            {"code": "D", "text_en": "Ensure emergency executive powers do not become permanent tools of corporate/state control.", "text_hi": "यह सुनिश्चित करना कि संकट के नियम बाद में स्थायी तानाशाही न बन जाएं।", "deltas": {"anti_authoritarian": 1.0, "radicalism": 0.8}, "weights": {"marxism": 0.8}},
            {"code": "E", "text_en": "Maintain inner composure; societal crises are external tests of moral fortitude.", "text_hi": "आंतरिक धैर्य बनाए रखें; संकट चरित्र और विवेक की परीक्षा होते हैं।", "deltas": {"virtue": 1.0, "self_discipline": 1.0}, "weights": {"stoicism": 1.0}}
        ]
    },
    {
        "id": 77,
        "dimension": "Global Scope & Loyalty",
        "text_en": "Where should an individual's primary civic and moral loyalty reside?",
        "text_hi": "व्यक्ति की प्राथमिक नागरिक और नैतिक निष्ठा कहाँ होनी चाहिए?",
        "options": [
            {"code": "A", "text_en": "Cosmopolitan universalism: as a citizen of the cosmos, all humanity deserves equal care.", "text_hi": "विश्व-नागरिकता: पूरी मानवता के प्रति समान आदर और उत्तरदायित्व।", "deltas": {"cosmopolitanism": 1.0, "humanism": 0.9}, "weights": {"stoicism": 0.9, "secular_humanism": 0.9}},
            {"code": "B", "text_en": "One's sovereign nation-state, shared constitutional history, and fellow citizens first.", "text_hi": "अपने राष्ट्र, साझा सांस्कृतिक धरोहर और साथी नागरिकों के प्रति पहले।", "deltas": {"nationalism": 1.0, "traditionalism": 0.7}, "weights": {"confucianism": 0.7}},
            {"code": "C", "text_en": "One's immediate family, local kinship network, and organic home community.", "text_hi": "अपने परिवार, स्वजनों और स्थानीय समुदाय के प्रति।", "deltas": {"community": 1.0, "care_ethics": 0.8}, "weights": {"ubuntu": 0.9, "confucianism": 0.9}},
            {"code": "D", "text_en": "The entire living planetary biosphere, including non-human sentient life.", "text_hi": "समग्र जीवित ग्रह और पर्यावरण, जिसमें सभी सचेतन प्राणी शामिल हैं।", "deltas": {"biocentrism": 1.0, "environmentalism": 1.0}, "weights": {"deep_ecology": 1.0}},
            {"code": "E", "text_en": "A universal spiritual fellowship of truth-seekers transcending geopolitical borders.", "text_hi": "भौगोलिक सीमाओं से परे, आत्मिक साधकों और सत्य के खोजी समुदाय के प्रति।", "deltas": {"spirituality": 0.9, "universalism": 0.9}, "weights": {"advaita_vedanta": 0.8}}
        ]
    },
    {
        "id": 81,
        "dimension": "Ecology & Environment",
        "text_en": "How should human civilization understand its relationship with nature?",
        "text_hi": "मानव सभ्यता को प्राकृतिक पर्यावरण और प्रकृति को किस दृष्टिकोण से देखना चाहिए?",
        "options": [
            {"code": "A", "text_en": "Biocentric egalitarianism: all living systems possess inherent worth independent of human use.", "text_hi": "जैव-समानता: सभी जीवित प्राणियों का आंतरिक मूल्य मनुष्यों के बराबर है।", "deltas": {"biocentrism": 1.0, "environmentalism": 1.0}, "weights": {"deep_ecology": 1.0}},
            {"code": "B", "text_en": "Living in effortless, non-coercive alignment with organic ecological rhythms (Wu-Wei).", "text_hi": "प्राकृतिक पारिस्थितिकी के प्रवाह और सहज लय के साथ बिना दखल दिए जीना।", "deltas": {"nature_harmony": 1.0, "tech_caution": 0.7}, "weights": {"daoism": 1.0}},
            {"code": "C", "text_en": "Scientific stewardship: managing natural resources sustainably to advance human flourishing.", "text_hi": "वैज्ञानिक प्रबंधन: मानव कल्याण के लिए प्राकृतिक संसाधनों का टिकाऊ संरक्षण।", "deltas": {"environmentalism": 0.7, "humanism": 0.8}, "weights": {"secular_humanism": 0.8}},
            {"code": "D", "text_en": "Nature is a raw resource platform to be conquered, engineered, and optimized by technology.", "text_hi": "प्रकृति एक संसाधन है जिसे उन्नत तकनीक द्वारा रूपांतरित और समृद्ध किया जाना चाहिए।", "deltas": {"tech_optimism": 1.0, "transhumanism": 0.9}, "weights": {"transhumanism": 1.0}},
            {"code": "E", "text_en": "A sacred divine trust entrusted to human moral care by the Creator.", "text_hi": "सृष्टि द्वारा मानवता को सौंपा गया एक पवित्र व नैतिक उत्तरदायित्व।", "deltas": {"spirituality": 0.7, "virtue": 0.7}, "weights": {"confucianism": 0.6}}
        ]
    },
    {
        "id": 85,
        "dimension": "Animal Ethics & Sentience",
        "text_en": "What moral status and protection do non-human animals possess?",
        "text_hi": "मानवेतर पशुओं और प्राणियों को समाज में क्या नैतिक दर्जा प्राप्त होना चाहिए?",
        "options": [
            {"code": "A", "text_en": "Full moral rights: sentient animals feel pain and must not be exploited, commodified, or killed.", "text_hi": "सख्त नैतिक अधिकार: प्राणी दर्द महसूस करते हैं, अतः उनका शोषण या वध नहीं होना चाहिए।", "deltas": {"animal_ethics": 1.0, "ahimsa": 1.0}, "weights": {"deep_ecology": 0.9, "early_buddhism": 0.8}},
            {"code": "B", "text_en": "Welfare consideration: eliminate gratuitous cruelty, but human flourishing remains the priority.", "text_hi": "मानवीय व्यवहार: अनावश्यक क्रूरता से बचें, किंतु मानव हित सर्वोपरि हैं।", "deltas": {"humanism": 0.9, "rationalism": 0.7}, "weights": {"secular_humanism": 0.8}},
            {"code": "C", "text_en": "Sacred kinship: non-human creatures are evolutionary siblings requiring reverence.", "text_hi": "पवित्र संबंध: प्राणी हमारे सहयात्री हैं जिनके प्रति कृतज्ञता और संतुलन जरूरी है।", "deltas": {"nature_harmony": 0.9, "biocentrism": 0.9}, "weights": {"daoism": 0.8}},
            {"code": "D", "text_en": "Technological resolution: cultivate cellular agriculture (lab meat) to phase out animal farming.", "text_hi": "कृत्रिम तकनीक (प्रयोगशाला में बना मांस) द्वारा पशु-शोषण को पूर्णतः समाप्त करना।", "deltas": {"tech_optimism": 0.9, "progressivism": 0.8}, "weights": {"transhumanism": 0.8}},
            {"code": "E", "text_en": "Sentient souls bound within karmic cycles deserving active universal compassion.", "text_hi": "कर्म चक्रों में बंधी आत्माएं जो दया, करुणा और सुरक्षा की पात्र हैं।", "deltas": {"ahimsa": 0.9, "spirituality": 0.8}, "weights": {"advaita_vedanta": 0.8}}
        ]
    },
    {
        "id": 89,
        "dimension": "Technology & AI",
        "text_en": "What role should advanced technology and AI play in the future of humanity?",
        "text_hi": "मानवता के भविष्य में उन्नत तकनीक और कृत्रिम बुद्धिमत्ता (AI) की क्या भूमिका होनी चाहिए?",
        "options": [
            {"code": "A", "text_en": "Radical acceleration: merge with synthetic intelligence to transcend mortal biological limits.", "text_hi": "तीव्र संवर्धन: जैविक सीमाओं से पार पाने के लिए तकनीक से एकाकार होना।", "deltas": {"transhumanism": 1.0, "tech_optimism": 1.0}, "weights": {"transhumanism": 1.0}},
            {"code": "B", "text_en": "Technology must remain strictly governed to serve democratic, ethical human flourishing.", "text_hi": "तकनीक को सदैव लोकतांत्रिक मानवीय मूल्यों और कल्याण के अधीन रहना चाहिए।", "deltas": {"humanism": 0.9, "secularism": 0.7}, "weights": {"secular_humanism": 0.9}},
            {"code": "C", "text_en": "Deep precaution: artificial acceleration risks total ecological and spiritual alienation.", "text_hi": "गंभीर सतर्कता: अत्यधिक तकनीकी निर्भरता प्रकृति और चेतना से अलगाव पैदा करती है।", "deltas": {"tech_caution": 1.0, "biocentrism": 0.7}, "weights": {"deep_ecology": 0.9, "daoism": 0.7}},
            {"code": "D", "text_en": "Technology should be publicly owned and deployed to eradicate economic exploitation.", "text_hi": "तकनीक को सार्वजनिक संपदा बनाकर आर्थिक असमानता मिटाने के लिए प्रयोग करना।", "deltas": {"socialism": 0.9, "equality": 0.9}, "weights": {"marxism": 0.9}},
            {"code": "E", "text_en": "Pragmatic adoption: evaluate specific technologies iteratively based on practical outcomes.", "text_hi": "व्यावहारिक उपकरण जिन्हें ठोस उपयोगिता और समस्या-समाधान के आधार पर अपनाया जाए।", "deltas": {"rationalism": 0.8, "progressivism": 0.6}, "weights": {"stoicism": 0.6}}
        ]
    },
    {
        "id": 93,
        "dimension": "Civilizational Future",
        "text_en": "What should be the primary long-term mission of human civilization?",
        "text_hi": "मानव सभ्यता के लिए दीर्घकालिक दृष्टि से सबसे महत्वपूर्ण लक्ष्य क्या है?",
        "options": [
            {"code": "A", "text_en": "Multi-planetary expansion, cognitive enhancement, and cosmic spreading of intelligence.", "text_hi": "अंतरिक्ष में विस्तार, बौद्धिक संवर्धन और ब्रह्मांडीय चेतना का विकास।", "deltas": {"transhumanism": 1.0, "tech_optimism": 0.9}, "weights": {"transhumanism": 1.0}},
            {"code": "B", "text_en": "Restoring lasting regenerative balance with Earth's biosphere and halting ecocide.", "text_hi": "पृथ्वी के पर्यावरण के साथ संतुलन बनाना और प्राकृतिक विनाश को रोकना।", "deltas": {"biocentrism": 1.0, "environmentalism": 1.0}, "weights": {"deep_ecology": 1.0}},
            {"code": "C", "text_en": "Abolishing war, poverty, and systemic oppression through global democratic cooperation.", "text_hi": "वैश्विक सहयोग द्वारा गरीबी, असमानता और युद्ध को समाप्त करना।", "deltas": {"humanism": 0.9, "cosmopolitanism": 0.9}, "weights": {"secular_humanism": 0.9, "marxism": 0.8}},
            {"code": "D", "text_en": "Universal spiritual awakening and liberation from existential delusion and suffering.", "text_hi": "मानवता की आध्यात्मिक मुक्ति और सांसारिक दुःखों से पार पाना।", "deltas": {"spirituality": 1.0, "no_self": 0.8}, "weights": {"early_buddhism": 0.9, "advaita_vedanta": 0.9}},
            {"code": "E", "text_en": "Cultivating moral wisdom and self-control to wisely govern our immense technological powers.", "text_hi": "सद्गुण और विवेक का विकास करना ताकि तकनीकी शक्ति का सदुपयोग हो सके।", "deltas": {"virtue": 1.0, "self_discipline": 0.9}, "weights": {"stoicism": 0.9, "confucianism": 0.8}}
        ]
    },
    {
        "id": 97,
        "dimension": "Pluralism & Openness",
        "text_en": "How should society navigate deeply conflicting philosophical worldviews?",
        "text_hi": "परस्पर विरोधी और भिन्न सांस्कृतिक विचारों व मान्यताओं का सामना कैसे करना चाहिए?",
        "options": [
            {"code": "A", "text_en": "Universal rational scrutiny: all beliefs must be evaluated by evidence and human rights.", "text_hi": "सार्वभौमिक तर्क: विचारों को साक्ष्य, तर्क और मानवाधिकारों की कसौटी पर परखा जाए।", "deltas": {"rationalism": 0.9, "humanism": 0.9}, "weights": {"secular_humanism": 1.0}},
            {"code": "B", "text_en": "Deep epistemic humility: reality is multifaceted (Anekāntavāda) and exceeds single doctrines.", "text_hi": "गहरी वैचारिक विनम्रता: सत्य बहुआयामी है और किसी एक मत की बपौती नहीं।", "deltas": {"pluralism": 1.0, "skepticism": 0.8}, "weights": {"daoism": 0.9, "early_buddhism": 0.8}},
            {"code": "C", "text_en": "Radical toleration: non-coercive peaceful coexistence without imposing ideological orthodoxy.", "text_hi": "पूर्ण सहिष्णुता: दूसरों पर अपने विचार थोपे बिना शांतिपूर्ण सह-अस्तित्व।", "deltas": {"liberty": 1.0, "anti_authoritarian": 0.8}, "weights": {"classical_liberalism": 0.9}},
            {"code": "D", "text_en": "Relational dialogue focused on reciprocal communal care and collaborative living (Ubuntu).", "text_hi": "संवाद और आपसी समझ ताकि समुदाय में भाईचारा और सहयोग बना रहे।", "deltas": {"care_ethics": 0.9, "community": 0.9}, "weights": {"ubuntu": 1.0}},
            {"code": "E", "text_en": "Cherish ancestral foundations while treating external perspectives with courteous respect.", "text_hi": "अपनी मूल धरोहर की रक्षा करते हुए अन्य विचारों का शिष्टता से सम्मान करना।", "deltas": {"traditionalism": 0.9, "order": 0.7}, "weights": {"confucianism": 0.8}}
        ]
    }
]

# Ensure questions are fully indexed by sequential number mapping (1 to len)
for idx, q in enumerate(FALLBACK_QUESTIONS):
    q["number"] = idx + 1

# ==============================================================================
# 3. HELPER FUNCTIONS & STANDALONE PSYCHOMETRIC CALCULATIONS
# ==============================================================================
def map_deltas_to_dimensions(deltas):
    """
    Decouples raw latent-trait deltas and maps them directly to the 4 core coordinate dimensions:
    Dim 0: Transcendence (+) vs. Physicalism (-)
    Dim 1: Collectivism (+) vs. Individualism (-)
    Dim 2: Progressivism (+) vs. Traditionalist (-)
    Dim 3: Empiricism (+) vs. Rationalist (-)
    """
    dim_deltas = [0.0, 0.0, 0.0, 0.0]
    for trait, val in deltas.items():
        # Dim 0: Transcendence vs. Physicalism
        if trait in ["spirituality", "theism", "nondualism", "mysticism", "idealism", "afterlife", "reincarnation"]:
            dim_deltas[0] += val
        elif trait in ["materialism", "secularism", "secular_humanism"]:
            dim_deltas[0] -= val
            
        # Dim 1: Collectivism vs. Individualism
        if trait in ["collectivism", "community", "socialism", "equality", "social_justice", "care_ethics", "ahimsa", "consequentialism"]:
            dim_deltas[1] += val
        elif trait in ["individualism", "liberty", "existentialism", "capitalism"]:
            dim_deltas[1] -= val
            
        # Dim 2: Progressivism vs. Traditionalism
        if trait in ["progressivism", "tech_optimism", "transhumanism", "cosmopolitanism"]:
            dim_deltas[2] += val
        elif trait in ["traditionalism", "order", "religious_authority", "authority"]:
            dim_deltas[2] -= val
            
        # Dim 3: Empiricism vs. Rationalism
        if trait in ["empiricism", "skepticism", "pragmatism", "environmentalism", "biocentrism", "animal_ethics"]:
            dim_deltas[3] += val
        elif trait in ["rationalism", "deontology", "virtue", "self_discipline", "soul_self", "no_self", "impermanence"]:
            dim_deltas[3] -= val
            
    return dim_deltas

def calculate_coordinates_scaled(answers, questions, test_type="Quick"):
    """
    Processes user answers to calculate a compressed 4D coordinate vector.
    Applies tanh scaling dynamically.
    """
    user_vector = np.array([0.0, 0.0, 0.0, 0.0])
    questions_dict = {q["id"]: q for q in questions}
    
    for q_id, chosen_code in answers.items():
        q_id = int(q_id)
        q = questions_dict.get(q_id)
        if not q:
            continue
        
        # Find matching option deltas
        chosen_opt = next((o for o in q["options"] if o["code"] == chosen_code), None)
        if chosen_opt and "deltas" in chosen_opt:
            option_dims = map_deltas_to_dimensions(chosen_opt["deltas"])
            user_vector += np.array(option_dims)
            
    total_expected = 25.0 if test_type == "Quick" else 100.0
    scaling_factor = 100.0 / total_expected
    
    # Scale raw dimensions and compress via tanh into [-1.0, 1.0]
    final_vector = [float(np.tanh(val * 0.15 * scaling_factor)) for val in user_vector]
    return final_vector

def cosine_similarity(v1, v2):
    dot_product = np.dot(v1, v2)
    norm_v1 = np.linalg.norm(v1)
    norm_v2 = np.linalg.norm(v2)
    if norm_v1 == 0 or norm_v2 == 0:
        return 0.0
    return float(dot_product / (norm_v1 * norm_v2))

def calculate_affinities(user_coords):
    results = []
    for school_name, data in WORLDVIEWS.items():
        sim = cosine_similarity(user_coords, data["vector"])
        # Map similarity from [-1.0, 1.0] to [0.0, 1.0] percentage range
        sim_pct = max(0.0, (sim + 1.0) / 2.0)
        results.append({
            "name": school_name,
            "similarity": sim,
            "similarity_pct": sim_pct,
            "thinkers": data["thinkers"],
            "description": data["description"]
        })
    return sorted(results, key=lambda x: x["similarity_pct"], reverse=True)

def characterize_profile(user_coords, language="English"):
    labels_en = [
        "Spiritualist" if user_coords[0] > 0.1 else "Physicalist",
        "Communitarian" if user_coords[1] > 0.1 else "Individualist",
        "Progressive" if user_coords[2] > 0.1 else "Traditionalist",
        "Empiricist" if user_coords[3] > 0.1 else "Rationalist"
    ]
    labels_hi = [
        "आध्यात्मिक" if user_coords[0] > 0.1 else "भौतिकवादी",
        "सामुदायिक" if user_coords[1] > 0.1 else "व्यक्तिवादी",
        "प्रगतिशील" if user_coords[2] > 0.1 else "पारंपरिक",
        "अनुभववादी" if user_coords[3] > 0.1 else "बुद्धिवादी"
    ]
    return labels_hi if language == "Hindi" else labels_en

def check_tensions(answers, language="English"):
    ans = {int(k): str(v).upper() for k, v in answers.items()}
    tensions = []
    
    # Tension 1: Mystic-Empiricist
    has_brahman = ans.get(1) == 'B'
    has_strict_evidence = ans.get(9) == 'A'
    if has_brahman and has_strict_evidence:
        tensions.append({
            "title_en": "⚡ The Mystical-Empirical Threshold",
            "title_hi": "⚡ रहस्यवादी-अनुभवजन्य दहलीज (The Mystical-Empirical Threshold)",
            "desc_en": "You believe that reality is ultimately comprised of a non-dual cosmic consciousness (Brahman) or that physical matter is a temporary illusion, yet you also assert that scientific replication and empirical evidence are the sole arbiters of truth. Because consciousness itself is non-quantifiable, this places you at the heart of the 'Hard Problem of Consciousness'.",
            "desc_hi": "आप मानते हैं कि वास्तविकता अंततः एक गैर-द्वैत ब्रह्मांडीय चेतना (ब्रह्म) से बनी है या भौतिक जगत एक आभासी माया है, फिर भी आप यह भी दावा करते हैं कि वैज्ञानिक पद्धति और अनुभवजन्य साक्ष्य सत्य के एकमात्र कसौटी हैं। चूंकि चेतना स्वयं मापने योग्य नहीं है, यह विरोधाभास आपको 'चेतना की कठिन समस्या' के केंद्र में खड़ा करता है।"
        })
        
    # Tension 2: Individual Liberty vs Collective Mandatory Care
    has_liberty_first = ans.get(49) == 'A'
    has_collective_welfare = ans.get(53) == 'D' or ans.get(76) == 'C'
    if has_liberty_first and has_collective_welfare:
        tensions.append({
            "title_en": "⚡ Individual Freedom vs. Collective Solidarity",
            "title_hi": "⚡ व्यक्तिगत स्वतंत्रता बनाम सामूहिक एकजुटता (Individual Freedom vs. Collective Solidarity)",
            "desc_en": "You strongly support the view that fundamental individual rights are inviolable boundaries that should never be traded away, yet you also support state-coordinated economic planning or collective mandates during crises to protect the community. This represents the classic friction between classical liberalism and communitarian social democracy.",
            "desc_hi": "आप इस विचार का दृढ़ता से समर्थन करते हैं कि मौलिक व्यक्तिगत अधिकार अनुल्लंघनीय सीमाएं हैं जिनका कभी भी समझौता नहीं किया जाना चाहिए, फिर भी आप संकट के दौरान समुदाय की सुरक्षा के लिए राज्य-समन्वित सामूहिक योजना या शासनादेशों का समर्थन करते हैं। यह शास्त्रीय उदारवाद और सामूहिक सामाजिक लोकतंत्र के बीच का क्लासिक विरोधाभास दर्शाता है।"
        })
        
    # Tension 3: Technological Acceleration vs. Biocentric Limits
    has_acceleration = ans.get(89) == 'A'
    has_deep_ecology = ans.get(81) == 'A' or ans.get(82) == 'A'
    if has_acceleration and has_deep_ecology:
        tensions.append({
            "title_en": "⚡ Promethean Ambition vs. Ecological Reciprocity",
            "title_hi": "⚡ प्रोमेथियन महत्वाकांक्षा बनाम पारिस्थितिक परस्पर संबंध (Promethean Ambition vs. Ecological Reciprocity)",
            "desc_en": "You view nature as a platform to be optimized and transcended using biotechnology and life-extension science, yet you also hold that the planetary biosphere has non-negotiable, intrinsic value that humans should unconditionally respect. Balancing transhumanist Promethean ambition with deep ecological humility represents one of the most critical challenges of our century.",
            "desc_hi": "आप प्रकृति को जैव प्रौद्योगिकी और जीवन-विस्तार विज्ञान का उपयोग करके अनुकूलित और पार करने का एक माध्यम मानते हैं, फिर भी आप यह भी मानते हैं कि ग्रहों के जीवमंडल का गैर-परक्राम्य, अंतर्निहित मूल्य है जिसका मनुष्यों को बिना शर्त सम्मान करना चाहिए। गहन पारिस्थितिक विनम्रता के साथ ट्रांसह्यूमनिस्ट महत्वाकांक्षा को संतुलित करना हमारे युग की सबसे बड़ी चुनौतियों में से एक है।"
        })
        
    return tensions

# ==============================================================================
# 4. BILINGUAL USER INTERFACE TEXT DICTIONARY
# ==============================================================================
UI_TEXT = {
    "English": {
        "title": "The Compass of Human Perspectives",
        "subtitle": "Why do you believe what you believe?",
        "tagline": "Embark on an intellectually serious, non-judgmental exploration of your core beliefs. Under the hood, this app models a decoupled multi-dimensional vector space, mapping your answers strictly to latent traits rather than biased final labels. Discover where you stand on global spectras and explore your alignments to 13 historical lineages, from Stoicism and Advaita Vedanta to Marxism and Deep Ecology.",
        "start_btn": "Begin the Odyssey →",
        "quick_test": "Quick Odyssey (25 questions)",
        "quick_desc": "Explore 25 core questions representing each major dimension of existence.",
        "test_type_label": "Choose your Odyssey length:",
        "reset_btn": "Reset Session State",
        "progress_label": "Question {current} of {total}",
        "prev_btn": "← Previous",
        "next_btn": "Next →",
        "reveal_btn": "Reveal My Worldview 🧭",
        "result_title": "A Worldview Has Emerged",
        "result_subtitle": "Your custom coordinates compared with historical worldviews.",
        "map_title": "📊 Vector Space Alignment",
        "char_title": "🧭 Profile Characterization",
        "archetype_label": "Your Psychological/Philosophical Archetype",
        "affinity_title": "Your primary philosophical affinity resembles <strong>{school}</strong> with a <strong>{similarity:.1%} similarity</strong> match.",
        "thinkers_label": "Key Thinkers in this tradition:",
        "affinities_label": "🏛️ Major Historical Lineages",
        "challenge_title": "⚡ Epistemic Challenges & Cognitive Tensions",
        "challenge_desc": "Worldviews are dynamic, and logical friction is the spark of self-discovery. Based on your selections, the engine has flagged the following active cognitive tensions:",
        "no_tensions": "🟢 No major structural tensions detected! Your worldview displays high internal consistency.",
        "confidence_title": "🔍 Epistemic Confidence and Belief Strength",
        "confidence_desc": "Worldview Explorer 2.0 distinguishes between how strongly you feel about your answers vs. how open you are to changing your mind when presented with empirical or logical counter-evidence.",
        "confidence_label": "My Epistemic Confidence level (how certain I am of holding objective, absolute truths):",
        "confidence_low": "Humility (I hold my beliefs provisionally, open to new evidence)",
        "confidence_high": "Absolute Certainty (My core beliefs represent non-negotiable objective truths)"
    },
    "Hindi": {
        "title": "मानव दृष्टिकोण का कम्पास (The Compass of Human Perspectives)",
        "subtitle": "आप जो मानते हैं, क्यों मानते हैं?",
        "tagline": "अपने मूल विश्वासों की एक बौद्धिक रूप से गंभीर, गैर-न्यायिक खोज शुरू करें। यह ऐप आंतरिक रूप से एक डिकपल्ड बहु-आयामी वेक्टर स्पेस का उपयोग करता है, जो आपके उत्तरों को पक्षपातपूर्ण लेबल के बजाय सीधे छिपे हुए दार्शनिक लक्षणों से जोड़ता है। जानें कि आप वैश्विक दृष्टिकोणों पर कहाँ खड़े हैं और स्टोइसिज्म, अद्वैत वेदांत से लेकर मार्क्सवाद और गहन पारिस्थितिकी तक 13 ऐतिहासिक दार्शनिक परंपराओं के साथ अपनी समानता खोजें।",
        "start_btn": "यात्रा शुरू करें →",
        "quick_test": "त्वरित यात्रा (25 प्रश्न)",
        "quick_desc": "अस्तित्व के प्रत्येक प्रमुख आयाम का प्रतिनिधित्व करने वाले 25 प्रमुख प्रश्नों का अन्वेषण करें।",
        "test_type_label": "अपनी यात्रा की लंबाई चुनें:",
        "reset_btn": "सत्र रीसेट करें",
        "progress_label": "प्रश्न {current} का {total}",
        "prev_btn": "← पिछला",
        "next_btn": "आगे →",
        "reveal_btn": "मेरा विश्वदृष्टिकोण प्रकट करें 🧭",
        "result_title": "एक नया विश्वदृष्टिकोण उदय हुआ है",
        "result_subtitle": "ऐतिहासिक विश्वदृष्टिकोणों के साथ आपके निर्देशांकों की तुलना।",
        "map_title": "📊 वेक्टर स्पेस संरेखण",
        "char_title": "🧭 प्रोफ़ाइल लक्षण वर्णन",
        "archetype_label": "आपका मनोवैज्ञानिक और दार्शनिक आर्केटाइप",
        "affinity_title": "आपकी प्राथमिक दार्शनिक समानता {similarity:.1%} मैच के साथ <strong>{school}</strong> से मिलती जुलती है।",
        "thinkers_label": "इस परंपरा के प्रमुख विचारक:",
        "affinities_label": "🏛️ प्रमुख ऐतिहासिक दार्शनिक परंपराएं",
        "challenge_title": "⚡ बौद्धिक चुनौतियां और संज्ञानात्मक तनाव",
        "challenge_desc": "विश्वदृष्टिकोण गतिशील होते हैं, और विचारों का घर्षण ही आत्म-खोज का स्रोत है। आपके उत्तरों के आधार पर इंजन ने निम्नलिखित संज्ञानात्मक विरोधाभासों को चिह्नित किया है:",
        "no_tensions": "🟢 कोई बड़ा विरोधाभास नहीं पाया गया! आपका विश्वदृष्टिकोण अत्यधिक सुसंगत है।",
        "confidence_title": "🔍 बौद्धिक आत्मविश्वास और विश्वास की गहराई",
        "confidence_desc": "यह प्रणाली इस बात में अंतर करती है कि आप अपने उत्तरों को कितना मजबूत मानते हैं बनाम अनुभवजन्य या तार्किक विपरीत साक्ष्य मिलने पर आप अपनी राय बदलने के लिए कितने खुले हैं।",
        "confidence_label": "मेरा बौद्धिक आत्मविश्वास स्तर (मैं पूर्ण, निरपेक्ष सत्य रखने के बारे में कितना आश्वस्त हूँ):",
        "confidence_low": "बौद्धिक विनम्रता (मैं नए साक्ष्यों के आधार पर अपने विश्वास बदलने को तैयार हूँ)",
        "confidence_high": "पूर्ण निश्चितता (मेरे मूल विश्वास गैर-परक्राम्य और निरपेक्ष सत्य का प्रतिनिधित्व करते हैं)"
    }
}

# ==============================================================================
# 5. STATE INITIALIZATION & SYSTEM SETTINGS
# ==============================================================================
if "answers" not in st.session_state:
    st.session_state.answers = {}
if "current_question_index" not in st.session_state:
    st.session_state.current_question_index = 0
if "language" not in st.session_state:
    st.session_state.language = "English"
if "started" not in st.session_state:
    st.session_state.started = False
if "completed" not in st.session_state:
    st.session_state.completed = False

# ==============================================================================
# 6. APP RENDER LOOP
# ==============================================================================

# Top Bar with Language Selector
header_col1, header_col2 = st.columns([8, 2])
with header_col1:
    st.markdown("""
    <div style='display: flex; align-items: center; gap: 12px; margin-top: 15px;'>
        <span style='font-size: 2.2rem;'>🧭</span>
        <span style='font-family: "Cinzel", serif; font-weight: 700; font-size: 1.6rem; color: #FFF; letter-spacing: 0.05em;'>WORLDVIEW COMPASS</span>
    </div>
    """, unsafe_allow_html=True)
with header_col2:
    selected_lang = st.selectbox(
        "Language / भाषा",
        ["English", "Hindi"],
        index=0 if st.session_state.language == "English" else 1,
        label_visibility="collapsed"
    )
    if selected_lang != st.session_state.language:
        st.session_state.language = selected_lang
        st.rerun()

st.write("---")
ui = UI_TEXT[st.session_state.language]
questions = FALLBACK_QUESTIONS

# ------------------------------------------------------------------------------
# LANDING PAGE VIEW
# ------------------------------------------------------------------------------
if not st.session_state.started and not st.session_state.completed:
    st.markdown(f"""
    <div class='hero-container'>
        <h1 style='font-size: 3rem; margin-bottom: 12px; color:#FFD700; font-family:"Cinzel", serif;'>🧭 {ui['title']}</h1>
        <p class='app-subtitle'>“{ui['subtitle']}”</p>
        <p style='max-width: 800px; margin: 30px auto; font-size: 1.15rem; line-height: 1.8; color: #CBD5E1;'>
            {ui['tagline']}
        </p>
    </div>
    """, unsafe_allow_html=True)
    
    col_center1, col_center2, col_center3 = st.columns([3, 4, 3])
    with col_center2:
        if st.button(ui["start_btn"], use_container_width=True, type="primary"):
            st.session_state.started = True
            st.session_state.current_question_index = 0
            st.session_state.answers = {}
            st.session_state.completed = False
            st.rerun()

# ------------------------------------------------------------------------------
# THE QUESTIONNAIRE ODYSSEY VIEW
# ------------------------------------------------------------------------------
elif st.session_state.started and not st.session_state.completed:
    idx = st.session_state.current_question_index
    q = questions[idx]
    
    # Progress indicator blocks
    progress_pct = (idx + 1) / len(questions)
    st.progress(progress_pct, text=ui["progress_label"].format(current=idx + 1, total=len(questions)))
    
    # Render interactive card
    st.markdown(f"""
    <div class="question-card">
        <div class="question-dim">Dimension: {q['dimension']}</div>
        <div class="question-text">
            {q['text_en']}<br>
            <span style='font-size: 1.2rem; font-style: italic; color:#94A3B8;'>{q['text_hi']}</span>
        </div>
    </div>
    """, unsafe_allow_html=True)
    
    # Build multiple choice options
    options_dict = {}
    options_list = []
    for opt in q["options"]:
        opt_label = f"**{opt['code']}**: {opt['text_en']} / *{opt['text_hi']}*"
        options_dict[opt_label] = opt["code"]
        options_list.append(opt_label)
        
    current_answer = st.session_state.answers.get(q["id"], None)
    default_index = 0
    if current_answer:
        default_index = next((i for i, opt in enumerate(q["options"]) if opt["code"] == current_answer), 0)
        
    selected_option = st.radio(
        "Choose your alignment:",
        options_list,
        index=default_index,
        key=f"q_{q['id']}"
    )
    
    st.session_state.answers[q["id"]] = options_dict[selected_option]
    
    st.write("")
    
    # Navigation row
    nav_col1, nav_col2, nav_col3 = st.columns([2, 6, 2])
    with nav_col1:
        if idx > 0:
            if st.button(ui["prev_btn"], use_container_width=True):
                st.session_state.current_question_index -= 1
                st.rerun()
    with nav_col3:
        if idx < len(questions) - 1:
            if st.button(ui["next_btn"], use_container_width=True, type="primary"):
                st.session_state.current_question_index += 1
                st.rerun()
        else:
            if st.button(ui["reveal_btn"], use_container_width=True, type="primary"):
                st.session_state.completed = True
                st.session_state.started = False
                st.rerun()

# ------------------------------------------------------------------------------
# THE PROFILE REVEAL VIEW (COGNITIVE MIRROR)
# ------------------------------------------------------------------------------
elif st.session_state.completed:
    user_coords = calculate_coordinates_scaled(st.session_state.answers, questions, "Quick")
    affinities = calculate_affinities(user_coords)
    profile_tags = characterize_profile(user_coords, st.session_state.language)
    primary_match = affinities[0]
    
    st.markdown(f"""
    <div style='text-align: center; margin-bottom: 2rem;'>
        <h1 style='font-size: 2.8rem; font-family:"Cinzel", serif; color:#FFD700;'>✨ {ui['result_title']}</h1>
        <p style='color:#94A3B8; font-size: 1.15rem; font-style:italic;'>{ui['result_subtitle']}</p>
    </div>
    """, unsafe_allow_html=True)
    
    col_res1, col_res2 = st.columns([5, 5])
    
    with col_res1:
        # Profile Tagging and Characterization Card
        tags_joined = " • ".join(profile_tags)
        st.markdown(f"""
        <div class="profile-card">
            <div class="profile-header">{ui['char_title']}</div>
            <div class="profile-tags">{tags_joined}</div>
            <div style='font-size: 1.15rem; line-height: 1.7; color:#E2E8F0; margin-bottom: 20px;'>
                {ui['affinity_title'].format(school=primary_match['name'], similarity=primary_match['similarity_pct'])}
            </div>
            <p style='color:#94A3B8; font-size:1.0rem; line-height: 1.6; margin-bottom: 20px;'>
                {primary_match['description']}
            </p>
            <div style='font-weight: 600; color:#FFD700; margin-bottom: 5px;'>{ui['thinkers_label']}</div>
            <div style='font-style: italic; color:#E2E8F0;'>{", ".join(primary_match['thinkers'])}</div>
        </div>
        """, unsafe_allow_html=True)
        
    with col_res2:
        # 3D Vector Space Map visualization
        st.markdown(f"### {ui['map_title']}")
        
        # Build vector map coordinates
        fig = go.Figure()
        
        # Plot major historical worldviews
        wv_names = []
        wv_x, wv_y, wv_z = [], [], []
        wv_descriptions = []
        
        for name, data in WORLDVIEWS.items():
            wv_names.append(name)
            wv_x.append(data["vector"][0])
            wv_y.append(data["vector"][1])
            wv_z.append(data["vector"][2])
            wv_descriptions.append(data["description"])
            
        fig.add_trace(go.Scatter3d(
            x=wv_x, y=wv_y, z=wv_z,
            mode='markers+text',
            text=wv_names,
            textposition="top center",
            hoverinfo="text+name",
            hovertext=wv_descriptions,
            name="Schools of Thought",
            marker=dict(
                size=6,
                color='#1E40AF',
                opacity=0.75,
                line=dict(color='rgba(255,255,255,0.2)', width=1)
            ),
            textfont=dict(color='#CBD5E1', size=9)
        ))
        
        # Plot user coordinates
        fig.add_trace(go.Scatter3d(
            x=[user_coords[0]], y=[user_coords[1]], z=[user_coords[2]],
            mode='markers+text',
            text=["YOU"],
            textposition="top center",
            name="Your Perspective",
            marker=dict(
                size=12,
                color='#FFD700',
                opacity=1.0,
                symbol='diamond',
                line=dict(color='#FFFFFF', width=2)
            ),
            textfont=dict(color='#FFFFFF', size=14, family='Cinzel')
        ))
        
        # Style the layout beautifully
        fig.update_layout(
            paper_bgcolor='rgba(0,0,0,0)',
            plot_bgcolor='rgba(0,0,0,0)',
            margin=dict(l=0, r=0, b=0, t=40),
            scene=dict(
                xaxis=dict(title='Transcendence', backgroundcolor='#0B0F19', color='#64748B', showbackground=True),
                yaxis=dict(title='Collectivism', backgroundcolor='#0B0F19', color='#64748B', showbackground=True),
                zaxis=dict(title='Progressivism', backgroundcolor='#0B0F19', color='#64748B', showbackground=True),
            ),
            legend=dict(x=0, y=1, bgcolor='rgba(15,23,42,0.8)')
        )
        
        st.plotly_chart(fig, use_container_width=True)

    st.write("---")
    
    # Affinities Table
    st.markdown(f"### {ui['affinities_label']}")
    
    cols_affinity = st.columns(3)
    for idx_aff, affinity in enumerate(affinities[:6]):
        col_idx = idx_aff % 3
        with cols_affinity[col_idx]:
            st.markdown(f"""
            <div style='background:rgba(15, 23, 42, 0.7); border:1px solid rgba(255,215,0,0.08); border-radius:12px; padding:20px; margin-bottom:15px;'>
                <div style='display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;'>
                    <strong style='font-size:1.1rem; color:#FFF;'>{affinity['name']}</strong>
                    <span style='color:#FFD700; font-weight:700;'>{affinity['similarity_pct']:.1%}</span>
                </div>
                <p style='color:#94A3B8; font-size:0.92rem; line-height:1.5; margin-bottom:10px;'>{affinity['description']}</p>
                <div style='font-size:0.85rem; color:#E2E8F0;'><strong style='color:#FFD700;'>Key Thinkers:</strong> {", ".join(affinity['thinkers'])}</div>
            </div>
            """, unsafe_allow_html=True)

    st.write("---")
    
    # Active Cognitive Tensions Section (THE CHALLENGE)
    st.markdown(f"### {ui['challenge_title']}")
    tensions = check_tensions(st.session_state.answers, st.session_state.language)
    
    if tensions:
        st.markdown(f"<p style='color:#cbd5e1; font-size:1.02rem;'>{ui['challenge_desc']}</p>", unsafe_allow_html=True)
        for t in tensions:
            title = t["title_hi"] if st.session_state.language == "Hindi" else t["title_en"]
            desc = t["desc_hi"] if st.session_state.language == "Hindi" else t["desc_en"]
            st.markdown(f"""
            <div class="tension-box">
                <div class="tension-title">{title}</div>
                <div class="tension-desc">{desc}</div>
            </div>
            """, unsafe_allow_html=True)
    else:
        st.success(ui["no_tensions"])
        
    st.write("---")
    
    # Epistemic Confidence Slider (THE CONFIDENCE LAYER)
    st.markdown(f"### {ui['confidence_title']}")
    st.markdown(f"<p style='color:#cbd5e1; font-size:1.02rem;'>{ui['confidence_desc']}</p>", unsafe_allow_html=True)
    
    st.slider(
        ui["confidence_label"],
        min_value=0,
        max_value=100,
        value=50,
        step=5,
        help="0 represents high epistemic humility (holding beliefs provisionally) and 100 represents complete absolute certainty (non-negotiable objective truths)."
    )
    st.markdown(f"""
    <div style='display:flex; justify-content:space-between; font-size:0.85rem; color:#94A3B8; margin-top:-10px; margin-bottom:20px;'>
        <span>👈 {ui['confidence_low']}</span>
        <span>{ui['confidence_high']} 👉</span>
    </div>
    """, unsafe_allow_html=True)
    
    st.write("")
    
    # Re-test button
    if st.button("🏛️ Run a New Assessment", type="primary"):
        st.session_state.completed = False
        st.session_state.started = False
        st.session_state.answers = {}
        st.session_state.current_question_index = 0
        st.rerun()
