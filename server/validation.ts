import {
  CITIES,
  SKILL_CATEGORIES,
  type CategoryId,
  type SubCategoryId,
} from '@/shared/lib/constants'
import type {
  LoginRequest,
  ProfileUpdate,
  RegisterRequest,
  SwapRequestListQuery,
  UserListQuery,
} from './types'

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new HttpError(400, 'Ожидается объект с данными формы')
  }
  return value as Record<string, unknown>
}

function text(value: unknown, field: string, min = 1, max = Infinity): string {
  if (typeof value !== 'string' || value.trim().length < min || value.trim().length > max) {
    throw new HttpError(400, `Некорректное поле ${field}`)
  }
  return value.trim()
}

function choice<T extends string>(value: unknown, values: readonly T[], field: string): T {
  if (typeof value !== 'string' || !values.includes(value as T)) {
    throw new HttpError(400, `Недопустимое значение ${field}`)
  }
  return value as T
}

function choices<T extends string>(value: unknown, values: readonly T[], field: string): T[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new HttpError(400, `Заполните ${field}`)
  }
  const result = value.map((item: unknown) => choice(item, values, field))
  if (new Set(result).size !== result.length) {
    throw new HttpError(400, `Повторяющиеся значения ${field}`)
  }
  return result
}

export function parseUserFilters(query: UserListQuery) {
  const rawCities = query['city[]']
  const cities = rawCities === undefined ? [] : Array.isArray(rawCities) ? rawCities : [rawCities]
  const rawIds = query['subCategoryId[]']
  const ids = rawIds === undefined ? [] : Array.isArray(rawIds) ? rawIds : [rawIds]
  const rawUserIds = query['ids[]']
  const userIds =
    rawUserIds === undefined ? undefined : Array.isArray(rawUserIds) ? rawUserIds : [rawUserIds]
  const allowedIds = SKILL_CATEGORIES.flatMap((category) =>
    category.subcategories.map((subCategory) => subCategory.id),
  )
  return {
    name: query.name === undefined ? '' : text(query.name, 'name', 0).toLowerCase(),
    userIds: userIds?.map((id) => text(id, 'ids[]')),
    gender:
      query.gender === undefined
        ? undefined
        : choice(query.gender, ['female', 'male'] as const, 'gender'),
    city: query.city === undefined ? undefined : choice(query.city, CITIES, 'city'),
    cities: [...new Set(cities.map((city) => choice(city, CITIES, 'city[]')))],
    type: choice(query.type ?? 'all', ['learn', 'teach', 'all'] as const, 'type'),
    subCategoryIds: ids.map((id) => choice(id, allowedIds, 'subCategoryId[]')),
  }
}

export function parseSwapRequestFilters(query: SwapRequestListQuery) {
  return {
    role: choice(query.role ?? 'all', ['incoming', 'outgoing', 'all'] as const, 'role'),
    status:
      query.status === undefined
        ? undefined
        : choice(query.status, ['pending', 'accepted', 'rejected'] as const, 'status'),
  }
}

export function parseSwapRequestCreate(value: unknown): { skillId: string } {
  const data = record(value)
  if (Object.keys(data).some((key) => key !== 'skillId')) {
    throw new HttpError(400, 'Допустимо только поле skillId')
  }
  return { skillId: text(data.skillId, 'skillId') }
}

export function parseSwapRequestUpdate(value: unknown): { status: 'accepted' | 'rejected' } {
  const data = record(value)
  if (Object.keys(data).some((key) => key !== 'status')) {
    throw new HttpError(400, 'Допустимо только поле status')
  }
  return { status: choice(data.status, ['accepted', 'rejected'] as const, 'status') }
}

export function parseLogin(value: unknown): LoginRequest {
  const data = record(value)
  const email = parseEmail(data.email)
  if (typeof data.password !== 'string' || data.password.length === 0) {
    throw new HttpError(400, 'Укажите пароль')
  }
  return { email, password: data.password }
}

function parseEmail(value: unknown): string {
  const email = text(value, 'email').toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new HttpError(400, 'Некорректный email')
  }
  return email
}

function parseBirthDate(value: unknown): string {
  const birthDate = text(value, 'birthDate')
  // Канонический ISO UTC, как у Date.toISOString(); сравнение отсекает 30 февраля.
  const birth = new Date(birthDate)
  if (
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(birthDate) ||
    !Number.isFinite(birth.getTime()) ||
    birth.toISOString() !== birthDate ||
    birth.getTime() > Date.now()
  ) {
    throw new HttpError(400, 'birthDate должна быть датой ISO UTC и не находиться в будущем')
  }
  return birthDate
}

export function parseProfileUpdate(value: unknown): ProfileUpdate {
  const data = record(value)
  const allowed = ['email', 'name', 'birthDate', 'gender', 'city', 'bio']
  if (Object.keys(data).some((key) => !allowed.includes(key))) {
    throw new HttpError(400, 'Недопустимое поле профиля')
  }
  const result: ProfileUpdate = {}
  if ('email' in data) result.email = parseEmail(data.email)
  if ('name' in data) result.name = text(data.name, 'name', 2)
  if ('birthDate' in data) result.birthDate = parseBirthDate(data.birthDate)
  if ('gender' in data) result.gender = choice(data.gender, ['female', 'male'] as const, 'gender')
  if ('city' in data) result.city = choice(data.city, CITIES, 'city')
  if ('bio' in data) result.bio = text(data.bio, 'bio', 0, 500)
  return result
}

export function parseRegistration(value: unknown): RegisterRequest {
  const data = record(value)
  const credentials = parseLogin(data)
  if (credentials.password.length < 8) throw new HttpError(400, 'Пароль короче 8 символов')

  const birthDate = parseBirthDate(data.birthDate)

  const categoryIds: CategoryId[] = SKILL_CATEGORIES.map((category) => category.id)
  const subCategoryIds: SubCategoryId[] = SKILL_CATEGORIES.flatMap((category) =>
    category.subcategories.map((subCategory) => subCategory.id),
  )
  const wantsToLearn = choices(data.wantsToLearn, subCategoryIds, 'wantsToLearn')

  const skill = record(data.canTeach)
  const category = choice(skill.category, categoryIds, 'canTeach.category')
  const subCategory = choice(skill.subCategory, subCategoryIds, 'canTeach.subCategory')
  const parent = SKILL_CATEGORIES.find((item) => item.id === category)
  if (!parent?.subcategories.some((item) => item.id === subCategory)) {
    throw new HttpError(400, 'Подкатегория навыка не принадлежит выбранной категории')
  }

  return {
    ...credentials,
    name: text(data.name, 'name', 2),
    birthDate,
    gender: choice(data.gender, ['female', 'male'] as const, 'gender'),
    city: choice(data.city, CITIES, 'city'),
    wantsToLearn,
    canTeach: {
      title: text(skill.title, 'canTeach.title', 3, 50),
      description: text(skill.description, 'canTeach.description', 1, 500),
      category,
      subCategory,
    },
  }
}
