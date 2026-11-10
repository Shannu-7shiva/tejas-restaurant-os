export type UserRole = 
  | 'PLATFORM_ADMIN'
  | 'RESTAURANT_OWNER'
  | 'RESTAURANT_MANAGER'
  | 'KITCHEN_STAFF'
  | 'SERVICE_STAFF'
  | 'CUSTOMER';

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  is_active?: boolean;
  restaurant_id?: string;
  restaurant?: {
    id: string;
    name: string;
    slug: string;
    logo_url?: string;
  };
}

export interface RestaurantSettings {
  tax_rate_percent: number;
  service_charge_percent: number;
  currency_symbol: string;
  opening_hours_json: string;
  table_pin_required: boolean;
  notification_sound_enabled: boolean;
}

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  cover_image_url?: string;
  address?: string;
  phone?: string;
  email?: string;
  currency: string;
  settings?: RestaurantSettings;
}

export interface MenuItemVariant {
  id?: string;
  name: string;
  price_modifier: number;
}

export interface MenuAddon {
  id?: string;
  name: string;
  price: number;
  is_available: boolean;
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  category_id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  is_veg: boolean;
  allergens: string[];
  is_available: boolean;
  is_archived: boolean;
  display_order: number;
  variants: MenuItemVariant[];
  addons: MenuAddon[];
}

export interface MenuCategory {
  id: string;
  restaurant_id: string;
  name: string;
  description?: string;
  display_order: number;
  is_active: boolean;
  items: MenuItem[];
}

export type TableStatus = 'AVAILABLE' | 'OCCUPIED' | 'CLEANING';

export interface RestaurantTable {
  id: string;
  restaurant_id: string;
  table_number: string;
  capacity: number;
  status: TableStatus;
  qr_token: string;
  is_session_active: boolean;
  session_pin?: string;
  updated_at?: string;
}

export type OrderStatus = 'NEW' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'SERVED' | 'CANCELLED';
export type PaymentStatus = 'UNPAID' | 'PENDING' | 'PAID' | 'REFUNDED';

export interface OrderItemAddon {
  addon_name: string;
  unit_price: number;
}

export interface OrderItem {
  id: string;
  menu_item_id?: string;
  item_name: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
  variant_name?: string;
  notes?: string;
  addons: OrderItemAddon[];
}

export interface OrderStatusHistory {
  previous_status?: string;
  new_status: string;
  notes?: string;
  timestamp: string;
}

export interface Order {
  id: string;
  order_number: string;
  restaurant_id: string;
  table_id?: string;
  table_number?: string;
  customer_name: string;
  customer_phone?: string;
  status: OrderStatus;
  subtotal: number;
  tax_amount: number;
  service_charge: number;
  total_amount: number;
  payment_status: PaymentStatus;
  payment_method: string;
  special_notes?: string;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
  status_history: OrderStatusHistory[];
}

export interface CartItem {
  id: string; // generated unique key for cart entry based on item + variant + addons
  menu_item_id: string;
  name: string;
  base_price: number;
  unit_price: number;
  quantity: number;
  variant_name?: string;
  addons: { addon_id: string; name: string; unit_price: number }[];
  notes?: string;
  image_url?: string;
}

export interface AnalyticsSummary {
  orders_today_count: number;
  active_preparing_count: number;
  completed_today_count: number;
  total_revenue_today: number;
  placed_orders_value_today: number;
  avg_order_value: number;
  popular_items: { name: string; total_sold: number; total_revenue: number }[];
  recent_orders: Order[];
  hourly_trends: { hour: string; orders: number }[];
}
