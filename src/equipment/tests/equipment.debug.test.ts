import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { app } from '../../app'
import { cleanupTestData, createTestUser } from '../../shared/tests/test-utils'
import { Role } from '@prisma/client'

describe('Equipment Debug', () => {
  beforeEach(async () => {
    await app.ready()
    await cleanupTestData()
  })

  afterEach(async () => {
    await cleanupTestData()
  })

  const getAuthToken = async (email: string, password: string): Promise<string> => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email, password },
    })
    return response.json().accessToken
  }

  const createTestCharacter = async (token: string) => {
    // Create a race first
    const raceResponse = await app.inject({
      method: 'POST',
      url: '/api/races',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        name: 'Equipment Test Race',
        description: 'Race for equipment testing',
      },
    })
    const race = raceResponse.json()

    // Create an archetype
    const archetypeResponse = await app.inject({
      method: 'POST',
      url: '/api/archetypes',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        name: 'Equipment Test Archetype',
        description: 'Archetype for equipment testing',
      },
    })
    const archetype = archetypeResponse.json()

    // Create a character
    const characterResponse = await app.inject({
      method: 'POST',
      url: '/api/characters',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        name: 'Equipment Test Character',
        description: 'Character for equipment testing',
        raceId: race.id,
        archetypeId: archetype.id,
      },
    })
    console.log('Character creation response:', {
      statusCode: characterResponse.statusCode,
      body: characterResponse.json(),
    })
    return characterResponse.json()
  }

  it('should debug equipment access', async () => {
    const { user, password } = await createTestUser({ role: Role.USER })
    const token = await getAuthToken(user.email, password)
    const character = await createTestCharacter(token)

    const response = await app.inject({
      method: 'GET',
      url: `/api/characters/${character.id}/equipment`,
    })

    console.log('Equipment response:', {
      statusCode: response.statusCode,
      body: response.body,
    })

    expect(response.statusCode).toBe(200)
  })
})
