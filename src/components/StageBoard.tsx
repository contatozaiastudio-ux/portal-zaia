"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
} from "@dnd-kit/core";
import type { Client, ClientStage } from "@/lib/types";

function ClientCard({
  client,
  stage,
  onOpen,
}: {
  client: Client;
  stage: ClientStage;
  onOpen: (slug: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: client.id,
  });
  const isDone = stage.position === 7;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => !isDragging && onOpen(client.slug)}
      className={`cursor-grab touch-none rounded-panel-md px-2 py-2 text-center font-body text-[10.5px] font-medium shadow-sm active:cursor-grabbing sm:text-fs-xs ${
        isDragging ? "z-10 opacity-50" : ""
      }`}
      style={{
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        backgroundColor: isDone ? stage.color_bg : "#FFFFFF",
        color: isDone ? stage.color_text : "#3E4A50",
        border: isDone ? "none" : `1px solid ${stage.color_bg}`,
      }}
    >
      {client.name}
    </div>
  );
}

function StageColumn({ stage, clients }: { stage: ClientStage; clients: Client[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  const router = useRouter();

  return (
    <div className="flex flex-col">
      <div
        className="rounded-t-panel-sm px-1.5 py-2 text-center font-body text-[9.5px] font-semibold leading-tight sm:text-fs-2xs"
        style={{ backgroundColor: stage.color_bg, color: stage.color_text }}
      >
        {stage.name}
      </div>
      <div
        ref={setNodeRef}
        className="flex min-h-[72px] flex-col gap-1.5 rounded-b-panel-sm p-1.5 transition-shadow"
        style={{
          backgroundColor: "#F7F8F9",
          boxShadow: isOver ? "inset 0 0 0 2px #899AA2" : "none",
        }}
      >
        {clients.map((client) => (
          <ClientCard
            key={client.id}
            client={client}
            stage={stage}
            onOpen={(slug) => router.push(`/admin/${slug}`)}
          />
        ))}
      </div>
    </div>
  );
}

export function StageBoard({
  stages,
  clients,
}: {
  stages: ClientStage[];
  clients: Client[];
}) {
  const router = useRouter();
  const [items, setItems] = useState(clients);
  const [saving, setSaving] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const clientId = active.id as string;
    const newStageId = over.id as string;
    const client = items.find((c) => c.id === clientId);
    if (!client || client.client_stage_id === newStageId) return;

    setItems((prev) =>
      prev.map((c) => (c.id === clientId ? { ...c, client_stage_id: newStageId } : c))
    );
    setSaving(true);
    try {
      await fetch(`/api/admin/clients/${clientId}/stage`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stageId: newStageId }),
      });
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <DndContext
        id="client-pipeline-board"
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {stages.map((stage) => (
            <StageColumn
              key={stage.id}
              stage={stage}
              clients={items.filter((c) => c.client_stage_id === stage.id)}
            />
          ))}
        </div>
      </DndContext>
      {saving && (
        <span className="font-body text-fs-2xs text-painel-text-muted">Salvando etapa...</span>
      )}
    </div>
  );
}
