import {
  Body,
  Controller,
  Get,
  Param,
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
  ApiTags,
} from "@nestjs/swagger";
import {
  adminDecisionSchema,
  disputeInputSchema,
  disputeMessageSchema,
  type AdminDecisionInput,
  type AdminDisputeItem,
  type DisputeInput,
  type DisputeMessageInput,
  type DisputeMessageView,
  type OrderInvoiceView,
} from "@bakul/shared";
import type { AuthRequestUser } from "../common/auth/auth-user.type";
import { CurrentUser } from "../common/auth/current-user.decorator";
import { JwtAuthGuard } from "../common/auth/jwt-auth.guard";
import { Roles } from "../common/auth/roles.decorator";
import { RolesGuard } from "../common/auth/roles.guard";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { DisputesService } from "./disputes.service";

@ApiTags("disputes")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("orders/:id/dispute")
export class DisputesController {
  constructor(private readonly disputes: DisputesService) {}

  @Post()
  create(
    @CurrentUser() user: AuthRequestUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(disputeInputSchema)) body: DisputeInput,
  ): Promise<{ ok: true; disputeId: string }> {
    return this.disputes.create(user.id, id, body);
  }

  @Post("messages")
  message(
    @CurrentUser() user: AuthRequestUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(disputeMessageSchema)) body: DisputeMessageInput,
  ): Promise<DisputeMessageView> {
    return this.disputes.addMessage(user.id, user.role, id, body);
  }

  @Post("escalate")
  escalate(
    @CurrentUser() user: AuthRequestUser,
    @Param("id") id: string,
  ): Promise<{ ok: true }> {
    return this.disputes.escalate(user.id, id);
  }

  @Post("cancel")
  cancel(
    @CurrentUser() user: AuthRequestUser,
    @Param("id") id: string,
  ): Promise<{ ok: true }> {
    return this.disputes.cancel(user.id, id);
  }

  @Post("evidence")
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: { photo: { type: "string", format: "binary" } },
      required: ["photo"],
    },
  })
  @UseInterceptors(FileInterceptor("photo", { limits: { fileSize: 10 * 1024 * 1024 } }))
  evidence(
    @CurrentUser() user: AuthRequestUser,
    @Param("id") id: string,
    @UploadedFile() photo?: Express.Multer.File,
  ): Promise<{ url: string }> {
    return this.disputes.uploadEvidence(user.id, id, photo);
  }
}

@ApiTags("admin")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN")
@Controller("admin/disputes")
export class AdminDisputesController {
  constructor(private readonly disputes: DisputesService) {}

  @Get()
  list(): Promise<AdminDisputeItem[]> {
    return this.disputes.listForAdmin();
  }

  @Get(":id")
  detail(@Param("id") id: string): Promise<OrderInvoiceView> {
    return this.disputes.adminDetail(id);
  }

  @Post(":id/decide")
  decide(
    @CurrentUser() user: AuthRequestUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(adminDecisionSchema)) body: AdminDecisionInput,
  ): Promise<{ ok: true }> {
    return this.disputes.decide(user.id, id, body);
  }

  @Post(":id/returned")
  returned(
    @CurrentUser() user: AuthRequestUser,
    @Param("id") id: string,
  ): Promise<{ ok: true }> {
    return this.disputes.markReturned(user.id, id);
  }
}
