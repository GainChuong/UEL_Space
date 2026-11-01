import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { ChatbotService, ChatMessage, ChatbotSpace, ChatSessionSummary } from '../../../services/chatbot.service';
import { GoogleCalendarService } from '../../../services/google-calendar.service';
import { SERVER_BASE_URL } from '../../../services/api-config';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.html',
  styleUrl: './chatbot.scss'
})
export class ChatbotComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('chatScrollContainer') private scrollContainer?: ElementRef;

  isOpen = false;
  isThinking = false;
  messages: ChatMessage[] = [];
  userInput = '';

  // Chế độ xem: 'chat' (đang trò chuyện) hoặc 'history' (danh sách lịch sử các cuộc hội thoại)
  viewMode: 'chat' | 'history' = 'chat';
  sessionsList: ChatSessionSummary[] = [];
  isLoadingSessions = false;

  // Modal xác nhận đặt nhanh MoMo / Tiền mặt
  quickBookModal: {
    isOpen: boolean;
    space: ChatbotSpace | null;
    hours: number;
    totalAmount: number;
    bookingCode: string;
    isProcessing: boolean;
    isSuccess: boolean;
    momoQrUrl: string;
    googleCalendarUrl: string;
    showQr: boolean;
  } = {
    isOpen: false,
    space: null,
    hours: 2,
    totalAmount: 0,
    bookingCode: '',
    isProcessing: false,
    isSuccess: false,
    momoQrUrl: '',
    googleCalendarUrl: '',
    showQr: false
  };

  currentModel = 'gemini-2.5-flash';
  currentSource: 'gemini' | 'learned_cache' | 'local_fallback' = 'gemini';

  // =========================================================================
  // DRAGGABLE FAB (KÉO THẢ TỰ DO, BẮT DÍNH VÀ GIỚI HẠN TRONG VIEWPORT)
  // =========================================================================
  fabX = 0;
  fabY = 0;
  isDragging = false;
  private isPointerDown = false;
  private hasDragged = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private initialFabX = 0;
  private initialFabY = 0;
  private snappedEdge: 'left' | 'right' = 'right';

  readonly FAB_SIZE = 56;
  readonly MARGIN = 20;
  readonly STORAGE_KEY = 'uel_space_chatbot_fab_pos';

  get isNearLeftEdge(): boolean {
    if (typeof window === 'undefined') return false;
    return (this.fabX + this.FAB_SIZE / 2) < (window.innerWidth / 2);
  }

  get isTooltipBelow(): boolean {
    return this.fabY < 80;
  }

  private subIsOpen?: Subscription;
  private subMessages?: Subscription;
  private subThinking?: Subscription;
  private subModel?: Subscription;
  private subSource?: Subscription;
  private shouldScrollBottom = false;

  constructor(
    public chatbotService: ChatbotService,
    private googleCalendarService: GoogleCalendarService,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initFabPosition();
    this.subIsOpen = this.chatbotService.isOpen$.subscribe(open => {
      this.isOpen = open;
      if (open) {
        this.shouldScrollBottom = true;
      }
    });

    this.subMessages = this.chatbotService.messages$.subscribe(msgs => {
      this.messages = msgs;
      this.shouldScrollBottom = true;
      this.cdr.markForCheck();
    });

    this.subThinking = this.chatbotService.isThinking$.subscribe(thinking => {
      this.isThinking = thinking;
      if (thinking) {
        this.shouldScrollBottom = true;
      }
      this.cdr.markForCheck();
    });

    this.subModel = this.chatbotService.currentModel$.subscribe(m => {
      this.currentModel = m;
      this.cdr.markForCheck();
    });

    this.subSource = this.chatbotService.currentSource$.subscribe(s => {
      this.currentSource = s;
      this.cdr.markForCheck();
    });
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollBottom) {
      this.scrollToBottom();
      this.shouldScrollBottom = false;
    }
  }

  ngOnDestroy(): void {
    this.subIsOpen?.unsubscribe();
    this.subMessages?.unsubscribe();
    this.subThinking?.unsubscribe();
    this.subModel?.unsubscribe();
    this.subSource?.unsubscribe();
  }

  onFabPointerDown(event: PointerEvent): void {
    if (event.button !== 0) return; // Chỉ nhận click chuột trái hoặc touch
    this.isPointerDown = true;
    this.hasDragged = false;
    this.isDragging = false;
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;
    this.initialFabX = this.fabX;
    this.initialFabY = this.fabY;
  }

  @HostListener('window:pointermove', ['$event'])
  onWindowPointerMove(event: PointerEvent): void {
    if (!this.isPointerDown) return;

    const deltaX = event.clientX - this.dragStartX;
    const deltaY = event.clientY - this.dragStartY;

    if (!this.hasDragged && Math.hypot(deltaX, deltaY) > 5) {
      this.hasDragged = true;
      this.isDragging = true;
    }

    if (this.isDragging) {
      event.preventDefault();
      const rawX = this.initialFabX + deltaX;
      const rawY = this.initialFabY + deltaY;
      this.fabX = this.clampX(rawX);
      this.fabY = this.clampY(rawY);
      this.cdr.markForCheck();
    }
  }

  @HostListener('window:pointerup', ['$event'])
  @HostListener('window:pointercancel', ['$event'])
  onWindowPointerUp(_event: PointerEvent): void {
    if (!this.isPointerDown) return;
    this.isPointerDown = false;

    if (this.isDragging) {
      this.isDragging = false;
      this.snapToClosestEdge();
      this.saveFabPosition();
      this.cdr.markForCheck();
      setTimeout(() => {
        this.hasDragged = false;
      }, 120);
    } else {
      this.hasDragged = false;
    }
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    if (typeof window === 'undefined') return;
    if (this.snappedEdge === 'left') {
      this.fabX = this.MARGIN;
    } else {
      this.fabX = Math.max(this.MARGIN, window.innerWidth - this.FAB_SIZE - this.MARGIN);
    }
    this.fabY = this.clampY(this.fabY);
    this.saveFabPosition();
    this.cdr.markForCheck();
  }

  onFabClick(event: MouseEvent): void {
    if (this.hasDragged) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    this.toggleChat();
  }

  private initFabPosition(): void {
    if (typeof window === 'undefined') return;

    const defaultX = Math.max(this.MARGIN, window.innerWidth - this.FAB_SIZE - 24);
    const defaultY = Math.max(this.MARGIN, window.innerHeight - this.FAB_SIZE - 24);

    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed?.x === 'number' && typeof parsed?.y === 'number') {
          this.snappedEdge = parsed.snappedEdge === 'left' ? 'left' : 'right';
          if (this.snappedEdge === 'left') {
            this.fabX = this.MARGIN;
          } else {
            this.fabX = Math.max(this.MARGIN, window.innerWidth - this.FAB_SIZE - this.MARGIN);
          }
          this.fabY = this.clampY(parsed.y);
          return;
        }
      }
    } catch {
      // Bỏ qua lỗi truy cập localStorage
    }

    this.snappedEdge = 'right';
    this.fabX = defaultX;
    this.fabY = defaultY;
  }

  private saveFabPosition(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
          x: this.fabX,
          y: this.fabY,
          snappedEdge: this.snappedEdge
        }));
      }
    } catch {
      // Bỏ qua lỗi lưu localStorage
    }
  }

  private clampX(x: number): number {
    if (typeof window === 'undefined') return x;
    const minX = this.MARGIN;
    const maxX = Math.max(minX, window.innerWidth - this.FAB_SIZE - this.MARGIN);
    return Math.min(Math.max(x, minX), maxX);
  }

  private clampY(y: number): number {
    if (typeof window === 'undefined') return y;
    const minY = this.MARGIN;
    const maxY = Math.max(minY, window.innerHeight - this.FAB_SIZE - this.MARGIN);
    return Math.min(Math.max(y, minY), maxY);
  }

  private snapToClosestEdge(): void {
    if (typeof window === 'undefined') return;
    const middleX = window.innerWidth / 2;
    const fabCenterX = this.fabX + this.FAB_SIZE / 2;

    if (fabCenterX < middleX) {
      this.fabX = this.MARGIN;
      this.snappedEdge = 'left';
    } else {
      this.fabX = Math.max(this.MARGIN, window.innerWidth - this.FAB_SIZE - this.MARGIN);
      this.snappedEdge = 'right';
    }
    this.fabY = this.clampY(this.fabY);
  }

  toggleChat(): void {
    if (!this.isOpen) {
      this.viewMode = 'chat';
    }
    this.chatbotService.toggleChat();
  }

  closeChat(): void {
    this.chatbotService.closeChat();
  }

  resetChat(): void {
    this.chatbotService.resetChat();
  }

  /**
   * Bật/tắt màn hình xem lại lịch sử trò chuyện
   */
  async toggleHistoryView(): Promise<void> {
    if (this.viewMode === 'history') {
      this.viewMode = 'chat';
    } else {
      this.viewMode = 'history';
      await this.loadSessions();
    }
    this.cdr.markForCheck();
  }

  switchToChatView(): void {
    this.viewMode = 'chat';
    this.shouldScrollBottom = true;
    this.cdr.markForCheck();
  }

  async loadSessions(): Promise<void> {
    this.isLoadingSessions = true;
    this.cdr.markForCheck();
    try {
      this.sessionsList = await this.chatbotService.getSessionsList();
    } catch (e) {
      console.warn('Lỗi tải danh sách phiên:', e);
    } finally {
      this.isLoadingSessions = false;
      this.cdr.markForCheck();
    }
  }

  async selectSession(sessionId: string): Promise<void> {
    if (sessionId === this.chatbotService.sessionId && this.viewMode === 'chat') return;
    this.viewMode = 'chat';
    await this.chatbotService.switchSession(sessionId);
    this.shouldScrollBottom = true;
    this.cdr.markForCheck();
  }

  startNewChat(): void {
    this.chatbotService.startNewSession();
    this.viewMode = 'chat';
    this.shouldScrollBottom = true;
    this.cdr.markForCheck();
  }

  async deleteSession(sessionId: string, event: Event): Promise<void> {
    event.stopPropagation();
    await this.chatbotService.deleteSession(sessionId);
    this.sessionsList = this.sessionsList.filter(s => s.sessionId !== sessionId);
    this.cdr.markForCheck();
  }

  formatSessionTime(timestamp: string | Date): string {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 1) {
      const diffMins = Math.max(1, Math.round(diffMs / (1000 * 60)));
      return `${diffMins} phút trước`;
    }
    if (diffHours < 24 && date.getDate() === now.getDate()) {
      return `Hôm nay ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  }

  sendMessage(): void {
    if (!this.userInput.trim() || this.isThinking) return;
    const text = this.userInput;
    this.userInput = '';
    this.chatbotService.handleUserMessage(text);
    this.cdr.markForCheck();
  }

  selectQuickPrompt(query: string): void {
    if (this.isThinking) return;
    this.chatbotService.handleUserMessage(query);
    this.cdr.markForCheck();
  }

  /**
   * Kích hoạt quy trình "Đặt nhanh 1 chạm" trực tiếp từ Chatbot
   */
  startQuickBooking(space: ChatbotSpace): void {
    // Gửi tín hiệu hành vi CLICK cho hệ thống tự học thích ứng
    this.chatbotService.sendFeedback(space.id, 'CLICK');

    const hours = 2;
    const totalAmount = Math.round(space.hourlyPrice * hours);
    const code = 'BK-AI-' + Math.floor(100000 + Math.random() * 900000);
    const today = new Date().toISOString().split('T')[0];

    const googleCalendarUrl = this.googleCalendarService.generateGoogleCalendarUrl({
      title: `[UEL SPACE] Đặt ${space.name} (Tự động bởi AI Chatbot)`,
      roomName: space.name,
      building: space.building,
      date: today,
      timeSlot: '08:00 - 10:00',
      purpose: 'Học tập & Làm việc tự động hoá qua Chatbot UEL',
      bookerName: 'Khách hàng UEL Space'
    });

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=2|99|0908123456|||0|0|${totalAmount}|${code}|transfer_myqr`;

    this.quickBookModal = {
      isOpen: true,
      space,
      hours,
      totalAmount,
      bookingCode: code,
      isProcessing: false,
      isSuccess: false,
      momoQrUrl: qrUrl,
      googleCalendarUrl,
      showQr: false
    };
  }

  closeQuickBookModal(): void {
    this.quickBookModal.isOpen = false;
  }

  /**
   * Kích hoạt ra mã QR thanh toán
   */
  activateQrCode(): void {
    this.quickBookModal.showQr = true;
  }

  /**
   * Quét xong mock-up hiện thanh toán thành công và tự động đóng modal quay về đoạn chat
   */
  simulateScanSuccess(): void {
    if (!this.quickBookModal.space) return;
    this.quickBookModal.isProcessing = true;

    // Gửi tín hiệu chuyển đổi thành công (BOOK_SUCCESS) để tăng mạnh trọng số phòng tối ưu trong Cache
    this.chatbotService.sendFeedback(this.quickBookModal.space.id, 'BOOK_SUCCESS');

    // Giả lập quét QR và xử lý giao dịch thanh toán MoMo Sandbox
    setTimeout(() => {
      this.quickBookModal.isProcessing = false;
      this.quickBookModal.isSuccess = true;

      // Thực thi lưu đơn và gửi tin nhắn chúc mừng trong Chatbot
      this.chatbotService.executeQuickBooking(
        this.quickBookModal.space!,
        this.quickBookModal.hours
      );

      // Đóng modal sau 1.2s để người dùng trở lại ngay đoạn chat và thấy thẻ đơn hàng đã tạo
      setTimeout(() => {
        this.quickBookModal.isOpen = false;
      }, 1200);
    }, 700);
  }

  confirmQuickBookingSuccess(): void {
    this.simulateScanSuccess();
  }

  /**
   * Đánh giá câu trả lời (Reinforcement Learning Feedback)
   */
  rateMessage(msg: ChatMessage, isPositive: boolean): void {
    const action = isPositive ? 'THUMBS_UP' : 'THUMBS_DOWN';
    this.chatbotService.sendFeedback(undefined, action, msg.signature);
    (msg as any).userRated = isPositive ? 'up' : 'down';
  }

  openGoogleCalendar(url?: string): void {
    if (url) {
      window.open(url, '_blank');
    }
  }

  /**
   * Định dạng tin nhắn văn bản từ AI thành HTML an toàn, làm nổi bật in đậm, code và bullet list theo theme
   */
  formatBotMessage(rawText: string): SafeHtml {
    if (!rawText) return '';

    // 1. Thoát các ký tự HTML nguy hiểm
    let safe = rawText
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // 2. Chuyển đổi cú pháp in đậm **chữ** thành thẻ strong nổi bật theo UEL Navy & Sky
    safe = safe.replace(/\*\*(.+?)\*\*/g, '<strong class="font-extrabold text-[#003B71] dark:text-sky-300">$1</strong>');

    // 3. Chuyển đổi cú pháp in nghiêng *chữ*
    safe = safe.replace(/\*(.+?)\*/g, '<em class="italic text-slate-700 dark:text-slate-300">$1</em>');

    // 4. Chuyển đổi inline code `mã`
    safe = safe.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded-md bg-sky-50 dark:bg-slate-700 text-[#003B71] dark:text-sky-300 font-mono text-[11px] font-bold border border-sky-100 dark:border-slate-600">$1</code>');

    // 5. Chuẩn hóa các dòng gạch đầu dòng (- hoặc •) thành danh sách biểu tượng SVG Checkmark đồng bộ UEL
    const lines = safe.split('\n');
    const processedLines = lines.map(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.startsWith('* ')) {
        const content = trimmed.replace(/^[-•*]\s*/, '');
        return `<div class="flex items-start gap-2 my-1.5 pl-0.5 text-xs sm:text-[13px] leading-relaxed"><svg class="w-3.5 h-3.5 text-[#003B71] dark:text-sky-400 mt-1 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg><span class="text-slate-700 dark:text-slate-200 flex-1">${content}</span></div>`;
      }
      return line;
    });

    const combined = processedLines.join('\n');

    // 6. Xử lý khoảng cách dòng
    const html = combined
      .replace(/\n\n+/g, '<div class="h-2.5"></div>')
      .replace(/\n/g, '<br/>');

    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  /**
   * Làm sạch nhãn gợi ý để loại bỏ các emoji thừa, ưu tiên render bằng SVG Icon
   */
  cleanPromptLabel(label: string): string {
    if (!label) return '';
    // Loại bỏ các emoji phổ biến ở đầu chuỗi
    return label
      .replace(/^[🏢🤫🎙️🎉✨🔍📅🤖⚡📌💡]\s*/u, '')
      .trim();
  }

  private scrollToBottom(): void {
    try {
      if (this.scrollContainer) {
        this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
      }
    } catch {
      // Ignore scroll error
    }
  }
}
