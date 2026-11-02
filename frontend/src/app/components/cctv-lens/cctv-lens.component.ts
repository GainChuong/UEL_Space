import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { SERVER_BASE_URL } from '../../services/api-config';

@Component({
  selector: 'app-cctv-lens',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="relative w-screen h-screen bg-black overflow-hidden flex flex-col justify-between select-none">
      <!-- Top Bar: Status & Node Info -->
      <div class="z-20 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 to-transparent">
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded-full" [ngClass]="isStreaming() ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'"></div>
          <span class="text-white text-xs font-bold uppercase tracking-wider">
            {{ isStreaming() ? 'LIVE CCTV STREAMING' : 'CAMERA STANDBY' }}
          </span>
          <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white/20 text-white">
            {{ streamId() }}
          </span>
        </div>

        <div class="flex items-center gap-2">
          <span class="text-[11px] font-mono text-emerald-400 font-semibold">
            {{ fps() }} FPS
          </span>
          <button (click)="toggleCameraFacing()" class="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs active:scale-95 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
              <path d="M16 21h5v-5"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Main Video Feed -->
      <div class="absolute inset-0 z-0 flex items-center justify-center">
        <video #videoEl autoplay playsinline webkit-playsinline muted class="w-full h-full object-cover"></video>
        <canvas #canvasEl class="hidden"></canvas>

        @if (!cameraReady()) {
          <div class="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center text-white z-10 space-y-4">
            <div class="w-16 h-16 rounded-2xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
            </div>
            <h2 class="text-lg font-black tracking-tight">KẾT NỐI CAMERA DI ĐỘNG</h2>
            <p class="text-xs text-slate-300 max-w-xs leading-relaxed">
              Điện thoại của bạn sẽ đóng vai trò như một mắt camera quan sát IoT gửi hình ảnh về Dashboard máy tính để AI YOLO phân tích.
            </p>
            <button (click)="initCamera()" class="px-6 py-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-sm shadow-lg shadow-sky-500/30 active:scale-95 transition-all">
              Bắt đầu Phát Luồng
            </button>
          </div>
        }
      </div>

      <!-- Bottom Overlay: Metrics & Guide -->
      <div class="z-20 px-4 py-4 bg-gradient-to-t from-black/85 via-black/40 to-transparent flex flex-col gap-2">
        <div class="flex items-center justify-between text-xs text-white/80">
          <span>Độ phân giải: <strong>640 × 480 (IoT Optimized)</strong></span>
          <span>Dung lượng: <strong>~25KB / frame</strong></span>
        </div>
        <div class="p-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 text-white text-[11px] leading-relaxed flex items-center gap-2">
          <svg class="w-4 h-4 text-emerald-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 14 14"/></svg>
          <span>Đặt điện thoại ở góc cao hoặc trên giá đỡ hướng vào phòng để đếm sĩ số chuẩn nhất.</span>
        </div>
      </div>
    </div>
  `
})
export class CctvLensComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);

  streamId = signal<string>('default');
  isStreaming = signal<boolean>(false);
  cameraReady = signal<boolean>(false);
  fps = signal<number>(0);
  facingMode = signal<'user' | 'environment'>('environment');

  private stream: MediaStream | null = null;
  private intervalId: any = null;
  private frameCount = 0;
  private fpsTimer: any = null;

  ngOnInit(): void {
    const id = this.route.snapshot.queryParamMap.get('streamId') || this.route.snapshot.queryParamMap.get('room') || 'default';
    this.streamId.set(id);
    this.initCamera();
  }

  ngOnDestroy(): void {
    this.stopStreaming();
  }

  async initCamera(): Promise<void> {
    try {
      if (this.stream) {
        this.stream.getTracks().forEach(t => t.stop());
      }

      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: this.facingMode() },
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      });

      const video = document.querySelector('video') as HTMLVideoElement;
      if (video) {
        video.srcObject = this.stream;
        await video.play().catch(() => {});
      }

      this.cameraReady.set(true);
      this.startStreaming();
    } catch (err) {
      console.error('Không thể truy cập camera điện thoại:', err);
      alert('Không thể mở camera. Vui lòng cấp quyền truy cập Camera trong cài đặt trình duyệt.');
    }
  }

  async toggleCameraFacing(): Promise<void> {
    this.facingMode.set(this.facingMode() === 'environment' ? 'user' : 'environment');
    await this.initCamera();
  }

  startStreaming(): void {
    if (this.intervalId) clearInterval(this.intervalId);
    this.isStreaming.set(true);

    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');

    // Cứ mỗi 650ms (~1.5 FPS) gửi 1 frame nhẹ lên Server Relay
    this.intervalId = setInterval(async () => {
      const video = document.querySelector('video') as HTMLVideoElement;
      if (!video || !video.videoWidth || !ctx) return;

      canvas.width = 640;
      canvas.height = Math.round((640 / video.videoWidth) * video.videoHeight);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const base64 = canvas.toDataURL('image/jpeg', 0.65);
      this.frameCount++;

      try {
        await fetch(`${SERVER_BASE_URL}/api/occupancy/cctv-stream`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            streamId: this.streamId(),
            image: base64,
            device: 'Mobile Phone Lens',
            facing: this.facingMode()
          })
        });
      } catch (e) {
        console.warn('Gửi frame CCTV lỗi:', e);
      }
    }, 650);

    // Tính FPS thực tế
    this.fpsTimer = setInterval(() => {
      this.fps.set(this.frameCount);
      this.frameCount = 0;
    }, 1000);
  }

  stopStreaming(): void {
    this.isStreaming.set(false);
    if (this.intervalId) clearInterval(this.intervalId);
    if (this.fpsTimer) clearInterval(this.fpsTimer);
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
  }
}
