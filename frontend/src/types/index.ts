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
  booking_key: string;
  city: string;
  stars: number | null;
  created_at: string;
  competitors: Competitor[];
}

export interface Competitor {
  id: string;
  hotel_id: string;
  competitor_name: string;
  competitor_booking_key: string;
  competitor_stars: number | null;
  is_active: boolean;
  created_at: string;
}

export interface RateSnapshot {
  id: string;
  hotel_booking_key: string;
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

export interface Token {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface CalendarDay {
  check_in: string;
  own_min: number | null;
  best_competitor: number | null;
  rank: number | null;
  total_hotels: number;
}
