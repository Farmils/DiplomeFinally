import { createConfig, http } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';

export const CONTRACTS = {
    MARKETPLACE: '0xaCaFE6Aa9409902d97e32C339783b86EB61F4F33',
    NFT: '0x0Fd496807cBBa2b2b8f4fF5E7bDaEBB3C4Ab1857',
}

const WC_PROJECT_ID = '04f7abb1a1a54b95664341383c6deae5'

export const config = createConfig({
    chains: [sepolia],
    transports: {
        [sepolia.id]: http('https://ethereum-sepolia.publicnode.com'),
    },
    connectors: [
        injected({ shimDisconnect: true }),
        walletConnect({
            projectId: WC_PROJECT_ID,
            showQrModal: true,
            metadata: {
                name: 'NFT Marketplace',
                description: 'NFT Marketplace',
                url: 'http://localhost:5173',
                icons: []
            },
            // Отключаем лишние запросы
            relayUrl: 'wss://relay.walletconnect.com',
        }),
    ],
    // Отключаем лишние функции
    batch: {
        multicall: false,
    },
});