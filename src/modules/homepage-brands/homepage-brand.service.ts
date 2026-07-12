import { randomUUID } from "crypto";
import path from "path";
import { supabase } from "../../config/supabase";
import { AppError, NotFoundError } from "../../shared/errors/app-error";
import type { HomepageBrandProfile, HomepageBrandRow } from "./homepage-brand.types";
import type {
  CreateHomepageBrandInput,
  UpdateHomepageBrandInput,
} from "./homepage-brand.validation";

const STORAGE_BUCKET = "brand-logos";

function toHomepageBrandProfile(row: HomepageBrandRow): HomepageBrandProfile {
  return {
    id: row.id,
    name: row.name,
    logoUrl: row.logo_url,
    sortOrder: row.sort_order,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function fetchHomepageBrands(activeOnly = false): Promise<HomepageBrandProfile[]> {
  let query = supabase.from("homepage_brands").select().order("sort_order", { ascending: true });
  if (activeOnly) query = query.eq("is_active", true);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list homepage brands: ${error.message}`);

  return ((data ?? []) as HomepageBrandRow[]).map(toHomepageBrandProfile);
}

export async function listHomepageBrands(): Promise<HomepageBrandProfile[]> {
  return fetchHomepageBrands(true);
}

export async function listAllHomepageBrands(): Promise<HomepageBrandProfile[]> {
  return fetchHomepageBrands(false);
}

export async function getHomepageBrandById(id: string): Promise<HomepageBrandProfile> {
  const { data, error } = await supabase
    .from("homepage_brands")
    .select()
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Failed to fetch homepage brand: ${error.message}`);
  if (!data) throw new NotFoundError("Homepage brand not found");

  return toHomepageBrandProfile(data as HomepageBrandRow);
}

export async function createHomepageBrand(
  input: CreateHomepageBrandInput
): Promise<HomepageBrandProfile> {
  const row = {
    name: input.name.trim(),
    logo_url: input.logoUrl?.trim() ?? "",
    sort_order: input.sortOrder ?? 0,
    is_active: input.isActive ?? true,
  };

  const { data, error } = await supabase.from("homepage_brands").insert(row).select().single();
  if (error) throw new Error(`Failed to create homepage brand: ${error.message}`);

  return toHomepageBrandProfile(data as HomepageBrandRow);
}

export async function updateHomepageBrand(
  id: string,
  input: UpdateHomepageBrandInput
): Promise<HomepageBrandProfile> {
  const current = await getHomepageBrandById(id);

  const next = {
    name: input.name?.trim() ?? current.name,
    logo_url: input.logoUrl?.trim() ?? current.logoUrl,
    sort_order: input.sortOrder ?? current.sortOrder,
    is_active: input.isActive ?? current.isActive,
  };

  const { data, error } = await supabase
    .from("homepage_brands")
    .update(next)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`Failed to update homepage brand: ${error.message}`);

  return toHomepageBrandProfile(data as HomepageBrandRow);
}

export async function deleteHomepageBrand(id: string): Promise<void> {
  const { error } = await supabase.from("homepage_brands").delete().eq("id", id);
  if (error) throw new Error(`Failed to delete homepage brand: ${error.message}`);
}

export async function uploadHomepageBrandLogo(file: Express.Multer.File): Promise<string> {
  const ext = path.extname(file.originalname) || ".png";
  const fileName = `${Date.now()}-${randomUUID()}${ext}`;

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (error) {
    throw new AppError(500, `Logo upload failed: ${error.message}`, "UPLOAD_FAILED");
  }

  const { data: publicUrl } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(data.path);
  return publicUrl.publicUrl;
}
