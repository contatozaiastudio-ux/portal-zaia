import { Logo } from "./Logo";

export function Header({
  clientName,
  badge,
}: {
  clientName: string;
  badge?: string;
}) {
  return (
    <header className="bg-azul text-ink">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-3">
          <Logo className="h-8 w-8 shrink-0" />
          <div className="flex flex-col leading-tight">
            <span className="font-display text-sm font-semibold tracking-wide">
              ZAIA FLOW
            </span>
            <span className="font-body text-xs text-azul-deep">{clientName}</span>
          </div>
        </div>
        {badge && (
          <span className="rounded-full bg-branco/60 px-3 py-1 font-display text-xs font-semibold text-azul-deep">
            {badge}
          </span>
        )}
      </div>
    </header>
  );
}
