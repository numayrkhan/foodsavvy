import React from "react";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function NewItemModal({
  open,
  onClose,
  categories,
  showNutrition,
  setShowNutrition,
  newItemForm,
  setNewItemForm,
  creatingItem,
  onCreateItem,
  getNutritionPreview,
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : null)}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>New Menu Item</DialogTitle>
        </DialogHeader>

        <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Item Name *</div>
              <Input
                value={newItemForm.name}
                onChange={(e) => setNewItemForm({ ...newItemForm, name: e.target.value })}
                placeholder="e.g. Chicken Bowl"
              />
            </div>

            <div>
              <div className="text-xs text-muted-foreground mb-1">Category</div>
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={newItemForm.categoryId}
                onChange={(e) => setNewItemForm({ ...newItemForm, categoryId: e.target.value })}
              >
                <option value="">None</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground mb-1">Description</div>
            <Textarea
              rows={3}
              value={newItemForm.description}
              onChange={(e) => setNewItemForm({ ...newItemForm, description: e.target.value })}
              placeholder="Short description..."
            />
          </div>

          <div>
            <div className="text-xs text-muted-foreground mb-1">Image URL</div>
            <Input
              value={newItemForm.imageUrl}
              onChange={(e) => setNewItemForm({ ...newItemForm, imageUrl: e.target.value })}
              placeholder="https://..."
            />
          </div>

          {/* Nutrition */}
          <div className="rounded-lg border border-border bg-background/30 p-4">
            <button
              type="button"
              className="w-full flex items-center justify-between"
              onClick={() => setShowNutrition(!showNutrition)}
            >
              <div className="text-left">
                <div className="font-semibold">Nutrition & Allergens (Optional)</div>
                {getNutritionPreview(newItemForm.nutrition) && (
                  <div className="text-xs text-primary mt-1">{getNutritionPreview(newItemForm.nutrition)}</div>
                )}
              </div>
              {showNutrition ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>

            {showNutrition && (
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {["calories", "fat", "carbs", "protein"].map((k) => (
                    <div key={k}>
                      <div className="text-xs text-muted-foreground mb-1">
                        {k === "calories" ? "Calories" : k.charAt(0).toUpperCase() + k.slice(1)}{k !== "calories" ? " (g)" : ""}
                      </div>
                      <Input
                        type="number"
                        value={newItemForm.nutrition[k]}
                        onChange={(e) =>
                          setNewItemForm({
                            ...newItemForm,
                            nutrition: { ...newItemForm.nutrition, [k]: e.target.value },
                          })
                        }
                      />
                    </div>
                  ))}
                </div>

                <div>
                  <div className="text-xs text-muted-foreground mb-1">Contains (Allergens)</div>
                  <Input
                    value={newItemForm.contains}
                    onChange={(e) => setNewItemForm({ ...newItemForm, contains: e.target.value })}
                    placeholder="Comma-separated (e.g., Milk, Nuts)"
                  />
                  <div className="text-xs text-muted-foreground mt-1">Comma-separated (e.g., Milk, Nuts)</div>
                </div>
              </div>
            )}
          </div>

          {/* Variants */}
          <div>
            <div className="font-semibold mb-2">Different sizes</div>

            <div className="space-y-2">
              {newItemForm.variants.map((v, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-5">
                    <div className="text-xs text-muted-foreground mb-1">Label</div>
                    <Input
                      value={v.label}
                      onChange={(e) => {
                        const next = [...newItemForm.variants];
                        next[idx].label = e.target.value;
                        setNewItemForm({ ...newItemForm, variants: next });
                      }}
                      placeholder="e.g. Small"
                    />
                  </div>

                  <div className="col-span-3">
                    <div className="text-xs text-muted-foreground mb-1">Price ($) *</div>
                    <Input
                      type="number"
                      value={v.priceStr}
                      onChange={(e) => {
                        const next = [...newItemForm.variants];
                        next[idx].priceStr = e.target.value;
                        setNewItemForm({ ...newItemForm, variants: next });
                      }}
                      placeholder="12.99"
                    />
                  </div>

                  <div className="col-span-3">
                    <div className="text-xs text-muted-foreground mb-1">Capacity</div>
                    <Input
                      type="number"
                      value={v.capacity}
                      onChange={(e) => {
                        const next = [...newItemForm.variants];
                        next[idx].capacity = e.target.value;
                        setNewItemForm({ ...newItemForm, variants: next });
                      }}
                      placeholder="Unlimited"
                    />
                  </div>

                  <div className="col-span-1 flex justify-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={newItemForm.variants.length === 1}
                      onClick={() => {
                        const next = [...newItemForm.variants];
                        next.splice(idx, 1);
                        setNewItemForm({ ...newItemForm, variants: next });
                      }}
                      aria-label="Remove size"
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              className="mt-3"
              onClick={() =>
                setNewItemForm({
                  ...newItemForm,
                  variants: [...newItemForm.variants, { label: "", priceStr: "", capacity: "" }],
                })
              }
            >
              <Plus className="h-4 w-4" />
              Add Size
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-muted-foreground">
            Cancel
          </Button>
          <Button onClick={onCreateItem} disabled={creatingItem}>
            {creatingItem ? "Creating..." : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
