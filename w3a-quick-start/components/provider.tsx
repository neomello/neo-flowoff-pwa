'use client';

// IMP START - Setup Web3Auth Provider
import {
  Web3AuthProvider,
  type Web3AuthContextConfig,
} from '@web3auth/modal/react';
import {
  IWeb3AuthState,
  WEB3AUTH_NETWORK,
  WALLET_CONNECTORS,
  AUTH_CONNECTION,
} from '@web3auth/modal';
// IMP END - Setup Web3Auth Provider
// IMP START - Setup Wagmi Provider
import { WagmiProvider } from '@web3auth/modal/react/wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
// IMP END - Setup Wagmi Provider

// IMP START - Dashboard Registration
const web3AuthNetwork: string = process.env.NEXT_PUBLIC_WEB3AUTH_NETWORK || '';
const clientId: string = process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID || '';
if (!web3AuthNetwork) {
  throw new Error('NEXT_PUBLIC_WEB3AUTH_NETWORK is not set');
}
if (!clientId) {
  throw new Error('NEXT_PUBLIC_WEB3AUTH_CLIENT_ID is not set');
}
// IMP END - Dashboard Registration

// IMP START - Setup Wagmi Provider
const queryClient = new QueryClient();
// IMP END - Setup Wagmi Provider

// IMP START - Config
const web3AuthContextConfig: Web3AuthContextConfig = {
  web3AuthOptions: {
    clientId: clientId,
    web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
    // IMP START - SSR
    ssr: true,
    // IMP END - SSR
  },
};
// IMP END - Config

// IMP START - Google Auth Connection
// Google Auth connection is handled in the App component using useWeb3AuthConnect hook
// IMP END - Google Auth Connection

// IMP START - SSR
export default function Provider({
  children,
  web3authInitialState,
}: {
  children: React.ReactNode;
  web3authInitialState: IWeb3AuthState | undefined;
}) {
  // IMP END - SSR
  return (
    // IMP START - Setup Web3Auth Provider
    // IMP START - SSR
    <Web3AuthProvider
      config={web3AuthContextConfig}
      initialState={web3authInitialState}
    >
      {/* // IMP END - SSR */}
      {/* // IMP END - Setup Web3Auth Provider */}
      {/* // IMP START - Setup Wagmi Provider */}
      <QueryClientProvider client={queryClient}>
        <WagmiProvider>{children}</WagmiProvider>
      </QueryClientProvider>
      {/*// IMP END - Setup Wagmi Provider */}
      {/*// IMP START - Setup Web3Auth Provider */}
    </Web3AuthProvider>
    // IMP END - Setup Web3Auth Provider
  );
}
