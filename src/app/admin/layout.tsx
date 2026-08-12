export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-painel-bg text-painel-text">
      {children}
    </div>
  );
}
