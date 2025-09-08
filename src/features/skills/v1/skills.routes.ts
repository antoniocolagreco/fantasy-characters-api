import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import type { FastifyPluginAsync } from 'fastify'

import { skillController } from './skills.controller'
import {
    CreateSkillRequestSchema,
    SkillListQuerySchema,
    SkillListResponseSchema,
    SkillParamsSchema,
    SkillResponseSchema,
    SkillStatsResponseSchema,
    UpdateSkillSchema,
} from './skills.http.schema'

import { rbac, toFastifyPreHandler } from '@/features/auth/rbac.middleware'
import { ErrorResponseSchema } from '@/shared/schemas'

export const skillsRoutesV1: FastifyPluginAsync = async app => {
    app.withTypeProvider<TypeBoxTypeProvider>()

    // GET /api/v1/skills/:id
    app.get(
        '/skills/:id',
        {
            preHandler: [toFastifyPreHandler(rbac.read('skills'))],
            schema: {
                tags: ['Skills'],
                summary: 'Get skill by ID',
                params: SkillParamsSchema,
                response: {
                    200: SkillResponseSchema,
                    400: ErrorResponseSchema,
                    403: ErrorResponseSchema,
                    404: ErrorResponseSchema,
                    500: ErrorResponseSchema,
                },
            },
        },
        skillController.getSkillById
    )

    // GET /api/v1/skills/stats
    app.get(
        '/skills/stats',
        {
            preHandler: [toFastifyPreHandler(rbac.read('skills'))],
            schema: {
                tags: ['Skills'],
                summary: 'Skill statistics',
                response: {
                    200: SkillStatsResponseSchema,
                    400: ErrorResponseSchema,
                    403: ErrorResponseSchema,
                    500: ErrorResponseSchema,
                },
            },
        },
        skillController.getSkillStats
    )

    // GET /api/v1/skills
    app.get(
        '/skills',
        {
            preHandler: [toFastifyPreHandler(rbac.read('skills'))],
            schema: {
                tags: ['Skills'],
                summary: 'List skills',
                querystring: SkillListQuerySchema,
                response: {
                    200: SkillListResponseSchema,
                    400: ErrorResponseSchema,
                    403: ErrorResponseSchema,
                    500: ErrorResponseSchema,
                },
            },
        },
        skillController.listSkills
    )

    // POST /api/v1/skills
    app.post(
        '/skills',
        {
            preHandler: [toFastifyPreHandler(rbac.create('skills'))],
            schema: {
                tags: ['Skills'],
                summary: 'Create skill',
                body: CreateSkillRequestSchema,
                response: {
                    201: SkillResponseSchema,
                    400: ErrorResponseSchema,
                    409: ErrorResponseSchema,
                    500: ErrorResponseSchema,
                },
            },
        },
        skillController.createSkill
    )

    // PUT /api/v1/skills/:id
    app.put(
        '/skills/:id',
        {
            preHandler: [toFastifyPreHandler(rbac.update('skills'))],
            schema: {
                tags: ['Skills'],
                summary: 'Update skill',
                params: SkillParamsSchema,
                body: UpdateSkillSchema,
                response: {
                    200: SkillResponseSchema,
                    400: ErrorResponseSchema,
                    403: ErrorResponseSchema,
                    404: ErrorResponseSchema,
                    500: ErrorResponseSchema,
                },
            },
        },
        skillController.updateSkill
    )

    // DELETE /api/v1/skills/:id
    app.delete(
        '/skills/:id',
        {
            preHandler: [toFastifyPreHandler(rbac.delete('skills'))],
            schema: {
                tags: ['Skills'],
                summary: 'Delete skill',
                params: SkillParamsSchema,
                response: {
                    204: { type: 'null' },
                    400: ErrorResponseSchema,
                    403: ErrorResponseSchema,
                    404: ErrorResponseSchema,
                    500: ErrorResponseSchema,
                },
            },
        },
        skillController.deleteSkill
    )
}
