import { UserButton } from "@clerk/clerk-react";

interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background px-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="flex items-center gap-4">
        <UserButton afterSignOutUrl="/sign-in" />
      </div>
    </header>
  );
}
