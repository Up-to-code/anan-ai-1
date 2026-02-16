"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { User, Mail, Phone, MapPin, Calendar, LogOut, Save, Lock, Upload, X, CheckCircle2, AlertCircle, ArrowRight, Zap } from "lucide-react";
import { useAuth, useProfile } from "@/hooks";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { ImageCropDialog } from "@/components/ui/image-crop-dialog";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { profile, isLoading, error, updateProfile, uploadAvatar, removeAvatar, changePassword, getActivity } = useProfile();
  
  const [activeTab, setActiveTab] = useState<"general" | "security" | "history" | "avatar">("general");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // Form states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  
  // Password form states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Activity states
  const [activity, setActivity] = useState<Array<{ timestamp: string; ip: string; userAgent: string; device: string }>>([]);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const activityLoadedRef = useRef(false);
  
  // Notification states
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);
  
  // Crop dialog states
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  
  // Confirmation dialog states
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmDialogConfig, setConfirmDialogConfig] = useState<{
    title: string;
    description: string;
    onConfirm: () => void;
  } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize form with profile data
  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setPhone(profile.phone || "");
      setLocation(profile.location || "");
      setAvatarPreview(profile.avatar || null);
    }
  }, [profile]);

  const loadActivity = useCallback(async (force = false) => {
    if (!force && activityLoadedRef.current) return;
    
    setLoadingActivity(true);
    try {
      const data = await getActivity(force);
      setActivity(data);
      activityLoadedRef.current = true;
    } catch (err) {
      console.error("Error loading activity:", err);
    } finally {
      setLoadingActivity(false);
    }
  }, [getActivity]);

  // Load activity when history tab is active
  useEffect(() => {
    if (activeTab === "history" && !activityLoadedRef.current) {
      loadActivity(false);
    }
  }, [activeTab, loadActivity]);

  // Reset activity loaded flag when tab changes away from history
  useEffect(() => {
    if (activeTab !== "history") {
      activityLoadedRef.current = false;
    }
  }, [activeTab]);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleSave = async () => {
    if (!profile) return;
    
    setIsSaving(true);
    try {
      const success = await updateProfile({
        name: name !== profile.name ? name : undefined,
        phone: phone !== profile.phone ? phone : undefined,
        location: location !== profile.location ? location : undefined,
      });
      
      if (success) {
        showNotification("success", "تم حفظ التغييرات بنجاح");
      } else {
        showNotification("error", "فشل حفظ التغييرات");
      }
    } catch {
      showNotification("error", "حدث خطأ أثناء الحفظ");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showNotification("error", "الملف يجب أن يكون صورة");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showNotification("error", "حجم الصورة يجب أن يكون أقل من 5 ميجابايت");
      return;
    }

    // Read file and show crop dialog
    const reader = new FileReader();
    reader.onloadend = () => {
      const imageSrc = reader.result as string;
      setImageToCrop(imageSrc);
      setCropDialogOpen(true);
    };
    reader.readAsDataURL(file);

    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCropComplete = useCallback((croppedImageUrl: string) => {
    // Set the cropped image as preview (this is a blob URL that will be cleaned up on upload)
    setAvatarPreview(croppedImageUrl);
    setImageToCrop(null);
  }, []);

  const handleSaveAvatar = async () => {
    setIsUploading(true);
    
    try {
      if (!avatarPreview) {
        // Removing avatar
        const success = await removeAvatar();
        if (success) {
          showNotification("success", "تم إزالة الصورة بنجاح");
          setAvatarPreview(null);
        } else {
          showNotification("error", "فشل إزالة الصورة");
        }
      } else {
        // Uploading new avatar
        // Convert blob URL to File
        const response = await fetch(avatarPreview);
        const blob = await response.blob();
        const file = new File([blob], "avatar.jpg", { type: blob.type });

        const success = await uploadAvatar(file);
        if (success) {
          showNotification("success", "تم حفظ الصورة بنجاح");
          // Clean up blob URL after successful upload
          if (avatarPreview.startsWith("blob:")) {
            URL.revokeObjectURL(avatarPreview);
          }
        } else {
          showNotification("error", "فشل حفظ الصورة");
          setAvatarPreview(profile?.avatar || null);
        }
      }
    } catch (error) {
      console.error("Error saving avatar:", error);
      showNotification("error", "حدث خطأ أثناء حفظ الصورة");
      setAvatarPreview(profile?.avatar || null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveAvatar = () => {
    setConfirmDialogConfig({
      title: "إزالة الصورة الشخصية",
      description: "هل أنت متأكد من إزالة الصورة الشخصية؟",
      onConfirm: async () => {
        try {
          setIsUploading(true);
          const success = await removeAvatar();
          if (success) {
            setAvatarPreview(null);
            showNotification("success", "تم إزالة الصورة بنجاح");
          } else {
            showNotification("error", "فشل إزالة الصورة");
          }
        } catch (error) {
          console.error("Error removing avatar:", error);
          showNotification("error", "حدث خطأ أثناء إزالة الصورة");
        } finally {
          setIsUploading(false);
        }
      },
    });
    setConfirmDialogOpen(true);
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      showNotification("error", "كلمات المرور غير متطابقة");
      return;
    }

    if (newPassword.length < 8) {
      showNotification("error", "كلمة المرور يجب أن تكون 8 أحرف على الأقل");
      return;
    }

    setIsChangingPassword(true);
    try {
      const success = await changePassword(currentPassword, newPassword);
      if (success) {
        showNotification("success", "تم تغيير كلمة المرور بنجاح");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        showNotification("error", "فشل تغيير كلمة المرور. تحقق من كلمة المرور الحالية");
      }
    } catch {
      showNotification("error", "حدث خطأ أثناء تغيير كلمة المرور");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  // Calculate completion percentage (better calculation)
  const completion = profile
    ? Math.round(
        ((profile.name ? 1 : 0) +
          (profile.email ? 1 : 0) +
          (profile.phone ? 1 : 0) +
          (profile.location ? 1 : 0) +
          (profile.avatar ? 1 : 0)) *
          (100 / 5)
      )
    : 0;

  // Calculate tokens percentage
  const tokensUsed = profile?.tokensUsed || 0;
  const tokensLimit = profile?.tokensLimit || (profile?.plan === "paid" ? 100000 : 1000000);
  const tokensPercentage = tokensLimit > 0 ? Math.min((tokensUsed / tokensLimit) * 100, 100) : 0;
  const tokensRemaining = Math.max(0, tokensLimit - tokensUsed);
  
  // Format numbers to always show full number with commas (e.g., 1,000,000)
  const formatTokenNumber = (num: number) => {
    return num.toLocaleString('en-US', { maximumFractionDigits: 0 });
  };

  if (isLoading) {
    return null; // Will show loading.tsx
  }

  if (error && !profile) {
    return null; // Will show error.tsx
  }

  const displayName = profile?.name || user?.name || "User";
  const displayEmail = profile?.email || user?.email || "";
  const displayAvatar = avatarPreview || profile?.avatar || user?.image || "";
  
  // Generate initials from name (handle edge cases)
  const getInitials = (name: string): string => {
    if (!name || name.trim().length === 0) return "U";
    const parts = name.trim().split(/\s+/).filter((p) => p.length > 0);
    if (parts.length === 0) return "U";
    if (parts.length === 1) return parts[0][0]?.toUpperCase() || "U";
    return (parts[0][0]?.toUpperCase() || "") + (parts[parts.length - 1][0]?.toUpperCase() || "");
  };
  
  const userInitials = getInitials(displayName);

  return (
    <div className="flex min-h-dvh bg-background" dir="rtl">
      {/* Notification Toast - Bottom */}
      {notification && (
        <div
          className={cn(
            "fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-xl border p-4 animate-in slide-in-from-bottom backdrop-blur-sm max-w-[500px] w-full mx-4",
            notification.type === "success"
              ? "bg-green-500/10 dark:bg-green-500/10 border-green-500/20 dark:border-green-500/20 text-green-600 dark:text-green-400"
              : "bg-red-500/10 dark:bg-red-500/10 border-red-500/20 dark:border-red-500/20 text-red-600 dark:text-red-400"
          )}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0" />
          )}
          <span className="flex-1 font-medium text-sm">{notification.message}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 hover:bg-muted shrink-0"
            onClick={() => setNotification(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">الملف الشخصي</h1>
            <p className="text-muted-foreground">إدارة معلوماتك الشخصية وإعدادات الأمان</p>
          </div>
          <Button
            onClick={() => router.push("/chat/new")}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <ArrowRight className="ml-2 h-4 w-4" />
            العودة للمحادثة
          </Button>
        </div>

        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          {/* Sidebar / Profile Card */}
          <div className="space-y-6">
            <div className="p-6 rounded-2xl border border-border bg-card space-y-6 backdrop-blur-sm">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setActiveTab("avatar")}
                    className="relative cursor-pointer group"
                    title="انقر لتغيير الصورة"
                  >
                    <Avatar className="h-24 w-24 border-4 border-background group-hover:ring-2 group-hover:ring-primary transition-all">
                      <AvatarImage src={displayAvatar || undefined} alt={displayName} />
                      <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 border-4 border-background rounded-full" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                    id="avatar-upload"
                  />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">{displayName}</h2>
                  <p className="text-sm text-muted-foreground">
                    {profile?.plan === "paid" ? "عضو Pro Plan" : "عضو مجاني"}
                  </p>
                </div>
              </div>

              <Separator className="bg-border" />

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">اكتمال الملف</span>
                    <span className="font-medium text-foreground">{completion}%</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-500"
                      style={{ width: `${completion}%` }}
                    />
                  </div>
                </div>

                {/* Tokens Usage */}
                <div className="space-y-2 pt-2 border-t border-border">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" />
                      <span className="text-muted-foreground font-medium">استخدام الرموز</span>
                    </div>
                    <span className="font-bold text-foreground">
                      {formatTokenNumber(tokensUsed)} / {formatTokenNumber(tokensLimit)}
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full transition-all duration-500",
                        tokensPercentage >= 90
                          ? "bg-red-600 dark:bg-red-600"
                          : tokensPercentage >= 70
                          ? "bg-amber-500 dark:bg-amber-500"
                          : "bg-primary"
                      )}
                      style={{ width: `${tokensPercentage}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <p className={cn(
                      "font-medium",
                      tokensPercentage >= 90
                        ? "text-red-600 dark:text-red-400"
                        : tokensPercentage >= 70
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-primary"
                    )}>
                      {tokensPercentage >= 90
                        ? "استهلاك عالي"
                        : tokensPercentage >= 70
                        ? "استهلاك متوسط"
                        : "استهلاك منخفض"}
                    </p>
                    <p className="text-muted-foreground">
                      متبقي: {formatTokenNumber(tokensRemaining)}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{displayEmail}</span>
                  </div>
                  {profile?.phone && (
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>{profile.phone}</span>
                    </div>
                  )}
                  {profile?.location && (
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{profile.location}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex flex-col space-y-1">
              <Button
                variant={activeTab === "general" ? "default" : "ghost"}
                className={cn(
                  "justify-start h-10 text-right",
                  activeTab === "general"
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
                onClick={() => setActiveTab("general")}
              >
                <User className="ml-2 h-4 w-4" />
                المعلومات العامة
              </Button>
              <Button
                variant={activeTab === "security" ? "default" : "ghost"}
                className={cn(
                  "justify-start h-10 text-right",
                  activeTab === "security"
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
                onClick={() => setActiveTab("security")}
              >
                <Lock className="ml-2 h-4 w-4" />
                الأمان وكلمة المرور
              </Button>
              <Button
                variant={activeTab === "avatar" ? "default" : "ghost"}
                className={cn(
                  "justify-start h-10 text-right",
                  activeTab === "avatar"
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
                onClick={() => setActiveTab("avatar")}
              >
                <Upload className="ml-2 h-4 w-4" />
                الصورة الشخصية
              </Button>
              <Button
                variant={activeTab === "history" ? "default" : "ghost"}
                className={cn(
                  "justify-start h-10 text-right",
                  activeTab === "history"
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
                onClick={() => setActiveTab("history")}
              >
                <Calendar className="ml-2 h-4 w-4" />
                سجل النشاط
              </Button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:border-r lg:pr-8 lg:border-border space-y-6">
            {activeTab === "general" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Token Usage Chart Card - Interactive */}
                <div className="p-6 rounded-2xl border border-border bg-card backdrop-blur-sm hover:border-primary/50 transition-all cursor-pointer group">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-primary group-hover:text-primary/80 transition-colors" />
                      <h3 className="text-lg font-semibold text-foreground">استخدام الرموز</h3>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary border border-primary/30">
                      {profile?.plan === "paid" ? "خطة Pro" : "خطة مجانية"}
                    </span>
                  </div>
                  
                  {/* Circular Progress Chart */}
                  <div className="flex items-center justify-center mb-6">
                    <div className="relative w-32 h-32">
                      <svg className="transform -rotate-90 w-32 h-32">
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="none"
                          className="text-muted"
                        />
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="none"
                          strokeDasharray={`${2 * Math.PI * 56}`}
                          strokeDashoffset={`${2 * Math.PI * 56 * (1 - tokensPercentage / 100)}`}
                          strokeLinecap="round"
                          className={cn(
                            "transition-all duration-1000 ease-out",
                            tokensPercentage >= 90
                              ? "text-red-600 dark:text-red-600"
                              : tokensPercentage >= 70
                              ? "text-amber-500 dark:text-amber-500"
                              : "text-primary"
                          )}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold text-foreground">
                          {tokensPercentage.toFixed(1)}%
                        </span>
                        <span className="text-xs text-muted-foreground">مستخدم</span>
                      </div>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-muted/50 border border-border hover:bg-muted transition-colors">
                      <div className="text-xs text-muted-foreground mb-1">المستخدم</div>
                      <div className="text-lg font-bold text-foreground">
                        {formatTokenNumber(tokensUsed)}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/50 border border-border hover:bg-muted transition-colors">
                      <div className="text-xs text-muted-foreground mb-1">الحد الأقصى</div>
                      <div className="text-lg font-bold text-foreground">
                        {formatTokenNumber(tokensLimit)}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/50 border border-border hover:bg-muted transition-colors">
                      <div className="text-xs text-muted-foreground mb-1">المتبقي</div>
                      <div className={cn(
                        "text-lg font-bold",
                        tokensRemaining < tokensLimit * 0.1
                          ? "text-red-600 dark:text-red-400"
                          : tokensRemaining < tokensLimit * 0.3
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-primary"
                      )}>
                        {formatTokenNumber(tokensRemaining)}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="h-4 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full transition-all duration-1000 ease-out relative overflow-hidden",
                          tokensPercentage >= 90
                            ? "bg-gradient-to-r from-red-600 to-red-500 dark:from-red-600 dark:to-red-500"
                            : tokensPercentage >= 70
                            ? "bg-gradient-to-r from-amber-500 to-amber-400 dark:from-amber-500 dark:to-amber-400"
                            : "bg-gradient-to-r from-primary to-primary/80"
                        )}
                        style={{ width: `${tokensPercentage}%` }}
                      >
                        <div className="absolute inset-0 bg-white/10 dark:bg-white/5 animate-pulse" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                      <span>0</span>
                      <span className={cn(
                        "font-medium",
                        tokensPercentage >= 90
                          ? "text-red-600 dark:text-red-400"
                          : tokensPercentage >= 70
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-primary"
                      )}>
                        {tokensPercentage >= 90
                          ? "استهلاك عالي"
                          : tokensPercentage >= 70
                          ? "استهلاك متوسط"
                          : "استهلاك منخفض"}
                      </span>
                      <span>{formatTokenNumber(tokensLimit)}</span>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 p-6 rounded-2xl border border-border bg-card backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-foreground">تعديل المعلومات</h3>
                    <Save className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="profile-name" className="text-foreground">الاسم</Label>
                      <Input
                        id="profile-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={isSaving || isUploading}
                        className="bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="profile-email" className="text-foreground">البريد الإلكتروني</Label>
                      <Input
                        id="profile-email"
                        type="email"
                        value={displayEmail}
                        disabled
                        className="bg-muted border-border text-muted-foreground"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="profile-phone" className="text-foreground">رقم الهاتف</Label>
                      <Input
                        id="profile-phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+966 50 123 4567"
                        disabled={isSaving || isUploading}
                        className="bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="profile-location" className="text-foreground">الموقع</Label>
                      <Input
                        id="profile-location"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="الرياض، السعودية"
                        disabled={isSaving || isUploading}
                        className="bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end pt-4">
                    <Button 
                      onClick={handleSave} 
                      disabled={isSaving || isUploading}
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      {isSaving ? "جاري الحفظ..." : "حفظ التغييرات"}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "avatar" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="p-6 rounded-2xl border border-border bg-card backdrop-blur-sm space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-foreground">الصورة الشخصية</h3>
                    <span className="text-xs text-muted-foreground">يمكنك رفع صورة شخصية أو استخدام الأحرف الأولى من اسمك</span>
                  </div>

                  {/* Current Avatar Preview */}
                  <div className="flex flex-col items-center space-y-4 py-6">
                    <div className="relative">
                      <Avatar className="h-32 w-32 border-4 border-background">
                        <AvatarImage src={avatarPreview || profile?.avatar || undefined} alt={displayName} />
                        <AvatarFallback className="text-4xl font-bold bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
                          {userInitials}
                        </AvatarFallback>
                      </Avatar>
                      {avatarPreview && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 border-4 border-background rounded-full" />
                      )}
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-foreground">{displayName}</p>
                      <p className="text-xs text-muted-foreground">
                        {avatarPreview || profile?.avatar ? "صورة مرفوعة" : "استخدام الأحرف الأولى"}
                      </p>
                    </div>
                  </div>

                  {/* Upload Section */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="avatar-upload-input" className="text-foreground">
                        رفع صورة جديدة
                      </Label>
                      <div className="flex items-center gap-4">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          className="hidden"
                          id="avatar-upload-input"
                          disabled={isUploading}
                        />
                        <label
                          htmlFor="avatar-upload-input"
                          className={cn(
                            "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed transition-all cursor-pointer",
                            isUploading
                              ? "border-muted bg-muted/50 cursor-not-allowed"
                              : "border-primary/50 bg-primary/10 hover:border-primary hover:bg-primary/20"
                          )}
                        >
                          <Upload className={cn(
                            "h-5 w-5",
                            isUploading ? "text-muted-foreground" : "text-primary"
                          )} />
                          <span className={cn(
                            "text-sm font-medium",
                            isUploading ? "text-muted-foreground" : "text-primary"
                          )}>
                            {isUploading ? "جاري الرفع..." : "اختر صورة"}
                          </span>
                        </label>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        الحد الأقصى لحجم الصورة: 5 ميجابايت. الصيغ المدعومة: JPG, PNG, GIF, WebP
                      </p>
                    </div>

                    {/* Remove Avatar Button */}
                    {(avatarPreview || profile?.avatar) && (
                      <div className="pt-4 border-t border-border">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleRemoveAvatar}
                          disabled={isUploading}
                          className="w-full border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50"
                        >
                          <X className="ml-2 h-4 w-4" />
                          إزالة الصورة
                        </Button>
                      </div>
                    )}

                    {/* Save/Remove Button */}
                    {(avatarPreview !== (profile?.avatar || null)) && (
                      <div className="pt-4 border-t border-border">
                        <Button
                          type="button"
                          onClick={handleSaveAvatar}
                          disabled={isUploading}
                          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          {isUploading 
                            ? "جاري الحفظ..." 
                            : avatarPreview 
                            ? "حفظ الصورة" 
                            : "إزالة الصورة"}
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Tips */}
                  <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 space-y-2">
                    <h4 className="text-sm font-semibold text-primary flex items-center gap-2">
                      <User className="h-4 w-4" />
                      نصائح للصورة الشخصية
                    </h4>
                    <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                      <li>استخدم صورة واضحة وحديثة</li>
                      <li>تأكد من أن الصورة مربعة الشكل للحصول على أفضل نتيجة</li>
                      <li>تجنب الصور التي تحتوي على نصوص أو علامات مائية</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "security" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="p-6 rounded-2xl border border-border bg-card backdrop-blur-sm space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">كلمة المرور</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-foreground">كلمة المرور الحالية</Label>
                      <Input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        disabled={isChangingPassword}
                        className="bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground">كلمة المرور الجديدة</Label>
                      <Input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        disabled={isChangingPassword}
                        className="bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground">تأكيد كلمة المرور الجديدة</Label>
                      <Input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={isChangingPassword}
                        className="bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
                      />
                    </div>
                    <div className="flex justify-end pt-2">
                      <Button
                        variant="outline"
                        onClick={handleChangePassword}
                        disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
                        className="border-border bg-background hover:bg-muted text-foreground hover:text-foreground"
                      >
                        {isChangingPassword ? "جاري التحديث..." : "تحديث كلمة المرور"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "history" && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="text-lg font-semibold px-1 text-foreground">سجل النشاطات الأخيرة</h3>
                {loadingActivity ? (
                  <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
                ) : activity.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">لا توجد نشاطات مسجلة</div>
                ) : (
                  activity.map((entry, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-4 rounded-xl border border-border bg-card backdrop-blur-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                          <LogOut className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">تسجيل دخول ناجح</p>
                          <p className="text-xs text-muted-foreground">
                            {entry.device || "Unknown"} • {new Date(entry.timestamp).toLocaleDateString("ar-SA")}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Danger Zone */}
            <div className="pt-8">
              <div className="p-6 rounded-2xl border border-destructive/20 bg-destructive/10 backdrop-blur-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-destructive">منطقة الخطر</h3>
                </div>
                <Button 
                  variant="destructive" 
                  onClick={handleLogout}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  <LogOut className="ml-2 h-4 w-4" />
                  تسجيل الخروج
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Crop Dialog */}
      {imageToCrop && (
        <ImageCropDialog
          open={cropDialogOpen}
          onClose={() => {
            setCropDialogOpen(false);
            if (imageToCrop && imageToCrop.startsWith("blob:")) {
              URL.revokeObjectURL(imageToCrop);
            }
            setImageToCrop(null);
          }}
          imageSrc={imageToCrop}
          onCropComplete={handleCropComplete}
          aspectRatio={1}
        />
      )}

      {/* Confirmation Dialog */}
      {confirmDialogConfig && (
        <ConfirmationDialog
          open={confirmDialogOpen}
          onClose={() => {
            setConfirmDialogOpen(false);
            setConfirmDialogConfig(null);
          }}
          onConfirm={confirmDialogConfig.onConfirm}
          title={confirmDialogConfig.title}
          description={confirmDialogConfig.description}
          variant="destructive"
        />
      )}
    </div>
  );
}
