import { memo } from 'react';

import { Box } from '@stacks/ui';

import { useCreateAccount } from '@app/common/hooks/account/use-create-account';
import { useWalletType } from '@app/common/use-wallet-type';
import { ControlledDrawer } from '@app/components/drawer/controlled-drawer';
import {
  useAccounts,
  useCurrentAccountIndex,
  useHasCreatedAccount,
} from '@app/store/accounts/account.hooks';
import { useShowSwitchAccountsState } from '@app/store/ui/ui.hooks';

import { AccountListUnavailable } from './components/account-list-unavailable';
import { CreateAccountAction } from './components/create-account-action';
import { SwitchAccountList } from './components/switch-account-list';

export const SwitchAccountDrawer = memo(() => {
  const [isShowing, setShowSwitchAccountsState] = useShowSwitchAccountsState();
  const accounts = useAccounts();
  const currentAccountIndex = useCurrentAccountIndex();
  const createAccount = useCreateAccount();
  const [, setHasCreatedAccount] = useHasCreatedAccount();
  const { whenWallet } = useWalletType();

  const onClose = () => setShowSwitchAccountsState(false);

  const onCreateAccount = () => {
    void createAccount();
    setHasCreatedAccount(true);
    setShowSwitchAccountsState(false);
  };

  if (isShowing && !accounts) {
    return <AccountListUnavailable />;
  }

  return isShowing && accounts ? (
    <ControlledDrawer title="Switch account" isShowing={isShowing} onClose={onClose}>
      <Box mb={whenWallet({ ledger: 'base', software: '' })}>
        <SwitchAccountList
          accounts={accounts}
          currentAccountIndex={currentAccountIndex}
          handleClose={onClose}
        />
        {whenWallet({
          software: <CreateAccountAction onCreateAccount={onCreateAccount} />,
          ledger: <></>,
        })}
      </Box>
    </ControlledDrawer>
  ) : null;
});
