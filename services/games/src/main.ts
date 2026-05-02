import 'reflect-metadata'
;(BigInt.prototype as unknown as Record<string, unknown>).toJSON = function () {
  return this.toString()
}
import { NestFactory } from '@nestjs/core'
import { MicroserviceOptions, Transport } from '@nestjs/microservices'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { AppModule } from './app.module'

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule)
  app.enableCors({
    origin: ['http://localhost:3000'],
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  })

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Games Service')
    .setDescription('Crash Game — engine de rodadas, apostas, WebSocket e Provably Fair')
    .setVersion('1.0')
    .addBearerAuth()
    .build()
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swaggerConfig))

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
