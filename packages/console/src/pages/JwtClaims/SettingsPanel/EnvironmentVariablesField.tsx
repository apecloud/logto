import { useCallback, useMemo } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import FormField from '@/ds-components/FormField';
import KeyValueInputField from '@/ds-components/KeyValueInputField';

import { type JwtClaimsFormType } from '../type';

const isValidKey = (key: string) => {
  return /^\w+$/.test(key);
};

function EnvironmentVariablesField() {
  const { t } = useTranslation(undefined, { keyPrefix: 'admin_console' });

  const {
    register,
    getValues,
    trigger,
    formState: {
      errors: { environmentVariables: envVariableErrors },
      submitCount,
    },
  } = useFormContext<JwtClaimsFormType>();

  // Read the form controller from the context @see {@link https://react-hook-form.com/docs/usefieldarray}
  const { fields, remove, append } = useFieldArray<JwtClaimsFormType>({
    name: 'environmentVariables',
  });

  const keyValidator = useCallback(
    (key: string, index: number) => {
      const envVariables = getValues('environmentVariables');

      if (!envVariables) {
        return true;
      }

      // Unique key validation
      if (envVariables.filter(({ key: _key }) => _key.length > 0 && _key === key).length > 1) {
        // Reuse the same error phrase key from webhook settings
        return t('webhook_details.settings.key_duplicated_error');
      }

      // Empty key validation (if value is present)
      const correspondValue = getValues(`environmentVariables.${index}.value`);
      if (correspondValue) {
        // Reuse the same error phrase key from webhook settings
        return Boolean(key) || t('webhook_details.settings.key_missing_error');
      }

      // Key format validation
      if (Boolean(key) && !isValidKey(key)) {
        // Reuse the same error phrase key from webhook settings
        return t('webhook_details.settings.invalid_key_error');
      }

      return true;
    },
    [getValues, t]
  );

  const valueValidator = useCallback(
    (value: string, index: number) => {
      return getValues(`environmentVariables.${index}.value`)
        ? Boolean(value) || t('webhook_details.settings.value_missing_error')
        : true;
    },
    [getValues, t]
  );

  const revalidate = useCallback(() => {
    for (const [index] of fields.entries()) {
      void trigger(`environmentVariables.${index}.key`);

      // Only trigger value validation if the form has been submitted
      if (submitCount > 0) {
        void trigger(`environmentVariables.${index}.value`);
      }
    }
  }, [fields, submitCount, trigger]);

  const getInputFieldProps = useMemo(
    () => ({
      key: (index: number) =>
        register(`environmentVariables.${index}.key`, {
          validate: (key) => keyValidator(key, index),
          onChange: revalidate,
        }),
      value: (index: number) =>
        register(`environmentVariables.${index}.value`, {
          validate: (value) => valueValidator(value, index),
          onChange: revalidate,
        }),
    }),
    [register, revalidate, keyValidator, valueValidator]
  );

  return (
    <FormField title="jwt_claims.environment_variables.input_field_title">
      <KeyValueInputField
        fields={fields}
        // Force envVariableErrors to be an array, otherwise return undefined
        errors={envVariableErrors?.map?.((error) => error)}
        getInputFieldProps={getInputFieldProps}
        onAppend={append}
        onRemove={remove}
      />
    </FormField>
  );
}

export default EnvironmentVariablesField;
