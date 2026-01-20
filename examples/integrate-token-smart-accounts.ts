/**
 * Script de Integração: Token NEOFlowOFF com MetaMask Smart Accounts
 *
 * Este script demonstra como integrar o token ERC-20 com Account Abstraction
 * usando o MetaMask Smart Accounts Kit
 *
 * Uso:
 * npx tsx integrate-token-smart-accounts.ts
 */

import {
  createPublicClient,
  createWalletClient,
  http,
  type Address,
  formatUnits,
  parseUnits,
} from 'viem';
import { polygon } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import {
  Implementation,
  toMetaMaskSmartAccount,
  createInfuraBundlerClient,
  type MetaMaskSmartAccount,
} from '@metamask/smart-accounts-kit';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// ============================================
// CONFIGURAÇÕES DO TOKEN
// ============================================

const TOKEN_ADDRESS = '0xece94d3719fc6fde7275051a54caf1f7d5098d59' as Address;
const TOKEN_NAME = 'NEOFlowOFF';
const TOKEN_SYMBOL = 'NEOFLW';
const TOKEN_DECIMALS = 18;

// ABI básico do ERC-20
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
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'totalSupply',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

// ============================================
// CONFIGURAÇÕES
// ============================================

const WALLET_ADDRESS = '0x460F9D0cf3e6E84faC1A7Abc524ddfa66fb64f60' as Address;

// Garante que a private key está no formato correto (Hex)
const PRIVATE_KEY_RAW = process.env.PRIVATE_KEY || '';
let PRIVATE_KEY: `0x${string}` | undefined;

if (PRIVATE_KEY_RAW) {
  // Remove 0x se existir para processar
  const keyWithoutPrefix = PRIVATE_KEY_RAW.startsWith('0x')
    ? PRIVATE_KEY_RAW.slice(2)
    : PRIVATE_KEY_RAW;

  // Adiciona zeros à esquerda se necessário (deve ter 64 chars hex = 32 bytes)
  const paddedKey = keyWithoutPrefix.padStart(64, '0');

  // Adiciona prefixo 0x
  PRIVATE_KEY = `0x${paddedKey}` as `0x${string}`;
}

// Web3Auth fornece RPC e Bundler próprios - não precisa de Infura!
// URLs do Web3Auth (obtenha no dashboard após configurar a chain)
const WEB3AUTH_RPC_URL = process.env.WEB3AUTH_RPC_URL || '';
const WEB3AUTH_BUNDLER_URL = process.env.WEB3AUTH_BUNDLER_URL || '';
// Fallback: Infura é opcional - só necessário se não usar Web3Auth RPC/Bundler
const INFURA_API_KEY = process.env.INFURA_API_KEY || '';
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY || '';
const ALCHEMY_API_URL = process.env.ALCHEMY_API_URL || '';
const POLYGON_CHAIN_ID = 137;

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

/**
 * Obtém o saldo do token para um endereço
 */
async function getTokenBalance(
  publicClient: ReturnType<typeof createPublicClient>,
  tokenAddress: Address,
  accountAddress: Address
): Promise<string> {
  const balance = await publicClient.readContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [accountAddress],
  });

  return formatUnits(balance, TOKEN_DECIMALS);
}

/**
 * Obtém o total supply do token
 */
async function getTotalSupply(
  publicClient: ReturnType<typeof createPublicClient>,
  tokenAddress: Address
): Promise<string> {
  const supply = await publicClient.readContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'totalSupply',
    args: [],
  });

  return formatUnits(supply, TOKEN_DECIMALS);
}

/**
 * Transfere tokens usando Smart Account
 */
async function transferTokens(
  smartAccount: MetaMaskSmartAccount<Implementation>,
  bundlerClient: ReturnType<typeof createInfuraBundlerClient> | undefined,
  to: Address,
  amount: string
): Promise<string> {
  const amountWei = parseUnits(amount, TOKEN_DECIMALS);

  const calls = [
    {
      to: TOKEN_ADDRESS,
      data: smartAccount.encodeCalls([
        {
          to: TOKEN_ADDRESS,
          data: smartAccount.encodeFunctionData({
            abi: ERC20_ABI,
            functionName: 'transfer',
            args: [to, amountWei],
          }),
        },
      ]),
    },
  ];

  if (bundlerClient) {
    // Usa UserOperation via Bundler (gasless)
    const userOpHash = await smartAccount.sendUserOperation({
      calls,
      bundlerClient,
    });

    console.log(`   ✅ UserOperation enviada: ${userOpHash}`);
    return userOpHash;
  } else {
    // Fallback: transação normal (requer gas)
    const hash = await smartAccount.sendTransaction({
      to: TOKEN_ADDRESS,
      data: smartAccount.encodeFunctionData({
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [to, amountWei],
      }),
    });

    console.log(`   ✅ Transação enviada: ${hash}`);
    return hash;
  }
}

/**
 * Aprova tokens usando Smart Account
 */
async function approveTokens(
  smartAccount: MetaMaskSmartAccount<Implementation>,
  bundlerClient: ReturnType<typeof createInfuraBundlerClient> | undefined,
  spender: Address,
  amount: string
): Promise<string> {
  const amountWei = parseUnits(amount, TOKEN_DECIMALS);

  const calls = [
    {
      to: TOKEN_ADDRESS,
      data: smartAccount.encodeCalls([
        {
          to: TOKEN_ADDRESS,
          data: smartAccount.encodeFunctionData({
            abi: ERC20_ABI,
            functionName: 'approve',
            args: [spender, amountWei],
          }),
        },
      ]),
    },
  ];

  if (bundlerClient) {
    const userOpHash = await smartAccount.sendUserOperation({
      calls,
      bundlerClient,
    });

    console.log(`   ✅ Approval UserOperation enviada: ${userOpHash}`);
    return userOpHash;
  } else {
    const hash = await smartAccount.sendTransaction({
      to: TOKEN_ADDRESS,
      data: smartAccount.encodeFunctionData({
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [spender, amountWei],
      }),
    });

    console.log(`   ✅ Approval transação enviada: ${hash}`);
    return hash;
  }
}

// ============================================
// FUNÇÃO PRINCIPAL
// ============================================

async function main() {
  console.log('🚀 Integração: Token NEOFlowOFF com MetaMask Smart Accounts\n');
  console.log('='.repeat(70));
  console.log('Token:', TOKEN_NAME, `(${TOKEN_SYMBOL})`);
  console.log('Endereço:', TOKEN_ADDRESS);
  console.log('Rede: Polygon');
  console.log('='.repeat(70) + '\n');

  if (!PRIVATE_KEY || !PRIVATE_KEY_RAW) {
    console.error('❌ ERRO: PRIVATE_KEY não encontrada no .env.local');
    console.error('   Configure PRIVATE_KEY no arquivo .env.local');
    return;
  }

  // Validação da private key
  const privateKeyHex = PRIVATE_KEY.replace('0x', '');
  if (privateKeyHex.length !== 64) {
    console.error('❌ ERRO: PRIVATE_KEY inválida');
    console.error(`   Esperado: 64 caracteres hex (32 bytes)`);
    console.error(`   Recebido: ${privateKeyHex.length} caracteres`);
    console.error('   Exemplo correto: 0x1234567890abcdef... (64 chars hex)');
    return;
  }

  // Configuração dos clientes
  // Prioridade: Web3Auth RPC > Alchemy > Infura > RPC público
  const rpcUrl = WEB3AUTH_RPC_URL
    ? WEB3AUTH_RPC_URL
    : ALCHEMY_API_URL
      ? ALCHEMY_API_URL
      : INFURA_API_KEY
        ? `https://polygon-mainnet.infura.io/v3/${INFURA_API_KEY}`
        : 'https://polygon-rpc.com'; // RPC público como fallback

  const publicClient = createPublicClient({
    chain: polygon,
    transport: http(rpcUrl),
  });

  const account = privateKeyToAccount(PRIVATE_KEY);

  // PASSO 1: Criar Smart Account
  console.log('📋 PASSO 1: Criando MetaMask Smart Account...');
  const smartAccount = await toMetaMaskSmartAccount({
    client: publicClient,
    implementation: Implementation.Hybrid,
    address: WALLET_ADDRESS,
    signer: { account },
  });

  console.log(`   ✅ Smart Account criada: ${smartAccount.address}`);
  console.log(
    `   ✅ Environment: ${smartAccount.environment?.name || 'N/A'}\n`
  );

  // PASSO 2: Configurar Bundler (opcional, mas recomendado para gasless)
  console.log('📋 PASSO 2: Configurando Bundler...');
  let bundlerClient;

  // Prioridade: Web3Auth Bundler > Infura Bundler
  if (WEB3AUTH_BUNDLER_URL) {
    console.log('   ✅ Web3Auth Bundler URL configurada');
    console.log(
      '   ⚠️  Bundler customizado do Web3Auth ainda não implementado'
    );
    console.log(
      '   💡 Por enquanto, usando Infura como fallback se disponível\n'
    );
  }

  if (INFURA_API_KEY) {
    try {
      bundlerClient = createInfuraBundlerClient({
        chainId: POLYGON_CHAIN_ID,
        apiKey: INFURA_API_KEY,
      });
      console.log(
        '   ✅ Bundler Infura configurado (gasless transactions disponível)\n'
      );
    } catch (error: any) {
      console.warn(`   ⚠️  Erro ao configurar bundler: ${error.message}`);
      console.log('   ℹ️  Continuando sem bundler (transações normais)\n');
    }
  } else if (!WEB3AUTH_BUNDLER_URL) {
    console.log('   ⚠️  Bundler não configurado');
    console.log(
      '   💡 Configure WEB3AUTH_BUNDLER_URL ou INFURA_API_KEY para transações gasless'
    );
    console.log('   ℹ️  Usando transações normais (requer gas)\n');
  }

  // PASSO 3: Verificar informações do token
  console.log('📋 PASSO 3: Verificando informações do token...');
  try {
    const totalSupply = await getTotalSupply(publicClient, TOKEN_ADDRESS);
    const balance = await getTokenBalance(
      publicClient,
      TOKEN_ADDRESS,
      smartAccount.address
    );

    console.log(`   ✅ Total Supply: ${totalSupply} ${TOKEN_SYMBOL}`);
    console.log(`   ✅ Seu saldo: ${balance} ${TOKEN_SYMBOL}\n`);
  } catch (error: any) {
    console.error(`   ❌ Erro ao verificar token: ${error.message}\n`);
  }

  // PASSO 4: Exemplos de uso
  console.log('📋 PASSO 4: Exemplos de integração disponíveis\n');
  console.log('   📝 Funções disponíveis:');
  console.log('      - getTokenBalance() - Obter saldo do token');
  console.log(
    '      - transferTokens() - Transferir tokens (via Smart Account)'
  );
  console.log('      - approveTokens() - Aprovar tokens para spender');
  console.log('      - getTotalSupply() - Obter total supply\n');

  console.log('   💡 Para usar no seu site:');
  console.log('      1. Use o Smart Account para todas as operações');
  console.log('      2. Configure bundler para transações gasless');
  console.log('      3. Use encodeCalls para batch operations');
  console.log('      4. Integre com MetaMask para assinaturas\n');

  // Resumo
  console.log('='.repeat(70));
  console.log('✅ Integração Configurada!');
  console.log('='.repeat(70));
  console.log('\n📦 Próximos passos:');
  console.log(
    '   1. Veja o exemplo em: examples/integrate-token-website-example.ts'
  );
  console.log('   2. Use o Smart Account para todas as operações do token');
  console.log('   3. Configure bundler para melhor UX (gasless)');
  console.log('   4. Integre com frontend usando wagmi ou viem\n');
  console.log('🔗 Links úteis:');
  console.log(`   Token: https://polygonscan.com/token/${TOKEN_ADDRESS}`);
  console.log(`   Wallet: https://polygonscan.com/address/${WALLET_ADDRESS}`);
  console.log('   Docs: https://docs.gator.metamask.io\n');
  console.log('='.repeat(70) + '\n');
}

main().catch(console.error);
