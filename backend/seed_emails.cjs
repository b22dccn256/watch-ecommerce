const mongoose = require('mongoose');

const mongourl = process.env.MONGO_URI || process.env.MONGOURL;
mongoose.connect(mongourl).then(async () => {
  try {
    const db = mongoose.connection.db;

    // Seed some MailCampaigns
    const camp1Id = new mongoose.Types.ObjectId();
    const camp2Id = new mongoose.Types.ObjectId();

    await db.collection('mailcampaigns').insertMany([
      {
        _id: camp1Id,
        name: 'Chiến dịch khuyến mãi Hè 2026',
        subject: 'Sale khủng mùa hè lên đến 50%',
        status: 'sent',
        targetAudience: 'all',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      },
      {
        _id: camp2Id,
        name: 'Giới thiệu BST Casio mới',
        subject: 'Khám phá ngay các mẫu Casio mới nhất',
        status: 'sent',
        targetAudience: 'newsletter',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      }
    ]);

    // Seed some EmailLogs (fake stats for the past 7 days)
    const logs = [];
    for (let i = 0; i < 50; i++) {
      const daysAgo = Math.floor(Math.random() * 7);
      const isOpened = Math.random() > 0.4;
      const isClicked = isOpened && Math.random() > 0.5;
      const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

      const log = {
        _id: new mongoose.Types.ObjectId(),
        campaignId: Math.random() > 0.5 ? camp1Id : camp2Id,
        email: `customer${i}@example.com`,
        status: 'sent',
        createdAt: createdAt,
        updatedAt: createdAt
      };

      if (isOpened) {
        log.openedAt = [new Date(createdAt.getTime() + 3600000)];
      }
      if (isClicked) {
        log.clickedLinks = [{ url: 'http://example.com', clickedAt: new Date(createdAt.getTime() + 7200000) }];
      }
      logs.push(log);
    }

    await db.collection('emaillogs').insertMany(logs);

    // Seed some Contacts (Inbox)
    const contacts = [];
    for (let i = 1; i <= 15; i++) {
      contacts.push({
        _id: new mongoose.Types.ObjectId(),
        name: `Khách hàng ${i}`,
        email: `khachhang${i}@gmail.com`,
        subject: `Hỏi về sản phẩm mẫu ${i}`,
        message: `Tôi muốn hỏi chi tiết về mẫu đồng hồ số ${i}. Xin cảm ơn!`,
        isRead: Math.random() > 0.5,
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 10) * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      });
    }
    await db.collection('contacts').insertMany(contacts);

    console.log('Seeded data successfully.');
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
});
