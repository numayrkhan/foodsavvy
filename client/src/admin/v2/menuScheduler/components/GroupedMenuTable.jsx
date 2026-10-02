import React from "react";
import { ChevronDown, ChevronUp, Image as ImageIcon, Pencil, Info, Trash2, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

export default function GroupedMenuTable({
  groupedOfferings,
  expandedDishes,
  toggleDishExpand,
  searchQuery,
  editingCell,
  setEditingCell,
  handleStartEdit,
  handleCommitEdit,
  editingLabel,
  setEditingLabel,
  handleStartLabelEdit,
  handleCommitLabelEdit,
  handleToggleAvailable,
  handleRemoveOffering,
  handleStartDishEdit,
  formatMoney,
  formatMacrosRow,
  getSelectedDayName,
  onOpenCreateFirst,
  addingSizeForItemId,
  addSizeForm,
  setAddSizeForm,
  isAddingSize,
  startAddSize,
  cancelAddSize,
  submitAddSize,
}) {
  if (groupedOfferings.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-10 text-center text-muted-foreground">
        <div className="mb-4">No items for {getSelectedDayName()}.</div>
        {onOpenCreateFirst && (
          <Button variant="outline" onClick={onOpenCreateFirst}>
            Create First Item
          </Button>
        )}
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border">
              <tr>
                <th className="text-left font-semibold text-muted-foreground px-4 py-3 w-[40%]">Dish / Size</th>
                <th className="text-right font-semibold text-muted-foreground px-4 py-3 w-[15%]">Price</th>
                <th className="text-right font-semibold text-muted-foreground px-4 py-3 w-[15%]">Capacity</th>
                <th className="text-center font-semibold text-muted-foreground px-4 py-3 w-[15%]">Available</th>
                <th className="text-right font-semibold text-muted-foreground px-4 py-3 w-[15%]">Actions</th>
              </tr>
            </thead>

            <tbody>
              {groupedOfferings.map((group) => {
                const isExpanded = expandedDishes.has(group.itemId) || !!searchQuery;
                const { item, offerings } = group;
                const macros = formatMacrosRow(item.nutrition);

                return (
                  <React.Fragment key={`group-${group.itemId}`}>
                    {/* Parent row */}
                    <tr
                      className="hover:bg-white/5 cursor-pointer border-b border-border/60"
                      onClick={() => toggleDishExpand(group.itemId)}
                    >
                      <td colSpan={5} className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            className="rounded-md p-1 text-muted-foreground hover:bg-white/5"
                            aria-label={isExpanded ? "Collapse" : "Expand"}
                          >
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </button>

                          {/* Image */}
                          <div className="h-12 w-12 rounded-md border border-border bg-secondary/30 overflow-hidden flex items-center justify-center">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="h-full w-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <ImageIcon className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="font-semibold text-foreground truncate">{item.name}</div>
                            {macros && <div className="text-xs text-muted-foreground mt-0.5">{macros}</div>}
                          </div>

                          <div className="ml-auto flex items-center gap-1">
                            {/* Edit */}
                            <button
                              type="button"
                              className="rounded-md p-2 text-muted-foreground hover:bg-white/5 hover:text-foreground"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartDishEdit(item);
                              }}
                              onMouseDown={(e) => e.stopPropagation()}
                              aria-label="Edit dish"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>

                            {/* Info tooltip */}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  className="rounded-md p-2 text-muted-foreground hover:bg-white/5 hover:text-primary"
                                  onClick={(e) => e.stopPropagation()}
                                  onMouseDown={(e) => e.stopPropagation()}
                                  aria-label="Dish info"
                                >
                                  <Info className="h-4 w-4" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="right" className="max-w-sm">
                                <div className="font-semibold mb-1">Details</div>
                                <div className="text-muted-foreground mb-2">
                                  {item.description || "No description provided."}
                                </div>
                                {item.nutrition && (
                                  <div className="text-muted-foreground mb-1">
                                    {formatMacrosRow(item.nutrition)}
                                  </div>
                                )}
                                {item.allergens?.contains?.length > 0 && (
                                  <div className="text-red-200">
                                    Contains: {item.allergens.contains.join(", ")}
                                  </div>
                                )}
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                      </td>
                    </tr>

                    {/* Children */}
                    {isExpanded && (
                      <>
                        {offerings.map((offering) => {
                          const hasPriceOverride = offering.priceOverrideCents !== null && offering.priceOverrideCents !== undefined;
                          const hasCapOverride = offering.capacityOverride !== null && offering.capacityOverride !== undefined;
                          const displayCapacity = hasCapOverride ? offering.capacityOverride : offering.baseCapacity ?? "Unlimited";

                          const isEditingPrice = editingCell?.id === offering.id && editingCell?.field === "price";
                          const isEditingCap = editingCell?.id === offering.id && editingCell?.field === "capacity";
                          const isEditingLabel = editingLabel?.variantId === offering.menuVariantId;

                          return (
                            <tr key={offering.id} className="border-b border-border/40 bg-background/30">
                              {/* Label */}
                              <td
                                className="px-4 py-3 pl-16"
                                onClick={() => !isEditingLabel && handleStartLabelEdit(offering.menuVariantId, offering.variantLabel)}
                              >
                                {isEditingLabel ? (
                                  <Input
                                    autoFocus
                                    className="h-8 w-[160px]"
                                    value={editingLabel.value}
                                    onChange={(e) => setEditingLabel({ ...editingLabel, value: e.target.value })}
                                    onBlur={handleCommitLabelEdit}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") handleCommitLabelEdit();
                                      if (e.key === "Escape") setEditingLabel(null);
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                ) : (
                                  <span className="text-foreground/90 cursor-pointer hover:underline decoration-dashed underline-offset-4">
                                    {offering.variantLabel}
                                  </span>
                                )}
                              </td>

                              {/* Price */}
                              <td
                                className="px-4 py-3 text-right cursor-pointer hover:bg-white/5"
                                onClick={() => !isEditingPrice && handleStartEdit(offering, "price")}
                              >
                                {isEditingPrice ? (
                                  <div className="flex justify-end">
                                    <div className="relative w-[110px]">
                                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                                      <Input
                                        autoFocus
                                        className="h-8 pl-6 text-right"
                                        value={editingCell.value}
                                        onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
                                        onBlur={handleCommitEdit}
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter") handleCommitEdit();
                                          if (e.key === "Escape") setEditingCell(null);
                                        }}
                                      />
                                    </div>
                                  </div>
                                ) : hasPriceOverride ? (
                                  <span className="text-primary font-semibold">{formatMoney(offering.priceOverrideCents)}</span>
                                ) : (
                                  <span className="text-muted-foreground">{formatMoney(offering.basePriceCents)}</span>
                                )}
                              </td>

                              {/* Capacity */}
                              <td
                                className="px-4 py-3 text-right cursor-pointer hover:bg-white/5"
                                onClick={() => !isEditingCap && handleStartEdit(offering, "capacity")}
                              >
                                {isEditingCap ? (
                                  <div className="flex justify-end">
                                    <Input
                                      autoFocus
                                      className="h-8 w-[90px] text-right"
                                      placeholder="Unlim"
                                      value={editingCell.value}
                                      onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
                                      onBlur={handleCommitEdit}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") handleCommitEdit();
                                        if (e.key === "Escape") setEditingCell(null);
                                      }}
                                    />
                                  </div>
                                ) : hasCapOverride ? (
                                  <span className="text-primary font-semibold">{displayCapacity}</span>
                                ) : (
                                  <span className="text-muted-foreground">{displayCapacity}</span>
                                )}
                              </td>

                              {/* Available */}
                              <td className="px-4 py-3 text-center">
                                <Switch
                                  checked={!!offering.isAvailable}
                                  onCheckedChange={() => handleToggleAvailable(offering.id)}
                                />
                              </td>

                              {/* Actions */}
                              <td className="px-4 py-3 text-right">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      type="button"
                                      className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-white/5 hover:text-red-300"
                                      onClick={() => handleRemoveOffering(offering.id)}
                                      aria-label="Remove"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>Remove</TooltipContent>
                                </Tooltip>
                              </td>
                            </tr>
                          );
                        })}

                        {/* Inline Add Size */}
                        {addingSizeForItemId === group.itemId ? (
                          <tr className="border-b border-border/40 bg-primary/5">
                            <td className="px-4 py-3 pl-16">
                              <Input
                                autoFocus
                                className="h-8"
                                placeholder="Label"
                                value={addSizeForm.label}
                                onChange={(e) => setAddSizeForm({ ...addSizeForm, label: e.target.value })}
                              />
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex justify-end">
                                <div className="relative w-[110px]">
                                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                                  <Input
                                    className="h-8 pl-6 text-right"
                                    placeholder="Price"
                                    type="number"
                                    value={addSizeForm.priceStr}
                                    onChange={(e) => setAddSizeForm({ ...addSizeForm, priceStr: e.target.value })}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex justify-end">
                                <Input
                                  className="h-8 w-[90px] text-right"
                                  placeholder="Cap"
                                  type="number"
                                  value={addSizeForm.capacity}
                                  onChange={(e) => setAddSizeForm({ ...addSizeForm, capacity: e.target.value })}
                                />
                              </div>
                            </td>
                            <td colSpan={2} className="px-4 py-3">
                              <div className="flex justify-end items-center gap-2">
                                <Button variant="ghost" size="sm" onClick={cancelAddSize} className="text-muted-foreground">
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => submitAddSize(group.itemId)}
                                  disabled={isAddingSize}
                                >
                                  {isAddingSize ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          <tr className="border-b border-border/40">
                            <td colSpan={5} className="px-4 py-2 pl-16">
                              <button
                                type="button"
                                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
                                onClick={() => startAddSize(group.itemId)}
                              >
                                <Plus className="h-4 w-4" />
                                Add size
                              </button>
                            </td>
                          </tr>
                        )}
                      </>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </TooltipProvider>
  );
}
