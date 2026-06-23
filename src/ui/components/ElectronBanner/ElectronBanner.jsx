import { Alert, Button } from 'react-bootstrap'

export default function ElectronBanner() {
    const isElectron = window.electronAPI?.isElectron

    if (!isElectron) return null

    const openInBrowser = () => {
        const url = 'https://farmils.github.io/DiplomeFinally/'

        if (window.electronAPI?.openExternal) {
            window.electronAPI.openExternal(url)
        } else {
            window.open(url, '_blank')
        }
    }

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
                <small>Откройте в браузере для подключения MetaMask</small>
            </div>
            <Button
                variant="primary"
                size="sm"
                onClick={openInBrowser}
                style={{ borderRadius: '10px' }}
            >
                🌐 Открыть в браузере
            </Button>
        </Alert>
    )
}