"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Post } from "@/lib/types";
import { PostCardContent } from "@/components/PostCard";

function SortablePostCard({
  post,
  onOpen,
}: {
  post: Post;
  onOpen: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: post.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      onClick={() => !isDragging && onOpen(post.id)}
      className={`cursor-grab touch-none active:cursor-grabbing ${isDragging ? "opacity-50" : ""}`}
    >
      <PostCardContent post={post} />
    </div>
  );
}

export function AdminFeedGrid({
  slug,
  monthKey,
  posts,
}: {
  slug: string;
  monthKey: string;
  posts: Post[];
}) {
  const router = useRouter();
  const [items, setItems] = useState(posts);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((p) => p.id === active.id);
    const newIndex = items.findIndex((p) => p.id === over.id);
    const next = arrayMove(items, oldIndex, newIndex);
    setItems(next);
    await fetch(`/api/admin/${slug}/posts/reorder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds: next.map((p) => p.id) }),
    });
    router.refresh();
  }

  if (items.length === 0) {
    return (
      <p className="font-body text-fs-sm text-painel-text-muted">
        Nenhum post cadastrado para este mês ainda.
      </p>
    );
  }

  return (
    <DndContext
      id="post-feed-reorder"
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items.map((p) => p.id)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-3 gap-1.5 sm:gap-4">
          {items.map((post) => (
            <SortablePostCard
              key={post.id}
              post={post}
              onOpen={(id) => router.push(`/admin/${slug}/post/${id}?m=${monthKey}`)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
