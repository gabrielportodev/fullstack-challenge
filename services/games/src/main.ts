import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { MicroserviceOptions, Transport } from '@nestjs/microservices'
import { AppModule } from './app.module'

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule)

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL as string],
      queue: 'games_queue',
      queueOptions: { durable: true }
    }
  })

  const port = process.env.PORT ?? 4001

  await app.startAllMicroservices()
  await app.listen(port, '0.0.0.0')
  console.log(`Games service running on port ${port}`)
}

bootstrap()
