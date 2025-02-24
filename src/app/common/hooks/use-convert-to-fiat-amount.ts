import { useCallback } from 'react';

import { CryptoCurrencies } from '@shared/models/currencies.model';
import type { Money } from '@shared/models/money.model';

import { useCryptoCurrencyMarketData } from '@app/query/common/market-data/market-data.hooks';

import { baseCurrencyAmountInQuote } from '../money/calculate-money';

export function useConvertCryptoCurrencyToFiatAmount(currency: CryptoCurrencies) {
  const cryptoCurrencyMarketData = useCryptoCurrencyMarketData(currency);
  return useCallback(
    (value: Money) => baseCurrencyAmountInQuote(value, cryptoCurrencyMarketData),
    [cryptoCurrencyMarketData]
  );
}
