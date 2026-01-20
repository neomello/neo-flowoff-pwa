/**
 * Exemplo de Integração do Token NEOFlowOFF para Website
 *
 * Este exemplo mostra como integrar o token com Account Abstraction
 * em um website usando MetaMask Smart Accounts
 *
 * Este código pode ser adaptado para React, Next.js, ou qualquer framework
 */

import {
  createPublicClient,
  http,
  type Address,
  formatUnits,
  parseUnits,
} from 'viem';
import { polygon } from 'viem/chains';
import {
  Implementation,
  toMetaMaskSmartAccount,
  createInfuraBundlerClient,
  type MetaMaskSmartAccount,
} from '@metamask/smart-accounts-kit';

// ============================================
// CONFIGURAÇÕES
// ============================================

const TOKEN_ADDRESS = '0xece94d3719fc6fde7275051a54caf1f7d5098d59' as Address;
const TOKEN_SYMBOL = 'NEOFLW';
const TOKEN_DECIMALS = 18;
const INFURA_API_KEY = process.env.INFURA_API_KEY || '';
const POLYGON_CHAIN_ID = 137;

// ABI do ERC-20
const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

// ============================================
// CLASSE DE INTEGRAÇÃO
// ============================================

export class NEOFlowOFFIntegration {
  private publicClient;
  private smartAccount: MetaMaskSmartAccount<Implementation> | null = null;
  private bundlerClient: ReturnType<typeof createInfuraBundlerClient> | null =
    null;

  constructor() {
    this.publicClient = createPublicClient({
      chain: polygon,
      transport: http(
        INFURA_API_KEY
          ? `https://polygon-mainnet.infura.io/v3/${INFURA_API_KEY}`
          : undefined
      ),
    });

    if (INFURA_API_KEY) {
      try {
        this.bundlerClient = createInfuraBundlerClient({
          chainId: POLYGON_CHAIN_ID,
          apiKey: INFURA_API_KEY,
        });
      } catch (error) {
        console.warn('Bundler não configurado:', error);
      }
    }
  }

  /**
   * Inicializa a Smart Account com o signer do MetaMask
   */
  async initializeSmartAccount(signer: any, walletAddress: Address) {
    this.smartAccount = await toMetaMaskSmartAccount({
      client: this.publicClient,
      implementation: Implementation.Hybrid,
      address: walletAddress,
      signer: { account: signer },
    });

    return this.smartAccount.address;
  }

  /**
   * Obtém o saldo do token para um endereço
   */
  async getBalance(address: Address): Promise<string> {
    const balance = await this.publicClient.readContract({
      address: TOKEN_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [address],
    });

    return formatUnits(balance, TOKEN_DECIMALS);
  }

  /**
   * Transfere tokens usando Smart Account
   */
  async transfer(to: Address, amount: string): Promise<string> {
    if (!this.smartAccount) {
      throw new Error('Smart Account não inicializada');
    }

    const amountWei = parseUnits(amount, TOKEN_DECIMALS);

    const calls = [
      {
        to: TOKEN_ADDRESS,
        data: this.smartAccount.encodeFunctionData({
          abi: ERC20_ABI,
          functionName: 'transfer',
          args: [to, amountWei],
        }),
      },
    ];

    if (this.bundlerClient) {
      // Gasless via UserOperation
      const userOpHash = await this.smartAccount.sendUserOperation({
        calls,
        bundlerClient: this.bundlerClient,
      });
      return userOpHash;
    } else {
      // Transação normal (requer gas)
      const hash = await this.smartAccount.sendTransaction({
        to: TOKEN_ADDRESS,
        data: this.smartAccount.encodeFunctionData({
          abi: ERC20_ABI,
          functionName: 'transfer',
          args: [to, amountWei],
        }),
      });
      return hash;
    }
  }

  /**
   * Batch transfer - transfere para múltiplos endereços
   */
  async batchTransfer(
    recipients: { to: Address; amount: string }[]
  ): Promise<string> {
    if (!this.smartAccount) {
      throw new Error('Smart Account não inicializada');
    }

    const calls = recipients.map(({ to, amount }) => ({
      to: TOKEN_ADDRESS,
      data: this.smartAccount.encodeFunctionData({
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [to, parseUnits(amount, TOKEN_DECIMALS)],
      }),
    }));

    if (this.bundlerClient) {
      const userOpHash = await this.smartAccount.sendUserOperation({
        calls,
        bundlerClient: this.bundlerClient,
      });
      return userOpHash;
    } else {
      throw new Error('Bundler necessário para batch operations');
    }
  }
}

// ============================================
// EXEMPLO DE USO NO WEBSITE
// ============================================

/**
 * Exemplo de uso em React/Next.js
 *
 * ```tsx
 * import { useAccount, useWalletClient } from 'wagmi';
 * import { NEOFlowOFFIntegration } from './integrate-token-website-example';
 *
 * function TokenTransfer() {
 *   const { address } = useAccount();
 *   const { data: walletClient } = useWalletClient();
 *   const [integration, setIntegration] = useState<NEOFlowOFFIntegration | null>(null);
 *   const [balance, setBalance] = useState<string>('0');
 *
 *   useEffect(() => {
 *     if (walletClient && address) {
 *       const integ = new NEOFlowOFFIntegration();
 *       integ.initializeSmartAccount(walletClient.account, address).then(() => {
 *         setIntegration(integ);
 *         integ.getBalance(address).then(setBalance);
 *       });
 *     }
 *   }, [walletClient, address]);
 *
 *   const handleTransfer = async () => {
 *     if (!integration) return;
 *
 *     const hash = await integration.transfer(
 *       '0x...', // endereço destino
 *       '100'    // quantidade
 *     );
 *
 *     console.log('Transferido:', hash);
 *   };
 *
 *   return (
 *     <div>
 *       <p>Saldo: {balance} NEOFLW</p>
 *       <button onClick={handleTransfer}>Transferir</button>
 *     </div>
 *   );
 * }
 * ```
 */

// ============================================
// EXEMPLO DE USO COM VANILLA JS
// ============================================

/**
 * Exemplo de uso com JavaScript puro
 *
 * ```javascript
 * // No seu HTML/JS
 * import { NEOFlowOFFIntegration } from './integrate-token-website-example';
 *
 * async function init() {
 *   // Conectar MetaMask
 *   const accounts = await window.ethereum.request({
 *     method: 'eth_requestAccounts'
 *   });
 *   const address = accounts[0];
 *
 *   // Criar integração
 *   const integration = new NEOFlowOFFIntegration();
 *   await integration.initializeSmartAccount(window.ethereum, address);
 *
 *   // Obter saldo
 *   const balance = await integration.getBalance(address);
 *   console.log('Saldo:', balance, 'NEOFLW');
 *
 *   // Transferir
 *   const hash = await integration.transfer(
 *     '0x...', // destino
 *     '100'    // quantidade
 *   );
 *   console.log('Transferido:', hash);
 * }
 * ```
 */

export default NEOFlowOFFIntegration;
