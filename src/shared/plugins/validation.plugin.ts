import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import addKeywords from 'ajv-keywords'
import fp from 'fastify-plugin'

/**
 * Validation plugin: configures Fastify to use a custom Ajv instance
 * with formats and transform keyword enabled.
 */
export default fp(async function validationPlugin(app) {
    const ajv = new Ajv({
        // Keep conservative defaults to avoid surprising behavior changes
        coerceTypes: true,
        allErrors: true,
        // Do not remove additional properties globally; prefer schema-level control
        removeAdditional: false,
        // Needed for union types used by TypeBox occasionally
        allowUnionTypes: true,
        // Use JSON schema draft-07 compatible defaults
        strict: false,
    })

    addFormats(ajv)
    addKeywords(ajv, ['transform'])

    app.setValidatorCompiler(({ schema }) => {
        const validate = ajv.compile(schema)
        return validate as (data: unknown) => { error?: Error; errors?: unknown[] } | boolean
    })
})
