import { useState } from 'react'
import { Navbar, Nav, Container, Button, Badge } from 'react-bootstrap'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { useNavigate, useLocation } from 'react-router-dom'
import WalletConnect from "../WalletConnect/WalletConnect.jsx";

const Header = () => {
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const navigate = useNavigate()
  const location = useLocation()
  const [expanded, setExpanded] = useState(false)

  const handleConnect = async () => {
    try {
      await connect({ connector: connectors[0] })
    } catch (error) {
      console.error('Connection error:', error)
    }
  }

  const handleDisconnect = () => {
    disconnect()
  }

  const navLinks = [
    { path: '/', label: '🏠 Главная' },
    { path: '/gallery', label: '🛒 Маркетплейс' },
    { path: '/profile', label: '👤 Профиль' }
  ]

  const isActive = (path) => location.pathname === path

  const formatAddress = (addr) => {
    if (!addr) return ''
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  return (
      <Navbar
          expand="lg"
          expanded={expanded}
          onToggle={setExpanded}
          style={{
            background: 'white',
            boxShadow: '0 2px 20px rgba(0,0,0,0.06)',
            padding: '12px 0',
            position: 'sticky',
            top: 0,
            zIndex: 1000
          }}
      >
        <Container>
          <Navbar.Brand
              onClick={() => navigate('/')}
              style={{
                cursor: 'pointer',
                fontWeight: '800',
                fontSize: '24px',
                color: '#1e293b',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
          >
                    <span style={{
                      background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                      color: 'white',
                      padding: '4px 10px',
                      borderRadius: '10px',
                      fontSize: '18px'
                    }}>
                        NFT
                    </span>
            Marketplace
          </Navbar.Brand>

          <Navbar.Toggle aria-controls="main-navbar" />

          <Navbar.Collapse id="main-navbar">
            <Nav className="mx-auto">
              {navLinks.map((link) => (
                  <Nav.Link
                      key={link.path}
                      onClick={() => {
                        navigate(link.path)
                        setExpanded(false)
                      }}
                      style={{
                        fontWeight: isActive(link.path) ? '600' : '500',
                        color: isActive(link.path) ? '#3b82f6' : '#64748b',
                        padding: '8px 16px',
                        margin: '0 4px',
                        borderRadius: '8px',
                        transition: 'all 0.2s ease',
                        background: isActive(link.path) ? '#eff6ff' : 'transparent'
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive(link.path)) {
                          e.target.style.background = '#f8fafc'
                          e.target.style.color = '#1e293b'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive(link.path)) {
                          e.target.style.background = 'transparent'
                          e.target.style.color = '#64748b'
                        }
                      }}
                  >
                    {link.label}
                  </Nav.Link>
              ))}
            </Nav>

            <div className="d-flex align-items-center gap-3">
              <Badge
                  bg="warning"
                  text="dark"
                  style={{
                    fontSize: '12px',
                    padding: '6px 10px',
                    borderRadius: '8px'
                  }}
              >
                Sepolia
                  <WalletConnect/>
              </Badge>

              {isConnected ? (
                  <div className="d-flex align-items-center gap-2">
                    <div style={{
                      background: '#f0fdf4',
                      padding: '8px 14px',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <div style={{
                        width: '10px',
                        height: '10px',
                        background: '#22c55e',
                        borderRadius: '50%',
                        animation: 'pulse 2s infinite'
                      }} />
                      <span style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#166534',
                        fontFamily: 'monospace'
                      }}>
                                        {formatAddress(address)}
                                    </span>
                    </div>
                    <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={handleDisconnect}
                        style={{
                          borderRadius: '10px',
                          fontWeight: '500',
                          padding: '8px 14px'
                        }}
                    >
                      Отключить
                    </Button>
                  </div>
              ) : (
                 <></>
              )}
            </div>
          </Navbar.Collapse>
        </Container>

        <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
            `}</style>
      </Navbar>
  )
}

export default Header