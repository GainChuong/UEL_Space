# UEL SPACE --- Web Design System Specification

## 1. Document Purpose

This document is a design implementation guide for building the UEL
SPACE web interface based strictly on the provided design images and
branding references.

The goal is to help UI/UX designers and frontend developers reproduce:

-   Brand identity
-   Layout structure
-   Visual hierarchy
-   Component placement
-   Interface behavior shown in designs

This document describes only elements visible in the provided
references.

------------------------------------------------------------------------

# 2. Brand Identity

## Product Name

**UEL SPACE**

Tagline:

**Smart Campus Space Management**

Main message shown in interface:

**Find the right space. Use it smarter.**

------------------------------------------------------------------------

# 3. Logo System

## 3.1 Primary Logo

Usage:

-   Main website branding
-   Header logo
-   Marketing sections
-   Brand introduction areas

Structure:

-   Blue geometric building/space icon
-   Orange location pin element
-   Text:
    -   UEL SPACE
    -   Smart Campus Space Management

------------------------------------------------------------------------

## 3.2 Horizontal Logo

Usage:

-   Desktop navigation header
-   Website top bar
-   Wide layout areas

Placement:

-   Left side of header/navigation
-   Aligned vertically with menu items

------------------------------------------------------------------------

## 3.3 Compact Icon Logo

Usage:

-   Small spaces
-   Mobile applications
-   Browser/app icon
-   Avatar-style branding

Contains:

-   Blue space/building symbol
-   Orange location marker

------------------------------------------------------------------------

## 3.4 Reverse Logo

Usage:

-   Dark blue background sections
-   Footer
-   Promotional banners

Logo color:

-   White typography
-   White icon treatment

------------------------------------------------------------------------

# 4. Brand Color System

## Primary Colors

### UEL Blue

Usage:

-   Main navigation
-   Primary buttons
-   Headers
-   Brand elements

### Sky Blue

Usage:

-   Highlight areas
-   Background accents
-   Information states

### UEL Orange

Usage:

-   Call-to-action buttons
-   Location markers
-   Important actions

------------------------------------------------------------------------

## Neutral Colors

### White

Usage:

-   Main background
-   Cards
-   Content surfaces

### Light Background Gray

Usage:

-   Secondary background sections

### Dark Text

Usage:

-   Titles
-   Main information

### Border Gray

Usage:

-   Card borders
-   Dividers

------------------------------------------------------------------------

# 5. Typography (Hệ thống Kiểu chữ UEL)

Theo **Cẩm nang Nhận diện Thương hiệu UEL (Trang 20)**, hệ thống font chữ được quy định chính thức như sau:

## 5.1 Font chữ chính (Main typeface): ROBOTO

**Roboto** là font chữ chính thức được sử dụng xuyên suốt trong hệ thống nhận diện thương hiệu của Trường Đại học Kinh tế - Luật (UEL). 
Font Roboto được ưu tiên sử dụng cho tiêu đề chính và tiêu đề phụ trong các ấn phẩm chính thức của UEL; nội dung hiển thị trên hệ thống in ấn, biển hiệu, bảng chỉ dẫn, backdrop sự kiện, cũng như toàn bộ văn bản và giao diện hệ thống số hóa (Web/App).

### Các biến thể chính:
- **ROBOTO REGULAR (400):** Văn bản nội dung (body text), mô tả, bảng dữ liệu, form nhập liệu.
- **ROBOTO ITALIC (400 Italic):** Chú thích, trích dẫn, trạng thái phụ.
- **ROBOTO BOLD (700):** Tiêu đề mục (section headings), nhãn nút (buttons), điểm nhấn quan trọng.
- **ROBOTO BLACK (900):** Tiêu đề lớn (hero banners, display titles), số liệu thống kê nổi bật.

---

## 5.2 Font chữ tiêu đề gợi ý (Themed Options)

Để tối ưu hiệu ứng thị giác và nổi bật đặc thù cho từng tính chất sự kiện/chuyên mục, có thể sử dụng thêm **01 font phụ** cho tiêu đề chính (Headline) phối cùng Roboto:

| Nhóm chủ đề | Font phụ gợi ý | Đặc điểm / Mục đích sử dụng |
| :--- | :--- | :--- |
| **Học thuật, Truyền thống** | **Lora** | Sang trọng, chuẩn mực, phù hợp cho Lễ khai giảng, Hội nghị lớn, Báo cáo khoa học. |
| **Công nghệ, Chuyển đổi số** | **Share Tech** | Hiện đại, tạo cảm giác số hóa; phù hợp cho Hội thảo khoa học, Fintech, Smart Campus. |
| **Văn hóa, Đoàn thể** | **SVN-Aaron Script / Monte Carlo** | Tinh tế, uyển chuyển; phù hợp cho các sự kiện kỷ niệm, ngày lễ, phong trào. |
| **Sự kiện Sinh viên, Năng động** | **Montserrat** | Trẻ trung, dễ đọc; phù hợp cho các hoạt động của sinh viên, CLB - Đội nhóm, Hackathon. |

---

## 5.3 Nguyên tắc phối hợp (Typography Rules)

- **Quy tắc 2-Font:** Trong một ấn phẩm/giao diện, không sử dụng quá 2 loại font chữ khác nhau để tránh gây rối mắt và phân tán sự chú ý.
- **Khoảng cách dòng (Line spacing):** Giữ khoảng cách dòng từ **1.15 đến 1.3** để văn bản thông thoáng, dễ tiếp nhận trên màn hình LED, thiết bị di động và máy tính để bàn.
- **Lưu ý cốt lõi:** Các font phối hợp chỉ áp dụng cho tiêu đề chính. **Toàn bộ nội dung còn lại phải giữ nguyên font Roboto** để đảm bảo tính nhận diện cốt lõi của UEL.

------------------------------------------------------------------------

# 6. Global Layout Principles

## Design Style

Interface characteristics:

-   Modern campus technology platform
-   Clean white surfaces
-   Rounded cards
-   Blue dominant visual system
-   Orange action highlights
-   Large spacing between sections

------------------------------------------------------------------------

## Border Radius

Use rounded UI components:

-   Cards
-   Buttons
-   Search bars
-   Panels

------------------------------------------------------------------------

# 7. Homepage Design Specification

## 7.1 Header

Position:

Top of page.

Layout:

Left:

-   UEL SPACE logo

Center:

Navigation:

-   Trang chủ
-   Bản đồ
-   Không gian
-   Đặt phòng
-   Về chúng tôi

Right:

-   Notification icon
-   User/profile icon

------------------------------------------------------------------------

# 7.2 Hero Section

Main purpose:

Allow users to quickly search campus spaces.

Layout:

Large banner section.

Left content:

Heading:

"Find the right space. Use it smarter."

Supporting description:

"Khám phá, đặt chỗ và sử dụng không gian trong khuôn viên UEL một cách
thông minh và hiệu quả."

Search area:

Large search box.

Search placeholder:

"Tìm phòng, thư viện, khu vực..."

Filter controls:

-   Date
-   Time
-   Capacity
-   Equipment

Right side:

Campus image/map visual.

------------------------------------------------------------------------

# 7.3 Feature Section

Displayed as horizontal feature cards.

Features:

## Search

Icon: Location pin

Title:

"Tìm kiếm dễ dàng"

Description:

Tra cứu nhanh chóng các phòng trống phù hợp với nhu cầu.

------------------------------------------------------------------------

## Booking

Icon: Calendar

Title:

"Đặt phòng nhanh chóng"

Description:

Chỉ với vài bước đơn giản, đặt chỗ ngay lập tức.

------------------------------------------------------------------------

## Check-in / Check-out

Icon: Check box

Title:

"Check-in / Check-out"

Description:

Quét mã QR để sử dụng phòng và theo dõi thời gian thực.

------------------------------------------------------------------------

## Statistics

Icon: Chart

Title:

"Số liệu thống kê"

Description:

Theo dõi mức độ sử dụng, hỗ trợ quản lý không gian hiệu quả.

------------------------------------------------------------------------

# 8. Campus Map Page

## Main Structure

Three-column layout.

------------------------------------------------------------------------

## Left Panel

Space categories:

-   Tất cả
-   Giảng đường
-   Thư viện
-   Phòng học
-   Phòng họp
-   Khu tự học
-   CLB - Đội nhóm

------------------------------------------------------------------------

## Center Panel

Interactive campus map.

Features shown:

-   Building markers
-   Location pins
-   Zoom controls
-   Map navigation

Status legend:

-   Trống
-   Đang sử dụng
-   Đã đặt
-   Bảo trì
-   Hạn chế

------------------------------------------------------------------------

## Right Panel

Space detail card.

Information displayed:

-   Space image
-   Room name
-   Building
-   Floor
-   Space type
-   Capacity
-   Equipment
-   Status

Booking section:

-   Date
-   Time
-   Number of users
-   Booking button

------------------------------------------------------------------------

# 9. Search Interface Components

Search bar:

-   Large rounded container
-   Search icon
-   Placeholder text

Filter chips:

-   Date
-   Time
-   Capacity
-   Equipment

Search result cards:

Information:

-   Space image
-   Space name
-   Capacity
-   Equipment
-   Availability status

------------------------------------------------------------------------

# 10. Status Design

Visible statuses:

## Available

Meaning:

Có thể sử dụng

Color indication:

Green

------------------------------------------------------------------------

## In use

Meaning:

Đang sử dụng

Color indication:

Blue

------------------------------------------------------------------------

## Reserved

Meaning:

Đã đặt

Color indication:

Orange

------------------------------------------------------------------------

## Maintenance

Meaning:

Bảo trì

Color indication:

Gray

------------------------------------------------------------------------

## Restricted

Meaning:

Hạn chế

Color indication:

Red

------------------------------------------------------------------------

# 11. UI Components

## Buttons

Primary:

-   Blue/orange emphasis
-   Rounded corners

Examples:

-   Đặt phòng
-   Tìm kiếm
-   Gửi

------------------------------------------------------------------------

## Cards

Used for:

-   Space information
-   Reviews
-   Features
-   Statistics

Characteristics:

-   White background
-   Rounded corners
-   Soft separation

------------------------------------------------------------------------

## Icons

Used icon categories:

-   Map
-   Building
-   Room
-   User
-   Calendar
-   Check-in
-   Check-out
-   Equipment
-   Incident
-   Maintenance
-   Statistics
-   Notification

------------------------------------------------------------------------

# 12. Responsive Considerations

Desktop:

-   Full navigation
-   Multi-column map layout
-   Large hero banner

Mobile:

-   Compact logo
-   Collapsed navigation
-   Single-column cards
-   Simplified map/detail interaction

------------------------------------------------------------------------

# 13. Frontend Implementation Structure

Suggested components:

    Layout
    ├── Header
    ├── Navigation
    ├── HeroSection
    ├── SearchBar
    ├── FilterGroup
    ├── FeatureCards
    ├── CampusMap
    ├── SpaceList
    ├── SpaceDetailCard
    ├── BookingButton
    ├── NotificationPanel
    └── Footer

------------------------------------------------------------------------

# 14. Design Consistency Rules

Developers must maintain:

-   Correct logo usage
-   Correct color hierarchy
-   Consistent spacing
-   Rounded UI style
-   Blue as primary brand color
-   Orange as action highlight
-   Clear information hierarchy

No additional visual elements should be introduced without design
approval.
