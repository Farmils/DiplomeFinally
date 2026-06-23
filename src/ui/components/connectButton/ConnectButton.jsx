import { useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { Button } from "react-bootstrap";
import { useContext } from "react";
import { Context } from "../../../core/context/Context.jsx";

export function ConnectButton() {
  const { address, isConnected } = useContext(Context);
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected) {
    return (
      <div>
        <p className={"text-white"}>
          Подключен: {address.slice(0, 6)}...{address.slice(-4)}
        </p>
        <Button onClick={() => disconnect()}>Отключить</Button>
      </div>
    );
  }

  return (
    <Button onClick={() => connect({ connector: injected() })}>
      Подключить MetaMask
    </Button>
  );
}
