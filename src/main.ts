import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DataSource } from 'typeorm';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  app.use(helmet());
  app.enableCors({ origin: 'http://localhost:3000', credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const port = process.env.PORT || 3001;
  await app.listen(port);

  // show the database status in the terminal
  const logger = new Logger('Bootstrap');
  try {
    const ds = app.get(DataSource);
    await ds.query('SELECT 1');
    const o: any = ds.options;
    logger.log(`DATABASE CONNECTED: ${o.database} at ${o.host}:${o.port}`);
  } catch (e: any) {
    logger.error(`DATABASE NOT CONNECTED: ${e.message}`);
  }
  logger.log(`API running on http://localhost:${port}/api/v1`);
}
bootstrap();
