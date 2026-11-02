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
          {{ isConnected() ? 'P2P LIVE' : 'CONNECTING' }}
        </span>
      </div>

      <!-- Màn hình khởi động 1 chạm nếu trình duyệt mobile chặn autoplay -->
      @if (!streamStarted()) {
        <div class="absolute inset-0 z-40 bg-black flex flex-col items-center justify-center p-6 text-center text-white space-y-4">
          <div class="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-white animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
          </div>
          <button (click)="startCameraAndCall()" class="px-8 py-3.5 rounded-2xl bg-sky-500 active:scale-95 text-white font-black text-sm tracking-wide shadow-lg shadow-sky-500/40">
            CHẠM ĐỂ BẬT CAMERA
          </button>
          <p class="text-[11px] text-white/50">Chạm 2 lần bất kỳ đâu để đổi camera trước / sau</p>
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
    this.startCameraAndCall();
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  async startCameraAndCall(): Promise<void> {
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
        video.srcObject = this.localStream;
        await video.play().catch(() => {});
      }

      this.streamStarted.set(true);
      await this.initPeerAndCall();
    } catch (err) {
      console.error('Không thể mở camera:', err);
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
    await this.startCameraAndCall();
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
