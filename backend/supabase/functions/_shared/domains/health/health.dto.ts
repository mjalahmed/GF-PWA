export type HealthResponseDto = {
  service: string;
  status: "ok";
  version: string;
};

export type ReadinessResponseDto = {
  service: string;
  status: "ready";
  version: string;
};
