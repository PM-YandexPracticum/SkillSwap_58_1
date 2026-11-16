import { FiltersState } from '../types'

export const ROUTES = {
  HOME: '/',
  SKILL: '/skill/:id',
  PROFILE: '/profile',
  FAVORITES: '/favorites',
  CREATE: '/create',
  LOGIN: '/login',
  REGISTER: '/register',
  ABOUT: '/about',
  ALL_SKILLS: '/skills',
  CONTACTS: '/contacts',
  BLOG: '/blog',
  PRIVACY: '/privacy',
  TERMS: '/terms',
  NOT_FOUND: '/404',
  SERVER_ERROR: '/500',
  EXCHANGES: '/profile/exchanges',
} as const

export const SKILL_CATEGORIES = [
  {
    id: 'business',
    title: 'Бизнес и карьера',
    subcategories: [
      { id: 'team-management', title: 'Управление командой' },
      { id: 'marketing-advertising', title: 'Маркетинг и реклама' },
      { id: 'sales-negotiations', title: 'Продажи и переговоры' },
      { id: 'personal-brand', title: 'Личный бренд' },
      { id: 'resume-interview', title: 'Резюме и собеседование' },
      { id: 'time-management', title: 'Тайм-менеджмент' },
      { id: 'project-management', title: 'Проектное управление' },
      { id: 'entrepreneurship', title: 'Предпринимательство' },
    ],
  },
  {
    id: 'art',
    title: 'Творчество и искусство',
    subcategories: [
      { id: 'illustration', title: 'Рисование и иллюстрация' },
      { id: 'photo', title: 'Фотография' },
      { id: 'video-editing', title: 'Видеомонтаж' },
      { id: 'music-sound', title: 'Музыка и звук' },
      { id: 'acting', title: 'Актёрское мастерство' },
      { id: 'creative-writing', title: 'Креативное письмо' },
      { id: 'art-therapy', title: 'Арт-терапия' },
      { id: 'decor-diy', title: 'Декор и DIY' },
    ],
  },
  {
    id: 'languages',
    title: 'Иностранные языки',
    subcategories: [
      { id: 'english', title: 'Английский' },
      { id: 'french', title: 'Французский' },
      { id: 'spanish', title: 'Испанский' },
      { id: 'german', title: 'Немецкий' },
      { id: 'chinese', title: 'Китайский' },
      { id: 'japanese', title: 'Японский' },
      { id: 'exam-preparation', title: 'Подготовка к экзаменам (IELTS, TOEFL)' },
    ],
  },
  {
    id: 'education',
    title: 'Образование и развитие',
    subcategories: [
      { id: 'personal-development', title: 'Личностное развитие' },
      { id: 'learning-skills', title: 'Навыки обучения' },
      { id: 'cognitive-techniques', title: 'Когнитивные техники' },
      { id: 'speed-reading', title: 'Скорочтение' },
      { id: 'teaching-skills', title: 'Навыки преподавания' },
      { id: 'coaching', title: 'Коучинг' },
    ],
  },
  {
    id: 'home-coziness',
    title: 'Дом и уют',
    subcategories: [
      { id: 'cleaning-organization', title: 'Уборка и организация' },
      { id: 'home-finances', title: 'Домашние финансы' },
      { id: 'food-preparation', title: 'Приготовление еды' },
      { id: 'houseplants', title: 'Домашние растения' },
      { id: 'repair', title: 'Ремонт' },
      { id: 'storage', title: 'Хранение вещей' },
    ],
  },
  {
    id: 'health',
    title: 'Здоровье и лайфстайл',
    subcategories: [
      { id: 'yoga', title: 'Йога и медитация' },
      { id: 'nutrition', title: 'Питание и ЗОЖ' },
      { id: 'mental-health', title: 'Ментальное здоровье' },
      { id: 'mindfulness', title: 'Осознанность' },
      { id: 'physical-training', title: 'Физические тренировки' },
      { id: 'sleep', title: 'Сон и восстановление' },
      { id: 'balance-life-work', title: 'Баланс жизни и работы' },
    ],
  },
] as const

export type Category = (typeof SKILL_CATEGORIES)[number]
export type CategoryId = Category['id']
export type SubCategoryId = Category['subcategories'][number]['id']

export const LOCAL_STORAGE_KEYS = {
  AUTH_USER: 'skillswap_auth_user',
  FAVORITES: 'skillswap_favorites',
  THEME: 'skillswap_theme',
} as const

export const CITIES = [
  'Москва',
  'Санкт-Петербург',
  'Казань',
  'Екатеринбург',
  'Новосибирск',
  'Нижний Новгород',
  'Самара',
] as const

export type City = (typeof CITIES)[number]

export const YEARS_WORDS = ['год', 'года', 'лет'] as const

export const INITIAL_FILTERS_STATE: FiltersState = {
  mode: 'all',
  gender: null,
  cities: [],
  skillIds: [],
  name: null,
}

export const MODE_OPTIONS = [
  { value: 'all', label: 'Всё' },
  { value: 'wantToLearn', label: 'Хочу научиться' },
  { value: 'canTeach', label: 'Могу научить' },
]

export const GENDER_OPTIONS = [
  { value: 'Не имеет значения', label: 'Не имеет значения' },
  { value: 'Мужской', label: 'Мужской' },
  { value: 'Женский', label: 'Женский' },
]
// 2 MB
export const MAX_FILE_SIZE = 2 * 1024 * 1024
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const
