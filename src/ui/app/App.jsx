import { RouterProvider } from "react-router-dom";
import router from "../../core/routes/Router.jsx";
import { ContextProvider } from "../../core/context/Context.jsx";
import { useEffect } from "react";

const App = () => {
  const isElectron = typeof window !== 'undefined' && window.electronAPI?.isElectron;

  useEffect(() => {
    // Скролл для навбара (только в браузере)
    if (!isElectron) {
      const handleScroll = () => {
        const navbar = document.querySelector(".navbar-custom");
        if (navbar) {
          if (window.scrollY > 50) {
            navbar.classList.add("scrolled");
          } else {
            navbar.classList.remove("scrolled");
          }
        }
      };

      window.addEventListener("scroll", handleScroll);
      return () => window.removeEventListener("scroll", handleScroll);
    }
  }, [isElectron]);

  // Приветствие в консоли
  useEffect(() => {
    if (isElectron) {
      console.log('🖥️ NFT Marketplace Desktop v1.0.0');
    }
  }, [isElectron]);

  return (
      <ContextProvider>
        <RouterProvider router={router} />
      </ContextProvider>
  );
};

export default App;