import { defineConfig } from 'drizzle-kit'

export default defineConfig({
    out: './src/database/migrations',
    schema: './src/database/schema.ts',
    dialect: 'postgresql',
    url: process.env.DB_URL
})