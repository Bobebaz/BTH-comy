"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
    const PORT = 3003;
    await app.listen(PORT);
    console.log(`Report Service đang chạy độc lập tại: http://localhost:${PORT}/reports`);
}
bootstrap();
//# sourceMappingURL=main.js.map