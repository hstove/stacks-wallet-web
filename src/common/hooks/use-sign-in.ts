import { useRecoilState, useSetRecoilState } from 'recoil';
import { magicRecoveryCodeState, seedInputErrorState, seedInputState } from '@store/recoil/seed';
import React, { useCallback, useEffect, useRef } from 'react';
import { useDispatch } from '@common/hooks/use-dispatch';
import { useWallet } from '@common/hooks/use-wallet';
import { useAnalytics } from '@common/hooks/use-analytics';
import {
  extractPhraseFromPasteEvent,
  validateAndCleanRecoveryInput,
  hasLineReturn,
} from '@common/utils';
import { ScreenPaths } from '@store/onboarding/types';
import { SIGN_IN_CORRECT, SIGN_IN_INCORRECT } from '@common/track';
import { useLoading } from '@common/hooks/use-loading';

export function useSignIn() {
  const setMagicRecoveryCode = useSetRecoilState(magicRecoveryCodeState);
  const [seed, setSeed] = useRecoilState(seedInputState);
  const [error, setError] = useRecoilState(seedInputErrorState);

  const { isLoading, setIsLoading, setIsIdle } = useLoading();
  const { doChangeScreen, doTrack } = useAnalytics();
  const { doStoreSeed } = useWallet();
  const dispatch = useDispatch();

  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);

  const handleSetError = (message = "The Secret Key you've entered is invalid") => {
    setError(message);
    setIsIdle();
    textAreaRef.current?.focus();
    doTrack(SIGN_IN_INCORRECT);
    return;
  };

  const handleSubmit = useCallback(
    async (passedValue?: string) => {
      textAreaRef.current?.blur();
      setIsLoading();
      const parsedKeyInput = passedValue || seed.trim();

      // empty?
      if (parsedKeyInput.length === 0) {
        handleSetError('Entering your Secret Key is required.');
      }

      // recovery key?
      if (parsedKeyInput.split(' ').length <= 1) {
        const result = validateAndCleanRecoveryInput(parsedKeyInput);
        if (result.isValid) {
          setMagicRecoveryCode(parsedKeyInput);
          doChangeScreen(ScreenPaths.RECOVERY_CODE);
          return;
        } else {
          // single word and not a valid recovery key
          handleSetError();
        }
      }

      try {
        await doStoreSeed(parsedKeyInput);
        doTrack(SIGN_IN_CORRECT);
        doChangeScreen(ScreenPaths.SET_PASSWORD);
        setIsIdle();
      } catch (error) {
        handleSetError();
      }
    },
    [seed, dispatch, doStoreSeed, doChangeScreen, doTrack]
  );

  const handleSetSeed = useCallback(
    async (value: string) => {
      const trimmed = value.trim();
      const isEmpty = JSON.stringify(trimmed) === '' || trimmed === '' || !trimmed;
      if (trimmed === seed) return;
      if (isEmpty) {
        setSeed('');
        error && setError(undefined);
        return;
      }
      error && setError(undefined);
      setSeed(trimmed || '');
      if (hasLineReturn(trimmed)) {
        textAreaRef.current?.blur();
        await handleSubmit(trimmed);
      }
    },
    [hasLineReturn, error, seed, textAreaRef]
  );

  const onChange = useCallback(
    async (event: React.FormEvent<HTMLInputElement>) => {
      await handleSetSeed(event.currentTarget.value);
    },
    [handleSetSeed]
  );

  const onPaste = useCallback(
    async (event: React.ClipboardEvent) => {
      const value = extractPhraseFromPasteEvent(event);
      await handleSetSeed(value);
      await handleSubmit(value);
    },
    [handleSetSeed, textAreaRef, extractPhraseFromPasteEvent, handleSubmit]
  );

  const onSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      return handleSubmit();
    },
    [handleSubmit]
  );

  const onBack = useCallback(() => doChangeScreen(ScreenPaths.HOME), []);

  const onKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void handleSubmit();
    }
  }, []);

  useEffect(() => {
    return () => {
      setError(undefined);
      setSeed('');
    };
  }, []);

  return {
    onBack,
    onChange,
    onPaste,
    onSubmit,
    onKeyDown,
    ref: textAreaRef,
    value: seed,
    error,
    isLoading,
  };
}
