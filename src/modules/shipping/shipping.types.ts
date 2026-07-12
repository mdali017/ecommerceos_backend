export interface ShippingZoneRow {
  id: string;
  name: string;
  name_bn: string;
  delivery_fee: number;
  free_delivery_threshold: number;
  estimated_days_min: number;
  estimated_days_max: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ShippingZoneProfile {
  id: string;
  name: string;
  nameBn: string;
  deliveryFee: number;
  freeDeliveryThreshold: number;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ShippingQuote {
  zoneId: string | null;
  zoneName: string;
  deliveryCharge: number;
  freeDeliveryThreshold: number;
  estimatedDelivery: string;
  isFreeDelivery: boolean;
}

export interface CheckoutTotals {
  deliveryCharge: number;
  discount: number;
  total: number;
  autoDiscount: number;
  couponDiscount: number;
  estimatedDelivery: string;
  shippingZoneId: string | null;
}
