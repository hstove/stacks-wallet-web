import { useMemo } from 'react';

import { Wallet, generateSecretKey } from '@stacks/wallet-sdk';

import { logger } from '@shared/logger';
import { InternalMethods } from '@shared/message-types';
import { sendMessage } from '@shared/messages';
import { clearChromeStorage } from '@shared/storage';

import { partiallyClearLocalStorage } from '@app/common/store-utils';
import { useAppDispatch } from '@app/store';
import { createNewAccount, stxChainActions } from '@app/store/chains/stx-chain.actions';
import { useStacksClientAnchored } from '@app/store/common/api-clients.hooks';
import { inMemoryKeyActions } from '@app/store/in-memory-key/in-memory-key.actions';
import { keyActions } from '@app/store/keys/key.actions';
import { useCurrentKeyDetails } from '@app/store/keys/key.selectors';

import { useAnalytics } from './analytics/use-analytics';

export function useKeyActions() {
  const analytics = useAnalytics();
  const dispatch = useAppDispatch();
  const defaultKeyDetails = useCurrentKeyDetails();
  const client = useStacksClientAnchored();

  return useMemo(
    () => ({
      async setPassword(password: string) {
        return dispatch(keyActions.setWalletEncryptionPassword({ password, client }));
      },

      generateWalletKey() {
        if (!!defaultKeyDetails) {
          logger.warn('Cannot generate new wallet when wallet already exists');
          return;
        }
        const secretKey = generateSecretKey(256);
        sendMessage({
          method: InternalMethods.ShareInMemoryKeyToBackground,
          payload: { secretKey, keyId: 'default' },
        });
        return dispatch(inMemoryKeyActions.generateWalletKey(secretKey));
      },

      async unlockWallet(password: string) {
        return dispatch(keyActions.unlockWalletAction(password));
      },

      switchAccount(index: number) {
        return dispatch(stxChainActions.switchAccount(index));
      },

      async createNewAccount(wallet: Wallet) {
        return dispatch(createNewAccount(wallet));
      },

      async signOut() {
        sendMessage({ method: InternalMethods.RemoveInMemoryKeys, payload: undefined });
        dispatch(keyActions.signOut());
        await clearChromeStorage();
        partiallyClearLocalStorage();
        void analytics.track('sign_out');
      },

      lockWallet() {
        sendMessage({ method: InternalMethods.RemoveInMemoryKeys, payload: undefined });
        return dispatch(inMemoryKeyActions.lockWallet());
      },
    }),
    [analytics, client, defaultKeyDetails, dispatch]
  );
}
