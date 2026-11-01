const { connectToDb, closeDb } = require('../config/db');
const { now } = require('../common/id');
const { SPACE_STATUS } = require('../common/constants');

const SELLERS = [
  {
    _id: 'seller-techpark',
    code: 'SELLER-TECHPARK',
    fullName: 'Nguyễn Trần Kim Giang',
    brandName: 'TechPark Executive Spaces',
    email: 'techpark.executive@uelspace.vn',
    phoneNumber: '0908112233',
    role: 'SELLER',
    avatar: '/images/avatars/seller_techpark.svg',
    rating: 4.96,
    reviewsCount: 128,
    responseRate: '99%',
    verified: true,
    badge: 'SuperHost • Đối tác Hạng Vàng',
    description: 'Chuyên cung cấp văn phòng riêng cao cấp, phòng họp VIP chuẩn quốc tế và phòng đào tạo tại trung tâm TP.HCM.',
    status: 'ACTIVE',
    createdAt: now(),
    updatedAt: now()
  },
  {
    _id: 'seller-innovate',
    code: 'SELLER-INNOVATE',
    fullName: 'Lê Hoàng Long',
    brandName: 'Innovate Co-working Network',
    email: 'innovate.hub@uelspace.vn',
    phoneNumber: '0918223344',
    role: 'SELLER',
    avatar: '/images/avatars/seller_innovate.svg',
    rating: 4.92,
    reviewsCount: 215,
    responseRate: '98%',
    verified: true,
    badge: 'SuperHost • Mạng lưới Co-working',
    description: 'Chuỗi không gian làm việc chia sẻ, Hot Desk và Meeting Pod cách âm hiện đại bậc nhất khu Công nghệ cao Thủ Đức.',
    status: 'ACTIVE',
    createdAt: now(),
    updatedAt: now()
  },
  {
    _id: 'seller-landmark',
    code: 'SELLER-LANDMARK',
    fullName: 'Trần Minh Khoa',
    brandName: 'Landmark Convention & Event Corp',
    email: 'landmark.events@uelspace.vn',
    phoneNumber: '0938334455',
    role: 'SELLER',
    avatar: '/images/avatars/seller_innovate.svg',
    rating: 4.94,
    reviewsCount: 76,
    responseRate: '95%',
    verified: true,
    badge: 'Chuyên gia Sự kiện & Hội thảo',
    description: 'Hệ thống hội trường bậc thang, sảnh sự kiện quy mô từ 50 đến 400 khách trang bị âm thanh ánh sáng chuyên nghiệp.',
    status: 'ACTIVE',
    createdAt: now(),
    updatedAt: now()
  },
  {
    _id: 'seller-uel',
    code: 'SELLER-UEL',
    fullName: 'TS. Trịnh Thị Kim Chi',
    brandName: 'Ban Quản trị Cơ sở vật chất UEL Space',
    email: 'bql.csvc@uel.edu.vn',
    phoneNumber: '02837244555',
    role: 'SELLER',
    avatar: '/images/avatars/seller_landmark.svg',
    rating: 4.89,
    reviewsCount: 94,
    responseRate: '97%',
    verified: true,
    badge: 'Đại học Kinh tế - Luật Official',
    description: 'Không gian học thuật, phòng máy tính thực hành chuyên sâu và giảng đường đa năng chất lượng cao phục vụ sinh viên và doanh nghiệp.',
    status: 'ACTIVE',
    createdAt: now(),
    updatedAt: now()
  },
  {
    _id: 'seller-creative',
    code: 'SELLER-CREATIVE',
    fullName: 'Đỗ Thùy Linh',
    brandName: 'Creative Hub Media Studios',
    email: 'media.lab@uelspace.vn',
    phoneNumber: '0988556677',
    role: 'SELLER',
    avatar: '/images/avatars/seller_green.svg',
    rating: 4.97,
    reviewsCount: 63,
    responseRate: '100%',
    verified: true,
    badge: 'Studio Sáng tạo Đạt chuẩn',
    description: 'Tổ hợp phòng quay livestream, studio thu âm podcast và phòng chụp sản phẩm thương mại điện tử chuyên nghiệp.',
    status: 'ACTIVE',
    createdAt: now(),
    updatedAt: now()
  }
];

const MARKETPLACE_SPACES = require('./spaces_100_dataset.json');

async function seedMarketplace() {
  console.log('🚀 Bắt đầu cập nhật Sellers và Spaces Marketplace lên MongoDB Atlas...');
  try {
    const db = await connectToDb();
    const usersCol = db.collection('users');
    const spacesCol = db.collection('spaces');

    // 1. Upsert Sellers
    console.log(`📦 [1/2] Đang cập nhật ${SELLERS.length} tài khoản Seller / Space Host...`);
    for (const seller of SELLERS) {
      await usersCol.updateOne(
        { _id: seller._id },
        { $set: seller },
        { upsert: true }
      );
      console.log(`   -> Seller [${seller.code}]: "${seller.brandName}" (${seller.fullName})`);
    }

    // 2. Map Sellers to Spaces and Upsert
    console.log(`🏛️ [2/2] Đang cập nhật ${MARKETPLACE_SPACES.length} không gian cho thuê liên kết Seller...`);
    const sellerMap = new Map(SELLERS.map(s => [s._id, s]));

    for (const space of MARKETPLACE_SPACES) {
      const seller = sellerMap.get(space.sellerId);
      const spaceDoc = {
        ...space,
        seller: seller ? {
          id: seller._id,
          name: seller.fullName,
          brandName: seller.brandName,
          avatar: seller.avatar,
          rating: seller.rating,
          reviewsCount: seller.reviewsCount,
          verified: seller.verified,
          badge: seller.badge
        } : null,
        operatingHours: { open: '07:00', close: '22:00' },
        policy: {
          autoApprove: true,
          maxDurationMinutes: 480,
          noShowGraceMinutes: 15,
          awayWarningMinutes: 10,
          autoCheckoutMinutes: 20
        },
        deletedAt: null,
        updatedAt: now()
      };

      await spacesCol.updateOne(
        { _id: space._id },
        { $set: spaceDoc },
        { upsert: true }
      );
      console.log(`   -> Space [${space.code}]: "${space.name}" • Host: "${spaceDoc.seller?.brandName}" • Giá: ${space.hourlyPrice.toLocaleString('vi-VN')} đ/h`);
    }

    console.log('✅ THÀNH CÔNG! Đã cập nhật toàn bộ Marketplace Sellers và Spaces lên MongoDB Atlas Cloud.');
  } catch (err) {
    console.error('❌ Lỗi khi cập nhật MongoDB Atlas:', err);
  } finally {
    await closeDb();
  }
}

seedMarketplace();
