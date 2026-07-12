export interface TestimonialRow {
  id: string;
  name_bn: string;
  name_en: string;
  review_bn: string;
  review_en: string;
  rating: number;
  avatar: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TestimonialProfile {
  id: string;
  nameBn: string;
  nameEn: string;
  reviewBn: string;
  reviewEn: string;
  rating: number;
  avatar: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
