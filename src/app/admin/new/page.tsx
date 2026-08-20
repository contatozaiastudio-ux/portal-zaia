import Link from "next/link";
import { isSupabaseConfigured } from "@/lib/supabase";
import { SetupNotice } from "@/components/SetupNotice";
import { NewClientChecklistForm } from "./NewClientChecklistForm";

export default function NewClientPage() {
  if (!isSupabaseConfigured) {
    return <SetupNotice />;
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-8">
      <Link href="/admin" className="font-body text-fs-sm text-painel-text-muted hover:text-painel-text">
        ← ZAIA FLOW
      </Link>
      <div className="rounded-panel border-l-[3px] border-amarelo bg-painel-surface p-5">
        <span className="font-body text-fs-xs font-bold uppercase tracking-widest text-amarelo">
          Novo Cliente
        </span>
        <p className="mt-1.5 font-body text-fs-md text-painel-text">
          Checklist obrigatório antes de abrir o acompanhamento de um cliente novo. Tudo aqui
          alimenta o Contexto do Cliente e o Escopo Contratado assim que o portal dele existir.
        </p>
      </div>
      <NewClientChecklistForm />
    </main>
  );
}
