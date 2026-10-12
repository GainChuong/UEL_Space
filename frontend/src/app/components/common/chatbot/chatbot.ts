import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ChatbotService, ChatMessage, ChatbotSpace } from '../../../services/chatbot.service';
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
  } = {
    isOpen: false,
    space: null,
    hours: 2,
    totalAmount: 0,
    bookingCode: '',
    isProcessing: false,
    isSuccess: false,
    momoQrUrl: '',
    googleCalendarUrl: ''
  };

  private subIsOpen?: Subscription;
  private subMessages?: Subscription;
  private subThinking?: Subscription;
  private shouldScrollBottom = false;

  constructor(
    public chatbotService: ChatbotService,
    private googleCalendarService: GoogleCalendarService
  ) {}

  ngOnInit(): void {
    this.subIsOpen = this.chatbotService.isOpen$.subscribe(open => {
      this.isOpen = open;
      if (open) {
        this.shouldScrollBottom = true;
      }
    });

    this.subMessages = this.chatbotService.messages$.subscribe(msgs => {
      this.messages = msgs;
      this.shouldScrollBottom = true;
    });

    this.subThinking = this.chatbotService.isThinking$.subscribe(thinking => {
      this.isThinking = thinking;
      if (thinking) {
        this.shouldScrollBottom = true;
      }
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
  }

  toggleChat(): void {
    this.chatbotService.toggleChat();
  }

  closeChat(): void {
    this.chatbotService.closeChat();
  }

  resetChat(): void {
    this.chatbotService.resetChat();
  }

  sendMessage(): void {
    if (!this.userInput.trim() || this.isThinking) return;
    const text = this.userInput;
    this.userInput = '';
    this.chatbotService.handleUserMessage(text);
  }

  selectQuickPrompt(query: string): void {
    if (this.isThinking) return;
    this.chatbotService.handleUserMessage(query);
  }

  /**
   * Kích hoạt quy trình "Đặt nhanh 1 chạm" trực tiếp từ Chatbot
   */
  startQuickBooking(space: ChatbotSpace): void {
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
      googleCalendarUrl
    };
  }

  closeQuickBookModal(): void {
    this.quickBookModal.isOpen = false;
  }

  confirmQuickBookingSuccess(): void {
    if (!this.quickBookModal.space) return;
    this.quickBookModal.isProcessing = true;

    // Giả lập kết nối API xác nhận thanh toán MoMo Sandbox / Đặt chỗ
    setTimeout(() => {
      this.quickBookModal.isProcessing = false;
      this.quickBookModal.isSuccess = true;

      // Thực thi lưu đơn và gửi tin nhắn chúc mừng trong Chatbot
      this.chatbotService.executeQuickBooking(
        this.quickBookModal.space!,
        this.quickBookModal.hours
      );

      // Đóng modal xác nhận sau 1.2s để người dùng thấy xác nhận trong khung chat
      setTimeout(() => {
        this.quickBookModal.isOpen = false;
      }, 1200);
    }, 600);
  }

  openGoogleCalendar(url?: string): void {
    if (url) {
      window.open(url, '_blank');
    }
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
