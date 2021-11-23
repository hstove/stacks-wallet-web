import React, { Dispatch, FormEvent, SetStateAction, useCallback } from 'react';
import BigNumber from 'bignumber.js';
import { useFormikContext } from 'formik';
import { color, Input, InputGroup, Stack, StackProps } from '@stacks/ui';

import { stxToMicroStx } from '@common/stacks-utils';
import { TransactionFormValues } from '@common/transactions/transaction-utils';
import { SendFormWarningMessages } from '@common/warning-messages';
import { Caption } from '@components/typography';
import { useFeeEstimationsState } from '@store/transactions/fees.hooks';
import { SendFormSelectors } from '@tests/page-objects/send-form.selectors';

interface CustomFeeFieldProps extends StackProps {
  setFieldWarning: Dispatch<SetStateAction<string | undefined>>;
}

export function CustomFeeField(props: CustomFeeFieldProps) {
  const { setFieldWarning, ...rest } = props;
  const { errors, setFieldValue, values } = useFormikContext<TransactionFormValues>();
  const [feeEstimations] = useFeeEstimationsState();

  const checkFieldWarning = useCallback(
    (value: string) => {
      if (errors.fee) return setFieldWarning('');
      const fee = stxToMicroStx(value);
      const lowEstimate = new BigNumber(feeEstimations[0]?.fee);
      if (lowEstimate.isGreaterThan(fee)) {
        return setFieldWarning(SendFormWarningMessages.AdjustedFeeBelowLowestEstimate);
      }
      return setFieldWarning('');
    },
    [errors.fee, feeEstimations, setFieldWarning]
  );

  return (
    <Stack position="relative" {...rest}>
      <InputGroup
        alignSelf="flex-end"
        flexDirection="column"
        justifyContent="center"
        position="relative"
        width="130px"
      >
        <Caption as="label" htmlFor="fee" position="absolute" right={2} zIndex={999}>
          STX
        </Caption>
        <Input
          autoComplete="off"
          borderRadius="8px"
          color={color('text-caption')}
          data-testid={SendFormSelectors.InputCustomFeeField}
          display="block"
          height="32px"
          name="fee"
          onChange={(evt: FormEvent<HTMLInputElement>) => {
            setFieldValue('fee', evt.currentTarget.value);
            // Separating warning check from field validations
            // bc we want the user to be able to submit the form
            // with the low fee warning present.
            checkFieldWarning(evt.currentTarget.value);
          }}
          paddingRight="38px"
          placeholder="0.000000"
          textAlign="right"
          type="number"
          value={values.fee}
        />
      </InputGroup>
    </Stack>
  );
}