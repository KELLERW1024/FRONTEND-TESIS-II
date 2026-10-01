import {
  Component,
  Inject,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewChecked,
  DestroyRef,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ConversationService } from '../service/conversation.service';

export interface AssistantModalData {
  idConversation: number;
  question: any;
  parentNode: any;
}

@Component({
  selector: 'app-assistant-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './assistant-modal.component.html',
  styleUrls: ['./assistant-modal.component.scss']
})
export class AssistantModalComponent implements OnInit, AfterViewChecked {
  @ViewChild('chatScrollContainer') private chatContainer!: ElementRef<HTMLDivElement>;

  private destroyRef = inject(DestroyRef);

  messages: { role: 'user' | 'assistant'; content: string }[] = [];
  userInput: string = '';
  draftText: string = '';
  metricsSummary: string | null = null;
  progressPercentage: number = 0;
  isComplete: boolean = false;
  isLoading: boolean = false;
  private shouldScrollToBottom: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<AssistantModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AssistantModalData,
    private conversationService: ConversationService
  ) {}

  ngOnInit(): void {
    this.sendInitialPrompt();
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  private scrollToBottom(): void {
    try {
      if (this.chatContainer) {
        this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
      }
    } catch (err) {
      console.error('Scroll error:', err);
    }
  }

  sendInitialPrompt(): void {
    this.isLoading = true;
    this.conversationService.assistantChat({
      idConversation: this.data.idConversation,
      idQuestion: this.data.question.id,
      messages: []
    })
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe({
      next: (resp: any) => {
        this.isLoading = false;
        if (resp.success && resp.data) {
          this.applyAiResponse(resp.data);
          this.shouldScrollToBottom = true;
        }
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  sendMessage(): void {
    const text = this.userInput.trim();
    if (!text || this.isLoading) return;

    this.messages.push({ role: 'user', content: text });
    this.userInput = '';
    this.isLoading = true;
    this.shouldScrollToBottom = true;

    this.conversationService.assistantChat({
      idConversation: this.data.idConversation,
      idQuestion: this.data.question.id,
      messages: this.messages,
      user_message: text
    })
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe({
      next: (resp: any) => {
        this.isLoading = false;
        if (resp.success && resp.data) {
          this.applyAiResponse(resp.data);
          this.shouldScrollToBottom = true;
        }
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  private applyAiResponse(data: any): void {
    if (data.chat_message) {
      this.messages.push({ role: 'assistant', content: data.chat_message });
    }
    if (data.draft_text) {
      this.draftText = data.draft_text;
    }
    this.metricsSummary = data.metrics_summary;
    this.isComplete = data.is_complete;
    this.progressPercentage = data.progress_percentage || 0;
  }

  recalculate(): void {
    this.messages = [];
    this.draftText = '';
    this.metricsSummary = null;
    this.progressPercentage = 0;
    this.isComplete = false;
    this.sendInitialPrompt();
  }

  useAnswer(): void {
    this.dialogRef.close(this.draftText);
  }
}