import fs from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import express, { type ErrorRequestHandler, type Request } from 'express'
import multer from 'multer'
import { ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE, SKILL_CATEGORIES } from '@/shared/lib/constants'
import type { AuthUser, Skill, SwapRequest, SwapRequestDetails, User } from '@/shared/types'
import type {
  ApiError,
  AuthResponse,
  ListQuery,
  Paginated,
  StoredUser,
  SwapRequestListQuery,
  UserListQuery,
} from './types'
import {
  HttpError,
  parseLogin,
  parseProfileUpdate,
  parseRegistration,
  parseSwapRequestCreate,
  parseSwapRequestFilters,
  parseSwapRequestUpdate,
  parseUserFilters,
} from './validation'

const PORT = 4000
const DEFAULT_DATA = path.join(__dirname, 'data')
const SEED = path.join(__dirname, '..', 'public', 'db')

type Comparator<T> = (a: T, b: T) => number
const byId = <T extends { id: string }>(a: T, b: T) => a.id.localeCompare(b.id)
const byDate = (a: Skill, b: Skill) => (a.createdAt + a.id).localeCompare(b.createdAt + b.id)
const newestFirst = (a: SwapRequest, b: SwapRequest) =>
  (b.createdAt + b.id).localeCompare(a.createdAt + a.id)

/** FNV-1a: одинаковые сид и id дают одинаковый порядок. */
function hash(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function paginate<T>(query: ListQuery, all: T[]): Paginated<T> {
  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.min(Math.max(1, Number(query.limit) || 10), 100)
  const start = (page - 1) * limit
  return {
    items: all.slice(start, start + limit),
    page,
    limit,
    total: all.length,
    hasMore: start + limit < all.length,
  }
}

/** Проверяем сигнатуру файла, а не только присланный Content-Type. */
function imageExtension(file: Express.Multer.File): string {
  const bytes = file.buffer
  if (
    file.mimetype === 'image/png' &&
    bytes.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'))
  )
    return '.png'
  if (file.mimetype === 'image/jpeg' && bytes.subarray(0, 3).equals(Buffer.from('ffd8ff', 'hex')))
    return '.jpg'
  if (
    file.mimetype === 'image/webp' &&
    bytes.toString('ascii', 0, 4) === 'RIFF' &&
    bytes.toString('ascii', 8, 12) === 'WEBP'
  )
    return '.webp'
  throw new HttpError(400, 'Файл должен быть изображением JPEG, PNG или WebP')
}

interface AppOptions {
  dataDir?: string
  defaultDelay?: number
}

/** Отдельная база и задержка позволяют проверять API без изменения локальных данных. */
export function createApp({ dataDir = DEFAULT_DATA, defaultDelay = 1000 }: AppOptions = {}) {
  fs.mkdirSync(dataDir, { recursive: true })
  for (const name of ['users', 'skills', 'swap-requests']) {
    const file = path.join(dataDir, `${name}.json`)
    if (!fs.existsSync(file)) fs.copyFileSync(path.join(SEED, `${name}.json`), file)
  }
  // Сиды доверенные: проверка JSON при запуске намеренно не выполняется.
  const users: StoredUser[] = JSON.parse(fs.readFileSync(path.join(dataDir, 'users.json'), 'utf-8'))
  const skills: Skill[] = JSON.parse(fs.readFileSync(path.join(dataDir, 'skills.json'), 'utf-8'))
  const swapRequests: SwapRequest[] = JSON.parse(
    fs.readFileSync(path.join(dataDir, 'swap-requests.json'), 'utf-8'),
  )
  const likesReceived = new Map<string, number>()
  for (const user of users) {
    for (const id of user.likes) likesReceived.set(id, (likesReceived.get(id) || 0) + 1)
  }
  const publicUser = ({ password: _password, ...rest }: StoredUser): User => rest
  const currentUser = (req: Pick<Request, 'headers'>): StoredUser => {
    const authorization = req.headers.authorization || ''
    const id = authorization.startsWith('Bearer token-')
      ? authorization.slice('Bearer token-'.length)
      : ''
    const user = users.find((item) => item.id === id)
    if (!user) throw new HttpError(401, 'Нужна авторизация')
    return user
  }
  const authUser = (user: StoredUser): AuthUser => ({
    id: user.id,
    name: user.name,
    email: user.email,
    token: `token-${user.id}`,
  })
  /** Участники и навыки берутся из базы: у каждого пользователя есть навык canTeach. */
  const swapDetails = (request: SwapRequest): SwapRequestDetails => {
    const fromUser = users.find((item) => item.id === request.fromUserId) as StoredUser
    const toUser = users.find((item) => item.id === request.toUserId) as StoredUser
    return {
      ...request,
      fromUser: publicUser(fromUser),
      toUser: publicUser(toUser),
      skill: skills.find((item) => item.id === request.skillId) as Skill,
      offeredSkill: skills.find((item) => item.id === fromUser.canTeach.id) as Skill,
    }
  }
  const findOwnSwapRequest = (id: string, user: StoredUser) =>
    swapRequests.find(
      (item) => item.id === id && (item.fromUserId === user.id || item.toUserId === user.id),
    )
  const save = (
    name: 'users' | 'skills' | 'swap-requests',
    values: StoredUser[] | Skill[] | SwapRequest[],
  ) => {
    const file = path.join(dataDir, `${name}.json`)
    const temporary = `${file}.tmp`
    try {
      fs.writeFileSync(temporary, JSON.stringify(values, null, 2))
      fs.renameSync(temporary, file)
    } finally {
      fs.rmSync(temporary, { force: true })
    }
  }
  const userSorts: Record<string, (seed: string) => Comparator<StoredUser>> = {
    new: () => (a, b) => b.createdAt.localeCompare(a.createdAt) || byId(a, b),
    popular: () => (a, b) =>
      (likesReceived.get(b.id) || 0) - (likesReceived.get(a.id) || 0) || byId(a, b),
    random: (seed) => (a, b) => hash(seed + a.id) - hash(seed + b.id) || byId(a, b),
  }

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_FILE_SIZE, files: 6, fields: 1, fieldSize: 32 * 1024 },
    fileFilter: (_req, file, callback) => {
      if (!ALLOWED_IMAGE_TYPES.some((type) => type === file.mimetype)) {
        callback(new HttpError(400, 'Разрешены только JPEG, PNG и WebP'))
      } else callback(null, true)
    },
  })
  const app = express()
  app.use(express.json())
  app.use((_req, res, next) => {
    res.set('Access-Control-Allow-Origin', '*')
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
    if (_req.method === 'OPTIONS') {
      res.sendStatus(204)
      return
    }
    next()
  })
  app.use('/api/uploads', express.static(path.join(dataDir, 'uploads'), { index: false }))
  app.use((req, _res, next) => {
    const delay = req.query.delay
      ? Math.min(Math.max(1000, Number(req.query.delay) || 0), 5000)
      : defaultDelay
    setTimeout(next, delay)
  })

  app.get<Record<string, never>, Paginated<Skill>, never, ListQuery>('/api/skills', (req, res) => {
    const { category, subCategory, type, q } = req.query
    let list = skills
    if (category) list = list.filter((skill) => skill.category === category)
    if (subCategory) list = list.filter((skill) => skill.subCategory === subCategory)
    if (type) list = list.filter((skill) => skill.type === type)
    if (q)
      list = list.filter((skill) => skill.title.toLowerCase().includes(String(q).toLowerCase()))
    res.json(paginate(req.query, [...list].sort(byDate)))
  })
  app.get<{ id: string }, Skill | ApiError>('/api/skills/:id', (req, res) => {
    const skill = skills.find((item) => item.id === req.params.id)
    if (!skill) {
      res.status(404).json({ message: 'Навык не найден' })
      return
    }
    res.json(skill)
  })
  app.get<Record<string, never>, Paginated<User> | ApiError, never, UserListQuery>(
    '/api/users',
    (req, res) => {
      const makeComparator = userSorts[String(req.query.sort || 'new')]
      if (!makeComparator || !Object.hasOwn(userSorts, String(req.query.sort || 'new'))) {
        res.status(400).json({ message: `Неизвестная сортировка: ${req.query.sort}` })
        return
      }
      const { gender, city, cities, type, subCategoryIds, userIds, name } = parseUserFilters(
        req.query,
      )
      const requestedIds = userIds === undefined ? undefined : new Set(userIds)
      const matchingSkillIds = name
        ? new Set(
            skills
              .filter((skill) => skill.title.toLowerCase().includes(name))
              .map((skill) => skill.id),
          )
        : undefined
      const matchingSubCategoryIds = name
        ? new Set(
            SKILL_CATEGORIES.flatMap((category) =>
              category.subcategories
                .filter((subCategory) => subCategory.title.toLowerCase().includes(name))
                .map((subCategory) => subCategory.id),
            ),
          )
        : undefined
      const list = users.filter((user) => {
        if (requestedIds && !requestedIds.has(user.id)) return false
        // Режим описывает желание посетителя: учиться у преподавателя или обучать ученика.
        if (name) {
          const canTeach = type !== 'teach' && matchingSkillIds?.has(user.canTeach.id)
          const wantsToLearn =
            type !== 'learn' && user.wantsToLearn.some((id) => matchingSubCategoryIds?.has(id))
          if (!canTeach && !wantsToLearn) return false
        }
        if (gender !== undefined && user.gender !== gender) return false
        if (city !== undefined && user.city !== city) return false
        if (cities.length > 0 && !cities.includes(user.city)) return false
        if (subCategoryIds.length === 0) return true
        return (
          (type !== 'teach' && subCategoryIds.includes(user.canTeach.subCategory)) ||
          (type !== 'learn' && user.wantsToLearn.some((id) => subCategoryIds.includes(id)))
        )
      })
      const { items, ...meta } = paginate(
        req.query,
        list.sort(makeComparator(new Date().toISOString().slice(0, 10))),
      )
      res.json({ items: items.map(publicUser), ...meta })
    },
  )
  app.get<{ id: string }, User | ApiError>('/api/users/:id', (req, res) => {
    const user = users.find((item) => item.id === req.params.id)
    if (!user) {
      res.status(404).json({ message: 'Пользователь не найден' })
      return
    }
    res.json(publicUser(user))
  })

  app.post<Record<string, never>, AuthResponse, unknown>(
    '/api/auth/register',
    (req, _res, next) => {
      if (!req.is('multipart/form-data')) {
        next(new HttpError(400, 'Ожидается multipart/form-data с полем data'))
        return
      }
      next()
    },
    upload.fields([
      { name: 'images', maxCount: 5 },
      { name: 'avatar', maxCount: 1 },
    ]),
    (req, res) => {
      const body: unknown = req.body
      const raw = body && typeof body === 'object' && 'data' in body ? body.data : undefined
      if (typeof raw !== 'string') throw new HttpError(400, 'Поле data должно содержать JSON формы')
      let parsed: unknown
      try {
        parsed = JSON.parse(raw)
      } catch {
        throw new HttpError(400, 'Некорректный JSON в поле data')
      }
      const data = parseRegistration(parsed)
      const uploads = req.files as Record<string, Express.Multer.File[]> | undefined
      const files = uploads?.images ?? []
      const avatar = uploads?.avatar?.[0]
      const extensions = files.map(imageExtension)
      const avatarExtension = avatar ? imageExtension(avatar) : undefined
      if (users.some((user) => user.email.trim().toLowerCase() === data.email)) {
        throw new HttpError(409, 'Этот email уже занят')
      }

      const userId = `user-${randomUUID()}`
      const skillId = `skill-${randomUUID()}`
      const createdAt = new Date().toISOString()
      const folder = path.join(dataDir, 'uploads', 'skills', skillId)
      const avatarFolder = path.join(dataDir, 'uploads', 'avatars', encodeURIComponent(userId))
      const avatarName = avatarExtension ? `${randomUUID()}${avatarExtension}` : undefined
      const names = extensions.map((extension) => `${randomUUID()}${extension}`)
      const imageUrls = names.map((name) => `/api/uploads/skills/${skillId}/${name}`)
      const skill: Skill = {
        ...data.canTeach,
        id: skillId,
        authorId: userId,
        type: 'teach',
        createdAt,
        imageUrls,
        tags: [],
      }
      const user: StoredUser = {
        id: userId,
        name: data.name,
        email: data.email,
        password: data.password,
        birthDate: data.birthDate,
        gender: data.gender,
        city: data.city,
        wantsToLearn: data.wantsToLearn,
        canTeach: { id: skillId, category: skill.category, subCategory: skill.subCategory },
        createdAt,
        avatarUrl: avatarName
          ? `/api/uploads/avatars/${encodeURIComponent(userId)}/${avatarName}`
          : null,
        bio: '',
        likes: [],
      }
      try {
        if (files.length) fs.mkdirSync(folder, { recursive: true })
        files.forEach((file, index) =>
          fs.writeFileSync(path.join(folder, names[index]), file.buffer),
        )
        if (avatar && avatarName) {
          fs.mkdirSync(avatarFolder, { recursive: true })
          fs.writeFileSync(path.join(avatarFolder, avatarName), avatar.buffer)
        }
        save('skills', [...skills, skill])
        try {
          save('users', [...users, user])
        } catch (error) {
          // Возвращаем прежние навыки, если запись пользователя не удалась.
          save('skills', skills)
          throw error
        }
      } catch (error) {
        fs.rmSync(folder, { recursive: true, force: true })
        fs.rmSync(avatarFolder, { recursive: true, force: true })
        throw error
      }
      skills.push(skill)
      users.push(user)
      res.status(201).json({
        ...authUser(user),
        ...(avatarName ? { avatarUrl: user.avatarUrl } : {}),
      })
    },
  )
  app.post<Record<string, never>, AuthResponse, unknown>('/api/auth/login', (req, res) => {
    const { email, password } = parseLogin(req.body)
    const user = users.find((item) => item.email.trim().toLowerCase() === email)
    if (!user || user.password !== password) {
      res.status(401).json({ message: 'Неправильные почта или пароль' })
      return
    }
    res.json(authUser(user))
  })
  app.get<Record<string, never>, User | ApiError>('/api/auth/me', (req, res) => {
    res.json(publicUser(currentUser(req)))
  })
  const updateLike = (req: Request<{ targetUserId: string }>, res: express.Response<ApiError>) => {
    const user = currentUser(req)
    const target = users.find((item) => item.id === req.params.targetUserId)
    if (!target) throw new HttpError(404, 'Пользователь не найден')
    const liked = req.method === 'PUT'
    if (user.likes.includes(target.id) === liked) {
      res.status(204).end()
      return
    }
    const updated = {
      ...user,
      likes: liked ? [...user.likes, target.id] : user.likes.filter((id) => id !== target.id),
    }
    // Публикуем изменение профиля и популярности только после сохранения базы.
    save(
      'users',
      users.map((item) => (item.id === user.id ? updated : item)),
    )
    users[users.indexOf(user)] = updated
    likesReceived.set(target.id, (likesReceived.get(target.id) || 0) + (liked ? 1 : -1))
    res.status(liked ? 201 : 204).end()
  }
  app.put('/api/auth/me/likes/:targetUserId', updateLike)
  app.delete('/api/auth/me/likes/:targetUserId', updateLike)
  app.patch<Record<string, never>, User | ApiError, unknown>(
    '/api/auth/me',
    (req, _res, next) => {
      currentUser(req)
      if (!req.is('application/json') && !req.is('multipart/form-data')) {
        throw new HttpError(400, 'Ожидается JSON или multipart/form-data с полями data и avatar')
      }
      next()
    },
    upload.single('avatar'),
    (req, res) => {
      const user = currentUser(req)
      let raw: unknown = req.body
      if (req.is('multipart/form-data')) {
        const body = req.body as Record<string, unknown>
        if (Object.keys(body).some((key) => key !== 'data')) {
          throw new HttpError(400, 'Допустимы поле data и один файл avatar')
        }
        if (body.data === undefined) raw = {}
        else {
          if (typeof body.data !== 'string') throw new HttpError(400, 'Поле data должно быть JSON')
          try {
            raw = JSON.parse(body.data)
          } catch {
            throw new HttpError(400, 'Некорректный JSON в поле data')
          }
        }
      }
      const data = parseProfileUpdate(raw)
      if (Object.keys(data).length === 0 && !req.file) {
        throw new HttpError(400, 'Передайте поля профиля или аватарку')
      }
      if (
        data.email &&
        users.some((item) => item.id !== user.id && item.email.trim().toLowerCase() === data.email)
      ) {
        throw new HttpError(409, 'Этот email уже занят')
      }
      const folder = path.join(dataDir, 'uploads', 'avatars', encodeURIComponent(user.id))
      const prefix = `/api/uploads/avatars/${encodeURIComponent(user.id)}/`
      const name = req.file ? `${randomUUID()}${imageExtension(req.file)}` : undefined
      const updated = { ...user, ...data, avatarUrl: name ? prefix + name : user.avatarUrl }
      try {
        if (name && req.file) {
          fs.mkdirSync(folder, { recursive: true })
          fs.writeFileSync(path.join(folder, name), req.file.buffer)
        }
        save(
          'users',
          users.map((item) => (item.id === user.id ? updated : item)),
        )
      } catch (error) {
        if (name) fs.rmSync(path.join(folder, name), { force: true })
        throw error
      }
      users[users.indexOf(user)] = updated
      // Удаляем только собственный файл и только после успешного сохранения профиля.
      const oldName = user.avatarUrl?.startsWith(prefix) ? user.avatarUrl.slice(prefix.length) : ''
      if (name && /^[a-f0-9-]{36}\.(png|jpg|webp)$/.test(oldName)) {
        try {
          fs.rmSync(path.join(folder, oldName), { force: true })
        } catch (error) {
          console.error('Не удалось удалить старую аватарку', error)
        }
      }
      res.json(publicUser(updated))
    },
  )

  app.post<Record<string, never>, SwapRequestDetails | ApiError, unknown>(
    '/api/swap-requests',
    (req, res) => {
      const user = currentUser(req)
      const { skillId } = parseSwapRequestCreate(req.body)
      const skill = skills.find((item) => item.id === skillId)
      // Навык приходит в теле, поэтому 400: на 404 фронт уводит на страницу «не найдено».
      if (!skill) throw new HttpError(400, 'Навык не найден')
      if (skill.authorId === user.id) {
        throw new HttpError(400, 'Нельзя предложить обмен на свой навык')
      }
      const own = swapRequests.find(
        (item) => item.fromUserId === user.id && item.skillId === skill.id,
      )
      if (own) {
        throw new HttpError(
          409,
          own.status === 'rejected'
            ? 'Заявка на этот навык отклонена: удалите её, чтобы предложить обмен снова'
            : own.status === 'accepted'
              ? 'Обмен на этот навык уже подтверждён'
              : 'Вы уже предложили обмен на этот навык',
        )
      }
      // Встречная заявка описывает тот же обмен: второй её экземпляр дал бы дубль.
      const counter = swapRequests.find(
        (item) =>
          item.fromUserId === skill.authorId &&
          item.toUserId === user.id &&
          item.status !== 'rejected',
      )
      if (counter) {
        throw new HttpError(
          409,
          counter.status === 'accepted'
            ? 'Обмен с этим пользователем уже подтверждён'
            : 'Пользователь уже предложил вам обмен: ответьте на его заявку',
        )
      }
      const createdAt = new Date().toISOString()
      const request: SwapRequest = {
        id: `swap-${randomUUID()}`,
        skillId: skill.id,
        fromUserId: user.id,
        toUserId: skill.authorId,
        status: 'pending',
        createdAt,
        updatedAt: createdAt,
      }
      save('swap-requests', [...swapRequests, request])
      swapRequests.push(request)
      res.status(201).json(swapDetails(request))
    },
  )
  app.get<
    Record<string, never>,
    Paginated<SwapRequestDetails> | ApiError,
    never,
    SwapRequestListQuery
  >('/api/swap-requests', (req, res) => {
    const user = currentUser(req)
    const { role, status } = parseSwapRequestFilters(req.query)
    const list = swapRequests.filter((item) => {
      const outgoing = item.fromUserId === user.id
      // Отклонённую заявку видит только инициатор: у получателя она пропадает.
      const incoming = item.toUserId === user.id && item.status !== 'rejected'
      const matchesRole =
        role === 'incoming' ? incoming : role === 'outgoing' ? outgoing : incoming || outgoing
      return matchesRole && (status === undefined || item.status === status)
    })
    const { items, ...meta } = paginate(req.query, list.sort(newestFirst))
    res.json({ items: items.map(swapDetails), ...meta })
  })
  app.patch<{ id: string }, SwapRequestDetails | ApiError, unknown>(
    '/api/swap-requests/:id',
    (req, res) => {
      const user = currentUser(req)
      const { status } = parseSwapRequestUpdate(req.body)
      const request = findOwnSwapRequest(req.params.id, user)
      // Заявки нет, если инициатор её отозвал. 409, а не 404: на 404 фронт уводит на «не найдено».
      if (!request) throw new HttpError(409, 'Заявка отозвана')
      if (request.toUserId !== user.id) {
        throw new HttpError(403, 'Принять или отклонить заявку может только получатель')
      }
      // Повторное нажатие той же кнопки возвращает заявку без изменений.
      if (request.status === status) {
        res.json(swapDetails(request))
        return
      }
      if (request.status !== 'pending') throw new HttpError(409, 'Заявка уже обработана')
      const updated = { ...request, status, updatedAt: new Date().toISOString() }
      save(
        'swap-requests',
        swapRequests.map((item) => (item.id === request.id ? updated : item)),
      )
      swapRequests[swapRequests.indexOf(request)] = updated
      res.json(swapDetails(updated))
    },
  )
  app.delete<{ id: string }, ApiError>('/api/swap-requests/:id', (req, res) => {
    const user = currentUser(req)
    const request = findOwnSwapRequest(req.params.id, user)
    // Как у лайков: повторное удаление не ошибка и не уводит фронт на страницу 404.
    if (!request) {
      res.status(204).end()
      return
    }
    if (request.fromUserId !== user.id) {
      throw new HttpError(403, 'Удалить заявку может только её автор')
    }
    if (request.status === 'accepted') {
      throw new HttpError(409, 'Подтверждённый обмен нельзя удалить')
    }
    save(
      'swap-requests',
      swapRequests.filter((item) => item.id !== request.id),
    )
    swapRequests.splice(swapRequests.indexOf(request), 1)
    res.status(204).end()
  })
  app.use((req: Request, res: express.Response<ApiError>) => {
    res.status(404).json({ message: `Ручки ${req.method} ${req.path} нет` })
  })
  const handleError: ErrorRequestHandler = (
    error: unknown,
    req,
    res: express.Response<ApiError>,
    _next,
  ) => {
    if (error instanceof HttpError) {
      res.status(error.status).json({ message: error.message })
      return
    }
    if (error instanceof multer.MulterError) {
      const message =
        error.code === 'LIMIT_FILE_SIZE'
          ? 'Размер изображения превышает 2 МБ'
          : req.method === 'PATCH' && req.path === '/api/auth/me'
            ? 'Допустимы поле data и один файл avatar'
            : 'Допустимы поле data, до 5 файлов images и один файл avatar'
      res.status(400).json({ message })
      return
    }
    if (error instanceof SyntaxError && 'body' in error) {
      res.status(400).json({ message: 'Некорректный JSON' })
      return
    }
    console.error(error)
    res.status(500).json({ message: 'Не удалось обработать запрос' })
  }
  app.use(handleError)
  return app
}

if (require.main === module) {
  createApp().listen(PORT, () => console.log(`SkillSwap mock API → http://localhost:${PORT}/api`))
}
