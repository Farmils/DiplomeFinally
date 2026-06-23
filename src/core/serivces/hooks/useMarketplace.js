import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import MarketplaceABI from '../../abis/Marketplace.json'
import { CONTRACTS } from '../config.jsx';

/**
 * Хук для получения информации о листинге NFT
 * @param {string|number} tokenId - ID токена
 */
export function useNFTListing(tokenId) {
    const { data, isError, isLoading, error, refetch } = useReadContract({
        address: CONTRACTS.MARKETPLACE,
        abi: MarketplaceABI,
        functionName: 'getByAddressAndId',
        args: tokenId ? [CONTRACTS.NFT, BigInt(tokenId)] : undefined,
        query: {
            enabled: !!tokenId,
        },
    })

    return {
        listing: data, // [payableToken, price]
        isListed: !!data,
        isLoading,
        isError,
        error,
        refetch,
    }
}

/**
 * Хук для получения оффера
 * @param {string|number} tokenId - ID токена
 * @param {string} offerer - Адрес оферента
 */
export function useOffer(tokenId, offerer) {
    const { data, isError, isLoading } = useReadContract({
        address: CONTRACTS.MARKETPLACE,
        abi: MarketplaceABI,
        functionName: 'getOffers',
        args: tokenId && offerer ? [CONTRACTS.NFT, BigInt(tokenId), offerer] : undefined,
        query: {
            enabled: !!tokenId && !!offerer,
        },
    })

    return {
        offer: data, // { endTime, amount }
        isLoading,
        isError,
    }
}

/**
 * Хук для получения комиссии маркетплейса
 */
export function useMarketplaceFee() {
    const { data } = useReadContract({
        address: CONTRACTS.MARKETPLACE,
        abi: MarketplaceABI,
        functionName: 'getFeeBPS',
    })

    return {
        feeBPS: data ? Number(data) : 200, // По умолчанию 200 BPS (2%)
        feePercent: data ? Number(data) / 100 : 2, // В процентах
    }
}

/**
 * Хук для получения адреса получателя комиссии
 */
export function useFeeReceiver() {
    const { data } = useReadContract({
        address: CONTRACTS.MARKETPLACE,
        abi: MarketplaceABI,
        functionName: 'getReceiver',
    })

    return {
        feeReceiver: data,
    }
}

// ============ Хуки для транзакций ============

/**
 * Хук для листинга NFT на продажу
 */
export function useListNFT() {
    const { writeContract, data: hash, isPending, error } = useWriteContract()

    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
        hash,
    })

    const listNFT = async (tokenId, price, paymentToken) => {
        if (!tokenId || !price || !paymentToken) {
            throw new Error('TokenId, price and paymentToken are required')
        }

        console.log('📝 Листинг:', { tokenId, price, paymentToken })

        return writeContract({
            address: CONTRACTS.MARKETPLACE,
            abi: MarketplaceABI,
            functionName: 'add',
            args: [
                CONTRACTS.NFT,
                BigInt(tokenId),
                paymentToken,
                parseEther(price.toString())
            ],
        })
    }

    return {
        listNFT,
        isPending,
        isConfirming,
        isConfirmed,
        hash,
        error,
    }
}

/**
 * Хук для покупки NFT
 */
export function useBuyNFT() {
    const { writeContract, data: hash, isPending, error } = useWriteContract()
    const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash })
    const buyNFT = async (tokenId) => {
        if (!tokenId) throw new Error('TokenId is required')

        console.log('💰 Покупка NFT:', tokenId)
        console.log('Marketplace:', CONTRACTS.MARKETPLACE)
        console.log('NFT:', CONTRACTS.NFT)

        return writeContract({
            address: CONTRACTS.MARKETPLACE,
            abi: MarketplaceABI,
            functionName: 'buy',
            args: [CONTRACTS.NFT, BigInt(tokenId)],
        })
    }

    return { buyNFT, isPending, isConfirming, hash, error }
}
/**
 * Хук для изменения цены листинга
 */
export function useChangePrice() {
    const { writeContract, data: hash, isPending, error } = useWriteContract()

    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
        hash,
    })

    const changePrice = async (tokenId, newPrice, paymentToken) => {
        if (!tokenId || !newPrice || !paymentToken) {
            throw new Error('TokenId, newPrice and paymentToken are required')
        }

        return writeContract({
            address: CONTRACTS.MARKETPLACE,
            abi: MarketplaceABI,
            functionName: 'change',
            args: [
                CONTRACTS.NFT,
                BigInt(tokenId),
                paymentToken,
                parseEther(newPrice.toString())
            ],
        })
    }

    return {
        changePrice,
        isPending,
        isConfirming,
        isConfirmed,
        hash,
        error,
    }
}

/**
 * Хук для отмены листинга
 */
export function useCancelListing() {
    const { writeContract, data: hash, isPending, error } = useWriteContract()

    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
        hash,
    })

    const cancelListing = async (tokenId) => {
        if (!tokenId) {
            throw new Error('TokenId is required')
        }

        return writeContract({
            address: CONTRACTS.MARKETPLACE,
            abi: MarketplaceABI,
            functionName: 'cancel',
            args: [CONTRACTS.NFT, BigInt(tokenId)],
        })
    }

    return {
        cancelListing,
        isPending,
        isConfirming,
        isConfirmed,
        hash,
        error,
    }
}

/**
 * Хук для создания оффера
 */
export function useMakeOffer() {
    const { writeContract, data: hash, isPending, error } = useWriteContract()

    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
        hash,
    })

    const makeOffer = async (tokenId, amount, endTimeInHours) => {
        if (!tokenId || !amount || !endTimeInHours) {
            throw new Error('TokenId, amount and endTime are required')
        }

        // Конвертируем часы в Unix timestamp
        const endTime = Math.floor(Date.now() / 1000) + (Number(endTimeInHours) * 3600)

        return writeContract({
            address: CONTRACTS.MARKETPLACE,
            abi: MarketplaceABI,
            functionName: 'setOffer',
            args: [
                CONTRACTS.MARKETPLACE,
                BigInt(tokenId),
                parseEther(amount.toString()),
                BigInt(endTime)
            ],
        })
    }

    return {
        makeOffer,
        isPending,
        isConfirming,
        isConfirmed,
        hash,
        error,
    }
}

/**
 * Хук для принятия оффера
 */
export function useAcceptOffer() {
    const { writeContract, data: hash, isPending, error } = useWriteContract()

    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
        hash,
    })

    const acceptOffer = async (tokenId, from) => {
        if (!tokenId || !from) {
            throw new Error('TokenId and from address are required')
        }

        return writeContract({
            address: CONTRACTS.MARKETPLACE,
            abi: MarketplaceABI,
            functionName: 'receiveOffer',
            args: [CONTRACTS.NFT, BigInt(tokenId), from],
        })
    }

    return {
        acceptOffer,
        isPending,
        isConfirming,
        isConfirmed,
        hash,
        error,
    }
}

/**
 * Хук для отмены оффера
 */
export function useCancelOffer() {
    const { writeContract, data: hash, isPending, error } = useWriteContract()

    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
        hash,
    })

    const cancelOffer = async (tokenId, from) => {
        if (!tokenId || !from) {
            throw new Error('TokenId and from address are required')
        }

        return writeContract({
            address: CONTRACTS.MARKETPLACE,
            abi: MarketplaceABI,
            functionName: 'closeOffer',
            args: [CONTRACTS.NFT, BigInt(tokenId), from],
        })
    }

    return {
        cancelOffer,
        isPending,
        isConfirming,
        isConfirmed,
        hash,
        error,
    }
}

/**
 * Хук для включения/выключения офферов
 */
export function useToggleOffers() {
    const { writeContract, data: hash, isPending, error } = useWriteContract()

    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
        hash,
    })

    const enableOffers = async (tokenId) => {
        if (!tokenId) throw new Error('TokenId is required')

        return writeContract({
            address: CONTRACTS.MARKETPLACE,
            abi: MarketplaceABI,
            functionName: 'onOffers',
            args: [CONTRACTS.NFT, BigInt(tokenId)],
        })
    }

    const disableOffers = async (tokenId) => {
        if (!tokenId) throw new Error('TokenId is required')

        return writeContract({
            address: CONTRACTS.MARKETPLACE,
            abi: MarketplaceABI,
            functionName: 'offOffers',
            args: [CONTRACTS.NFT, BigInt(tokenId)],
        })
    }

    return {
        enableOffers,
        disableOffers,
        isPending,
        isConfirming,
        isConfirmed,
        hash,
        error,
    }
}