const { Router } = require('express');
const asyncHandler = require('../../common/async-handler');
const { OrganizationRepository } = require('./organization.repository');
const { MembershipRepository } = require('./membership.repository');
const { OrganizationService } = require('./organization.service');
const { requireAdmin, requireManager } = require('../../middleware/require-auth');

function organizationRoutes(collections) {
  const router = Router();
  const service = new OrganizationService(
    new OrganizationRepository(collections.organizations),
    new MembershipRepository(collections.memberships)
  );

  router.get('/', requireManager, asyncHandler(async (req, res) => res.json(await service.list())));
  router.post('/', requireAdmin, asyncHandler(async (req, res) => {
    res.status(201).json(await service.create(req.body, req.user?.id));
  }));
  router.get('/:id', requireAdmin, asyncHandler(async (req, res) => res.json(await service.detail(req.params.id))));
  router.get('/:id/members', requireManager, asyncHandler(async (req, res) => {
    res.json(await service.listMembers(req.params.id));
  }));
  router.post('/:id/members', requireAdmin, asyncHandler(async (req, res) => {
    res.status(201).json(await service.addMember(req.params.id, req.body, req.user?.id));
  }));

  return router;
}

module.exports = { organizationRoutes };
