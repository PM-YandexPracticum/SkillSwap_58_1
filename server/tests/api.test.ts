import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { once } from 'node:events'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import type { Server } from 'node:http'
import { createApp } from '../index'
import type { AuthUser, Skill, User } from '../../src/shared/types'
import type { ApiError, Paginated, RegisterRequest, StoredUser } from '../types'

const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'skillswap-api-'))
const png = fs.readFileSync(path.join(__dirname, '../postman/fixtures/skill.png'))
let server: Server
let baseUrl: string
let sequence = 0
function payload(): RegisterRequest {
  return {
    email: `test-${sequence++}@example.com`,
    password: '  пароль123  ',
    name: 'Тестовый пользователь',
    birthDate: '1995-02-08T00:00:00.000Z',
    gender: 'female',
    city: 'Москва',
    wantsToLearn: ['english', 'acting'],
    canTeach: {
      title: 'Уроки рисования',
      category: 'art',
      subCategory: 'illustration',
      description: 'Обучаю рисованию',
    },
  }
}
async function register(
  data: unknown,
  count = 1,
  bytes: Uint8Array = png,
  mime = 'image/png',
  avatar?: Blob,
) {
  const form = new FormData()
  form.append('data', typeof data === 'string' ? data : JSON.stringify(data))
  for (let i = 0; i < count; i++)
    form.append('images', new Blob([bytes], { type: mime }), `image-${i}.png`)
  if (avatar) form.append('avatar', avatar, 'avatar.png')
  return fetch(`${baseUrl}/auth/register`, { method: 'POST', body: form })
}
async function json<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>
}
async function login(data: unknown) {
  return fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}
before(async () => {
  server = createApp({ dataDir, defaultDelay: 0 }).listen(0, '127.0.0.1')
  await once(server, 'listening')
  const address = server.address()
  assert(address && typeof address !== 'string')
  baseUrl = `http://127.0.0.1:${address.port}/api`
})
after(async () => {
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  )
  fs.rmSync(dataDir, { recursive: true, force: true })
})

test('полная регистрация создаёт профиль, навык и пять доступных изображений', async () => {
  const data = payload()
  data.email = ` ${data.email.toUpperCase()} `
  const response = await register(data, 5)
  assert.equal(response.status, 201)
  const auth = await json<AuthUser>(response)
  assert.deepEqual(Object.keys(auth).sort(), ['email', 'id', 'name', 'token'])
  assert.equal(auth.email, data.email.trim().toLowerCase())
  const me = await json<User>(
    await fetch(`${baseUrl}/auth/me`, { headers: { Authorization: `Bearer ${auth.token}` } }),
  )
  assert.equal(me.name, data.name)
  assert.equal(me.birthDate, data.birthDate)
  assert.equal(me.gender, data.gender)
  assert.equal(me.city, data.city)
  assert.deepEqual(me.wantsToLearn, data.wantsToLearn)
  assert(!('password' in me) && !('login' in me))
  assert(!('likesReceived' in me))
  const skill = await json<Skill>(await fetch(`${baseUrl}/skills/${me.canTeach.id}`))
  assert.equal(skill.authorId, me.id)
  assert.equal(skill.title, data.canTeach.title)
  assert.equal(skill.description, data.canTeach.description)
  assert.equal(skill.type, 'teach')
  assert.equal(skill.imageUrls.length, 5)
  assert(!('skillAvatar' in skill))
  assert.equal(new Set(skill.imageUrls).size, 5)
  for (const url of skill.imageUrls) {
    assert(url.startsWith(`/api/uploads/skills/${skill.id}/`))
    const image = await fetch(`${baseUrl.replace('/api', '')}${url}`)
    assert.equal(image.status, 200)
    assert.match(image.headers.get('content-type') || '', /image\/png/)
    assert.deepEqual(Buffer.from(await image.arrayBuffer()), png)
  }
  const signedIn = await login({ email: data.email, password: data.password })
  assert.equal(signedIn.status, 200)
  assert.deepEqual(await signedIn.json(), auth)
  assert.equal((await login({ email: data.email, password: data.password.trim() })).status, 401)
  assert.equal((await register(data)).status, 409)
  const savedUsers: StoredUser[] = JSON.parse(
    fs.readFileSync(path.join(dataDir, 'users.json'), 'utf8'),
  )
  const savedSkills: Skill[] = JSON.parse(
    fs.readFileSync(path.join(dataDir, 'skills.json'), 'utf8'),
  )
  assert.deepEqual(savedUsers.find((user) => user.id === auth.id)?.wantsToLearn, data.wantsToLearn)
  assert(savedSkills.some((item) => item.id === skill.id))
  // Новый экземпляр читает созданные записи с диска, ссылки сохраняются после перезапуска.
  const restarted = createApp({ dataDir, defaultDelay: 0 }).listen(0, '127.0.0.1')
  await once(restarted, 'listening')
  try {
    const address = restarted.address()
    assert(address && typeof address !== 'string')
    const loaded = await fetch(`http://127.0.0.1:${address.port}${skill.imageUrls[0]}`)
    assert.equal(loaded.status, 200)
    const profile = await fetch(`http://127.0.0.1:${address.port}/api/users/${auth.id}`)
    assert.deepEqual(await profile.json(), me)
  } finally {
    await new Promise<void>((resolve) => restarted.close(() => resolve()))
  }
})

test('регистрация сохраняет аватар и пять фото навыка; PATCH заменяет только аватар', async () => {
  const response = await register(
    payload(),
    5,
    png,
    'image/png',
    new Blob([png], { type: 'image/png' }),
  )
  assert.equal(response.status, 201)
  const auth = await json<AuthUser>(response)
  const headers = { Authorization: `Bearer ${auth.token}` }
  const me = await json<User>(await fetch(`${baseUrl}/auth/me`, { headers }))
  assert(me.avatarUrl)
  assert(me.avatarUrl.startsWith(`/api/uploads/avatars/${auth.id}/`))
  assert.equal(auth.avatarUrl, me.avatarUrl)
  const avatarPath = path.join(dataDir, me.avatarUrl.replace('/api/', ''))
  assert.deepEqual(fs.readFileSync(avatarPath), png)
  const image = await fetch(`${baseUrl.replace('/api', '')}${me.avatarUrl}`)
  assert.equal(image.status, 200)
  assert.match(image.headers.get('content-type') || '', /image\/png/)
  assert.deepEqual(Buffer.from(await image.arrayBuffer()), png)
  const saved: StoredUser[] = JSON.parse(fs.readFileSync(path.join(dataDir, 'users.json'), 'utf8'))
  assert.equal(saved.find((user) => user.id === auth.id)?.avatarUrl, me.avatarUrl)
  const skill = await json<Skill>(await fetch(`${baseUrl}/skills/${me.canTeach.id}`))
  assert.equal(skill.imageUrls.length, 5)
  assert(!skill.imageUrls.includes(me.avatarUrl))

  const body = new FormData()
  body.append('avatar', new Blob([png], { type: 'image/png' }), 'replacement.png')
  const patch = await fetch(`${baseUrl}/auth/me`, { method: 'PATCH', headers, body })
  assert.equal(patch.status, 200)
  const updated = await json<User>(patch)
  assert.notEqual(updated.avatarUrl, me.avatarUrl)
  assert.equal(fs.existsSync(avatarPath), false)
  assert.equal(fs.readdirSync(path.join(dataDir, 'uploads', 'avatars', auth.id)).length, 1)
  assert.deepEqual(await json<Skill>(await fetch(`${baseUrl}/skills/${skill.id}`)), skill)
})

test('регистрация принимает только аватар без фото навыка', async () => {
  const response = await register(
    payload(),
    0,
    png,
    'image/png',
    new Blob([png], { type: 'image/png' }),
  )
  assert.equal(response.status, 201)
  const auth = await json<AuthUser>(response)
  const me = await json<User>(
    await fetch(`${baseUrl}/auth/me`, { headers: { Authorization: `Bearer ${auth.token}` } }),
  )
  assert(me.avatarUrl)
  const skill = await json<Skill>(await fetch(`${baseUrl}/skills/${me.canTeach.id}`))
  assert.deepEqual(skill.imageUrls, [])
})

test('неверный аватар и два файла avatar отклоняются без изменения базы и файлов', async () => {
  const usersBefore = fs.readFileSync(path.join(dataDir, 'users.json'), 'utf8')
  const skillsBefore = fs.readFileSync(path.join(dataDir, 'skills.json'), 'utf8')
  const uploadsBefore = fs.readdirSync(path.join(dataDir, 'uploads'), { recursive: true })
  for (const avatar of [
    new Blob([png], { type: 'text/plain' }),
    new Blob(['not an image'], { type: 'image/png' }),
    new Blob([new Uint8Array(2 * 1024 * 1024 + 1)], { type: 'image/png' }),
  ]) {
    assert.equal((await register(payload(), 1, png, 'image/png', avatar)).status, 400)
  }
  const body = new FormData()
  body.append('data', JSON.stringify(payload()))
  for (let i = 0; i < 2; i++)
    body.append('avatar', new Blob([png], { type: 'image/png' }), 'avatar.png')
  assert.equal((await fetch(`${baseUrl}/auth/register`, { method: 'POST', body })).status, 400)
  assert.equal(fs.readFileSync(path.join(dataDir, 'users.json'), 'utf8'), usersBefore)
  assert.equal(fs.readFileSync(path.join(dataDir, 'skills.json'), 'utf8'), skillsBefore)
  assert.deepEqual(
    fs.readdirSync(path.join(dataDir, 'uploads'), { recursive: true }),
    uploadsBefore,
  )
})

test('регистрация без фотографий сохраняет навык с пустым imageUrls после перезапуска', async () => {
  const data = payload()
  const response = await register(data, 0)
  assert.equal(response.status, 201)
  const auth = await json<AuthUser>(response)
  const me = await json<User>(
    await fetch(`${baseUrl}/auth/me`, { headers: { Authorization: `Bearer ${auth.token}` } }),
  )
  assert.equal(me.avatarUrl, null)
  const skillResponse = await fetch(`${baseUrl}/skills/${me.canTeach.id}`)
  assert.equal(skillResponse.status, 200)
  const skill = await json<Skill>(skillResponse)
  assert.equal(skill.authorId, auth.id)
  assert.equal(skill.title, data.canTeach.title)
  assert.deepEqual(skill.imageUrls, [])
  assert.equal(fs.existsSync(path.join(dataDir, 'uploads', 'skills', skill.id)), false)

  const restarted = createApp({ dataDir, defaultDelay: 0 }).listen(0, '127.0.0.1')
  await once(restarted, 'listening')
  try {
    const address = restarted.address()
    assert(address && typeof address !== 'string')
    const restartedUrl = `http://127.0.0.1:${address.port}/api`
    const signedIn = await fetch(`${restartedUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: data.email, password: data.password }),
    })
    assert.equal(signedIn.status, 200)
    assert.deepEqual(await signedIn.json(), auth)
    const loaded = await fetch(`${restartedUrl}/skills/${skill.id}`)
    assert.equal(loaded.status, 200)
    assert.deepEqual(await loaded.json(), skill)
  } finally {
    await new Promise<void>((resolve) => restarted.close(() => resolve()))
  }
})

test('null и пустой список фото перед отправкой нормализуются в отсутствие файлов', async () => {
  const emptyImages: (Blob[] | null)[] = [null, []]
  for (const images of emptyImages) {
    const form = new FormData()
    form.append('data', JSON.stringify(payload()))
    const files = images ?? []
    files.forEach((file) => form.append('images', file))
    assert.equal(form.has('images'), false)
    const response = await fetch(`${baseUrl}/auth/register`, { method: 'POST', body: form })
    assert.equal(response.status, 201)
    const auth = await json<AuthUser>(response)
    const me = await json<User>(
      await fetch(`${baseUrl}/auth/me`, { headers: { Authorization: `Bearer ${auth.token}` } }),
    )
    const skill = await json<Skill>(await fetch(`${baseUrl}/skills/${me.canTeach.id}`))
    assert.deepEqual(skill.imageUrls, [])
  }
})

test('строки null, [] и пустая строка вместо файлов images возвращают 400 без создания записей', async () => {
  for (const images of ['null', '[]', '']) {
    const usersBefore = fs.readFileSync(path.join(dataDir, 'users.json'), 'utf8')
    const skillsBefore = fs.readFileSync(path.join(dataDir, 'skills.json'), 'utf8')
    const form = new FormData()
    form.append('data', JSON.stringify(payload()))
    form.append('images', images)
    const response = await fetch(`${baseUrl}/auth/register`, { method: 'POST', body: form })
    assert.equal(response.status, 400)
    assert.equal(typeof (await json<ApiError>(response)).message, 'string')
    assert.equal(fs.readFileSync(path.join(dataDir, 'users.json'), 'utf8'), usersBefore)
    assert.equal(fs.readFileSync(path.join(dataDir, 'skills.json'), 'utf8'), skillsBefore)
  }
})

const invalid: [string, (data: Record<string, unknown>) => void][] = [
  [
    'отсутствует имя',
    (data) => {
      delete data.name
    },
  ],
  [
    'имя из пробелов',
    (data) => {
      data.name = '  '
    },
  ],
  [
    'неверный email',
    (data) => {
      data.email = 'broken'
    },
  ],
  [
    'короткий пароль',
    (data) => {
      data.password = '1234567'
    },
  ],
  [
    'число вместо пароля',
    (data) => {
      data.password = 12345678
    },
  ],
  [
    'город вне справочника',
    (data) => {
      data.city = 'Лондон'
    },
  ],
  [
    'неверный пол',
    (data) => {
      data.gender = 'other'
    },
  ],
  [
    'дата без времени',
    (data) => {
      data.birthDate = '1995-02-08'
    },
  ],
  [
    'невозможная дата',
    (data) => {
      data.birthDate = '1995-02-30T00:00:00.000Z'
    },
  ],
  [
    'будущая дата',
    (data) => {
      data.birthDate = '2995-02-08T00:00:00.000Z'
    },
  ],
  [
    'объект вместо массива интересов',
    (data) => {
      data.wantsToLearn = { categories: ['languages'], subCategories: ['english'] }
    },
  ],
  [
    'пустые интересы',
    (data) => {
      data.wantsToLearn = []
    },
  ],
  [
    'строка вместо массива интересов',
    (data) => {
      data.wantsToLearn = 'english'
    },
  ],
  [
    'неизвестная подкатегория',
    (data) => {
      data.wantsToLearn = ['unknown']
    },
  ],
  [
    'категория вместо подкатегории',
    (data) => {
      data.wantsToLearn = ['languages']
    },
  ],
  [
    'повторяющиеся ID',
    (data) => {
      data.wantsToLearn = ['acting', 'acting']
    },
  ],
  [
    'нестроковый ID',
    (data) => {
      data.wantsToLearn = ['english', 1]
    },
  ],
  [
    'null вместо массива интересов',
    (data) => {
      data.wantsToLearn = null
    },
  ],
  [
    'нет навыка',
    (data) => {
      delete data.canTeach
    },
  ],
  [
    'подкатегория навыка из другой категории',
    (data) => {
      data.canTeach = { ...payload().canTeach, subCategory: 'english' }
    },
  ],
  [
    'короткое название',
    (data) => {
      data.canTeach = { ...payload().canTeach, title: 'ab' }
    },
  ],
  [
    'длинное название',
    (data) => {
      data.canTeach = { ...payload().canTeach, title: 'a'.repeat(51) }
    },
  ],
  [
    'нет описания',
    (data) => {
      data.canTeach = { ...payload().canTeach, description: '' }
    },
  ],
  [
    'длинное описание',
    (data) => {
      data.canTeach = { ...payload().canTeach, description: 'a'.repeat(501) }
    },
  ],
]
for (const [name, mutate] of invalid) {
  test(`регистрация отклоняет: ${name}`, async () => {
    const data: Record<string, unknown> = { ...payload() }
    mutate(data)
    const snapshot = fs.readFileSync(path.join(dataDir, 'users.json'), 'utf8')
    const response = await register(data)
    assert.equal(response.status, 400)
    assert.equal(typeof (await json<ApiError>(response)).message, 'string')
    assert.equal(fs.readFileSync(path.join(dataDir, 'users.json'), 'utf8'), snapshot)
  })
}

test('все поля формы и вложенных объектов обязательны', async () => {
  for (const key of Object.keys(payload())) {
    const data: Record<string, unknown> = { ...payload() }
    delete data[key]
    assert.equal((await register(data)).status, 400, key)
  }
  for (const key of Object.keys(payload().canTeach)) {
    const data = payload()
    delete (data.canTeach as unknown as Record<string, unknown>)[key]
    assert.equal((await register(data)).status, 400, `canTeach.${key}`)
  }
})

test('лимиты файлов, неверные типы и сломанный JSON', async () => {
  assert.equal((await register(payload(), 6)).status, 400)
  assert.equal((await register(payload(), 1, new Uint8Array(2 * 1024 * 1024 + 1))).status, 400)
  assert.equal((await register(payload(), 1, png, 'text/plain')).status, 400)
  assert.equal((await register(payload(), 1, Buffer.from('not an image'))).status, 400)
  assert.equal((await register('{broken')).status, 400)
  assert.equal((await fetch(`${baseUrl}/auth/register`, { method: 'POST' })).status, 400)
})

test('ошибка записи пользователя откатывает навык и удаляет загруженные файлы', async () => {
  const skillsFile = path.join(dataDir, 'skills.json')
  const snapshot = fs.readFileSync(skillsFile, 'utf8')
  const uploads = path.join(dataDir, 'uploads', 'skills')
  const folders = fs.readdirSync(uploads)
  const avatars = path.join(dataDir, 'uploads', 'avatars')
  const avatarFolders = fs.readdirSync(avatars)
  const userFile = path.join(dataDir, 'users.json')
  fs.renameSync(userFile, `${userFile}.backup`)
  fs.mkdirSync(userFile)
  const log = console.error
  console.error = () => {}
  try {
    assert.equal(
      (await register(payload(), 1, png, 'image/png', new Blob([png], { type: 'image/png' })))
        .status,
      500,
    )
    assert.equal(fs.readFileSync(skillsFile, 'utf8'), snapshot)
    assert.deepEqual(fs.readdirSync(uploads), folders)
    assert.deepEqual(fs.readdirSync(avatars), avatarFolders)
  } finally {
    console.error = log
    fs.rmdirSync(userFile)
    fs.renameSync(`${userFile}.backup`, userFile)
  }
})

test('вход по почте, 400 для неполных запросов и одинаковые ошибки неверных учётных данных', async () => {
  assert.equal(
    (await login({ email: ' ANNA.SMIRNOVA@EXAMPLE.COM ', password: 'SkillSwapMock2025!' })).status,
    200,
  )
  for (const data of [
    {},
    { login: 'anna.smirnova', password: 'SkillSwapMock2025!' },
    { email: 'broken', password: '12345678' },
  ]) {
    assert.equal((await login(data)).status, 400)
  }
  const wrongPassword = await login({ email: 'anna.smirnova@example.com', password: 'wrong' })
  const missingUser = await login({ email: 'missing@example.com', password: 'wrong' })
  assert.equal(wrongPassword.status, 401)
  assert.equal(missingUser.status, 401)
  assert.deepEqual(await wrongPassword.json(), await missingUser.json())
})

test('публичные пользователи без секретов, пагинация, удалённая имитация ошибок', async () => {
  const response = await fetch(`${baseUrl}/users?fail=500&limit=10`)
  assert.equal(response.status, 200)
  const body = await json<Paginated<User>>(response)
  assert.equal(body.items.length, 10)
  assert.equal(body.hasMore, true)
  body.items.forEach((user) => {
    assert(!('password' in user) && !('login' in user))
    assert(!('likesReceived' in user))
    assert(Array.isArray(user.wantsToLearn))
    assert(user.wantsToLearn.every((id) => typeof id === 'string'))
  })
  const seeded = await json<User>(await fetch(`${baseUrl}/users/user-01`))
  assert(!('likesReceived' in seeded))
  assert.deepEqual(seeded.wantsToLearn, ['acting', 'german', 'team-management'])
  assert.equal((await fetch(`${baseUrl}/users?sort=toString`)).status, 400)
  assert.equal((await fetch(`${baseUrl}/auth/me`)).status, 401)
  assert.equal((await fetch(`${baseUrl}/skills/missing`)).status, 404)
})

test('popular сортирует по входящим лайкам без передачи счётчика клиенту', async () => {
  const popularDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'skillswap-popular-'))
  const [template]: StoredUser[] = JSON.parse(
    fs.readFileSync(path.join(dataDir, 'users.json'), 'utf8'),
  )
  // Исходящих лайков: 3, 1, 2, 0; входящих: 0, 2, 1, 3.
  const likes = [['user-02', 'user-03', 'user-04'], ['user-04'], ['user-02', 'user-04'], []]
  const users: StoredUser[] = likes.map((userLikes, index) => ({
    ...template,
    id: `user-0${index + 1}`,
    likes: userLikes,
  }))
  fs.writeFileSync(path.join(popularDataDir, 'users.json'), JSON.stringify(users))
  const popularServer = createApp({ dataDir: popularDataDir, defaultDelay: 0 }).listen(
    0,
    '127.0.0.1',
  )
  try {
    await once(popularServer, 'listening')
    const address = popularServer.address()
    assert(address && typeof address !== 'string')
    const url = `http://127.0.0.1:${address.port}/api/users?sort=popular&limit=2`
    const first = await json<Paginated<User>>(await fetch(`${url}&page=1`))
    const second = await json<Paginated<User>>(await fetch(`${url}&page=2`))
    assert.deepEqual(
      first.items.map((user) => user.id),
      ['user-04', 'user-02'],
    )
    assert.deepEqual(
      second.items.map((user) => user.id),
      ['user-03', 'user-01'],
    )
    assert.equal(first.total, 4)
    assert.equal(first.hasMore, true)
    assert.equal(second.hasMore, false)
    for (const user of [...first.items, ...second.items]) assert(!('likesReceived' in user))
  } finally {
    await new Promise<void>((resolve) => popularServer.close(() => resolve()))
    fs.rmSync(popularDataDir, { recursive: true, force: true })
  }
})
