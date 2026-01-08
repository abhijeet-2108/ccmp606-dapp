"use client";

import { useEffect, useMemo } from "react";
import {
  useAccount,
  useBalance,
  useChainId,
  useConnect,
  useDisconnect,
  useReadContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { injected } from "wagmi/connectors";
import { sepolia } from "wagmi/chains";
import { formatUnits } from "viem";

const counterAddress = "0x2f513113753558b7505De6157255dc4Ad3f0b17D" as const;

const counterAbi = [
  {
    inputs: [],
    name: "count",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "get",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  { inputs: [], name: "inc", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [], name: "dec", outputs: [], stateMutability: "nonpayable", type: "function" },
] as const;

export default function Home() {
 
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  const connect = useConnect();
  const disconnect = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();

  const isWrongNetwork = isConnected && chainId !== sepolia.id;
  const networkName =
    chainId === sepolia.id ? "Sepolia" : chainId ? `Chain ${chainId}` : "-";

  // ------- Balance -------
  const { data: balance, isLoading: balanceLoading } = useBalance({
    address,
    chainId: chainId ?? sepolia.id,
    query: { enabled: !!address },
  });

  // ------- Read: count -------
  const {
    data: count,
    isFetching: countFetching,
    refetch: refetchCount,
    error: readError,
  } = useReadContract({
    address: counterAddress,
    abi: counterAbi,
    functionName: "count",
    chainId: sepolia.id,
    query: { enabled: isConnected && !isWrongNetwork },
  });

  const countBigInt = useMemo(() => (typeof count === "bigint" ? count : 0), [count]);

  // ------- Write: inc/dec -------
  const {
    writeContract,
    data: txHash,
    isPending: isWritePending,
    error: writeError,
  } = useWriteContract();

  const {
    isLoading: isTxConfirming,
    isSuccess: isTxSuccess,
    error: txError,
  } = useWaitForTransactionReceipt({
    hash: txHash,
    chainId: sepolia.id,
    query: { enabled: !!txHash },
  });

 
  useEffect(() => {
    if (isTxSuccess) refetchCount();
  }, [isTxSuccess, refetchCount]);

  const canRead = isConnected && !isWrongNetwork;
  const canWrite = isConnected && !isWrongNetwork && !isWritePending && !isTxConfirming;

  return (
    <main style={{ padding: 24, fontFamily: "system-ui", maxWidth: 820 }}>
      <h1>wagmi + Remix CCMP606 Dapp (Sepolia)</h1>

      <p>Status: {connect.status}</p>

      {!isConnected ? (
        <div style={{ display: "grid", gap: 10 }}>
          <button onClick={() => connect.connect({ connector: injected() })}
            style={{
              width: "fit-content",
              justifySelf: "start",
              alignSelf: "start",
              padding: "8px 16px",
              borderRadius: 8,
              border: "1px solid #333",
              background: "#eaeaea",
              cursor: "pointer",
              fontWeight: 600,
            }}
            >
            Connect Wallet (MetaMask)
          </button>

          {connect.error && <p style={{ color: "crimson" }}>{connect.error.message}</p>}
        </div>
      ) : (
        <div style={{ display: "grid", gap: 14 }}>
          <div style={{ display: "grid", gap: 6 }}>
            <p>
              <b>Connected</b>
            </p>
            <p>Network: {networkName}</p>
            <p>chainId(debug): {chainId}</p>

            <p>Address: {address}</p>

            <p>
              Balance:{" "}
              {balanceLoading
                ? "Loading..."
                : balance
                ? `${formatUnits(balance.value, balance.decimals)} ${balance.symbol}`
                : "-"}
            </p>

            <button onClick={() => disconnect.disconnect()}
            style={{
              width: "fit-content",
              justifySelf: "start",
              alignSelf: "start",
              padding: "8px 16px",
              borderRadius: 8,
              border: "1px solid #333",
              background: "#eaeaea",
              cursor: "pointer",
              fontWeight: 600,
            }}
              >Disconnect</button>
          </div>

          <hr />

          <div style={{ display: "grid", gap: 10 }}>
            <h2>Counter Contract</h2>
            <p>Contract: {counterAddress}</p>

            {isWrongNetwork && (
              <div style={{ color: "crimson", display: "grid", gap: 8 }}>
                <div>You are not on Sepolia。</div>
                <button
                  onClick={() => switchChain({ chainId: sepolia.id })}
                  disabled={isSwitching}
                >
                  {isSwitching ? "Switching..." : "Switch to Sepolia"}
                </button>
              </div>
            )}

            {/* Read */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <button onClick={() => refetchCount()} disabled={!canRead}>
                Read
              </button>

              <span>
                Count:{" "}
                {countFetching ? "Loading..." : countBigInt.toString()}
              </span>
            </div>

            {/* Write */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button
                onClick={() =>
                  writeContract({
                    address: counterAddress,
                    abi: counterAbi,
                    functionName: "inc",
                  })
                }
                disabled={!canWrite}
                style={{
                  padding: "6px 14px",
                  borderRadius: 6,
                  border: "1px solid #333",
                  background: "#f5f5f5",
                  cursor: canWrite ? "pointer" : "not-allowed",
                  fontWeight: 500,
                }}
              >
                Inc
              </button>

              <button
                onClick={() =>
                  writeContract({
                    address: counterAddress,
                    abi: counterAbi,
                    functionName: "dec",
                  })
                }
                disabled={!canWrite || countBigInt === 0}
                style={{
                  padding: "6px 14px",
                  borderRadius: 6,
                  border: "1px solid #333",
                  background: countBigInt === 0 ? "#eee" : "#f5f5f5",
                  cursor:
                    !canWrite || countBigInt === 0 ? "not-allowed" : "pointer",
                  fontWeight: 500,
                }}
                title={countBigInt === 0 ? "when count=0  dec will revert" : ""}
              >
                Dec
              </button>
            </div>

            {/* Tx status */}
            <div style={{ fontSize: 14 }}>
              {isWritePending && <p>Wait for the confirmation from MetaMask…</p>}
              {isTxConfirming && <p>Transaction sent. Waiting for confirmation from blockchain…</p>}
              {txHash && (
                <p>
                  Tx hash: <code>{txHash}</code>
                </p>
              )}
              {isTxSuccess && <p style={{ color: "green" }}> Transaction confirmed and count refreshed</p>}
            </div>

            {/* Errors */}
            {(readError || writeError || txError) && (
              <div style={{ color: "crimson" }}>
                {readError && <p>Read error: {readError.message}</p>}
                {writeError && <p>Write error: {writeError.message}</p>}
                {txError && <p>Tx error: {txError.message}</p>}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}



// second thing 

// "use client";
// import { useBalance, useConnect, useConnection, useDisconnect } from "wagmi";
// import { sepolia } from "wagmi/chains";
// import { injected } from "wagmi/connectors";
// import { formatUnits } from "viem";
// export default function Home() {
//   const { address, isConnected, chainId } = useConnection();
//   const connect = useConnect();
//   const disconnect = useDisconnect();
//   const { data: balance, isLoading } = useBalance({
//     address,
//     chainId: chainId ?? sepolia.id,
//     query: { enabled: !!address },
//   });
//   const networkName =
//     chainId === sepolia.id ? "Sepolia" : chainId ? `Chain ${chainId}` : "-";
//   return (
//     <main style={{ padding: 24, fontFamily: "system-ui" }}>
//       <h1>wagmi Starter Demo</h1>
//       <p>Status: {connect.status}</p>
//       {!isConnected ? (
//         <div>
//           <button onClick={() => connect.mutate({ connector: injected() })}>
//             Connect Wallet (MetaMask)
//           </button>
//           {connect.error && (
//             <p style={{ color: "crimson" }}>{connect.error.message}</p>
//           )}
//         </div>
//       ) : (
//         <div>
//           <p>
//             <b>Connected</b>
//           </p>
//           <p>Network: {networkName}</p>
//           <p>Address: {address}</p>
//           <p>
//             Balance:{" "}
//             {isLoading
//               ? "Loading..."
//               : balance
//                 ? `${formatUnits(balance.value, balance.decimals)} ${balance.symbol}`
//                 : "-"}
//           </p>
//           <button onClick={() => disconnect.mutate()}>
//             Disconnect
//           </button>
//         </div>
//       )}
//     </main>
//   );
// }

// ///first thing


// import Image from "next/image";

// export default function Home() {
//   return (
//     <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
//       <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
//         <Image
//           className="dark:invert"
//           src="/next.svg"
//           alt="Next.js logo"
//           width={100}
//           height={20}
//           priority
//         />
//         <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
//           <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
//             To get started, edit the page.tsx file.
//           </h1>
//           <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
//             Looking for a starting point or more instructions? Head over to{" "}
//             <a
//               href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//               className="font-medium text-zinc-950 dark:text-zinc-50"
//             >
//               Templates
//             </a>{" "}
//             or the{" "}
//             <a
//               href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//               className="font-medium text-zinc-950 dark:text-zinc-50"
//             >
//               Learning
//             </a>{" "}
//             center.
//           </p>
//         </div>
//         <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
//           <a
//             className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
//             href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//             target="_blank"
//             rel="noopener noreferrer"
//           >
//             <Image
//               className="dark:invert"
//               src="/vercel.svg"
//               alt="Vercel logomark"
//               width={16}
//               height={16}
//             />
//             Deploy Now
//           </a>
//           <a
//             className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
//             href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//             target="_blank"
//             rel="noopener noreferrer"
//           >
//             Documentation
//           </a>
//         </div>
//       </main>
//     </div>
//   );
// }
