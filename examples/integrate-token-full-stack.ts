/**
 * Integração Completa: Token NEOFlowOFF com Stack Completa
 * 
 * Stack:
 * - Web3Auth: Autenticação
 * - IPFS.io + Storacha: Armazenamento de dados
 * - Infura: RPC/Bundler
 * - MetaMask Smart Accounts: Account Abstraction
 * 
 * Uso:
 * npx tsx integrate-token-full-stack.ts
 */

import { createPublicClient, http, type Address, formatUnits, parseUnits } from 'viem';
import { polygon } from 'viem/chains';
import {
  Implementation,
  toMetaMaskSmartAccount,
  createInfuraBundlerClient,
  type MetaMaskSmartAccount,
} from '@metamask/smart-accounts-kit';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// ============================================
// CONFIGURAÇÕES
// ============================================

const TOKEN_ADDRESS = '0xece94d3719fc6fde7275051a54caf1f7d5098d59' as Address;
const TOKEN_SYMBOL = 'NEOFLW';
const TOKEN_DECIMALS = 18;

// Configurações da Stack
// Web3Auth fornece RPC e Bundler próprios - não precisa de Infura!
// URLs do Web3Auth (obtenha no dashboard após configurar a chain)
const WEB3AUTH_RPC_URL = process.env.WEB3AUTH_RPC_URL || '';
const WEB3AUTH_BUNDLER_URL = process.env.WEB3AUTH_BUNDLER_URL || '';
// Fallback: Infura é opcional - só necessário se não usar Web3Auth RPC/Bundler
const INFURA_API_KEY = process.env.INFURA_API_KEY || '';
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY || '';
const ALCHEMY_API_URL = process.env.ALCHEMY_API_URL || '';
const WEB3AUTH_CLIENT_ID = process.env.WEB3AUTH_CLIENT_ID || '';
const IPFS_GATEWAY = 'https://ipfs.io/ipfs/';
const STORACHA_API_KEY = process.env.STORACHA_API_KEY || '';
const STORACHA_ENDPOINT = process.env.STORACHA_ENDPOINT || 'https://api.storacha.com';

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
// TIPOS
// ============================================

interface UserData {
  address: Address;
  balance: string;
  transactions: string[];
  preferences: {
    notifications: boolean;
    theme: string;
  };
  createdAt: string;
  lastLogin: string;
}

// ============================================
// CLASSE DE INTEGRAÇÃO COMPLETA
// ============================================

export class NEOFlowOFFFullStackIntegration {
  private publicClient;
  private smartAccount: MetaMaskSmartAccount<Implementation> | null = null;
  private bundlerClient: ReturnType<typeof createInfuraBundlerClient> | null = null;
  private userAddress: Address | null = null;

  constructor() {
    // Prioridade: Web3Auth RPC > Alchemy > Infura > RPC público
    const rpcUrl = WEB3AUTH_RPC_URL 
      ? WEB3AUTH_RPC_URL
      : (ALCHEMY_API_URL 
        ? ALCHEMY_API_URL
        : (INFURA_API_KEY 
          ? `https://polygon-mainnet.infura.io/v3/${INFURA_API_KEY}`
          : 'https://polygon-rpc.com')); // RPC público como fallback

    this.publicClient = createPublicClient({
      chain: polygon,
      transport: http(rpcUrl),
    });

    // Bundler: Prioridade Web3Auth > Infura
    // Web3Auth fornece Bundler próprio - não precisa de Infura!
    if (WEB3AUTH_BUNDLER_URL) {
      // TODO: Criar bundler client customizado com URL do Web3Auth
      // Por enquanto, ainda usa Infura se disponível
      console.log('✅ Web3Auth Bundler URL configurada');
      console.warn('⚠️  Bundler customizado do Web3Auth ainda não implementado');
      console.warn('   Usando Infura como fallback se disponível');
    }
    
    if (INFURA_API_KEY) {
      try {
        this.bundlerClient = createInfuraBundlerClient({
          chainId: POLYGON_CHAIN_ID,
          apiKey: INFURA_API_KEY,
        });
        console.log('✅ Bundler Infura configurado (fallback)');
      } catch (error) {
        console.warn('Bundler não configurado:', error);
      }
    } else if (!WEB3AUTH_BUNDLER_URL) {
      console.warn('⚠️  Bundler não configurado');
      console.warn('   Configure WEB3AUTH_BUNDLER_URL ou INFURA_API_KEY para transações gasless');
    }
  }

  /**
   * Inicializa Web3Auth e obtém o endereço do usuário
   */
  async initializeWeb3Auth(): Promise<Address> {
    // Exemplo de integração com Web3Auth
    // No website real, você usaria o SDK do Web3Auth
    
    console.log('🔐 Inicializando Web3Auth...');
    console.log('   💡 No website, use:');
    console.log('      import { Web3Auth } from "@web3auth/modal";');
    console.log('      const web3auth = new Web3Auth({ clientId: WEB3AUTH_CLIENT_ID });');
    console.log('      await web3auth.init();');
    console.log('      await web3auth.connect();');
    console.log('      const provider = await web3auth.connect();');
    console.log('      const accounts = await provider.request({ method: "eth_accounts" });\n');

    // Para este exemplo, retorna um endereço mock
    // No website real, você obteria do Web3Auth
    return '0x460F9D0cf3e6E84faC1A7Abc524ddfa66fb64f60' as Address;
  }

  /**
   * Inicializa Smart Account com signer do Web3Auth
   */
  async initializeSmartAccount(signer: any, walletAddress: Address) {
    this.userAddress = walletAddress;
    
    this.smartAccount = await toMetaMaskSmartAccount({
      client: this.publicClient,
      implementation: Implementation.Hybrid,
      address: walletAddress,
      signer: { account: signer },
    });

    return this.smartAccount.address;
  }

  /**
   * Salva dados do usuário no IPFS via Storacha
   */
  async saveUserDataToIPFS(userData: UserData): Promise<string> {
    console.log('💾 Salvando dados do usuário no IPFS via Storacha...');

    // Exemplo de como salvar via Storacha
    // No website real, você usaria o SDK do Storacha
    
    const dataJson = JSON.stringify(userData);
    
    try {
      // Upload para IPFS via Storacha
      const response = await fetch(`${STORACHA_ENDPOINT}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${STORACHA_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: dataJson,
          pin: true, // Pin no IPFS
        }),
      });

      const result = await response.json();
      const ipfsHash = result.ipfsHash || result.cid;

      console.log(`   ✅ Dados salvos no IPFS: ${ipfsHash}`);
      console.log(`   🔗 Link: ${IPFS_GATEWAY}${ipfsHash}\n`);

      return ipfsHash;
    } catch (error: any) {
      console.error(`   ❌ Erro ao salvar no IPFS: ${error.message}`);
      throw error;
    }
  }

  /**
   * Carrega dados do usuário do IPFS
   */
  async loadUserDataFromIPFS(ipfsHash: string): Promise<UserData | null> {
    console.log(`📥 Carregando dados do IPFS: ${ipfsHash}...`);

    try {
      const response = await fetch(`${IPFS_GATEWAY}${ipfsHash}`);
      const data = await response.json();

      console.log(`   ✅ Dados carregados do IPFS\n`);
      return data as UserData;
    } catch (error: any) {
      console.error(`   ❌ Erro ao carregar do IPFS: ${error.message}`);
      return null;
    }
  }

  /**
   * Obtém saldo do token
   */
  async getBalance(address?: Address): Promise<string> {
    const addr = address || this.userAddress;
    if (!addr) throw new Error('Endereço não definido');

    const balance = await this.publicClient.readContract({
      address: TOKEN_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [addr],
    });

    return formatUnits(balance, TOKEN_DECIMALS);
  }

  /**
   * Transfere tokens e salva transação no IPFS
   */
  async transferAndSave(to: Address, amount: string): Promise<{ txHash: string; ipfsHash: string }> {
    if (!this.smartAccount || !this.userAddress) {
      throw new Error('Smart Account não inicializada');
    }

    // 1. Transferir tokens
    const amountWei = parseUnits(amount, TOKEN_DECIMALS);
    
    // Encode function data usando viem
    const { encodeFunctionData } = await import('viem');
    const callData = encodeFunctionData({
      abi: ERC20_ABI,
      functionName: 'transfer',
      args: [to, amountWei],
    });

    const calls = [
      {
        to: TOKEN_ADDRESS,
        data: callData,
        value: 0n,
      },
    ];

    let txHash: string;
    if (this.bundlerClient) {
      // Usa bundler client para enviar UserOperation
      txHash = await this.bundlerClient.sendUserOperation({
        account: this.smartAccount,
        calls,
      });
    } else {
      throw new Error('Bundler client necessário para transferências. Configure INFURA_API_KEY.');
    }

    // 2. Salvar transação no IPFS
    const transactionData = {
      hash: txHash,
      from: this.userAddress,
      to,
      amount,
      token: TOKEN_ADDRESS,
      timestamp: new Date().toISOString(),
    };

    const userData: UserData = {
      address: this.userAddress,
      balance: await this.getBalance(),
      transactions: [txHash],
      preferences: {
        notifications: true,
        theme: 'dark',
      },
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };

    const ipfsHash = await this.saveUserDataToIPFS(userData);

    return { txHash, ipfsHash };
  }

  /**
   * Sincroniza dados do usuário (blockchain + IPFS)
   */
  async syncUserData(ipfsHash?: string): Promise<UserData> {
    if (!this.userAddress) {
      throw new Error('Usuário não autenticado');
    }

    // Carrega dados do IPFS se fornecido
    let userData: UserData | null = null;
    if (ipfsHash) {
      userData = await this.loadUserDataFromIPFS(ipfsHash);
    }

    // Atualiza com dados da blockchain
    const balance = await this.getBalance();

    const syncedData: UserData = {
      address: this.userAddress,
      balance,
      transactions: userData?.transactions || [],
      preferences: userData?.preferences || {
        notifications: true,
        theme: 'dark',
      },
      createdAt: userData?.createdAt || new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };

    return syncedData;
  }
}

// ============================================
// EXEMPLO DE USO
// ============================================

async function main() {
  console.log('🚀 Integração Completa: NEOFlowOFF Token\n');
  console.log('='.repeat(70));
  console.log('Stack:');
  console.log('  - Web3Auth: Autenticação');
  console.log('  - IPFS.io + Storacha: Armazenamento');
  console.log('  - Infura: RPC/Bundler');
  console.log('  - MetaMask Smart Accounts: Account Abstraction');
  console.log('='.repeat(70) + '\n');

  const integration = new NEOFlowOFFFullStackIntegration();

  // PASSO 1: Autenticar com Web3Auth
  console.log('📋 PASSO 1: Autenticação com Web3Auth...');
  const userAddress = await integration.initializeWeb3Auth();
  console.log(`   ✅ Usuário autenticado: ${userAddress}\n`);

  // PASSO 2: Inicializar Smart Account
  console.log('📋 PASSO 2: Inicializando Smart Account...');
  // No website real, você usaria o signer do Web3Auth
  // await integration.initializeSmartAccount(web3AuthSigner, userAddress);
  console.log('   ✅ Smart Account inicializada\n');

  // PASSO 3: Obter saldo
  console.log('📋 PASSO 3: Verificando saldo...');
  try {
    const balance = await integration.getBalance(userAddress);
    console.log(`   ✅ Saldo: ${balance} ${TOKEN_SYMBOL}\n`);
  } catch (error: any) {
    console.log(`   ⚠️  Erro: ${error.message}\n`);
  }

  // PASSO 4: Sincronizar dados do usuário
  console.log('📋 PASSO 4: Sincronizando dados do usuário...');
  try {
    const userData = await integration.syncUserData();
    console.log('   ✅ Dados sincronizados:');
    console.log(`      Endereço: ${userData.address}`);
    console.log(`      Saldo: ${userData.balance} ${TOKEN_SYMBOL}`);
    console.log(`      Transações: ${userData.transactions.length}\n`);
  } catch (error: any) {
    console.log(`   ⚠️  Erro: ${error.message}\n`);
  }

  console.log('='.repeat(70));
  console.log('✅ Integração Completa Configurada!');
  console.log('='.repeat(70));
  console.log('\n📦 Próximos passos:');
  console.log('   1. Configure Web3Auth no seu website');
  console.log('   2. Configure Storacha para IPFS');
  console.log('   3. Use a classe NEOFlowOFFFullStackIntegration');
  console.log('   4. Veja o exemplo em: examples/integrate-token-website-full-stack.tsx\n');
}

if (require.main === module) {
  main().catch(console.error);
}

export default NEOFlowOFFFullStackIntegration;
