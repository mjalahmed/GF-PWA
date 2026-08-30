import type { SupabaseClient } from "npm:@supabase/supabase-js@2.49.1";
import type { HealthResponseDto, ReadinessResponseDto } from "./health.dto.ts";
import { ErrorCodes } from "../../core/constants/error-codes.ts";
import { AppError } from "../../core/errors/app-error.ts";

export class HealthService {
  getLiveness(): HealthResponseDto {
    return {
      service: "garagefinder-api",
      status: "ok",
      version: "v1",
    };
  }

  async getReadiness(adminClient: SupabaseClient): Promise<ReadinessResponseDto> {
    const { error } = await adminClient.from("roles").select("id").limit(1);
    if (error) {
      throw new AppError({
        code: ErrorCodes.Internal.ServiceUnavailable,
        message: "Database is not ready.",
        status: 503,
      });
    }
    return {
      service: "garagefinder-api",
      status: "ready",
      version: "v1",
    };
  }
}
