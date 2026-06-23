import { useReadContract } from 'wagmi'
import { useState, useEffect } from 'react'
import { CONTRACTS } from '../config'
import BaseNFTABI from '../../abis/BaseNFT.json'

/**
 * Хук для получения tokenURI
 */
export function useTokenURI(tokenId) {
    const { data: tokenURI, isLoading, isError } = useReadContract({
        address: CONTRACTS.NFT,
        abi: BaseNFTABI,
        functionName: 'tokenURI',
        args: tokenId ? [BigInt(tokenId)] : undefined,
        query: {
            enabled: !!tokenId,
        },
    })

    return {
        tokenURI,
        isLoading,
        isError,
    }
}

/**
 * Хук для получения владельца NFT
 */
export function useNFTOwner(tokenId) {
    const { data: owner } = useReadContract({
        address: CONTRACTS.NFT,
        abi: BaseNFTABI,
        functionName: 'ownerOf',
        args: tokenId ? [BigInt(tokenId)] : undefined,
        query: {
            enabled: !!tokenId,
        },
    })

    return {
        owner,
    }
}

/**
 * Хук для получения метаданных NFT (включая изображение)
 */
export function useNFTMetadata(tokenId) {
    const [metadata, setMetadata] = useState(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState(null)

    const { tokenURI, isLoading: uriLoading } = useTokenURI(tokenId)

    useEffect(() => {
        if (!tokenURI) return

        const fetchMetadata = async () => {
            setIsLoading(true)
            setError(null)

            try {
                // Конвертируем IPFS URI в HTTP URL если нужно
                let url = tokenURI

                // Если это ipfs:// ссылка
                if (url.startsWith('ipfs://')) {
                    url = url.replace('ipfs://', 'https://ipfs.io/ipfs/')
                }

                // Если это формат ipfs/{hash}
                if (url.includes('/ipfs/') && !url.startsWith('http')) {
                    url = 'https://ipfs.io' + url
                }

                const response = await fetch(url)
                const data = await response.json()

                // Конвертируем URL изображения если нужно
                if (data.image) {
                    if (data.image.startsWith('ipfs://')) {
                        data.image = data.image.replace('ipfs://', 'https://ipfs.io/ipfs/')
                    }
                }

                setMetadata(data)
            } catch (err) {
                console.error(`Error fetching metadata for token ${tokenId}:`, err)
                setError(err.message)
            } finally {
                setIsLoading(false)
            }
        }

        fetchMetadata()
    }, [tokenURI, tokenId])

    return {
        metadata,
        isLoading: isLoading || uriLoading,
        error,
    }
}