export function getProvider() {
    if (typeof window === 'undefined') return null

    const ethereum = window.ethereum

    if (!ethereum) return null

    // Если есть массив провайдеров
    if (ethereum.providers?.length) {
        // Ищем WalletConnect
        const wc = ethereum.providers.find(p => p.isWalletConnect)
        if (wc) return wc

        // Ищем MetaMask
        const mm = ethereum.providers.find(p => p.isMetaMask)
        if (mm) return mm

        // Возвращаем первый
        return ethereum.providers[0]
    }

    return ethereum
}