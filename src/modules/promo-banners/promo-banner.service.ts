import { randomUUID } from "crypto";
import path from "path";
import { supabase } from "../../config/supabase";
import { AppError, NotFoundError } from "../../shared/errors/app-error";
import type { PromoBannerProfile, PromoBannerRow } from "./promo-banner.types";
import type { CreatePromoBannerInput, UpdatePromoBannerInput } from "./promo-banner.validation";

const STORAGE_BUCKET = "promo-banners";

function toPromoBannerProfile(row: PromoBannerRow): PromoBannerProfile {
  return {
    id: row.id,
    titleBn: row.title_bn,
    titleEn: row.title_en,
    subtitleBn: row.subtitle_bn,
    subtitleEn: row.subtitle_en,
    imageUrl: row.image_url,
    sortOrder: row.sort_order,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function fetchPromoBanners(activeOnly = false): Promise<PromoBannerProfile[]> {
  let query = supabase.from("promo_banners").select().order("sort_order", { ascending: true });
  if (activeOnly) query = query.eq("is_active", true);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list promo banners: ${error.message}`);

  return ((data ?? []) as PromoBannerRow[]).map(toPromoBannerProfile);
}

export async function listPromoBanners(): Promise<PromoBannerProfile[]> {
  return fetchPromoBanners(true);
}

export async function listAllPromoBanners(): Promise<PromoBannerProfile[]> {
  return fetchPromoBanners(false);
}

export async function getPromoBannerById(id: string): Promise<PromoBannerProfile> {
  const { data, error } = await supabase.from("promo_banners").select().eq("id", id).maybeSingle();

  if (error) throw new Error(`Failed to fetch promo banner: ${error.message}`);
  if (!data) throw new NotFoundError("Promo banner not found");

  return toPromoBannerProfile(data as PromoBannerRow);
}

export async function createPromoBanner(input: CreatePromoBannerInput): Promise<PromoBannerProfile> {
  const row = {
    title_bn: input.titleBn.trim(),
    title_en: input.titleEn.trim(),
    subtitle_bn: input.subtitleBn?.trim() ?? "",
    subtitle_en: input.subtitleEn?.trim() ?? "",
    image_url: input.imageUrl.trim(),
    sort_order: input.sortOrder ?? 0,
    is_active: input.isActive ?? true,
  };

  const { data, error } = await supabase.from("promo_banners").insert(row).select().single();
  if (error) throw new Error(`Failed to create promo banner: ${error.message}`);

  return toPromoBannerProfile(data as PromoBannerRow);
}

export async function updatePromoBanner(
  id: string,
  input: UpdatePromoBannerInput
): Promise<PromoBannerProfile> {
  const current = await getPromoBannerById(id);

  const next = {
    title_bn: input.titleBn?.trim() ?? current.titleBn,
    title_en: input.titleEn?.trim() ?? current.titleEn,
    subtitle_bn: input.subtitleBn?.trim() ?? current.subtitleBn,
    subtitle_en: input.subtitleEn?.trim() ?? current.subtitleEn,
    image_url: input.imageUrl?.trim() ?? current.imageUrl,
    sort_order: input.sortOrder ?? current.sortOrder,
    is_active: input.isActive ?? current.isActive,
  };

  const { data, error } = await supabase
    .from("promo_banners")
    .update(next)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`Failed to update promo banner: ${error.message}`);

  return toPromoBannerProfile(data as PromoBannerRow);
}

export async function deletePromoBanner(id: string): Promise<void> {
  const { error } = await supabase.from("promo_banners").delete().eq("id", id);
  if (error) throw new Error(`Failed to delete promo banner: ${error.message}`);
}

export async function uploadPromoBannerImage(file: Express.Multer.File): Promise<string> {
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
