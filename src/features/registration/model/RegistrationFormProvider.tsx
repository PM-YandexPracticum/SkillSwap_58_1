import { ReactNode } from 'react'
import {
  registrationDefaultValues,
  RegistrationFormValues,
  registrationSchema,
} from './registrationSchema'
import { FormProvider, useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'

interface RegistrationFormProviderProps {
  children: ReactNode
}

export const RegistrationFormProvider = ({ children }: RegistrationFormProviderProps) => {
  const form = useForm<RegistrationFormValues>({
    defaultValues: registrationDefaultValues,
    resolver: yupResolver(registrationSchema),
    shouldUnregister: false,
    mode: 'onTouched',
  })
  return (
    <FormProvider {...form}>
      <form onSubmit={(event) => event.preventDefault()} noValidate>
        {children}
      </form>
    </FormProvider>
  )
}
