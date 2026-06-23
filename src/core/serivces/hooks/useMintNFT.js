import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import BaseNFTABI from '../../abis/BaseNFT.json';
import { CONTRACTS } from '../config.jsx';

export function useMintNFT() {
    const { writeContract, data: hash, isPending, error } = useWriteContract();

    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
        hash,
    });

    const mintNFT = async (to, tokenUri) => {
        if (!to || !tokenUri) {
            throw new Error('Адрес получателя и tokenUri обязательны');
        }

        console.log('Минтим NFT:', { to, tokenUri });

        return writeContract({
            address: CONTRACTS.NFT,
            abi: BaseNFTABI,
            functionName: 'safeMint',
            args: [to, tokenUri],
        });
    };

    return {
        mintNFT,
        isPending,
        isConfirming,
        isConfirmed,
        hash,
        error,
    };
}