"""
Shared German & Grammar Terminology Library for Quality Control and QA checks.
Single Source of Truth across the translation pipeline.
"""
import re

DE_FALLBACK_ALLOWED = {"rm", "grc", "el", "la", "cop"}

EXCLUDE_META = {
    "licenses.md", "AUTHORS_GUIDE.md", "settings.md", "impressum.md", 
    "grammatik.md", "themen.md", "qa_help.md"
}

LATIN_GRAMMAR_TERMS = {
    "Nominativ", "Akkusativ", "Genetiv", "Instrumentalis", "Vokativ", 
    "Ablativ", "Passiv", "Infinitiv", "Dativ", "Lokativ", "Komposita"
}

STRICT_DE_GRAMMAR_KEYWORDS = [
    "Präsensklasse", "Verschlusslaut", "stimmhaft", "stimmlose", "stimmlosem",
    "Wiederholungsübung", "Bildungen auf", "wird durch", "bleiben unverändert",
    "bei Maskulina", "bei Neutra", "außer j", "entsprechenden", "Ersetzung durch",
    "mit direktem Objekt", "Passivsatz", "Doppelter Akkusativ", "Fragepronomina",
    "Glückbringender Anfang", "Konsonantenzeichen", "Materialien zum Sanskrit",
    "Zusätzliche Übung", "Verehrung des", "Laute des Sanskrit", "Bildquelle:"
]

GERMAN_KEYWORDS = [
    "Die Laute des Sanskrit", "Verehrung des", "Schriftübung", "Glückbringender Anfang", 
    "Bildquelle:", "Jedes Konsonantenzeichen", "Materialien zum Sanskrit", "Zusätzliche Übung", 
    "Auslautendes", "wird es zu", "Ersetzung durch", "mit direktem Objekt",
    "Der Passivsatz", "Doppelter Akkusativ", "Fragepronomina"
]

# Distinct German grammatical expressions that indicate untranslated German text
RAW_RESIDUE_TERMS = [
    "d.h.", "usw.", "vgl.", "z.B.", "Stammabstufung", "auslautend", "Formgleich", 
    "mehrsilbig", "entweder", "Dehnstufe", "Hochstufe", "Tiefstufe", "Normalstufe", 
    "Schwundstufe", "Merke:", "Beachte:", "Anmerkung:", "Hinweis:", "Beispiel:", 
    "Beispiele:", "Präsensklasse", "Aoristklasse", "Perfektstamm", "Desiderativstamm", 
    "Kausativstamm", "Verbalwurzel", "Kasusendung", "Kasussystem", "Deklinationsklasse", 
    "Konjugationsklasse", "Sandhi-Regel", "Lautgesetz", "Stammvokal",
    "er, sie, es; der, die, das", "dieser, diese, dieses", "dem Sprechenden sehr Nahe"
]

ALL_TERMS = sorted(list(set(STRICT_DE_GRAMMAR_KEYWORDS + GERMAN_KEYWORDS + RAW_RESIDUE_TERMS)), key=len, reverse=True)

# Pre-compiled regex for fast residue scanning (strict word boundaries)
DE_RESIDUE_REGEX = re.compile(
    r'\b(' + '|'.join(re.escape(t) for t in ALL_TERMS) + r')\b',
    re.IGNORECASE
)

