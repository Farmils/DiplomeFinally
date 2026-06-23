import { useReadContract } from "wagmi";
import { contractAbi } from "./abi.ts";
// ABI вашего контракта

const contractAddress = "0xaCaFE6Aa9409902d97e32C339783b86EB61F4F33";

export function ReadContractData() {
  const { data, isLoading, isError } = useReadContract({
    address: contractAddress,
    abi: contractAbi,
    functionName: "getFeeBPS",
    args: [], // аргументы функции
  });

  if (isLoading) return <div>Загрузка...</div>;
  if (isError) return <div>Ошибка</div>;
  return <div>Результат: {data?.toString()}</div>;
}
