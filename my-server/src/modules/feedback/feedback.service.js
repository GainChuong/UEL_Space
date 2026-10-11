const { AppError } = require('../../common/app-error');
const { newId, now } = require('../../common/id');
const { requireObject, requireString, optionalString, requireNumber } = require('../../common/validate');
const { writeAudit } = require('../../common/audit');

class FeedbackService {
  constructor(repository, { usageRepository, spaceRepository } = {}) {
    this.repository = repository;
    this.usage = usageRepository;
    this.spaces = spaceRepository;
  }

  list(filter = {}) {
    const query = {};
    if (filter.spaceId) query.spaceId = filter.spaceId;
    if (filter.userId) query.userId = filter.userId;
    return this.repository.findAll(query);
  }

  async create(input, actor) {
    requireObject(input);
    const usageId = requireString(input.usageId, 'usageId');
    const session = await this.usage.findSessionById(usageId);
    if (!session) throw AppError.badRequest('Phiên sử dụng không tồn tại', 'USAGE_NOT_FOUND');
    if (session.userId !== actor.id) {
      throw AppError.forbidden('Chỉ có thể đánh giá phiên sử dụng của chính mình', 'FEEDBACK_NOT_OWNER');
    }
    const rating = requireNumber(input.rating, 'rating', { min: 1, max: 5, integer: true });

    const feedback = {
      _id: newId(),
      userId: actor.id,
      userName: actor.name,
      spaceId: session.spaceId,
      spaceName: session.spaceName,
      usageId,
      rating,
      feedbackType: optionalString(input.feedbackType, 'feedbackType') || 'GENERAL',
      content: requireString(input.content, 'content', { min: 3 }),
      status: 'SUBMITTED',
      submitTime: now(),
      createdAt: now()
    };
    await this.repository.insert(feedback);
    await writeAudit({ actorId: actor.id, action: 'CREATE', entityName: 'Feedback', entityId: feedback._id, changes: { rating, usageId } });
    return feedback;
  }
}

module.exports = { FeedbackService };
