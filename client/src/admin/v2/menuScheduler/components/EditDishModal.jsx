import React from "react";
import { ChevronDown, ChevronUp, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function EditDishModal({
  open,
  onClose,
  categories,
  showNutrition,
  setShowNutrition,
  editDishForm,
  setEditDishForm,
  isSavingDish,
  onSaveDish,
  existingVariants,
  addVariantMode,
  setAddVariantMode,
  addVariantForm,
  setAddVariantForm,
  isSavingVariant,
  onSaveNewVariant,
  formatMoney,
  getNutritionPreview,
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : null)}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Edit Dish Details</DialogTitle>
        </DialogHeader>

        <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Item Name *</div>
              <Input
                value={editDishForm.name}
                onChange={(e) => setEditDishForm({ ...editDishForm, name: e.target.value })}
              />
            </div>

            <div>
              <div className="text-xs text-muted-foreground mb-1">Category</div>
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={editDishForm.categoryId}
                onChange={(e) => setEditDishForm({ ...editDishForm, categoryId: e.target.value })}
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
              value={editDishForm.description}
              onChange={(e) => setEditDishForm({ ...editDishForm, description: e.target.value })}
            />
          </div>

          <div>
            <div className="text-xs text-muted-foreground mb-1">Image URL</div>
            <Input
              value={editDishForm.imageUrl}
              onChange={(e) => setEditDishForm({ ...editDishForm, imageUrl: e.target.value })}
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
                <div className="font-semibold">Nutrition & Allergens</div>
                {getNutritionPreview(editDishForm.nutrition) && (
                  <div className="text-xs text-primary mt-1">{getNutritionPreview(editDishForm.nutrition)}</div>
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
                        value={editDishForm.nutrition[k]}
                        onChange={(e) =>
                          setEditDishForm({
                            ...editDishForm,
                            nutrition: { ...editDishForm.nutrition, [k]: e.target.value },
                          })
                        }
                      />
                    </div>
                  ))}
                </div>

                <div>
                  <div className="text-xs text-muted-foreground mb-1">Contains (Allergens)</div>
                  <Input
                    value={editDishForm.contains}
                    onChange={(e) => setEditDishForm({ ...editDishForm, contains: e.target.value })}
                    placeholder="Comma-separated (e.g., Milk, Nuts)"
                  />
                  <div className="text-xs text-muted-foreground mt-1">Comma-separated (e.g., Milk, Nuts)</div>
                </div>
              </div>
            )}
          </div>

          {/* Existing variants */}
          <div>
            <div className="font-semibold mb-2">Different sizes</div>

            <div className="rounded-lg border border-border bg-background/30">
              {existingVariants.map((v) => (
                <div key={v.id} className="px-4 py-3 border-b border-border last:border-b-0">
                  <div className="text-sm font-medium">{v.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {formatMoney(v.basePriceCents)} • Capacity: {v.baseCapacity ?? "Unlimited"}
                  </div>
                </div>
              ))}
            </div>

            {addVariantMode ? (
              <div className="mt-3 rounded-lg border border-border bg-background/30 p-4 grid grid-cols-12 gap-2 items-end">
                <div className="col-span-5">
                  <div className="text-xs text-muted-foreground mb-1">Label</div>
                  <Input
                    value={addVariantForm.label}
                    onChange={(e) => setAddVariantForm({ ...addVariantForm, label: e.target.value })}
                    placeholder="e.g. Family"
                  />
                </div>

                <div className="col-span-3">
                  <div className="text-xs text-muted-foreground mb-1">Price ($)</div>
                  <Input
                    type="number"
                    value={addVariantForm.priceStr}
                    onChange={(e) => setAddVariantForm({ ...addVariantForm, priceStr: e.target.value })}
                  />
                </div>

                <div className="col-span-3">
                  <div className="text-xs text-muted-foreground mb-1">Cap.</div>
                  <Input
                    type="number"
                    value={addVariantForm.capacity}
                    onChange={(e) => setAddVariantForm({ ...addVariantForm, capacity: e.target.value })}
                    placeholder="Unlim"
                  />
                </div>

                <div className="col-span-1 flex flex-col gap-2">
                  <Button size="sm" onClick={onSaveNewVariant} disabled={isSavingVariant}>
                    Add
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-muted-foreground"
                    onClick={() => setAddVariantMode(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button variant="outline" className="mt-3" onClick={() => setAddVariantMode(true)}>
                <Plus className="h-4 w-4" />
                Add Size
              </Button>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-muted-foreground">
            Cancel
          </Button>
          <Button onClick={onSaveDish} disabled={isSavingDish}>
            {isSavingDish ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
