export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="painel-photo-bg flex min-h-full flex-1 flex-col bg-painel-bg text-painel-text">
      {children}
    </div>
  );
}
