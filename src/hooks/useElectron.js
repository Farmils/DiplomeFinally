export function useElectron() {
    const isElectron = typeof window !== 'undefined' &&
        window.electronAPI !== undefined

    return {
        isElectron,
        isDesktop: isElectron,
        version: isElectron ? window.electronAPI.getVersion() : 'web',
        platform: isElectron ? window.electronAPI.getPlatform() : 'browser',
        openExternal: (url) => {
            if (isElectron) {
                window.electronAPI.openExternal(url)
            } else {
                window.open(url, '_blank')
            }
        }
    }
}