import React from "react";
import ReactDOM from "react-dom/client";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { config } from "./core/serivces/config.jsx";
import App from "../src/ui/app/App.jsx";
import "bootstrap/dist/css/bootstrap.css";
import "./index.css";

// Проверяем, запущено ли в Electron
const isElectron = typeof window !== 'undefined' && window.electronAPI?.isElectron;

// Создаем клиент для React Query
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: !isElectron,
            retry: 2,
            staleTime: 5000,
        },
    },
});

// Логирование
if (isElectron) {
    console.log('🚀 Запущено в Electron');
    console.log('🖥️ Платформа:', window.electronAPI.platform);
} else {
    console.log('🌐 Запущено в браузере');
}

// Рендерим приложение
ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <App />
            </QueryClientProvider>
        </WagmiProvider>
    </React.StrictMode>,
);

// Глобальная обработка ошибок в Electron
if (isElectron) {
    window.addEventListener('error', (event) => {
        console.error('Ошибка:', event.error?.message || event.message);
    });

    window.addEventListener('unhandledrejection', (event) => {
        console.error('Необработанная ошибка:', event.reason?.message || event.reason);
    });
}