import DefaultTheme from 'vitepress/theme'
import './custom.css'
import { watch } from 'vue'
import { useRoute } from 'vitepress'

function closeAllExcept(clickedGroup) {
    // Finde das Level (z.B. .level-1 oder .level-2) der Gruppe
    const levelClass = Array.from(clickedGroup.classList).find(c => c.startsWith('level-'));
    if (!levelClass) return;

    // Finde alle Geschwister-Gruppen
    const peers = document.querySelectorAll('.VPSidebarItem.' + levelClass);
    peers.forEach(peer => {
        // Wenn es nicht die geklickte Gruppe ist und sie noch offen ist
        if (peer !== clickedGroup && !peer.classList.contains('collapsed')) {
            const btn = peer.querySelector('.item');
            if (btn) {
                // Wir werfen den virtuellen Klick KOMPLETT aus dem aktuellen Event-Loop!
                // Dadurch läuft unsere Aktion völlig autark von Vue's aktueller Klick-Verarbeitung!
                setTimeout(() => {
                    btn.click();
                }, 0);
            }
        }
    });
}

function closeInactiveGroups() {
    // Finde alle strukturellen VPSidebarItems (wir prüfen später, ob sie klappbar sind)
    const allGroups = document.querySelectorAll('.VPSidebarItem'); 
    const currentPath = window.location.pathname.replace(/\/$/, "");
    
    allGroups.forEach(group => {
         // Suche alle Links innerhalb dieses Lektions-Ordners
         const links = Array.from(group.querySelectorAll('a'));
         
         // Prüfe, ob einer davon mathematisch exakt auf die aktuelle Seite zeigt
         const isGroupActive = links.some(link => {
             if (!link.href) return false;
             try {
                 // Parsen der URL, um den echten Pfad zu vergleichen
                 const linkPath = new URL(link.href).pathname.replace(/\/$/, "");
                 // Wenn der Link auf den aktuellen Pfad zielt (z.B. /lektionen/lektion12), dann ist diese Gruppe AKTIV!
                 return linkPath === currentPath;
             } catch (e) {
                 return false;
             }
         });
         
         const isOpen = !group.classList.contains('collapsed');
         
         // Wenn der Ordner offen steht, aber gar kein aktives Element enthält UND er wirklich klappbar ist -> Dann zuklappen!
         if (!isGroupActive && isOpen && group.querySelector('.caret, .indicator, .action')) {
             const btn = group.querySelector('.item');
             if (btn) btn.click();
         }
    });
}

export default {
  ...DefaultTheme,
  setup() {
    const route = useRoute();
    if (typeof document !== 'undefined') {
        // Listener für Navigation (z.B. Weiter-Button oder Interne Links)
        watch(() => route.path, () => {
             // Warte kurz, bis Vue die Sidebar-Klassen (.is-active) gerendert hat
             setTimeout(() => {
                 closeInactiveGroups();
             }, 150);
        });
    }
  },
  enhanceApp({ app }) {
      if (typeof window !== 'undefined') {
          // Manueller Klick-Listener für das "Akkordeon"-Gefühl in der Sidebar
          // Wir übergeben 'true' (Capture-Phase), da Vue sonst oft Klicks über stopPropagation() blockiert!
          window.addEventListener('click', (e) => {
              // Verhindere eine Endlosschleife, wenn unser Skript (.click()) selbst klickt!
              if (!e.isTrusted) return;
              
              // Klick auf den flexiblen Header einer Gruppe (.item)
              const itemHeader = e.target.closest('.VPSidebarItem > .item');
              if (itemHeader) {
                   const clickedGroup = itemHeader.closest('.VPSidebarItem');
                   if (!clickedGroup) return;
                   
                   // Prüfen, ob der geklickte Header überhaupt ein "Klapp-Ordner" ist (Carets haben)
                   // Normale Links haben keinen Caret!
                   const isCollapsible = itemHeader.querySelector('.caret, .indicator, .action');
                   if (!isCollapsible) return;
                   
               // Normalerweise hat Vue eine Latenzzeit, um CSS Klassen upzudaten.
                   // Lösung: Wir prüfen SYNCHRON VOR Vue's Verarbeitung!
                   // Wenn der Ordner in der Sekunde des Klicks die Klasse "collapsed" besitzt,
                   // wissen wir zu 100%, dass der User ihn gerade ÖFFNEN will!
                   const wantsToOpen = clickedGroup.classList.contains('collapsed');
                   
                   if (wantsToOpen) {
                       closeAllExcept(clickedGroup);
                   }
              }
          }, true); // <- WICHTIG: Capture-Phase nutzen (true), um Vue's mögliches stopPropagation zu umgehen!
      }
  }
}
