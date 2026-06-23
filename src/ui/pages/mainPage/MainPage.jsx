import { Container, Row, Col, Button, Card, Badge } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import MainLayout from "../../components/mainLayout/MainLayout.jsx"
import { CONTRACTS } from '../../../core/serivces/config.jsx'

const MainPage = () => {
    const navigate = useNavigate()

    const features = [
        {
            icon: '🛡️',
            title: 'Безопасность',
            text: 'Все транзакции защищены смарт-контрактами и проходят аудит безопасности'
        },
        {
            icon: '⚡',
            title: 'Быстрота',
            text: 'Мгновенные транзакции в сети Sepolia с минимальными комиссиями'
        },
        {
            icon: '🎨',
            title: 'Уникальность',
            text: 'Каждый NFT - уникальный цифровой актив, подтвержденный блокчейном'
        },
        {
            icon: '💰',
            title: 'Выгода',
            text: 'Покупайте и продавайте NFT по лучшим ценам с комиссией всего 2%'
        },
        {
            icon: '🌐',
            title: 'Децентрализация',
            text: 'Полностью децентрализованный маркетплейс без посредников'
        },
        {
            icon: '📱',
            title: 'Доступность',
            text: 'Работает на всех устройствах, нужен только кошелек MetaMask'
        }
    ]

    const stats = [
        { number: '50+', label: 'Пользователей' },
        { number: '2%', label: 'Комиссия' },
        { number: '24/7', label: 'Работает' }
    ]

    const steps = [
        {
            number: '1',
            title: 'Подключите кошелек',
            text: 'Подключите MetaMask к сети Sepolia Testnet и пополните баланс тестовыми токенами',
            color: '#dbeafe'
        },
        {
            number: '2',
            title: 'Выберите NFT',
            text: 'Просмотрите галерею уникальных NFT и выберите понравившийся актив',
            color: '#d1fae5'
        },
        {
            number: '3',
            title: 'Купите или продайте',
            text: 'Совершайте сделки мгновенно и безопасно через смарт-контракт маркетплейса',
            color: '#fef3c7'
        }
    ]

    return (
        <MainLayout>
            {/* Hero секция */}
            <div style={{
                background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #8b5cf6 100%)',
                padding: '80px 0 100px',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Декоративные элементы */}
                <div style={{
                    position: 'absolute',
                    top: '-50px',
                    right: '-50px',
                    width: '300px',
                    height: '300px',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '50%'
                }} />
                <div style={{
                    position: 'absolute',
                    bottom: '-80px',
                    left: '-30px',
                    width: '250px',
                    height: '250px',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '50%'
                }} />

                <Container>
                    <Row className="align-items-center">
                        <Col lg={6} className="text-white mb-5 mb-lg-0">
                            <Badge
                                bg="warning"
                                text="dark"
                                className="mb-3 px-3 py-2"
                                style={{ fontSize: '14px', fontWeight: '600' }}
                            >
                                🚀 Запуск на Sepolia Testnet
                            </Badge>
                            <h1 style={{
                                fontSize: '52px',
                                fontWeight: '800',
                                lineHeight: '1.1',
                                marginBottom: '24px',
                                letterSpacing: '-1px'
                            }}>
                                NFT Marketplace
                                <br />
                                <span style={{
                                    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    fontWeight: '900'
                                }}>
                                    Нового Поколения
                                </span>
                            </h1>
                            <p style={{
                                fontSize: '18px',
                                opacity: '0.9',
                                marginBottom: '36px',
                                lineHeight: '1.7',
                                color: '#e2e8f0'
                            }}>
                                Покупайте, продавайте и создавайте уникальные цифровые активы
                                на первом децентрализованном маркетплейсе в сети Sepolia
                            </p>
                            <div className="d-flex gap-3 flex-wrap">
                                <Button
                                    size="lg"
                                    variant="light"
                                    onClick={() => navigate('/gallery')}
                                    style={{
                                        fontWeight: '700',
                                        padding: '14px 36px',
                                        borderRadius: '14px',
                                        fontSize: '16px',
                                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                                    }}
                                >
                                    🛒 Начать покупки
                                </Button>
                                <Button
                                    size="lg"
                                    variant="outline-light"
                                    onClick={() => navigate('/profile')}
                                    style={{
                                        fontWeight: '600',
                                        padding: '14px 36px',
                                        borderRadius: '14px',
                                        borderWidth: '2px',
                                        fontSize: '16px'
                                    }}
                                >
                                    👤 Личный кабинет
                                </Button>
                            </div>
                        </Col>
                        <Col lg={6} className="text-center">
                            <div style={{
                                background: 'rgba(255,255,255,0.08)',
                                borderRadius: '24px',
                                padding: '40px',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255,255,255,0.1)'
                            }}>
                                <span style={{ fontSize: '140px', display: 'block', marginBottom: '16px' }}>🎨</span>
                                <p style={{
                                    color: 'white',
                                    fontSize: '22px',
                                    fontWeight: '700',
                                    margin: 0
                                }}>
                                    Ваша коллекция начинается здесь
                                </p>
                                <p style={{ color: '#e2e8f0', fontSize: '14px', marginTop: '8px' }}>
                                    Присоединяйтесь к тысячам пользователей
                                </p>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </div>

            {/* Статистика */}
            <Container style={{ marginTop: '-40px', position: 'relative', zIndex: 2 }}>
                <Row>
                    {stats.map((stat, index) => (
                        <Col key={index} xs={6} md={3} className="mb-3">
                            <Card
                                className="text-center h-100 border-0 shadow"
                                style={{ borderRadius: '16px' }}
                            >
                                <Card.Body className="py-4">
                                    <div style={{
                                        fontSize: '34px',
                                        fontWeight: '800',
                                        background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        marginBottom: '8px'
                                    }}>
                                        {stat.number}
                                    </div>
                                    <div style={{ color: '#64748b', fontSize: '14px', fontWeight: '500' }}>
                                        {stat.label}
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </Container>

            {/* Как это работает */}
            <Container className="mb-5" style={{ marginTop: '60px' }}>
                <div className="text-center mb-5">
                    <h2 style={{ fontWeight: '800', color: '#1e293b', marginBottom: '12px' }}>
                        Как это работает?
                    </h2>
                    <p style={{ color: '#64748b', fontSize: '16px' }}>
                        Три простых шага для начала работы с NFT
                    </p>
                </div>
                <Row className="g-4">
                    {steps.map((step, index) => (
                        <Col key={index} md={4}>
                            <Card className="h-100 border-0 shadow-sm" style={{ borderRadius: '20px' }}>
                                <Card.Body className="text-center p-4">
                                    <div style={{
                                        width: '80px',
                                        height: '80px',
                                        background: step.color,
                                        borderRadius: '20px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        margin: '0 auto 24px',
                                        fontSize: '36px',
                                        fontWeight: '800',
                                        color: '#1e293b'
                                    }}>
                                        {step.number}
                                    </div>
                                    <h5 style={{ fontWeight: '700', marginBottom: '12px', fontSize: '18px' }}>
                                        {step.title}
                                    </h5>
                                    <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
                                        {step.text}
                                    </p>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </Container>

            {/* Почему мы */}
            <div style={{ background: '#f8fafc', padding: '80px 0' }}>
                <Container>
                    <div className="text-center mb-5">
                        <h2 style={{ fontWeight: '800', color: '#1e293b', marginBottom: '12px' }}>
                            Почему выбирают нас?
                        </h2>
                        <p style={{ color: '#64748b', fontSize: '16px' }}>
                            Преимущества нашего маркетплейса
                        </p>
                    </div>
                    <Row className="g-4">
                        {features.map((feature, index) => (
                            <Col key={index} md={4} sm={6}>
                                <Card
                                    className="h-100 border-0 shadow-sm"
                                    style={{ borderRadius: '20px' }}
                                >
                                    <Card.Body className="p-4">
                                        <div style={{
                                            fontSize: '48px',
                                            marginBottom: '20px',
                                            width: '70px',
                                            height: '70px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            background: '#f1f5f9',
                                            borderRadius: '16px'
                                        }}>
                                            {feature.icon}
                                        </div>
                                        <h5 style={{ fontWeight: '700', marginBottom: '10px' }}>
                                            {feature.title}
                                        </h5>
                                        <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
                                            {feature.text}
                                        </p>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </Container>
            </div>

            {/* О проекте */}
            <Container style={{ padding: '80px 0' }}>
                <Row className="align-items-center">
                    <Col lg={6} className="mb-5 mb-lg-0">
                        <h2 style={{
                            fontWeight: '800',
                            color: '#1e293b',
                            marginBottom: '24px',
                            fontSize: '36px'
                        }}>
                            О проекте
                        </h2>
                        <p style={{
                            color: '#64748b',
                            fontSize: '16px',
                            lineHeight: '1.8',
                            marginBottom: '20px'
                        }}>
                            NFT Marketplace - это децентрализованная платформа для торговли
                            уникальными цифровыми активами на блокчейне Sepolia.
                        </p>
                        <p style={{
                            color: '#64748b',
                            fontSize: '16px',
                            lineHeight: '1.8',
                            marginBottom: '24px'
                        }}>
                            Поддержка ERC-721 и ERC-20 стандартов обеспечивает максимальную
                            совместимость с экосистемой Ethereum.
                        </p>
                        <div className="d-flex gap-2 flex-wrap">
                            <Badge bg="primary" className="px-3 py-2">ERC-721</Badge>
                            <Badge bg="success" className="px-3 py-2">ERC-20</Badge>
                            <Badge bg="info" className="px-3 py-2">ERC-2981</Badge>
                            <Badge bg="warning" text="dark" className="px-3 py-2">Sepolia</Badge>
                        </div>
                    </Col>
                    <Col lg={6}>
                        <Card className="border-0 shadow" style={{ borderRadius: '20px' }}>
                            <Card.Body className="p-4">
                                <h5 style={{ fontWeight: '700', marginBottom: '20px' }}>
                                    📋 Контракты в сети Sepolia
                                </h5>
                                <div style={{
                                    background: '#f8fafc',
                                    padding: '16px',
                                    borderRadius: '12px',
                                    marginBottom: '16px'
                                }}>
                                    <small style={{ color: '#64748b', fontWeight: '600' }}>
                                        NFT Контракт:
                                    </small>
                                    <div style={{
                                        fontSize: '13px',
                                        fontFamily: 'monospace',
                                        wordBreak: 'break-all',
                                        color: '#3b82f6',
                                        marginTop: '4px'
                                    }}>
                                        {CONTRACTS.NFT}
                                    </div>
                                </div>
                                <div style={{
                                    background: '#f8fafc',
                                    padding: '16px',
                                    borderRadius: '12px'
                                }}>
                                    <small style={{ color: '#64748b', fontWeight: '600' }}>
                                        Marketplace Контракт:
                                    </small>
                                    <div style={{
                                        fontSize: '13px',
                                        fontFamily: 'monospace',
                                        wordBreak: 'break-all',
                                        color: '#3b82f6',
                                        marginTop: '4px'
                                    }}>
                                        {CONTRACTS.MARKETPLACE}
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>

            {/* Призыв к действию */}
            <div style={{
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                padding: '80px 0',
                textAlign: 'center',
                color: 'white'
            }}>
                <Container>
                    <h2 style={{
                        fontWeight: '800',
                        marginBottom: '16px',
                        fontSize: '40px'
                    }}>
                        Готовы начать?
                    </h2>
                    <p style={{
                        fontSize: '18px',
                        opacity: '0.9',
                        marginBottom: '36px',
                        color: '#e2e8f0'
                    }}>
                        Присоединяйтесь к нашему маркетплейсу и начните торговать NFT уже сегодня
                    </p>
                    <div className="d-flex justify-content-center gap-3 flex-wrap">
                        <Button
                            size="lg"
                            variant="light"
                            onClick={() => navigate('/gallery')}
                            style={{
                                fontWeight: '700',
                                padding: '14px 40px',
                                borderRadius: '14px',
                                fontSize: '16px',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                            }}
                        >
                            🎨 Перейти в галерею
                        </Button>
                        <Button
                            size="lg"
                            variant="outline-light"
                            onClick={() => navigate('/profile')}
                            style={{
                                fontWeight: '600',
                                padding: '14px 40px',
                                borderRadius: '14px',
                                borderWidth: '2px',
                                fontSize: '16px'
                            }}
                        >
                            👤 Мой кабинет
                        </Button>
                    </div>
                </Container>
            </div>
        </MainLayout>
    )
}

export default MainPage