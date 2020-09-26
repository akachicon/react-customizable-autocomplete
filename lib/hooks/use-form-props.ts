import { useMemo } from 'react';

type JSXFormProps = JSX.IntrinsicElements['form'];
export type FormProps =
  | Omit<JSX.IntrinsicElements['form'], 'ref' | 'onSubmit'>
  | undefined;

const isDev = process.env.NODE_ENV === 'development';

export default function useFormProps(props: FormProps): FormProps {
  return useMemo(
    function getFormArgs() {
      if (!props) return;

      const { ref, onSubmit, ...allowedFormProps } = props as JSXFormProps;

      if (isDev && ref !== undefined) {
        throw new Error(
          '[autocomplete-search]: you cannot pass `ref` in `formProps`, ' +
            'instead use allowed callback props'
        );
      }
      if (isDev && onSubmit !== undefined) {
        throw new Error(
          '[autocomplete-search]: you cannot pass `onSubmit` in `formProps`, ' +
            'instead use `onSubmit` directly on the search component'
        );
      }
      return allowedFormProps;
    },
    [props]
  );
}
