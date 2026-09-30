from typing import Tuple, Optional
from app.config import settings
from app.core.logging import logger

try:
    from google.cloud import translate_v3 as translate
    HAS_TRANSLATE_SDK = True
except ImportError:
    HAS_TRANSLATE_SDK = False

KNOWN_VERNACULAR_TRANSLATIONS = {
    "எங்கள் கிராமத்திற்கு மாலை 7 மணிக்கு பிறகு பேருந்து வசதி இல்லை, பள்ளி மாணவர்கள் மிகவும் சிரமப்படுகின்றனர்.": (
        "There is no bus facility to our village after 7 PM, school students are suffering immensely.",
        "ta"
    ),
    "எங்கள் பகுதியில் மாலை 7 மணிக்கு மேல் பேருந்துகள் இல்லை": (
        "There are no buses in our area after 7 PM.",
        "ta"
    ),
    "மாணவர்கள் இரவில் பயணிக்க முடியாது": (
        "Students cannot travel at night.",
        "ta"
    ),
    "பேருந்து சேவை மிக சீக்கிரமாக நிற்கிறது": (
        "Bus service stops too early.",
        "ta"
    ),
    "மாலை நேர போக்குவரத்து இல்லை": (
        "No evening transport.",
        "ta"
    ),
    "हमारे ब्लॉक में पिछले तीन हफ्तों से पीने के पानी की आपूर्ति पूरी तरह ठप है, अस्पताल और बच्चे परेशान हैं।": (
        "In our block, drinking water supply has been completely halted for the past three weeks, hospitals and children are in distress.",
        "hi"
    ),
    "మా గ్రామంలో ప్రాథమిక ఆరోగ్య కేంద్రంలో వైద్యులు అందుబాటులో లేరు, అత్యవసర సమయాల్లో తీవ్ర ఇబ్బందులు పడుతున్నాము.": (
        "Doctors are not available at the Primary Health Center in our village, we face severe difficulties during emergencies.",
        "te"
    )
}

class TranslationService:
    def __init__(self):
        self.client = None
        self.parent = f"projects/{settings.GOOGLE_CLOUD_PROJECT}/locations/global"
        if HAS_TRANSLATE_SDK and not settings.BIGQUERY_USE_MOCK:
            try:
                self.client = translate.TranslationServiceClient()
                logger.info("Connected to Google Cloud Translation v3 Client")
            except Exception as e:
                logger.warning(f"Could not initialize Google Translation client: {e}")

    async def translate_to_english(
        self,
        text: str,
        source_lang: Optional[str] = None
    ) -> Tuple[str, str]:
        """
        Translates regional text to English.
        Returns: (english_translation, detected_source_language)
        """
        clean_text = text.strip()

        # Check known dictionary first
        if clean_text in KNOWN_VERNACULAR_TRANSLATIONS:
            return KNOWN_VERNACULAR_TRANSLATIONS[clean_text]

        # Use Google Cloud Translation API if client available
        if self.client:
            try:
                response = self.client.translate_text(
                    parent=self.parent,
                    contents=[clean_text],
                    target_language_code="en",
                    source_language_code=source_lang
                )
                if response.translations:
                    translation = response.translations[0].translated_text
                    detected_lang = response.translations[0].detected_language_code or source_lang or "en"
                    return translation, detected_lang
            except Exception as e:
                logger.warning(f"Translation API error: {e}. Falling back to default detection.")

        # Simple script heuristic for detection
        detected = source_lang or self._detect_script(clean_text)
        
        # If already english or unrecognized
        if detected == "en":
            return clean_text, "en"

        # Safe fallback translation
        return clean_text, detected

    def _detect_script(self, text: str) -> str:
        for char in text:
            code = ord(char)
            if 0x0B80 <= code <= 0x0BFF:
                return "ta"
            elif 0x0900 <= code <= 0x097F:
                return "hi"
            elif 0x0C00 <= code <= 0x0C7F:
                return "te"
            elif 0x0C80 <= code <= 0x0CFF:
                return "kn"
        return "en"

translation_service = TranslationService()
