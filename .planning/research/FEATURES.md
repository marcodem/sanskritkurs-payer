# Feature Research

## Domain
Educational Documentation & Sanskrit Typography

## Table Stakes (Must-Haves)
1. **Lokale Volltextsuche**: SSGs müssen Client-seitig durchsuchbar sein (ohne echten Backend-Server).
2. **Auto-Sidebar**: Automatische Generation der Navigation basierend auf Überschriften (H1, H2, H3) innerhalb der Markdown-Dateien.
3. **Paging**: "Vorherige Lektion" und "Nächste Lektion" Buttons am Ende jedes Dokuments.
4. **On-this-page Navigation**: Ein Inhaltsverzeichnis (rechts) für die aktuelle Seite.

## Differentiators (Competitive Advantage)
1. **Unicode/Devanāgarī Integrität**: Keine Encoding-Fehler. Das Setup garantiert, dass indische Schriften fehlerfrei extrahiert und gesetzt werden.
2. **"Warmes" Reading-Experience**: Im Gegensatz zur Standard-Tech-Doku verzichtet das System auf sterile Sans-Serifs und bringt das Buch-ähnliche Layout (Source Serif 4, angenehmer Sepia-Kontrast) aus der `index.html` mit in die SSG Umgebung.

## Anti-Features (Do Not Build)
- **User Logins / Progress Tracking**: Die Seite bleibt statisch; kein Backend-State für Nutzer wird gespeichert.
- **Kommentare/Foren**: Zu viel Administrationsaufwand; es bleibt ein reines Lehrbuch.
