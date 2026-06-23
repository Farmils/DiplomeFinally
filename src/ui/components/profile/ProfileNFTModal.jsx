import { useState, useEffect } from 'react'
import { createPublicClient, http } from 'viem'
import { sepolia } from 'viem/chains'
import { CONTRACTS } from '../../../core/serivces/config.jsx'
import { useAccount } from 'wagmi'
import { formatEther } from 'viem'

export default function ProfileNFTModal({ tokenId, onClose, onAction, isSubmitting, hasApproval }) {
    const { address } = useAccount()
    const [metadata, setMetadata] = useState(null)
    const [imageUrl, setImageUrl] = useState(null)
    const [owner, setOwner] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [listing, setListing] = useState(null)
    const [sellPrice, setSellPrice] = useState('')
    const [sellToken, setSellToken] = useState('')
    const [message, setMessage] = useState(null)
    const [imgError, setImgError] = useState(false)

    useEffect(() => {
        if (tokenId) loadNFTData()
    }, [tokenId])

    const loadNFTData = async () => {
        setIsLoading(true)
        setMessage(null)

        try {
            const publicClient = createPublicClient({
                chain: sepolia,
                transport: http('https://ethereum-sepolia.publicnode.com'),
            })

            // Загружаем метаданные
            const tokenURI = await publicClient.readContract({
                address: CONTRACTS.NFT,
                abi: [{
                    inputs: [{ name: 'tokenId', type: 'uint256' }],
                    name: 'tokenURI',
                    outputs: [{ name: '', type: 'string' }],
                    stateMutability: 'view',
                    type: 'function',
                }],
                functionName: 'tokenURI',
                args: [BigInt(tokenId)],
            })

            if (tokenURI) {
                let url = tokenURI
                if (url.startsWith('ipfs://')) {
                    url = 'https://ipfs.io/ipfs/' + url.slice(7)
                }

                try {
                    const response = await fetch(url)
                    const data = await response.json()

                    if (data.image) {
                        let imgUrl = data.image
                        if (imgUrl.startsWith('ipfs://')) {
                            imgUrl = 'https://ipfs.io/ipfs/' + imgUrl.slice(7)
                        }
                        setImageUrl(imgUrl)
                    }
                    setMetadata(data)
                } catch (err) {
                    console.log('Metadata fetch error:', err)
                }
            }

            // Загружаем владельца
            const tokenOwner = await publicClient.readContract({
                address: CONTRACTS.NFT,
                abi: [{
                    inputs: [{ name: 'tokenId', type: 'uint256' }],
                    name: 'ownerOf',
                    outputs: [{ name: '', type: 'address' }],
                    stateMutability: 'view',
                    type: 'function',
                }],
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
                }
            } catch (err) {
                // Не в листинге
            }

        } catch (error) {
            console.error('Error loading NFT:', error)
            setMessage({
                type: 'error',
                text: 'Ошибка загрузки данных NFT'
            })
        } finally {
            setIsLoading(false)
        }
    }

    const isOwner = owner?.toLowerCase() === address?.toLowerCase()

    const handleImageError = () => {
        setImgError(true)
    }

    const handleListForSale = async () => {
        // Валидация
        if (!sellPrice || parseFloat(sellPrice) <= 0) {
            setMessage({
                type: 'error',
                text: 'Укажите корректную цену (больше 0)'
            })
            return
        }

        if (!sellToken || !sellToken.startsWith('0x')) {
            setMessage({
                type: 'error',
                text: 'Укажите корректный адрес токена (начинается с 0x)'
            })
            return
        }

        if (sellToken.length !== 42) {
            setMessage({
                type: 'error',
                text: 'Адрес токена должен быть длиной 42 символа'
            })
            return
        }

        setMessage({ type: 'info', text: '⏳ Отправляем транзакцию...' })

        try {
            await onAction('list', {
                tokenId,
                price: sellPrice,
                paymentToken: sellToken
            })
            setMessage({ type: 'success', text: '✅ NFT успешно выставлен на продажу!' })
            setTimeout(() => onClose(), 2000)
        } catch (error) {
            console.error('List error:', error)
            setMessage({
                type: 'error',
                text: `❌ Ошибка: ${error.shortMessage || error.message || 'Неизвестная ошибка'}`
            })
        }
    }

    const handleCancelListing = async () => {
        setMessage({ type: 'info', text: '⏳ Отменяем листинг...' })

        try {
            await onAction('cancel', { tokenId })
            setMessage({ type: 'success', text: '✅ NFT снят с продажи!' })
            setTimeout(() => onClose(), 2000)
        } catch (error) {
            console.error('Cancel error:', error)
            setMessage({
                type: 'error',
                text: `❌ Ошибка: ${error.shortMessage || error.message || 'Неизвестная ошибка'}`
            })
        }
    }

    // Модальное окно загрузки
    if (isLoading) {
        return (
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px'
            }}>
                {/* Затемнение */}
                <div
                    onClick={onClose}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.5)',
                        backdropFilter: 'blur(2px)'
                    }}
                />

                {/* Окно загрузки */}
                <div style={{
                    position: 'relative',
                    background: 'white',
                    borderRadius: '20px',
                    padding: '48px 32px',
                    textAlign: 'center',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                    zIndex: 1
                }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        border: '4px solid #3b82f6',
                        borderTopColor: 'transparent',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 20px'
                    }} />
                    <p style={{
                        color: '#1e293b',
                        fontSize: '16px',
                        fontWeight: '500',
                        margin: 0
                    }}>
                        Загрузка NFT...
                    </p>
                    <p style={{
                        color: '#94a3b8',
                        fontSize: '14px',
                        marginTop: '8px'
                    }}>
                        Token ID: {tokenId}
                    </p>
                </div>

                <style>{`
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        )
    }

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
        }}>
            {/* Затемнение фона */}
            <div
                onClick={onClose}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.6)',
                    backdropFilter: 'blur(3px)'
                }}
            />

            {/* Модальное окно */}
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    position: 'relative',
                    background: 'white',
                    borderRadius: '24px',
                    maxWidth: '520px',
                    width: '100%',
                    maxHeight: '90vh',
                    overflow: 'auto',
                    boxShadow: '0 25px 80px rgba(0, 0, 0, 0.4)',
                    zIndex: 1
                }}
            >
                {/* Кнопка закрытия */}
                <button
                    onClick={onClose}
                    disabled={isSubmitting}
                    style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        zIndex: 10,
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        border: 'none',
                        background: 'rgba(0, 0, 0, 0.05)',
                        color: '#64748b',
                        fontSize: '18px',
                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease',
                        opacity: isSubmitting ? 0.5 : 1
                    }}
                    onMouseEnter={(e) => {
                        if (!isSubmitting) {
                            e.target.style.background = 'rgba(0, 0, 0, 0.1)'
                            e.target.style.color = '#1e293b'
                        }
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.background = 'rgba(0, 0, 0, 0.05)'
                        e.target.style.color = '#64748b'
                    }}
                >
                    ✕
                </button>

                <div style={{ padding: '28px' }}>
                    {/* Изображение NFT */}
                    <div style={{
                        width: '100%',
                        height: '320px',
                        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                        borderRadius: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '24px',
                        overflow: 'hidden',
                        position: 'relative'
                    }}>
                        {imageUrl && !imgError ? (
                            <img
                                src={imageUrl}
                                alt={metadata?.name || `NFT #${tokenId}`}
                                style={{
                                    maxWidth: '90%',
                                    maxHeight: '90%',
                                    objectFit: 'contain',
                                    borderRadius: '12px'
                                }}
                                onError={handleImageError}
                            />
                        ) : (
                            <div style={{ textAlign: 'center' }}>
                                <span style={{ fontSize: '72px', display: 'block', marginBottom: '12px' }}>🖼️</span>
                                <span style={{ color: '#94a3b8', fontSize: '14px' }}>Изображение недоступно</span>
                            </div>
                        )}

                        {/* Бейдж Token ID */}
                        <div style={{
                            position: 'absolute',
                            top: '12px',
                            left: '12px',
                            background: 'rgba(0, 0, 0, 0.6)',
                            backdropFilter: 'blur(8px)',
                            color: 'white',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: '600'
                        }}>
                            #{tokenId}
                        </div>
                    </div>

                    {/* Название и описание */}
                    <h2 style={{
                        fontSize: '22px',
                        fontWeight: '700',
                        color: '#1e293b',
                        marginBottom: '4px'
                    }}>
                        {metadata?.name || `NFT #${tokenId}`}
                    </h2>

                    {metadata?.description && (
                        <p style={{
                            color: '#64748b',
                            fontSize: '14px',
                            lineHeight: '1.6',
                            marginBottom: '20px'
                        }}>
                            {metadata.description}
                        </p>
                    )}

                    {/* Информация о владельце и статусе */}
                    <div style={{
                        background: '#f8fafc',
                        borderRadius: '12px',
                        padding: '16px',
                        marginBottom: '20px'
                    }}>
                        {/* Владелец */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: listing ? '12px' : '0'
                        }}>
                            <span style={{ color: '#64748b', fontSize: '13px' }}>Владелец:</span>
                            <span style={{
                                fontSize: '13px',
                                fontWeight: isOwner ? '700' : '500',
                                color: isOwner ? '#16a34a' : '#1e293b',
                                fontFamily: 'monospace'
                            }}>
                                {owner ? `${owner.slice(0, 6)}...${owner.slice(-4)}` : 'Загрузка...'}
                                {isOwner && ' (Вы)'}
                            </span>
                        </div>

                        {/* Цена (если в листинге) */}
                        {listing && (
                            <div style={{
                                paddingTop: '12px',
                                borderTop: '1px solid #e2e8f0',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <span style={{ color: '#64748b', fontSize: '13px' }}>Цена:</span>
                                <span style={{
                                    fontSize: '20px',
                                    fontWeight: '700',
                                    color: '#16a34a'
                                }}>
                                    {Number(formatEther(listing.price)).toFixed(4)} ETH
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Статус Approval */}
                    {isOwner && !listing && (
                        <div style={{
                            padding: '12px 16px',
                            borderRadius: '10px',
                            marginBottom: '20px',
                            fontSize: '13px',
                            fontWeight: '500',
                            background: hasApproval ? '#f0fdf4' : '#fffbeb',
                            color: hasApproval ? '#166534' : '#92400e',
                            border: `1px solid ${hasApproval ? '#bbf7d0' : '#fde68a'}`,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <span>{hasApproval ? '✅' : '⚠️'}</span>
                            <span>
                                {hasApproval
                                    ? 'Маркетплейс имеет разрешение на использование NFT'
                                    : 'Требуется разрешение (approve) для маркетплейса'}
                            </span>
                        </div>
                    )}

                    {/* Сообщения об ошибках/успехе */}
                    {message && (
                        <div style={{
                            padding: '12px 16px',
                            borderRadius: '10px',
                            marginBottom: '20px',
                            fontSize: '14px',
                            fontWeight: '500',
                            background: message.type === 'success'
                                ? '#f0fdf4'
                                : message.type === 'error'
                                    ? '#fef2f2'
                                    : '#eff6ff',
                            color: message.type === 'success'
                                ? '#166534'
                                : message.type === 'error'
                                    ? '#991b1b'
                                    : '#1e40af',
                            border: `1px solid ${
                                message.type === 'success'
                                    ? '#bbf7d0'
                                    : message.type === 'error'
                                        ? '#fecaca'
                                        : '#bfdbfe'
                            }`
                        }}>
                            {message.text}
                        </div>
                    )}

                    {/* Форма продажи (только для владельца, если не в листинге) */}
                    {isOwner && !listing && (
                        <div style={{
                            background: '#f8fafc',
                            borderRadius: '16px',
                            padding: '20px'
                        }}>
                            <h4 style={{
                                fontSize: '16px',
                                fontWeight: '700',
                                color: '#1e293b',
                                marginBottom: '20px'
                            }}>
                                💰 Выставить на продажу
                            </h4>

                            {/* Поле цены */}
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '8px',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    color: '#374151'
                                }}>
                                    Цена (в ETH)
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="number"
                                        step="0.0001"
                                        min="0.0001"
                                        value={sellPrice}
                                        onChange={(e) => setSellPrice(e.target.value)}
                                        placeholder="0.1"
                                        disabled={isSubmitting}
                                        style={{
                                            width: '100%',
                                            padding: '12px 16px',
                                            border: '2px solid #e2e8f0',
                                            borderRadius: '12px',
                                            fontSize: '16px',
                                            fontWeight: '500',
                                            outline: 'none',
                                            boxSizing: 'border-box',
                                            transition: 'border-color 0.2s ease',
                                            background: isSubmitting ? '#f1f5f9' : 'white'
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                        onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                                    />
                                    <span style={{
                                        position: 'absolute',
                                        right: '16px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        color: '#94a3b8',
                                        fontSize: '14px',
                                        fontWeight: '500'
                                    }}>
                                        ETH
                                    </span>
                                </div>
                            </div>

                            {/* Поле адреса токена */}
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '8px',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    color: '#374151'
                                }}>
                                    Адрес токена для оплаты
                                </label>
                                <input
                                    type="text"
                                    value={sellToken}
                                    onChange={(e) => setSellToken(e.target.value)}
                                    placeholder="0x..."
                                    disabled={isSubmitting}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        border: '2px solid #e2e8f0',
                                        borderRadius: '12px',
                                        fontSize: '14px',
                                        fontFamily: 'monospace',
                                        outline: 'none',
                                        boxSizing: 'border-box',
                                        transition: 'border-color 0.2s ease',
                                        background: isSubmitting ? '#f1f5f9' : 'white'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                                />
                                <p style={{
                                    color: '#94a3b8',
                                    fontSize: '12px',
                                    marginTop: '6px'
                                }}>
                                    Адрес ERC20 токена (например WETH, USDT)
                                </p>
                            </div>

                            {/* Кнопка "Выставить на продажу" */}
                            <button
                                onClick={handleListForSale}
                                disabled={isSubmitting}
                                style={{
                                    width: '100%',
                                    padding: '14px',
                                    background: isSubmitting
                                        ? '#94a3b8'
                                        : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '12px',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.3s ease',
                                    boxShadow: isSubmitting
                                        ? 'none'
                                        : '0 4px 15px rgba(59, 130, 246, 0.3)',
                                    opacity: isSubmitting ? 0.7 : 1
                                }}
                                onMouseEnter={(e) => {
                                    if (!isSubmitting) {
                                        e.target.style.transform = 'translateY(-1px)'
                                        e.target.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.4)'
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.transform = 'translateY(0)'
                                    e.target.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.3)'
                                }}
                            >
                                {isSubmitting ? '⏳ Обработка...' : '💰 Выставить на продажу'}
                            </button>
                        </div>
                    )}

                    {/* Кнопка отмены листинга (для владельца, если в листинге) */}
                    {isOwner && listing && (
                        <button
                            onClick={handleCancelListing}
                            disabled={isSubmitting}
                            style={{
                                width: '100%',
                                padding: '16px',
                                background: isSubmitting ? '#fca5a5' : '#ef4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                fontSize: '16px',
                                fontWeight: '600',
                                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                transition: 'all 0.3s ease',
                                boxShadow: isSubmitting
                                    ? 'none'
                                    : '0 4px 15px rgba(239, 68, 68, 0.3)',
                                opacity: isSubmitting ? 0.7 : 1
                            }}
                            onMouseEnter={(e) => {
                                if (!isSubmitting) {
                                    e.target.style.transform = 'translateY(-1px)'
                                    e.target.style.boxShadow = '0 6px 20px rgba(239, 68, 68, 0.4)'
                                }
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.transform = 'translateY(0)'
                                e.target.style.boxShadow = '0 4px 15px rgba(239, 68, 68, 0.3)'
                            }}
                        >
                            {isSubmitting ? '⏳ Отмена...' : '❌ Снять с продажи'}
                        </button>
                    )}

                    {/* Сообщение для не-владельца */}
                    {!isOwner && (
                        <div style={{
                            textAlign: 'center',
                            padding: '20px',
                            background: '#f8fafc',
                            borderRadius: '12px',
                            color: '#94a3b8',
                            fontSize: '14px'
                        }}>
                            🔒 Вы не являетесь владельцем этого NFT
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}