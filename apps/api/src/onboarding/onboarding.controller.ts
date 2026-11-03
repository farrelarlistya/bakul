import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import {
  firstProductSchema,
  shopOnboardingSchema,
  type FirstProductInput,
  type ShopOnboardingInput,
} from "@bakul/shared";
import type { AuthRequestUser } from "../common/auth/auth-user.type";
import { CurrentUser } from "../common/auth/current-user.decorator";
import { JwtAuthGuard } from "../common/auth/jwt-auth.guard";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { OnboardingService } from "./onboarding.service";

@ApiTags("onboarding")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("onboarding")
export class OnboardingController {
  constructor(private readonly onboarding: OnboardingService) {}

  @Post("shop")
  @ApiOperation({ summary: "Buka toko dengan nama dan kota" })
  createShop(
    @CurrentUser() user: AuthRequestUser,
    @Body(new ZodValidationPipe(shopOnboardingSchema))
    body: ShopOnboardingInput,
  ) {
    return this.onboarding.createShop(user.id, body);
  }

  @Post("first-product")
  @ApiOperation({ summary: "Unggah barang pertama, foto opsional" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        name: { type: "string", example: "Nastar Premium" },
        price: { type: "integer", example: 45000 },
        weightGram: { type: "integer", example: 250 },
        description: { type: "string" },
        photo: { type: "string", format: "binary" },
      },
      required: ["name", "price"],
    },
  })
  @UseInterceptors(
    FileInterceptor("photo", {
      limits: { fileSize: 2 * 1024 * 1024 },
    }),
  )
  createFirstProduct(
    @CurrentUser() user: AuthRequestUser,
    @Body(new ZodValidationPipe(firstProductSchema)) body: FirstProductInput,
    @UploadedFile() photo?: Express.Multer.File,
  ) {
    return this.onboarding.createFirstProduct(user.id, body, photo);
  }
}
