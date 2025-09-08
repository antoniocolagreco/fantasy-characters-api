import type { FastifyReply, FastifyRequest } from 'fastify'

export type ReplyStub = FastifyReply & {
    codeCalls: number[]
    sentPayloads: unknown[]
    headersSet: Record<string, string>
}

export function createReplyStub(): ReplyStub {
    const calls: number[] = []
    const payloads: unknown[] = []
    const headers: Record<string, string> = {}

    const base = {
        code(status: number) {
            calls.push(status)
            return this
        },
        send(payload: unknown) {
            payloads.push(payload)
            return this
        },
        header(name: string, value: string) {
            headers[name] = value
            return this
        },
        get codeCalls() {
            return calls
        },
        get sentPayloads() {
            return payloads
        },
        get headersSet() {
            return headers
        },
    }

    // Internally assert to FastifyReply for testing purposes
    return base as unknown as ReplyStub
}

export type RequestStub<TBody = unknown> = FastifyRequest & { body: TBody }

export function createRequestStub<TBody = unknown>(
    body: TBody,
    opts?: {
        id?: string
        headers?: Record<string, string>
        user?: unknown
        params?: unknown
    }
): RequestStub<TBody> {
    const base = {
        body,
        id: opts?.id ?? 'test-request-id',
        headers: opts?.headers ?? {},
        user: opts?.user,
        params: opts?.params,
    }
    // Internally assert to FastifyRequest for testing purposes
    return base as unknown as RequestStub<TBody>
}
