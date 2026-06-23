import { useWriteContract, useWaitForTransactionReceipt, useReadContract, useAccount } from 'wagmi'
import { parseEther, erc20Abi } from 'viem'
import BaseNFTABI from '../../abis/BaseNFT.json'
import { CONTRACTS } from '../config.jsx'

/**
 * Хук для проверки и выполнения approval NFT
 */
export function useNFTApproval() {
    const { address } = useAccount()
    const { writeContract, data: hash, isPending, error } = useWriteContract()

    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
        hash,
    })

    // Проверка approve для конкретного токена
    const { data: approvedAddress, refetch: refetchApproved } = useReadContract({
        address: CONTRACTS.NFT,
        abi: BaseNFTABI,
        functionName: 'getApproved',
        args: address ? [BigInt(0)] : undefined, // Будет переопределено в checkApproval
        query: {
            enabled: false, // Отключаем автоматический запрос
        },
    })

    // Проверка isApprovedForAll
    const { data: isApprovedForAll, refetch: refetchApprovedAll } = useReadContract({
        address: CONTRACTS.NFT,
        abi: BaseNFTABI,
        functionName: 'isApprovedForAll',
        args: address ? [address, CONTRACTS.MARKETPLACE] : undefined,
        query: {
            enabled: !!address,
        },
    })

    /**
     * Дать разрешение на использование конкретного NFT
     */
    const approveSingle = async (tokenId) => {
        if (!tokenId) throw new Error('TokenId is required')

        console.log('🔐 Approve Single, tokenId:', tokenId)

        try {
            const accounts = await window.ethereum?.request({
                method: 'eth_requestAccounts'
            })

            if (!accounts?.[0]) throw new Error('Нет аккаунтов')

            const { encodeFunctionData } = await import('viem')

            const data = encodeFunctionData({
                abi: BaseNFTABI,
                functionName: 'approve',
                args: [CONTRACTS.MARKETPLACE, BigInt(tokenId)]
            })

            const txHash = await window.ethereum.request({
                method: 'eth_sendTransaction',
                params: [{
                    from: accounts[0],
                    to: CONTRACTS.NFT,
                    data: data,
                }]
            })

            console.log('✅ Approve Single tx:', txHash)
            return txHash
        } catch (err) {
            console.error('❌ Approve error:', err)
            throw err
        }
    }

    /**
     * Дать разрешение на использование всех NFT
     */
    const approveAll = async () => {
        console.log('🔐 Approve All через wagmi...')

        return writeContract({
            address: CONTRACTS.NFT,
            abi: BaseNFTABI,
            functionName: 'setApprovalForAll',
            args: [CONTRACTS.MARKETPLACE, true],
        })
    }
    /**
     * Проверить, одобрен ли NFT для маркетплейса
     */
    const checkApproval = async (tokenId) => {
        if (!tokenId || !address) return { isApproved: false }

        try {
            // Можно использовать публичный клиент для проверки
            const { readContract } = await import('@wagmi/core')
            const { config } = await import('../../serivces/config.jsx')

            const approved = await readContract(config, {
                address: CONTRACTS.NFT,
                abi: BaseNFTABI,
                functionName: 'getApproved',
                args: [BigInt(tokenId)],
            })

            const approvedForAll = await readContract(config, {
                address: CONTRACTS.NFT,
                abi: BaseNFTABI,
                functionName: 'isApprovedForAll',
                args: [address, CONTRACTS.MARKETPLACE],
            })

            return {
                isApproved: approved?.toLowerCase() === CONTRACTS.MARKETPLACE.toLowerCase() || approvedForAll,
            }
        } catch (error) {
            console.error('Error checking approval:', error)
            return { isApproved: false }
        }
    }

    return {
        approveSingle,
        approveAll,
        checkApproval,
        isApprovedForAll,
        refetchApprovedAll,
        isPending,
        isConfirming,
        isConfirmed,
        hash,
        error,
    }
}

/**
 * Хук для проверки и выполнения approval токенов (ERC20)
 */
export function useTokenApproval() {
    const { address } = useAccount()
    const { writeContract, data: hash, isPending, error } = useWriteContract()

    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
        hash,
    })

    /**
     * Дать разрешение на использование токенов
     */
    const approveToken = async (tokenAddress, amount) => {
        if (!tokenAddress || !amount) {
            throw new Error('TokenAddress and amount are required')
        }

        return writeContract({
            address: tokenAddress,
            abi: erc20Abi, // Используем стандартный ABI ERC20 из viem
            functionName: 'approve',
            args: [CONTRACTS.MARKETPLACE, parseEther(amount.toString())],
        })
    }

    /**
     * Проверить allowance токенов
     */
    const checkAllowance = async (tokenAddress, amount) => {
        if (!tokenAddress || !address) {
            return { hasAllowance: false, allowance: 0n }
        }

        try {
            const { readContract } = await import('@wagmi/core')
            const { config } = await import('../../serivces/config.jsx')

            const allowance = await readContract(config, {
                address: tokenAddress,
                abi: erc20Abi,
                functionName: 'allowance',
                args: [address, CONTRACTS.MARKETPLACE],
            })

            const requiredAmount = amount ? parseEther(amount.toString()) : 0n

            return {
                hasAllowance: allowance ? BigInt(allowance) >= requiredAmount : false,
                allowance: allowance || 0n,
            }
        } catch (error) {
            console.error('Error checking allowance:', error)
            return { hasAllowance: false, allowance: 0n }
        }
    }

    return {
        approveToken,
        checkAllowance,
        isPending,
        isConfirming,
        isConfirmed,
        hash,
        error,
    }
}

/**
 * Хук для получения владельца NFT
 */
export function useNFTOwner(tokenId) {
    const { address } = useAccount()

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
        isOwner: owner && address ? owner.toLowerCase() === address.toLowerCase() : false,
        owner,
    }
}

/**
 * Хук для получения URI токена
 */
export function useTokenURI(tokenId) {
    const { data: tokenURI } = useReadContract({
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
    }
}