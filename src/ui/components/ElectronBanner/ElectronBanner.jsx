import { Alert, Button } from 'react-bootstrap'

export default function ElectronBanner() {
    const isElectron = window.electronAPI?.isElectron

    if (!isElectron) return null

    return (
        <Alert
            variant="info"
            className="d-flex align-items-center justify-content-between m-3"
            style={{
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
                border: '1px solid #bfdbfe'
            }}
        >
            <div>
                <strong>🖥️ Desktop версия</strong>
                <br />
                <small>Для подключения MetaMask откройте приложение в браузере</small>
            </div>
            <Button
                variant="primary"
                size="sm"
                onClick={() => window.open('http://localhost:5173', '_blank')}
                style={{ borderRadius: '10px' }}
            >
                🌐 Открыть в браузере
            </Button>
        </Alert>
    )
}