import { supabase } from "../../config/supabase";
import { NotFoundError } from "../../shared/errors/app-error";
import type { TestimonialProfile, TestimonialRow } from "./testimonial.types";
import type { CreateTestimonialInput, UpdateTestimonialInput } from "./testimonial.validation";

function toTestimonialProfile(row: TestimonialRow): TestimonialProfile {
  return {
    id: row.id,
    nameBn: row.name_bn,
    nameEn: row.name_en,
    reviewBn: row.review_bn,
    reviewEn: row.review_en,
    rating: row.rating,
    avatar: row.avatar,
    sortOrder: row.sort_order,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function defaultAvatar(nameBn: string, avatar?: string): string {
  const trimmed = avatar?.trim();
  if (trimmed) return trimmed.slice(0, 2);
  return nameBn.trim().charAt(0) || "?";
}

async function fetchTestimonials(activeOnly = false): Promise<TestimonialProfile[]> {
  let query = supabase.from("testimonials").select().order("sort_order", { ascending: true });
  if (activeOnly) query = query.eq("is_active", true);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list testimonials: ${error.message}`);

  return ((data ?? []) as TestimonialRow[]).map(toTestimonialProfile);
}

export async function listTestimonials(): Promise<TestimonialProfile[]> {
  return fetchTestimonials(true);
}

export async function listAllTestimonials(): Promise<TestimonialProfile[]> {
  return fetchTestimonials(false);
}

export async function getTestimonialById(id: string): Promise<TestimonialProfile> {
  const { data, error } = await supabase.from("testimonials").select().eq("id", id).maybeSingle();

  if (error) throw new Error(`Failed to fetch testimonial: ${error.message}`);
  if (!data) throw new NotFoundError("Testimonial not found");

  return toTestimonialProfile(data as TestimonialRow);
}

export async function createTestimonial(input: CreateTestimonialInput): Promise<TestimonialProfile> {
  const row = {
    name_bn: input.nameBn.trim(),
    name_en: input.nameEn?.trim() ?? "",
    review_bn: input.reviewBn.trim(),
    review_en: input.reviewEn?.trim() ?? "",
    rating: input.rating ?? 5,
    avatar: defaultAvatar(input.nameBn, input.avatar),
    sort_order: input.sortOrder ?? 0,
    is_active: input.isActive ?? true,
  };

  const { data, error } = await supabase.from("testimonials").insert(row).select().single();
  if (error) throw new Error(`Failed to create testimonial: ${error.message}`);

  return toTestimonialProfile(data as TestimonialRow);
}

export async function updateTestimonial(
  id: string,
  input: UpdateTestimonialInput
): Promise<TestimonialProfile> {
  const current = await getTestimonialById(id);
  const nextNameBn = input.nameBn?.trim() ?? current.nameBn;

  const next = {
    name_bn: nextNameBn,
    name_en: input.nameEn?.trim() ?? current.nameEn,
    review_bn: input.reviewBn?.trim() ?? current.reviewBn,
    review_en: input.reviewEn?.trim() ?? current.reviewEn,
    rating: input.rating ?? current.rating,
    avatar: defaultAvatar(nextNameBn, input.avatar ?? current.avatar),
    sort_order: input.sortOrder ?? current.sortOrder,
    is_active: input.isActive ?? current.isActive,
  };

  const { data, error } = await supabase
    .from("testimonials")
    .update(next)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`Failed to update testimonial: ${error.message}`);

  return toTestimonialProfile(data as TestimonialRow);
}

export async function deleteTestimonial(id: string): Promise<void> {
  const { error } = await supabase.from("testimonials").delete().eq("id", id);
  if (error) throw new Error(`Failed to delete testimonial: ${error.message}`);
}
