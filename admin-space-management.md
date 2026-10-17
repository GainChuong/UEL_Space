# Kế Hoạch Hoàn Thiện Quản Lý Không Gian & Phê Duyệt Tại Admin

## Goal
Hoàn thiện toàn bộ các chức năng Thêm (Create), Sửa (Update), Xóa (Delete) và Duyệt (Approve/Reject) cả Không Gian và Đơn Đặt Chỗ tại trang Admin, đồng bộ 100% dữ liệu thực từ MongoDB Atlas.

## Tasks
- [ ] Task 1: Nâng cấp Backend Middleware & Routes (hỗ trợ xác thực linh hoạt cho Admin, thêm status `PENDING_APPROVAL` / `APPROVED` / `REJECTED` cho Space Listing và endpoint duyệt space) → Verify: `curl` test các route CRUD spaces và bookings trả về 200/201.
- [ ] Task 2: Xây dựng Admin Space Service trên Frontend (gọi API `/api/spaces` và `/api/bookings` lấy danh sách thực tế từ MongoDB Atlas) → Verify: `admin.ts` nạp đủ 100+ spaces thực từ DB khi mở tab spaces.
- [ ] Task 3: Phát triển Modal Thêm / Sửa Không Gian Đầy Đủ (Form nhập Tên, Mã, Tòa nhà, Tầng, Loại phòng, Sức chứa, Giá giờ/ngày, Danh sách tiện ích, Chính sách thời gian vắng mặt) → Verify: Tạo không gian mới thành công, hiển thị ngay trên danh sách và lưu vào MongoDB.
- [ ] Task 4: Phát triển Modal Xác Nhận Xóa Không Gian (Soft Delete an toàn với ghi nhận Audit Log) → Verify: Bấm xóa không gian, popup xác nhận mở ra, xác nhận xóa xong không gian biến mất khỏi UI và được đánh dấu `deletedAt` trong DB.
- [ ] Task 5: Phát triển Tính Năng Duyệt Không Gian (Phê duyệt niêm yết Listing Approval & Bộ lọc trạng thái: Tất cả, Đang mở thuê, Chờ duyệt, Bảo trì) → Verify: Admin có thể duyệt không gian chờ duyệt sang hoạt động chỉ với 1 click.
- [ ] Task 6: Hoàn thiện Duyệt Đơn Thuê Phòng (Booking Approvals) đồng bộ MongoDB (gọi API approve/reject với ghi nhận lý do và cập nhật trạng thái đơn đặt chỗ) → Verify: Phê duyệt/từ chối booking cập nhật trạng thái trong MongoDB Atlas.
- [ ] Task 7: Kiểm thử Toàn Diện & Build Frontend (Kiểm tra build Angular không có lỗi lint/template, test giao diện browser) → Verify: `npm run build` thành công, kiểm tra trực quan trên trình duyệt.

## Done When
- [ ] Admin tab Spaces nạp và hiển thị toàn bộ không gian từ MongoDB Atlas.
- [ ] Chức năng Thêm không gian mới hoạt động hoàn chỉnh, lưu trực tiếp vào database.
- [ ] Chức năng Sửa và Xóa không gian hoạt động với modal xác nhận và đồng bộ DB.
- [ ] Chức năng Duyệt không gian (Listing Approval) và Duyệt đơn đặt phòng (Booking Approval) gọi API thực tế.
- [ ] Giao diện trực quan, sang trọng, tuân thủ UEL Brand Guidelines.
