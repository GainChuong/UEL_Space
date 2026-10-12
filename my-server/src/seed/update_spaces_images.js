const { connectToDb, closeDb } = require('../config/db');

const SPACE_IMAGE_MAPPING = {
  'a2-1': 'spaces/space_a2_1_meeting_vip.jpg',
  'b1-104': 'spaces/space_b1_104_lecture_hall.jpg',
  'thu-vien-2': 'spaces/space_thu_vien_coworking.jpg',
  'a3-301': 'spaces/space_a3_301_event_hall.jpg',
  'b2-101': 'spaces/space_b2_101_private_office.jpg',
  'choi-1': 'spaces/space_choi_1_focus_pod.jpg',
  'b1-lab202': 'spaces/space_b1_lab202_computer_lab.jpg',
  'a-hoi-truong': 'spaces/space_a_hoi_truong_grand.jpg',
  'choi-2': 'spaces/space_choi_2_solo_pod.jpg',
  'a-105': 'spaces/space_a_105_creative_media.jpg'
};

async function updateSpacesImages() {
  console.log('🔄 Đang kết nối tới MongoDB Atlas để cập nhật hình ảnh spaces...');
  try {
    const db = await connectToDb();
    const spacesCol = db.collection('spaces');
    
    const spaces = await spacesCol.find({}).toArray();
    console.log(`Tìm thấy ${spaces.length} spaces trong cơ sở dữ liệu MongoDB Atlas.`);

    let updatedCount = 0;
    for (const s of spaces) {
      let newImage = SPACE_IMAGE_MAPPING[s._id] || SPACE_IMAGE_MAPPING[s.code?.toLowerCase()];
      if (!newImage) {
        // Dự phòng theo spaceType hoặc category
        const st = (s.spaceType || s.categoryName || '').toLowerCase();
        if (st.includes('họp') || st.includes('meeting')) {
          newImage = 'spaces/space_a2_1_meeting_vip.jpg';
        } else if (st.includes('tự học') || st.includes('coworking')) {
          newImage = 'spaces/space_thu_vien_coworking.jpg';
        } else if (st.includes('văn phòng') || st.includes('office')) {
          newImage = 'spaces/space_b2_101_private_office.jpg';
        } else if (st.includes('hội trường') || st.includes('auditorium')) {
          newImage = 'spaces/space_a_hoi_truong_grand.jpg';
        } else {
          newImage = 'spaces/space_b1_104_lecture_hall.jpg';
        }
      }

      await spacesCol.updateOne(
        { _id: s._id },
        { $set: { image: newImage, updatedAt: new Date().toISOString() } }
      );
      console.log(`  -> Đã cập nhật space [${s.code || s._id}] "${s.name}": image = "${newImage}"`);
      updatedCount++;
    }

    console.log(`✅ Hoàn tất! Đã cập nhật thành công ${updatedCount} spaces trên MongoDB Atlas Cloud.`);
  } catch (err) {
    console.error('❌ Lỗi cập nhật spaces:', err);
  } finally {
    await closeDb();
  }
}

updateSpacesImages();
