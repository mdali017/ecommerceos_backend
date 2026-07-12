import { randomUUID } from "crypto";
import path from "path";
import { supabase } from "../../config/supabase";
import { AppError, NotFoundError } from "../../shared/errors/app-error";
import type { HeroSlideProfile, HeroSlideRow } from "./hero-slide.types";
import type { CreateHeroSlideInput, UpdateHeroSlideInput } from "./hero-slide.validation";

const STORAGE_BUCKET = "hero-slides";

function toHeroSlideProfile(row: HeroSlideRow): HeroSlideProfile {
  return {
    id: row.id,
    titleBn: row.title_bn,
    titleEn: row.title_en,
    subtitleBn: row.subtitle_bn,
    subtitleEn: row.subtitle_en,
    ctaBn: row.cta_bn,
    ctaEn: row.cta_en,
    imageUrl: row.image_url,
    sortOrder: row.sort_order,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function fetchHeroSlides(activeOnly = false): Promise<HeroSlideProfile[]> {
  let query = supabase.from("hero_slides").select().order("sort_order", { ascending: true });
  if (activeOnly) query = query.eq("is_active", true);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list hero slides: ${error.message}`);

  return ((data ?? []) as HeroSlideRow[]).map(toHeroSlideProfile);
}

export async function listHeroSlides(): Promise<HeroSlideProfile[]> {
  return fetchHeroSlides(true);
}

export async function listAllHeroSlides(): Promise<HeroSlideProfile[]> {
  return fetchHeroSlides(false);
}

export async function getHeroSlideById(id: string): Promise<HeroSlideProfile> {
  const { data, error } = await supabase.from("hero_slides").select().eq("id", id).maybeSingle();

  if (error) throw new Error(`Failed to fetch hero slide: ${error.message}`);
  if (!data) throw new NotFoundError("Hero slide not found");

  return toHeroSlideProfile(data as HeroSlideRow);
}

export async function createHeroSlide(input: CreateHeroSlideInput): Promise<HeroSlideProfile> {
  const row = {
    title_bn: input.titleBn.trim(),
    title_en: input.titleEn.trim(),
    subtitle_bn: input.subtitleBn?.trim() ?? "",
    subtitle_en: input.subtitleEn?.trim() ?? "",
    cta_bn: input.ctaBn?.trim() ?? "",
    cta_en: input.ctaEn?.trim() ?? "",
    image_url: input.imageUrl.trim(),
    sort_order: input.sortOrder ?? 0,
    is_active: input.isActive ?? true,
  };

  const { data, error } = await supabase.from("hero_slides").insert(row).select().single();
  if (error) throw new Error(`Failed to create hero slide: ${error.message}`);

  return toHeroSlideProfile(data as HeroSlideRow);
}

export async function updateHeroSlide(
  id: string,
  input: UpdateHeroSlideInput
): Promise<HeroSlideProfile> {
  const current = await getHeroSlideById(id);

  const next = {
    title_bn: input.titleBn?.trim() ?? current.titleBn,
    title_en: input.titleEn?.trim() ?? current.titleEn,
    subtitle_bn: input.subtitleBn?.trim() ?? current.subtitleBn,
    subtitle_en: input.subtitleEn?.trim() ?? current.subtitleEn,
    cta_bn: input.ctaBn?.trim() ?? current.ctaBn,
    cta_en: input.ctaEn?.trim() ?? current.ctaEn,
    image_url: input.imageUrl?.trim() ?? current.imageUrl,
    sort_order: input.sortOrder ?? current.sortOrder,
    is_active: input.isActive ?? current.isActive,
  };

  const { data, error } = await supabase
    .from("hero_slides")
    .update(next)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`Failed to update hero slide: ${error.message}`);

  return toHeroSlideProfile(data as HeroSlideRow);
}

export async function deleteHeroSlide(id: string): Promise<void> {
  const { error } = await supabase.from("hero_slides").delete().eq("id", id);
  if (error) throw new Error(`Failed to delete hero slide: ${error.message}`);
}

export async function uploadHeroSlideImage(file: Express.Multer.File): Promise<string> {
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
