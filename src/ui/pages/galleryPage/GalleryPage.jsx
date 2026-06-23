import { useState } from 'react'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from '../../../core/serivces/config.jsx'
import NFTGallery from '../../components/gallery/NFTGallery.jsx'
import NFTModal from '../../components/gallery/NFTModal.jsx'
import MainLayout from "../../components/mainLayout/MainLayout.jsx"

const queryClient = new QueryClient()

function GalleryContent() {
    const [selectedTokenId, setSelectedTokenId] = useState(null)
    const [notification, setNotification] = useState(null)

    const showNotification = (type, text) => {
        setNotification({ type, text })
        setTimeout(() => setNotification(null), 5000)
    }

    const handleAction = (action, data) => {
        // Модальное окно само вызовет нужную функцию через onAction
        // Здесь можно добавить логику после успешной транзакции
        console.log('Action from modal:', action, data)
    }

    return (
        <MainLayout>
            {/* Уведомления */}
            {notification && (
                <div style={{
                    position: 'fixed',
                    top: '80px',
                    right: '20px',
                    zIndex: 9999,
                    padding: '16px 24px',
                    borderRadius: '12px',
                    background: notification.type === 'success' ? '#16a34a' :
                        notification.type === 'error' ? '#dc2626' : '#3b82f6',
                    color: 'white',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                    maxWidth: '400px'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{notification.text}</span>
                        <button
                            onClick={() => setNotification(null)}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'white',
                                cursor: 'pointer',
                                marginLeft: '12px',
                                fontSize: '18px'
                            }}
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}

            <main className="py-4">
                <NFTGallery onSelectNFT={setSelectedTokenId} />
            </main>

            {selectedTokenId && (
                <NFTModal
                    tokenId={selectedTokenId}
                    onClose={() => setSelectedTokenId(null)}
                    onAction={handleAction}
                />
            )}
        </MainLayout>
    )
}

export default function GalleryPage() {
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <GalleryContent />
            </QueryClientProvider>
        </WagmiProvider>
    )
}