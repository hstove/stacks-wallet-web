import { useMemo } from 'react';

import { toUnicode } from 'punycode';

import { getAutogeneratedAccountDisplayName } from '@app/common/utils/get-account-display-name';
import {
  useCurrentAccountNames,
  useGetAccountNamesByAddressQuery,
} from '@app/query/stacks/bns/bns.hooks';
import { useCurrentAccount } from '@app/store/accounts/account.hooks';
import { AccountWithAddress } from '@app/store/accounts/account.models';

const parseIfValidPunycode = (s: string) => {
  try {
    return toUnicode(s);
  } catch {
    return s;
  }
};

export function useCurrentAccountDisplayName() {
  const account = useCurrentAccount();
  const names = useCurrentAccountNames();

  return useMemo(() => {
    if (!account || typeof account?.index !== 'number') return 'Account';

    if (names[0]) return parseIfValidPunycode(names[0]);

    return `Account ${account?.index + 1}`;
  }, [account, names]);
}

export function useAccountDisplayName(account: AccountWithAddress): string {
  const names = useGetAccountNamesByAddressQuery(account.address);
  return useMemo(() => {
    if (names[0]) return parseIfValidPunycode(names[0]);

    return getAutogeneratedAccountDisplayName(account);
  }, [account, names]);
}
