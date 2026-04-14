import DefaultTheme from 'vitepress/theme'
import './custom.css'

export default {
  ...DefaultTheme,
  enhanceApp({ app }) {
    if (typeof window !== 'undefined') {
       window.addEventListener('click', (e) => {
         const item = e.target.closest('.VPSidebarItem');
         if (item) {
           console.log("Sidebar Item Classes:", Array.from(item.classList));
         }
       });
    }
  }
}
