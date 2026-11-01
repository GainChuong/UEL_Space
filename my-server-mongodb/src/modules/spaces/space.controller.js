class SpaceController {
  constructor(service) {
    this.service = service;
  }

  list = async (req, res) => {
    const filters = {
      buildingId: req.query.buildingId,
      floorId: req.query.floorId,
      categoryId: req.query.categoryId || req.query.spaceTypeId,
      status: req.query.status,
      minCapacity: req.query.minCapacity || req.query.capacity,
      maxCapacity: req.query.maxCapacity,
      minArea: req.query.minArea || req.query.area,
      keyword: req.query.keyword || req.query.q,
      equipment: req.query.equipment,
      availableAt: req.query.availableAt || req.query.startTime,
      endTime: req.query.endTime,
      date: req.query.date,
      checkInDate: req.query.checkInDate,
      checkOutDate: req.query.checkOutDate,
      role: req.user?.role
    };
    res.json(await this.service.list(filters));
  };

  detail = async (req, res) => {
    res.json(await this.service.detail(req.params.id));
  };

  create = async (req, res) => {
    res.status(201).json(await this.service.create(req.body, req.user?.id));
  };

  update = async (req, res) => {
    res.json(await this.service.update(req.params.id, req.body, req.user?.id));
  };

  remove = async (req, res) => {
    await this.service.remove(req.params.id, req.user?.id);
    res.status(204).end();
  };

  changeStatus = async (req, res) => {
    res.json(await this.service.changeStatus(req.params.id, req.body?.status, req.user?.id, req.body?.reason));
  };
}

module.exports = { SpaceController };
