const BigNumber = require('bignumber.js')

const v1TVL = require('./v1')
const v2TVL = require('./v2')

const ETH = '0x0000000000000000000000000000000000000000'
const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'

async function tvl(_, block) {
  const [v1, v2] = await Promise.all([v1TVL(_, block), v2TVL(_, block)])

  // replace WETH with ETH for v2
  v2[ETH] = v2[WETH]
  delete v2[WETH]

  const tokenAddresses = new Set(Object.keys(v1).concat(Object.keys(v2)))

  return Array.from(tokenAddresses).reduce((accumulator, tokenAddress) => {
    const v1Balance = new BigNumber(v1[tokenAddresses] || '0')
    const v2Balance = new BigNumber(v2[tokenAddresses] || '0')
    accumulator[tokenAddress] = v1Balance.plus(v2Balance).toFixed()
    return accumulator
  }, {})
}

module.exports = {
  name: 'Uniswap',
  token: null,
  category: 'dexes',
  start: 1541116800, // 11/02/2018 @ 12:00am (UTC)
  tvl,
}