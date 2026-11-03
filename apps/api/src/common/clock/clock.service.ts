import { Injectable } from "@nestjs/common";

/**
 * Satu-satunya tempat `new Date()` untuk kebutuhan domain.
 * Nanti bisa diganti jam simulasi tanpa mengubah service lain.
 */
@Injectable()
export class ClockService {
  now(): Date {
    return new Date();
  }
}
