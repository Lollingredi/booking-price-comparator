export interface User {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  plan: "free" | "basic" | "pro";
  created_at: string;
}

export interface Hotel {
  id: string;
  user_id: string;
  name: string;
  xotelo_hotel_key: string;
  city: string;
  stars: number | null;
  created_at: string;
  competitors: Competitor[];
}

export interface Competitor {
  id: string;
  hotel_id: string;
  competitor_name: string;
  competitor_xotelo_key: string;
  competitor_stars: number | null;
  is_active: boolean;
  created_at: string;
}

export interface RateSnapshot {
  id: string;
  hotel_xotelo_key: string;
  ota_code: string;
  ota_name: string;
  price: number;
  currency: string;
  check_in_date: string;
  check_out_date: string;
  fetched_at: string;
}

export interface HotelRates {
  hotel_key: string;
  hotel_name: string;
  is_own_hotel: boolean;
  rates: RateSnapshot[];
}

export interface ComparisonRow {
  hotel_key: string;
  hotel_name: string;
  is_own_hotel: boolean;
  ota_prices: Record<string, number | null>;
  min_price: number | null;
  rank: number;
}

export interface HistoryPoint {
  date: string;
  ota_code: string;
  ota_name: string;
  min_price: number;
}

export interface AlertRule {
  id: string;
  user_id: string;
  rule_type: "competitor_price_drop" | "parity_issue" | "undercut";
  threshold_value: number;
  is_active: boolean;
  notify_email: boolean;
  notify_whatsapp: boolean;
  created_at: string;
}

export interface AlertLog {
  id: string;
  user_id: string;
  alert_rule_id: string;
  message: string;
  severity: "info" | "warning" | "danger";
  is_read: boolean;
  created_at: string;
}

export interface HotelSearchResult {
  hotel_key: string;
  name: string;
  address: string | null;
  city: string | null;
}

export interface RoomType {
  id: string;
  label: string;
  /** Price multiplier relative to the base double room price */
  multiplier: number;
}

export const ROOM_TYPES: RoomType[] = [
  { id: "double_matrimoniale", label: "Doppia matrimoniale", multiplier: 1.00 },
  { id: "double_standard",     label: "Doppia standard",     multiplier: 0.88 },
  { id: "single",              label: "Singola",             multiplier: 0.70 },
  { id: "superior",            label: "Superior",            multiplier: 1.38 },
  { id: "junior_suite",        label: "Junior Suite",        multiplier: 1.72 },
  { id: "suite",               label: "Suite",               multiplier: 2.20 },
];

export interface Token {
  access_token: string;
  refresh_token: string;
  token_type: string;
}
