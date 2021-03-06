/*==================================================
  Modules
  ==================================================*/

const sdk = require("../../sdk");
const abi = require("./abi.json");
const BigNumber = require("bignumber.js");
const ERROR = BigNumber(
  "3963877391197344453575983046348115674221700746820753546331534351508065746944"
);

/*==================================================
  TVL
  ==================================================*/

const pTokens = {
  "psCRV-v2": {
    underlying: "crvPlain3",
    decimals: 18,
    contract: "0x68d14d66B2B0d6E157c06Dc8Fefa3D8ba0e66a89",
    created: 10960582,
  },
  prenCRV: {
    underlying: "crvRenWBTC",
    decimals: 18,
    contract: "0x2E35392F4c36EBa7eCAFE4de34199b2373Af22ec",
    created: 11010899,
  },
  p3CRV: {
    underlying: "3Crv",
    decimals: 18,
    contract: "0x1BB74b5DdC1f4fC91D6f9E7906cf68bc93538e33",
    created: 11010886,
  },
  "pUNIETHDAI-v2": {
    underlying: "UNIV2_ETH_DAI",
    decimals: 18,
    contract: "0xCffA068F1E44D98D3753966eBd58D4CFe3BB5162",
    created: 10960589,
  },
  "pUNIUSDC-v2": {
    underlying: "UNIV2_ETH_USDC",
    decimals: 18,
    contract: "0x53Bf2E62fA20e2b4522f05de3597890Ec1b352C6",
    created: 10960600,
  },
  "pUNIUSDT-v2": {
    underlying: "UNIV2_ETH_USDT",
    decimals: 18,
    contract: "0x09FC573c502037B149ba87782ACC81cF093EC6ef",
    created: 10960613,
  },
  pUNIWBTC: {
    underlying: "UNIV2_ETH_WBTC",
    decimals: 18,
    contract: "0xc80090AA05374d336875907372EE4ee636CBC562",
    created: 11010903,
  },
  pDAI: {
    underlying: "DAI",
    decimals: 18,
    contract: "0x6949Bb624E8e8A90F87cD2058139fcd77D2F3F87",
    created: 11044219,
  },
};

const uniPools = {
  UNIV2_ETH_DAI: {
    contract: "0xA478c2975Ab1Ea89e8196811F51A7B7Ade33eB11",
    created: 10042267,
    token0: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    token1: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  },
  UNIV2_ETH_USDC: {
    contract: "0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc",
    created: 10008355,
    token0: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    token1: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  },
  UNIV2_ETH_USDT: {
    contract: "0x0d4a11d5EEaaC28EC3F61d100daF4d40471f1852",
    created: 10093341,
    token0: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    token1: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
  },
  UNIV2_ETH_WBTC: {
    contract: "0xBb2b8038a1640196FbE3e38816F3e67Cba72D940",
    created: 10091097,
    token0: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
    token1: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  },
};

async function tvl(timestamp, block) {
  const [
    psCRV,
    prenCRV,
    p3CRV,
    pUNIDAI,
    pUNIUSDC,
    pUNIUSDT,
    pUNIWBTC,
    pDAI,
  ] = await Promise.all([
    getUnderlying("psCRV-v2", block),
    getUnderlying("prenCRV", block),
    getUnderlying("p3CRV", block),
    getUniswapUnderlying("pUNIETHDAI-v2", block),
    getUniswapUnderlying("pUNIUSDC-v2", block),
    getUniswapUnderlying("pUNIUSDT-v2", block),
    getUniswapUnderlying("pUNIWBTC", block),
    getUnderlying("pDAI", block),
  ]);

  let balances = {
    // WETH
    "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2": pUNIDAI[1]
      .plus(pUNIUSDC[1])
      .plus(pUNIUSDT[0])
      .plus(pUNIWBTC[1])
      .toFixed(18),

    // DAI
    "0x6B175474E89094C44Da98b954EedeAC495271d0F": pDAI
      .plus(pUNIDAI[0])
      .plus(psCRV) // Estimate
      .plus(p3CRV) // Estimate
      .toFixed(18),

    // USDC
    "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48": pUNIUSDC[0].toFixed(6),

    // USDT
    "0xdAC17F958D2ee523a2206206994597C13D831ec7": pUNIUSDT[1].toFixed(6),

    // WBTC
    "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599": pUNIWBTC[0].toFixed(8),

    // RenBTC
    "0xEB4C2781e4ebA804CE9a9803C67d0893436bB27D": prenCRV
      .times(BigNumber("10").pow(-10))
      .toFixed(8),
  };
  return balances;
}

async function getUnderlying(token, block) {
  if (block > pTokens[token].created) {
    try {
      const balance = await sdk.api.abi.call({
        block,
        target: pTokens[token].contract,
        abi: abi["balance"],
      });
  
      return BigNumber(balance.output);
    } catch (e) {
      return BigNumber(0);
    }

  }
  return BigNumber(0);
}

async function getUniswapUnderlying(token, block) {
  if (block > pTokens[token].created) {
    try {
      const underlyingPool = uniPools[pTokens[token].underlying];

      const [totalSupply, reserves, balance] = await Promise.all([
        sdk.api.abi.call({
          block,
          target: underlyingPool.contract,
          abi: "erc20:totalSupply",
        }),
        sdk.api.abi.call({
          block,
          target: underlyingPool.contract,
          abi: abi["getReserves"],
        }),
        sdk.api.abi.call({
          block,
          target: pTokens[token].contract,
          abi: abi["balance"],
        }),
      ]);
  
      const poolUnderlyingReservesToken0 = BigNumber(reserves.output[0]);
      const poolUnderlyingReservesToken1 = BigNumber(reserves.output[1]);
      const poolFraction = BigNumber(balance.output).div(
        BigNumber(totalSupply.output)
      );
  
      if (!poolFraction.isNaN() && !poolFraction.isEqualTo(ERROR)) {
        return [
          poolFraction.times(poolUnderlyingReservesToken0),
          poolFraction.times(poolUnderlyingReservesToken1),
        ];
      }
    } catch (e) {
      return [BigNumber(0), BigNumber(0)];
    }
  }
  return [BigNumber(0), BigNumber(0)];
}

/*==================================================
  Exports
  ==================================================*/

module.exports = {
  name: "Pickle Finance", // project name
  website: "https://pickle.finance",
  token: "PICKLE", // null, or token symbol if project has a custom token
  category: "Assets", // allowed values as shown on DefiPulse: 'Derivatives', 'DEXes', 'Lending', 'Payments', 'Assets'
  start: 1598893200, // unix timestamp (utc 0) specifying when the project began, or where live data begins
  tvl, // tvl adapter
};
