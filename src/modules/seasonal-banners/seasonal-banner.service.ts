import { randomUUID } from "crypto";
import path from "path";
import { supabase } from "../../config/supabase";
import { AppError, NotFoundError } from "../../shared/errors/app-error";
import type { SeasonalBannerProfile, SeasonalBannerRow } from "./seasonal-banner.types";
import type {
  CreateSeasonalBannerInput,
  UpdateSeasonalBannerInput,
} from "./seasonal-banner.validation";

const STORAGE_BUCKET = "seasonal-banners";

function toSeasonalBannerProfile(row: SeasonalBannerRow): SeasonalBannerProfile {
  return {
    id: row.id,
    titleBn: row.title_bn,
    titleEn: row.title_en,
    ctaBn: row.cta_bn,
    ctaEn: row.cta_en,
    imageUrl: row.image_url,
    sortOrder: row.sort_order,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function fetchSeasonalBanners(activeOnly = false): Promise<SeasonalBannerProfile[]> {
  let query = supabase.from("seasonal_banners").select().order("sort_order", { ascending: true });
  if (activeOnly) query = query.eq("is_active", true);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list seasonal banners: ${error.message}`);

  return ((data ?? []) as SeasonalBannerRow[]).map(toSeasonalBannerProfile);
}

export async function listSeasonalBanners(): Promise<SeasonalBannerProfile[]> {
  return fetchSeasonalBanners(true);
}

export async function listAllSeasonalBanners(): Promise<SeasonalBannerProfile[]> {
  return fetchSeasonalBanners(false);
}

export async function getSeasonalBannerById(id: string): Promise<SeasonalBannerProfile> {
  const { data, error } = await supabase
    .from("seasonal_banners")
    .select()
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Failed to fetch seasonal banner: ${error.message}`);
  if (!data) throw new NotFoundError("Seasonal banner not found");

  return toSeasonalBannerProfile(data as SeasonalBannerRow);
}

export async function createSeasonalBanner(
  input: CreateSeasonalBannerInput
): Promise<SeasonalBannerProfile> {
  const row = {
    title_bn: input.titleBn.trim(),
    title_en: input.titleEn.trim(),
    cta_bn: input.ctaBn?.trim() ?? "",
    cta_en: input.ctaEn?.trim() ?? "",
    image_url: input.imageUrl.trim(),
    sort_order: input.sortOrder ?? 0,
    is_active: input.isActive ?? true,
  };

  const { data, error } = await supabase.from("seasonal_banners").insert(row).select().single();
  if (error) throw new Error(`Failed to create seasonal banner: ${error.message}`);

  return toSeasonalBannerProfile(data as SeasonalBannerRow);
}

export async function updateSeasonalBanner(
  id: string,
  input: UpdateSeasonalBannerInput
): Promise<SeasonalBannerProfile> {
  const current = await getSeasonalBannerById(id);

  const next = {
    title_bn: input.titleBn?.trim() ?? current.titleBn,
    title_en: input.titleEn?.trim() ?? current.titleEn,
    cta_bn: input.ctaBn?.trim() ?? current.ctaBn,
    cta_en: input.ctaEn?.trim() ?? current.ctaEn,
    image_url: input.imageUrl?.trim() ?? current.imageUrl,
    sort_order: input.sortOrder ?? current.sortOrder,
    is_active: input.isActive ?? current.isActive,
  };

  const { data, error } = await supabase
    .from("seasonal_banners")
    .update(next)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`Failed to update seasonal banner: ${error.message}`);

  return toSeasonalBannerProfile(data as SeasonalBannerRow);
}

export async function deleteSeasonalBanner(id: string): Promise<void> {
  const { error } = await supabase.from("seasonal_banners").delete().eq("id", id);
  if (error) throw new Error(`Failed to delete seasonal banner: ${error.message}`);
}

export async function uploadSeasonalBannerImage(file: Express.Multer.File): Promise<string> {
  const ext = path.extname(file.originalname) || ".jpg";
  const fileName = `${Date.now()}-${randomUUID()}${ext}`;

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (error) {
    throw new AppError(500, `Image upload failed: ${error.message}`, "UPLOAD_FAILED");
  }

  const { data: publicUrl } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(data.path);
  return publicUrl.publicUrl;
}
