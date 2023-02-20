import { createSelector } from '@reduxjs/toolkit';
import { HDKey } from '@scure/bip32';

import { NetworkModes } from '@shared/constants';
import { deriveTaprootAccountFromRootKeychain } from '@shared/crypto/bitcoin/p2tr-address-gen';
import {
  deriveNativeSegWitAccountKeychain,
  getNativeSegWitAddressIndex,
} from '@shared/crypto/bitcoin/p2wpkh-address-gen';

import { mnemonicToRootNode } from '@app/common/keychain/keychain';
import { selectInMemoryKey } from '@app/store/in-memory-key/in-memory-key.selectors';
import { selectCurrentKey } from '@app/store/keys/key.selectors';
import { defaultKeyId } from '@app/store/keys/key.slice';
import { selectCurrentNetwork } from '@app/store/networks/networks.selectors';

function bitcoinKeychainSelectorFactory(
  keychainFn: (hdkey: HDKey, network: NetworkModes) => (index: number) => HDKey
) {
  return createSelector(
    selectCurrentKey,
    selectInMemoryKey,
    selectCurrentNetwork,
    (currentKey, inMemKey, network) => {
      if (currentKey?.type !== 'software') return;
      if (!inMemKey.keys[defaultKeyId]) throw new Error('No in-memory key found');
      return keychainFn(mnemonicToRootNode(inMemKey.keys.default), network.chain.bitcoin.network);
    }
  );
}

export function getNativeSegwitAddressFromMnemonic(secretKey: string) {
  return (index: number) => {
    const rootNode = mnemonicToRootNode(secretKey);
    const account = deriveNativeSegWitAccountKeychain(rootNode, 'mainnet')(index);
    return getNativeSegWitAddressIndex(account, 'mainnet');
  };
}

export const selectSoftwareBitcoinNativeSegWitKeychain = bitcoinKeychainSelectorFactory(
  deriveNativeSegWitAccountKeychain
);

export const selectSoftwareBitcoinTaprootKeychain = bitcoinKeychainSelectorFactory(
  deriveTaprootAccountFromRootKeychain
);