import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SERVER_IMAGES_LINK } from '../../services/api-config';
import { TranslatePipe } from '../../services/translate.pipe';

export interface PhotoItem {
  src: string;
  tag: string;
  caption: string;
  subcaption?: string;
}

export interface ChapterArchive {
  currentIndex: number;
  photos: PhotoItem[];
}

export interface ChapterNavItem {
  id: string;
  index: string;
  title: string;
}

@Component({
  imports: [CommonModule, RouterModule, TranslatePipe],
  selector: 'app-about',
  templateUrl: './about.html',
  styleUrl: './about.scss'
})
export class About {
  server_images_link = SERVER_IMAGES_LINK;

  // Scroll storytelling progress (ITB Club inspiration)
  scrollProgress = 0;
  activeChapter = 'chapter-1';

  chapters: ChapterNavItem[] = [
    { id: 'chapter-1', index: '01', title: 'Nghịch lý lãng phí' },
    { id: 'chapter-2', index: '02', title: 'Mô hình Marketplace' },
    { id: 'chapter-3', index: '03', title: 'AI Occupancy' }
  ];

  // Photo archives for chapters (Interactive photo carousel)
  chapterArchives: { [key: string]: ChapterArchive } = {
    origin: {
      currentIndex: 0,
      photos: [
        {
          src: SERVER_IMAGES_LINK + 'about/empty_office_paradox.jpg',
          tag: 'Nghịch lý công suất',
          caption: 'Hàng ngàn m² văn phòng bỏ trống ngoài giờ',
          subcaption: 'Nhiều doanh nghiệp chỉ sử dụng 40-60% công suất phòng họp, trong khi startup thiếu không gian linh hoạt'
        },
        {
          src: SERVER_IMAGES_LINK + 'about/startup_coworking_demand.jpg',
          tag: 'Nhu cầu thuê ngắn hạn',
          caption: 'Cá nhân & Startup cần nơi làm việc theo giờ',
          subcaption: 'Nhu cầu hội họp đối tác, workshop chuyên nghiệp với chi phí linh hoạt và tiện nghi đầy đủ'
        }
      ]
    },
    library: {
      currentIndex: 0,
      photos: [
        {
          src: SERVER_IMAGES_LINK + 'about/b2b_marketplace_connection.jpg',
          tag: 'Sàn chia sẻ B2B',
          caption: 'Kết nối Chủ sở hữu & Khách thuê tức thì',
          subcaption: 'Hỗ trợ chủ không gian quản lý phòng, niêm yết giá thuê, quản lý lịch đặt và tăng trưởng doanh thu'
        },
        {
          src: SERVER_IMAGES_LINK + 'about/digital_booking_checkout.jpg',
          tag: 'Trải nghiệm số hóa',
          caption: 'Tìm kiếm, đặt chỗ & thanh toán trực tuyến',
          subcaption: 'Tích hợp thanh toán MoMo Sandbox và xuất file đồng bộ Google Calendar chỉ với 1 click'
        }
      ]
    },
    solution: {
      currentIndex: 0,
      photos: [
        {
          src: SERVER_IMAGES_LINK + 'about/ai_occupancy_cctv_vision.jpg',
          tag: 'AI Occupancy Detection',
          caption: 'Thị giác máy tính giám sát hiện diện thực tế',
          subcaption: 'Ước tính số người có mặt, đối chiếu với số lượng đăng ký để phát hiện vượt tải và cảnh báo quá giờ'
        },
        {
          src: SERVER_IMAGES_LINK + 'about/smart_room_early_release.jpg',
          tag: 'Giải phóng phòng sớm',
          caption: 'Tự động mở lại slot trống khi khách về sớm',
          subcaption: 'Khi AI nhận diện khách rời phòng sớm, hệ thống xác nhận checkout và mở khung giờ cho khách tiếp theo'
        }
      ]
    }
  };

  keyPillars = [
    {
      number: '01',
      title: 'Sàn Marketplace Đa Dạng',
      desc: 'Tìm kiếm & đặt phòng họp VIP, văn phòng riêng, hot desk theo giờ hoặc ngày chỉ trong vài giây.',
      badge: 'Đặt chỗ tức thì'
    },
    {
      number: '02',
      title: 'AI Occupancy Detection',
      desc: 'Thị giác máy tính giám sát số người thực tế, đối chiếu hợp đồng, phát hiện vượt tải và cảnh báo quá giờ.',
      badge: 'Công nghệ AI độc quyền'
    },
    {
      number: '03',
      title: 'Giải Phóng Slot Trống Sớm',
      desc: 'AI phát hiện khách rời phòng sớm, tự động hoàn tất check-out và mở lại khung giờ cho khách hàng mới.',
      badge: 'Tối ưu công suất'
    },
    {
      number: '04',
      title: 'Đồng Bộ Lịch & Doanh Thu',
      desc: 'Tích hợp Google Calendar 1-click, quản lý doanh thu minh bạch và báo cáo hiệu suất khai thác cho chủ không gian.',
      badge: 'Quản trị thông minh'
    }
  ];

  // Interactive photo controls
  nextPhoto(chapterKey: string) {
    const archive = this.chapterArchives[chapterKey];
    if (archive) {
      archive.currentIndex = (archive.currentIndex + 1) % archive.photos.length;
    }
  }

  prevPhoto(chapterKey: string) {
    const archive = this.chapterArchives[chapterKey];
    if (archive) {
      archive.currentIndex = (archive.currentIndex - 1 + archive.photos.length) % archive.photos.length;
    }
  }

  getCurrentPhoto(chapterKey: string): PhotoItem {
    const archive = this.chapterArchives[chapterKey];
    return archive.photos[archive.currentIndex];
  }

  setPhotoIndex(chapterKey: string, index: number) {
    const archive = this.chapterArchives[chapterKey];
    if (archive && index >= 0 && index < archive.photos.length) {
      archive.currentIndex = index;
    }
  }

  @HostListener('window:scroll')
  onWindowScroll() {
    if (typeof window === 'undefined') return;

    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    this.scrollProgress = docHeight > 0 ? Math.min(100, Math.max(0, (scrollTop / docHeight) * 100)) : 0;

    // Detect active chapter based on scroll position
    for (const chapter of this.chapters) {
      const el = document.getElementById(chapter.id);
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.top <= window.innerHeight * 0.45 && rect.bottom >= window.innerHeight * 0.2) {
          this.activeChapter = chapter.id;
        }
      }
    }
  }

  scrollToChapter(chapterId: string) {
    if (typeof document === 'undefined') return;
    const el = document.getElementById(chapterId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      this.activeChapter = chapterId;
    }
  }
}
