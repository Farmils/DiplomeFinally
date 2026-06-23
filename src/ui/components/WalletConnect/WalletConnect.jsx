import { useState } from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { injected, walletConnect } from 'wagmi/connectors'
import { Button, Modal } from 'react-bootstrap'

const WC_PROJECT_ID = '04f7abb1a1a54b95664341383c6deae5'

export default function WalletConnect() {
    const { address, isConnected } = useAccount()
    const { connect } = useConnect()
    const { disconnect } = useDisconnect()
    const [showModal, setShowModal] = useState(false)

    const handleConnectMetaMask = async () => {
        setShowModal(false)
        try {
            await connect({ connector: injected() })
        } catch (err) {
            console.error('MetaMask error:', err)
        }
    }

    const handleConnectWalletConnect = async () => {
        setShowModal(false)
        try {
            await connect({
                connector: walletConnect({
                    projectId: WC_PROJECT_ID,
                    showQrModal: true,
                })
            })
        } catch (err) {
            console.error('WC error:', err)
        }
    }

    const formatAddress = (addr) => {
        if (!addr) return ''
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`
    }

    if (isConnected) {
        return (
            <div className="d-flex align-items-center gap-2">
                <Button variant="light" style={{ borderRadius: '12px' }}>
                    <span style={{ color: '#22c55e', marginRight: '8px' }}>●</span>
                    {formatAddress(address)}
                </Button>
                <Button variant="outline-danger" size="sm" onClick={() => disconnect()}>
                    Откл
                </Button>
            </div>
        )
    }

    return (
        <>
            <Button
                onClick={() => setShowModal(true)}
                style={{
                    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                    border: 'none',
                    borderRadius: '12px',
                    fontWeight: '600',
                    padding: '10px 24px'
                }}
            >
                🔗 Подключить кошелек
            </Button>

            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Выберите способ</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="d-grid gap-3">
                        <Button
                            variant="outline-dark"
                            size="lg"
                            onClick={handleConnectMetaMask}
                            style={{ borderRadius: '12px', padding: '16px' }}
                        >
                            🦊 MetaMask
                        </Button>
                        <Button
                            variant="outline-primary"
                            size="lg"
                            onClick={handleConnectWalletConnect}
                            style={{ borderRadius: '12px', padding: '16px' }}
                        >
                            📱 WalletConnect (QR)
                        </Button>
                    </div>
                </Modal.Body>
            </Modal>
        </>
    )
}