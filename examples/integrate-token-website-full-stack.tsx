/**
 * Exemplo React/Next.js: Integração Completa do Token NEOFlowOFF
 * 
 * Stack:
 * - MetaMask Embedded Wallets (Web3Auth): Autenticação e wallet embutida
 * - IPFS.io + Storacha: Armazenamento
 * - Infura: RPC/Bundler
 * - MetaMask Smart Accounts: Account Abstraction
 * 
 * Nota: MetaMask Embedded Wallets (anteriormente Web3Auth) fornece infraestrutura
 * de wallet embutida plugável para simplificar integração Web3 e onboarding de usuários.
 * 
 * Uso em React/Next.js:
 * import { NEOFlowOFFFullStackIntegration } from './integrate-token-full-stack';
 */

'use client'; // Para Next.js 13+

import React, { useState, useEffect } from 'react';
import { Web3Auth } from '@web3auth/modal';
import { CHAIN_NAMESPACES, IProvider } from '@web3auth/base';
import type { CustomChainConfig } from '@web3auth/no-modal';
import { NEOFlowOFFFullStackIntegration } from './integrate-token-full-stack';

// ============================================
// CONFIGURAÇÕES
// ============================================

const WEB3AUTH_CLIENT_ID = process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID || '';
// Web3Auth fornece RPC e Bundler próprios - não precisa de Infura!
// URLs do Web3Auth (obtenha no dashboard após configurar a chain)
const WEB3AUTH_RPC_URL = process.env.NEXT_PUBLIC_WEB3AUTH_RPC_URL || '';
const WEB3AUTH_BUNDLER_URL = process.env.NEXT_PUBLIC_WEB3AUTH_BUNDLER_URL || '';
// Fallback: Infura é opcional - só necessário se não usar Web3Auth RPC/Bundler
const INFURA_API_KEY = process.env.NEXT_PUBLIC_INFURA_API_KEY || '';
const ALCHEMY_API_URL = process.env.NEXT_PUBLIC_ALCHEMY_POLYGON_MAINNET_API_KEY || process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || '';
const STORACHA_API_KEY = process.env.NEXT_PUBLIC_STORACHA_API_KEY || '';

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function NEOFlowOFFTokenIntegration() {
  const [web3auth, setWeb3auth] = useState<Web3Auth | null>(null);
  const [provider, setProvider] = useState<IProvider | null>(null);
  const [integration, setIntegration] = useState<NEOFlowOFFFullStackIntegration | null>(null);
  const [userAddress, setUserAddress] = useState<string>('');
  const [balance, setBalance] = useState<string>('0');
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  // Inicializar MetaMask Embedded Wallets (Web3Auth)
  useEffect(() => {
    const init = async () => {
      try {
        // Prioridade: Web3Auth RPC > Alchemy > Infura > RPC público
        const rpcUrl = WEB3AUTH_RPC_URL 
          ? WEB3AUTH_RPC_URL
          : (ALCHEMY_API_URL 
            ? (ALCHEMY_API_URL.startsWith('http') ? ALCHEMY_API_URL : `https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_API_URL}`)
            : (INFURA_API_KEY 
              ? `https://polygon-mainnet.infura.io/v3/${INFURA_API_KEY}`
              : 'https://polygon-rpc.com')); // RPC público como fallback

        const chainConfig: CustomChainConfig = {
          chainNamespace: CHAIN_NAMESPACES.EIP155,
          chainId: '0x89', // Polygon
          rpcTarget: rpcUrl,
          displayName: 'Polygon Mainnet',
          blockExplorerUrl: 'https://polygonscan.com',
          ticker: 'MATIC',
          tickerName: 'Polygon',
          logo: 'https://polygon.technology/polygon.svg',
        };

        const web3authInstance = new Web3Auth({
          clientId: WEB3AUTH_CLIENT_ID,
          web3AuthNetwork: 'mainnet',
          chains: [chainConfig],
          defaultChainId: '0x89',
        });

        await web3authInstance.init();
        setWeb3auth(web3authInstance);

        // Se já estiver conectado
        if (web3authInstance.connected) {
          setProvider(web3authInstance.provider);
        }
      } catch (error) {
        console.error('Erro ao inicializar MetaMask Embedded Wallets:', error);
      }
    };

    init();
  }, []);

  // Inicializar integração quando provider estiver disponível
  useEffect(() => {
    const initIntegration = async () => {
      if (!provider || !web3auth) return;

      try {
        const accounts = await provider.request({ method: 'eth_accounts' });
        if (accounts && accounts.length > 0) {
          const address = accounts[0] as string;
          setUserAddress(address);

          const integ = new NEOFlowOFFFullStackIntegration();
          // No website real, você converteria o provider do MetaMask Embedded Wallets para um signer
          // await integ.initializeSmartAccount(web3AuthSigner, address);
          setIntegration(integ);

          // Carregar saldo
          const bal = await integ.getBalance(address as `0x${string}`);
          setBalance(bal);

          // Sincronizar dados do usuário
          const data = await integ.syncUserData();
          setUserData(data);
        }
      } catch (error) {
        console.error('Erro ao inicializar integração:', error);
      }
    };

    initIntegration();
  }, [provider, web3auth]);

  // Conectar com MetaMask Embedded Wallets
  const handleLogin = async () => {
    if (!web3auth) return;

    try {
      setLoading(true);
      const web3authProvider = await web3auth.connect();
      setProvider(web3authProvider);
    } catch (error) {
      console.error('Erro ao conectar:', error);
    } finally {
      setLoading(false);
    }
  };

  // Desconectar
  const handleLogout = async () => {
    if (!web3auth) return;

    try {
      await web3auth.logout();
      setProvider(null);
      setUserAddress('');
      setBalance('0');
      setIntegration(null);
      setUserData(null);
    } catch (error) {
      console.error('Erro ao desconectar:', error);
    }
  };

  // Transferir tokens
  const handleTransfer = async (to: string, amount: string) => {
    if (!integration || !userAddress) return;

    try {
      setLoading(true);
      const result = await integration.transferAndSave(
        to as `0x${string}`,
        amount
      );

      alert(`Transferido! TX: ${result.txHash}\nIPFS: ${result.ipfsHash}`);

      // Atualizar saldo
      const newBalance = await integration.getBalance();
      setBalance(newBalance);
    } catch (error: any) {
      alert(`Erro: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>NEOFlowOFF Token - Smart Accounts</h1>

      {!provider ? (
        <div>
          <p>Conecte sua wallet para começar</p>
          <button onClick={handleLogin} disabled={loading}>
            {loading ? 'Conectando...' : 'Conectar com MetaMask'}
          </button>
        </div>
      ) : (
        <div>
          <div className="user-info">
            <h2>Informações do Usuário</h2>
            <p><strong>Endereço:</strong> {userAddress}</p>
            <p><strong>Saldo:</strong> {balance} NEOFLW</p>
            {userData && (
              <div>
                <p><strong>Último Login:</strong> {new Date(userData.lastLogin).toLocaleString()}</p>
                <p><strong>Transações:</strong> {userData.transactions.length}</p>
              </div>
            )}
          </div>

          <div className="transfer-section">
            <h2>Transferir Tokens</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const to = formData.get('to') as string;
              const amount = formData.get('amount') as string;
              handleTransfer(to, amount);
            }}>
              <input
                type="text"
                name="to"
                placeholder="Endereço destino"
                required
              />
              <input
                type="number"
                name="amount"
                placeholder="Quantidade"
                step="0.000000000000000001"
                required
              />
              <button type="submit" disabled={loading}>
                {loading ? 'Processando...' : 'Transferir'}
              </button>
            </form>
          </div>

          <button onClick={handleLogout}>Desconectar</button>
        </div>
      )}

      <style jsx>{`
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .user-info {
          background: #f5f5f5;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        .transfer-section {
          background: #fff;
          padding: 20px;
          border-radius: 8px;
          border: 1px solid #ddd;
        }
        form {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        input {
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        button {
          padding: 10px 20px;
          background: #0070f3;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }
        button:hover:not(:disabled) {
          background: #0051cc;
        }
      `}</style>
    </div>
  );
}
