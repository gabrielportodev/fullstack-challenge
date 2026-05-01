import 'reflect-metadata'
;(BigInt.prototype as unknown as Record<string, unknown>).toJSON = function () {
  return this.toString()
}
import { NestFactory } from '@nestjs/core'
import { MicroserviceOptions, Transport } from '@nestjs/microservices'
import { AppModule } from './app.module'

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule)
  app.enableCors({
    origin: ['http://localhost:3000'],
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  })

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL as string],
      queue: 'wallets_queue',
      queueOptions: { durable: true }
    }
  })

  const port = Number(process.env.PORT)

  await app.startAllMicroservices()
  await app.listen(port, '0.0.0.0')
  console.log(`Wallets service running on port ${port}`)
}

bootstrap()
