import { Hono } from "npm:hono@4.6.14";
import { z } from "npm:zod@3.24.1";
import type { AppVariables } from "../../core/types/context.ts";
import { requireAuthentication } from "../../core/auth/authentication.middleware.ts";
import {
  requireActiveBusiness,
  requireBusinessMembership,
  requireBusinessPermission,
} from "../../core/auth/business-authorization.middleware.ts";
import { validate } from "../../core/validation/validation.middleware.ts";
import { Permissions } from "../../core/constants/permissions.ts";
import { ApiContract } from "../../contracts/api-contract.ts";
import {
  businessIdParamsSchema,
  closureParamsSchema,
  closureDatesQuerySchema,
  createClosureDateSchema,
  openingHoursQuerySchema,
  replaceOpeningHoursSchema,
  updateBusinessSchema,
  updateBusinessSettingsSchema,
  updateClosureDateSchema,
} from "./business.schemas.ts";
import {
  createBranchSchema,
  branchParamsSchema,
  updateBranchSchema,
} from "./branch.schemas.ts";
import {
  membershipParamsSchema,
  updateMembershipRoleSchema,
} from "./membership.schemas.ts";
import {
  createInvitationSchema,
  invitationParamsSchema,
  invitationTokenParamsSchema,
  acceptInvitationSchema,
} from "./invitation.schemas.ts";
import {
  getBusinessController,
  getPublicBusinessController,
  updateBusinessController,
  getBusinessSettingsController,
  updateBusinessSettingsController,
  listMyBusinessMembershipsController,
} from "./business.controller.ts";
import {
  listBranchesController,
  createBranchController,
  getBranchController,
  updateBranchController,
  deleteBranchController,
  makePrimaryBranchController,
} from "./branch.controller.ts";
import {
  listMembersController,
  updateMemberRoleController,
  suspendMemberController,
  restoreMemberController,
  removeMemberController,
} from "./membership.controller.ts";
import {
  listInvitationsController,
  createInvitationController,
  revokeInvitationController,
  acceptInvitationController,
} from "./invitation.controller.ts";
import {
  getOpeningHoursController,
  replaceOpeningHoursController,
  listClosureDatesController,
  createClosureDateController,
  updateClosureDateController,
  deleteClosureDateController,
} from "./schedule.controller.ts";

export const businessRoutes = new Hono<{ Variables: AppVariables }>();

const emptyBodySchema = z.object({}).strict();

businessRoutes.get(
  ApiContract.routes.myBusinessMemberships,
  requireAuthentication(),
  (c) => listMyBusinessMembershipsController(c),
);

businessRoutes.get(
  ApiContract.routes.businessPublic,
  validate({ params: businessIdParamsSchema }),
  (c) => getPublicBusinessController(c),
);

businessRoutes.post(
  ApiContract.routes.businessInvitationAccept,
  requireAuthentication(),
  validate({
    params: invitationTokenParamsSchema,
    body: acceptInvitationSchema,
  }),
  (c) => acceptInvitationController(c),
);

businessRoutes.get(
  ApiContract.routes.businessById,
  requireAuthentication(),
  requireBusinessMembership(),
  requireBusinessPermission(Permissions.Business.Read),
  validate({ params: businessIdParamsSchema }),
  (c) => getBusinessController(c),
);

businessRoutes.patch(
  ApiContract.routes.businessById,
  requireAuthentication(),
  requireBusinessMembership(),
  requireActiveBusiness(),
  requireBusinessPermission(Permissions.Business.Update),
  validate({ params: businessIdParamsSchema, body: updateBusinessSchema }),
  (c) => updateBusinessController(c),
);

businessRoutes.get(
  ApiContract.routes.businessBranches,
  requireAuthentication(),
  requireBusinessMembership(),
  requireBusinessPermission(Permissions.Business.Branch.Read),
  validate({ params: businessIdParamsSchema }),
  (c) => listBranchesController(c),
);

businessRoutes.post(
  ApiContract.routes.businessBranches,
  requireAuthentication(),
  requireBusinessMembership(),
  requireActiveBusiness(),
  requireBusinessPermission(Permissions.Business.Branch.Create),
  validate({ params: businessIdParamsSchema, body: createBranchSchema }),
  (c) => createBranchController(c),
);

businessRoutes.get(
  ApiContract.routes.businessBranchById,
  requireAuthentication(),
  requireBusinessMembership(),
  requireBusinessPermission(Permissions.Business.Branch.Read),
  validate({ params: branchParamsSchema }),
  (c) => getBranchController(c),
);

businessRoutes.patch(
  ApiContract.routes.businessBranchById,
  requireAuthentication(),
  requireBusinessMembership(),
  requireActiveBusiness(),
  requireBusinessPermission(Permissions.Business.Branch.Update),
  validate({ params: branchParamsSchema, body: updateBranchSchema }),
  (c) => updateBranchController(c),
);

businessRoutes.delete(
  ApiContract.routes.businessBranchById,
  requireAuthentication(),
  requireBusinessMembership(),
  requireActiveBusiness(),
  requireBusinessPermission(Permissions.Business.Branch.Delete),
  validate({ params: branchParamsSchema }),
  (c) => deleteBranchController(c),
);

businessRoutes.post(
  ApiContract.routes.businessBranchMakePrimary,
  requireAuthentication(),
  requireBusinessMembership(),
  requireActiveBusiness(),
  requireBusinessPermission(Permissions.Business.Branch.Update),
  validate({ params: branchParamsSchema, body: emptyBodySchema }),
  (c) => makePrimaryBranchController(c),
);

businessRoutes.get(
  ApiContract.routes.businessMembers,
  requireAuthentication(),
  requireBusinessMembership(),
  requireBusinessPermission(Permissions.Business.Member.Read),
  validate({ params: businessIdParamsSchema }),
  (c) => listMembersController(c),
);

businessRoutes.patch(
  ApiContract.routes.businessMemberById,
  requireAuthentication(),
  requireBusinessMembership(),
  requireActiveBusiness(),
  requireBusinessPermission(Permissions.Business.Member.Update),
  validate({
    params: membershipParamsSchema,
    body: updateMembershipRoleSchema,
  }),
  (c) => updateMemberRoleController(c),
);

businessRoutes.post(
  ApiContract.routes.businessMemberSuspend,
  requireAuthentication(),
  requireBusinessMembership(),
  requireActiveBusiness(),
  requireBusinessPermission(Permissions.Business.Member.Suspend),
  validate({ params: membershipParamsSchema, body: emptyBodySchema }),
  (c) => suspendMemberController(c),
);

businessRoutes.post(
  ApiContract.routes.businessMemberRestore,
  requireAuthentication(),
  requireBusinessMembership(),
  requireActiveBusiness(),
  requireBusinessPermission(Permissions.Business.Member.Suspend),
  validate({ params: membershipParamsSchema, body: emptyBodySchema }),
  (c) => restoreMemberController(c),
);

businessRoutes.delete(
  ApiContract.routes.businessMemberById,
  requireAuthentication(),
  requireBusinessMembership(),
  requireActiveBusiness(),
  requireBusinessPermission(Permissions.Business.Member.Remove),
  validate({ params: membershipParamsSchema }),
  (c) => removeMemberController(c),
);

businessRoutes.get(
  ApiContract.routes.businessInvitations,
  requireAuthentication(),
  requireBusinessMembership(),
  requireBusinessPermission(Permissions.Business.Member.Invite),
  validate({ params: businessIdParamsSchema }),
  (c) => listInvitationsController(c),
);

businessRoutes.post(
  ApiContract.routes.businessInvitations,
  requireAuthentication(),
  requireBusinessMembership(),
  requireActiveBusiness(),
  requireBusinessPermission(Permissions.Business.Member.Invite),
  validate({ params: businessIdParamsSchema, body: createInvitationSchema }),
  (c) => createInvitationController(c),
);

businessRoutes.delete(
  ApiContract.routes.businessInvitationById,
  requireAuthentication(),
  requireBusinessMembership(),
  requireActiveBusiness(),
  requireBusinessPermission(Permissions.Business.Member.Invite),
  validate({ params: invitationParamsSchema }),
  (c) => revokeInvitationController(c),
);

businessRoutes.get(
  ApiContract.routes.businessOpeningHours,
  requireAuthentication(),
  requireBusinessMembership(),
  requireBusinessPermission(Permissions.Business.Schedule.Read),
  validate({ params: businessIdParamsSchema, query: openingHoursQuerySchema }),
  (c) => getOpeningHoursController(c),
);

businessRoutes.put(
  ApiContract.routes.businessOpeningHours,
  requireAuthentication(),
  requireBusinessMembership(),
  requireActiveBusiness(),
  requireBusinessPermission(Permissions.Business.Schedule.Update),
  validate({
    params: businessIdParamsSchema,
    body: replaceOpeningHoursSchema,
  }),
  (c) => replaceOpeningHoursController(c),
);

businessRoutes.get(
  ApiContract.routes.businessClosureDates,
  requireAuthentication(),
  requireBusinessMembership(),
  requireBusinessPermission(Permissions.Business.Schedule.Read),
  validate({ params: businessIdParamsSchema, query: closureDatesQuerySchema }),
  (c) => listClosureDatesController(c),
);

businessRoutes.post(
  ApiContract.routes.businessClosureDates,
  requireAuthentication(),
  requireBusinessMembership(),
  requireActiveBusiness(),
  requireBusinessPermission(Permissions.Business.Schedule.Update),
  validate({ params: businessIdParamsSchema, body: createClosureDateSchema }),
  (c) => createClosureDateController(c),
);

businessRoutes.patch(
  ApiContract.routes.businessClosureDateById,
  requireAuthentication(),
  requireBusinessMembership(),
  requireActiveBusiness(),
  requireBusinessPermission(Permissions.Business.Schedule.Update),
  validate({
    params: closureParamsSchema,
    body: updateClosureDateSchema,
  }),
  (c) => updateClosureDateController(c),
);

businessRoutes.delete(
  ApiContract.routes.businessClosureDateById,
  requireAuthentication(),
  requireBusinessMembership(),
  requireActiveBusiness(),
  requireBusinessPermission(Permissions.Business.Schedule.Update),
  validate({ params: closureParamsSchema }),
  (c) => deleteClosureDateController(c),
);

businessRoutes.get(
  ApiContract.routes.businessSettings,
  requireAuthentication(),
  requireBusinessMembership(),
  requireBusinessPermission(Permissions.Business.Settings.Read),
  validate({ params: businessIdParamsSchema }),
  (c) => getBusinessSettingsController(c),
);

businessRoutes.patch(
  ApiContract.routes.businessSettings,
  requireAuthentication(),
  requireBusinessMembership(),
  requireActiveBusiness(),
  requireBusinessPermission(Permissions.Business.Settings.Update),
  validate({
    params: businessIdParamsSchema,
    body: updateBusinessSettingsSchema,
  }),
  (c) => updateBusinessSettingsController(c),
);
