import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-cctv-lens',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div (touchstart)="onTouchStart($event)"
         (touchmove)="onTouchMove($event)"
         (touchend)="onTouchEnd($event)"
         (dblclick)="toggleCameraFacing()" 
         class="fixed inset-0 w-screen h-screen bg-black overflow-hidden select-none m-0 p-0">
      
      <!-- 100% Thuần Camera không bị che khuất -->
      <video #videoEl autoplay playsinline webkit-playsinline muted 
             class="w-full h-full object-cover transition-transform duration-100 ease-out"
             [style.transform]="!hasHardwareZoom() && currentZoom() > 1 ? 'scale(' + currentZoom() + ')' : 'none'"></video>

      <!-- Trạng thái kết nối tinh gọn chỉ là 1 chấm tròn nhỏ ở góc trên bên phải -->
      <div class="absolute top-4 right-4 z-30 pointer-events-none flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10">
        <span class="w-2 h-2 rounded-full" [ngClass]="isConnected() ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'"></span>
        <span class="text-[11px] font-mono font-bold text-white/90">
          {{ isConnected() ? 'P2P LIVE' : (streamStarted() ? 'SYNCING...' : 'STANDBY') }}
        </span>
      </div>

      <!-- Trạng thái Camera & Độ phóng đại góc trên bên trái -->
      @if (streamStarted()) {
        <div class="absolute top-4 left-4 z-30 pointer-events-none flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white/80 text-[11px] font-mono">
          <span>{{ facingMode() === 'environment' ? 'CAM SAU' : 'CAM TRƯỚC' }}</span>
          <span class="text-white/30">•</span>
          <span class="text-sky-400 font-bold">{{ currentZoom() }}x</span>
        </div>
      }

      <!-- Bộ điều khiển Thu phóng & Lật Camera ở cạnh dưới (Floating Control Bar) -->
      @if (streamStarted()) {
        <div class="absolute bottom-6 inset-x-0 z-30 flex flex-col items-center gap-2 px-4 pointer-events-auto">
          
          <!-- Thanh nút chọn Zoom nhanh -->
          <div class="flex items-center gap-1.5 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 shadow-2xl">
            <!-- Nút 0.5x (Góc siêu rộng nếu phần cứng camera hỗ trợ) -->
            @if (minZoom() <= 0.6) {
              <button (click)="setZoom(minZoom())" 
                      [class.bg-sky-500]="currentZoom() <= 0.6"
                      [class.text-white]="currentZoom() <= 0.6"
                      [class.text-white/70]="currentZoom() > 0.6"
                      class="px-3 py-1.5 rounded-full font-bold text-xs transition-all cursor-pointer">
                0.5x
              </button>
            }

            <!-- Nút 1x Tiêu chuẩn -->
            <button (click)="setZoom(1.0)" 
                    [class.bg-sky-500]="currentZoom() === 1.0"
                    [class.text-white]="currentZoom() === 1.0"
                    [class.text-white/70]="currentZoom() !== 1.0"
                    class="px-3 py-1.5 rounded-full font-bold text-xs transition-all cursor-pointer">
              1x
            </button>

            <!-- Nút 2x Thu phóng -->
            <button (click)="setZoom(2.0)" 
                    [class.bg-sky-500]="currentZoom() === 2.0"
                    [class.text-white]="currentZoom() === 2.0"
                    [class.text-white/70]="currentZoom() !== 2.0"
                    class="px-3 py-1.5 rounded-full font-bold text-xs transition-all cursor-pointer">
              2x
            </button>

            <!-- Nút 3x nếu camera hỗ trợ zoom >= 3 -->
            @if (maxZoom() >= 3.0) {
              <button (click)="setZoom(3.0)" 
                      [class.bg-sky-500]="currentZoom() === 3.0"
                      [class.text-white]="currentZoom() === 3.0"
                      [class.text-white/70]="currentZoom() !== 3.0"
                      class="px-3 py-1.5 rounded-full font-bold text-xs transition-all cursor-pointer">
                3x
              </button>
            }

            <div class="w-px h-4 bg-white/20 mx-1"></div>

            <!-- Nút Đổi Cam trước / sau -->
            <button (click)="toggleCameraFacing()" 
                    class="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-semibold cursor-pointer transition-all">
              Đổi Cam
            </button>
          </div>

          <p class="text-[10px] text-white/50 tracking-wide">Chụm 2 ngón tay để zoom • Chạm 2 lần để lật camera</p>
        </div>
      }

      <!-- Màn hình khởi động 1 chạm: Người dùng chạm vào để cấp quyền Camera & Khởi tạo luồng tránh màn hình đen -->
      @if (!streamStarted()) {
        <div class="absolute inset-0 z-40 bg-black flex flex-col items-center justify-center p-6 text-center text-white space-y-5">
          <div class="w-20 h-20 rounded-3xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400 shadow-xl shadow-sky-500/20 animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
          </div>
          <div class="space-y-1">
            <h2 class="text-xl font-black tracking-tight">KẾT NỐI CAMERA AI</h2>
            <p class="text-xs text-slate-400 max-w-xs">Chạm nút dưới đây để cấp quyền camera và đồng bộ luồng video sang máy tính</p>
          </div>
          <button (click)="startCameraWithSafeDelay()" class="px-8 py-4 rounded-2xl bg-sky-500 hover:bg-sky-600 active:scale-95 text-white font-black text-sm tracking-wide shadow-lg shadow-sky-500/40 cursor-pointer transition-all">
            CHẠM ĐỂ BẬT CAMERA
          </button>
          <p class="text-[11px] text-white/40">Chạm 2 lần vào màn hình sau khi bật để đổi Cam trước / sau</p>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      margin: 0;
      padding: 0;
      background: #000;
    }
  `]
})
export class CctvLensComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);

  streamStarted = signal<boolean>(false);
  isConnected = signal<boolean>(false);
  facingMode = signal<'environment' | 'user'>('environment');

  // Zoom signals
  currentZoom = signal<number>(1.0);
  minZoom = signal<number>(1.0);
  maxZoom = signal<number>(5.0);
  hasHardwareZoom = signal<boolean>(false);

  private targetPeerId: string = '';
  private peer: any = null;
  private currentCall: any = null;
  private localStream: MediaStream | null = null;

  // Touch gesture pinch-to-zoom tracking
  private initialTouchDistance: number = 0;
  private initialZoomLevel: number = 1.0;

  ngOnInit(): void {
    this.targetPeerId = this.route.snapshot.queryParamMap.get('peerId') || this.route.snapshot.queryParamMap.get('room') || 'uel-room-main';
    this.startCameraWithSafeDelay();
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  async startCameraWithSafeDelay(): Promise<void> {
    try {
      if (this.localStream) {
        this.localStream.getTracks().forEach(t => t.stop());
      }

      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: this.facingMode() },
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30 }
        },
        audio: false
      });

      const track = this.localStream.getVideoTracks()[0];
      if (track) {
        this.checkAndSetupZoom(track);
      }

      const video = document.querySelector('video') as HTMLVideoElement;
      if (video) {
        video.muted = true;
        video.setAttribute('playsinline', 'true');
        video.setAttribute('webkit-playsinline', 'true');
        video.srcObject = this.localStream;
        await video.play().catch(() => {});
      }

      this.streamStarted.set(true);

      // Delay an toàn 1.5s để cảm biến camera điện thoại khởi động hoàn tất và ổn định khung hình sáng
      setTimeout(async () => {
        await this.initPeerAndCall();
      }, 1500);
    } catch (err) {
      console.warn('Cần chạm vào nút để cấp quyền camera:', err);
      this.streamStarted.set(false);
    }
  }

  private checkAndSetupZoom(track: MediaStreamTrack): void {
    try {
      const caps: any = (track as any).getCapabilities ? (track as any).getCapabilities() : {};
      if (caps && 'zoom' in caps) {
        this.hasHardwareZoom.set(true);
        this.minZoom.set(caps.zoom.min || 1.0);
        this.maxZoom.set(caps.zoom.max || 5.0);
        console.log(`[CCTV Lens] Hardware zoom available: [${caps.zoom.min}x - ${caps.zoom.max}x]`);
      } else {
        this.hasHardwareZoom.set(false);
        this.minZoom.set(1.0);
        this.maxZoom.set(4.0);
      }
    } catch {
      this.hasHardwareZoom.set(false);
    }
  }

  async setZoom(targetZoom: number): Promise<void> {
    const clamped = Math.round(Math.max(this.minZoom(), Math.min(this.maxZoom(), targetZoom)) * 10) / 10;
    this.currentZoom.set(clamped);

    const track = this.localStream?.getVideoTracks()[0];
    if (track && this.hasHardwareZoom()) {
      try {
        await (track as any).applyConstraints({
          advanced: [{ zoom: clamped } as any]
        });
        console.log(`[CCTV Lens] Applied hardware zoom: ${clamped}x`);
      } catch (err) {
        console.warn('Failed to apply hardware zoom:', err);
      }
    }
  }

  onTouchStart(e: TouchEvent): void {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      this.initialTouchDistance = Math.hypot(dx, dy);
      this.initialZoomLevel = this.currentZoom();
    }
  }

  onTouchMove(e: TouchEvent): void {
    if (e.touches.length === 2 && this.initialTouchDistance > 0) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const factor = dist / this.initialTouchDistance;
      const targetZoom = Math.round(this.initialZoomLevel * factor * 10) / 10;
      if (Math.abs(targetZoom - this.currentZoom()) >= 0.1) {
        this.setZoom(targetZoom);
      }
    }
  }

  onTouchEnd(e: TouchEvent): void {
    if (e.touches.length < 2) {
      this.initialTouchDistance = 0;
    }
  }

  private async initPeerAndCall(): Promise<void> {
    try {
      const { Peer } = await import('peerjs');
      if (this.peer) {
        try { this.peer.destroy(); } catch {}
      }

      this.peer = new Peer();

      this.peer.on('open', () => {
        this.callDashboard();
      });

      this.peer.on('error', (err: any) => {
        console.warn('Peer error on mobile:', err);
        setTimeout(() => this.callDashboard(), 2000);
      });
    } catch (e) {
      console.error('Lỗi nạp thư viện PeerJS:', e);
    }
  }

  private callDashboard(): void {
    if (!this.peer || !this.localStream || !this.targetPeerId) return;

    try {
      const call = this.peer.call(this.targetPeerId, this.localStream);
      if (call) {
        this.currentCall = call;
        call.on('close', () => {
          this.isConnected.set(false);
          setTimeout(() => this.callDashboard(), 2000);
        });
        this.isConnected.set(true);
      }
    } catch (e) {
      console.warn('Lỗi gọi P2P tới Dashboard:', e);
    }
  }

  async toggleCameraFacing(): Promise<void> {
    this.facingMode.set(this.facingMode() === 'environment' ? 'user' : 'environment');
    this.currentZoom.set(1.0);
    await this.startCameraWithSafeDelay();
  }

  private cleanup(): void {
    if (this.currentCall) {
      try { this.currentCall.close(); } catch {}
    }
    if (this.peer) {
      try { this.peer.destroy(); } catch {}
    }
    if (this.localStream) {
      this.localStream.getTracks().forEach(t => t.stop());
      this.localStream = null;
    }
    this.isConnected.set(false);
    this.streamStarted.set(false);
  }
}
