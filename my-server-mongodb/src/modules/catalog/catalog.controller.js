class CatalogController {
  constructor(service) {
    this.service = service;
  }

  listBuildings = async (req, res) => {
    res.json(await this.service.listBuildings({}));
  };

  createBuilding = async (req, res) => {
    res.status(201).json(await this.service.createBuilding(req.body, req.user?.id));
  };

  updateBuilding = async (req, res) => {
    res.json(await this.service.updateBuilding(req.params.id, req.body, req.user?.id));
  };

  listFloors = async (req, res) => {
    res.json(await this.service.listFloors(req.query.buildingId));
  };

  createFloor = async (req, res) => {
    res.status(201).json(await this.service.createFloor(req.body, req.user?.id));
  };

  listCategories = async (req, res) => {
    res.json(await this.service.listCategories());
  };

  createCategory = async (req, res) => {
    res.status(201).json(await this.service.createCategory(req.body, req.user?.id));
  };

  listEquipment = async (req, res) => {
    res.json(await this.service.listEquipment());
  };

  createEquipment = async (req, res) => {
    res.status(201).json(await this.service.createEquipment(req.body, req.user?.id));
  };
}

module.exports = { CatalogController };
