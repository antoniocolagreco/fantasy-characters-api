import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import type { FastifyPluginAsync } from 'fastify'

import { characterController } from './characters.controller'
import {
    CharacterListQuerySchema,
    CharacterListResponseSchema,
    CharacterParamsSchema,
    CharacterResponseSchema,
    CharacterStatsResponseSchema,
    CreateCharacterSchema,
    UpdateCharacterSchema,
} from './characters.http.schema'

import { rbac, toFastifyPreHandler } from '@/features/auth/rbac.middleware'
import { ErrorResponseSchema } from '@/shared/schemas'

export const charactersRoutesV1: FastifyPluginAsync = async app => {
    app.withTypeProvider<TypeBoxTypeProvider>()

    app.get(
        '/characters',
        {
            preHandler: [toFastifyPreHandler(rbac.read('characters'))],
            schema: {
                tags: ['Characters'],
                summary: 'List characters',
                querystring: CharacterListQuerySchema,
                response: {
                    200: CharacterListResponseSchema,
                    400: ErrorResponseSchema,
                    403: ErrorResponseSchema,
                },
            },
        },
        characterController.listCharacters
    )

    app.get(
        '/characters/:id',
        {
            preHandler: [toFastifyPreHandler(rbac.read('characters'))],
            schema: {
                tags: ['Characters'],
                summary: 'Get character by ID',
                params: CharacterParamsSchema,
                response: {
                    200: CharacterResponseSchema,
                    400: ErrorResponseSchema,
                    403: ErrorResponseSchema,
                    404: ErrorResponseSchema,
                },
            },
        },
        characterController.getCharacterById
    )

    app.get(
        '/characters/stats',
        {
            preHandler: [toFastifyPreHandler(rbac.read('characters'))],
            schema: {
                tags: ['Characters'],
                summary: 'Character statistics',
                response: {
                    200: CharacterStatsResponseSchema,
                    400: ErrorResponseSchema,
                    403: ErrorResponseSchema,
                },
            },
        },
        characterController.getCharacterStats
    )

    app.post(
        '/characters',
        {
            preHandler: [toFastifyPreHandler(rbac.create('characters'))],
            schema: {
                tags: ['Characters'],
                summary: 'Create character',
                body: CreateCharacterSchema,
                response: {
                    201: CharacterResponseSchema,
                    400: ErrorResponseSchema,
                    409: ErrorResponseSchema,
                },
            },
        },
        characterController.createCharacter
    )

    app.put(
        '/characters/:id',
        {
            preHandler: [toFastifyPreHandler(rbac.update('characters'))],
            schema: {
                tags: ['Characters'],
                summary: 'Update character',
                params: CharacterParamsSchema,
                body: UpdateCharacterSchema,
                response: {
                    200: CharacterResponseSchema,
                    400: ErrorResponseSchema,
                    403: ErrorResponseSchema,
                    404: ErrorResponseSchema,
                },
            },
        },
        characterController.updateCharacter
    )

    app.delete(
        '/characters/:id',
        {
            preHandler: [toFastifyPreHandler(rbac.delete('characters'))],
            schema: {
                tags: ['Characters'],
                summary: 'Delete character',
                params: CharacterParamsSchema,
                response: {
                    204: { type: 'null' },
                    400: ErrorResponseSchema,
                    403: ErrorResponseSchema,
                    404: ErrorResponseSchema,
                },
            },
        },
        characterController.deleteCharacter
    )
}
