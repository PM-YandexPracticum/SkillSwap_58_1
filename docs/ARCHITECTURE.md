# Архитектура проекта (FSD)

**Дата последнего обновления:** 2026-11-09  
**Статус:** поддерживается в актуальном состоянии, обновляется по мере разработки

---

## Структура проекта (src/)

| Слой | Путь | Назначение |
|------|------|------------|
| `api` | `src/api/` | Fetch-функции для загрузки JSON-моков. |
| `app` | `src/app/` | Точка входа и базовые настройки: `App.tsx`, провайдеры, шрифты (`src/app/fonts/`), глобальные стили (`src/app/styles/global.css`). |
| `entities` | `src/entities/` | Доменные модели и слайсы состояния: `skill/`, `user/`, `request/`. Включают редьюсеры (например, `skillsSlice.ts`, `usersSlice.ts`). |
| `features` | `src/features/` | Функциональные блоки (auth, skills, favorites, requests). Пример: `features/auth/model/authUtils.ts`. |
| `pages` | `src/pages/` | Страницы приложения (полные экраны), собирают виджеты и фичи под конкретный сценарий. |
| `shared` | `src/shared/` | Переиспользуемый код: UI-компоненты, хелперы, константы, типы, утилиты. |
| `store` | `src/store/` | Redux store и типизированные хуки для работы со стором. |
| `widgets` | `src/widgets/` | Составные блоки: `Header`, `SkillCard`, `FiltersBar`. |

---

## Public и внешние ресурсы

| Путь | Назначение |
|------|------------|
| `public/db/` | JSON-моки данных: `skills.json`, `users.json`. |
| `public/avatars/` | Аватары пользователей. Подпапка `figma/` содержит исходные/дизайнерские версии фото. |

---

## Общий стейт (Redux)

### Где лежат редьюсеры
- `src/entities/skill/model/skillsSlice.ts`: слайс `skills` (загрузка, список, статусы).
- `src/entities/user/model/usersSlice.ts`: слайс `users` (загрузка, список, статусы).

### Как пользоваться (строго по правилам)
- **Не использовать** `useDispatch` / `useSelector` напрямую из `react-redux`.
- **Использовать** типизированные хуки из `src/store/hooks.ts`:
  
  `export const useAppDispatch = useDispatch.withTypes<AppDispatch>()`
  `export const useAppSelector = useSelector.withTypes<RootState>()`

## Подключённые слайсы в store

```typescript
export const store = configureStore({
  reducer: {
    skills: skillsReducer,
    users: usersReducer,
  },
})
```
Все слайсы (skills, users) подключаются в едином файле настройки стора: `src/store/index.ts`. Это гарантирует централизованное управление состоянием и предсказуемую структуру Redux.

## Селекторы (из слайсов)

- **`skillsSlice`:** `selectSkills`, `selectSkillsLoading`, `selectSkillsError`
- **`usersSlice`:** `selectUsers`, `selectUsersLoading`, `selectUsersError`

Эти селекторы экспортируются прямо из слайсов и предназначены для использования в компонентах.

---

## Правила импортов и нейминга
### Импорты: 
Все компоненты из `src/shared/ui` импортируются **только через публичный вход** — единый barrel-файл `src/shared/ui/index.ts`:

Импорты из остальных слоёв (`api, entities, features, store, shared`)  всегда через алиас `@/` (например, `@/entities/skill/model/skillsSlice`). Относительные пути вида `../../entities/...` между слоями запрещены.

### Компоненты: 
импортируются только из `@/shared/ui`. Это гарантирует, что используется единая реализация.
### Нейминг:
- Компоненты: `PascalCase (TextInput, Button)`.
- Пропсы: `camelCase`.
- Константы: `UPPER_CASE (ROUTES, SKILL_CATEGORIES)`.

---

## Константы (`src/shared/lib/constants.ts`)

- `ROUTES`: базовые пути и параметры роутинга.
- `SKILL_CATEGORIES`: категории навыков с подкатегориями. Используется для фильтров и отображения.
  - Типы: `Category, CategoryId, SubCategoryId`.
- `CITIES`: список городов для фильтрации и автодополнения.
  - Тип: `City`.
- `LOCAL_STORAGE_KEYS`: ключи для работы с localStorage.
Новые константы добавляются исключительно в файл `src/shared/lib/constants.ts` 
Не создавайте отдельные файлы констант в других слоях.
---

## Утилиты авторизации (`src/features/auth/model/authUtils.ts`)

Функции для работы с авторизацией и `localStorage`:

- `getAuthUser(): AuthUser | null` — читает текущего авторизованного пользователя из `localStorage`.
- `saveAuthUser(user: Omit<AuthUser, 'token'>): AuthUser` — сохраняет пользователя и mock‑токен в `localStorage`.
- `clearAuthUser(): void` — удаляет пользователя из `localStorage` (logout).

Все функции используют `LOCAL_STORAGE_KEYS.AUTH_USER` и корректно обрабатывают ошибки парсинга.

---

## Хуки и хелперы

### Хуки (`src/shared/hooks/`)

- `useDebounce<T>(value: T, delay = 300): T` — задержка значения для оптимизации запросов (поиск, фильтры).
- `useLocalStorage<T>(key: string, initialValue: T): [T, (val: T) => void]` — типизированная обёртка над `localStorage` с обработкой ошибок.

### Хелперы (`src/shared/lib/helpers.ts`)

#### Основные
- `formatDate(dateString: string): string` — форматирует дату в читаемый вид (ru‑RU).
- `truncate(str: string, maxLength: number): string` — обрезает строку до `maxLength` с многоточием.
- `generateId(): string` — генерирует уникальный ID через `crypto.randomUUID()`.
#### Дополнительные 
(используются в конкретных фичах, не являются базовыми).

- `getDeclension(count: number, words: readonly string[]): string` — склоняет слово по числу.
- `getAgeWithDeclension(birthDate: string): string` — вычисляет возраст и подставляет правильное склонение.

# Компоненты (`src/shared/ui`)

Ниже — список атомарных компонентов с назначением и ключевыми пропсами.  
Все компоненты экспортируются через `src/shared/ui/index.ts`.

| Компонент | Назначение | Ключевые пропсы | Особенности |
| --------- | ---------- | --------------- | ----------- |
| `Avatar` | Аватар пользователя | `src`, `alt`, `size` | Обрабатывает отсутствующие изображения, поддерживает разные размеры. |
| `Button` | Универсальная кнопка с вариациями стиля и размера; поддерживает иконки слева и справа| `variant? ('primary'/'secondary'/'tertiary'), size? ('sm'/'md'/'lg'), icon?, trailingIcon?, children, disabled?, type?, className?`, остальные стандартные атрибуты кнопки| Интерактивные иконки — через `<button>` с `aria-label`. Декоративные — через `aria-hidden="true"`. |
| `Card` | Базовый переиспользуемый контейнер | `className`, `children` | Базовая обёртка с отступами и тенью; используется как основа для составных блоков. |
| `Chip` | Переиспользуемый компонент чипа (отображает текстовую метку с опциональной стилизацией по категории) | `label`, `category?` | Отображает метку; при наличии `category` применяет соответствующую стилистику через CSS-классы |
| `Logo` | Логотип проекта (изображение + название) со ссылкой на главную страницу | `className?` | Реализован как ссылка (`Link` из `react-router-dom`) на маршрут `ROUTES.HOME`; содержит изображение и текстовую часть «SkillSwap»; размер зафиксирован (40×40 px), масштабирование через CSS-классы (через className). |
| `Radio` | Радио‑кнопка (индивидуальный элемент выбора) | `label, value, name, checked, onChange, disabled?, className?` | Визуализация через кастомный `RadioIcon` (не нативный чекбокс); автоматически генерирует уникальный id через useId; имеет тестовый атрибут `data-testid`; корректно обрабатывает состояния `checked` и `disabled`. Работает в связке с `RadioGroup`. |
| `RadioGroup` | Контейнер для группы радио‑кнопок с управлением состоянием | `name, options, defaultValue?, value?, onChange?, className?, optionClassName?`| Поддерживает контролируемый и неконтролируемый режимы (через `value/onChange` `или defaultValue`); автоматически передаёт name и синхронизирует состояние `checked` для дочерних `Radio`; использует `role="radiogroup"` и `aria-label` для доступности; рендерит список опций из массива `RadioGroupOption`. |
| `Text` | Компонент‑обёртка для текста с гибкой стилизацией (размер, жирность, цвет, начертание) | `variant?, weight?, color?, italic?, as?, className?, children` | Использует CSS‑переменные для тем, поддерживает рендеринг через проп `as` (например, `<span>, <p>`) для гибкой семантики без потери стилей. |
| `TextInput` | Поле ввода с поддержкой боковых элементов (слева и справа) | `value`, `onChange`, `placeholder`, `leftContent`, `rightContent`, `disabled`, `type` | Реализовано как обёртка (`div.wrapper`) с нативным `<input>` внутри; боковые части рендерятся в отдельных блоках с классом `sideContent`; корректно обрабатывает состояние `disabled` (визуально и через `aria-disabled`); поддерживает все стандартные атрибуты тега `<input>` за счёт проброса `...props`; стилизация через CSS‑классы, комбинируемые через `clsx` |
| `Title` | Семантический заголовок (h1–h4) с возможностью независимого выбора визуального размера | `level`, `size?`, `className?`, остальные HTML‑атрибуты для заголовка | Рендерится как соответствующий тег `<h1>–<h4>` на основе `level`; визуальный размер можно задать отдельно через `size` (по умолчанию равен `level`); поддерживает все стандартные атрибуты заголовков (например, `id, className, style` и т. д.); стилизация через CSS‑классы, комбинируемые через `clsx`. |

---

## Типы

Все основные типы хранятся в `src/shared/types/index.ts`.  
**Важно:** дублировать типы в слоях не нужно.  

### Примеры типов из констант

- `Category`, `CategoryId`, `SubCategoryId` — из `SKILL_CATEGORIES`.
- `City` — из `CITIES`.

---

## Обновление документации

Документация актуализируется по мере добавления новых фич — **каждые 2–3 дня**.  
Любые изменения в архитектуре, новых компонентах, константах или слайсах должны быть отражены в этом файле.


### Фильтры каталога и поиск

`features/catalog-filter` хранит фильтры в URL. Поле поиска `name` едино
для URL, `FiltersState` и API; входные ссылки с `q`, `mode`, `skillId` и
русскими значениями пола читаются для совместимости. Новые ссылки используют
`type`, `gender=male|female`, `subCategoryId[]`, `city` и `name`.
`widgets/SkillSearcher` управляет вводом и задержкой поиска, используя
`shared/ui/SkillInput`; `Header` только размещает виджет. Сброс передаёт маркер
в состоянии навигации, чтобы отменить ещё не записанный в URL поиск.

`pages/CatalogPage` передаёт полный набор фильтров для каждой страницы
трёх подборок. `api/users` преобразует режим и пол в значения сервера,
отправляет одиночный `city` или повторяющийся `city[]`. Поиск и фильтрация
выполняются сервером до сортировки и пагинации. `usersSlice` отслеживает ID
запроса и набор фильтров отдельно для каждой подборки, игнорирует устаревшие
ответы; страница отменяет запросы при смене фильтров и размонтировании.
