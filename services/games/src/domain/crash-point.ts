import { createHmac, randomBytes, createHash } from 'crypto'

export class CrashPoint {
  readonly value: number
  readonly serverSeed: string
  readonly seedHash: string

  private constructor(value: number, serverSeed: string, seedHash: string) {
    this.value = value
    this.serverSeed = serverSeed
    this.seedHash = seedHash
  }

  static generate(): CrashPoint {
    const serverSeed = randomBytes(32).toString('hex')
    const seedHash = createHash('sha256').update(serverSeed).digest('hex')
    const value = CrashPoint.calculate(serverSeed)
    return new CrashPoint(value, serverSeed, seedHash)
  }

  static verify(serverSeed: string): number {
    return CrashPoint.calculate(serverSeed)
  }

  private static calculate(serverSeed: string): number {
    const hmac = createHmac('sha256', serverSeed).update('crash').digest('hex')
    const value = parseInt(hmac.slice(0, 8), 16)

    // house edge de 4%: crash mínimo de 1.00x
    const crashPoint = Math.max(1.0, ((100 / (1 - (value % 100) / 100)) * 0.96) / 100)
    return Math.floor(crashPoint * 100) / 100
  }
}
