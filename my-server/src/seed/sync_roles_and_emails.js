const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const MONGO_URI = 'mongodb+srv://gameyuno123_db_user:4ScSGOFQjScjIWOh@cluster0.jdglrux.mongodb.net/?retryWrites=true&w=majority';

async function syncRolesAndEmails() {
  const client = new MongoClient(MONGO_URI);
  try {
    await client.connect();
    console.log('Connected to MongoDB Atlas');
    const db = client.db('uel_space');
    const usersCol = db.collection('users');

    // 1. Password default hash: "123456"
    const defaultPasswordHash = await bcrypt.hash('123456', 10);

    // 2. Define standard list of clean users (ADMIN, SELLER, BUYER)
    const standardizedUsers = [
      // ADMIN (chỉ duy nhất 1 email admin@gmail.com, và dev admin gameyuno123@gmail.com)
      {
        email: 'admin@gmail.com',
        fullName: 'Admin Hệ Thống',
        role: 'ADMIN',
        code: 'ADMIN-001',
        phoneNumber: '0901234567',
        status: 'ACTIVE',
        organization: 'Ban Quản Trị Hệ Thống UEL Space'
      },
      {
        email: 'gameyuno123@gmail.com',
        fullName: 'Admin Kỹ Thuật',
        role: 'ADMIN',
        code: 'ADMIN-DEV',
        phoneNumber: '0908888999',
        status: 'ACTIVE',
        organization: 'Ban Quản Trị Hệ Thống UEL Space'
      },

      // SELLERS (5 đối tác quản lý không gian)
      {
        email: 'techpark@gmail.com',
        fullName: 'Nguyễn Kim Giang',
        role: 'SELLER',
        code: 'SELLER-TECHPARK',
        phoneNumber: '0903123456',
        status: 'ACTIVE',
        organization: 'TechPark Innovation Spaces'
      },
      {
        email: 'innovate@gmail.com',
        fullName: 'Lê Hoàng Long',
        role: 'SELLER',
        code: 'SELLER-INNOVATE',
        phoneNumber: '0918234567',
        status: 'ACTIVE',
        organization: 'Innovate Coworking Hub'
      },
      {
        email: 'landmark@gmail.com',
        fullName: 'Trần Minh Khoa',
        role: 'SELLER',
        code: 'SELLER-LANDMARK',
        phoneNumber: '0933345678',
        status: 'ACTIVE',
        organization: 'Landmark Convention & Offices'
      },
      {
        email: 'uelhub@gmail.com',
        fullName: 'Trịnh Kim Chi',
        role: 'SELLER',
        code: 'SELLER-UELHUB',
        phoneNumber: '0944456789',
        status: 'ACTIVE',
        organization: 'UEL Smart Hub Center'
      },
      {
        email: 'creative@gmail.com',
        fullName: 'Đỗ Thùy Linh',
        role: 'SELLER',
        code: 'SELLER-CREATIVE',
        phoneNumber: '0977567890',
        status: 'ACTIVE',
        organization: 'Creative Media Studios'
      },

      // BUYERS (Khách thuê, cá nhân, DN - giữ lại giangnntk24411@st.uel.edu.vn)
      {
        email: 'giangnntk24411@st.uel.edu.vn',
        fullName: 'Nguyễn Giang',
        role: 'BUYER',
        code: 'BUYER-GIANG',
        phoneNumber: '0988776655',
        status: 'ACTIVE',
        organization: 'Thành viên UEL Space'
      },
      {
        email: 'minhanh@gmail.com',
        fullName: 'Trần Minh Anh',
        role: 'BUYER',
        code: 'BUYER-MINHANH',
        phoneNumber: '0912111222',
        status: 'ACTIVE',
        organization: 'Doanh nghiệp Startup'
      },
      {
        email: 'hoangnam@gmail.com',
        fullName: 'Nguyễn Hoàng Nam',
        role: 'BUYER',
        code: 'BUYER-HOANGNAM',
        phoneNumber: '0913222333',
        status: 'ACTIVE',
        organization: 'Khách hàng cá nhân'
      },
      {
        email: 'quynhgiang@gmail.com',
        fullName: 'Lê Quỳnh Giang',
        role: 'BUYER',
        code: 'BUYER-QUYNHGIANG',
        phoneNumber: '0914333444',
        status: 'ACTIVE',
        organization: 'Khách hàng cá nhân'
      },
      {
        email: 'ducthinh@gmail.com',
        fullName: 'Vũ Đức Thịnh',
        role: 'BUYER',
        code: 'BUYER-DUCTHINH',
        phoneNumber: '0915444555',
        status: 'ACTIVE',
        organization: 'Doanh nghiệp Công nghệ'
      },
      {
        email: 'thaovy@gmail.com',
        fullName: 'Đặng Thảo Vy',
        role: 'BUYER',
        code: 'BUYER-THAOVY',
        phoneNumber: '0916555666',
        status: 'ACTIVE',
        organization: 'Khách hàng tự do'
      },
      {
        email: 'minhtri@gmail.com',
        fullName: 'Phạm Minh Trí',
        role: 'BUYER',
        code: 'BUYER-MINHTRI',
        phoneNumber: '0917666777',
        status: 'ACTIVE',
        organization: 'Khách hàng cá nhân'
      },
      {
        email: 'tuankiet@gmail.com',
        fullName: 'Hồ Tuấn Kiệt',
        role: 'BUYER',
        code: 'BUYER-TUANKIET',
        phoneNumber: '0918777888',
        status: 'ACTIVE',
        organization: 'Khách hàng tự do'
      },
      {
        email: 'maiphuong@gmail.com',
        fullName: 'Ngô Mai Phương',
        role: 'BUYER',
        code: 'BUYER-MAIPHUONG',
        phoneNumber: '0919888999',
        status: 'ACTIVE',
        organization: 'Khách hàng cá nhân'
      },
      {
        email: 'quynhnhu@gmail.com',
        fullName: 'Phạm Quỳnh Như',
        role: 'BUYER',
        code: 'BUYER-QUYNHNHU',
        phoneNumber: '0920999000',
        status: 'ACTIVE',
        organization: 'Khách hàng cá nhân'
      }
    ];

    // Xóa tất cả các user mang email cũ rườm rà hoặc title giảng viên / thạc sĩ
    const oldEmailsToRemove = [
      'admin.uelspace@gmail.com',
      'admin@uel.edu.vn',
      'admin@uelspace.vn',
      'chittk.uel@gmail.com',
      'chittk@uel.edu.vn',
      'annv.uel@gmail.com',
      'annv@uel.edu.vn',
      'ngocttb.uel@gmail.com',
      'ngocttb21411@st.uel.edu.vn',
      'techpark.executive@gmail.com',
      'techpark.executive@uelspace.vn',
      'innovate.hub@gmail.com',
      'innovate.hub@uelspace.vn',
      'landmark.events@gmail.com',
      'landmark.events@uelspace.vn',
      'bql.csvc.uel@gmail.com',
      'bql.csvc@uel.edu.vn',
      'media.lab.uel@gmail.com',
      'media.lab@uelspace.vn',
      'contact.uelspace@gmail.com',
      'contact@uelspace.vn',
      'member.techflow@gmail.com',
      'member@techflow.vn',
      'anhnp.uel@gmail.com',
      'anhnpk24411@st.uel.edu.vn'
    ];
    await usersCol.deleteMany({ email: { $in: oldEmailsToRemove } });
    console.log('Removed obsolete/verbose email records.');

    for (const u of standardizedUsers) {
      await usersCol.updateOne(
        { email: u.email },
        {
          $set: {
            fullName: u.fullName,
            role: u.role,
            code: u.code,
            phoneNumber: u.phoneNumber,
            status: u.status,
            organization: u.organization,
            passwordHash: defaultPasswordHash,
            updatedAt: new Date().toISOString()
          },
          $setOnInsert: {
            _id: 'usr-' + u.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, ''),
            avatar: '',
            authProvider: 'PASSWORD',
            version: 1,
            createdAt: new Date().toISOString()
          }
        },
        { upsert: true }
      );
      console.log(`Upserted [${u.role}] ${u.email} (${u.fullName})`);
    }

    // Update bất kỳ user nào còn role STUDENT / LECTURER / SPACE_MANAGER thành BUYER / SELLER
    await usersCol.updateMany({ role: { $in: ['STUDENT', 'CUSTOMER', 'STAFF'] } }, { $set: { role: 'BUYER' } });
    await usersCol.updateMany({ role: { $in: ['LECTURER', 'SPACE_MANAGER'] } }, { $set: { role: 'SELLER' } });

    console.log('--- SYNC COMPLETED SUCCESSFULLY ---');
    const finalUsers = await usersCol.find({}, { projection: { email: 1, fullName: 1, role: 1 } }).toArray();
    console.log(JSON.stringify(finalUsers, null, 2));

  } catch (err) {
    console.error('Sync error:', err);
  } finally {
    await client.close();
  }
}

syncRolesAndEmails();
