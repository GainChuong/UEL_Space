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
    { id: 'chapter-1', index: '01', title: 'Xuất phát điểm' },
    { id: 'chapter-2', index: '02', title: 'Điểm nóng thực tế' },
    { id: 'chapter-3', index: '03', title: 'Lời giải công nghệ' },
    { id: 'chapter-4', index: '04', title: 'Tầm nhìn dữ liệu' }
  ];

  // Photo archives for chapters (ITB Club style interactive photo carousel)
  chapterArchives: { [key: string]: ChapterArchive } = {
    origin: {
      currentIndex: 0,
      photos: [
        {
          src: SERVER_IMAGES_LINK + 'homepage_banner.png',
          tag: 'Khuôn viên UEL',
          caption: 'Khuôn viên Trường Đại học Kinh tế - Luật',
          subcaption: 'Không gian đào tạo hiện đại với hàng chục ngàn lượt sinh viên mỗi ngày'
        },
        {
          src: SERVER_IMAGES_LINK + 'login/carousel_2.jpg',
          tag: 'Giảng đường A & B',
          caption: 'Khu phức hợp phòng học & Hội trường',
          subcaption: 'Nơi diễn ra hàng trăm buổi học và sự kiện phong trào hàng tuần'
        }
      ]
    },
    library: {
      currentIndex: 0,
      photos: [
        {
          src: SERVER_IMAGES_LINK + 'demo_space_card.png',
          tag: 'Thư viện & Khu tự học',
          caption: 'Góc tự học & Thảo luận nhóm sinh viên',
          subcaption: 'Điểm nóng nhu cầu chỗ ngồi cao điểm trong các kỳ thi'
        },
        {
          src: SERVER_IMAGES_LINK + 'login/carousel_1.jpg',
          tag: 'Học tập nhóm',
          caption: 'Sinh viên UEL tìm kiếm không gian yên tĩnh',
          subcaption: 'Nhu cầu biết trước mật độ và chỗ trống trước khi di chuyển đến trường'
        }
      ]
    },
    solution: {
      currentIndex: 0,
      photos: [
        {
          src: SERVER_IMAGES_LINK + 'main_map.png',
          tag: 'Bản đồ số UEL Space',
          caption: 'Sơ đồ định vị thời gian thực',
          subcaption: 'Số hóa vị trí từng phòng học, tòa nhà và chòi tự học'
        },
        {
          src: SERVER_IMAGES_LINK + 'demo_space_card.png',
          tag: 'Kiểm soát Check-in',
          caption: 'Cơ chế giải phóng chỗ thông minh',
          subcaption: 'Tự động hủy đặt phòng nếu quá 15 phút không quét mã QR nhận chỗ'
        }
      ]
    }
  };

  keyPillars = [
    {
      number: '01',
      title: 'Lọc Đa Tiêu Chí',
      desc: 'Tìm phòng theo giờ, sức chứa, thiết bị (máy chiếu, máy lạnh) và mục đích chỉ trong 3 giây.',
      badge: 'Tìm kiếm nhanh'
    },
    {
      number: '02',
      title: 'Check-in & Chống No-show',
      desc: 'Quét QR xác nhận có mặt; tự động hủy giữ chỗ nếu quá 15 phút không đến nhận phòng.',
      badge: 'Chống giữ chỗ ảo'
    },
    {
      number: '03',
      title: 'Bản Đồ Mật Độ Trực Quan',
      desc: 'Xem sơ đồ ghế trống thư viện và phòng học thời gian thực trước khi di chuyển.',
      badge: 'Bản đồ trực tiếp'
    },
    {
      number: '04',
      title: 'Báo Cáo & Quản Trị Dữ Liệu',
      desc: 'Cung cấp số liệu giờ cao điểm, tỷ lệ lấp đầy phòng giúp nhà trường tối ưu vận hành.',
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
