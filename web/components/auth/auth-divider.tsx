export function AuthDivider({ text }: { text: string }) {
  return (
    <div className="relative py-2">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t border-border" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-card px-3 text-muted-foreground font-medium">
          {text}
        </span>
      </div>
    </div>
  );
}

