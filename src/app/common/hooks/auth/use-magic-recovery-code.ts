import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { decrypt } from '@stacks/wallet-sdk';

import { RouteUrls } from '@shared/route-urls';

import { useOnboardingState } from '@app/common/hooks/auth/use-onboarding-state';
import { useLoading } from '@app/common/hooks/use-loading';
import { useWallet } from '@app/common/hooks/use-wallet';
import { delay } from '@app/common/utils';
import { useAppDispatch } from '@app/store';
import { inMemoryKeyActions } from '@app/store/in-memory-key/in-memory-key.actions';

function pullMagicRecoveryCodeFromParams(urlSearchParams: URLSearchParams) {
  return urlSearchParams.get('magicRecoveryCode');
}

async function simulateShortDelayToAvoidImmediateNavigation() {
  await delay(850);
}

export function useMagicRecoveryCode() {
  const { isLoading, setIsLoading, setIsIdle } = useLoading('useMagicRecoveryCode');
  const [urlSearchParams] = useSearchParams();

  const { finishSignIn } = useWallet();
  const [error, setPasswordError] = useState('');
  const { decodedAuthRequest } = useOnboardingState();
  const navigate = useNavigate();

  const dispatch = useAppDispatch();

  const handleNavigate = useCallback(() => {
    if (decodedAuthRequest) {
      setTimeout(() => {
        void finishSignIn(0);
      }, 1000);
    } else {
      navigate(RouteUrls.SetPassword);
    }
  }, [navigate, decodedAuthRequest, finishSignIn]);

  const decryptMagicRecoveryCode = useCallback(
    async (password: string) => {
      const magicRecoveryCode = pullMagicRecoveryCodeFromParams(urlSearchParams);
      if (!magicRecoveryCode) throw Error('No magic recovery seed');
      setIsLoading();
      try {
        const codeBuffer = Buffer.from(magicRecoveryCode, 'base64');
        const secretKey = await decrypt(codeBuffer, password);
        toast.success('Password correct');
        await simulateShortDelayToAvoidImmediateNavigation();
        dispatch(inMemoryKeyActions.saveUsersSecretKeyToBeRestored(secretKey));
        handleNavigate();
      } catch (error) {
        setPasswordError(`Incorrect password, try again.`);
        setIsIdle();
      }
    },
    [urlSearchParams, setIsLoading, dispatch, handleNavigate, setIsIdle]
  );

  useEffect(() => {
    if (pullMagicRecoveryCodeFromParams(urlSearchParams)) return;
    navigate(RouteUrls.SignIn);
  }, [navigate, urlSearchParams]);

  useEffect(() => {
    setIsIdle();
    return () => setIsIdle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    error,
    isLoading,
    decryptMagicRecoveryCode,
  };
}
