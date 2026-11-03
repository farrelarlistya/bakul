import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix("api/v1");
  app.enableShutdownHooks();

  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle("Bakul API")
      .setDescription("API pasar daring Bakul. Semua uang adalah simulasi.")
      .setVersion("0.1.0")
      .build(),
  );
  SwaggerModule.setup("api/docs", app, document);

  const port = Number(process.env.API_PORT ?? 3001);
  const host = process.env.API_HOST ?? "127.0.0.1";
  await app.listen(port, host);

  console.log(`API Bakul siap di http://${host}:${port}/api/v1/health`);
  console.log(`Dokumentasi API di http://${host}:${port}/api/docs`);
}

bootstrap().catch((error: unknown) => {
  console.error("API gagal menyala:", error);
  process.exitCode = 1;
});
