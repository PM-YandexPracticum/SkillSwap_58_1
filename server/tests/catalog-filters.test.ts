import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { once } from 'node:events'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import type { Server } from 'node:http'
import { createApp } from '../index'
import { fetchUsers } from '../../src/api/users'
import { INITIAL_FILTERS_STATE } from '../../src/shared/lib/constants'
import type { Skill } from '../../src/shared/types'
import type { StoredUser } from '../types'

const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'skillswap-catalog-merge-'))
let server: Server
let baseUrl: string
const realFetch = globalThis.fetch

before(async () => {
  const [template]: StoredUser[] = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../../public/db/users.json'), 'utf8'),
  )
  const [skill]: Skill[] = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../../public/db/skills.json'), 'utf8'),
  )
  const users = Array.from({ length: 12 }, (_, index) => ({
    ...template,
    id: `catalog-${index}`,
    email: `catalog-${index}@example.com`,
    name: 'Не название навыка',
    gender: 'female',
    city: index % 3 === 0 ? 'Москва' : index % 3 === 1 ? 'Казань' : 'Омск',
    likes: [],
    createdAt: `2025-01-${String(20 - index).padStart(2, '0')}T00:00:00.000Z`,
    canTeach: { id: `catalog-skill-${index}`, category: 'art', subCategory: 'music-sound' },
    wantsToLearn: ['english'],
  }))
  fs.writeFileSync(path.join(dataDir, 'users.json'), JSON.stringify(users))
  fs.writeFileSync(
    path.join(dataDir, 'skills.json'),
    JSON.stringify(
      users.map((user, index) => ({
        ...skill,
        id: user.canTeach.id,
        authorId: user.id,
        category: 'art',
        subCategory: 'music-sound',
        title: index === 11 ? 'Уникальная гитара' : 'Барабаны',
      })),
    ),
  )
  server = createApp({ dataDir, defaultDelay: 0 }).listen(0, '127.0.0.1')
  await once(server, 'listening')
  const address = server.address()
  assert(address && typeof address !== 'string')
  baseUrl = `http://127.0.0.1:${address.port}`
  // Вызываем настоящий клиент фронтенда через HTTP, не подменяя ответы сервера.
  globalThis.fetch = (input, init) => realFetch(new URL(String(input), baseUrl), init)
})
after(async () => {
  globalThis.fetch = realFetch
  await new Promise<void>((resolve) => server.close(() => resolve()))
  fs.rmSync(dataDir, { recursive: true, force: true })
})

test('клиент находит навык за пределами первой страницы до пагинации', async () => {
  const initial = await fetchUsers(1, 9, 'new')
  assert(!initial.users.some((user) => user.id === 'catalog-11'))
  const found = await fetchUsers(1, 9, 'new', {
    ...INITIAL_FILTERS_STATE,
    name: '  УНИКАЛЬНАЯ ГИТАРА  ',
  })
  assert.deepEqual(
    found.users.map((user) => user.id),
    ['catalog-11'],
  )
  assert.equal(found.total, 1)
  assert.equal(found.hasMore, false)
})

test('несколько городов объединяются до сортировки и пагинации во всех подборках', async () => {
  const filters = {
    ...INITIAL_FILTERS_STATE,
    cities: ['Москва', 'Казань'],
    gender: 'Женский' as const,
  }
  for (const sort of ['new', 'popular', 'random']) {
    const first = await fetchUsers(1, 3, sort, filters)
    const second = await fetchUsers(2, 3, sort, filters)
    const third = await fetchUsers(3, 3, sort, filters)
    assert.equal(first.total, 8)
    assert.equal(first.hasMore, true)
    assert.equal(third.hasMore, false)
    const users = [...first.users, ...second.users, ...third.users]
    assert.equal(new Set(users.map((user) => user.id)).size, 8)
    assert(users.every((user) => filters.cities.includes(user.city)))
    assert(users.every((user) => !('password' in user)))
  }
})

test('режимы ищут преподавателей или учеников вместе с остальными фильтрами', async () => {
  const common = {
    ...INITIAL_FILTERS_STATE,
    cities: ['Москва', 'Казань'],
    skillIds: ['english'] as const,
  }
  const students = await fetchUsers(1, 9, 'new', {
    ...common,
    skillIds: [...common.skillIds],
    mode: 'canTeach',
    name: 'Английский',
  })
  assert.equal(students.total, 8)
  const teachers = await fetchUsers(1, 9, 'new', {
    ...common,
    skillIds: [...common.skillIds],
    mode: 'wantToLearn',
    name: 'Английский',
  })
  assert.equal(teachers.total, 0)
})

test('одиночный city остаётся совместимым; city[] валидируется', async () => {
  const result = await fetchUsers(1, 9, 'new', { ...INITIAL_FILTERS_STATE, cities: ['Москва'] })
  assert.equal(result.total, 4)
  for (const query of [
    'city[]=unknown',
    'city[]=',
    'city[]=Москва&city[]=unknown',
    'city=Москва&city=Казань',
  ]) {
    const response = await fetch(`/api/users?${query}`)
    assert.equal(response.status, 400, query)
  }
  const response = await fetch('/api/users?city[]=Москва&city[]=Москва&city=Москва')
  assert.equal(response.status, 200)
  assert.equal((await response.json()).total, 4)
})
