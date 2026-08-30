import { ERROR_CODE_VALUES } from "../core/constants/error-codes.ts";
import { ApiContract } from "./api-contract.ts";

const envelopeSuccess = {
  type: "object",
  required: ["success", "data", "error", "meta"],
  properties: {
    success: { type: "boolean", const: true },
    data: {},
    error: { type: "null" },
    meta: { $ref: "#/components/schemas/RequestMetadata" },
  },
} as const;

const envelopeError = {
  type: "object",
  required: ["success", "data", "error", "meta"],
  properties: {
    success: { type: "boolean", const: false },
    data: { type: "null" },
    error: { $ref: "#/components/schemas/ApiError" },
    meta: { $ref: "#/components/schemas/RequestMetadata" },
  },
} as const;

export const openApiDocument = {
  openapi: "3.1.0",
  info: {
    title: "GarageFinder API",
    version: ApiContract.version,
    description:
      "Versioned GarageFinder Edge API. Privileged operations go through this API; Flutter never holds the service-role key.",
  },
  servers: [
    {
      url: "/functions/v1/api",
      description: "Supabase Edge Function base",
    },
  ],
  tags: [
    { name: "Health" },
    { name: "Identity" },
    { name: "Profiles" },
    { name: "BusinessOnboarding" },
    { name: "BusinessManagement" },
    { name: "Catalog" },
    { name: "Vehicles" },
    { name: "Discovery" },
    { name: "Appointments" },
    { name: "Quotations" },
    { name: "Invoices" },
    { name: "Payments" },
    { name: "Reviews" },
    { name: "Disputes" },
    { name: "Documentation" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      RequestMetadata: {
        type: "object",
        required: ["requestId"],
        properties: {
          requestId: { type: "string", format: "uuid" },
          pagination: { $ref: "#/components/schemas/PaginationMeta" },
        },
      },
      PaginationMeta: {
        type: "object",
        properties: {
          page: { type: "integer" },
          pageSize: { type: "integer" },
          total: { type: "integer" },
          totalPages: { type: "integer" },
        },
      },
      ApiError: {
        type: "object",
        required: ["code", "message", "details"],
        properties: {
          code: {
            type: "string",
            enum: ERROR_CODE_VALUES,
          },
          message: { type: "string" },
          details: {},
        },
      },
      ApiSuccessEnvelope: envelopeSuccess,
      ApiErrorEnvelope: envelopeError,
      Health: {
        type: "object",
        required: ["service", "status", "version"],
        properties: {
          service: { type: "string", const: "garagefinder-api" },
          status: { type: "string", const: "ok" },
          version: { type: "string", const: "v1" },
        },
      },
      Readiness: {
        type: "object",
        required: ["service", "status", "version"],
        properties: {
          service: { type: "string", const: "garagefinder-api" },
          status: { type: "string", const: "ready" },
          version: { type: "string", const: "v1" },
        },
      },
      Profile: {
        type: "object",
        required: [
          "id",
          "fullName",
          "phone",
          "avatarPath",
          "preferredLanguage",
          "status",
          "createdAt",
          "updatedAt",
        ],
        properties: {
          id: { type: "string", format: "uuid" },
          fullName: { type: ["string", "null"] },
          phone: { type: ["string", "null"] },
          avatarPath: { type: ["string", "null"] },
          preferredLanguage: { type: "string", enum: ["en", "ar"] },
          status: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      CurrentUser: {
        type: "object",
        required: ["id", "email", "profile", "roles", "permissions"],
        properties: {
          id: { type: "string", format: "uuid" },
          email: { type: ["string", "null"] },
          profile: { $ref: "#/components/schemas/Profile" },
          roles: { type: "array", items: { type: "string" } },
          permissions: { type: "array", items: { type: "string" } },
        },
      },
      UpdateProfileRequest: {
        type: "object",
        additionalProperties: false,
        properties: {
          fullName: { type: "string", minLength: 2, maxLength: 120 },
          phone: { type: ["string", "null"] },
          avatarPath: { type: ["string", "null"] },
          preferredLanguage: { type: "string", enum: ["en", "ar"] },
        },
      },
    },
  },
  paths: {
    [`${ApiContract.basePath}${ApiContract.routes.health}`]: {
      get: {
        tags: ["Health"],
        summary: "Liveness probe",
        description: "Verifies the API process is running. Public.",
        security: [],
        responses: {
          "200": {
            description: "Service is alive",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/ApiSuccessEnvelope" },
                    {
                      type: "object",
                      properties: {
                        data: { $ref: "#/components/schemas/Health" },
                      },
                    },
                  ],
                },
                example: {
                  success: true,
                  data: {
                    service: "garagefinder-api",
                    status: "ok",
                    version: "v1",
                  },
                  error: null,
                  meta: { requestId: "00000000-0000-4000-8000-000000000001" },
                },
              },
            },
          },
        },
      },
    },
    [`${ApiContract.basePath}${ApiContract.routes.readiness}`]: {
      get: {
        tags: ["Health"],
        summary: "Readiness probe",
        description: "Lightweight database readiness check. Public.",
        security: [],
        responses: {
          "200": {
            description: "Database reachable",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/ApiSuccessEnvelope" },
                    {
                      type: "object",
                      properties: {
                        data: { $ref: "#/components/schemas/Readiness" },
                      },
                    },
                  ],
                },
              },
            },
          },
          "503": {
            description: "Database unavailable",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiErrorEnvelope" },
              },
            },
          },
        },
      },
    },
    [`${ApiContract.basePath}${ApiContract.routes.currentUser}`]: {
      get: {
        tags: ["Identity"],
        summary: "Current authenticated user",
        description: "Returns id, email, profile, roles, and permissions.",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Current user",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/ApiSuccessEnvelope" },
                    {
                      type: "object",
                      properties: {
                        data: { $ref: "#/components/schemas/CurrentUser" },
                      },
                    },
                  ],
                },
              },
            },
          },
          "401": {
            description: "Authentication failure",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiErrorEnvelope" },
              },
            },
          },
        },
      },
    },
    [`${ApiContract.basePath}${ApiContract.routes.currentProfile}`]: {
      get: {
        tags: ["Profiles"],
        summary: "Get own profile",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Profile",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/ApiSuccessEnvelope" },
                    {
                      type: "object",
                      properties: {
                        data: { $ref: "#/components/schemas/Profile" },
                      },
                    },
                  ],
                },
              },
            },
          },
          "401": {
            description: "Authentication failure",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiErrorEnvelope" },
              },
            },
          },
        },
      },
      patch: {
        tags: ["Profiles"],
        summary: "Update own profile",
        description:
          "Updates fullName, phone, avatarPath, preferredLanguage only. Unknown/protected fields are rejected.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateProfileRequest" },
              example: {
                fullName: "Ali Hassan",
                preferredLanguage: "ar",
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Updated profile",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/ApiSuccessEnvelope" },
                    {
                      type: "object",
                      properties: {
                        data: { $ref: "#/components/schemas/Profile" },
                      },
                    },
                  ],
                },
              },
            },
          },
          "401": {
            description: "Authentication failure",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiErrorEnvelope" },
              },
            },
          },
          "422": {
            description: "Validation error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiErrorEnvelope" },
              },
            },
          },
        },
      },
    },
    [`${ApiContract.basePath}${ApiContract.routes.openApi}`]: {
      get: {
        tags: ["Documentation"],
        summary: "OpenAPI 3.1 document",
        security: [],
        responses: {
          "200": {
            description: "OpenAPI JSON",
            content: {
              "application/json": {
                schema: { type: "object" },
              },
            },
          },
        },
      },
    },
    [`${ApiContract.basePath}${ApiContract.routes.docs}`]: {
      get: {
        tags: ["Documentation"],
        summary: "API documentation UI",
        security: [],
        responses: {
          "200": {
            description: "HTML documentation page",
            content: {
              "text/html": {
                schema: { type: "string" },
              },
            },
          },
        },
      },
    },
    [`${ApiContract.basePath}${ApiContract.routes.businessCategories}`]: {
      get: {
        tags: ["BusinessOnboarding"],
        summary: "List active business categories",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Business categories",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccessEnvelope" },
              },
            },
          },
        },
      },
    },
    [`${ApiContract.basePath}${ApiContract.routes.businessCategoryRequirements}`]: {
      get: {
        tags: ["BusinessOnboarding"],
        summary: "List document requirements for a category",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "categoryId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "200": {
            description: "Document requirements",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccessEnvelope" },
              },
            },
          },
        },
      },
    },
    [`${ApiContract.basePath}${ApiContract.routes.businessApplications}`]: {
      get: {
        tags: ["BusinessOnboarding"],
        summary: "List business applications (own, or all with read_all)",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Application list",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccessEnvelope" },
              },
            },
          },
        },
      },
      post: {
        tags: ["BusinessOnboarding"],
        summary: "Create a draft business application",
        security: [{ bearerAuth: [] }],
        responses: {
          "201": {
            description: "Created application",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccessEnvelope" },
              },
            },
          },
        },
      },
    },
    [`${ApiContract.basePath}${ApiContract.routes.businessApplicationById}`]: {
      get: {
        tags: ["BusinessOnboarding"],
        summary: "Get business application detail",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "200": {
            description: "Application detail with branch, steps, documents, reviews",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccessEnvelope" },
              },
            },
          },
        },
      },
      patch: {
        tags: ["BusinessOnboarding"],
        summary: "Update draft application fields",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "200": {
            description: "Updated application",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccessEnvelope" },
              },
            },
          },
        },
      },
    },
    [`${ApiContract.basePath}${ApiContract.routes.businessApplicationSubmit}`]: {
      post: {
        tags: ["BusinessOnboarding"],
        summary: "Submit application for review",
        description: "Supports Idempotency-Key header.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "200": {
            description: "Submitted application",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccessEnvelope" },
              },
            },
          },
        },
      },
    },
    [`${ApiContract.basePath}${ApiContract.routes.businessApplicationApprove}`]: {
      post: {
        tags: ["BusinessOnboarding"],
        summary: "Approve application and create business",
        description: "Calls approve_business_application RPC. Supports Idempotency-Key.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "200": {
            description: "Approval result with businessId",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccessEnvelope" },
              },
            },
          },
        },
      },
    },
    [`${ApiContract.basePath}${ApiContract.routes.businessApplicationDocuments}`]: {
      get: {
        tags: ["BusinessOnboarding"],
        summary: "List application documents",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "200": {
            description: "Application documents",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccessEnvelope" },
              },
            },
          },
        },
      },
      post: {
        tags: ["BusinessOnboarding"],
        summary: "Register document metadata and receive storage upload path",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "201": {
            description: "Document metadata with storagePath and bucket",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccessEnvelope" },
              },
            },
          },
        },
      },
    },
    [`${ApiContract.basePath}${ApiContract.routes.myBusinessMemberships}`]: {
      get: {
        tags: ["BusinessManagement"],
        summary: "List caller active business memberships",
        description: "Used by the business switcher.",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Active memberships",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccessEnvelope" },
              },
            },
          },
        },
      },
    },
    [`${ApiContract.basePath}${ApiContract.routes.businessById}`]: {
      get: {
        tags: ["BusinessManagement"],
        summary: "Get business internal profile",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "businessId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "200": {
            description: "Business profile",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccessEnvelope" },
              },
            },
          },
        },
      },
      patch: {
        tags: ["BusinessManagement"],
        summary: "Update approved business-managed fields",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "businessId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "200": {
            description: "Updated business",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccessEnvelope" },
              },
            },
          },
        },
      },
    },
    [`${ApiContract.basePath}${ApiContract.routes.businessPublic}`]: {
      get: {
        tags: ["BusinessManagement"],
        summary: "Get public business profile",
        description: "Returns active verified businesses with approved public fields only.",
        security: [],
        parameters: [
          {
            name: "businessId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "200": {
            description: "Public business profile",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccessEnvelope" },
              },
            },
          },
        },
      },
    },
    [`${ApiContract.basePath}${ApiContract.routes.businessBranches}`]: {
      get: {
        tags: ["BusinessManagement"],
        summary: "List business branches",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "businessId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "200": {
            description: "Branches",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccessEnvelope" },
              },
            },
          },
        },
      },
      post: {
        tags: ["BusinessManagement"],
        summary: "Create a business branch",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "businessId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "201": {
            description: "Created branch",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccessEnvelope" },
              },
            },
          },
        },
      },
    },
    [`${ApiContract.basePath}${ApiContract.routes.businessInvitations}`]: {
      get: {
        tags: ["BusinessManagement"],
        summary: "List business invitations",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "businessId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "200": {
            description: "Invitations",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccessEnvelope" },
              },
            },
          },
        },
      },
      post: {
        tags: ["BusinessManagement"],
        summary: "Create member invitation",
        description: "Returns raw token once; only SHA-256 hash is stored.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "businessId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "201": {
            description: "Invitation with one-time token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccessEnvelope" },
              },
            },
          },
        },
      },
    },
    [`${ApiContract.basePath}${ApiContract.routes.businessInvitationAccept}`]: {
      post: {
        tags: ["BusinessManagement"],
        summary: "Accept business invitation",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "token",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Accepted invitation with membership",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccessEnvelope" },
              },
            },
          },
        },
      },
    },
    [`${ApiContract.basePath}${ApiContract.routes.businessOpeningHours}`]: {
      get: {
        tags: ["BusinessManagement"],
        summary: "Get opening hours schedule",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "businessId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "200": {
            description: "Opening hours",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccessEnvelope" },
              },
            },
          },
        },
      },
      put: {
        tags: ["BusinessManagement"],
        summary: "Replace opening hours schedule",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "businessId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "200": {
            description: "Updated schedule",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccessEnvelope" },
              },
            },
          },
        },
      },
    },
    [`${ApiContract.basePath}${ApiContract.routes.businessSettings}`]: {
      get: {
        tags: ["BusinessManagement"],
        summary: "Get business settings",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "businessId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "200": {
            description: "Business settings",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccessEnvelope" },
              },
            },
          },
        },
      },
      patch: {
        tags: ["BusinessManagement"],
        summary: "Update business settings",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "businessId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "200": {
            description: "Updated settings",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccessEnvelope" },
              },
            },
          },
        },
      },
    },
    [`${ApiContract.basePath}${ApiContract.routes.serviceCategories}`]: {
      get: {
        tags: ["Catalog"],
        summary: "List service categories",
        security: [],
        responses: {
          "200": {
            description: "Active service categories",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccessEnvelope" },
              },
            },
          },
        },
      },
    },
    [`${ApiContract.basePath}${ApiContract.routes.businessServices}`]: {
      get: {
        tags: ["Catalog"],
        summary: "List business services",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Services for a business",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccessEnvelope" },
              },
            },
          },
        },
      },
      post: {
        tags: ["Catalog"],
        summary: "Create a business service",
        security: [{ bearerAuth: [] }],
        responses: {
          "201": {
            description: "Created service",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccessEnvelope" },
              },
            },
          },
        },
      },
    },
    [`${ApiContract.basePath}${ApiContract.routes.businessProducts}`]: {
      get: {
        tags: ["Catalog"],
        summary: "List business products",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Products for a business",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccessEnvelope" },
              },
            },
          },
        },
      },
    },
    [`${ApiContract.basePath}${ApiContract.routes.businessInventory}`]: {
      get: {
        tags: ["Catalog"],
        summary: "List business inventory",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Inventory rows",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccessEnvelope" },
              },
            },
          },
        },
      },
    },
    [`${ApiContract.basePath}${ApiContract.routes.vehicles}`]: {
      get: {
        tags: ["Vehicles"],
        summary: "List own vehicles",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Customer vehicles",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccessEnvelope" },
              },
            },
          },
        },
      },
      post: {
        tags: ["Vehicles"],
        summary: "Create a vehicle",
        security: [{ bearerAuth: [] }],
        responses: {
          "201": {
            description: "Created vehicle",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccessEnvelope" },
              },
            },
          },
        },
      },
    },
    [`${ApiContract.basePath}${ApiContract.routes.discoveryBusinesses}`]: {
      get: {
        tags: ["Discovery"],
        summary: "Search active businesses",
        security: [],
        responses: {
          "200": {
            description: "Paginated business discovery results",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccessEnvelope" },
              },
            },
          },
        },
      },
    },
    [`${ApiContract.basePath}${ApiContract.routes.favorites}`]: {
      get: {
        tags: ["Discovery"],
        summary: "List own favorite businesses",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Favorites",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccessEnvelope" },
              },
            },
          },
        },
      },
    },
    [`${ApiContract.basePath}${ApiContract.routes.appointments}`]: {
      get: {
        tags: ["Appointments"],
        summary: "List own appointments",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Customer appointments",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccessEnvelope" },
              },
            },
          },
        },
      },
      post: {
        tags: ["Appointments"],
        summary: "Request an appointment",
        description: "Supports Idempotency-Key header.",
        security: [{ bearerAuth: [] }],
        responses: {
          "201": {
            description: "Created appointment",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccessEnvelope" },
              },
            },
          },
        },
      },
    },
    [`${ApiContract.basePath}${ApiContract.routes.appointmentById}`]: {
      get: {
        tags: ["Appointments"],
        summary: "Get appointment by id",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Appointment detail",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccessEnvelope" },
              },
            },
          },
        },
      },
    },
    [`${ApiContract.basePath}${ApiContract.routes.appointmentConfirm}`]: {
      post: {
        tags: ["Appointments"],
        summary: "Confirm appointment",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Updated appointment",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccessEnvelope" },
              },
            },
          },
        },
      },
    },
    [`${ApiContract.basePath}${ApiContract.routes.appointmentReject}`]: {
      post: {
        tags: ["Appointments"],
        summary: "Reject appointment",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Updated appointment",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccessEnvelope" },
              },
            },
          },
        },
      },
    },
    [`${ApiContract.basePath}${ApiContract.routes.appointmentCancel}`]: {
      post: {
        tags: ["Appointments"],
        summary: "Cancel appointment",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Updated appointment",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccessEnvelope" },
              },
            },
          },
        },
      },
    },
    [`${ApiContract.basePath}${ApiContract.routes.appointmentArrive}`]: {
      post: {
        tags: ["Appointments"],
        summary: "Mark customer arrived",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Updated appointment",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccessEnvelope" },
              },
            },
          },
        },
      },
    },
    [`${ApiContract.basePath}${ApiContract.routes.appointmentStart}`]: {
      post: {
        tags: ["Appointments"],
        summary: "Start appointment",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Updated appointment",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccessEnvelope" },
              },
            },
          },
        },
      },
    },
    [`${ApiContract.basePath}${ApiContract.routes.appointmentComplete}`]: {
      post: {
        tags: ["Appointments"],
        summary: "Complete appointment",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Updated appointment",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccessEnvelope" },
              },
            },
          },
        },
      },
    },
    [`${ApiContract.basePath}${ApiContract.routes.appointmentNoShow}`]: {
      post: {
        tags: ["Appointments"],
        summary: "Mark appointment no-show",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Updated appointment",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccessEnvelope" },
              },
            },
          },
        },
      },
    },
    [`${ApiContract.basePath}${ApiContract.routes.businessAppointments}`]: {
      get: {
        tags: ["Appointments"],
        summary: "List business appointments",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Business appointments",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccessEnvelope" },
              },
            },
          },
        },
      },
    },
    [`${ApiContract.basePath}${ApiContract.routes.businessBranchAppointmentSlots}`]: {
      get: {
        tags: ["Appointments"],
        summary: "List available appointment slots for a branch/date",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Available slots",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccessEnvelope" },
              },
            },
          },
        },
      },
    },
    [`${ApiContract.basePath}${ApiContract.routes.quotations}`]: {
      get: {
        tags: ["Quotations"],
        summary: "List own quotations",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Customer quotations",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccessEnvelope" },
              },
            },
          },
        },
      },
    },
    [`${ApiContract.basePath}${ApiContract.routes.quotationById}`]: {
      get: {
        tags: ["Quotations"],
        summary: "Get quotation by id",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Quotation detail",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccessEnvelope" },
              },
            },
          },
        },
      },
    },
    [`${ApiContract.basePath}${ApiContract.routes.quotationView}`]: {
      post: {
        tags: ["Quotations"],
        summary: "Mark quotation viewed (customer)",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Updated quotation",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccessEnvelope" },
              },
            },
          },
        },
      },
    },
    [`${ApiContract.basePath}${ApiContract.routes.quotationAccept}`]: {
      post: {
        tags: ["Quotations"],
        summary: "Accept quotation (customer)",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Accepted quotation",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccessEnvelope" },
              },
            },
          },
        },
      },
    },
    [`${ApiContract.basePath}${ApiContract.routes.quotationReject}`]: {
      post: {
        tags: ["Quotations"],
        summary: "Reject quotation (customer)",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Rejected quotation",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccessEnvelope" },
              },
            },
          },
        },
      },
    },
    [`${ApiContract.basePath}${ApiContract.routes.businessQuotations}`]: {
      get: {
        tags: ["Quotations"],
        summary: "List business quotations",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Business quotations",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccessEnvelope" },
              },
            },
          },
        },
      },
      post: {
        tags: ["Quotations"],
        summary: "Create draft quotation",
        description: "Supports Idempotency-Key header.",
        security: [{ bearerAuth: [] }],
        responses: {
          "201": {
            description: "Created quotation",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccessEnvelope" },
              },
            },
          },
        },
      },
    },
    [`${ApiContract.basePath}${ApiContract.routes.businessQuotationById}`]: {
      get: {
        tags: ["Quotations"],
        summary: "Get business quotation by id",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Quotation detail",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccessEnvelope" },
              },
            },
          },
        },
      },
      patch: {
        tags: ["Quotations"],
        summary: "Update draft quotation",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Updated quotation",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccessEnvelope" },
              },
            },
          },
        },
      },
    },
    [`${ApiContract.basePath}${ApiContract.routes.businessQuotationIssue}`]: {
      post: {
        tags: ["Quotations"],
        summary: "Issue quotation to customer",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Issued quotation",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccessEnvelope" },
              },
            },
          },
        },
      },
    },
    [`${ApiContract.basePath}${ApiContract.routes.businessQuotationRevise}`]: {
      post: {
        tags: ["Quotations"],
        summary: "Create revised draft quotation",
        security: [{ bearerAuth: [] }],
        responses: {
          "201": {
            description: "Revised quotation draft",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccessEnvelope" },
              },
            },
          },
        },
      },
    },
    [`${ApiContract.basePath}${ApiContract.routes.businessQuotationCancel}`]: {
      post: {
        tags: ["Quotations"],
        summary: "Cancel quotation",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Cancelled quotation",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccessEnvelope" },
              },
            },
          },
        },
      },
    },
    [`${ApiContract.basePath}${ApiContract.routes.businessAppointmentQuotation}`]: {
      post: {
        tags: ["Quotations"],
        summary: "Create draft quotation from appointment",
        description: "Supports Idempotency-Key header.",
        security: [{ bearerAuth: [] }],
        responses: {
          "201": {
            description: "Created quotation",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccessEnvelope" },
              },
            },
          },
        },
      },
    },
    [`${ApiContract.basePath}${ApiContract.routes.invoices}`]: {
      get: {
        tags: ["Invoices"],
        summary: "List own invoices",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Customer invoices",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccessEnvelope" },
              },
            },
          },
        },
      },
    },
    [`${ApiContract.basePath}${ApiContract.routes.invoiceById}`]: {
      get: {
        tags: ["Invoices"],
        summary: "Get invoice by id",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Invoice detail",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccessEnvelope" },
              },
            },
          },
        },
      },
    },
    [`${ApiContract.basePath}${ApiContract.routes.invoiceView}`]: {
      post: {
        tags: ["Invoices"],
        summary: "Mark invoice viewed (customer)",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Updated invoice",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccessEnvelope" },
              },
            },
          },
        },
      },
    },
    [`${ApiContract.basePath}${ApiContract.routes.invoiceApprove}`]: {
      post: {
        tags: ["Invoices"],
        summary: "Approve invoice (customer)",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Approved invoice",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccessEnvelope" },
              },
            },
          },
        },
      },
    },
    [`${ApiContract.basePath}${ApiContract.routes.businessInvoices}`]: {
      get: {
        tags: ["Invoices"],
        summary: "List business invoices",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Business invoices",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccessEnvelope" },
              },
            },
          },
        },
      },
      post: {
        tags: ["Invoices"],
        summary: "Create draft invoice",
        description: "Supports Idempotency-Key header.",
        security: [{ bearerAuth: [] }],
        responses: {
          "201": {
            description: "Created invoice",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccessEnvelope" },
              },
            },
          },
        },
      },
    },
    [`${ApiContract.basePath}${ApiContract.routes.businessInvoiceById}`]: {
      get: {
        tags: ["Invoices"],
        summary: "Get business invoice by id",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Invoice detail",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccessEnvelope" },
              },
            },
          },
        },
      },
      patch: {
        tags: ["Invoices"],
        summary: "Update draft invoice",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Updated invoice",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccessEnvelope" },
              },
            },
          },
        },
      },
    },
    [`${ApiContract.basePath}${ApiContract.routes.businessInvoiceIssue}`]: {
      post: {
        tags: ["Invoices"],
        summary: "Issue invoice to customer",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Issued invoice",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccessEnvelope" },
              },
            },
          },
        },
      },
    },
    [`${ApiContract.basePath}${ApiContract.routes.businessInvoiceCancel}`]: {
      post: {
        tags: ["Invoices"],
        summary: "Cancel invoice",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Cancelled invoice",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccessEnvelope" },
              },
            },
          },
        },
      },
    },
    [`${ApiContract.basePath}${ApiContract.routes.businessQuotationInvoice}`]: {
      post: {
        tags: ["Invoices"],
        summary: "Create invoice from accepted quotation",
        description: "Supports Idempotency-Key header.",
        security: [{ bearerAuth: [] }],
        responses: {
          "201": {
            description: "Created invoice",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccessEnvelope" },
              },
            },
          },
        },
      },
    },
    [`${ApiContract.basePath}${ApiContract.routes.businessAppointmentInvoice}`]: {
      post: {
        tags: ["Invoices"],
        summary: "Create draft invoice from appointment",
        description: "Supports Idempotency-Key header.",
        security: [{ bearerAuth: [] }],
        responses: {
          "201": {
            description: "Created invoice",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccessEnvelope" },
              },
            },
          },
        },
      },
    },
    [`${ApiContract.basePath}${ApiContract.routes.payments}`]: {
      get: {
        tags: ["Payments"],
        summary: "List own payments",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Customer payments",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccessEnvelope" },
              },
            },
          },
        },
      },
    },
    [`${ApiContract.basePath}${ApiContract.routes.paymentById}`]: {
      get: {
        tags: ["Payments"],
        summary: "Get payment by id",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Payment detail",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccessEnvelope" },
              },
            },
          },
        },
      },
    },
    [`${ApiContract.basePath}${ApiContract.routes.invoicePayments}`]: {
      get: {
        tags: ["Payments"],
        summary: "List payments for invoice (customer)",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Invoice payments",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccessEnvelope" },
              },
            },
          },
        },
      },
    },
    [`${ApiContract.basePath}${ApiContract.routes.businessPayments}`]: {
      get: {
        tags: ["Payments"],
        summary: "List business payments",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Business payments",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccessEnvelope" },
              },
            },
          },
        },
      },
    },
    [`${ApiContract.basePath}${ApiContract.routes.businessInvoicePayments}`]: {
      get: {
        tags: ["Payments"],
        summary: "List payments for business invoice",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Invoice payments",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccessEnvelope" },
              },
            },
          },
        },
      },
    },
    [`${ApiContract.basePath}${ApiContract.routes.businessInvoiceCashPayment}`]: {
      post: {
        tags: ["Payments"],
        summary: "Record cash payment against invoice",
        description: "Supports Idempotency-Key header.",
        security: [{ bearerAuth: [] }],
        responses: {
          "201": {
            description: "Recorded payment",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccessEnvelope" },
              },
            },
          },
        },
      },
    },
    [`${ApiContract.basePath}${ApiContract.routes.reviewEligibilities}`]: {
      get: {
        tags: ["Reviews"],
        summary: "List own review eligibilities",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Customer review eligibilities",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccessEnvelope" },
              },
            },
          },
        },
      },
    },
    [`${ApiContract.basePath}${ApiContract.routes.reviews}`]: {
      get: {
        tags: ["Reviews"],
        summary: "List own reviews",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Customer reviews",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccessEnvelope" },
              },
            },
          },
        },
      },
      post: {
        tags: ["Reviews"],
        summary: "Create verified review",
        description: "Supports Idempotency-Key header.",
        security: [{ bearerAuth: [] }],
        responses: {
          "201": {
            description: "Created review",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccessEnvelope" },
              },
            },
          },
        },
      },
    },
    [`${ApiContract.basePath}${ApiContract.routes.reviewById}`]: {
      get: {
        tags: ["Reviews"],
        summary: "Get review by id",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Review detail",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccessEnvelope" },
              },
            },
          },
        },
      },
      patch: {
        tags: ["Reviews"],
        summary: "Update own published review",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Updated review",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccessEnvelope" },
              },
            },
          },
        },
      },
    },
    [`${ApiContract.basePath}${ApiContract.routes.businessReviews}`]: {
      get: {
        tags: ["Reviews"],
        summary: "List business reviews",
        description: "Authentication optional; published reviews are public.",
        responses: {
          "200": {
            description: "Business reviews",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccessEnvelope" },
              },
            },
          },
        },
      },
    },
    [`${ApiContract.basePath}${ApiContract.routes.adminReviews}`]: {
      get: {
        tags: ["Reviews"],
        summary: "List reviews for moderation",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Moderation review list",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccessEnvelope" },
              },
            },
          },
        },
      },
    },
    [`${ApiContract.basePath}${ApiContract.routes.adminReviewReports}`]: {
      get: {
        tags: ["Reviews"],
        summary: "List review reports",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Review reports",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccessEnvelope" },
              },
            },
          },
        },
      },
    },
    [`${ApiContract.basePath}${ApiContract.routes.disputes}`]: {
      get: {
        tags: ["Disputes"],
        summary: "List own disputes",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Customer disputes",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccessEnvelope" },
              },
            },
          },
        },
      },
      post: {
        tags: ["Disputes"],
        summary: "Open customer dispute",
        description: "Supports Idempotency-Key header.",
        security: [{ bearerAuth: [] }],
        responses: {
          "201": {
            description: "Created dispute",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccessEnvelope" },
              },
            },
          },
        },
      },
    },
    [`${ApiContract.basePath}${ApiContract.routes.disputeById}`]: {
      get: {
        tags: ["Disputes"],
        summary: "Get dispute by id",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Dispute detail",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccessEnvelope" },
              },
            },
          },
        },
      },
    },
    [`${ApiContract.basePath}${ApiContract.routes.businessDisputes}`]: {
      get: {
        tags: ["Disputes"],
        summary: "List business disputes",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Business disputes",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccessEnvelope" },
              },
            },
          },
        },
      },
      post: {
        tags: ["Disputes"],
        summary: "Open business-initiated dispute",
        security: [{ bearerAuth: [] }],
        responses: {
          "201": {
            description: "Created dispute",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccessEnvelope" },
              },
            },
          },
        },
      },
    },
    [`${ApiContract.basePath}${ApiContract.routes.adminDisputes}`]: {
      get: {
        tags: ["Disputes"],
        summary: "List disputes for moderation",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Admin dispute list",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiSuccessEnvelope" },
              },
            },
          },
        },
      },
    },
  },
} as const;

export type OpenApiDocument = typeof openApiDocument;
