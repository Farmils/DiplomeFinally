import { useState, useEffect } from 'react'
import { createPublicClient, http } from 'viem'
import { sepolia } from 'viem/chains'
import NFTCard from './NFTCard.jsx'
import { CONTRACTS } from '../../../core/serivces/config.jsx'

export default function NFTGallery({ onSelectNFT }) {
    const [listedNFTs, setListedNFTs] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)
    const [searchId, setSearchId] = useState('')

    useEffect(() => {
        loadListedNFTs()
    }, [])

    const loadListedNFTs = async () => {
        setIsLoading(true)
        setError(null)

        try {
            // Сначала получаем все существующие NFT
            const publicClient = createPublicClient({
                chain: sepolia,
                transport: http('https://ethereum-sepolia.publicnode.com'),
            })

            const allTokenIds = []

            for (let id = 1; id <= 20; id++) {
                try {
                    const owner = await publicClient.readContract({
                        address: CONTRACTS.NFT,
                        abi: [{
                            inputs: [{ name: 'tokenId', type: 'uint256' }],
                            name: 'ownerOf',
                            outputs: [{ name: '', type: 'address' }],
                            stateMutability: 'view',
                            type: 'function',
                        }],
                        functionName: 'ownerOf',
                        args: [BigInt(id)],
                    })

                    if (owner && owner !== '0x0000000000000000000000000000000000000000') {
                        allTokenIds.push(id)
                    }
                } catch (err) {
                    break
                }
            }

            // Теперь проверяем, какие из них в листинге на маркетплейсе
            const listed = []

            for (const tokenId of allTokenIds) {
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
                        listed.push({
                            tokenId,
                            price: listingData[1],
                            paymentToken: listingData[0]
                        })
                    }
                } catch (err) {
                    // Не в листинге - пропускаем
                }
            }

            setListedNFTs(listed)
        } catch (err) {
            console.error('Ошибка:', err)
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    if (isLoading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '400px'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        border: '4px solid #3b82f6',
                        borderTopColor: 'transparent',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 16px'
                    }} />
                    <p style={{ color: '#64748b', fontSize: '16px' }}>Загрузка маркетплейса...</p>
                </div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        )
    }

    if (error) {
        return (
            <div style={{ textAlign: 'center', padding: '80px 20px' }}>
                <p style={{ color: '#ef4444', marginBottom: '16px' }}>Ошибка: {error}</p>
                <button
                    onClick={loadListedNFTs}
                    style={{
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        padding: '10px 24px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '500'
                    }}
                >
                    Попробовать снова
                </button>
            </div>
        )
    }

    const filtered = searchId
        ? listedNFTs.filter(nft => nft.tokenId.toString() === searchId.toString())
        : listedNFTs

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 16px' }}>
            {/* Заголовок */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
                flexWrap: 'wrap',
                gap: '12px'
            }}>
                <div>
                    <h2 style={{ fontSize: '28px', fontWeight: '700', margin: '0 0 4px 0', color: '#1e293b' }}>
                        🛒 NFT Маркетплейс
                    </h2>
                    <p style={{ color: '#64748b', margin: 0, fontSize: '14px' }}>
                        {listedNFTs.length} {listedNFTs.length === 1 ? 'NFT' : 'NFTов'} на продаже
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                        type="number"
                        value={searchId}
                        onChange={(e) => setSearchId(e.target.value)}
                        placeholder="Поиск по ID"
                        style={{
                            padding: '10px 14px',
                            border: '1px solid #e2e8f0',
                            borderRadius: '10px',
                            fontSize: '14px',
                            width: '160px',
                            outline: 'none'
                        }}
                    />
                    <button
                        onClick={loadListedNFTs}
                        style={{
                            padding: '10px 16px',
                            background: '#f1f5f9',
                            border: 'none',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            fontSize: '16px'
                        }}
                        title="Обновить"
                    >
                        🔄
                    </button>
                </div>
            </div>

            {/* Сетка */}
            {filtered.length > 0 ? (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                    gap: '20px'
                }}>
                    {filtered.map(nft => (
                        <NFTCard
                            key={nft.tokenId}
                            tokenId={nft.tokenId}
                            onClick={onSelectNFT}
                            isListed={true}
                            price={nft.price}
                        />
                    ))}
                </div>
            ) : (
                <div style={{
                    textAlign: 'center',
                    padding: '80px 20px',
                    background: 'white',
                    borderRadius: '20px',
                    border: '1px solid #f0f0f0'
                }}>
                    <span style={{ fontSize: '56px', display: 'block', marginBottom: '12px' }}>🛒</span>
                    <p style={{ color: '#64748b', fontSize: '16px' }}>
                        {searchId ? 'NFT не найден на маркетплейсе' : 'Нет NFT на продаже'}
                    </p>
                    <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '8px' }}>
                        {searchId ? '' : 'Перейдите в личный кабинет, чтобы выставить NFT на продажу'}
                    </p>
                </div>
            )}
        </div>
    )
}