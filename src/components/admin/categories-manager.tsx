"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Check, Pencil, Plus, Tags, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { createCategory, deleteCategory, renameCategory, reorderCategories } from "@/app/admin/actions";
import type { Category } from "@/lib/types";
import { brand } from "@/config/brand";

export function CategoriesManager({ categories: initial, counts }: { categories: Category[]; counts: Record<string, number> }) {
  const router = useRouter();
  const [categories, setCategories] = useState(initial);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [busy, setBusy] = useState(false);
  const [toDelete, setToDelete] = useState<Category | null>(null);

  const nameTaken = (name: string, exceptId?: string) => categories.some((c) => c.name.trim() === name.trim() && c.id !== exceptId);

  const add = async (e: FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    if (nameTaken(name)) {
      toast.error("כבר יש קטגוריה בשם הזה");
      return;
    }
    setAdding(true);
    const res = await createCategory(name);
    setAdding(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    setCategories((list) => [...list, res.data]);
    setNewName("");
    toast.success(`הקטגוריה ״${name}״ נוספה`);
    router.refresh();
  };

  const saveRename = async (category: Category) => {
    const name = editName.trim();
    if (!name || name === category.name) {
      setEditingId(null);
      return;
    }
    if (nameTaken(name, category.id)) {
      toast.error("כבר יש קטגוריה בשם הזה");
      return;
    }
    setBusy(true);
    const res = await renameCategory(category.id, name);
    setBusy(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    setCategories((list) => list.map((c) => (c.id === category.id ? { ...c, name } : c)));
    setEditingId(null);
    toast.success("השם עודכן");
    router.refresh();
  };

  const move = async (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= categories.length) return;
    const reordered = [...categories];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    const withOrder = reordered.map((c, i) => ({ ...c, sort_order: i + 1 }));
    const previous = categories;
    setCategories(withOrder);
    setBusy(true);
    const res = await reorderCategories(withOrder.map((c) => c.id));
    setBusy(false);
    if (!res.ok) {
      setCategories(previous);
      toast.error("הסדר לא נשמר. נסו שוב.");
      return;
    }
    router.refresh();
  };

  const remove = async () => {
    if (!toDelete) return;
    setBusy(true);
    const res = await deleteCategory(toDelete.id);
    setBusy(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    setCategories((list) => list.filter((c) => c.id !== toDelete.id));
    toast.success(`הקטגוריה ״${toDelete.name}״ נמחקה`);
    setToDelete(null);
    router.refresh();
  };

  return (
    <div className="max-w-[720px]">
      <form onSubmit={add} className="flex gap-2">
        <label htmlFor="new-category" className="sr-only">
          שם קטגוריה חדשה
        </label>
        <Input id="new-category" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={`קטגוריה חדשה, ${brand.examples.categoryName}`} maxLength={40} />
        <Button type="submit" size="lg" loading={adding} disabled={!newName.trim()} icon={<Plus className="size-[18px]" />} className="shrink-0">
          הוספה
        </Button>
      </form>

      {categories.length === 0 ? (
        <EmptyState icon={<Tags className="size-6" />} title="אין עדיין קטגוריות" body="קטגוריות עוזרות ללקוחות למצוא מה שהם מחפשים." />
      ) : (
        <ol className="mt-5 divide-y divide-line overflow-hidden rounded-[var(--radius-panel)] border border-line bg-white">
          {categories.map((c, i) => (
            <li key={c.id} className="flex items-center gap-2 p-3 md:p-4">
              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0 || busy}
                  className="flex size-8 items-center justify-center rounded-full text-muted hover:bg-surface disabled:opacity-25"
                  aria-label={`הזזת ${c.name} למעלה`}
                >
                  <ArrowUp className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === categories.length - 1 || busy}
                  className="flex size-8 items-center justify-center rounded-full text-muted hover:bg-surface disabled:opacity-25"
                  aria-label={`הזזת ${c.name} למטה`}
                >
                  <ArrowDown className="size-4" />
                </button>
              </div>

              {editingId === c.id ? (
                <form
                  className="flex flex-1 items-center gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    saveRename(c);
                  }}
                >
                  <label htmlFor={`rename-${c.id}`} className="sr-only">
                    שם חדש לקטגוריה
                  </label>
                  <Input id={`rename-${c.id}`} value={editName} onChange={(e) => setEditName(e.target.value)} autoFocus maxLength={40} />
                  <button type="submit" className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand text-white" aria-label="שמירת השם">
                    <Check className="size-5" />
                  </button>
                  <button type="button" onClick={() => setEditingId(null)} className="flex size-11 shrink-0 items-center justify-center rounded-full text-muted hover:bg-surface" aria-label="ביטול">
                    <X className="size-5" />
                  </button>
                </form>
              ) : (
                <>
                  <div className="min-w-0 flex-1">
                    <p className="text-[17px] font-semibold">{c.name}</p>
                    <p className="text-[14px] text-muted">{counts[c.id] ? `${counts[c.id]} מוצרים` : "אין מוצרים"}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(c.id);
                      setEditName(c.name);
                    }}
                    className="flex size-10 items-center justify-center rounded-full text-muted hover:bg-surface hover:text-ink"
                    aria-label={`שינוי שם ${c.name}`}
                  >
                    <Pencil className="size-[18px]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setToDelete(c)}
                    className="flex size-10 items-center justify-center rounded-full text-muted hover:bg-alert-soft hover:text-alert"
                    aria-label={`מחיקת ${c.name}`}
                  >
                    <Trash2 className="size-[18px]" />
                  </button>
                </>
              )}
            </li>
          ))}
        </ol>
      )}

      <ConfirmDialog
        open={!!toDelete}
        title={`למחוק את הקטגוריה ״${toDelete?.name ?? ""}״?`}
        body={
          toDelete && counts[toDelete.id]
            ? `${counts[toDelete.id]} המוצרים שבה לא יימחקו. הם יעברו ל״ללא קטגוריה״ ותוכלו לשייך אותם מחדש.`
            : "הקטגוריה ריקה ותימחק."
        }
        confirmLabel="מחיקה"
        destructive
        loading={busy}
        onConfirm={remove}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
