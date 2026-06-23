import { Container, Row, Col, Badge } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { CONTRACTS } from '../../../core/serivces/config.jsx'

const Footer = () => {
  const navigate = useNavigate()
  const currentYear = new Date().getFullYear()

  const footerSections = [
    {
      title: 'Навигация',
      links: [
        { label: '🏠 Главная', path: '/' },
        { label: '🛒 Маркетплейс', path: '/gallery' },
        { label: '👤 Личный кабинет', path: '/profile' }
      ]
    },
    {
      title: 'Ресурсы',
      links: [
        {
          label: '📄 NFT Контракт',
          href: `https://sepolia.etherscan.io/address/${CONTRACTS.NFT}`,
          external: true
        },
        {
          label: '📄 Marketplace Контракт',
          href: `https://sepolia.etherscan.io/address/${CONTRACTS.MARKETPLACE}`,
          external: true
        },
        {
          label: '🔗 Sepolia Faucet',
          href: 'https://sepoliafaucet.com/',
          external: true
        }
      ]
    },
    {
      title: 'Стандарты',
      links: [
        { label: 'ERC-721 (NFT)', href: '#', external: false },
        { label: 'ERC-20 (Tokens)', href: '#', external: false },
        { label: 'ERC-2981 (Royalties)', href: '#', external: false }
      ]
    }
  ]

  const socialLinks = [
    { icon: '🐦', label: 'Twitter', href: '#' },
    { icon: '💬', label: 'Discord', href: '#' },
    { icon: '📢', label: 'Telegram', href: '#' },
    { icon: '📖', label: 'GitHub', href: '#' }
  ]

  return (
      <footer style={{
        background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
        color: 'white',
        paddingTop: '60px'
      }}>
        <Container>
          <Row>
            {/* Бренд и описание */}
            <Col lg={4} className="mb-5">
              <div className="d-flex align-items-center gap-2 mb-3">
                            <span style={{
                              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                              color: 'white',
                              padding: '6px 12px',
                              borderRadius: '10px',
                              fontSize: '20px',
                              fontWeight: '800'
                            }}>
                                NFT
                            </span>
                <span style={{ fontSize: '20px', fontWeight: '700' }}>Marketplace</span>
              </div>
              <p style={{
                color: '#94a3b8',
                fontSize: '14px',
                lineHeight: '1.7',
                marginBottom: '20px'
              }}>
                Децентрализованная платформа для торговли уникальными цифровыми активами
                на блокчейне Sepolia. Безопасные транзакции через смарт-контракты.
              </p>
              <Badge
                  bg="warning"
                  text="dark"
                  style={{
                    fontSize: '12px',
                    padding: '8px 14px',
                    borderRadius: '10px'
                  }}
              >
                ⛓️ Sepolia Testnet
              </Badge>
            </Col>

            {/* Секции с ссылками */}
            {footerSections.map((section, index) => (
                <Col key={index} lg={2} md={4} sm={6} className="mb-4">
                  <h6 style={{
                    fontWeight: '700',
                    marginBottom: '20px',
                    fontSize: '14px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    color: '#cbd5e1'
                  }}>
                    {section.title}
                  </h6>
                  <ul style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    {section.links.map((link, linkIndex) => (
                        <li key={linkIndex}>
                          {link.external ? (
                              <a
                                  href={link.href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    color: '#94a3b8',
                                    textDecoration: 'none',
                                    fontSize: '14px',
                                    transition: 'all 0.2s ease'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.target.style.color = 'white'
                                    e.target.style.paddingLeft = '4px'
                                  }}
                                  onMouseLeave={(e) => {
                                    e.target.style.color = '#94a3b8'
                                    e.target.style.paddingLeft = '0'
                                  }}
                              >
                                {link.label}
                              </a>
                          ) : (
                              <span
                                  onClick={() => link.path && navigate(link.path)}
                                  style={{
                                    color: '#94a3b8',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    transition: 'all 0.2s ease'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.target.style.color = 'white'
                                    e.target.style.paddingLeft = '4px'
                                  }}
                                  onMouseLeave={(e) => {
                                    e.target.style.color = '#94a3b8'
                                    e.target.style.paddingLeft = '0'
                                  }}
                              >
                                                {link.label}
                                            </span>
                          )}
                        </li>
                    ))}
                  </ul>
                </Col>
            ))}

            {/* Социальные сети */}
            <Col lg={2} md={4} sm={6} className="mb-4">
              <h6 style={{
                fontWeight: '700',
                marginBottom: '20px',
                fontSize: '14px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                color: '#cbd5e1'
              }}>
                Соцсети
              </h6>
              <div style={{ display: 'flex', gap: '12px' }}>
                {socialLinks.map((social, index) => (
                    <a
                        key={index}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={social.label}
                        style={{
                          width: '40px',
                          height: '40px',
                          background: 'rgba(255,255,255,0.05)',
                          borderRadius: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          textDecoration: 'none',
                          fontSize: '18px',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = 'rgba(255,255,255,0.15)'
                          e.target.style.transform = 'translateY(-3px)'
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'rgba(255,255,255,0.05)'
                          e.target.style.transform = 'translateY(0)'
                        }}
                    >
                      {social.icon}
                    </a>
                ))}
              </div>
            </Col>
          </Row>

          {/* Разделитель */}
          <hr style={{
            borderColor: 'rgba(255,255,255,0.08)',
            margin: '20px 0'
          }} />

          {/* Нижняя часть */}
          <div style={{
            padding: '20px 0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <p style={{
              color: '#64748b',
              fontSize: '13px',
              margin: 0
            }}>
              © {currentYear} NFT Marketplace. Все права защищены.
            </p>
            <div style={{ display: 'flex', gap: '16px' }}>
                        <span style={{ color: '#64748b', fontSize: '13px', cursor: 'pointer' }}
                              onMouseEnter={(e) => e.target.style.color = 'white'}
                              onMouseLeave={(e) => e.target.style.color = '#64748b'}
                        >
                            Условия использования
                        </span>
              <span style={{ color: '#64748b', fontSize: '13px', cursor: 'pointer' }}
                    onMouseEnter={(e) => e.target.style.color = 'white'}
                    onMouseLeave={(e) => e.target.style.color = '#64748b'}
              >
                            Политика конфиденциальности
                        </span>
            </div>
          </div>
        </Container>
      </footer>
  )
}

export default Footer