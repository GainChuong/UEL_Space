/**
 * UEL Space - Chatbot Repository
 * Quản lý lưu trữ phiên trò chuyện và lịch sử tương tác trên MongoDB Atlas
 */

class ChatbotRepository {
  constructor(collection) {
    this.collection = collection;
  }

  /**
   * Lấy hoặc khởi tạo phiên chat mới
   */
  async getOrCreateSession({ sessionId, userId = null }) {
    if (!this.collection) return null;

    let session = await this.collection.findOne({ sessionId });
    if (!session) {
      session = {
        sessionId,
        userId: userId || null,
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await this.collection.insertOne(session);
    }
    return session;
  }

  /**
   * Lưu các tin nhắn mới vào phiên chat
   */
  async appendMessages(sessionId, newMessages = []) {
    if (!this.collection || newMessages.length === 0) return false;

    await this.collection.updateOne(
      { sessionId },
      {
        $push: { messages: { $each: newMessages } },
        $set: { updatedAt: new Date() }
      },
      { upsert: true }
    );
    return true;
  }

  /**
   * Lấy toàn bộ lịch sử tin nhắn của một phiên
   */
  async getSessionHistory(sessionId) {
    if (!this.collection) return [];
    const session = await this.collection.findOne({ sessionId });
    return session ? session.messages || [] : [];
  }

  /**
   * Xóa lịch sử tin nhắn của phiên
   */
  async deleteSessionHistory(sessionId) {
    if (!this.collection) return false;
    await this.collection.updateOne(
      { sessionId },
      { $set: { messages: [], updatedAt: new Date() } }
    );
    return true;
  }
}

module.exports = { ChatbotRepository };
