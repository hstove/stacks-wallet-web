import { Suspense, memo } from 'react';

import { Stack, StackProps } from '@stacks/ui';

import { Divider } from '@app/components/divider';
import { Caption } from '@app/components/typography';
import { useTransactionRequestState } from '@app/store/transactions/requests.hooks';

import { FunctionArgumentItem } from './function-argument-item';

function FunctionArgumentsListBase(props: StackProps): JSX.Element | null {
  const transactionRequest = useTransactionRequestState();

  if (!transactionRequest || transactionRequest.txType !== 'contract_call') {
    return null;
  }
  const hasArgs = transactionRequest.functionArgs.length > 0;

  return (
    <>
      {hasArgs ? (
        <Stack divider={<Divider />} spacing="base" {...props}>
          {transactionRequest.functionArgs.map((arg, index) => {
            return (
              <Suspense fallback={<>loading</>} key={`${arg}-${index}`}>
                <FunctionArgumentItem arg={arg} index={index} />
              </Suspense>
            );
          })}
        </Stack>
      ) : (
        <Caption>There are no additional arguments passed for this function call.</Caption>
      )}
    </>
  );
}

export const FunctionArgumentsList = memo(FunctionArgumentsListBase);
