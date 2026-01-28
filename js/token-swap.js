/**
 * Token Swap Module - NEØ FlowOFF
 * 
 * Sistema de swap ETH → $NEOFLW usando Uniswap V3 na BASE
 * 
 * Rede: BASE Mainnet (chainId: 8453)
 * Token: 0x41F4ff3d45DED9C1332e4908F637B75fe83F5d6B
 * Router V3: 0x2626664c2603336E57B271c5C0b26F421741e481
 * 
 * @requires ethers@5
 * @requires @uniswap/sdk-core
 * @requires @uniswap/v3-sdk
 */

// Configuração BASE Mainnet
const BASE_CONFIG = {
  chainId: 8453,
  rpcUrl: 'https://mainnet.base.org',
  explorer: 'https://basescan.org',
  
  // Contratos Uniswap V3 na BASE
  router: '0x2626664c2603336E57B271c5C0b26F421741e481', // SwapRouter02
  factory: '0x33128a8fC17869897dcE68Ed026d694621f6FDfD',
  quoter: '0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a', // QuoterV2
  
  // Tokens
  WETH: '0x4200000000000000000000000000000000000006', // WETH na BASE
  NEOFLW: '0x41F4ff3d45DED9C1332e4908F637B75fe83F5d6B',
  
  // Pool fee tiers (em basis points)
  feeTiers: {
    LOW: 500,      // 0.05%
    MEDIUM: 3000,  // 0.3%
    HIGH: 10000,   // 1%
  },
};

// ABI mínimo para interação
const ROUTER_ABI = [
  'function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)',
  'function multicall(uint256 deadline, bytes[] calldata data) external payable returns (bytes[] memory)',
];

const QUOTER_ABI = [
  'function quoteExactInputSingle((address tokenIn, address tokenOut, uint256 amountIn, uint24 fee, uint160 sqrtPriceLimitX96)) external returns (uint256 amountOut, uint160 sqrtPriceX96After, uint32 initializedTicksCrossed, uint256 gasEstimate)',
];

const ERC20_ABI = [
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function balanceOf(address account) external view returns (uint256)',
  'function decimals() external view returns (uint8)',
  'function symbol() external view returns (string)',
];

/**
 * Token Swap Manager
 */
class TokenSwap {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.config = BASE_CONFIG;
  }

  /**
   * Inicializa conexão com wallet
   */
  async init() {
    if (!window.ethereum) {
      throw new Error('MetaMask não detectado');
    }

    // Importar ethers v5 dinamicamente
    const { ethers } = await import('https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.esm.min.js');
    
    this.provider = new ethers.providers.Web3Provider(window.ethereum);
    const network = await this.provider.getNetwork();
    
    // Verificar se está na rede correta
    if (network.chainId !== this.config.chainId) {
      await this.switchToBase();
    }
    
    this.signer = this.provider.getSigner();
    window.Logger?.info('TokenSwap inicializado na BASE');
  }

  /**
   * Trocar de rede para BASE
   */
  async switchToBase() {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${this.config.chainId.toString(16)}` }],
      });
    } catch (error) {
      // Se a rede não estiver adicionada, adicionar
      if (error.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: `0x${this.config.chainId.toString(16)}`,
            chainName: 'BASE Mainnet',
            nativeCurrency: {
              name: 'Ethereum',
              symbol: 'ETH',
              decimals: 18,
            },
            rpcUrls: [this.config.rpcUrl],
            blockExplorerUrls: [this.config.explorer],
          }],
        });
      } else {
        throw error;
      }
    }
  }

  /**
   * Obter cotação do swap (quantos NEOFLW por X ETH)
   * @param {string} amountIn - Quantidade de ETH em wei ou string (ex: "0.01")
   * @param {number} feeTier - Fee tier (500, 3000, 10000)
   * @returns {Promise<{amountOut: string, priceImpact: number}>}
   */
  async getQuote(amountIn, feeTier = this.config.feeTiers.MEDIUM) {
    if (!this.provider) await this.init();
    
    const { ethers } = await import('https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.esm.min.js');
    
    // Converter para wei se necessário
    const amountInWei = typeof amountIn === 'string' && !amountIn.includes('0x')
      ? ethers.utils.parseEther(amountIn)
      : ethers.BigNumber.from(amountIn);

    const quoter = new ethers.Contract(
      this.config.quoter,
      QUOTER_ABI,
      this.provider
    );

    try {
      // QuoterV2 usa struct como parâmetro
      const quote = await quoter.callStatic.quoteExactInputSingle({
        tokenIn: this.config.WETH,
        tokenOut: this.config.NEOFLW,
        amountIn: amountInWei,
        fee: feeTier,
        sqrtPriceLimitX96: 0,
      });

      const amountOut = quote.amountOut || quote[0]; // Compatibilidade com diferentes versões
      
      return {
        amountOut: ethers.utils.formatUnits(amountOut, 18),
        amountOutWei: amountOut.toString(),
        priceImpact: 0, // Calculado no frontend se necessário
        gasEstimate: quote.gasEstimate?.toString() || 'N/A',
      };
    } catch (error) {
      window.Logger?.error('Erro ao obter cotação:', error);
      throw new Error(`Falha na cotação: ${error.message}`);
    }
  }

  /**
   * Executar swap de ETH para NEOFLW
   * @param {string} amountIn - Quantidade de ETH (ex: "0.01")
   * @param {number} slippageTolerance - Tolerância de slippage (0.5 = 0.5%)
   * @param {number} feeTier - Fee tier do pool
   * @returns {Promise<{tx: any, amountOut: string}>}
   */
  async swapETHForNEOFLW(amountIn, slippageTolerance = 0.5, feeTier = this.config.feeTiers.MEDIUM) {
    if (!this.signer) await this.init();
    
    const { ethers } = await import('https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.esm.min.js');
    
    // 1. Obter cotação
    const quote = await this.getQuote(amountIn, feeTier);
    
    // 2. Calcular amount out mínimo com slippage
    const amountOutMin = ethers.BigNumber.from(quote.amountOutWei)
      .mul(10000 - Math.floor(slippageTolerance * 100))
      .div(10000);
    
    // 3. Preparar parâmetros do swap
    const amountInWei = ethers.utils.parseEther(amountIn);
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutos
    const userAddress = await this.signer.getAddress();

    const router = new ethers.Contract(
      this.config.router,
      ROUTER_ABI,
      this.signer
    );

    // 4. Executar swap
    try {
      const params = {
        tokenIn: this.config.WETH,
        tokenOut: this.config.NEOFLW,
        fee: feeTier,
        recipient: userAddress,
        amountIn: amountInWei,
        amountOutMinimum: amountOutMin,
        sqrtPriceLimitX96: 0,
      };

      window.Logger?.info('Executando swap:', {
        amountIn: amountIn,
        expectedOut: quote.amountOut,
        minOut: ethers.utils.formatUnits(amountOutMin, 18),
        slippage: slippageTolerance + '%',
      });

      const tx = await router.exactInputSingle(params, {
        value: amountInWei,
        gasLimit: 300000, // Gas limit estimado
      });

      window.Logger?.info('Transação enviada:', tx.hash);
      
      // Aguardar confirmação
      const receipt = await tx.wait();
      
      window.Logger?.info('Swap concluído:', {
        txHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
      });

      return {
        tx: receipt,
        amountOut: quote.amountOut,
        txHash: receipt.transactionHash,
        explorer: `${this.config.explorer}/tx/${receipt.transactionHash}`,
      };
    } catch (error) {
      window.Logger?.error('Erro no swap:', error);
      
      // Mensagens de erro amigáveis
      if (error.code === 4001) {
        throw new Error('Transação cancelada pelo usuário');
      } else if (error.code === -32603) {
        throw new Error('Saldo insuficiente ou pool sem liquidez');
      } else {
        throw new Error(`Falha no swap: ${error.message}`);
      }
    }
  }

  /**
   * Obter saldo de NEOFLW do usuário
   * @param {string} address - Endereço da wallet
   * @returns {Promise<string>} Saldo formatado
   */
  async getNEOFLWBalance(address) {
    if (!this.provider) await this.init();
    
    const { ethers } = await import('https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.esm.min.js');
    
    const token = new ethers.Contract(
      this.config.NEOFLW,
      ERC20_ABI,
      this.provider
    );

    const balance = await token.balanceOf(address);
    return ethers.utils.formatUnits(balance, 18);
  }

  /**
   * Obter preço atual (NEOFLW por ETH)
   * @param {number} feeTier - Fee tier do pool
   * @returns {Promise<string>}
   */
  async getCurrentPrice(feeTier = this.config.feeTiers.MEDIUM) {
    const quote = await this.getQuote('1', feeTier); // 1 ETH
    return quote.amountOut;
  }
}

// Exportar instância global
if (typeof window !== 'undefined') {
  window.TokenSwap = new TokenSwap();
}

export default TokenSwap;
