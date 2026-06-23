import { useState, useEffect } from 'react'
import { createPublicClient, http } from 'viem'
import { sepolia } from 'viem/chains'
import { CONTRACTS } from '../../../core/serivces/config.jsx'
import { formatEther } from 'viem'

const tokenURIABI = [{
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'tokenURI',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
}]

export default function NFTCard({ tokenId, onClick, isListed, price }) {
    const [metadata, setMetadata] = useState(null)
    const [imageUrl, setImageUrl] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [imgError, setImgError] = useState(false)
    const [listing, setListing] = useState(null)

    useEffect(() => {
        loadMetadata()
        if (!isListed) {
            checkListing()
        } else if (price) {
            setListing({ price })
        }
    }, [tokenId])

    const loadMetadata = async () => {
        try {
            const publicClient = createPublicClient({
                chain: sepolia,
                transport: http('https://ethereum-sepolia.publicnode.com'),
            })

            const tokenURI = await publicClient.readContract({
                address: CONTRACTS.NFT,
                abi: tokenURIABI,
                functionName: 'tokenURI',
                args: [BigInt(tokenId)],
            })

            if (tokenURI) {
                let httpUrl = tokenURI
                if (httpUrl.startsWith('ipfs://')) {
                    httpUrl = 'https://ipfs.io/ipfs/' + httpUrl.slice(7)
                }

                const response = await fetch(httpUrl)
                const data = await response.json()

                if (data.image) {
                    let img = data.image
                    if (img.startsWith('ipfs://')) {
                        img = 'https://ipfs.io/ipfs/' + img.slice(7)
                    }
                    setImageUrl(img)
                }
                setMetadata(data)
            }
        } catch (error) {
            console.log(`NFT #${tokenId}:`, error.message)
        } finally {
            setIsLoading(false)
        }
    }

    const checkListing = async () => {
        try {
            const { readContract } = await import('@wagmi/core')
            const { config } = await import('../../../core/serivces/config.jsx')

            const listingData = await readContract(config, {
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
                setListing({ price: listingData[1] })
            }
        } catch (err) {
            // Не в листинге
        }
    }

    if (isLoading) {
        return (
            <div style={{
                background: 'white',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                height: '320px'
            }}>
                <div style={{
                    height: '240px',
                    background: '#f3f4f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <div style={{
                        width: '32px',
                        height: '32px',
                        border: '3px solid #3b82f6',
                        borderTopColor: 'transparent',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                    }} />
                </div>
                <div style={{ padding: '12px' }}>
                    <div style={{ height: '16px', background: '#f3f4f6', borderRadius: '4px', width: '80%' }} />
                </div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        )
    }

    return (
        <div
            onClick={() => onClick?.(tokenId)}
            style={{
                background: 'white',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                border: '1px solid #f0f0f0',
                height: '340px',
                display: 'flex',
                flexDirection: 'column'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.15)'
                e.currentTarget.style.borderColor = '#dbeafe'
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'
                e.currentTarget.style.borderColor = '#f0f0f0'
            }}
        >
            {/* Контейнер картинки */}
            <div style={{
                height: '240px',
                background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px',
                overflow: 'hidden'
            }}>
                {imageUrl && !imgError ? (
                    <img
                        src={imageUrl}
                        alt={metadata?.name || `NFT #${tokenId}`}
                        style={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            width: 'auto',
                            height: 'auto',
                            objectFit: 'contain',
                            borderRadius: '8px',
                            transition: 'transform 0.5s ease'
                        }}
                        onError={() => setImgError(true)}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.05)'
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)'
                        }}
                    />
                ) : (
                    <div style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: '48px', display: 'block', marginBottom: '8px' }}>🖼️</span>
                        <span style={{ color: '#94a3b8', fontSize: '12px' }}>NFT #{tokenId}</span>
                    </div>
                )}

                {/* Бейдж номера */}
                <div style={{
                    position: 'absolute',
                    top: '8px',
                    left: '8px',
                    background: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(4px)',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: '600'
                }}>
                    #{tokenId}
                </div>

                {/* Бейдж продажи */}
                {listing && (
                    <div style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        background: '#22c55e',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '700',
                        boxShadow: '0 2px 8px rgba(34,197,94,0.3)',
                        animation: 'pulse 2s infinite'
                    }}>
                        SALE
                    </div>
                )}

                {/* Оверлей при наведении */}
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0,0,0,0)',
                    transition: 'background 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
                     className="overlay"
                >
                    <span style={{
                        color: 'white',
                        opacity: 0,
                        transition: 'opacity 0.3s ease',
                        background: 'rgba(255,255,255,0.2)',
                        backdropFilter: 'blur(8px)',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: '600'
                    }}
                          className="overlay-text"
                    >
                        Открыть →
                    </span>
                </div>
            </div>

            {/* Информация */}
            <div style={{
                padding: '12px 16px',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
            }}>
                <h3 style={{
                    fontWeight: '600',
                    fontSize: '14px',
                    color: '#1e293b',
                    margin: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                }}>
                    {metadata?.name || `NFT #${tokenId}`}
                </h3>

                {listing ? (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: '8px',
                        background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                        padding: '8px 10px',
                        borderRadius: '8px'
                    }}>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>Цена</span>
                        <span style={{
                            fontSize: '14px',
                            fontWeight: '700',
                            color: '#16a34a'
                        }}>
                            {Number(formatEther(listing.price)).toFixed(4)} ETH
                        </span>
                    </div>
                ) : (
                    <p style={{
                        fontSize: '11px',
                        color: '#94a3b8',
                        margin: '8px 0 0 0',
                        textAlign: 'center'
                    }}>
                        Не продается
                    </p>
                )}
            </div>

            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.7; }
                }
                .overlay:hover {
                    background: rgba(0,0,0,0.2) !important;
                }
                .overlay:hover .overlay-text {
                    opacity: 1 !important;
                }
            `}</style>
        </div>
    )
}