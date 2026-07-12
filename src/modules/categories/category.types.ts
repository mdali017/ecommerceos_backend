export interface CategoryRow {
  id: string;
  slug: string;
  name: string;
  name_bn: string;
  icon: string;
  parent_id: string | null;
  sort_order: number;
  keywords: string;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

export interface CategoryProfile {
  id: string;
  slug: string;
  name: string;
  nameBn: string;
  icon: string;
  parentId: string | null;
  sortOrder: number;
  keywords: string;
  isActive: boolean;
  productCount?: number;
  createdAt?: string;
  updatedAt?: string;
}
