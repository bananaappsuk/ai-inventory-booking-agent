export type Role = "admin" | "user";

export type BookingStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "picked_up"
  | "drop_submitted"
  | "completed"
  | "cancelled";

export type Condition = "good" | "wear_and_tear" | "needs_replacement" | "major_damage";

export type Session = "AM" | "PM";

export type UserStatus = "pending" | "approved" | "rejected";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string;
  status: UserStatus;
  isActive: boolean;
  createdAt: string;
}

export interface Photo {
  url: string;
  publicId: string;
}

export interface InventoryItem {
  _id: string;
  name: string;
  category?: string;
  description?: string;
  totalQuantity: number;
  images: Photo[];
  status: "active" | "hidden";
}

export interface PopulatedInventoryRef {
  _id: string;
  name: string;
  category?: string;
  images: Photo[];
}

export interface BookingItemLine {
  inventoryItem: string | PopulatedInventoryRef;
  nameSnapshot: string;
  quantity: number;
}

/** `items.inventoryItem` may be a bare id string or a populated ref, depending on the endpoint. */
export function inventoryItemId(ref: string | PopulatedInventoryRef): string {
  return typeof ref === "string" ? ref : ref._id;
}

export interface PickupItem {
  inventoryItem: string;
  bookedQuantity: number;
  pickedUp: boolean;
  quantityPickedUp: number;
  photos: Photo[];
  note?: string;
}

export interface DropItem {
  inventoryItem: string;
  bookedQuantity: number;
  pickedUpQuantity: number;
  returned: boolean;
  quantityReturned: number;
  photos: Photo[];
  note?: string;
}

export interface DropApprovalItem {
  inventoryItem: string;
  condition: Condition;
  note?: string;
  photos: Photo[];
}

export type RuleType = "min_prior_approvals" | "no_date_overlap" | "max_quantity_share" | "inventory_available";

export interface RuleResult {
  ruleType: RuleType;
  passed: boolean;
  detail: string;
}

export interface ApprovalRule {
  _id: string;
  ruleType: RuleType;
  params: Record<string, number>;
  enabled: boolean;
  naturalLanguageText?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export type AiAction =
  | "auto_approved"
  | "recommended_approve"
  | "recommended_reject"
  | "escalated"
  | "error"
  | "overridden";

export interface AiActionLog {
  _id: string;
  bookingId: { _id: string; eventTitle: string } | string;
  action: AiAction;
  ruleResults: RuleResult[];
  confidence?: number;
  reason: string;
  historySignal?: string;
  model: string;
  latencyMs?: number;
  promptVersion?: string;
  createdAt: string;
}

export interface Booking {
  _id: string;
  eventTitle: string;
  eventDate: string;
  session: Session;
  bookedBy: { _id: string; name: string; email: string } | string;
  createdBy: string;
  status: BookingStatus;
  items: BookingItemLine[];
  approval?: {
    decidedBy?: string;
    decidedAt?: string;
    note?: string;
    decisionMaker?: "human" | "ai";
    overriddenFrom?: BookingStatus;
  };
  ai?: {
    recommendation?: "approve" | "reject";
    confidence?: number;
    reason?: string;
    ruleResults: RuleResult[];
    evaluatedAt?: string;
  };
  pickup?: { performedBy?: string; performedAt?: string; overallNote?: string; items: PickupItem[] };
  drop?: { performedBy?: string; performedAt?: string; overallNote?: string; items: DropItem[] };
  dropApproval?: {
    reviewedBy?: string;
    reviewedAt?: string;
    overallCondition?: Condition;
    overallNote?: string;
    adminPhotos: Photo[];
    items: DropApprovalItem[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface CalendarBooking {
  id: string;
  title: string;
  eventDate: string;
  session: Session;
  status: BookingStatus;
  ownerName: string;
}

export interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  relatedBooking?: string;
  read: boolean;
  createdAt: string;
}

export interface ChatSession {
  _id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}
