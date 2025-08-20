/**
 * Users module exports
 * Centralized exports for the users feature
 */

// Routes
export { userRoutes } from './user.route'

// Controllers
export {
  createUserHandler,
  getUserByIdHandler,
  getUsersListHandler,
  updateUserHandler,
  deleteUserHandler,
} from './user.controller'

// Services
export {
  createUser,
  getUserById,
  getUsersList,
  updateUser,
  deleteUser,
  getUserByEmail,
  userExists,
} from './user.service'

// Schemas and types
export {
  CreateUserRequestSchema,
  UpdateUserRequestSchema,
  UserResponseSchema,
  UserListQuerySchema,
  UserListResponseSchema,
  UserIdParamSchema,
  UserRoleSchema,
} from './user.schema'

export type {
  CreateUserRequest,
  UpdateUserRequest,
  UserResponse,
  UserListQuery,
  UserListResponse,
  UserIdParam,
  UserRole,
} from './user.schema'
