import { createContext } from "react";
import { useAccount } from "wagmi";

const Context = createContext({});
const ContextProvider = ({ children }) => {
  const { address, isConnected } = useAccount();
  const values = {
    address,
    isConnected,
  };
  return <Context.Provider value={values}>{children}</Context.Provider>;
};
export { ContextProvider, Context };
