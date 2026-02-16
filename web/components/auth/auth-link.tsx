import Link from "next/link";

interface AuthLinkProps {
  text: string;
  linkText: string;
  href: string;
}

export function AuthLink({ text, linkText, href }: AuthLinkProps) {
  return (
    <div className="text-center text-sm">
      <span className="text-muted-foreground">{text} </span>
      <Link
        href={href}
        className="text-primary hover:text-primary/80 font-semibold hover:underline transition-colors"
      >
        {linkText}
      </Link>
    </div>
  );
}

