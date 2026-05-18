import { describe, it, expect } from 'vitest'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../../.env') })

describe('env vars', () => {
  it('WORLD_LABS_API_KEY is valid when supplied', () => {
    const key = process.env.WORLD_LABS_API_KEY
    if (key === undefined) return

    expect(key.length).toBeGreaterThan(0)
  })

  it('FAL_KEY is valid when supplied', () => {
    const key = process.env.FAL_KEY
    if (key === undefined) return

    expect(key.length).toBeGreaterThan(0)
  })
})
