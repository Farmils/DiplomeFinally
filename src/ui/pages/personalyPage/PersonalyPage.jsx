import MainLayout from "../../components/mainLayout/MainLayout.jsx";
import MyNFTs from "../../components/profile/MyNFT.jsx";
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { useAccount } from 'wagmi';
import { useNavigate } from 'react-router-dom';
import { CONTRACTS } from '../../../core/serivces/config.jsx';

export const PersonalyPage = () => {
    const { address, isConnected } = useAccount();
    const navigate = useNavigate();

    return (
        <MainLayout>
            <div style={{
                minHeight: '80vh',
                background: '#f8fafc',
                paddingTop: '24px',
                paddingBottom: '60px'
            }}>
                <Container>
                    {/* Приветствие и информация о кошельке */}
                    {isConnected && (
                        <Card
                            className="border-0 shadow-sm mb-4"
                            style={{
                                borderRadius: '20px',
                                background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                                color: 'white'
                            }}
                        >
                            <Card.Body className="p-4">
                                <Row className="align-items-center">
                                    <Col xs={12} md={8}>
                                        <h4 style={{ fontWeight: '700', marginBottom: '8px' }}>
                                            👤 Личный кабинет
                                        </h4>
                                        <p style={{
                                            color: '#94a3b8',
                                            fontSize: '14px',
                                            marginBottom: '16px',
                                            fontFamily: 'monospace'
                                        }}>
                                            {address}
                                        </p>
                                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                            {/* Кнопка Создать NFT */}
                                            <Button
                                                onClick={() => navigate('/create')}
                                                style={{
                                                    background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                                                    border: 'none',
                                                    borderRadius: '10px',
                                                    fontWeight: '600',
                                                    padding: '10px 20px',
                                                    fontSize: '14px'
                                                }}
                                            >
                                                🎨 Создать NFT
                                            </Button>

                                            <a
                                                href={`https://sepolia.etherscan.io/address/${address}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{
                                                    background: 'rgba(255,255,255,0.1)',
                                                    color: 'white',
                                                    padding: '8px 16px',
                                                    borderRadius: '10px',
                                                    textDecoration: 'none',
                                                    fontSize: '13px',
                                                    fontWeight: '500'
                                                }}
                                            >
                                                🔍 Etherscan
                                            </a>
                                            <a
                                                href="https://sepoliafaucet.com/"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{
                                                    background: 'rgba(255,255,255,0.1)',
                                                    color: 'white',
                                                    padding: '8px 16px',
                                                    borderRadius: '10px',
                                                    textDecoration: 'none',
                                                    fontSize: '13px',
                                                    fontWeight: '500'
                                                }}
                                            >
                                                💧 Пополнить Sepolia ETH
                                            </a>
                                        </div>
                                    </Col>
                                    <Col xs={12} md={4} className="text-md-end mt-3 mt-md-0">
                                        <div style={{
                                            background: 'rgba(255,255,255,0.1)',
                                            borderRadius: '12px',
                                            padding: '16px',
                                            display: 'inline-block'
                                        }}>
                                            <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                                                Сеть
                                            </div>
                                            <div style={{ fontSize: '18px', fontWeight: '700' }}>
                                                ⛓️ Sepolia
                                            </div>
                                        </div>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    )}
                    {/* Компонент с NFT */}
                    <MyNFTs />
                </Container>
            </div>
        </MainLayout>
    )
}