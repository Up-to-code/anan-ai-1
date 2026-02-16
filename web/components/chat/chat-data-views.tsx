"use client";

import { useState, useMemo } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import {
  Calendar,
  Clock,
  Download,
  ExternalLink,
  FileText,
  Tag,
  MapPin,
  Bed,
  Bath,
  Square,
  Sparkles,
  Building2,
  CheckCircle,
  Link2,
  Heart,
  ChevronDown,
  ChevronUp,
  Calculator,
  ShoppingCart,
  Phone,
  Users,
  ChevronLeft,
  ChevronRight,
  Gift,
  Clock4,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ImageViewer } from "./image-viewer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

// --- Appointment List ---
export interface Appointment {
  title: string;
  date: string;
  time: string;
  status: "confirmed" | "pending" | "cancelled";
  description?: string;
}

export function AppointmentList({
  appointments,
}: {
  appointments: Appointment[];
}) {
  const list = Array.isArray(appointments) ? appointments : [];
  return (
    <div className="flex flex-col gap-3 w-full mt-3 mb-3">
      {list.map((apt, i) => (
        <div
          key={i}
          className="flex items-center justify-between gap-4 p-3 sm:p-4 bg-background/50 border border-border/50 rounded-xl hover:border-primary/30 transition-all cursor-pointer min-h-[60px]"
        >
          <div className="flex-1 min-w-0 flex flex-col gap-1.5">
            <div className="flex items-center gap-2.5">
              <span className="font-semibold text-sm sm:text-base truncate leading-snug">
                {apt.title}
              </span>
              <div
                className={cn(
                  "px-2 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider shrink-0",
                  apt.status === "confirmed"
                    ? "bg-emerald-500/10 text-emerald-500"
                    : apt.status === "pending"
                      ? "bg-amber-500/10 text-amber-500"
                      : "bg-rose-500/10 text-rose-500",
                )}
              >
                {apt.status === "confirmed"
                  ? "مؤكد"
                  : apt.status === "pending"
                    ? "قيد الانتظار"
                    : "ملغى"}
              </div>
            </div>
            {apt.description && (
              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1 leading-relaxed">
                {apt.description}
              </p>
            )}
            <div className="flex items-center gap-4 sm:gap-5 text-xs sm:text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                <span className="leading-relaxed">{apt.date}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                <span className="leading-relaxed">{apt.time}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// --- Coupon Card ---
interface Coupon {
  code: string;
  discount: string;
  expiry: string;
}

export function CouponCard({ coupon }: { coupon: Coupon }) {
  return (
    <div className="relative overflow-hidden w-full mt-3 mb-3 p-5 sm:p-6 rounded-xl bg-primary/5 border border-primary/20 flex flex-col items-center text-center gap-4">
      <div className="absolute top-0 right-0 p-2 bg-primary/10 rounded-bl-xl">
        <Tag className="h-4 w-4 text-primary" />
      </div>
      <div className="space-y-2">
        <span className="text-3xl sm:text-4xl font-black text-primary leading-none">
          {coupon.discount}
        </span>
        <p className="text-sm text-muted-foreground leading-relaxed">
          خصم لفترة محدودة
        </p>
      </div>
      <div className="w-full flex flex-col gap-3">
        <div className="px-4 py-3 bg-background border border-dashed border-primary/30 rounded-lg font-mono font-bold text-center tracking-widest text-primary text-base leading-snug">
          {coupon.code}
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          ينتهي في {coupon.expiry}
        </p>
      </div>
    </div>
  );
}

// --- Image Preview ---
export function ImagePreview({ src }: { src: string }) {
  return <ImageViewer src={src} alt="Property" />;
}

// --- PDF Document ---
export interface Document {
  name: string;
  size: string;
}

export function DocumentCard({ doc }: { doc: Document }) {
  return (
    <div className="flex items-center gap-4 p-4 mt-3 mb-3 w-full bg-background border border-border/50 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer group min-h-[64px]">
      <div className="h-12 w-12 shrink-0 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-500">
        <FileText className="h-5 w-5" />
      </div>
      <div className="flex flex-col flex-1 overflow-hidden gap-1">
        <span className="text-sm sm:text-base font-medium truncate group-hover:text-primary transition-colors leading-relaxed">
          {doc.name}
        </span>
        <span className="text-xs text-muted-foreground uppercase leading-relaxed">
          {doc.size}
        </span>
      </div>
      <Download className="h-5 w-5 text-muted-foreground shrink-0" />
    </div>
  );
}

// --- Property Card ---
export interface Property {
  id?: string;
  title: string;
  description?: string;
  location: string;
  price: string;
  priceNumeric?: number;
  type: "buy" | "rent";
  bedrooms?: number;
  bathrooms?: number;
  area?: string;
  areaNumeric?: number;
  image?: string;
  images?: string[];
  features?: string[];
  agentName?: string;
  agentPhone?: string;
}

interface LoanProduct {
  id: string;
  name: string;
  rate: number;
  maxYears: number;
  minDownPayment: number;
}

const LOAN_PRODUCTS: LoanProduct[] = [
  {
    id: "1",
    name: "التمويل العقاري الأساسي",
    rate: 5.0,
    maxYears: 25,
    minDownPayment: 20,
  },
  {
    id: "2",
    name: "تمويل الراجحي",
    rate: 4.75,
    maxYears: 30,
    minDownPayment: 15,
  },
  {
    id: "3",
    name: "تمويل الأهلي",
    rate: 4.5,
    maxYears: 25,
    minDownPayment: 10,
  },
  {
    id: "4",
    name: "تمويل الرياض",
    rate: 5.25,
    maxYears: 20,
    minDownPayment: 20,
  },
];

function extractPriceFromText(priceText: string): number {
  const cleanText = priceText.replace(/[^\d٠-٩.,]/g, "");
  const normalized = cleanText
    .replace(/[٠-٩]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1632 + 48))
    .replace(/,/g, "");
  const num = parseFloat(normalized);
  return isNaN(num) ? 0 : num;
}

function isValidConvexId(id: string): id is Id<"properties"> {
  return /^[a-z0-9]{31,37}$/i.test(id);
}

export function PropertyCard({ property }: { property: Property }) {
  const [expanded, setExpanded] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showLoanCalc, setShowLoanCalc] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedLoanProduct, setSelectedLoanProduct] = useState<LoanProduct>(
    LOAN_PRODUCTS[0],
  );
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [customYears, setCustomYears] = useState<number | null>(null);
  const favoritedIds = useQuery(api.features.users.favorites.listByUser) ?? [];
  const addFavorite = useMutation(api.features.users.favorites.add);
  const removeFavorite = useMutation(api.features.users.favorites.remove);

  const autoDetectedPrice = useMemo(() => {
    if (property.priceNumeric) return property.priceNumeric;
    return extractPriceFromText(property.price);
  }, [property.price, property.priceNumeric]);

  const images = useMemo(() => {
    const allImages: string[] = [];
    if (property.image) allImages.push(property.image);
    if (property.images && property.images.length > 0) {
      property.images.forEach((img) => {
        if (!allImages.includes(img)) allImages.push(img);
      });
    }
    return allImages;
  }, [property.image, property.images]);

  const propertyId =
    property.id && isValidConvexId(property.id)
      ? (property.id as Id<"properties">)
      : null;
  const isFavorited = propertyId != null && favoritedIds.includes(propertyId);
  const hasMore = !!(
    property.description ||
    property.bedrooms ||
    property.bathrooms ||
    property.area
  );

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!propertyId) return;
    try {
      if (isFavorited) {
        await removeFavorite({ propertyId });
      } else {
        await addFavorite({ propertyId });
      }
    } catch {
      // Not authenticated or error
    }
  };

  // Validate down payment percentage
  const validatedDownPaymentPercent = Math.max(
    selectedLoanProduct.minDownPayment,
    Math.min(100, downPaymentPercent),
  );

  const calculateLoan = useMemo(() => {
    const downPaymentAmount =
      autoDetectedPrice * (validatedDownPaymentPercent / 100);
    const principal = autoDetectedPrice - downPaymentAmount;
    const years = customYears ?? selectedLoanProduct.maxYears;
    const annualRate = selectedLoanProduct.rate / 100;
    const monthlyRate = annualRate / 12;
    const numPayments = years * 12;

    if (monthlyRate === 0 || principal <= 0) {
      return {
        monthly: 0,
        total: principal,
        principal,
        downPaymentAmount,
        totalWithDownPayment: autoDetectedPrice,
      };
    }

    const monthlyPayment =
      (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
      (Math.pow(1 + monthlyRate, numPayments) - 1);

    return {
      monthly: monthlyPayment,
      total: monthlyPayment * numPayments,
      principal,
      downPaymentAmount,
      totalWithDownPayment: monthlyPayment * numPayments + downPaymentAmount,
    };
  }, [
    autoDetectedPrice,
    validatedDownPaymentPercent,
    selectedLoanProduct,
    customYears,
  ]);

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleWhatsAppSales = () => {
    const message = encodeURIComponent(
      `مرحباً، أود الاستفسار عن عقار "${property.title}" في ${property.location} - السعر: ${property.price}`,
    );
    window.open(`https://wa.me/966500000000?text=${message}`, "_blank");
  };

  return (
    <>
      <div
        className="mt-3 mb-3 w-full rounded-xl overflow-hidden border border-border/50 bg-card hover:border-primary/30 hover:bg-muted/10 transition-all group min-h-[100px] cursor-pointer"
        onClick={() => setShowDetails(true)}
      >
        <div className="flex gap-4 p-4">
          {property.image && (
            <div className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-lg overflow-hidden bg-muted">
              <img
                src={property.image}
                alt={property.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          )}
          <div className="flex-1 min-w-0 flex flex-col gap-2">
            <div className="flex items-start justify-between gap-2.5">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm sm:text-base truncate leading-snug">
                  {property.title}
                </h3>
                {property.description && (
                  <p
                    className={cn(
                      "text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed",
                      !expanded && "line-clamp-1",
                    )}
                  >
                    {property.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {propertyId != null && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                    onClick={handleFavoriteClick}
                    aria-label={
                      isFavorited ? "إزالة من المفضلة" : "إضافة إلى المفضلة"
                    }
                  >
                    <Heart
                      className={cn(
                        "h-4 w-4",
                        isFavorited && "fill-primary text-primary",
                      )}
                    />
                  </Button>
                )}
                <div
                  className={cn(
                    "px-2 py-1 rounded-md text-[10px] sm:text-xs font-bold uppercase",
                    property.type === "buy"
                      ? "bg-primary/10 text-primary"
                      : "bg-emerald-500/10 text-emerald-500",
                  )}
                >
                  {property.type === "buy" ? "للبيع" : "للإيجار"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate leading-relaxed">
                {property.location}
              </span>
            </div>

            {expanded &&
              (property.bedrooms || property.bathrooms || property.area) && (
                <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                  {property.bedrooms && (
                    <div className="flex items-center gap-1.5">
                      <Bed className="h-3.5 w-3.5 shrink-0" />
                      <span className="leading-relaxed">
                        {property.bedrooms}
                      </span>
                    </div>
                  )}
                  {property.bathrooms && (
                    <div className="flex items-center gap-1.5">
                      <Bath className="h-3.5 w-3.5 shrink-0" />
                      <span className="leading-relaxed">
                        {property.bathrooms}
                      </span>
                    </div>
                  )}
                  {property.area && (
                    <div className="flex items-center gap-1.5">
                      <Square className="h-3.5 w-3.5 shrink-0" />
                      <span className="leading-relaxed">{property.area}</span>
                    </div>
                  )}
                </div>
              )}

            <div className="flex items-center justify-between gap-3 pt-1 flex-wrap">
              <span className="text-base sm:text-lg font-bold text-foreground leading-snug">
                {property.price}
              </span>
              <div className="flex items-center gap-2">
                {hasMore && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpanded((exp) => !exp);
                    }}
                    aria-expanded={expanded}
                    aria-label={expanded ? "عرض أقل" : "عرض المزيد"}
                  >
                    {expanded ? (
                      <>
                        <span>عرض أقل</span>
                        <ChevronUp className="h-3.5 w-3.5" />
                      </>
                    ) : (
                      <>
                        <span>عرض المزيد</span>
                        <ChevronDown className="h-3.5 w-3.5" />
                      </>
                    )}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 text-xs sm:text-sm px-4 shrink-0 min-w-[60px]"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDetails(true);
                  }}
                >
                  عرض
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Property Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border/30">
          <DialogHeader>
            <DialogTitle className="text-right">{property.title}</DialogTitle>
            <DialogDescription className="text-right">
              {property.location}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Property Images Swiper */}
            {images.length > 0 && (
              <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-muted">
                <img
                  src={images[currentImageIndex]}
                  alt={`${property.title} - صورة ${currentImageIndex + 1}`}
                  className="w-full h-full object-cover"
                />
                {images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {images.map((_, i) => (
                        <button
                          key={i}
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentImageIndex(i);
                          }}
                          className={cn(
                            "w-2 h-2 rounded-full transition-all",
                            i === currentImageIndex
                              ? "bg-white w-4"
                              : "bg-white/50",
                          )}
                        />
                      ))}
                    </div>
                    <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                      {currentImageIndex + 1} / {images.length}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Price & Type */}
            <div className="flex items-center justify-between">
              <div
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-bold",
                  property.type === "buy"
                    ? "bg-primary/10 text-primary"
                    : "bg-emerald-500/10 text-emerald-500",
                )}
              >
                {property.type === "buy" ? "للبيع" : "للإيجار"}
              </div>
              <div className="text-2xl font-bold text-foreground">
                {property.price}
              </div>
            </div>

            {/* Property Details */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {property.bedrooms && (
                <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-xl">
                  <Bed className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">غرف نوم</div>
                    <div className="font-semibold">{property.bedrooms}</div>
                  </div>
                </div>
              )}
              {property.bathrooms && (
                <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-xl">
                  <Bath className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">
                      دورات مياه
                    </div>
                    <div className="font-semibold">{property.bathrooms}</div>
                  </div>
                </div>
              )}
              {property.area && (
                <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-xl">
                  <Square className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">المساحة</div>
                    <div className="font-semibold">{property.area}</div>
                  </div>
                </div>
              )}
              {property.areaNumeric && (
                <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-xl">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">
                      متر مربع
                    </div>
                    <div className="font-semibold">
                      {property.areaNumeric} م²
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            {property.description && (
              <div>
                <h4 className="font-semibold mb-2 text-right">الوصف</h4>
                <p className="text-muted-foreground text-sm leading-relaxed text-right">
                  {property.description}
                </p>
              </div>
            )}

            {/* Features */}
            {property.features && property.features.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 text-right">المميزات</h4>
                <div className="flex flex-wrap gap-2">
                  {property.features.map((feature, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 bg-muted/30 text-sm rounded-full"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Agent Info */}
            {(property.agentName || property.agentPhone) && (
              <div className="p-4 bg-muted/20 rounded-xl border border-border/20">
                <h4 className="font-semibold mb-3 text-right">
                  معلومات الوكيل
                </h4>
                {property.agentName && (
                  <p className="text-sm text-muted-foreground">
                    {property.agentName}
                  </p>
                )}
                {property.agentPhone && (
                  <a
                    href={`tel:${property.agentPhone}`}
                    className="flex items-center gap-2 text-primary text-sm mt-2"
                  >
                    <Phone className="h-4 w-4" />
                    {property.agentPhone}
                  </a>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button
                className="h-12 gap-2"
                onClick={() => {
                  setShowDetails(false);
                  setShowLoanCalc(true);
                }}
              >
                <Calculator className="h-5 w-5" />
                حاسبة القرض
              </Button>
              <Button
                variant="outline"
                className="h-12 gap-2"
                onClick={handleWhatsAppSales}
              >
                <Users className="h-5 w-5" />
                فريق المبيعات
              </Button>
            </div>
            <Button
              variant="secondary"
              className="w-full h-12 gap-2"
              onClick={() => {
                // TODO: Implement order/reserve
              }}
            >
              <ShoppingCart className="h-5 w-5" />
              {property.type === "buy" ? "احجز موعد المعاينة" : "طلب الاستئجار"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Loan Calculator Dialog */}
      <Dialog open={showLoanCalc} onOpenChange={setShowLoanCalc}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-right flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              حاسبة القرض
            </DialogTitle>
            <DialogDescription className="text-right">
              احسب القسط الشهري لتمويل عقار أحلامك
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-3 bg-muted/30 rounded-xl">
              <div className="text-xs text-muted-foreground mb-1">
                سعر العقار
              </div>
              <div className="text-xl font-bold text-foreground">
                {autoDetectedPrice.toLocaleString("ar-SA")} ريال
              </div>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-2 block text-right">
                اختر منتج التمويل
              </label>
              <select
                value={selectedLoanProduct.id}
                onChange={(e) => {
                  const product =
                    LOAN_PRODUCTS.find((p) => p.id === e.target.value) ||
                    LOAN_PRODUCTS[0];
                  setSelectedLoanProduct(product);
                  // Reset to minimum if current is below minimum
                  if (downPaymentPercent < product.minDownPayment) {
                    setDownPaymentPercent(product.minDownPayment);
                  }
                }}
                className="w-full p-3 bg-muted rounded-xl text-right border border-border/50 focus:border-primary/50"
              >
                {LOAN_PRODUCTS.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} - {product.rate}% لمدة {product.maxYears} سنة
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-2 block text-right flex justify-between">
                <span>نسبة الدفعة الأولى</span>
                <span className="font-bold text-foreground">
                  {validatedDownPaymentPercent}%
                </span>
              </label>
              <input
                type="range"
                min={selectedLoanProduct.minDownPayment}
                max={100}
                step={5}
                value={validatedDownPaymentPercent}
                onChange={(e) =>
                  setDownPaymentPercent(parseInt(e.target.value))
                }
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{selectedLoanProduct.minDownPayment}%</span>
                <span>
                  {calculateLoan.downPaymentAmount?.toLocaleString("ar-SA", {
                    maximumFractionDigits: 0,
                  })}{" "}
                  ريال
                </span>
                <span>100%</span>
              </div>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-2 block text-right flex justify-between">
                <span>مدة القرض</span>
                <span className="font-bold text-foreground">
                  {customYears ?? selectedLoanProduct.maxYears} سنة
                </span>
              </label>
              <div className="flex gap-2">
                {[5, 10, 15, 20, 25, 30]
                  .filter((y) => y <= selectedLoanProduct.maxYears)
                  .map((year) => (
                    <button
                      key={year}
                      type="button"
                      onClick={() => setCustomYears(year)}
                      className={cn(
                        "flex-1 py-2 rounded-lg text-sm font-medium transition-colors",
                        (customYears ?? selectedLoanProduct.maxYears) === year
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted hover:bg-muted/70",
                      )}
                    >
                      {year}
                    </button>
                  ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-muted/30 rounded-xl text-center">
                <div className="text-xs text-muted-foreground">
                  الفائدة السنوية
                </div>
                <div className="text-lg font-bold text-foreground">
                  {selectedLoanProduct.rate}%
                </div>
              </div>
              <div className="p-3 bg-muted/30 rounded-xl text-center">
                <div className="text-xs text-muted-foreground">
                  مبلغ التمويل
                </div>
                <div className="text-lg font-bold text-foreground">
                  {calculateLoan.principal.toLocaleString("ar-SA", {
                    maximumFractionDigits: 0,
                  })}
                </div>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-l from-primary/20 to-primary/5 rounded-xl">
              <div className="text-center mb-3">
                <div className="text-sm text-muted-foreground mb-1">
                  القسط الشهري
                </div>
                <div className="text-3xl font-bold text-primary">
                  {calculateLoan.monthly.toLocaleString("ar-SA", {
                    maximumFractionDigits: 0,
                  })}{" "}
                  ريال
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="bg-muted/30 rounded-lg p-2">
                  <span className="text-muted-foreground">
                    إجمالي الفائدة:{" "}
                  </span>
                  <span className="font-semibold text-foreground">
                    {(
                      calculateLoan.total - calculateLoan.principal
                    ).toLocaleString("ar-SA", {
                      maximumFractionDigits: 0,
                    })}{" "}
                    ريال
                  </span>
                </div>
                <div className="bg-muted/30 rounded-lg p-2">
                  <span className="text-muted-foreground">إجمالي المبلغ: </span>
                  <span className="font-semibold text-foreground">
                    {calculateLoan.totalWithDownPayment?.toLocaleString(
                      "ar-SA",
                      { maximumFractionDigits: 0 },
                    )}{" "}
                    ريال
                  </span>
                </div>
              </div>
            </div>

            <Button className="w-full h-12 gap-2" onClick={handleWhatsAppSales}>
              <Users className="h-5 w-5" />
              تواصل مع فريق المبيعات
            </Button>

            <div className="text-xs text-muted-foreground text-center">
              * الحساب تقريبي وقد يختلف حسب شروط البنك
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// --- Bank Card ---
export interface Bank {
  name: string;
  product?: string;
  contactEmail?: string;
  description?: string;
}

export function BankCard({ bank }: { bank: Bank }) {
  const [expanded, setExpanded] = useState(false);
  const hasMore = !!(bank.description || bank.contactEmail);

  return (
    <div
      className="mt-3 mb-3 p-4 sm:p-5 rounded-xl border border-border/50 bg-card hover:border-primary/30 hover:bg-muted/10 transition-all min-h-[80px] cursor-default"
      role="group"
    >
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          <Building2 className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <h3 className="font-semibold text-sm truncate">{bank.name}</h3>
          {bank.product && (
            <p className="text-xs text-primary">{bank.product}</p>
          )}
          {bank.description && (
            <p
              className={cn(
                "text-xs text-muted-foreground mt-1",
                !expanded && "line-clamp-1",
              )}
            >
              {bank.description}
            </p>
          )}
          {expanded && bank.contactEmail && (
            <p className="text-xs text-muted-foreground truncate mt-1">
              {bank.contactEmail}
            </p>
          )}
          {hasMore && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 mt-1 w-fit text-xs text-muted-foreground hover:text-foreground gap-1 -ms-1"
              onClick={() => setExpanded((e) => !e)}
              aria-expanded={expanded}
              aria-label={expanded ? "عرض أقل" : "عرض المزيد"}
            >
              {expanded ? (
                <>
                  <span>عرض أقل</span>
                  <ChevronUp className="h-3.5 w-3.5" />
                </>
              ) : (
                <>
                  <span>عرض المزيد</span>
                  <ChevronDown className="h-3.5 w-3.5" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Bank List ---
export function BankList({ banks }: { banks: Bank[] }) {
  const list = Array.isArray(banks) ? banks : [];
  return (
    <div className="flex flex-col gap-3 w-full mt-3 mb-3">
      {list.map((bank, i) => (
        <BankCard key={i} bank={bank} />
      ))}
    </div>
  );
}

// --- Property List ---
export function PropertyList({ properties }: { properties: Property[] }) {
  const list = Array.isArray(properties) ? properties : [];
  return (
    <div className="flex flex-col gap-3 w-full mt-3 mb-3">
      {list.map((property, i) => (
        <PropertyCard key={property?.id || i} property={property} />
      ))}
    </div>
  );
}

// --- Purposive (goal-oriented) summary ---
export interface PurposiveSummaryData {
  title: string;
  summary?: string;
  count?: number;
  ctaLabel?: string;
  ctaAction?: () => void;
}

export function PurposiveSummary({ data }: { data: PurposiveSummaryData }) {
  return (
    <div className="mt-3 mb-3 p-4 rounded-xl border border-primary/20 bg-primary/5 w-full">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          <CheckCircle className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm sm:text-base text-foreground">
            {data.title}
          </h3>
          {data.summary && (
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
              {data.summary}
            </p>
          )}
          {data.count != null && (
            <p className="text-xs text-primary mt-1">العدد: {data.count}</p>
          )}
          {data.ctaLabel && (
            <Button
              size="sm"
              variant="outline"
              className="mt-3 h-8 text-xs"
              onClick={data.ctaAction}
            >
              {data.ctaLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Extra (supplementary content: links, docs, attachments) ---
export interface ExtraContentItem {
  label: string;
  href?: string;
  type?: "link" | "document" | "image";
}

export function ExtraContentCard({ items }: { items: ExtraContentItem[] }) {
  const list = Array.isArray(items) ? items : [];
  return (
    <div className="mt-3 mb-3 flex flex-col gap-2 w-full">
      {list.map((item, i) => (
        <a
          key={i}
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-card hover:border-primary/30 hover:bg-muted/30 transition-colors"
        >
          <Link2 className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="text-sm font-medium truncate">{item.label}</span>
          <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </a>
      ))}
    </div>
  );
}

// --- Service Card ---
export interface Service {
  id?: string;
  title: string;
  description: string;
  icon?: string;
  category?: string;
}

export function ServiceCard({ service }: { service: Service }) {
  const [expanded, setExpanded] = useState(false);
  const hasLongDescription = service.description.length > 120;

  return (
    <div className="mt-3 mb-3 p-4 sm:p-5 rounded-xl border border-border/50 bg-card hover:border-primary/30 hover:bg-muted/30 transition-all cursor-pointer group min-h-[80px]">
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="h-10 w-10 sm:h-12 sm:w-12 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" />
        </div>
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <h3 className="font-semibold text-sm sm:text-base leading-snug">
            {service.title}
          </h3>
          <p
            className={cn(
              "text-xs sm:text-sm text-muted-foreground leading-relaxed",
              !expanded && hasLongDescription && "line-clamp-2",
            )}
          >
            {service.description}
          </p>
          {service.category && (
            <span className="inline-block mt-1 px-2.5 py-1 text-xs rounded-md bg-muted text-muted-foreground leading-relaxed">
              {service.category}
            </span>
          )}
          {hasLongDescription && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 w-fit text-xs text-muted-foreground hover:text-foreground gap-1 -ms-1"
              onClick={() => setExpanded((e) => !e)}
              aria-expanded={expanded}
              aria-label={expanded ? "عرض أقل" : "عرض المزيد"}
            >
              {expanded ? (
                <>
                  <span>عرض أقل</span>
                  <ChevronUp className="h-3.5 w-3.5" />
                </>
              ) : (
                <>
                  <span>عرض المزيد</span>
                  <ChevronDown className="h-3.5 w-3.5" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Offer Card ---
export interface Offer {
  id?: string;
  title: string;
  description?: string;
  discount?: string;
  originalPrice?: string;
  discountedPrice?: string;
  validUntil?: string;
  code?: string;
  type?: "discount" | "cashback" | "free_service" | "special";
  bankName?: string;
  propertyType?: "buy" | "rent" | "both";
  minAmount?: number;
  image?: string;
}

export function OfferCard({ offer }: { offer: Offer }) {
  const [showCode, setShowCode] = useState(false);

  const typeColors = {
    discount: "from-red-500/20 to-red-600/10 text-red-400",
    cashback: "from-green-500/20 to-green-600/10 text-green-400",
    free_service: "from-blue-500/20 to-blue-600/10 text-blue-400",
    special: "from-purple-500/20 to-purple-600/10 text-purple-400",
  };

  const typeLabels = {
    discount: "خصم",
    cashback: "استرداد",
    free_service: "خدمة مجانية",
    special: "عرض خاص",
  };

  return (
    <div className="mt-3 mb-3 w-full rounded-2xl overflow-hidden border border-border/50 bg-card hover:border-primary/30 transition-all">
      {offer.image && (
        <div className="w-full h-32 bg-muted">
          <img
            src={offer.image}
            alt={offer.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {offer.type && (
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-l",
                    typeColors[offer.type],
                  )}
                >
                  {typeLabels[offer.type]}
                </span>
              )}
              {offer.bankName && (
                <span className="text-xs text-muted-foreground">
                  {offer.bankName}
                </span>
              )}
            </div>
            <h3 className="font-semibold text-foreground">{offer.title}</h3>
          </div>
          {offer.discount && (
            <div className="text-2xl font-bold text-primary">
              {offer.discount}
            </div>
          )}
        </div>
        {offer.description && (
          <p className="text-sm text-muted-foreground mb-3">
            {offer.description}
          </p>
        )}
        {(offer.originalPrice || offer.discountedPrice) && (
          <div className="flex items-center gap-3 mb-3">
            {offer.originalPrice && (
              <span className="text-sm text-muted-foreground line-through">
                {offer.originalPrice}
              </span>
            )}
            {offer.discountedPrice && (
              <span className="text-lg font-bold text-foreground">
                {offer.discountedPrice}
              </span>
            )}
          </div>
        )}
        <div className="flex items-center justify-between gap-3">
          {offer.validUntil && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock4 className="h-3 w-3" />
              <span>صالح حتى {offer.validUntil}</span>
            </div>
          )}
          {offer.code && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-1"
              onClick={() => {
                navigator.clipboard.writeText(offer.code!);
                setShowCode(true);
                setTimeout(() => setShowCode(false), 2000);
              }}
            >
              <Gift className="h-3 w-3" />
              {showCode ? "تم النسخ!" : "كود الخصم"}
            </Button>
          )}
        </div>
        {offer.minAmount && (
          <div className="mt-2 text-xs text-muted-foreground">
            الحد الأدنى: {offer.minAmount.toLocaleString("ar-SA")} ريال
          </div>
        )}
      </div>
    </div>
  );
}

export function OfferList({ offers }: { offers: Offer[] }) {
  const list = Array.isArray(offers) ? offers : [];
  return (
    <div className="flex flex-col gap-3 w-full mt-3 mb-3">
      {list.map((offer, i) => (
        <OfferCard key={offer.id || i} offer={offer} />
      ))}
    </div>
  );
}

// --- Loan Calculator Card (for AI responses) ---
export interface LoanCalculationData {
  propertyPrice: number;
  downPaymentPercent?: number;
  downPaymentAmount?: number;
  loanProduct?: string;
  loanPeriodYears?: number;
  interestRate?: number;
  monthlyPayment?: number;
  totalAmount?: number;
}

export function LoanCalculatorCard({ data }: { data: LoanCalculationData }) {
  const {
    propertyPrice,
    downPaymentPercent = 20,
    downPaymentAmount,
    loanProduct = "التمويل العقاري الأساسي",
    loanPeriodYears = 25,
    interestRate = 5,
    monthlyPayment,
    totalAmount,
  } = data;
  const actualDownPayment =
    downPaymentAmount || (propertyPrice * downPaymentPercent) / 100;
  const principal = propertyPrice - actualDownPayment;
  const calculatedMonthly =
    monthlyPayment ||
    (() => {
      const monthlyRate = interestRate / 100 / 12;
      const numPayments = loanPeriodYears * 12;
      if (monthlyRate === 0) return principal / numPayments;
      return (
        (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
        (Math.pow(1 + monthlyRate, numPayments) - 1)
      );
    })();

  return (
    <div className="mt-3 mb-3 w-full rounded-2xl border border-border/50 bg-gradient-to-b from-card to-muted/20 overflow-hidden">
      <div className="p-4 border-b border-border/30 bg-gradient-to-l from-primary/10 to-transparent">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/20">
            <Calculator className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">حساب القرض</h3>
            <p className="text-xs text-muted-foreground">{loanProduct}</p>
          </div>
        </div>
      </div>
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-muted/30 rounded-xl">
            <div className="text-xs text-muted-foreground mb-1">سعر العقار</div>
            <div className="font-bold text-foreground">
              {propertyPrice.toLocaleString("ar-SA")} ريال
            </div>
          </div>
          <div className="p-3 bg-muted/30 rounded-xl">
            <div className="text-xs text-muted-foreground mb-1">
              الدفعة الأولى
            </div>
            <div className="font-bold text-foreground">
              {actualDownPayment.toLocaleString("ar-SA")} ريال
              <span className="text-xs text-muted-foreground mr-1">
                ({downPaymentPercent}%)
              </span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 bg-muted/20 rounded-lg">
            <div className="text-xs text-muted-foreground">مدة القرض</div>
            <div className="font-semibold">{loanPeriodYears} سنة</div>
          </div>
          <div className="p-2 bg-muted/20 rounded-lg">
            <div className="text-xs text-muted-foreground">الفائدة</div>
            <div className="font-semibold">{interestRate}%</div>
          </div>
          <div className="p-2 bg-muted/20 rounded-lg">
            <div className="text-xs text-muted-foreground">مبلغ التمويل</div>
            <div className="font-semibold text-sm">
              {principal.toLocaleString("ar-SA", { maximumFractionDigits: 0 })}
            </div>
          </div>
        </div>
        <div className="p-4 bg-gradient-to-l from-primary/20 to-primary/5 rounded-xl text-center">
          <div className="text-sm text-muted-foreground mb-1">القسط الشهري</div>
          <div className="text-3xl font-bold text-primary">
            {calculatedMonthly.toLocaleString("ar-SA", {
              maximumFractionDigits: 0,
            })}{" "}
            ريال
          </div>
          {totalAmount && (
            <div className="text-xs text-muted-foreground mt-2">
              إجمالي: {totalAmount.toLocaleString("ar-SA")} ريال
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground text-center">
          * الحساب تقريبي. تواصل مع البنك للحصول على الشروط الدقيقة.
        </p>
      </div>
    </div>
  );
}
