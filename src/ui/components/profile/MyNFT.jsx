import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { createPublicClient, http } from 'viem'
import { sepolia } from 'viem/chains'
import NFTCard from '../gallery/NFTCard.jsx'
import ProfileNFTModal from './ProfileNFTModal.jsx'
import { useListNFT, useCancelListing } from '../../../core/serivces/hooks/useMarketplace.js'
import { useNFTApproval } from '../../../core/serivces/hooks/useApprovals.js'
import { CONTRACTS } from '../../../core/serivces/config.jsx'
import { Container, Button, Card, Spinner } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'

const RPC_URL = 'https://ethereum-sepolia.publicnode.com'

export default function MyNFTs() {
    const { address, isConnected } = useAccount()
    const navigate = useNavigate()
    const [myNFTs, setMyNFTs] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedNFT, setSelectedNFT] = useState(null)

    const {
        listNFT,
        isPending: isListingPending,
        isConfirming: isListingConfirming,
    } = useListNFT()

    const {
        cancelListing,
        isPending: isCancellingPending,
        isConfirming: isCancellingConfirming,
    } = useCancelListing()

    const { approveSingle, approveAll, checkApproval } = useNFTApproval()

    useEffect(() => {
        if (address) {
            loadMyNFTs()
        } else {
            setMyNFTs([])
            setIsLoading(false)
        }
    }, [address])

    const loadMyNFTs = async () => {
        if (!address) return

        setIsLoading(true)
        console.log('🔍 Ищем NFT для:', address)

        try {
            const publicClient = createPublicClient({
                chain: sepolia,
                transport: http(RPC_URL),
            })

            const myTokens = []
            let notFoundCount = 0
            const maxNotFound = 10 // Останавливаемся после 10 несуществующих подряд

            for (let id = 1; id <= 1000; id++) {
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

                    // Проверяем что токен существует и принадлежит нам
                    if (owner &&
                        owner !== '0x0000000000000000000000000000000000000000' &&
                        owner.toLowerCase() === address.toLowerCase()) {
                        myTokens.push(id)
                        notFoundCount = 0 // Сбрасываем счетчик
                        console.log(`✅ NFT #${id} - ваш!`)
                    } else if (owner && owner !== '0x0000000000000000000000000000000000000000') {
                        // Токен существует, но принадлежит другому
                        notFoundCount = 0 // Сбрасываем, т.к. токен существует
                        console.log(`ℹ️ NFT #${id} - владелец: ${owner.slice(0, 6)}...`)
                    } else {
                        notFoundCount++
                    }

                    // Останавливаем если много несуществующих подряд
                    if (notFoundCount >= maxNotFound) {
                        console.log(`⏹️ Остановка: ${maxNotFound} несуществующих подряд`)
                        break
                    }
                } catch (err) {
                    notFoundCount++
                    console.log(`❌ NFT #${id} - ошибка`)
                    if (notFoundCount >= maxNotFound) break
                }
            }

            console.log(`📊 Найдено ваших NFT: ${myTokens.length}`, myTokens)
            setMyNFTs(myTokens)
        } catch (err) {
            console.error('Ошибка загрузки:', err)
        } finally {
            setIsLoading(false)
        }
    }

    const handleAction = async (action, data) => {
        try {
            if (action === 'list') {
                await listNFT(data.tokenId, data.price, data.paymentToken)
            } else if (action === 'cancel') {
                await cancelListing(data.tokenId)
            }
        } catch (error) {
            console.error('Ошибка:', error)
            throw error
        }
    }

    const isProcessing = isListingPending || isListingConfirming ||
        isCancellingPending || isCancellingConfirming

    if (!isConnected) {
        return (
            <Container className="py-5">
                <Card className="text-center border-0 shadow-sm" style={{ borderRadius: '20px' }}>
                    <Card.Body className="py-5">
                        <span style={{ fontSize: '64px' }}>🔐</span>
                        <h4 className="mt-3 mb-2">Подключите кошелек</h4>
                        <p className="text-muted">Для просмотра NFT подключите MetaMask</p>
                    </Card.Body>
                </Card>
            </Container>
        )
    }

    if (isLoading) {
        return (
            <Container className="py-5">
                <div className="text-center py-5">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-3 text-muted">Загрузка NFT...</p>
                </div>
            </Container>
        )
    }

    return (
        <Container className="py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h3 className="fw-bold mb-1">🎨 Мои NFT</h3>
                    <p className="text-muted mb-0">{myNFTs.length} NFT</p>
                </div>
                <div className="d-flex gap-2">
                    <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={approveAll}
                        style={{ borderRadius: '10px' }}
                    >
                        ✅ Approve All
                    </Button>
                    <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => navigate('/gallery')}
                        style={{ borderRadius: '10px' }}
                    >
                        🛒 Маркетплейс
                    </Button>
                </div>
            </div>

            {myNFTs.length > 0 ? (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                    gap: '16px'
                }}>
                    {myNFTs.map(tokenId => (
                        <NFTCard
                            key={tokenId}
                            tokenId={tokenId}
                            onClick={() => setSelectedNFT(tokenId)}
                        />
                    ))}
                </div>
            ) : (
                <Card className="text-center border-0 shadow-sm" style={{ borderRadius: '16px' }}>
                    <Card.Body className="py-5">
                        <span style={{ fontSize: '48px' }}>😢</span>
                        <h5 className="mt-3 mb-2">Нет NFT</h5>
                        <p className="text-muted mb-3">Купите или заминтите NFT</p>
                        <div className="d-flex gap-2 justify-content-center">
                            <Button
                                onClick={() => navigate('/gallery')}
                                style={{
                                    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                                    border: 'none',
                                    borderRadius: '10px',
                                }}
                            >
                                🛒 Маркетплейс
                            </Button>
                            <Button
                                variant="outline-secondary"
                                onClick={loadMyNFTs}
                                style={{ borderRadius: '10px' }}
                            >
                                🔄 Обновить
                            </Button>
                        </div>
                    </Card.Body>
                </Card>
            )}

            {isProcessing && (
                <div style={{
                    position: 'fixed',
                    bottom: '20px',
                    right: '20px',
                    background: '#1e293b',
                    color: 'white',
                    padding: '16px 20px',
                    borderRadius: '12px',
                    zIndex: 999,
                }}>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Транзакция...
                </div>
            )}

            {selectedNFT && (
                <ProfileNFTModal
                    tokenId={selectedNFT}
                    onClose={() => setSelectedNFT(null)}
                    onAction={handleAction}
                    isSubmitting={isProcessing}
                />
            )}
        </Container>
    )
}