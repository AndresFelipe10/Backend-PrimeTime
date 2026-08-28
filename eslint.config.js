const globals = require('globals');

module.exports = [
    {
        files: ['**/*.js'],
        ignores: [
            'node_modules/**',
            '.vercel/**',
            'coverage/**',
            'dist/**'
        ],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'commonjs',
            globals: {
                ...globals.node
            }
        },
        rules: {
            'no-unused-vars': [
                'warn',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_'
                }
            ],
            'no-undef': 'error',
            'no-console': 'off',
            'semi': ['error', 'always'],
            'quotes': ['error', 'single'],
            'eqeqeq': ['error', 'always'],
            'curly': ['error', 'all']
        }
    },

    // Configuración específica para los tests de Jest
    {
        files: ['tests/**/*.js'],
        languageOptions: {
            globals: {
                ...globals.node,
                ...globals.jest
            }
        }
    }
];