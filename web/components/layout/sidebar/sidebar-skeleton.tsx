export function SidebarSkeleton() {
  return (
    <div className="space-y-0.5 pb-2 animate-in fade-in">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex w-full items-center gap-2 rounded-md py-1.5 px-3">
          <div className="h-3.5 flex-1 bg-muted/40 rounded animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
        </div>
      ))}
    </div>
  );
}
