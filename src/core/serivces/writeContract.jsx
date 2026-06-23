import { useWriteContract } from "wagmi";
import { contractAbi } from "./abi.ts";

export function WriteContractButton() {
  const { writeContract, data: hash, isPending } = useWriteContract();

  const handleMint = () => {
    writeContract({
      address: "0xaCaFE6Aa9409902d97e32C339783b86EB61F4F33",
      abi: contractAbi,
      functionName: "calculatePercent",
      args: [100], // аргументы
    });
  };

  return (
    <div>
      <button onClick={handleMint} disabled={isPending}>
        {isPending ? "Подтвердите в MetaMask..." : "Отправить"}
      </button>
      {hash && <p>Транзакция отправлена: {hash}</p>}
    </div>
  );
}
