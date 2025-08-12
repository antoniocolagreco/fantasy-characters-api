import { FastifyRequest, FastifyReply, RouteGenericInterface } from 'fastify'

/**
 * Generic controller handler type for Fastify
 */
export type ControllerHandler<
  T extends RouteGenericInterface = RouteGenericInterface,
  TReply = unknown,
> = (request: FastifyRequest<T>, reply: FastifyReply) => Promise<TReply>

/**
 * CRUD controller handler types (matching existing controller method names)
 */
export type ListController<
  T extends RouteGenericInterface = RouteGenericInterface,
  TReply = unknown,
> = ControllerHandler<T, TReply>
export type GetByIdController<
  T extends RouteGenericInterface = RouteGenericInterface,
  TReply = unknown,
> = ControllerHandler<T, TReply>
export type CreateController<
  T extends RouteGenericInterface = RouteGenericInterface,
  TReply = unknown,
> = ControllerHandler<T, TReply>
export type UpdateController<
  T extends RouteGenericInterface = RouteGenericInterface,
  TReply = unknown,
> = ControllerHandler<T, TReply>
export type PatchController<
  T extends RouteGenericInterface = RouteGenericInterface,
  TReply = unknown,
> = ControllerHandler<T, TReply>
export type DeleteController<
  T extends RouteGenericInterface = RouteGenericInterface,
  TReply = unknown,
> = ControllerHandler<T, TReply>
export type GetStatsController<
  T extends RouteGenericInterface = RouteGenericInterface,
  TReply = unknown,
> = ControllerHandler<T, TReply>
