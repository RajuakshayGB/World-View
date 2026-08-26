"""
The Compass of Human Perspectives (मानव दृष्टिकोण का कम्पास)
A standalone, museum-grade bilingual philosophical compass application.
"""

import os
import io
import json
import math
import random
import datetime
import numpy as np
import streamlit as st
from PIL import Image, ImageDraw, ImageFont

# ==============================================================================
# 1. STREAMLIT PAGE CONFIGURATION
# ==============================================================================
st.set_page_config(
    page_title="The Compass of Human Perspectives",
    page_icon="🧭",
    layout="wide",
    initial_sidebar_state="collapsed",
)

# ==============================================================================
# 2. PHILOSOPHICAL TRADITIONS & TAXONOMY
# ==============================================================================
# Vector Dimensions:
# 0: Physicalism (-1.0) <---> Transcendence (+1.0)
# 1: Individualism (-1.0) <---> Collectivism (+1.0)
# 2: Traditionalism (-1.0) <---> Progressivism (+1.0)
# 3: Rationalism (-1.0) <---> Empiricism (+1.0)

WORLDVIEWS = {
    "Stoicism": {
        "vector": np.array([-0.3, -0.4, -0.1, -0.5]),
        "thinkers": "Marcus Aurelius, Seneca, Epictetus",
        "desc_en": "Focuses on rational self-mastery, emotional fortitude, internal virtue, and harmony with cosmic reason.",
        "desc_hi": "तर्कसंगत आत्म-नियंत्रण, भावनात्मक संतुलन, आंतरिक सद्गुण और ब्रह्मांडीय नियम के साथ सामंजस्य पर केंद्रित।"
    },
    "Marxism": {
        "vector": np.array([-1.0, 1.0, 0.9, 0.5]),
        "thinkers": "Karl Marx, Friedrich Engels, Rosa Luxemburg",
        "desc_en": "A dialectical materialist analysis prioritizing collective ownership, structural justice, and historic liberation from class exploitation.",
        "desc_hi": "द्वंद्वात्मक भौतिकवादी विश्लेषण जो सामूहिक स्वामित्व, संरचनात्मक न्याय और वर्गीय शोषण से मुक्ति को प्राथमिकता देता है।"
    },
    "Advaita Vedanta": {
        "vector": np.array([1.0, -0.2, -0.7, -0.8]),
        "thinkers": "Adi Shankara, Gaudapada, Ramana Maharshi",
        "desc_en": "Non-dual spiritual inquiry affirming that the individual consciousness (Atman) and absolute ultimate reality (Brahman) are identical.",
        "desc_hi": "अद्वैत आध्यात्मिक दर्शन जो यह मानता है कि व्यक्तिगत चेतना (आत्मन) और परम यथार्थ (ब्रह्म) अभिन्न और एक हैं।"
    },
    "Buddhism": {
        "vector": np.array([0.2, -0.1, 0.1, -0.6]),
        "thinkers": "Siddhartha Gautama (The Buddha), Nagarjuna",
        "desc_en": "Pragmatic path exploring impermanence (Anicca), dependent origination, non-attachment, and the cessation of existential suffering.",
        "desc_hi": "अनित्यता, प्रतित्यसमुत्पाद, अनासक्ति और अस्तित्वगत दुःखों के निवारण पर केंद्रित व्यावहारिक आध्यात्मिक मार्ग।"
    },
    "Existentialism": {
        "vector": np.array([-0.3, -0.8, 0.6, -0.2]),
        "thinkers": "Jean-Paul Sartre, Albert Camus, Simone de Beauvoir",
        "desc_en": "Asserts that existence precedes essence; individuals bear radical freedom and total responsibility to author authentic meaning.",
        "desc_hi": "अस्तित्व सार से पहले आता है; मनुष्य पूरी तरह स्वतंत्र है और उसे अपने जीवन का अर्थ स्वयं गढ़ना होता है।"
    },
    "Confucianism": {
        "vector": np.array([-0.1, 0.5, -0.9, -0.5]),
        "thinkers": "Confucius, Mencius, Xunzi",
        "desc_en": "Emphasizes social harmony, filial piety, ethical leadership, mutual relational duties, and time-honored civic rituals (Li).",
        "desc_hi": "सामाजिक व्यवस्था, पितृभक्ति, नैतिक नेतृत्व, आपसी सामाजिक कर्तव्य और पारंपरिक शिष्टाचार (ली) पर बल।"
    },
    "Taoism": {
        "vector": np.array([0.4, -0.3, -0.3, -0.4]),
        "thinkers": "Laozi, Zhuangzi",
        "desc_en": "Reveres effortless spontaneous action (Wu-Wei), natural simplicity, and living in quiet synchrony with the organic flow of the Tao.",
        "desc_hi": "सहज और स्वाभाविक कर्म (वू-वेई), सादगी और प्रकृति के शाश्वत प्रवाह (दाओ) के साथ संतुलन में जीने का मार्ग।"
    },
    "Utilitarianism": {
        "vector": np.array([-0.7, 0.3, 0.8, 0.8]),
        "thinkers": "Jeremy Bentham, John Stuart Mill, Peter Singer",
        "desc_en": "Consequentialist ethics evaluating decisions by their capacity to maximize net well-being and reduce suffering across all affected beings.",
        "desc_hi": "परिणामवादी नैतिकता जो सभी प्रभावित प्राणियों के लिए अधिकतम कल्याण और न्यूनतम दुःख को आधार मानती है।"
    },
    "Liberal Humanism": {
        "vector": np.array([-0.6, -0.9, 0.4, 0.5]),
        "thinkers": "John Locke, Voltaire, John Stuart Mill",
        "desc_en": "Celebrates universal human dignity, inviolable individual rights, freedom of thought, and rational constitutional democracy.",
        "desc_hi": "सार्वभौमिक मानवीय गरिमा, व्यक्तिगत स्वतंत्रता, विचार की स्वतंत्रता और संवैधानिक लोकतंत्र का समर्थन।"
    },
    "Nietzschean Philosophy": {
        "vector": np.array([-0.5, -1.0, 0.7, -0.6]),
        "thinkers": "Friedrich Nietzsche",
        "desc_en": "Critiques herd conformity and passive nihilism; exalts life-affirmation, self-overcoming, personal sovereignty, and artistic vigor.",
        "desc_hi": "भीड़ मानसिकता की आलोचना; जीवन-उल्लास, आत्म-उत्थान, व्यक्तिगत संप्रभुता और रचनात्मक शक्ति का पोषण।"
    },
    "Social Contract Theory": {
        "vector": np.array([-0.4, 0.4, 0.2, 0.3]),
        "thinkers": "Thomas Hobbes, Jean-Jacques Rousseau, John Rawls",
        "desc_en": "Understands political authority and moral obligations as founded upon a rational, reciprocal agreement for civil safety and equity.",
        "desc_hi": "शासन सत्ता और नैतिक कर्तव्यों को नागरिक सुरक्षा व न्याय के लिए एक परस्पर सामाजिक समझौते पर आधारित मानता है।"
    },
    "Deep Ecology": {
        "vector": np.array([0.3, 0.4, 0.2, 0.4]),
        "thinkers": "Arne Naess, Aldo Leopold, Rachel Carson",
        "desc_en": "Biocentric egalitarianism rejecting human supremacy, acknowledging inherent moral value in all biosphere systems and living beings.",
        "desc_hi": "जैव-समानतावादी दृष्टिकोण जो मानव-केंद्रीयता को त्यागकर प्रकृति और सभी जीवों के आंतरिक मूल्य को स्वीकार करता है।"
    },
    "Transhumanism": {
        "vector": np.array([-0.8, -0.2, 1.0, 0.9]),
        "thinkers": "Nick Bostrom, Ray Kurzweil, Max More",
        "desc_en": "Advocates the ethical acceleration of technology and bioengineering to transcend biological disease, cognitive frailty, and mortality.",
        "desc_hi": "तकनीक और जैव-अभियांत्रिकी के उपयोग से मानवीय सीमाओं, रोगों और जैविक मृत्यु को पार करने का प्रगतिशील दर्शन।"
    }
}

# ==============================================================================
# 3. BILINGUAL QUESTIONNAIRE DATA (25 CORE THEMATIC DIMENSIONS)
# ==============================================================================
QUESTIONS_DATABASE = [
    {
        "id": 1,
        "section_en": "Metaphysics & Ultimate Reality",
        "section_hi": "तत्वमीमांसा और परम यथार्थ",
        "text_en": "What ultimately constitutes the fundamental fabric of reality?",
        "text_hi": "वास्तविकता का मूल तत्व अंततः किस रूप में विद्यमान है?",
        "options": [
            {
                "code": "A",
                "text_en": "Only physical matter, energy, and natural laws discovered through empirical sciences.",
                "text_hi": "केवल भौतिक पदार्थ, ऊर्जा और प्राकृतिक वैज्ञानिक नियम।",
                "weights": {"Secular Scientific Humanism": 1.0, "Marxism": 0.8, "Transhumanism": 0.7}
            },
            {
                "code": "B",
                "text_en": "An indivisible, non-dual cosmic consciousness (Brahman) within which physical phenomena appear.",
                "text_hi": "एक अखंड, अद्वैत ब्रह्मांडीय चेतना (ब्रह्म) जिसके भीतर सभी भौतिक घटनाएं प्रकट होती हैं।",
                "weights": {"Advaita Vedanta": 1.0, "Buddhism": 0.7}
            },
            {
                "code": "C",
                "text_en": "A dynamic, interconnected natural flow (Tao) with no permanent unchanging essence.",
                "text_hi": "एक गतिशील, परस्पर जुड़ा हुआ प्राकृतिक प्रवाह (दाओ) जिसका कोई स्थायी रूप नहीं है।",
                "weights": {"Taoism": 1.0, "Buddhism": 0.8, "Deep Ecology": 0.6}
            },
            {
                "code": "D",
                "text_en": "A rational cosmic order (Logos) that human reason can comprehend and live in harmony with.",
                "text_hi": "एक विवेकपूर्ण ब्रह्मांडीय व्यवस्था (लोगोस) जिसे मानवीय बुद्धि समझ सकती है।",
                "weights": {"Stoicism": 1.0, "Liberal Humanism": 0.6}
            }
        ]
    },
    {
        "id": 2,
        "section_en": "Consciousness & Mind",
        "section_hi": "चेतना और मन",
        "text_en": "What is the true nature of human consciousness and subjective experience?",
        "text_hi": "मानव चेतना और व्यक्तिपरक अनुभव का वास्तविक स्वरूप क्या है?",
        "options": [
            {
                "code": "A",
                "text_en": "An emergent biological computation generated solely by complex brain neural architecture.",
                "text_hi": "मस्तिष्क के जैविक न्यूरोलॉजिकल तंत्र से उत्पन्न एक भौतिक परिणाम।",
                "weights": {"Secular Scientific Humanism": 0.9, "Marxism": 0.7, "Transhumanism": 0.9}
            },
            {
                "code": "B",
                "text_en": "The unconditioned, witness consciousness (Sakshi) that is fundamental and prior to physical forms.",
                "text_hi": "अपरिवर्तनीय साक्षी चेतना जो भौतिक रूपों से परे और सर्वोपरि है।",
                "weights": {"Advaita Vedanta": 1.0, "Buddhism": 0.6}
            },
            {
                "code": "C",
                "text_en": "A mutable informational pattern that can be preserved, enhanced, and transferred to synthetic substrates.",
                "text_hi": "एक सूचनात्मक ढांचा जिसे तकनीकी साधनों द्वारा संवर्धित और डिजिटल रूप में स्थानांतरित किया जा सकता है।",
                "weights": {"Transhumanism": 1.0}
            },
            {
                "code": "D",
                "text_en": "An unbroken organic participant in the living ecological web of the Earth.",
                "text_hi": "पृथ्वी के सजीव पारिस्थितिक तंत्र का एक अविभाज्य और सक्रिय अंग।",
                "weights": {"Deep Ecology": 1.0, "Taoism": 0.7}
            }
        ]
    },
    {
        "id": 3,
        "section_en": "Epistemology & Knowledge",
        "section_hi": "ज्ञानमीमांसा और सत्य की खोज",
        "text_en": "How does human consciousness most reliably arrive at genuine truth?",
        "text_hi": "मानव चेतना सबसे प्रामाणिक रूप से सत्य तक कैसे पहुँचती है?",
        "options": [
            {
                "code": "A",
                "text_en": "Through rigorous empirical experimentation, repeatable observation, and scientific verification.",
                "text_hi": "अनुभवजन्य प्रयोगों, व्यवस्थित अवलोकन और वैज्ञानिक सत्यापन के माध्यम से।",
                "weights": {"Secular Scientific Humanism": 1.0, "Utilitarianism": 0.8, "Liberal Humanism": 0.7}
            },
            {
                "code": "B",
                "text_en": "Through direct contemplative introspection, meditative discernment, and trans-rational insight.",
                "text_hi": "प्रत्यक्ष ध्यान, अंतर्मुखी साधना और विवेकपूर्ण आध्यात्मिक अनुभूति द्वारा।",
                "weights": {"Advaita Vedanta": 1.0, "Buddhism": 0.9, "Taoism": 0.7}
            },
            {
                "code": "C",
                "text_en": "Through disciplined rational deduction, logical consistency, and critical philosophical reasoning.",
                "text_hi": "तार्किक विश्लेषण, आंतरिक वैचारिक सुसंगतता और आलोचनात्मक विवेक द्वारा।",
                "weights": {"Stoicism": 0.9, "Liberal Humanism": 0.9, "Social Contract Theory": 0.7}
            },
            {
                "code": "D",
                "text_en": "Through lived communal transmission, ethical traditions, and time-tested ancestral customs.",
                "text_hi": "सामुदायिक अनुभव, नैतिक परंपराओं और पूर्वजों के समय-सिद्ध ज्ञान द्वारा।",
                "weights": {"Confucianism": 1.0}
            }
        ]
    },
    {
        "id": 4,
        "section_en": "Purpose & Existential Meaning",
        "section_hi": "अस्तित्व का उद्देश्य और सार्थकता",
        "text_en": "Where does meaning and purpose in human existence originate?",
        "text_hi": "मानव जीवन में वास्तविक सार्थकता और उद्देश्य की उत्पत्ति कहाँ से होती है?",
        "options": [
            {
                "code": "A",
                "text_en": "Meaning does not exist objectively; each individual must courageously author their own purpose.",
                "text_hi": "कोई पूर्व-निर्धारित उद्देश्य नहीं है; प्रत्येक व्यक्ति को अपना अर्थ स्वयं रचना होगा।",
                "weights": {"Existentialism": 1.0, "Nietzschean Philosophy": 0.9}
            },
            {
                "code": "B",
                "text_en": "From fulfilling rational virtue, emotional temperance, and universal duty in society.",
                "text_hi": "सद्गुणों के अभ्यास, भावनात्मक संतुलन और समाज के प्रति नैतिक कर्तव्यों के पालन से।",
                "weights": {"Stoicism": 1.0, "Confucianism": 0.8, "Social Contract Theory": 0.6}
            },
            {
                "code": "C",
                "text_en": "From awakening from the illusion of separate individuality into universal oneness.",
                "text_hi": "अलग व्यक्ति होने के भ्रम से जागकर ब्रह्मांडीय एकात्मता की अनुभूति से।",
                "weights": {"Advaita Vedanta": 1.0, "Buddhism": 0.8}
            },
            {
                "code": "D",
                "text_en": "From maximizing the tangible happiness, knowledge, and health of conscious beings across generations.",
                "text_hi": "भावी पीढ़ियों के ज्ञान, स्वास्थ्य और समग्र कल्याण में सक्रिय योगदान देने से।",
                "weights": {"Utilitarianism": 0.9, "Liberal Humanism": 0.9, "Transhumanism": 0.7}
            }
        ]
    },
    {
        "id": 5,
        "section_en": "Ethics & Moral Foundations",
        "section_hi": "नीतिशास्त्र और नैतिक आधार",
        "text_en": "What should serve as the ultimate benchmark for deciding right and wrong action?",
        "text_hi": "सही और गलत कर्म के निर्धारण का अंतिम और सर्वोच्च पैमाना क्या होना चाहिए?",
        "options": [
            {
                "code": "A",
                "text_en": "The measurable balance of well-being generated versus suffering caused to all conscious beings.",
                "text_hi": "सभी सचेतन प्राणियों के लिए उत्पन्न सुख व कल्याण और कम हुए दुःखों का शुद्ध परिणाम।",
                "weights": {"Utilitarianism": 1.0, "Liberal Humanism": 0.6}
            },
            {
                "code": "B",
                "text_en": "Inviolable universal principles and individual rights that must never be traded away for aggregate utility.",
                "text_hi": "सार्वभौमिक नैतिक नियम और व्यक्तिगत अधिकार जिनका किसी भी स्थिति में उल्लंघन न हो।",
                "weights": {"Liberal Humanism": 1.0, "Social Contract Theory": 0.8, "Stoicism": 0.7}
            },
            {
                "code": "C",
                "text_en": "Cultivating righteous character, filial loyalty, empathy, and social propriety within the community.",
                "text_hi": "सदाचार, पारिवारिक मर्यादा, करुणा और सामाजिक दायित्वों का निष्ठापूर्वक निर्वहन।",
                "weights": {"Confucianism": 1.0}
            },
            {
                "code": "D",
                "text_en": "Universal compassion and complete non-harming (Ahimsa) extended to all sentient life.",
                "text_hi": "सभी जीवित और सचेतन प्राणियों के प्रति पूर्ण अहिंसा और असीम करुणा।",
                "weights": {"Buddhism": 1.0, "Deep Ecology": 0.9}
            }
        ]
    },
    {
        "id": 6,
        "section_en": "Self & Personal Identity",
        "section_hi": "स्वयं और व्यक्तिगत पहचान",
        "text_en": "How should a person understand their individual identity and ego?",
        "text_hi": "व्यक्ति को अपनी पहचान और 'स्वयं' (Self) को किस प्रकार देखना चाहिए?",
        "options": [
            {
                "code": "A",
                "text_en": "As an autonomous, sovereign agent entitled to liberty and self-ownership.",
                "text_hi": "एक स्वतंत्र, स्वायत्त व्यक्ति जो अपनी स्वतंत्रता और आत्म-निर्णय का स्वामी है।",
                "weights": {"Liberal Humanism": 1.0, "Existentialism": 0.8}
            },
            {
                "code": "B",
                "text_en": "As an ever-shifting aggregate of sensations, thoughts, and conditions lacking a permanent self (Anatta).",
                "text_hi": "सदा परिवर्तनशील संवेदनाओं और विचारों का प्रवाह जिसमें कोई स्थायी सार नहीं (अनात्म)।",
                "weights": {"Buddhism": 1.0, "Taoism": 0.7}
            },
            {
                "code": "C",
                "text_en": "As an inseparable node in the social fabric, defined essentially through relationships with others.",
                "text_hi": "समाज का एक अविभाज्य अंग, जिसकी पहचान केवल रिश्तों और आपसी संबंधों से तय होती है।",
                "weights": {"Confucianism": 1.0, "Marxism": 0.8}
            },
            {
                "code": "D",
                "text_en": "As an artistic self-mastery project, continuously overcoming mediocrity to achieve higher greatness.",
                "text_hi": "एक कलात्मक आत्म-सृजन, जो साधारणता से ऊपर उठकर व्यक्तिगत उत्कृष्टता गढ़ता है।",
                "weights": {"Nietzschean Philosophy": 1.0}
            }
        ]
    },
    {
        "id": 7,
        "section_en": "Free Will & Determinism",
        "section_hi": "स्वतंत्र इच्छाशक्ति और नियति",
        "text_en": "To what degree do humans exercise genuine free agency?",
        "text_hi": "मनुष्य के पास किस सीमा तक वास्तविक स्वतंत्र इच्छाशक्ति (Free Will) है?",
        "options": [
            {
                "code": "A",
                "text_en": "Radical existential freedom: we are fully condemned to be free and completely accountable for choices.",
                "text_hi": "पूर्ण अस्तित्वगत स्वतंत्रता: हम अपने निर्णयों और कर्मों के लिए पूरी तरह उत्तरदायी हैं।",
                "weights": {"Existentialism": 1.0, "Nietzschean Philosophy": 0.7}
            },
            {
                "code": "B",
                "text_en": "We have sovereignty solely over our internal judgments and attitude, while outer events obey cosmic causality.",
                "text_hi": "हमारा नियंत्रण केवल हमारे आंतरिक विचारों और दृष्टिकोण पर है; बाहरी घटनाएं नियमबद्ध हैं।",
                "weights": {"Stoicism": 1.0}
            },
            {
                "code": "C",
                "text_en": "Human choices are heavily conditioned by material economic structures and class environment.",
                "text_hi": "मानवीय निर्णय काफी हद तक आर्थिक और सामाजिक परिस्थितियों से आकार लेते हैं।",
                "weights": {"Marxism": 1.0}
            },
            {
                "code": "D",
                "text_en": "Biological agency is constrained today, but advanced neural and cognitive technologies can expand it radically.",
                "text_hi": "जैविक सीमाएं हैं, किंतु उन्नत न्यूरोलॉजिकल तकनीक हमारी स्वतंत्रता को बहुत बढ़ा सकती है।",
                "weights": {"Transhumanism": 1.0}
            }
        ]
    },
    {
        "id": 8,
        "section_en": "Society & Governance",
        "section_hi": "समाज और शासन व्यवस्था",
        "text_en": "What is the primary moral purpose of political institutions and government?",
        "text_hi": "राजनीतिक संस्थाओं और शासन का प्राथमिक नैतिक उद्देश्य क्या होना चाहिए?",
        "options": [
            {
                "code": "A",
                "text_en": "To safeguard individual liberties, enforce voluntary contracts, and protect property rights under the rule of law.",
                "text_hi": "व्यक्तिगत अधिकारों, विधि के शासन और नागरिक स्वतंत्रता की रक्षा करना।",
                "weights": {"Liberal Humanism": 1.0, "Social Contract Theory": 0.7}
            },
            {
                "code": "B",
                "text_en": "To eliminate class exploitation and establish collective ownership of productive resources.",
                "text_hi": "वर्गीय शोषण को समाप्त कर उत्पादन के साधनों पर सामूहिक स्वामित्व स्थापित करना।",
                "weights": {"Marxism": 1.0}
            },
            {
                "code": "C",
                "text_en": "To maintain civic virtue, moral rectitude, and benevolent social hierarchy through wise governance.",
                "text_hi": "नैतिक नेतृत्व, सुशासन और सामाजिक मर्यादा व व्यवस्था को बनाए रखना।",
                "weights": {"Confucianism": 1.0}
            },
            {
                "code": "D",
                "text_en": "To maintain a rational mutual agreement that protects all citizens from chaos and vulnerability.",
                "text_hi": "एक संतुलित सामाजिक समझौता जो सभी नागरिकों को अराजकता से सुरक्षा और न्याय प्रदान करे।",
                "weights": {"Social Contract Theory": 1.0, "Utilitarianism": 0.7}
            }
        ]
    },
    {
        "id": 9,
        "section_en": "Economic Justice & Equality",
        "section_hi": "आर्थिक न्याय और समानता",
        "text_en": "How should material resources and economic opportunities be structured?",
        "text_hi": "भौतिक संसाधनों और आर्थिक अवसरों का वितरण किस प्रकार होना चाहिए?",
        "options": [
            {
                "code": "A",
                "text_en": "From each according to ability, to each according to need, eliminating wage-labor exploitation.",
                "text_hi": "प्रत्येक से उसकी क्षमता अनुसार, प्रत्येक को उसकी आवश्यकता अनुसार।",
                "weights": {"Marxism": 1.0}
            },
            {
                "code": "B",
                "text_en": "Through voluntary market exchanges and equal rights of opportunity, accepting uneven natural outcomes.",
                "text_hi": "समान अवसर और मुक्त बाज़ार विनिमय के माध्यम से, जहाँ परिणाम स्वाभाविक रूप से भिन्न हो सकते हैं।",
                "weights": {"Liberal Humanism": 1.0}
            },
            {
                "code": "C",
                "text_en": "Inequalities are only justifiable if they work to the maximum benefit of the least advantaged members of society.",
                "text_hi": "आर्थिक असमानताएं केवल तभी उचित हैं जब वे समाज के सबसे कमज़ोर वर्ग के अधिकतम लाभ में हों।",
                "weights": {"Social Contract Theory": 1.0, "Utilitarianism": 0.8}
            },
            {
                "code": "D",
                "text_en": "Material wealth is morally indifferent; inner resilience and ethical virtue surpass all outward possessions.",
                "text_hi": "भौतिक धन नैतिक रूप से तटस्थ है; आंतरिक संतोष और सद्गुण ही वास्तविक समृद्धि हैं।",
                "weights": {"Stoicism": 1.0, "Buddhism": 0.8, "Taoism": 0.7}
            }
        ]
    },
    {
        "id": 10,
        "section_en": "Ecology & The Living World",
        "section_hi": "पर्यावरण और प्रकृति से संबंध",
        "text_en": "What is humanity's proper relationship to the natural world and non-human animals?",
        "text_hi": "प्राकृतिक पर्यावरण और अन्य जीव-जंतुओं के प्रति मानवता का उचित दृष्टिकोण क्या होना चाहिए?",
        "options": [
            {
                "code": "A",
                "text_en": "Biocentric equality: all living systems and sentient creatures possess intrinsic value independent of human use.",
                "text_hi": "जैव-समानता: सभी जीवों और पारिस्थितिकी तंत्रों का अपना आंतरिक मूल्य है, न कि केवल मानव उपयोगिता।",
                "weights": {"Deep Ecology": 1.0, "Buddhism": 0.7}
            },
            {
                "code": "B",
                "text_en": "Living in effortless, non-coercive alignment with the seasonal and organic rhythms of nature.",
                "text_hi": "प्रकृति के सहज नियमों और जैविक चक्रों के साथ बिना किसी दबाव के स्वाभाविक सामंजस्य।",
                "weights": {"Taoism": 1.0}
            },
            {
                "code": "C",
                "text_en": "Rational stewardship: preserving and managing ecosystems to support long-term human flourishing.",
                "text_hi": "वैज्ञानिक प्रबंधन: दीर्घकालिक मानव कल्याण और भावी पीढ़ियों के लिए प्रकृति का संरक्षण।",
                "weights": {"Liberal Humanism": 0.8, "Utilitarianism": 0.8, "Social Contract Theory": 0.7}
            },
            {
                "code": "D",
                "text_en": "Nature is a resource substrate to be overcome and optimized through biotechnology and sustainable engineering.",
                "text_hi": "प्रकृति एक ऐसा माध्यम है जिसे आधुनिक तकनीक और विज्ञान से संवर्धित और सुधारा जाना चाहिए।",
                "weights": {"Transhumanism": 1.0}
            }
        ]
    },
    {
        "id": 11,
        "section_en": "Technology & Human Future",
        "section_hi": "तकनीक और मानवता का भविष्य",
        "text_en": "How should society approach advanced technologies like AI, genetic modifications, and synthetic life?",
        "text_hi": "आर्टिफिशियल इंटेलिजेंस, आनुवंशिक संशोधन और उन्नत तकनीकों के प्रति क्या दृष्टिकोण होना चाहिए?",
        "options": [
            {
                "code": "A",
                "text_en": "Embrace them boldly as the next stage of conscious evolution to overcome our biological limitations.",
                "text_hi": "जैविक सीमाओं को पार करने और विकास के अगले चरण में प्रवेश के लिए इन्हें साहसपूर्वक अपनाना चाहिए।",
                "weights": {"Transhumanism": 1.0}
            },
            {
                "code": "B",
                "text_en": "Evaluate them strictly by democratic consent, distributive justice, and minimizing systemic harm.",
                "text_hi": "लोकतांत्रिक सहमति, सामाजिक न्याय और जोखिमों को कम करने की कसौटी पर इनका मूल्यांकन हो।",
                "weights": {"Social Contract Theory": 0.9, "Utilitarianism": 0.8, "Liberal Humanism": 0.8}
            },
            {
                "code": "C",
                "text_en": "Treat them with caution if they sever our fundamental communion with organic nature and biological rhythms.",
                "text_hi": "सावधानी बरतें यदि ये हमें प्राकृतिक जीवन और पर्यावरण के स्वाभाविक जुड़ाव से दूर करते हैं।",
                "weights": {"Deep Ecology": 1.0, "Taoism": 0.8}
            },
            {
                "code": "D",
                "text_en": "External tools are secondary; true advancement lies exclusively in inner self-mastery and wisdom.",
                "text_hi": "बाहरी उपकरण गौण हैं; वास्तविक प्रगति केवल आंतरिक विवेक और आत्म-संयम में निहित है।",
                "weights": {"Stoicism": 1.0, "Advaita Vedanta": 0.8, "Buddhism": 0.8}
            }
        ]
    },
    {
        "id": 12,
        "section_en": "Suffering & Adversity",
        "section_hi": "दुःख और विपत्ति का सामना",
        "text_en": "When confronting tragic suffering or unforeseen personal crisis, what is the wisest response?",
        "text_hi": "व्यक्तिगत संकट या गहरे दुःख का सामना करते समय सबसे विवेकपूर्ण दृष्टिकोण क्या है?",
        "options": [
            {
                "code": "A",
                "text_en": "Recognize that external hardship cannot harm your character unless you allow your judgments to be corrupted.",
                "text_hi": "यह समझें कि बाहरी परिस्थितियां आपके चरित्र को तब तक चोट नहीं पहुंचा सकतीं जब तक आप अपने मन को विचलित न होने दें।",
                "weights": {"Stoicism": 1.0}
            },
            {
                "code": "B",
                "text_en": "Investigate the root cause of craving and attachment, observing pain with equanimity without clinging.",
                "text_hi": "तृष्णा और आसक्ति के मूल कारण को समझें और बिना विचलित हुए समता भाव से उसका साक्षी बनें।",
                "weights": {"Buddhism": 1.0, "Advaita Vedanta": 0.7}
            },
            {
                "code": "C",
                "text_en": "Channel distress into intense creative struggle, using adversity as a catalyst to forge personal greatness.",
                "text_hi": "विपत्ति को अपनी रचनात्मक शक्ति में बदलें और कठिनाइयों का उपयोग आत्म-उत्थान के लिए करें।",
                "weights": {"Nietzschean Philosophy": 1.0, "Existentialism": 0.7}
            },
            {
                "code": "D",
                "text_en": "Organize collective mutual aid and mobilize solidarity to address the structural sources of societal distress.",
                "text_hi": "सामूहिक सहयोग और आपसी भाईचारे को संगठित कर संकट के बुनियादी कारणों का निवारण करें।",
                "weights": {"Marxism": 0.9, "Confucianism": 0.7, "Social Contract Theory": 0.7}
            }
        ]
    }
]

# ==============================================================================
# 4. CUSTOM STYLESHEET INJECTION (LIGHT & DARK THEMES)
# ==============================================================================
def inject_custom_styles(theme="Dark"):
    if theme == "Light":
        bg_main = "#FAF8F5"
        text_primary = "#1E293B"
        text_secondary = "#475569"
        accent_gold = "#9A722C"
        accent_hover = "#785621"
        card_bg = "#FFFFFF"
        card_border = "rgba(154, 114, 44, 0.20)"
        card_shadow = "0 4px 20px rgba(154, 114, 44, 0.08)"
        tag_bg = "rgba(154, 114, 44, 0.10)"
    else:
        bg_main = "#090D16"
        text_primary = "#F8FAFC"
        text_secondary = "#94A3B8"
        accent_gold = "#D4AF37"
        accent_hover = "#F3E5AB"
        card_bg = "rgba(15, 23, 42, 0.85)"
        card_border = "rgba(212, 175, 55, 0.25)"
        card_shadow = "0 4px 25px rgba(0, 0, 0, 0.45)"
        tag_bg = "rgba(212, 175, 55, 0.12)"

    css = f"""
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;800&family=Inter:wght@300;400;500;600;700&family=Noto+Serif+Devanagari:wght@400;500;600;700&display=swap');

    html, body, [class*="css"], .stApp {{
        background-color: {bg_main} !important;
        color: {text_primary} !important;
        font-family: 'Inter', 'Noto Serif Devanagari', -apple-system, sans-serif;
    }}

    h1, h2, h3, .serif-header {{
        font-family: 'Cinzel', 'Noto Serif Devanagari', Georgia, serif !important;
        letter-spacing: 0.03em;
        color: {accent_gold} !important;
    }}

    .hero-card {{
        background: {card_bg};
        border: 1px solid {card_border};
        border-radius: 14px;
        padding: 40px;
        text-align: center;
        box-shadow: {card_shadow};
        margin-bottom: 30px;
    }}

    .q-card {{
        background: {card_bg};
        border: 1px solid {card_border};
        border-radius: 12px;
        padding: 28px;
        box-shadow: {card_shadow};
        margin-bottom: 24px;
        transition: transform 0.2s ease, border-color 0.2s ease;
    }}
    .q-card:hover {{
        border-color: {accent_gold};
    }}

    .result-card {{
        background: {card_bg};
        border: 1px solid {card_border};
        border-radius: 12px;
        padding: 24px;
        box-shadow: {card_shadow};
        margin-bottom: 18px;
    }}

    .tension-box {{
        background: rgba(220, 38, 38, 0.06);
        border: 1px solid rgba(220, 38, 38, 0.35);
        border-left: 5px solid #DC2626;
        border-radius: 10px;
        padding: 20px;
        margin-bottom: 20px;
    }}

    .badge-pill {{
        display: inline-block;
        background: {tag_bg};
        color: {accent_gold};
        border: 1px solid {card_border};
        border-radius: 20px;
        padding: 4px 14px;
        font-size: 0.85rem;
        font-weight: 600;
        margin: 4px;
        letter-spacing: 0.04em;
    }}

    .stButton > button {{
        background: linear-gradient(135deg, {accent_gold} 0%, {accent_hover} 100%) !important;
        color: {bg_main} !important;
        font-family: 'Cinzel', serif !important;
        font-weight: 700 !important;
        font-size: 1rem !important;
        letter-spacing: 0.05em !important;
        border: none !important;
        border-radius: 8px !important;
        padding: 12px 28px !important;
        transition: all 0.25s ease !important;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2) !important;
    }}
    .stButton > button:hover {{
        transform: translateY(-2px) !important;
        box-shadow: 0 6px 20px rgba(212, 175, 55, 0.35) !important;
    }}

    /* Cleaner Streamlit chrome */
    #MainMenu, footer, header {{visibility: hidden !important;}}
    .block-container {{
        max-width: 1050px !important;
        padding-top: 2rem !important;
        padding-bottom: 4rem !important;
    }}
    </style>
    """
    st.markdown(css, unsafe_allow_html=True)

# ==============================================================================
# 5. BILINGUAL RENDERING HELPERS
# ==============================================================================
def render_bilingual_header(text_en, text_hi, lang_choice):
    if lang_choice == "English":
        st.markdown(f"<h2 class='serif-header'>{text_en}</h2>", unsafe_allow_html=True)
    elif lang_choice == "Hindi":
        st.markdown(f"<h2 class='serif-header'>{text_hi}</h2>", unsafe_allow_html=True)
    else:
        st.markdown(
            f"<div style='margin-bottom: 12px;'>"
            f"<h2 class='serif-header' style='margin-bottom: 2px;'>{text_en}</h2>"
            f"<div style='font-size: 1.15rem; color: #94A3B8; font-family: \"Noto Serif Devanagari\", serif;'>{text_hi}</div>"
            f"</div>",
            unsafe_allow_html=True
        )

def render_bilingual_sub(text_en, text_hi, lang_choice):
    if lang_choice == "English":
        st.markdown(f"<p style='font-size: 1.05rem; line-height: 1.6;'>{text_en}</p>", unsafe_allow_html=True)
    elif lang_choice == "Hindi":
        st.markdown(f"<p style='font-size: 1.05rem; line-height: 1.6; font-family: \"Noto Serif Devanagari\", serif;'>{text_hi}</p>", unsafe_allow_html=True)
    else:
        st.markdown(
            f"<div style='margin-bottom: 10px; font-size: 1.05rem; line-height: 1.6;'>"
            f"<div>{text_en}</div>"
            f"<div style='color: #94A3B8; font-size: 0.95rem; font-family: \"Noto Serif Devanagari\", serif;'>{text_hi}</div>"
            f"</div>",
            unsafe_allow_html=True
        )

# ==============================================================================
# 6. SCORING & TENSION ENGINE
# ==============================================================================
def calculate_scores(answers):
    # Base tallies for each tradition
    tallies = {name: 0.0 for name in WORLDVIEWS.keys()}
    max_possible = {name: 0.0 for name in WORLDVIEWS.keys()}

    for q in QUESTIONS_DATABASE:
        q_id = q["id"]
        chosen_code = answers.get(q_id)
        
        # Track max potential weight for normalization
        for opt in q["options"]:
            for tradition, wt in opt["weights"].items():
                if tradition in max_possible:
                    max_possible[tradition] = max(max_possible[tradition], max_possible[tradition] + wt * 0.5)

        if chosen_code:
            chosen_opt = next((o for o in q["options"] if o["code"] == chosen_code), None)
            if chosen_opt:
                for tradition, wt in chosen_opt["weights"].items():
                    if tradition in tallies:
                        tallies[tradition] += wt

    # Normalization onto 0 - 100 scale
    normalized = {}
    for name, raw in tallies.items():
        denom = max_possible[name] if max_possible[name] > 0 else 1.0
        pct = min(100.0, max(12.0, (raw / (denom * 0.85)) * 100.0))
        normalized[name] = round(pct, 1)

    # Sort descending
    sorted_affinities = sorted(normalized.items(), key=lambda x: x[1], reverse=True)
    return sorted_affinities

def detect_cognitive_tensions(answers, lang_choice):
    """Identifies structural dialectical tensions from specific response pairs."""
    tensions = []

    # Tension 1: Materialist Science vs Transcendent Consciousness
    if answers.get(1) == "A" and answers.get(2) == "B":
        tensions.append({
            "title_en": "The Hard Problem of Consciousness",
            "title_hi": "चेतना की कठिन समस्या",
            "desc_en": "You identified the fabric of the universe as purely physical matter and natural laws, yet simultaneously affirmed consciousness as unconditioned and prior to form. Bridging strict physicalism with non-dual awareness is an intellectual frontier.",
            "desc_hi": "आपने ब्रह्मांड को केवल भौतिक पदार्थ माना, किंतु चेतना को अपरिवर्तनीय साक्षी के रूप में देखा। भौतिकवाद और आध्यात्मिक चेतना का यह समन्वय एक गहरा वैचारिक चिंतन प्रस्तुत करता है।"
        })

    # Tension 2: Existential Self-Creation vs Traditional Ritual Virtue
    if answers.get(4) == "A" and answers.get(5) == "C":
        tensions.append({
            "title_en": "Radical Autonomy vs. Communal Duty",
            "title_hi": "व्यक्तिगत स्वतंत्रता बनाम सामाजिक मर्यादा",
            "desc_en": "You embrace radical existential self-authorship of meaning while grounding ethics in traditional filial and communal duties. This reflects an ongoing dialogue between sovereign liberty and cultural belonging.",
            "desc_hi": "आप व्यक्तिगत अर्थ-सृजन में विश्वास रखते हैं, साथ ही सामाजिक परंपराओं और मर्यादा का समर्थन करते हैं। यह व्यक्तिगत स्वतंत्रता और सामुदायिक उत्तरदायित्व के बीच संतुलन को दर्शाता है।"
        })

    # Tension 3: Deep Ecology vs Radical Transhumanist Enhancement
    if answers.get(10) == "A" and answers.get(11) == "A":
        tensions.append({
            "title_en": "Biocentric Humility vs. Posthuman Acceleration",
            "title_hi": "जैव-समानता बनाम मानवोत्तर तकनीकी संवर्धन",
            "desc_en": "You express deep reverence for organic biocentric equality alongside an enthusiasm for technological and synthetic enhancements of biological life. Synthesizing organic nature with synthetic acceleration is an intriguing balance.",
            "desc_hi": "आप प्राकृतिक पर्यावरण के आंतरिक मूल्य का सम्मान करते हैं, साथ ही जैव-तकनीकी संवर्धन के पक्षधर हैं। प्रकृति और तकनीक का यह समन्वय आधुनिक युग की सबसे विचारणीय सीमा है।"
        })

    return tensions

# ==============================================================================
# 7. PIL PASSPORT IMAGE GENERATOR
# ==============================================================================
def generate_passport_image(top_tradition, top_score, theme="Dark"):
    w, h = 800, 1100
    bg_color = (9, 13, 22) if theme == "Dark" else (250, 248, 245)
    gold_color = (212, 175, 55) if theme == "Dark" else (154, 114, 44)
    text_color = (248, 250, 252) if theme == "Dark" else (30, 41, 59)
    sub_color = (148, 163, 184) if theme == "Dark" else (71, 85, 105)
    box_bg = (20, 29, 47) if theme == "Dark" else (241, 237, 228)

    img = Image.new("RGB", (w, h), bg_color)
    draw = ImageDraw.Draw(img)

    # Double Border Frame
    draw.rectangle([25, 25, w - 25, h - 25], outline=gold_color, width=3)
    draw.rectangle([35, 35, w - 35, h - 35], outline=gold_color, width=1)

    # Corner Flourishes
    flourish_len = 30
    for x, y in [(35, 35), (w - 35, 35), (35, h - 35), (w - 35, h - 35)]:
        dx = flourish_len if x == 35 else -flourish_len
        dy = flourish_len if y == 35 else -flourish_len
        draw.line([(x, y), (x + dx, y)], fill=gold_color, width=3)
        draw.line([(x, y), (x, y + dy)], fill=gold_color, width=3)

    # Header
    draw.text((w // 2, 75), "THE COMPASS OF HUMAN PERSPECTIVES", fill=gold_color, anchor="mm")
    draw.text((w // 2, 105), "PHILOSOPHICAL IDENTITY PASSPORT", fill=sub_color, anchor="mm")
    draw.line([(100, 130), (w - 100, 130)], fill=gold_color, width=1)

    # Abstract Compass Emblem in Center
    cx, cy = w // 2, 240
    r = 75
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=gold_color, width=2)
    draw.ellipse([cx - r + 10, cy - r + 10, cx + r - 10, cy + r - 10], outline=gold_color, width=1)
    
    # 8-Point Star / Compass Needle
    points = [
        (cx, cy - r + 15), (cx + 15, cy - 15), (cx + r - 15, cy), (cx + 15, cy + 15),
        (cx, cy + r - 15), (cx - 15, cy + 15), (cx - r + 15, cy), (cx - 15, cy - 15)
    ]
    draw.polygon(points, outline=gold_color)
    draw.ellipse([cx - 8, cy - 8, cx + 8, cy + 8], fill=gold_color)

    # Registry Meta Box
    now_str = datetime.datetime.now().strftime("%Y-%m-%d | %H:%M")
    pass_id = f"CHP-{random.randint(10000, 99999)}"
    draw.rounded_rectangle([70, 350, w - 70, 420], radius=8, fill=box_bg, outline=gold_color, width=1)
    draw.text((100, 385), f"REGISTRY ID: {pass_id}", fill=sub_color, anchor="lm")
    draw.text((w - 100, 385), f"ISSUED: {now_str}", fill=sub_color, anchor="rm")

    # Primary Philosophical Alignment
    draw.text((w // 2, 470), "PRIMARY INTELLECTUAL ALIGNMENT", fill=sub_color, anchor="mm")
    draw.text((w // 2, 520), top_tradition.upper(), fill=gold_color, anchor="mm")
    draw.text((w // 2, 565), f"AFFINITY INDEX: {top_score}%", fill=text_color, anchor="mm")

    # Affinity Progress Bar
    bar_w = 460
    bar_x = (w - bar_w) // 2
    bar_y = 600
    draw.rounded_rectangle([bar_x, bar_y, bar_x + bar_w, bar_y + 16], radius=8, fill=box_bg)
    fill_len = int(bar_w * (top_score / 100.0))
    draw.rounded_rectangle([bar_x, bar_y, bar_x + fill_len, bar_y + 16], radius=8, fill=gold_color)

    # Thinkers and Summary
    tradition_info = WORLDVIEWS.get(top_tradition, {})
    thinkers = tradition_info.get("thinkers", "Global Thinkers")
    desc = tradition_info.get("desc_en", "")

    draw.rounded_rectangle([70, 660, w - 70, 830], radius=10, fill=box_bg, outline=gold_color, width=1)
    draw.text((95, 695), f"KEY THINKERS: {thinkers}", fill=gold_color, anchor="lm")
    
    # Word Wrap Description Text
    words = desc.split(" ")
    lines = []
    curr_line = ""
    for word in words:
        if len(curr_line + " " + word) < 54:
            curr_line = curr_line + " " + word if curr_line else word
        else:
            lines.append(curr_line)
            curr_line = word
    if curr_line:
        lines.append(curr_line)

    desc_y = 740
    for line in lines[:3]:
        draw.text((95, desc_y), line, fill=text_color, anchor="lm")
        desc_y += 26

    # Barcode Simulation
    barcode_x = 100
    barcode_y = 880
    random.seed(top_tradition)
    for _ in range(70):
        bar_th = random.choice([2, 4, 6])
        draw.rectangle([barcode_x, barcode_y, barcode_x + bar_th, barcode_y + 55], fill=gold_color)
        barcode_x += bar_th + random.choice([3, 5, 7])
        if barcode_x > w - 100:
            break

    draw.text((w // 2, 970), "NON-CLINICAL PHILOSOPHICAL IDENTITY ARTIFACT", fill=sub_color, anchor="mm")
    draw.text((w // 2, 1010), "Veritas Vos Liberabit • Cognosce Te Ipsum", fill=gold_color, anchor="mm")

    return img

# ==============================================================================
# 8. SESSION STATE INITIALIZATION
# ==============================================================================
if "answers" not in st.session_state:
    st.session_state.answers = {}
if "submitted" not in st.session_state:
    st.session_state.submitted = False
if "theme" not in st.session_state:
    st.session_state.theme = "Dark"
if "language" not in st.session_state:
    st.session_state.language = "Bilingual (English + Hindi)"

# Inject Theme CSS
inject_custom_styles(st.session_state.theme)

# ==============================================================================
# 9. HEADER & CONTROL PANEL
# ==============================================================================
col_title, col_controls = st.columns([6, 4])

with col_title:
    st.markdown(
        "<div style='display: flex; align-items: center; gap: 15px; margin-top: 5px;'>"
        "<span style='font-size: 2.4rem;'>🧭</span>"
        "<div>"
        "<h1 style='margin: 0; font-size: 1.85rem;'>THE COMPASS OF HUMAN PERSPECTIVES</h1>"
        "<div style='font-size: 0.95rem; color: #94A3B8;'>मानव दृष्टिकोण का कम्पास</div>"
        "</div>"
        "</div>",
        unsafe_allow_html=True
    )

with col_controls:
    c1, c2 = st.columns(2)
    with c1:
        lang_sel = st.selectbox(
            "Language / भाषा",
            ["Bilingual (English + Hindi)", "English", "Hindi"],
            index=["Bilingual (English + Hindi)", "English", "Hindi"].index(st.session_state.language),
            label_visibility="collapsed"
        )
        if lang_sel != st.session_state.language:
            st.session_state.language = lang_sel
            st.rerun()

    with c2:
        theme_sel = st.selectbox(
            "Theme / स्वरूप",
            ["Dark", "Light"],
            index=["Dark", "Light"].index(st.session_state.theme),
            label_visibility="collapsed"
        )
        if theme_sel != st.session_state.theme:
            st.session_state.theme = theme_sel
            st.rerun()

st.write("---")

# ==============================================================================
# 10. LANDING & QUESTIONNAIRE VIEW
# ==============================================================================
if not st.session_state.submitted:
    # Hero Introduction
    st.markdown(
        f"<div class='hero-card'>"
        f"<h2 class='serif-header' style='font-size: 2.2rem; margin-bottom: 8px;'>Explore Your Intellectual Archetype</h2>"
        f"<div style='font-size: 1.15rem; color: #94A3B8; font-family: \"Noto Serif Devanagari\", serif; margin-bottom: 20px;'>अपने दार्शनिक विश्वदृष्टिकोण का अन्वेषण करें</div>"
        f"<p style='max-width: 780px; margin: 0 auto; line-height: 1.7; font-size: 1.05rem;'>"
        f"This museum-grade exploratory instrument evaluates your cognitive worldview across 13 major intellectual traditions. "
        f"Answer the questions honestly according to your authentic instincts. <em>Note: This is an exploratory philosophical reflection tool, not a clinical or psychological assessment.</em>"
        f"</p>"
        f"</div>",
        unsafe_allow_html=True
    )

    # Progress Indicator
    answered_count = len(st.session_state.answers)
    total_q = len(QUESTIONS_DATABASE)
    progress_ratio = answered_count / total_q

    st.markdown(f"**Questionnaire Progress:** {answered_count} of {total_q} Completed")
    st.progress(progress_ratio)
    st.write("")

    # Questionnaire Loop
    for q in QUESTIONS_DATABASE:
        q_id = q["id"]
        
        st.markdown(
            f"<div class='q-card'>"
            f"<div class='badge-pill'>DIMENSION {q_id:02d}: {q['section_en'].upper()}</div>"
            f"</div>",
            unsafe_allow_html=True
        )

        render_bilingual_header(f"Q{q_id}. {q['text_en']}", f"प्रश्न {q_id}. {q['text_hi']}", st.session_state.language)

        options = q["options"]
        opt_display = []
        for opt in options:
            if st.session_state.language == "English":
                opt_display.append(f"{opt['code']}. {opt['text_en']}")
            elif st.session_state.language == "Hindi":
                opt_display.append(f"{opt['code']}. {opt['text_hi']}")
            else:
                opt_display.append(f"{opt['code']}. {opt['text_en']} | {opt['text_hi']}")

        current_choice = st.session_state.answers.get(q_id)
        default_index = None
        if current_choice:
            default_index = next((i for i, o in enumerate(options) if o["code"] == current_choice), None)

        selected = st.radio(
            f"Select for Q{q_id}",
            opt_display,
            index=default_index,
            key=f"radio_q_{q_id}",
            label_visibility="collapsed"
        )

        if selected:
            chosen_code = selected.split(".")[0]
            st.session_state.answers[q_id] = chosen_code

        st.write("")

    # Submission Controls
    btn_col1, btn_col2, btn_col3 = st.columns([3, 4, 3])
    with btn_col2:
        if answered_count == total_q:
            if st.button("🧭 REVEAL MY PHILOSOPHICAL COMPASS", use_container_width=True):
                st.session_state.submitted = True
                st.rerun()
        else:
            st.info(f"Please answer all questions to reveal your compass ({answered_count}/{total_q} answered).")

# ==============================================================================
# 11. RESULTS & DIAGNOSTIC DASHBOARD
# ==============================================================================
else:
    affinities = calculate_scores(st.session_state.answers)
    top_tradition, top_score = affinities[0]
    tensions = detect_cognitive_tensions(st.session_state.answers, st.session_state.language)

    st.markdown(
        f"<div class='hero-card' style='padding: 30px;'>"
        f"<div class='badge-pill'>PRIMARY WORLDVIEW EMERGENCE</div>"
        f"<h1 class='serif-header' style='font-size: 2.8rem; margin: 10px 0;'>{top_tradition}</h1>"
        f"<p style='font-size: 1.25rem; color: #D4AF37;'>Affinity Match Index: <strong>{top_score}%</strong></p>"
        f"<p style='max-width: 750px; margin: 0 auto; line-height: 1.6;'>{WORLDVIEWS[top_tradition]['desc_en']}</p>"
        f"</div>",
        unsafe_allow_html=True
    )

    tab_results, tab_passport, tab_tensions, tab_odyssey = st.tabs([
        "🏛️ Philosophical Affinities",
        "🪪 Digital Passport",
        "⚡ Points of Tension",
        "📜 Intellectual Odyssey"
    ])

    with tab_results:
        st.markdown("<h3 class='serif-header'>Ranked Worldview Affinities</h3>", unsafe_allow_html=True)
        st.write("Your responses mapped against thirteen historic schools of human thought:")

        for rank, (school, score) in enumerate(affinities, start=1):
            with st.container():
                st.markdown(
                    f"<div class='result-card'>"
                    f"<div style='display: flex; justify-content: space-between; align-items: center;'>"
                    f"<span style='font-size: 1.1rem; font-weight: 700;'>#{rank} {school}</span>"
                    f"<span style='color: #D4AF37; font-weight: 700;'>{score}%</span>"
                    f"</div>"
                    f"</div>",
                    unsafe_allow_html=True
                )
                st.progress(score / 100.0)
                st.write("")

    with tab_passport:
        st.markdown("<h3 class='serif-header'>Your Philosophical Passport</h3>", unsafe_allow_html=True)
        st.write("A generated identity artifact summarizing your cognitive compass.")

        pass_img = generate_passport_image(top_tradition, top_score, theme=st.session_state.theme)
        
        # Save to buffer for preview and download
        buf = io.BytesIO()
        pass_img.save(buf, format="PNG")
        byte_im = buf.getvalue()

        col_img, col_info = st.columns([1.2, 1])
        with col_img:
            st.image(byte_im, use_container_width=True)

        with col_info:
            st.markdown(
                f"<div class='result-card'>"
                f"<h4>Identity Record</h4>"
                f"<p><strong>Leading School:</strong> {top_tradition}</p>"
                f"<p><strong>Resonance Score:</strong> {top_score}%</p>"
                f"<p><strong>Key Influences:</strong> {WORLDVIEWS[top_tradition]['thinkers']}</p>"
                f"<hr style='border-color: rgba(212,175,55,0.2);'/>"
                f"<p style='font-size: 0.9rem; color: #94A3B8;'>"
                f"Download your archival passport artifact as a high-definition PNG suitable for digital sharing or personal reflection."
                f"</p>"
                f"</div>",
                unsafe_allow_html=True
            )

            st.download_button(
                label="📥 DOWNLOAD PASSPORT (PNG)",
                data=byte_im,
                file_name="Philosophical_Passport.png",
                mime="image/png",
                use_container_width=True
            )

            # JSON Data Export
            export_payload = {
                "timestamp": str(datetime.datetime.now()),
                "primary_affinity": top_tradition,
                "affinity_score": top_score,
                "ranked_scores": dict(affinities),
                "answers": st.session_state.answers
            }
            st.download_button(
                label="📄 EXPORT RESULTS (JSON)",
                data=json.dumps(export_payload, indent=2),
                file_name="Worldview_Results.json",
                mime="application/json",
                use_container_width=True
            )

    with tab_tensions:
        st.markdown("<h3 class='serif-header'>Cognitive & Dialectical Tensions</h3>", unsafe_allow_html=True)
        st.write("Internal tensions are not errors or character flaws; they reflect intellectual nuance, complexity, and open philosophical frontiers.")

        if tensions:
            for t in tensions:
                title = t["title_en"] if st.session_state.language == "English" else t["title_hi"] if st.session_state.language == "Hindi" else f"{t['title_en']} | {t['title_hi']}"
                desc = t["desc_en"] if st.session_state.language == "English" else t["desc_hi"] if st.session_state.language == "Hindi" else f"{t['desc_en']}<br/><span style='color: #94A3B8;'>{t['desc_hi']}</span>"
                st.markdown(
                    f"<div class='tension-box'>"
                    f"<h4 style='color: #DC2626; margin-top: 0;'>⚡ {title}</h4>"
                    f"<p style='line-height: 1.6; margin-bottom: 0;'>{desc}</p>"
                    f"</div>",
                    unsafe_allow_html=True
                )
        else:
            st.success("🟢 High Structural Consistency: Your responses form a unified and consistent metaphysical framework without major dialectical tensions.")

    with tab_odyssey:
        st.markdown("<h3 class='serif-header'>Your Intellectual Odyssey</h3>", unsafe_allow_html=True)
        st.markdown(
            f"""
            <div class='result-card' style='line-height: 1.8; font-size: 1.05rem;'>
            <p>
            Your responses indicate a cognitive architecture strongly aligned with <strong>{top_tradition}</strong>, 
            blended with secondary currents from <strong>{affinities[1][0]}</strong> ({affinities[1][1]}%) and 
            <strong>{affinities[2][0]}</strong> ({affinities[2][1]}%).
            </p>
            <p>
            Rather than subscribing to a single dogma, your worldview forms a dynamic matrix of convictions, 
            balancing empirical knowledge, ethical duty, and existential authenticity. 
            Continue examining your core assumptions as your life experience unfolds.
            </p>
            </div>
            """,
            unsafe_allow_html=True
        )

    st.write("---")
    if st.button("↺ RETAKE THE ODYSSEY", use_container_width=False):
        st.session_state.answers = {}
        st.session_state.submitted = False
        st.rerun()