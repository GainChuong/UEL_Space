import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-cctv-lens',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div (dblclick)="toggleCameraFacing()" class="fixed inset-0 w-screen h-screen bg-black overflow-hidden select-none m-0 p-0 touch-none">
      <!-- 100% Thuần Camera không có bất kỳ UI nào che khuất -->
      <video #videoEl autoplay playsinline webkit-playsinline muted class="w-full h-full object-cover"></video>

      <!-- Trạng thái kết nối tinh gọn chỉ là 1 chấm tròn nhỏ ở góc trên -->
      <div class="absolute top-3 right-3 z-30 pointer-events-none flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md">
        <span class="w-2 h-2 rounded-full" [ngClass]="isConnected() ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'"></span>
        <span class="text-[10px] font-mono font-bold text-white/90">
          {{ isConnected() ? 'P2P LIVE' : (streamStarted() ? 'SYNCING...' : 'STANDBY') }}
        </span>
      </div>

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

  private targetPeerId: string = '';
  private peer: any = null;
  private currentCall: any = null;
  private localStream: MediaStream | null = null;

  ngOnInit(): void {
    this.targetPeerId = this.route.snapshot.queryParamMap.get('peerId') || this.route.snapshot.queryParamMap.get('room') || 'uel-room-main';
    // Thử auto-start nếu trình duyệt cho phép, nếu bị chặn thì màn hình chạm sẽ xuất hiện
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
        // Tự động kết nối lại sau 2 giây nếu mất tín hiệu
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
