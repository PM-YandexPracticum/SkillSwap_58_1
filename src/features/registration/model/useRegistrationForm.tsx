import { useFormContext, useWatch } from 'react-hook-form'
import { SKILL_CATEGORIES } from '@/shared/lib/constants'
import { registrationStepFields, type RegistrationFormValues } from './registrationSchema'

export const useRegistrationForm = () => {
  const form = useFormContext<RegistrationFormValues>()
  const { control, setValue } = form

  const wantedCategory = useWatch({ control, name: 'wantedCategory' })
  const teachCategory = useWatch({ control, name: 'teachCategory' })

  const getSubcategoryOptions = (categoryId: string) =>
    SKILL_CATEGORIES.filter((category) => !categoryId || category.id === categoryId).flatMap(
      (category) =>
        category.subcategories.map((subcategory) => ({
          value: subcategory.id,
          label: subcategory.title,
        })),
    )

  const wantedSubcategoryOptions = getSubcategoryOptions(wantedCategory)
  const teachSubcategoryOptions = getSubcategoryOptions(teachCategory)

  const validateStep = (step: 1 | 2) => form.trigger(registrationStepFields[step])
  const continueStep = async (step: 1 | 2, onNext?: () => void) => {
    if (await validateStep(step)) onNext?.()
  }

  const setCategory = (field: 'wantedCategory' | 'teachCategory', value: string | undefined) => {
    const categoryId = SKILL_CATEGORIES.find((category) => category.id === value)?.id ?? ''
    const subcategoryField = field === 'wantedCategory' ? 'wantedSubCategory' : 'teachSubCategory'
    setValue(field, categoryId, { shouldDirty: true, shouldValidate: true })
    setValue(subcategoryField, '', { shouldDirty: true, shouldValidate: true })
  }
  const setGender = (value: string) =>
    setValue('gender', value, { shouldDirty: true, shouldValidate: true })
  const setCity = (value: string) =>
    setValue('city', value, { shouldDirty: true, shouldValidate: true })
  const setSubcategory = (field: 'wantedSubCategory' | 'teachSubCategory', value: string) => {
    const categoryField = field === 'wantedSubCategory' ? 'wantedCategory' : 'teachCategory'
    const parentCategory = SKILL_CATEGORIES.find((category) =>
      category.subcategories.some((subcategory) => subcategory.id === value),
    )

    if (parentCategory) {
      setValue(categoryField, parentCategory.id, { shouldDirty: true, shouldValidate: true })
    }

    setValue(field, value, { shouldDirty: true, shouldValidate: true })
  }
  const setAvatar = (file: File | null) =>
    setValue('avatar', file, { shouldDirty: true, shouldValidate: true })
  const setTeachImage = (file: File) =>
    setValue('teachImage', file, { shouldDirty: true, shouldValidate: true })
  const setBirthDate = (value: Date | string | null) => {
    const formattedDate =
      value instanceof Date
        ? `${String(value.getDate()).padStart(2, '0')}.${String(value.getMonth() + 1).padStart(2, '0')}.${value.getFullYear()}`
        : (value ?? '')
    setValue('birthDate', formattedDate, { shouldDirty: true, shouldValidate: true })
  }

  return {
    ...form,
    wantedSubcategoryOptions,
    teachSubcategoryOptions,
    setCategory,
    setGender,
    setCity,
    setSubcategory,
    setAvatar,
    setTeachImage,
    setBirthDate,
    validateStep,
    continueStep,
  }
}
