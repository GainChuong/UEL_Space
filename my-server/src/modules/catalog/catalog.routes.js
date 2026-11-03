const { Router } = require('express');
const asyncHandler = require('../../common/async-handler');
const { CatalogRepository } = require('./catalog.repository');
const { CatalogService } = require('./catalog.service');
const { CatalogController } = require('./catalog.controller');
const { requireManager } = require('../../middleware/require-auth');

function catalogRoutes({ buildings, floors, categories, equipment }) {
  const router = Router();
  const service = new CatalogService(new CatalogRepository({ buildings, floors, categories, equipment }));
  const controller = new CatalogController(service);

  router.get('/buildings', asyncHandler(controller.listBuildings));
  router.post('/buildings', requireManager, asyncHandler(controller.createBuilding));
  router.put('/buildings/:id', requireManager, asyncHandler(controller.updateBuilding));

  router.get('/floors', asyncHandler(controller.listFloors));
  router.post('/floors', requireManager, asyncHandler(controller.createFloor));

  router.get('/categories', asyncHandler(controller.listCategories));
  router.post('/categories', requireManager, asyncHandler(controller.createCategory));

  router.get('/equipment', asyncHandler(controller.listEquipment));
  router.post('/equipment', requireManager, asyncHandler(controller.createEquipment));

  return router;
}

module.exports = { catalogRoutes };
