# NestJS Datadog Trace

dd-trace 5.x
nest 10.3

## Install

```sh
npm i @nestpro/dd-trace
```

## Setup

1. Create tracing file (tracing.ts):

   ```ts
   import DataDogTrace from 'dd-trace';
   
   const tracer = DataDogTrace.init({
     logInjection: true,
   });
   
   export { tracer };
   ```
   
   Use already initialized DataDog tracer instance


2. Import the tracing file:

    ```ts
    import './tracing';
    import { NestFactory } from '@nestjs/core';
    import { AppModule } from './app.module';
    import { Logger as PinoLogger } from 'nestjs-pino';
    import { Logger } from '@nestjs/common';

    async function bootstrap() {
      const app = await NestFactory.create(AppModule, { bufferLogs: true });
      app.useLogger(app.get(PinoLogger));

      const logger = new Logger('main');
      const port = process.env.PORT || 3000;
      await app.listen(3000).then(() => {
        logger.log(`Listening on port: ${port}`);
      });
    }
    bootstrap();
    ```

   Use `APP_` prefix for your application configuration environment variables.


3. Add *LoggerModule* and *DatadogModule* to *AppModule*:

    ```ts
    import { Module } from '@nestjs/common';
    import { LoggerModule } from 'nestjs-pino';
    import { DatadogTraceModule } from 'nestjs-ddtrace';

    @Module({
      imports: [
        LoggerModule.forRoot({
          pinoHttp: {
            level: process.env.APP_ENV !== 'prod' ? 'trace' : 'info'
          },
          exclude: [{ method: RequestMethod.ALL, path: 'health' }], // if you have /health path, exclude it from logs
        }), 
        DatadogTraceModule.forRoot({
          controllers: true,
          providers: true
        })
      ],
    })
    export class AppModule {}
    ```

## Span Decorator

If you need, you can define a custom Tracing Span for a method or class. It works async or sync. Span takes its name from the parameter; but by default, it is the same as the method's name.

```ts
import { DatadogTraceModule } from 'nestjs-ddtrace';

@Module({
  imports: [DatadogTraceModule.forRoot()],
})

export class AppModule {}
```

### Tracing Service

In case you need to access native span methods for special logics in the method block:

```ts
import { Span, TraceService } from 'nestjs-ddtrace';

@Injectable()
export class BookService {
  constructor(private readonly traceService: TraceService) {}

  @Span()
  async getBooks() {
    const currentSpan = this.traceService.getActiveSpan(); // --> retrives current span, comes from http or @Span
    await this.doSomething();
    currentSpan.addTags({
      'getBooks': 'true'
    });

    const childSpan = this.traceService.getTracer().startSpan('ms', {childOf: currentSpan});
    childSpan.setTag('userId', 1);
    await this.doSomethingElse();
    childSpan.finish(); // new span ends

    try {
      doSomething();
    } catch (e) {
      currentSpan.setTag('error', e);
      throw e;
    }
    return [`Harry Potter and the Philosopher's Stone`];
  }
}
```

```ts
import { Span } from 'nestjs-ddtrace';

@Injectable()
@Span()
export class BookService {
  async getBooks() { /* ... */ }
  async deleteBook(id: string) { /* ... */ }
}

@Controller()
@Span()
export class HelloController {
  @Get('/books')
  getBooks() { /* ... */ }

  @Delete('/books/:id')
  deleteBooks() { /* ... */ }
}
```

## Miscellaneous

Inspired by the [nestjs-otel](https://github.com/pragmaticivan/nestjs-otel) and [nestjs-opentelemetry](https://github.com/MetinSeylan/Nestjs-OpenTelemetry#readme) repository.
