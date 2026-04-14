import DefaultTheme from 'vitepress/theme'
import './custom.css'
import { watch } from 'vue'
import { useRoute } from 'vitepress'

function closeAllExcept(clickedGroup) {
    const levelClass = Array.from(clickedGroup.classList).find(c => c.startsWith('level-'));
    if (!levelClass) return;

    const peers = document.querySelectorAll('.VPSidebarItem.' + levelClass);
    peers.forEach(peer => {
        if (peer !== clickedGroup) {
            const isCollapsed = peer.classList.contains('collapsed') || peer.classList.contains('is-collapsed');
            if (!isCollapsed) {
                const btn = peer.querySelector('.item');
                if (btn) {
                    setTimeout(() => {
                        btn.click();
                    }, 0);
                }
            }
        }
    });
}

function closeInactiveGroups() {
    const allGroups = document.querySelectorAll('.VPSidebarItem.collapsible'); 
    const currentPath = window.location.pathname.replace(/\/$/, "");
    
    allGroups.forEach(group => {
         const links = Array.from(group.querySelectorAll('a'));
         const isGroupActive = links.some(link => {
             if (!link.href) return false;
             try {
                 const linkPath = new URL(link.href).pathname.replace(/\/$/, "");
                 return linkPath === currentPath;
             } catch (e) { return false; }
         });
         
         const isCollapsed = group.classList.contains('collapsed') || group.classList.contains('is-collapsed');
         if (!isGroupActive && !isCollapsed) {
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
        watch(() => route.path, () => {
             setTimeout(closeInactiveGroups, 250);
        });
    }
  },
  enhanceApp({ app }) {
      if (typeof window !== 'undefined') {
          console.log("Sanskrit-Akkordeon: Aktiviert");
          window.addEventListener('click', (e) => {
              if (!e.isTrusted) return;
              const itemHeader = e.target.closest('.VPSidebarItem.collapsible > .item');
              if (itemHeader) {
                   const clickedGroup = itemHeader.closest('.VPSidebarItem');
                   if (!clickedGroup) return;
                   const isCollapsed = clickedGroup.classList.contains('collapsed') || clickedGroup.classList.contains('is-collapsed');
                   if (isCollapsed) {
                       closeAllExcept(clickedGroup);
                   }
              }
          }, true);
      }
  }
}
