import ESLintPlugin from 'eslint-plugin-react-hooks'

export default [
  {
    files: ['**/*.{js,jsx}'],
    plugins: {
      react: ESLintPlugin,
    },
  },
]
