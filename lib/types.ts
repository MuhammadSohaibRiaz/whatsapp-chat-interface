export type ConversationStatus = "bot" | "human" | "closed";
export type MessageDirection = "inbound" | "outbound";
export type MessageSender = "patient" | "bot" | "staff";

export interface Clinic {
  id: string;
  name: string;
  phone_number_id: string;
  display_number: string;
  created_at: string;
}

export interface ClinicUser {
  id: string;
  clinic_id: string;
  auth_user_id: string;
  email: string;
  role: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  clinic_id: string;
  patient_wa_number: string;
  patient_name: string | null;
  status: ConversationStatus;
  booking_stage: string | null;
  last_message_at: string;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  clinic_id: string;
  direction: MessageDirection;
  sender: MessageSender;
  body: string;
  created_at: string;
}

export interface ConversationPreview {
  conversation_id: string;
  body: string;
  direction: MessageDirection;
  sender: MessageSender;
  created_at: string;
}

export interface ClinicMembership {
  clinic_id: string;
  email: string;
  role: string;
  clinics: Pick<Clinic, "id" | "name" | "display_number" | "phone_number_id"> | null;
}
