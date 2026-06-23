import { useState, useEffect } from 'react'
import { createPublicClient, http, parseEther, formatEther } from 'viem'
import { sepolia } from 'viem/chains'
import { CONTRACTS } from '../../../core/serivces/config.jsx'
import { useAccount } from 'wagmi'
import { useBuyNFT, useMakeOffer, useListNFT, useCancelListing } from '../../../core/serivces/hooks/useMarketplace'
import { useNFTApproval, useTokenApproval } from '../../../core/serivces/hooks/useApprovals'

const tokenURIABI = [{
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'tokenURI',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
}]

const ownerOfABI = [{
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'ownerOf',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
}]

export default function NFTModal({ tokenId, onClose }) {
    const { address } = useAccount()

    // Хуки маркетплейса
    const { buyNFT, isPending: isBuyPending, isConfirming: isBuyConfirming } = useBuyNFT()
    const { makeOffer, isPending: isOfferPending, isConfirming: isOfferConfirming } = useMakeOffer()
    const { listNFT, isPending: isListPending, isConfirming: isListConfirming } = useListNFT()
    const { cancelListing, isPending: isCancelPending, isConfirming: isCancelConfirming } = useCancelListing()

    // Хуки approval
    const { approveSingle, checkApproval } = useNFTApproval()
    const { approveToken, checkAllowance } = useTokenApproval()

    const [metadata, setMetadata] = useState(null)
    const [imageUrl, setImageUrl] = useState(null)
    const [owner, setOwner] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [listing, setListing] = useState(null)
    const [activeTab, setActiveTab] = useState('info')
    const [sellPrice, setSellPrice] = useState('')
    const [sellToken, setSellToken] = useState('')
    const [offerAmount, setOfferAmount] = useState('')
    const [offerEndTime, setOfferEndTime] = useState('24')
    const [message, setMessage] = useState(null)

    const isProcessing = isBuyPending || isBuyConfirming || isOfferPending ||
        isOfferConfirming || isListPending || isListConfirming ||
        isCancelPending || isCancelConfirming

    useEffect(() => {
        if (tokenId) loadNFTData()
    }, [tokenId])

    const loadNFTData = async () => {
        setIsLoading(true)
        try {
            const publicClient = createPublicClient({
                chain: sepolia,
                transport: http('https://ethereum-sepolia.publicnode.com'),
            })

            // Загружаем метаданные
            const tokenURI = await publicClient.readContract({
                address: CONTRACTS.NFT,
                abi: tokenURIABI,
                functionName: 'tokenURI',
                args: [BigInt(tokenId)],
            })

            if (tokenURI) {
                let url = tokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/')
                try {
                    const response = await fetch(url)
                    const data = await response.json()
                    if (data.image) {
                        setImageUrl(data.image.replace('ipfs://', 'https://ipfs.io/ipfs/'))
                    }
                    setMetadata(data)
                } catch (err) {
                    console.log('Metadata fetch error:', err)
                }
            }

            // Загружаем владельца
            const tokenOwner = await publicClient.readContract({
                address: CONTRACTS.NFT,
                abi: ownerOfABI,
                functionName: 'ownerOf',
                args: [BigInt(tokenId)],
            })
            setOwner(tokenOwner)

            // Проверяем листинг
            try {
                const listingData = await publicClient.readContract({
                    address: CONTRACTS.MARKETPLACE,
                    abi: [{
                        inputs: [
                            { name: 'addressNFT', type: 'address' },
                            { name: 'tokenId', type: 'uint256' }
                        ],
                        name: 'getByAddressAndId',
                        outputs: [
                            { name: 'payableToken', type: 'address' },
                            { name: 'price', type: 'uint256' }
                        ],
                        stateMutability: 'view',
                        type: 'function',
                    }],
                    functionName: 'getByAddressAndId',
                    args: [CONTRACTS.NFT, BigInt(tokenId)],
                })
                if (listingData && listingData[1] > 0n) {
                    setListing({
                        token: listingData[0],
                        price: listingData[1]
                    })
                    console.log('Листинг найден:', {
                        token: listingData[0],
                        price: listingData[1].toString(),
                        priceInEth: formatEther(listingData[1])
                    })
                }
            } catch (err) {
                console.log('Не в листинге')
            }
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const isOwner = owner?.toLowerCase() === address?.toLowerCase()

    // ============ ФУНКЦИЯ ПОКУПКИ ============
    const handleBuy = async () => {
        console.log('=== НАЧАЛО ПОКУПКИ ===')
        console.log('tokenId:', tokenId)
        console.log('listing:', listing)

        if (!listing) {
            setMessage({ type: 'error', text: '❌ NFT не в продаже' })
            return
        }

        const priceInEth = formatEther(listing.price)
        const paymentToken = listing.token

        console.log('Цена:', priceInEth)
        console.log('Токен оплаты:', paymentToken)

        try {
            // Шаг 1: Проверяем allowance токенов у покупателя
            setMessage({ type: 'info', text: '🔍 Проверяем баланс и разрешения...' })

            const { hasAllowance, allowance } = await checkAllowance(paymentToken, priceInEth)
            console.log('Текущий allowance:', allowance?.toString())
            console.log('Нужно:', parseEther(priceInEth).toString())
            console.log('Достаточно:', hasAllowance)

            // Шаг 2: Если allowance недостаточно - делаем approve
            if (!hasAllowance) {
                setMessage({
                    type: 'info',
                    text: '🔐 Необходимо разрешение на использование токенов. Подтвердите в MetaMask...'
                })
                console.log('Выполняем approve токенов...')

                await approveToken(paymentToken, priceInEth)

                setMessage({
                    type: 'info',
                    text: '✅ Разрешение получено! Нажмите "Купить" еще раз для завершения покупки.'
                })
                return
            }

            // Шаг 3: Покупаем NFT
            setMessage({ type: 'info', text: '💰 Отправляем транзакцию покупки. Подтвердите в MetaMask...' })
            console.log('Вызываем buyNFT...')

            const result = await buyNFT(tokenId)
            console.log('✅ Транзакция отправлена:', result)

            setMessage({ type: 'success', text: '🎉 NFT успешно куплен! Проверьте кошелек.' })

            setTimeout(() => {
                setMessage(null)
                onClose()
            }, 2500)

        } catch (error) {
            console.error('❌ Ошибка покупки:', error)

            let errorText = error.shortMessage || error.message || 'Неизвестная ошибка'

            // Понятные сообщения для частых ошибок
            if (errorText.includes('insufficient')) {
                errorText = 'Недостаточно токенов для покупки'
            } else if (errorText.includes('user rejected')) {
                errorText = 'Транзакция отклонена пользователем'
            } else if (errorText.includes('NotApproval')) {
                errorText = 'Продавец не дал разрешение на NFT'
            }

            setMessage({ type: 'error', text: `❌ ${errorText}` })
        }
    }

    // ============ ФУНКЦИЯ ПРОДАЖИ ============
    const handleListForSale = async () => {
        console.log('=== ВЫСТАВЛЕНИЕ НА ПРОДАЖУ ===')

        if (!sellPrice || parseFloat(sellPrice) <= 0) {
            setMessage({ type: 'error', text: '❌ Укажите корректную цену' })
            return
        }
        if (!sellToken || !sellToken.startsWith('0x')) {
            setMessage({ type: 'error', text: '❌ Укажите корректный адрес токена' })
            return
        }

        console.log('Цена:', sellPrice)
        console.log('Токен:', sellToken)

        try {
            // Шаг 1: Проверяем approve NFT
            setMessage({ type: 'info', text: '🔍 Проверяем разрешения NFT...' })

            const approval = await checkApproval(tokenId)
            console.log('NFT approval:', approval)

            if (!approval.isApproved) {
                setMessage({ type: 'info', text: '🔐 Даем разрешение маркетплейсу на NFT...' })
                console.log('Выполняем approve NFT...')
                await approveSingle(tokenId)

                setMessage({ type: 'info', text: '✅ Разрешение получено! Нажмите "Выставить" еще раз.' })
                return
            }

            // Шаг 2: Выставляем на продажу
            setMessage({ type: 'info', text: '💰 Выставляем на продажу...' })
            console.log('Вызываем listNFT...')

            await listNFT(tokenId, sellPrice, sellToken)

            setMessage({ type: 'success', text: '🎉 NFT выставлен на продажу!' })

            setTimeout(() => {
                setMessage(null)
                onClose()
            }, 2500)

        } catch (error) {
            console.error('❌ Ошибка:', error)
            setMessage({
                type: 'error',
                text: `❌ ${error.shortMessage || error.message}`
            })
        }
    }

    // ============ ФУНКЦИЯ ОФФЕРА ============
    const handleMakeOffer = async () => {
        if (!offerAmount || parseFloat(offerAmount) <= 0) {
            setMessage({ type: 'error', text: '❌ Укажите сумму предложения' })
            return
        }

        console.log('=== СОЗДАНИЕ ОФФЕРА ===')
        console.log('Сумма:', offerAmount)
        console.log('Срок (часы):', offerEndTime)

        setMessage({ type: 'info', text: '📨 Создаем предложение...' })

        try {
            await makeOffer(tokenId, offerAmount, offerEndTime)
            setMessage({ type: 'success', text: '✅ Предложение создано!' })
            setTimeout(() => {
                setMessage(null)
                onClose()
            }, 2500)
        } catch (error) {
            console.error('❌ Ошибка:', error)
            setMessage({ type: 'error', text: `❌ ${error.shortMessage || error.message}` })
        }
    }

    // ============ ФУНКЦИЯ ОТМЕНЫ ЛИСТИНГА ============
    const handleCancelListing = async () => {
        console.log('=== ОТМЕНА ЛИСТИНГА ===')
        console.log('tokenId:', tokenId)

        setMessage({ type: 'info', text: '🗑 Отменяем листинг...' })

        try {
            await cancelListing(tokenId)
            setMessage({ type: 'success', text: '✅ NFT снят с продажи!' })
            setTimeout(() => {
                setMessage(null)
                onClose()
            }, 2500)
        } catch (error) {
            console.error('❌ Ошибка:', error)
            setMessage({ type: 'error', text: `❌ ${error.shortMessage || error.message}` })
        }
    }

    // ============ РЕНДЕР ============
    if (isLoading) {
        return (
            <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                zIndex: 9999,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
                <div onClick={onClose} style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)'
                }} />
                <div style={{
                    position: 'relative',
                    background: 'white',
                    borderRadius: '20px',
                    padding: '48px 40px',
                    textAlign: 'center'
                }}>
                    <div style={{
                        width: '48px', height: '48px',
                        border: '4px solid #3b82f6',
                        borderTopColor: 'transparent',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 20px'
                    }} />
                    <p style={{ color: '#64748b', fontSize: '16px' }}>Загрузка NFT...</p>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            </div>
        )
    }

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px'
        }}>
            <div onClick={onClose} style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)'
            }} />

            <div style={{
                position: 'relative',
                background: 'white',
                borderRadius: '20px',
                maxWidth: '800px',
                width: '100%',
                maxHeight: '90vh',
                overflow: 'auto',
                boxShadow: '0 25px 80px rgba(0,0,0,0.4)'
            }}>
                <button onClick={onClose} disabled={isProcessing} style={{
                    position: 'absolute', top: '16px', right: '16px', zIndex: 10,
                    width: '36px', height: '36px', borderRadius: '50%',
                    border: 'none', background: 'rgba(0,0,0,0.05)',
                    color: '#64748b', fontSize: '18px',
                    cursor: isProcessing ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    opacity: isProcessing ? 0.5 : 1
                }}>✕</button>

                <div style={{ display: 'flex', flexWrap: 'wrap', minHeight: '400px' }}>
                    {/* Левая часть - картинка */}
                    <div style={{ flex: '1 1 350px', padding: '28px' }}>
                        <div style={{
                            width: '100%', aspectRatio: '1',
                            borderRadius: '16px', overflow: 'hidden',
                            background: 'linear-gradient(135deg, #f8fafc, #e2e8f0)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            {imageUrl ? (
                                <img src={imageUrl} alt={metadata?.name || `NFT #${tokenId}`}
                                     style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain', borderRadius: '12px' }} />
                            ) : (
                                <span style={{ fontSize: '80px' }}>🖼️</span>
                            )}
                        </div>
                    </div>

                    {/* Правая часть */}
                    <div style={{ flex: '1 1 350px', padding: '28px', borderLeft: '1px solid #f1f5f9' }}>
                        <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 4px 0' }}>
                            Token ID: {tokenId}
                        </p>
                        <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b', margin: '0 0 12px 0' }}>
                            {metadata?.name || `NFT #${tokenId}`}
                        </h2>

                        {metadata?.description && (
                            <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.6', marginBottom: '20px' }}>
                                {metadata.description}
                            </p>
                        )}

                        {/* Сообщение */}
                        {message && (
                            <div style={{
                                padding: '12px 16px', borderRadius: '10px', marginBottom: '16px',
                                fontSize: '14px', fontWeight: '500',
                                background: message.type === 'success' ? '#f0fdf4' :
                                    message.type === 'error' ? '#fef2f2' : '#eff6ff',
                                color: message.type === 'success' ? '#166534' :
                                    message.type === 'error' ? '#991b1b' : '#1e40af',
                                border: `1px solid ${message.type === 'success' ? '#bbf7d0' :
                                    message.type === 'error' ? '#fecaca' : '#bfdbfe'}`
                            }}>
                                {message.text}
                            </div>
                        )}

                        {/* Инфо владельца и цены */}
                        <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: listing ? '12px' : '0' }}>
                                <span style={{ color: '#64748b', fontSize: '13px' }}>Владелец:</span>
                                <span style={{
                                    fontSize: '13px', fontWeight: isOwner ? '700' : '500',
                                    color: isOwner ? '#16a34a' : '#1e293b', fontFamily: 'monospace'
                                }}>
                                    {owner ? `${owner.slice(0,6)}...${owner.slice(-4)}` : '...'}
                                    {isOwner && ' (Вы)'}
                                </span>
                            </div>

                            {listing && (
                                <div style={{ paddingTop: '12px', borderTop: '1px solid #e2e8f0',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: '#64748b', fontSize: '13px' }}>Цена:</span>
                                    <span style={{ fontSize: '22px', fontWeight: '700', color: '#16a34a' }}>
                                        {Number(formatEther(listing.price)).toFixed(4)} Tokens
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Табы */}
                        <div style={{ display: 'flex', borderBottom: '2px solid #f1f5f9', marginBottom: '20px', gap: '4px' }}>
                            <button onClick={() => setActiveTab('info')} disabled={isProcessing} style={{
                                padding: '10px 20px', border: 'none', background: 'none',
                                borderBottom: activeTab === 'info' ? '2px solid #3b82f6' : '2px solid transparent',
                                color: activeTab === 'info' ? '#3b82f6' : '#64748b',
                                cursor: 'pointer', fontSize: '14px', fontWeight: 600
                            }}>ℹ️ Инфо</button>

                            {isOwner && !listing && (
                                <button onClick={() => setActiveTab('sell')} disabled={isProcessing} style={{
                                    padding: '10px 20px', border: 'none', background: 'none',
                                    borderBottom: activeTab === 'sell' ? '2px solid #3b82f6' : '2px solid transparent',
                                    color: activeTab === 'sell' ? '#3b82f6' : '#64748b',
                                    cursor: 'pointer', fontSize: '14px', fontWeight: 600
                                }}>💰 Продать</button>
                            )}

                            {!isOwner && listing && (
                                <button onClick={() => setActiveTab('buy')} disabled={isProcessing} style={{
                                    padding: '10px 20px', border: 'none', background: 'none',
                                    borderBottom: activeTab === 'buy' ? '2px solid #3b82f6' : '2px solid transparent',
                                    color: activeTab === 'buy' ? '#3b82f6' : '#64748b',
                                    cursor: 'pointer', fontSize: '14px', fontWeight: 600
                                }}>🛒 Купить</button>
                            )}
                        </div>

                        {/* Контент табов */}
                        <div style={{ flex: 1 }}>
                            {activeTab === 'info' && isOwner && listing && (
                                <button onClick={handleCancelListing} disabled={isProcessing} style={{
                                    width: '100%', padding: '14px',
                                    background: isProcessing ? '#fca5a5' : '#ef4444',
                                    color: 'white', border: 'none', borderRadius: '12px',
                                    fontSize: '16px', fontWeight: '600',
                                    cursor: isProcessing ? 'not-allowed' : 'pointer'
                                }}>
                                    {isProcessing ? '⏳ Обработка...' : '🗑 Снять с продажи'}
                                </button>
                            )}

                            {activeTab === 'sell' && (
                                <div>
                                    <div style={{ marginBottom: '14px' }}>
                                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#374151' }}>
                                            Цена (в токенах)
                                        </label>
                                        <input type="number" step="0.0001" min="0.0001"
                                               value={sellPrice} onChange={(e) => setSellPrice(e.target.value)}
                                               placeholder="0.1" disabled={isProcessing}
                                               style={{ width: '100%', padding: '12px', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '16px', outline: 'none', boxSizing: 'border-box' }} />
                                    </div>
                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#374151' }}>
                                            Адрес токена для оплаты
                                        </label>
                                        <input type="text"
                                               value={sellToken} onChange={(e) => setSellToken(e.target.value)}
                                               placeholder="0x..." disabled={isProcessing}
                                               style={{ width: '100%', padding: '12px', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box' }} />
                                    </div>
                                    <button onClick={handleListForSale} disabled={isProcessing} style={{
                                        width: '100%', padding: '14px',
                                        background: isProcessing ? '#94a3b8' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                                        color: 'white', border: 'none', borderRadius: '12px',
                                        fontSize: '16px', fontWeight: '600',
                                        cursor: isProcessing ? 'not-allowed' : 'pointer'
                                    }}>
                                        {isProcessing ? '⏳ Обработка...' : '💰 Выставить на продажу'}
                                    </button>
                                </div>
                            )}

                            {activeTab === 'buy' && listing && (
                                <div>
                                    <button onClick={handleBuy} disabled={isProcessing} style={{
                                        width: '100%', padding: '14px',
                                        background: isProcessing ? '#86efac' : '#16a34a',
                                        color: 'white', border: 'none', borderRadius: '12px',
                                        fontSize: '16px', fontWeight: '600',
                                        cursor: isProcessing ? 'not-allowed' : 'pointer',
                                        marginBottom: '16px',
                                        boxShadow: isProcessing ? 'none' : '0 4px 15px rgba(22,163,74,0.3)'
                                    }}>
                                        {isProcessing ? '⏳ Обработка...' : '🛒 Купить сейчас'}
                                    </button>

                                    <div style={{ paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
                                        <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#1e293b' }}>
                                            💎 Сделать предложение
                                        </h4>
                                        <input type="text" value={offerAmount}
                                               onChange={(e) => setOfferAmount(e.target.value)}
                                               placeholder="Сумма" disabled={isProcessing}
                                               style={{ width: '100%', padding: '12px', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none', marginBottom: '10px', boxSizing: 'border-box' }} />
                                        <input type="number" value={offerEndTime}
                                               onChange={(e) => setOfferEndTime(e.target.value)}
                                               placeholder="Срок (часы)" disabled={isProcessing} min="1"
                                               style={{ width: '100%', padding: '12px', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none', marginBottom: '14px', boxSizing: 'border-box' }} />
                                        <button onClick={handleMakeOffer} disabled={isProcessing} style={{
                                            width: '100%', padding: '12px',
                                            background: isProcessing ? '#c4b5fd' : '#7c3aed',
                                            color: 'white', border: 'none', borderRadius: '10px',
                                            fontSize: '14px', fontWeight: '600',
                                            cursor: isProcessing ? 'not-allowed' : 'pointer'
                                        }}>
                                            {isProcessing ? '⏳ Обработка...' : '📨 Сделать предложение'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}