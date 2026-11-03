import {
  Controller,
  Get,
  Header,
  Param,
  StreamableFile,
} from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { createReadStream } from "node:fs";
import { StorageService } from "../common/storage/storage.service";

@ApiTags("files")
@Controller("files")
export class FilesController {
  constructor(private readonly storage: StorageService) {}

  @Get("products/:filename")
  @Header("Cache-Control", "public, max-age=86400")
  @ApiOperation({ summary: "Ambil foto produk dari penyimpanan lokal" })
  productPhoto(@Param("filename") filename: string): StreamableFile {
    const file = this.storage.productPhoto(filename);

    return new StreamableFile(createReadStream(file.path), {
      type: file.mime,
      disposition: `inline; filename="${filename}"`,
    });
  }

  @Get("evidence/:filename")
  @Header("Cache-Control", "private, max-age=86400")
  @ApiOperation({ summary: "Ambil bukti komplain dari penyimpanan lokal" })
  evidence(@Param("filename") filename: string): StreamableFile {
    const file = this.storage.evidenceFile(filename);

    return new StreamableFile(createReadStream(file.path), {
      type: file.mime,
      disposition: `inline; filename="${filename}"`,
    });
  }

  @Get("shops/:filename")
  @Header("Cache-Control", "public, max-age=86400")
  @ApiOperation({ summary: "Ambil logo toko dari penyimpanan lokal" })
  shopLogo(@Param("filename") filename: string): StreamableFile {
    const file = this.storage.shopLogo(filename);

    return new StreamableFile(createReadStream(file.path), {
      type: file.mime,
      disposition: `inline; filename="${filename}"`,
    });
  }
}
