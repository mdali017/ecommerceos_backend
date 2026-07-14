import { randomUUID } from "crypto";
import path from "path";
import { supabase } from "../../config/supabase";
import * as categoryService from "../categories/category.service";
import { AppError, NotFoundError } from "../../shared/errors/app-error";
import type {
  PaginatedProducts,
  ProductImageRow,
  ProductProfile,
  ProductRow,
  ProductStatus,
} from "./product.types";
import type { BulkProductInput, CreateProductInput, PublicProductsQuery, UpdateProductInput } from "./product.validation";

const STORAGE_BUCKET = "product-images";

function parseNumber(value: string | number | undefined, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const raw = String(value ?? "").trim().replace(/,/g, "");
  if (!raw) return fallback;
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseInteger(value: string | number | undefined, fallback = 0): number {
  return Math.round(parseNumber(value, fallback));
}

function parseDate(value: string | undefined): string | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function parseFeatured(value: string | undefined): boolean {
  const raw = String(value ?? "").trim().toLowerCase();
  return ["yes", "true", "1", "y"].includes(raw);
}

function normalizeStatus(value: string | undefined): ProductStatus | null {
  const raw = String(value ?? "").trim().toLowerCase().replace(/\s+/g, "_");
  if (["active", "low_stock", "out_of_stock", "draft"].includes(raw)) {
    return raw as ProductStatus;
  }
  if (raw === "lowstock" || raw === "low") return "low_stock";
  if (raw === "outofstock" || raw === "out") return "out_of_stock";
  return null;
}

function deriveStatus(stockQty: number, minStock: number, explicit?: string | null): ProductStatus {
  const normalized = explicit ? normalizeStatus(explicit) : null;
  if (normalized) return normalized;
  if (stockQty <= 0) return "out_of_stock";
  if (minStock > 0 && stockQty <= minStock) return "low_stock";
  return "active";
}

function generateSlug(name: string, sku: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);

  return base || sku.toLowerCase().replace(/[^\w-]/g, "-");
}

async function ensureUniqueSlug(baseSlug: string, sku: string, excludeId?: string): Promise<string> {
  let slug = baseSlug;
  let attempt = 0;

  while (attempt < 10) {
    let query = supabase.from("products").select("id").eq("slug", slug);
    if (excludeId) query = query.neq("id", excludeId);

    const { data, error } = await query.maybeSingle();
    if (error) throw new Error(`Slug check failed: ${error.message}`);
    if (!data) return slug;

    attempt += 1;
    slug = `${baseSlug}-${sku.toLowerCase().replace(/[^\w-]/g, "")}${attempt > 1 ? `-${attempt}` : ""}`;
  }

  return `${baseSlug}-${randomUUID().slice(0, 8)}`;
}

function toProductProfile(row: ProductRow, images: string[] = []): ProductProfile {
  return {
    id: row.id,
    sku: row.sku,
    barcode: row.barcode,
    productName: row.product_name,
    slug: row.slug,
    genericName: row.generic_name,
    brand: row.brand,
    category: row.category,
    subcategory: row.subcategory,
    description: row.description,
    unit: row.unit,
    packSize: row.pack_size,
    purchasePrice: Number(row.purchase_price),
    costPrice: Number(row.cost_price),
    sellingPrice: Number(row.selling_price),
    offerPrice: Number(row.offer_price),
    taxPercent: Number(row.tax_percent),
    discountPercent: Number(row.discount_percent),
    stockQty: row.stock_qty,
    minStock: row.min_stock,
    maxStock: row.max_stock,
    batchNo: row.batch_no,
    expiryDate: row.expiry_date,
    manufactureDate: row.manufacture_date,
    supplier: row.supplier,
    manufacturer: row.manufacturer,
    weight: row.weight,
    color: row.color,
    size: row.size,
    variant: row.variant,
    imageUrl: row.image_url,
    status: row.status,
    featured: row.featured,
    tags: row.tags,
    notes: row.notes,
    images,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapInputToDbRow(input: BulkProductInput, slug: string) {
  const stockQty = parseInteger(input.stockQty);
  const minStock = parseInteger(input.minStock);
  const imageUrls = input.imageUrls ?? [];
  const primaryImage = input.imageUrl?.trim() || imageUrls[0] || "";

  return {
    sku: input.sku.trim(),
    barcode: input.barcode?.trim() ?? "",
    product_name: input.productName.trim(),
    slug,
    generic_name: input.genericName?.trim() ?? "",
    brand: input.brand?.trim() ?? "",
    category: input.category?.trim() ?? "",
    subcategory: input.subcategory?.trim() ?? "",
    description: input.description?.trim() ?? "",
    unit: input.unit?.trim() ?? "",
    pack_size: input.packSize?.trim() ?? "",
    purchase_price: parseNumber(input.purchasePrice),
    cost_price: parseNumber(input.costPrice),
    selling_price: parseNumber(input.sellingPrice),
    offer_price: parseNumber(input.offerPrice),
    tax_percent: parseNumber(input.taxPercent),
    discount_percent: parseNumber(input.discountPercent),
    stock_qty: stockQty,
    min_stock: minStock,
    max_stock: parseInteger(input.maxStock),
    batch_no: input.batchNo?.trim() ?? "",
    expiry_date: parseDate(input.expiryDate),
    manufacture_date: parseDate(input.manufactureDate),
    supplier: input.supplier?.trim() ?? "",
    manufacturer: input.manufacturer?.trim() ?? "",
    weight: input.weight?.trim() ?? "",
    color: input.color?.trim() ?? "",
    size: input.size?.trim() ?? "",
    variant: input.variant?.trim() ?? "",
    image_url: primaryImage,
    status: deriveStatus(stockQty, minStock, input.status),
    featured: parseFeatured(input.featured),
    tags: input.tags?.trim() ?? "",
    notes: input.notes?.trim() ?? "",
  };
}

async function replaceProductImages(productId: string, imageUrls: string[]) {
  await supabase.from("product_images").delete().eq("product_id", productId);

  if (imageUrls.length === 0) return;

  const rows = imageUrls.map((url, index) => ({
    product_id: productId,
    url,
    sort_order: index,
  }));

  const { error } = await supabase.from("product_images").insert(rows);
  if (error) throw new Error(`Failed to save product images: ${error.message}`);
}

async function getProductImages(productId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("product_images")
    .select("url, sort_order")
    .eq("product_id", productId)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(`Failed to fetch product images: ${error.message}`);

  return (data as Pick<ProductImageRow, "url">[]).map((row) => row.url);
}

export async function listProducts(): Promise<ProductProfile[]> {
  const { data, error } = await supabase
    .from("products")
    .select()
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to list products: ${error.message}`);

  return attachImagesToProducts(data as ProductRow[]);
}

function getEffectivePrice(row: ProductRow): number {
  const offerPrice = Number(row.offer_price);
  const sellingPrice = Number(row.selling_price);
  if (offerPrice > 0 && offerPrice < sellingPrice) return offerPrice;
  return sellingPrice;
}

function sortProducts(rows: ProductRow[], sort: PublicProductsQuery["sort"]): ProductRow[] {
  const sorted = [...rows];

  switch (sort) {
    case "price_asc":
      return sorted.sort((a, b) => getEffectivePrice(a) - getEffectivePrice(b));
    case "price_desc":
      return sorted.sort((a, b) => getEffectivePrice(b) - getEffectivePrice(a));
    case "name":
      return sorted.sort((a, b) => a.product_name.localeCompare(b.product_name, "bn"));
    case "newest":
    default:
      return sorted.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
  }
}

function matchesSearch(row: ProductRow, search: string): boolean {
  const query = search.trim().toLowerCase();
  if (!query) return true;

  const haystack = [
    row.product_name,
    row.generic_name,
    row.brand,
    row.category,
    row.subcategory,
    row.tags,
    row.sku,
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
}

function matchesSubcategory(row: ProductRow, subcategory: string): boolean {
  const query = subcategory.trim().toLowerCase();
  if (!query) return true;
  return row.subcategory.toLowerCase().includes(query);
}

function matchesPriceRange(row: ProductRow, minPrice?: number, maxPrice?: number): boolean {
  const price = getEffectivePrice(row);
  if (minPrice !== undefined && price < minPrice) return false;
  if (maxPrice !== undefined && price > maxPrice) return false;
  return true;
}

export async function listPublicProducts(
  query: PublicProductsQuery = {
    page: 1,
    limit: 20,
    sort: "newest",
  }
): Promise<PaginatedProducts> {
  const { data, error } = await supabase
    .from("products")
    .select()
    .in("status", ["active", "low_stock"]);

  if (error) throw new Error(`Failed to list public products: ${error.message}`);

  let rows = (data ?? []) as ProductRow[];

  if (query.category) {
    const category = await categoryService.getCategoryBySlug(query.category);
    rows = rows.filter((row) => categoryService.matchesCategory(category, row));
  }

  if (query.subcategory) {
    rows = rows.filter((row) => matchesSubcategory(row, query.subcategory!));
  }

  if (query.search) {
    rows = rows.filter((row) => matchesSearch(row, query.search!));
  }

  rows = rows.filter((row) => matchesPriceRange(row, query.minPrice, query.maxPrice));
  rows = sortProducts(rows, query.sort);

  const total = rows.length;
  const totalPages = total === 0 ? 0 : Math.ceil(total / query.limit);
  const offset = (query.page - 1) * query.limit;
  const pageRows = rows.slice(offset, offset + query.limit);
  const products = await attachImagesToProducts(pageRows);

  return {
    products,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages,
    },
  };
}

export async function getPublicProductBySlug(slug: string): Promise<ProductProfile> {
  const { data, error } = await supabase
    .from("products")
    .select()
    .eq("slug", slug)
    .in("status", ["active", "low_stock"])
    .maybeSingle();

  if (error) throw new Error(`Failed to fetch product: ${error.message}`);
  if (!data) throw new NotFoundError("Product not found");

  const images = await getProductImages(data.id);
  return toProductProfile(data as ProductRow, images);
}

async function attachImagesToProducts(products: ProductRow[]): Promise<ProductProfile[]> {
  if (products.length === 0) return [];

  const productIds = products.map((product) => product.id);
  const { data: imageRows, error } = await supabase
    .from("product_images")
    .select("product_id, url, sort_order")
    .in("product_id", productIds)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(`Failed to fetch product images: ${error.message}`);

  const imagesByProduct = new Map<string, string[]>();
  for (const row of (imageRows ?? []) as Pick<ProductImageRow, "product_id" | "url">[]) {
    const existing = imagesByProduct.get(row.product_id) ?? [];
    existing.push(row.url);
    imagesByProduct.set(row.product_id, existing);
  }

  return products.map((product) =>
    toProductProfile(product, imagesByProduct.get(product.id) ?? [])
  );
}

export async function bulkUploadProducts(products: BulkProductInput[]) {
  let created = 0;
  let updated = 0;
  const failed: { sku: string; error: string }[] = [];
  const saved: ProductProfile[] = [];

  for (const input of products) {
    try {
      const sku = input.sku.trim();
      const { data: existing, error: lookupError } = await supabase
        .from("products")
        .select("id, slug")
        .eq("sku", sku)
        .maybeSingle();

      if (lookupError) throw new Error(lookupError.message);

      const existingRow = existing as Pick<ProductRow, "id" | "slug"> | null;
      const baseSlug = existingRow?.slug ?? generateSlug(input.productName, sku);
      const slug = existingRow
        ? existingRow.slug
        : await ensureUniqueSlug(baseSlug, sku);

      const row = mapInputToDbRow(input, slug);
      const imageUrls = [
        ...(input.imageUrl?.trim() ? [input.imageUrl.trim()] : []),
        ...(input.imageUrls ?? []),
      ].filter((url, index, arr) => url && arr.indexOf(url) === index);

      if (existingRow) {
        const { data, error } = await supabase
          .from("products")
          .update(row)
          .eq("id", existingRow.id)
          .select()
          .single();

        if (error) throw new Error(error.message);

        if (imageUrls.length > 0) {
          await replaceProductImages(existingRow.id, imageUrls);
        }

        const images =
          imageUrls.length > 0 ? imageUrls : await getProductImages(existingRow.id);
        saved.push(toProductProfile(data as ProductRow, images));
        updated += 1;
      } else {
        const { data, error } = await supabase.from("products").insert(row).select().single();

        if (error) throw new Error(error.message);

        const product = data as ProductRow;
        if (imageUrls.length > 0) {
          await replaceProductImages(product.id, imageUrls);
        }

        saved.push(toProductProfile(product, imageUrls));
        created += 1;
      }
    } catch (err) {
      failed.push({
        sku: input.sku.trim() || "unknown",
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  return { created, updated, failed, products: saved };
}

export async function uploadProductImages(files: Express.Multer.File[]): Promise<string[]> {
  const urls: string[] = [];

  for (const file of files) {
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
    urls.push(publicUrl.publicUrl);
  }

  return urls;
}

export async function getProductById(id: string): Promise<ProductProfile> {
  const { data, error } = await supabase.from("products").select().eq("id", id).maybeSingle();

  if (error) throw new Error(`Failed to fetch product: ${error.message}`);
  if (!data) throw new NotFoundError("Product not found");

  const images = await getProductImages((data as ProductRow).id);
  return toProductProfile(data as ProductRow, images);
}

export async function createProduct(input: CreateProductInput): Promise<ProductProfile> {
  const sku = input.sku.trim();
  const { data: existing, error: lookupError } = await supabase
    .from("products")
    .select("id")
    .eq("sku", sku)
    .maybeSingle();

  if (lookupError) throw new Error(`Product create failed: ${lookupError.message}`);
  if (existing) throw new AppError(409, "Product with this SKU already exists", "CONFLICT");

  const baseSlug = generateSlug(input.productName, sku);
  const slug = await ensureUniqueSlug(baseSlug, sku);
  const row = mapInputToDbRow(input, slug);
  const imageUrls = [
    ...(input.imageUrl?.trim() ? [input.imageUrl.trim()] : []),
    ...(input.imageUrls ?? []),
  ].filter(Boolean);

  const { data, error } = await supabase.from("products").insert(row).select().single();
  if (error) throw new Error(`Product create failed: ${error.message}`);

  const product = data as ProductRow;
  if (imageUrls.length > 0) {
    await replaceProductImages(product.id, imageUrls);
  }

  return toProductProfile(product, imageUrls);
}

export async function updateProduct(
  id: string,
  input: UpdateProductInput
): Promise<ProductProfile> {
  const { data: current, error: lookupError } = await supabase
    .from("products")
    .select()
    .eq("id", id)
    .maybeSingle();

  if (lookupError) throw new Error(`Product update failed: ${lookupError.message}`);
  if (!current) throw new NotFoundError("Product not found");

  const currentRow = current as ProductRow;

  if (input.sku && input.sku.trim() !== currentRow.sku) {
    const { data: skuOwner, error: skuError } = await supabase
      .from("products")
      .select("id")
      .eq("sku", input.sku.trim())
      .maybeSingle();

    if (skuError) throw new Error(`Product update failed: ${skuError.message}`);
    if (skuOwner && skuOwner.id !== id) {
      throw new AppError(409, "Product with this SKU already exists", "CONFLICT");
    }
  }

  const merged: BulkProductInput = {
    sku: input.sku?.trim() ?? currentRow.sku,
    barcode: input.barcode ?? currentRow.barcode,
    productName: input.productName?.trim() ?? currentRow.product_name,
    genericName: input.genericName ?? currentRow.generic_name,
    brand: input.brand ?? currentRow.brand,
    category: input.category ?? currentRow.category,
    subcategory: input.subcategory ?? currentRow.subcategory,
    description: input.description ?? currentRow.description,
    unit: input.unit ?? currentRow.unit,
    packSize: input.packSize ?? currentRow.pack_size,
    purchasePrice: input.purchasePrice ?? currentRow.purchase_price,
    costPrice: input.costPrice ?? currentRow.cost_price,
    sellingPrice: input.sellingPrice ?? currentRow.selling_price,
    offerPrice: input.offerPrice ?? currentRow.offer_price,
    taxPercent: input.taxPercent ?? currentRow.tax_percent,
    discountPercent: input.discountPercent ?? currentRow.discount_percent,
    stockQty: input.stockQty ?? currentRow.stock_qty,
    minStock: input.minStock ?? currentRow.min_stock,
    maxStock: input.maxStock ?? currentRow.max_stock,
    batchNo: input.batchNo ?? currentRow.batch_no,
    expiryDate: input.expiryDate ?? currentRow.expiry_date ?? "",
    manufactureDate: input.manufactureDate ?? currentRow.manufacture_date ?? "",
    supplier: input.supplier ?? currentRow.supplier,
    manufacturer: input.manufacturer ?? currentRow.manufacturer,
    weight: input.weight ?? currentRow.weight,
    color: input.color ?? currentRow.color,
    size: input.size ?? currentRow.size,
    variant: input.variant ?? currentRow.variant,
    imageUrl: input.imageUrl ?? currentRow.image_url,
    status: input.status ?? currentRow.status,
    featured: input.featured ?? (currentRow.featured ? "yes" : "no"),
    tags: input.tags ?? currentRow.tags,
    notes: input.notes ?? currentRow.notes,
    imageUrls: input.imageUrls ?? [],
  };

  const slug =
    input.productName && input.productName.trim() !== currentRow.product_name
      ? await ensureUniqueSlug(generateSlug(merged.productName, merged.sku), merged.sku, id)
      : currentRow.slug;

  const row = mapInputToDbRow(merged, slug);
  const imagesTouched = input.imageUrls !== undefined;

  if (imagesTouched) {
    const imageUrls = [
      ...(input.imageUrl?.trim() ? [input.imageUrl.trim()] : []),
      ...(input.imageUrls ?? []),
    ].filter((url, index, arr) => Boolean(url) && arr.indexOf(url) === index);

    row.image_url = imageUrls[0] || "";
    merged.imageUrl = imageUrls[0] || "";
  }

  const { data, error } = await supabase
    .from("products")
    .update(row)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`Product update failed: ${error.message}`);

  const product = data as ProductRow;

  if (imagesTouched) {
    const imageUrls = [
      ...(input.imageUrl?.trim() ? [input.imageUrl.trim()] : []),
      ...(input.imageUrls ?? []),
    ].filter((url, index, arr) => Boolean(url) && arr.indexOf(url) === index);

    await replaceProductImages(product.id, imageUrls);
    return toProductProfile({ ...product, image_url: imageUrls[0] || "" }, imageUrls);
  }

  const images = await getProductImages(product.id);
  return toProductProfile(product, images);
}

export async function deleteProduct(id: string): Promise<void> {
  const { data, error: lookupError } = await supabase
    .from("products")
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (lookupError) throw new Error(`Product delete failed: ${lookupError.message}`);
  if (!data) throw new NotFoundError("Product not found");

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw new Error(`Product delete failed: ${error.message}`);
}
