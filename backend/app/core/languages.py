from typing import Dict, List, Optional
from pydantic import BaseModel, Field

class LanguageConfig(BaseModel):
    """Configuration metadata for supported languages in JANSETU."""
    code: str = Field(description="Canonical BCP-47 language tag, e.g. ta-IN")
    short_code: str = Field(description="2-letter ISO 639-1 language code, e.g. ta")
    name: str = Field(default="", description="Language name, e.g. Tamil")
    display_name: str = Field(default="", description="English display name, e.g. Tamil")
    native_name: str = Field(description="Endonym in indigenous script, e.g. தமிழ்")
    script: str = Field(default="", description="Script used, e.g. Tamil, Devanagari")
    speech_code: str = Field(description="Speech-to-Text recognizer language tag for Chirp 2")
    translation_code: str = Field(description="Cloud Translation v3 target/source language code")
    chirp_supported: bool = Field(default=True, description="Whether Chirp 2 Speech-to-Text supports this language")
    translation_supported: bool = Field(default=True, description="Whether Translation v3 supports this language")
    sample_phrase: str = Field(default="", description="Canonical sample citizen phrase")
    enabled: bool = Field(default=True, description="Whether this language is enabled for intake")
    direction: str = Field(default="ltr", description="Text direction: ltr or rtl")

    def __init__(self, **data):
        if "name" not in data and "display_name" in data:
            data["name"] = data["display_name"]
        elif "display_name" not in data and "name" in data:
            data["display_name"] = data["name"]
        super().__init__(**data)

# Canonical Registry of Supported Indian Languages
LANGUAGE_REGISTRY: Dict[str, LanguageConfig] = {
    "ta-IN": LanguageConfig(
        code="ta-IN",
        short_code="ta",
        name="Tamil",
        display_name="Tamil",
        native_name="தமிழ்",
        script="Tamil",
        speech_code="ta-IN",
        translation_code="ta",
        chirp_supported=True,
        translation_supported=True,
        sample_phrase="எங்கள் கிராமத்திற்கு மாலை 7 மணிக்கு பிறகு பேருந்து வசதி இல்லை, பள்ளி மாணவர்கள் மிகவும் சிரமப்படுகின்றனர்.",
        enabled=True,
        direction="ltr"
    ),
    "hi-IN": LanguageConfig(
        code="hi-IN",
        short_code="hi",
        name="Hindi",
        display_name="Hindi",
        native_name="हिन्दी",
        script="Devanagari",
        speech_code="hi-IN",
        translation_code="hi",
        chirp_supported=True,
        translation_supported=True,
        sample_phrase="हमारे ब्लॉक में पिछले तीन हफ्तों से पीने के पानी की आपूर्ति पूरी तरह ठप है, अस्पताल और बच्चे परेशान हैं।",
        enabled=True,
        direction="ltr"
    ),
    "te-IN": LanguageConfig(
        code="te-IN",
        short_code="te",
        name="Telugu",
        display_name="Telugu",
        native_name="తెలుగు",
        script="Telugu",
        speech_code="te-IN",
        translation_code="te",
        chirp_supported=True,
        translation_supported=True,
        sample_phrase="మా గ్రామంలో ప్రాథమిక ఆరోగ్య కేంద్రంలో వైద్యులు అందుబాటులో లేరు, అత్యవసర సమయాల్లో తీవ్ర ఇబ్బందులు పడుతున్నాము.",
        enabled=True,
        direction="ltr"
    ),
    "en-IN": LanguageConfig(
        code="en-IN",
        short_code="en",
        name="Indian English",
        display_name="Indian English",
        native_name="English",
        script="Latin",
        speech_code="en-IN",
        translation_code="en",
        chirp_supported=True,
        translation_supported=True,
        sample_phrase="The primary arterial connecting road between our panchayat and the state highway has severe crater-sized potholes.",
        enabled=True,
        direction="ltr"
    ),
    # Extensibility slots for scheduled Indian languages
    "mr-IN": LanguageConfig(
        code="mr-IN",
        short_code="mr",
        name="Marathi",
        display_name="Marathi",
        native_name="मराठी",
        script="Devanagari",
        speech_code="mr-IN",
        translation_code="mr",
        chirp_supported=True,
        translation_supported=True,
        sample_phrase="आमच्या गावात संध्याकाळी 7 नंतर बस सेवा उपलब्ध नाही, विद्यार्थ्यांचे हाल होत आहेत.",
        enabled=True,
        direction="ltr"
    ),
    "kn-IN": LanguageConfig(
        code="kn-IN",
        short_code="kn",
        name="Kannada",
        display_name="Kannada",
        native_name="ಕನ್ನಡ",
        script="Kannada",
        speech_code="kn-IN",
        translation_code="kn",
        chirp_supported=True,
        translation_supported=True,
        sample_phrase="ನಮ್ಮ ಹಳ್ಳಿಗೆ ಸಂಜೆ 7 ರ ನಂತರ ಬಸ್ ಸೌಲಭ್ಯವಿಲ್ಲ, ವಿದ್ಯಾರ್ಥಿಗಳಿಗೆ ಕಷ್ಟವಾಗುತ್ತಿದೆ.",
        enabled=True,
        direction="ltr"
    )
}

# Alias mapping for flexible incoming formats (e.g. 'ta', 'tamil', 'ta-in')
_CODE_ALIASES: Dict[str, str] = {
    "ta": "ta-IN",
    "tamil": "ta-IN",
    "ta-in": "ta-IN",
    "hi": "hi-IN",
    "hindi": "hi-IN",
    "hi-in": "hi-IN",
    "te": "te-IN",
    "telugu": "te-IN",
    "te-in": "te-IN",
    "en": "en-IN",
    "english": "en-IN",
    "en-in": "en-IN",
    "mr": "mr-IN",
    "marathi": "mr-IN",
    "mr-in": "mr-IN",
    "kn": "kn-IN",
    "kannada": "kn-IN",
    "kn-in": "kn-IN"
}

def normalize_language_code(input_code: Optional[str]) -> str:
    """Normalizes any input language code or alias to canonical tag (e.g. 'ta' -> 'ta-IN')."""
    if not input_code:
        return "ta-IN"  # Default Indian pilot language
    cleaned = input_code.strip().lower()
    return _CODE_ALIASES.get(cleaned, input_code)

def get_language(code: Optional[str]) -> Optional[LanguageConfig]:
    """Retrieves language configuration for a code or alias."""
    canonical = normalize_language_code(code)
    return LANGUAGE_REGISTRY.get(canonical)

def is_supported_language(code: Optional[str]) -> bool:
    """Validates whether a language code is currently supported and enabled."""
    if not code:
        return False
    canonical = normalize_language_code(code)
    lang = LANGUAGE_REGISTRY.get(canonical)
    return lang is not None and lang.enabled

def list_supported_languages() -> List[LanguageConfig]:
    """Returns all currently enabled languages."""
    return [lang for lang in LANGUAGE_REGISTRY.values() if lang.enabled]
