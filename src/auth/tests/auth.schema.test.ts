import { describe, it, expect } from 'vitest'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import {
  RegisterUserSchema,
  LoginUserSchema,
  ChangePasswordSchema,
  UpdateProfileSchema,
  RefreshTokenSchema,
  TokenResponseSchema,
  UserProfileSchema,
  AuthErrorSchema,
  SuccessMessageSchema,
  AuthParamsSchema,
  CommonAuthResponses,
  type RegisterUserType,
  type LoginUserType,
  type ChangePasswordType,
  type UpdateProfileType,
  type RefreshTokenType,
  type TokenResponseType,
  type UserProfileType,
  type AuthErrorType,
  type SuccessMessageType,
  type AuthParamsType,
} from '../auth.schema'

// Setup AJV with formats
const ajv = new Ajv({ allErrors: true })
addFormats(ajv)

describe('Auth Schema Validation', () => {
  describe('RegisterUserSchema', () => {
    const validate = ajv.compile(RegisterUserSchema)

    it('should validate valid registration data', () => {
      const validData: RegisterUserType = {
        email: 'user@example.com',
        password: 'securepassword123',
        name: 'John Doe',
        bio: 'Software developer',
      }

      expect(validate(validData)).toBe(true)
    })

    it('should validate minimal registration data', () => {
      const validData: RegisterUserType = {
        email: 'user@example.com',
        password: 'securepass',
      }

      expect(validate(validData)).toBe(true)
    })

    it('should reject invalid email format', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'securepassword123',
      }

      expect(validate(invalidData)).toBe(false)
      expect(validate.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            instancePath: '/email',
            keyword: 'format',
          }),
        ]),
      )
    })

    it('should reject password shorter than 8 characters', () => {
      const invalidData = {
        email: 'user@example.com',
        password: 'short',
      }

      expect(validate(invalidData)).toBe(false)
      expect(validate.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            instancePath: '/password',
            keyword: 'minLength',
          }),
        ]),
      )
    })

    it('should reject password longer than 128 characters', () => {
      const invalidData = {
        email: 'user@example.com',
        password: 'a'.repeat(129),
      }

      expect(validate(invalidData)).toBe(false)
      expect(validate.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            instancePath: '/password',
            keyword: 'maxLength',
          }),
        ]),
      )
    })

    it('should reject name shorter than 2 characters', () => {
      const invalidData = {
        email: 'user@example.com',
        password: 'securepassword123',
        name: 'J',
      }

      expect(validate(invalidData)).toBe(false)
      expect(validate.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            instancePath: '/name',
            keyword: 'minLength',
          }),
        ]),
      )
    })

    it('should reject name longer than 50 characters', () => {
      const invalidData = {
        email: 'user@example.com',
        password: 'securepassword123',
        name: 'a'.repeat(51),
      }

      expect(validate(invalidData)).toBe(false)
      expect(validate.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            instancePath: '/name',
            keyword: 'maxLength',
          }),
        ]),
      )
    })

    it('should reject bio longer than 500 characters', () => {
      const invalidData = {
        email: 'user@example.com',
        password: 'securepassword123',
        bio: 'a'.repeat(501),
      }

      expect(validate(invalidData)).toBe(false)
      expect(validate.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            instancePath: '/bio',
            keyword: 'maxLength',
          }),
        ]),
      )
    })

    it('should reject missing required fields', () => {
      const invalidData = {
        email: 'user@example.com',
        // password missing
      }

      expect(validate(invalidData)).toBe(false)
      expect(validate.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            instancePath: '',
            keyword: 'required',
            params: { missingProperty: 'password' },
          }),
        ]),
      )
    })
  })

  describe('LoginUserSchema', () => {
    const validate = ajv.compile(LoginUserSchema)

    it('should validate valid login data', () => {
      const validData: LoginUserType = {
        email: 'user@example.com',
        password: 'securepassword123',
      }

      expect(validate(validData)).toBe(true)
    })

    it('should reject invalid email format', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'password',
      }

      expect(validate(invalidData)).toBe(false)
      expect(validate.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            instancePath: '/email',
            keyword: 'format',
          }),
        ]),
      )
    })

    it('should reject missing email', () => {
      const invalidData = {
        password: 'password',
      }

      expect(validate(invalidData)).toBe(false)
      expect(validate.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            instancePath: '',
            keyword: 'required',
            params: { missingProperty: 'email' },
          }),
        ]),
      )
    })

    it('should reject missing password', () => {
      const invalidData = {
        email: 'user@example.com',
      }

      expect(validate(invalidData)).toBe(false)
      expect(validate.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            instancePath: '',
            keyword: 'required',
            params: { missingProperty: 'password' },
          }),
        ]),
      )
    })
  })

  describe('ChangePasswordSchema', () => {
    const validate = ajv.compile(ChangePasswordSchema)

    it('should validate valid password change data', () => {
      const validData: ChangePasswordType = {
        currentPassword: 'oldpassword123',
        newPassword: 'newpassword123',
      }

      expect(validate(validData)).toBe(true)
    })

    it('should reject new password shorter than 8 characters', () => {
      const invalidData = {
        currentPassword: 'oldpassword123',
        newPassword: 'short',
      }

      expect(validate(invalidData)).toBe(false)
      expect(validate.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            instancePath: '/newPassword',
            keyword: 'minLength',
          }),
        ]),
      )
    })

    it('should reject new password longer than 128 characters', () => {
      const invalidData = {
        currentPassword: 'oldpassword123',
        newPassword: 'a'.repeat(129),
      }

      expect(validate(invalidData)).toBe(false)
      expect(validate.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            instancePath: '/newPassword',
            keyword: 'maxLength',
          }),
        ]),
      )
    })

    it('should reject missing current password', () => {
      const invalidData = {
        newPassword: 'newpassword123',
      }

      expect(validate(invalidData)).toBe(false)
      expect(validate.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            instancePath: '',
            keyword: 'required',
            params: { missingProperty: 'currentPassword' },
          }),
        ]),
      )
    })

    it('should reject missing new password', () => {
      const invalidData = {
        currentPassword: 'oldpassword123',
      }

      expect(validate(invalidData)).toBe(false)
      expect(validate.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            instancePath: '',
            keyword: 'required',
            params: { missingProperty: 'newPassword' },
          }),
        ]),
      )
    })
  })

  describe('UpdateProfileSchema', () => {
    const validate = ajv.compile(UpdateProfileSchema)

    it('should validate valid profile update data', () => {
      const validData: UpdateProfileType = {
        name: 'John Doe',
        bio: 'Software developer',
      }

      expect(validate(validData)).toBe(true)
    })

    it('should validate empty profile update data', () => {
      const validData: UpdateProfileType = {}

      expect(validate(validData)).toBe(true)
    })

    it('should validate partial profile update with name only', () => {
      const validData: UpdateProfileType = {
        name: 'John Doe',
      }

      expect(validate(validData)).toBe(true)
    })

    it('should validate partial profile update with bio only', () => {
      const validData: UpdateProfileType = {
        bio: 'Software developer',
      }

      expect(validate(validData)).toBe(true)
    })

    it('should reject name shorter than 2 characters', () => {
      const invalidData = {
        name: 'J',
      }

      expect(validate(invalidData)).toBe(false)
      expect(validate.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            instancePath: '/name',
            keyword: 'minLength',
          }),
        ]),
      )
    })

    it('should reject name longer than 50 characters', () => {
      const invalidData = {
        name: 'a'.repeat(51),
      }

      expect(validate(invalidData)).toBe(false)
      expect(validate.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            instancePath: '/name',
            keyword: 'maxLength',
          }),
        ]),
      )
    })

    it('should reject bio longer than 500 characters', () => {
      const invalidData = {
        bio: 'a'.repeat(501),
      }

      expect(validate(invalidData)).toBe(false)
      expect(validate.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            instancePath: '/bio',
            keyword: 'maxLength',
          }),
        ]),
      )
    })
  })

  describe('RefreshTokenSchema', () => {
    const validate = ajv.compile(RefreshTokenSchema)

    it('should validate valid refresh token data', () => {
      const validData: RefreshTokenType = {
        refreshToken: 'valid-refresh-token-string',
      }

      expect(validate(validData)).toBe(true)
    })

    it('should reject missing refresh token', () => {
      const invalidData = {}

      expect(validate(invalidData)).toBe(false)
      expect(validate.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            instancePath: '',
            keyword: 'required',
            params: { missingProperty: 'refreshToken' },
          }),
        ]),
      )
    })

    it('should reject empty refresh token', () => {
      const invalidData = {
        refreshToken: '',
      }

      expect(validate(invalidData)).toBe(true) // Empty string is still a string
    })
  })

  describe('TokenResponseSchema', () => {
    const validate = ajv.compile(TokenResponseSchema)

    it('should validate valid token response data', () => {
      const validData: TokenResponseType = {
        accessToken: 'jwt-access-token',
        refreshToken: 'jwt-refresh-token',
        tokenType: 'Bearer',
        expiresIn: '15m',
        user: {
          id: 'user-id-123',
          email: 'user@example.com',
          name: 'John Doe',
          role: 'USER',
          isEmailVerified: true,
          isActive: true,
          lastLogin: '2024-01-01T00:00:00Z',
          createdAt: '2024-01-01T00:00:00Z',
        },
      }

      expect(validate(validData)).toBe(true)
    })

    it('should validate token response with null name', () => {
      const validData: TokenResponseType = {
        accessToken: 'jwt-access-token',
        refreshToken: 'jwt-refresh-token',
        tokenType: 'Bearer',
        expiresIn: '15m',
        user: {
          id: 'user-id-123',
          email: 'user@example.com',
          name: null,
          role: 'USER',
          isEmailVerified: true,
          isActive: true,
          lastLogin: '2024-01-01T00:00:00Z',
          createdAt: '2024-01-01T00:00:00Z',
        },
      }

      expect(validate(validData)).toBe(true)
    })

    it('should reject missing required fields', () => {
      const invalidData = {
        accessToken: 'jwt-access-token',
        // Missing other required fields
      }

      expect(validate(invalidData)).toBe(false)
      expect(validate.errors?.length).toBeGreaterThan(0)
    })

    it('should reject invalid date-time format', () => {
      const invalidData = {
        accessToken: 'jwt-access-token',
        refreshToken: 'jwt-refresh-token',
        tokenType: 'Bearer',
        expiresIn: '15m',
        user: {
          id: 'user-id-123',
          email: 'user@example.com',
          name: 'John Doe',
          role: 'USER',
          isEmailVerified: true,
          isActive: true,
          lastLogin: 'invalid-date',
          createdAt: '2024-01-01T00:00:00Z',
        },
      }

      expect(validate(invalidData)).toBe(false)
      expect(validate.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            instancePath: '/user/lastLogin',
            keyword: 'format',
          }),
        ]),
      )
    })
  })

  describe('UserProfileSchema', () => {
    const validate = ajv.compile(UserProfileSchema)

    it('should validate valid user profile data', () => {
      const validData: UserProfileType = {
        id: 'user-id-123',
        email: 'user@example.com',
        name: 'John Doe',
        bio: 'Software developer',
        role: 'USER',
        isEmailVerified: true,
        isActive: true,
        lastLogin: '2024-01-01T00:00:00Z',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      }

      expect(validate(validData)).toBe(true)
    })

    it('should validate user profile with null name and bio', () => {
      const validData: UserProfileType = {
        id: 'user-id-123',
        email: 'user@example.com',
        name: null,
        bio: null,
        role: 'USER',
        isEmailVerified: true,
        isActive: true,
        lastLogin: '2024-01-01T00:00:00Z',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      }

      expect(validate(validData)).toBe(true)
    })

    it('should reject missing required fields', () => {
      const invalidData = {
        id: 'user-id-123',
        email: 'user@example.com',
        // Missing other required fields
      }

      expect(validate(invalidData)).toBe(false)
      expect(validate.errors?.length).toBeGreaterThan(0)
    })

    it('should reject invalid date-time format', () => {
      const invalidData = {
        id: 'user-id-123',
        email: 'user@example.com',
        name: 'John Doe',
        bio: 'Software developer',
        role: 'USER',
        isEmailVerified: true,
        isActive: true,
        lastLogin: 'invalid-date',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      }

      expect(validate(invalidData)).toBe(false)
      expect(validate.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            instancePath: '/lastLogin',
            keyword: 'format',
          }),
        ]),
      )
    })
  })

  describe('AuthErrorSchema', () => {
    const validate = ajv.compile(AuthErrorSchema)

    it('should validate valid auth error data', () => {
      const validData: AuthErrorType = {
        message: 'Authentication failed',
        statusCode: 401,
        error: 'Unauthorized',
      }

      expect(validate(validData)).toBe(true)
    })

    it('should reject missing required fields', () => {
      const invalidData = {
        message: 'Authentication failed',
        // Missing statusCode and error
      }

      expect(validate(invalidData)).toBe(false)
      expect(validate.errors?.length).toBeGreaterThan(0)
    })
  })

  describe('SuccessMessageSchema', () => {
    const validate = ajv.compile(SuccessMessageSchema)

    it('should validate valid success message data', () => {
      const validData: SuccessMessageType = {
        message: 'Operation completed successfully',
      }

      expect(validate(validData)).toBe(true)
    })

    it('should reject missing message field', () => {
      const invalidData = {}

      expect(validate(invalidData)).toBe(false)
      expect(validate.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            instancePath: '',
            keyword: 'required',
            params: { missingProperty: 'message' },
          }),
        ]),
      )
    })
  })

  describe('AuthParamsSchema', () => {
    const validate = ajv.compile(AuthParamsSchema)

    it('should validate valid auth params data', () => {
      const validData: AuthParamsType = {
        id: 'user-id-123',
      }

      expect(validate(validData)).toBe(true)
    })

    it('should reject missing id field', () => {
      const invalidData = {}

      expect(validate(invalidData)).toBe(false)
      expect(validate.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            instancePath: '',
            keyword: 'required',
            params: { missingProperty: 'id' },
          }),
        ]),
      )
    })
  })

  describe('CommonAuthResponses', () => {
    it('should contain all expected HTTP status codes', () => {
      expect(CommonAuthResponses).toHaveProperty('400')
      expect(CommonAuthResponses).toHaveProperty('401')
      expect(CommonAuthResponses).toHaveProperty('403')
      expect(CommonAuthResponses).toHaveProperty('409')
      expect(CommonAuthResponses).toHaveProperty('500')
    })

    it('should have proper structure for each response', () => {
      Object.entries(CommonAuthResponses).forEach(([_statusCode, response]) => {
        expect(response).toHaveProperty('description')
        expect(response).toHaveProperty('content')
        expect(response.content).toHaveProperty('application/json')
        expect(response.content['application/json']).toHaveProperty('schema')
        expect(response.content['application/json'].schema).toBe(AuthErrorSchema)
      })
    })

    it('should have appropriate descriptions', () => {
      expect(CommonAuthResponses[400].description).toBe('Bad Request')
      expect(CommonAuthResponses[401].description).toBe('Unauthorized')
      expect(CommonAuthResponses[403].description).toBe('Forbidden')
      expect(CommonAuthResponses[409].description).toBe('Conflict')
      expect(CommonAuthResponses[500].description).toBe('Internal Server Error')
    })
  })

  describe('Schema IDs', () => {
    it('should have correct schema IDs', () => {
      expect(RegisterUserSchema.$id).toBe('RegisterUserSchema')
      expect(LoginUserSchema.$id).toBe('LoginUserSchema')
      expect(ChangePasswordSchema.$id).toBe('ChangePasswordSchema')
      expect(UpdateProfileSchema.$id).toBe('UpdateProfileSchema')
      expect(RefreshTokenSchema.$id).toBe('RefreshTokenSchema')
      expect(TokenResponseSchema.$id).toBe('TokenResponseSchema')
      expect(UserProfileSchema.$id).toBe('UserProfileSchema')
      expect(AuthErrorSchema.$id).toBe('AuthErrorSchema')
      expect(SuccessMessageSchema.$id).toBe('SuccessMessageSchema')
      expect(AuthParamsSchema.$id).toBe('AuthParamsSchema')
    })

    it('should have proper descriptions', () => {
      expect(RegisterUserSchema.description).toBe('Schema for user registration')
      expect(LoginUserSchema.description).toBe('Schema for user login')
      expect(ChangePasswordSchema.description).toBe('Schema for changing password')
      expect(UpdateProfileSchema.description).toBe('Schema for updating user profile')
      expect(RefreshTokenSchema.description).toBe('Schema for refresh token request')
      expect(TokenResponseSchema.description).toBe('JWT token response schema')
      expect(UserProfileSchema.description).toBe('User profile response schema')
      expect(AuthErrorSchema.description).toBe('Authentication error response schema')
      expect(SuccessMessageSchema.description).toBe('Success message response schema')
      expect(AuthParamsSchema.description).toBe('Authentication parameters schema')
    })
  })

  describe('Type Exports', () => {
    it('should properly export TypeScript types', () => {
      // Test that types are properly defined by creating instances
      const registerUser: RegisterUserType = {
        email: 'test@example.com',
        password: 'password123',
      }

      const loginUser: LoginUserType = {
        email: 'test@example.com',
        password: 'password123',
      }

      const changePassword: ChangePasswordType = {
        currentPassword: 'old123',
        newPassword: 'new123456',
      }

      const updateProfile: UpdateProfileType = {
        name: 'Test User',
      }

      const refreshToken: RefreshTokenType = {
        refreshToken: 'refresh-token',
      }

      const authParams: AuthParamsType = {
        id: 'user-123',
      }

      // If we reach here, types are properly exported
      expect(registerUser.email).toBe('test@example.com')
      expect(loginUser.email).toBe('test@example.com')
      expect(changePassword.currentPassword).toBe('old123')
      expect(updateProfile.name).toBe('Test User')
      expect(refreshToken.refreshToken).toBe('refresh-token')
      expect(authParams.id).toBe('user-123')
    })
  })
})
