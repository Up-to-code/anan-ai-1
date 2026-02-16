import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export default function ProfileLoading() {
  return (
    <div className="flex min-h-dvh bg-[#0a0a0a]" dir="rtl">
      <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <Skeleton className="h-9 w-48 bg-zinc-900/50" />
          <Skeleton className="h-5 w-64 bg-zinc-900/50" />
        </div>

        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          {/* Sidebar / Profile Card */}
          <div className="space-y-6">
            <div className="p-6 rounded-2xl border border-white/10 bg-[#0a0a0a] shadow-2xl space-y-6 backdrop-blur-sm">
              <div className="flex flex-col items-center text-center space-y-4">
                <Skeleton className="h-24 w-24 rounded-full bg-zinc-900/50" />
                <div className="space-y-2 w-full">
                  <Skeleton className="h-6 w-32 mx-auto bg-zinc-900/50" />
                  <Skeleton className="h-4 w-24 mx-auto bg-zinc-900/50" />
                </div>
              </div>

              <Separator className="bg-white/10" />

              <div className="space-y-4">
                <div className="space-y-2">
                  <Skeleton className="h-3 w-20 bg-zinc-900/50" />
                  <Skeleton className="h-2 w-full bg-zinc-900/50" />
                </div>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full bg-zinc-900/50" />
                  <Skeleton className="h-4 w-full bg-zinc-900/50" />
                  <Skeleton className="h-4 w-full bg-zinc-900/50" />
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex flex-col space-y-1">
              <Skeleton className="h-10 w-full bg-zinc-900/50" />
              <Skeleton className="h-10 w-full bg-zinc-900/50" />
              <Skeleton className="h-10 w-full bg-zinc-900/50" />
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-6">
            <div className="p-6 rounded-2xl border border-white/10 bg-[#0a0a0a] shadow-2xl backdrop-blur-sm space-y-4">
              <Skeleton className="h-6 w-32 bg-zinc-900/50" />
              <div className="grid gap-4 md:grid-cols-2">
                <Skeleton className="h-20 bg-zinc-900/50" />
                <Skeleton className="h-20 bg-zinc-900/50" />
                <Skeleton className="h-20 bg-zinc-900/50" />
                <Skeleton className="h-20 bg-zinc-900/50" />
              </div>
              <Skeleton className="h-10 w-32 ml-auto bg-zinc-900/50" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


