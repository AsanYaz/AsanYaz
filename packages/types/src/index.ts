// ============================================
// AsanYaz Shared Types
// ============================================

// ---- Enums ----

export enum OrderStatus {
  DRAFT = 'draft',
  AWAITING_PAYMENT = 'awaiting_payment',
  PAID = 'paid',
  QUEUED = 'queued',
  RESEARCHING = 'researching',
  GENERATING = 'generating',
  FORMATTING = 'formatting',
  QUALITY_CHECK = 'quality_check',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled',
}

export enum AIProvider {
  OPENAI = 'openai',
  GEMINI = 'gemini',
  CUSTOM = 'custom',
}

export enum FileType {
  DOCX = 'docx',
  PDF = 'pdf',
  PPTX = 'pptx',
}

export enum NotificationType {
  ORDER_STARTED = 'order_started',
  ORDER_COMPLETED = 'order_completed',
  ORDER_FAILED = 'order_failed',
  PAYMENT_SUCCESS = 'payment_success',
  PAYMENT_FAILED = 'payment_failed',
  ACCOUNT_VERIFIED = 'account_verified',
  PASSWORD_RESET = 'password_reset',
}

// ---- Interfaces ----

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  emailVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  id: string;
  userId: string;
  universityId?: string;
  faculty?: string;
  department?: string;
  studentGroup?: string;
  studentId?: string;
  defaultLanguage: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface University {
  id: string;
  name: string;
  shortName?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Faculty {
  id: string;
  universityId: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Department {
  id: string;
  facultyId: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  isActive: boolean;
  requiredFields: ServiceField[];
  supportedOutputFormats: FileType[];
  estimatedProcessingMinutes: number;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'file';
  required: boolean;
  placeholder?: string;
  options?: string[];
}

export interface Template {
  id: string;
  name: string;
  universityId: string;
  facultyId?: string;
  departmentId?: string;
  serviceId?: string;
  language: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateVersion {
  id: string;
  templateId: string;
  version: number;
  fileKey: string;
  fileName: string;
  fileType: string;
  isActive: boolean;
  analysis?: TemplateAnalysis;
  createdAt: Date;
}

export interface TemplateAnalysis {
  formatting: {
    font?: string;
    fontSize?: number;
    lineSpacing?: number;
    margins?: {
      top?: number;
      bottom?: number;
      left?: number;
      right?: number;
    };
    paragraphSpacing?: {
      before?: number;
      after?: number;
    };
  };
  structure: {
    coverPage?: boolean;
    abstract?: boolean;
    tableOfContents?: boolean;
    introduction?: boolean;
    chapters?: boolean;
    conclusion?: boolean;
    references?: boolean;
    appendices?: boolean;
  };
  headings?: {
    level: number;
    font?: string;
    fontSize?: number;
    bold?: boolean;
    alignment?: string;
  }[];
  pageNumbering?: {
    position?: string;
    startFrom?: number;
    format?: string;
  };
  headerFooter?: {
    header?: string;
    footer?: string;
  };
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  serviceId: string;
  universityId: string;
  facultyId?: string;
  departmentId?: string;
  templateId?: string;
  topic: string;
  requestedLength?: number;
  studentName: string;
  instructorName?: string;
  additionalRequirements?: string;
  language: string;
  status: OrderStatus;
  price: number;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface OrderFile {
  id: string;
  orderId: string;
  fileKey: string;
  fileName: string;
  fileType: FileType;
  mimeType: string;
  fileSize: number;
  checksum?: string;
  version: number;
  createdAt: Date;
}

export interface Payment {
  id: string;
  orderId: string;
  userId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  providerPaymentId?: string;
  providerData?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface AIJob {
  id: string;
  orderId: string;
  provider: AIProvider;
  model: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  inputTokens?: number;
  outputTokens?: number;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  orderId?: string;
  createdAt: Date;
}

// ---- DTOs ----

export interface CreateOrderDto {
  serviceId: string;
  universityId: string;
  facultyId?: string;
  departmentId?: string;
  topic: string;
  requestedLength?: number;
  studentName: string;
  instructorName?: string;
  additionalRequirements?: string;
  language?: string;
  referenceFiles?: string[];
}

export interface RegisterDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface UpdateProfileDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  universityId?: string;
  faculty?: string;
  department?: string;
  studentGroup?: string;
  studentId?: string;
  defaultLanguage?: string;
}

export interface DocumentGenerationRequest {
  orderId: string;
  service: Service;
  template: TemplateAnalysis;
  topic: string;
  studentName: string;
  universityName: string;
  facultyName?: string;
  departmentName?: string;
  instructorName?: string;
  language: string;
  content: GeneratedContent;
  outputFormats: FileType[];
}

export interface GeneratedContent {
  title: string;
  sections: {
    heading: string;
    level: number;
    content: string;
  }[];
  references: {
    author: string;
    title: string;
    year: number;
    source: string;
    url?: string;
    doi?: string;
    verified: boolean;
  }[];
  abstract?: string;
}

// ---- API Response ----

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ---- Order Status Labels (Azerbaijani) ----

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  [OrderStatus.DRAFT]: 'Qaralama',
  [OrderStatus.AWAITING_PAYMENT]: 'Ödəniş gözlənilir',
  [OrderStatus.PAID]: 'Ödəniş edildi',
  [OrderStatus.QUEUED]: 'Sifariş qəbul edildi',
  [OrderStatus.RESEARCHING]: 'Materiallar hazırlanır',
  [OrderStatus.GENERATING]: 'Sənəd yaradılır',
  [OrderStatus.FORMATTING]: 'Formatlaşdırılır',
  [OrderStatus.QUALITY_CHECK]: 'Yoxlanılır',
  [OrderStatus.COMPLETED]: 'Tamamlandı',
  [OrderStatus.FAILED]: 'Xəta baş verdi',
  [OrderStatus.CANCELLED]: 'Ləğv edildi',
  [OrderStatus.REFUNDED]: 'Geri qaytarıldı',
};
