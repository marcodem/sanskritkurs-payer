const fs = require('fs');
const path = require('path');
const iconv = require('iconv-lite');
const { JSDOM } = require('jsdom');
const TurndownService = require('turndown');
const turndownPluginGfm = require('turndown-plugin-gfm');

const INPUT_DIR = path.join(__dirname, '../sanskritkurs');
const OUTPUT_DIR = path.join(__dirname, '../docs/lektionen');
const ASSETS_OUT_DIR = path.join(__dirname, '../docs/public/images');

// In Phase 1 erstellen wir das Output Directory, falls es fehlt.
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
if (!fs.existsSync(ASSETS_OUT_DIR)) fs.mkdirSync(ASSETS_OUT_DIR, { recursive: true });

// Ab jetzt lesen wir dynamisch den gesamten Ordner aus (Skalierung)
const allFiles = fs.readdirSync(INPUT_DIR);
const TARGET_FILES = allFiles.filter(f => f.toLowerCase().endsWith('.htm') || f.toLowerCase().endsWith('.html'));

// Hier sammeln wir die Lizenzen global
const licensesMap = new Map();

// Konfiguration des Turndown Services für Github-Flavored Markdown (Für Tabellen)
const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced'
});
turndownService.use(turndownPluginGfm.tables);

// Custom Rule: Wirft unnötige Spans und Fonts raus, behält aber den inneren Text!
turndownService.addRule('strip-style', {
  filter: ['span', 'div', 'font', 'center', 'b'],
  replacement: function (content) {
    return content; 
  }
});

async function run() {
  for (const filename of TARGET_FILES) {
    console.log(`Processing ${filename}...`);
    const filePath = path.join(INPUT_DIR, filename);
    
    if (!fs.existsSync(filePath)) {
      console.error(`File missing: ${filePath}`);
      continue;
    }

    // 1. SMART ENCODING SICHERN (Mojibake Heuristik)
    const buffer = fs.readFileSync(filePath);
    
    // Wir dekodieren es testweise als win1252
    let htmlContent = iconv.decode(buffer, 'win1252');
    
    // Wenn der Text nun klassische UTF-8-als-win1252 Artefakte enthält (wie "Ãœ", "Ã¤", "Ã¶", "Ã¼", "Â"),
    // dann beweist das, dass die Datei auf der Festplatte physisch echtes UTF-8 ist!
    if (htmlContent.match(/Ã[¤¶¼Ÿœ]/) || htmlContent.includes('Ãœ') || htmlContent.includes('Ã') || htmlContent.includes('Â')) {
       // Also verwerfen wir win1252 und lesen es blank als UTF-8!
       htmlContent = buffer.toString('utf8');
    }

    // 2. DOM PARSING
    const dom = new JSDOM(htmlContent);
    const document = dom.window.document;

    // --- CLEANUP ---
    
    // a) Harte Löschung überflüssiger Tags (inkl. Inhalt)
    const removeSelectors = ['head', 'script', 'style', 'hr'];
    removeSelectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => el.remove());
    });

    // NEU: Altes Inline-Impressum ("Payer, Alois <1944 ->...") & "Global Village Library" Satz löschen
    // Da wir oben einen sauberen VitePress Hinweis generieren, sind diese alten Vermerke überflüssig.
    document.querySelectorAll('*').forEach(el => {
      const text = el.textContent || '';
      // Schütze body/html/main Tags davor, sich selbst zu löschen, weil sie den Text als children enthalten!
      if (!el.children.length || el.tagName.toLowerCase() === 'p' || el.tagName.toLowerCase() === 'div') {
          if (text.includes('Payer, Alois') && text.includes('Sanskritkurs')) {
              el.remove();
          } else if (text.includes('Dieser Text ist Teil der Abteilung Sanskrit') && text.includes('Global Village')) {
              el.remove();
          }
      }
    });

    // b) Löschen des sich stets wiederholenden Logos
    document.querySelectorAll('img[src*="sanskritkurslogo.jpg"]').forEach(img => {
      img.remove();
    });

    // NEU: c) Entpacken (Unwrap) von Tags, die nur umhüllen, aber keine Semantik haben
    // Dadurch bleiben sie nicht als rohes HTML im Markdown hängen!
    const unwrapTags = ['font', 'span', 'center', 'div'];
    unwrapTags.forEach(tag => {
      document.querySelectorAll(tag).forEach(el => {
        el.replaceWith(...el.childNodes);
      });
    });

    // NEU: d) Layout-Tabellen entpacken
    // Früher wurden oft 1x1 Tabellen (1 Reihe, 1 Spalte) genutzt, nur um Text einzurücken.
    // Markdown-Tabellen unterstützen keine echten Listen im Inneren, weshalb Turndown rohes HTML übrig lässt.
    // Wir knacken diese 1x1 Tabellen auf und befreien den Inhalt!
    document.querySelectorAll('table').forEach(table => {
      const trs = table.querySelectorAll('tr');
      const cells = table.querySelectorAll('td, th');
      if (trs.length === 1 && cells.length === 1) {
        table.replaceWith(...cells[0].childNodes);
      } else {
        // ECHTE TABELLEN FIX:
        // Markdown (Turndown) braucht ZWINGEND ein <thead> mit <th>, um eine Markdown-Tabelle (| col | col |) zu generieren.
        // Payer's HTML Tabellen haben meist keins (nur <tr><td>).
        // Wenn die Tabelle keine colspans oder verborgenen Komplexitäten hat, "ernennen" wir die erste Zeile zur Header-Row!
        if (!table.querySelector('thead') && !table.querySelector('[colspan], [rowspan]')) {
          const firstTr = table.querySelector('tr');
          if (firstTr) {
            const thead = document.createElement('thead');
            table.insertBefore(thead, table.firstChild);
            thead.appendChild(firstTr);
            // Wandle die <td> der ersten Reihe in <th> um
            firstTr.querySelectorAll('td').forEach(td => {
              const th = document.createElement('th');
              th.innerHTML = td.innerHTML;
              td.parentNode.replaceChild(th, td);
            });
          }
        }
      }
    });

    // e) Attribute abstreifen (hilft Turndown sauberes MD zu bauen und HTML-Tabellen nahtlos in Vue zu stylen)
    document.querySelectorAll('*').forEach(el => {
      el.removeAttribute('style');
      el.removeAttribute('align');
      el.removeAttribute('face');
      el.removeAttribute('size');
      el.removeAttribute('color');
      el.removeAttribute('width');
      el.removeAttribute('height');
      el.removeAttribute('border');
      el.removeAttribute('bgcolor');
      el.removeAttribute('cellspacing');
      el.removeAttribute('cellpadding');
      el.removeAttribute('valign');
    });

    // d) [ENTFERNT] Titelnummerierungen werden nun beibehalten, 
    // damit Inhaltsangabe (Outline) und "Übersicht"-Bulletpoints zu 100% matchen!

    // e) Guillotine: Repetitives Impressum wegschneiden (Alois Payer Header)
    // Alle Text-Blöcke, die diese Typischen Footer/Header Wörter enthalten, aus dem DOM tilgen.
    const impressumKeywords = ['Alois Payer', 'Payer, Alois', 'mailto:', 'Zitierweise', 'Erstmals hier publiziert', 'Überarbeitungen', 'Anlass', 'Lehrveranstaltungen 1980', 'opyright', 'diakritischen Zeichen', 'Unicode-Dev', 'Global Village Library'];
    for (const child of Array.from(document.body.children)) {
        if (child.tagName.match(/^H[1-6]$/) && child.textContent.includes('Übersicht')) break; // Nach der "Übersicht" aufhören zu löschen, um den Lektionstext zu schützen!
        
        const text = child.textContent;
        if (impressumKeywords.some(k => text.includes(k))) {
            child.remove();
        }
    }

    // f) Bildpfade anpassen, Bilder kopieren und Lizenzen registrieren!
    document.querySelectorAll('img').forEach(img => {
      const src = img.getAttribute('src');
      if (src && !src.startsWith('http')) {
         const basename = path.basename(src);
         
         // Lizenzen Auslesen (Audit Vorbereitung)
         let caption = "Keine spezielle Lizenz/Bildquelle im Text gefunden";
         const wrapper = img.closest('p, div, center');
         if (wrapper && wrapper.textContent.includes('Bildquelle')) {
             caption = wrapper.textContent.trim().replace(/\n/g, ' ');
         } else if (wrapper && wrapper.nextElementSibling && wrapper.nextElementSibling.textContent.includes('Bildquelle')) {
             caption = wrapper.nextElementSibling.textContent.trim().replace(/\n/g, ' ');
         }
         // In die globale Liste werfen
         licensesMap.set(basename, caption);

         // Physisch kopieren ins `public` Verzeichnis
         const sourcePath = path.join(INPUT_DIR, src);
         const targetPath = path.join(ASSETS_OUT_DIR, src);
         if (fs.existsSync(sourcePath)) {
            fs.copyFileSync(sourcePath, targetPath);
         }
         // Absolute Root-Referenz für SSG
         img.setAttribute('src', `/images/${src}`);
      }
    });

    // g) Lokale .htm Links zu .md Links umschreiben
    document.querySelectorAll('a').forEach(a => {
      let href = a.getAttribute('href');
      if (!href) return;
      
      // Herr Payer hat manchmal "https://www.payer.de/sanskritkurs/" als harten (absoluten) Pfad statt relativ genutzt.
      // Wir biegen Kurs-Links auf lokal um, damit der Nutzer nicht aus dem System geworfen wird!
      if (href.includes('payer.de/sanskritkurs/')) {
         href = href.replace(/^https?:\/\/(www\.)?payer\.de\/sanskritkurs\//i, '');
      }

      if (!href.startsWith('http') && href.includes('.htm')) {
        const newHref = href.replace(/\.html?/i, '.md');
        a.setAttribute('href', newHref);
      }
    });

    // --- RENDER MARKDOWN ---
    let markdown = turndownService.turndown(document.body);

    // FIX Vue Compiler Fehler:
    // Vue versucht Dinge wie "<1944 ->" im reinen Text fälschlicherweise als HTML-Komponenten zu kompilieren.
    markdown = markdown.replace(/<([^>]+)>/g, (match, inner) => {
        // Extrahiere nur den reinen Tag-Namen (ohne / und ohne Attribute wie colspan="4")
        const tagName = inner.toLowerCase().trim().replace(/^\//, '').split(' ')[0];
        
        const allowedTags = [
            'br', 'hr', 'sup', 'sub', 'b', 'i', 'em', 'strong',
            'table', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th', 'caption', 'colgroup', 'col',
            'p', 'ul', 'ol', 'li', 'div', 'span', 'a', 'img', 'figure', 'figcaption'
        ];
        
        if (allowedTags.includes(tagName)) {
            return match; // echtes HTML behalten
        }
        return `&lt;${inner}&gt;`; // Als reinen Text maskieren
    });

    // Redundante Top-Level Überschriften bereinigen!
    markdown = markdown.replace(/^#+ Sanskritkurs\s*\n/gmi, '');
    
    // Nummern-Präfixe _nur_ bei Haupttiteln bereinigen!
    // Turndown escaped Punkte als "\.", also berücksichtigen wir das!
    markdown = markdown.replace(/^(#+)\s+[\d\\.]+\s*(Lektion\s*\d+|Übung\s*\d+|Schrift[A-Za-zü]*\s*\d+)/gmi, '$1 $2');

    // Harter Deduplizierer: Löscht alle weiteren Erwähnungen des genauen Haupttitels in der gesamten Datei!
    // Payer hatte (z.B. in Lektion 1) "# Lektion 1", dann etwas Text, dann nochmal "## Lektion 1".
    const titleMatch = markdown.match(/^(#+)\s+((?:Lektion|Übung|Schrift[A-Za-zü]*)\s*\d+)/i);
    if(titleMatch) {
        const titleText = titleMatch[2]; // e.g. "Lektion 1"
        const duplicateRegex = new RegExp(`^#+\\s+${titleText}\\s*\\n+`, 'gim');
        let isFirst = true;
        markdown = markdown.replace(duplicateRegex, (match) => {
            if (isFirst) {
                isFirst = false;
                return match; 
            }
            return ''; // Weitere Treffer restlos streichen!
        });
    }

    // === H1 OUTLINE FIX ===
    // VitePress ignoriert H1 bei der Outline ("Auf dieser Seite"). 
    // Viele echte Text-Abschnitte (wie "Der Nominalsatz") wurden aber von Payer als H1 formatiert.
    // Lösung: Wir degradieren pauschal ALLE Überschriften im Lösungs-Markdown um ein Level (H1 -> H2, H2 -> H3 etc.)
    markdown = markdown.replace(/^(#+)\s/gm, '$1# ');

    // Der allererste Haupt-Titel jeder Datei soll aber die alleinige H1 der Seite sein!
    // (replace mit m-Flag trifft nur den allerersten Treffer!)
    markdown = markdown.replace(/^#+\s+(.*)$/m, '# $1');
    
    // Inhaltsverzeichnis-Spezialfall: Payer hat ab Lektion 13 plötzlich H1 statt H2 verwendet.
    // Das führte zu wilden Einrückungen (Lektion 12=H3, Lektion 13=H2).
    // Wir glätten ALLES im Inhaltsverzeichnis als saubere H2 (##), was einen internen Link hat:
    if (filename.toLowerCase().includes('inhaltsverzeichnis')) {
        markdown = markdown.replace(/^#+\s+\[([^\]]+)\]/gm, '## [$1]');
    }

    // Aufräumen von Chrome-Extension Artefakten (die vom ursprünglichen Webmaster ausversehen mitgespeichert wurden)
    markdown = markdown.replace(/!\[\]\(\/images\/chrome-extension:[^\)]+\)/gi, '');

    // === KONSEQUENTE NUMMERIERUNG ===
    // Wir ziehen die Datei-Nummer (z.B. 3 bei lektion03.md) als Basis heran
    const matchNum = filename.match(/(?:lektion|uebung|schrift)(\d+)/i);
    // Das Inhaltsverzeichnis greifen wir natürlich nicht an!
    if (matchNum && !filename.toLowerCase().includes('inhaltsverzeichnis')) {
        const baseNum = parseInt(matchNum[1], 10);
        
        // Wir suchen in der gesamten Datei nach Überschriften (#, ##) oder Aufzählungen (*, -)
        // die direkt danach mit einer Ziffer (1., 3.1. etc) beginnen.
        // Turndown maskiert Punkte hinter Zahlen manchmal als "\.", das beachten wir.
        markdown = markdown.replace(/^([ \t]*[#*-]+[ \t]+)((?:\d+[\\.]*)+)(?=\s)/gm, (match, prefix, numbers) => {
            // Säubere "\." zu "."
            let cleanNumbers = numbers.replace(/\\/g, '');
            if (!cleanNumbers.endsWith('.')) {
                cleanNumbers += '.';
            }
            // Hänge die Lektionsnummer elegant als Master-Counter vorne an!
            // Aus "1." in Lektion 3 wird "3.1."
            return prefix + baseNum + "." + cleanNumbers;
        });
    }

    // === ALTE MANUELLE NAVIGATION ENTFERNEN ===
    // VitePress rendert am Ende der Seite schicke fließende "Vor / Zurück" Buttons automatisch.
    // Herr Payer hatte dafür manuell unten "Zu Lektion 2" etc. hingeschrieben.
    // Wir entfernen alle (isolierten) Zeilen, die ein reiner Markdown-Link mit optionalen Nav-Vokabeln sind.
    markdown = markdown.replace(/^(?:(?:Zu|Zur|Zum|Zurück(?: zu)?|Weiter(?: zu)?)\s*)?\[[^\]]+\]\([^)]+\)\s*$/gmi, '');

    // SICHERHEITSNETZ (RADIKAL): Nuke alle übrig gebliebenen Payer-Zitate im Markdown
    markdown = markdown.replace(/^>?\s*Payer,\s*Alois.*?Sanskritkurs.*?$/gmi, '');
    markdown = markdown.replace(/^>?\s*Dieser Text ist Teil der Abteilung Sanskrit.*?Global Village.*?$/gmi, '');

    // === TOTE CREATIVE COMMONS ICONS LÖSCHEN ===
    // Yahoo/Flickr (l.yimg.com) und alte CC-Image-Server sind heute down oder blockieren Hotlinking.
    // Wir löschen diese gebrochenen Bild-Links ersatzlos (die Lizenz steht im Text ohnehin dabei!)
    markdown = markdown.replace(/!\[.*?\]\(https?:\/\/(?:[^/]+\.)?(?:yimg\.com|creativecommons\.org)\/[^)]+\)/gmi, '');

    // Impressum-Referenz oben dransetzen
    const notice = `> [!INFO] Zitierweise & Rechte\n> Dieses Kapitel ist Teil des Sanskritkurses. Details zum Copyright und zur Zitierweise der Ursprungsfassung siehe: [Impressum & Copyright](/impressum)\n\n`;
    markdown = notice + markdown;

    const outFileName = filename.replace(/\.html?$/i, '.md');
    const outFilePath = path.join(OUTPUT_DIR, outFileName);

    fs.writeFileSync(outFilePath, markdown, 'utf8');
    console.log(`  -> Saved ${outFilePath}`);
  }
  
  // Am Ende: LICENSES.md Ausgeben!
  let licenseMD = "# Bild-Lizenzen Audit\n\n| Bild-Datei | Gefundene Quell-Angabe |\n|---|---|\n";
  for (let [img, text] of licensesMap) {
      licenseMD += `| \`${img}\` | ${text} |\n`;
  }
  fs.writeFileSync(path.join(__dirname, '../docs/licenses.md'), licenseMD, 'utf8');
  console.log(`\n✅ Lizenzen-Tabelle exportiert: docs/licenses.md`);
  
  console.log("\n✅ Konvertierung abgeschlossen. Alle Dateien skaliert!");
}

run().catch(err => console.error(err));
