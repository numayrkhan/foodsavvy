// client/src/admin/v2/menuScheduler/MenuSchedulerPage.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Search, Plus, CheckCircle2, Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useAdminAuth } from "../../../auth/useAdminAuth";

// Components
import WeekdayStrip from "./components/WeekdayStrip";
import GroupedMenuTable from "./components/GroupedMenuTable";
import NewItemModal from "./components/NewItemModal";
import EditDishModal from "./components/EditDishModal";

// --- Helpers ---
const formatMoney = (cents) => {
  if (cents === null || cents === undefined) return "—";
  return `$${(cents / 100).toFixed(2)}`;
};

const getCurrentWeekDates = () => {
  const curr = new Date();
  const first = curr.getDate() - curr.getDay();
  const week = [];
  for (let i = 0; i < 7; i++) {
    const next = new Date(curr.getTime());
    next.setDate(first + i);
    const offset = next.getTimezoneOffset();
    const localDate = new Date(next.getTime() - offset * 60 * 1000);
    week.push(localDate.toISOString().split("T")[0]);
  }
  return week;
};

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

const getNutritionPreview = (nutritionState) => {
  const parts = [];
  const { calories, fat, carbs, protein } = nutritionState;
  if (calories) parts.push(`Cal ${calories}`);
  if (fat) parts.push(`Fat ${fat}g`);
  if (carbs) parts.push(`Carbs ${carbs}g`);
  if (protein) parts.push(`Protein ${protein}g`);
  return parts.length > 0 ? parts.join(" • ") : "";
};

const formatMacrosRow = (nutrition) => {
  if (!nutrition) return null;
  const parts = [];
  if (nutrition.calories) parts.push(`Cal ${nutrition.calories}`);
  if (nutrition.fat) parts.push(`Fat ${nutrition.fat}g`);
  if (nutrition.carbs) parts.push(`Carbs ${nutrition.carbs}g`);
  if (nutrition.protein) parts.push(`Protein ${nutrition.protein}g`);
  return parts.length > 0 ? parts.join(" • ") : null;
};

function Toast({ notification, onClose }) {
  if (!notification?.open) return null;

  const tone =
    notification.severity === "success"
      ? "border-primary/30 bg-primary/10 text-foreground"
      : notification.severity === "error"
      ? "border-red-500/30 bg-red-500/10 text-foreground"
      : notification.severity === "warning"
      ? "border-yellow-500/30 bg-yellow-500/10 text-foreground"
      : "border-border bg-card text-foreground";

  return (
    <div className="fixed bottom-4 right-4 z-[60] w-full max-w-sm">
      <div className={`rounded-lg border px-4 py-3 shadow-lg ${tone}`}>
        <div className="flex items-start gap-3">
          <div className="text-sm leading-5 flex-1">{notification.message}</div>
          <button
            type="button"
            className="rounded-md p-1 text-muted-foreground hover:bg-white/5"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MenuSchedulerPage() {
  const { token } = useAdminAuth();

  // --- State ---
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: "", severity: "info" });

  const [serviceDays, setServiceDays] = useState([]);
  const [catalog, setCatalog] = useState(null);
  const [activeContext, setActiveContext] = useState(null);

  const [draftOfferings, setDraftOfferings] = useState([]);
  const [expandedDishes, setExpandedDishes] = useState(new Set());

  const [editingCell, setEditingCell] = useState(null);
  const [editingLabel, setEditingLabel] = useState(null);

  // D2.9 Inline Add Size State
  const [addingSizeForItemId, setAddingSizeForItemId] = useState(null);
  const [addSizeForm, setAddSizeForm] = useState({ label: "", priceStr: "", capacity: "" });
  const [isAddingSize, setIsAddingSize] = useState(false);

  // UI State
  const [currentTab, setCurrentTab] = useState("items");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const local = new Date(now.getTime() - offset * 60 * 1000);
    return local.toISOString().split("T")[0];
  });

  // --- New Item Dialog State ---
  const [newItemOpen, setNewItemOpen] = useState(false);
  const [creatingItem, setCreatingItem] = useState(false);
  const [showNutrition, setShowNutrition] = useState(false);
  const [newItemForm, setNewItemForm] = useState({
    name: "",
    imageUrl: "",
    description: "",
    categoryId: "",
    nutrition: { calories: "", fat: "", carbs: "", protein: "" },
    contains: "",
    variants: [{ label: "", priceStr: "", capacity: "" }],
  });

  // --- Edit Dish Details Dialog State ---
  const [editDishOpen, setEditDishOpen] = useState(false);
  const [isSavingDish, setIsSavingDish] = useState(false);
  const [editingDishId, setEditingDishId] = useState(null);
  const [editDishForm, setEditDishForm] = useState({
    name: "",
    imageUrl: "",
    description: "",
    categoryId: "",
    nutrition: { calories: "", fat: "", carbs: "", protein: "" },
    contains: "",
  });

  // --- Add Size (Variant) State (Modal) ---
  const [addVariantMode, setAddVariantMode] = useState(false);
  const [addVariantForm, setAddVariantForm] = useState({ label: "", priceStr: "", capacity: "" });
  const [isSavingVariant, setIsSavingVariant] = useState(false);

  // --- Auto-hide toast ---
  useEffect(() => {
    if (!notification.open) return;
    const t = setTimeout(() => setNotification((n) => ({ ...n, open: false })), 4000);
    return () => clearTimeout(t);
  }, [notification.open]);

  // --- Computed ---
  const weekDates = useMemo(() => getCurrentWeekDates(), []);

  const { itemMap, variantMap } = useMemo(() => {
    const iMap = new Map();
    const vMap = new Map();

    if (catalog?.items) {
      catalog.items.forEach((item) => {
        iMap.set(item.id, item);
        item.variants.forEach((variant) => {
          vMap.set(variant.id, { ...variant, itemId: item.id });
        });
      });
    }
    return { itemMap: iMap, variantMap: vMap };
  }, [catalog]);

  const categories = useMemo(() => catalog?.categories || [], [catalog]);

  const currentServiceDay = useMemo(() => {
    return serviceDays.find((d) => d.menuDate.startsWith(selectedDate));
  }, [serviceDays, selectedDate]);

  const groupedOfferings = useMemo(() => {
    if (!draftOfferings.length || !catalog) return [];

    const groups = new Map();

    draftOfferings.forEach((offering) => {
      const variantInfo = variantMap.get(offering.menuVariantId);
      if (!variantInfo) return;

      const itemId = variantInfo.itemId;
      const item =
        itemMap.get(itemId) || {
          id: itemId,
          name: "Unknown Item",
          imageUrl: null,
          nutrition: null,
          allergens: null,
        };

      if (!groups.has(itemId)) {
        groups.set(itemId, { itemId, item, offerings: [] });
      }

      groups.get(itemId).offerings.push({
        ...offering,
        variantLabel: variantInfo.label,
        basePriceCents: variantInfo.basePriceCents,
        baseCapacity: variantInfo.baseCapacity,
      });
    });

    for (const g of groups.values()) {
      g.offerings.sort((a, b) => {
        const aPrice = a.priceOverrideCents ?? a.basePriceCents ?? 0;
        const bPrice = b.priceOverrideCents ?? b.basePriceCents ?? 0;
        if (aPrice !== bPrice) return aPrice - bPrice;
        return String(a.variantLabel || "").localeCompare(String(b.variantLabel || ""));
      });
    }

    let result = Array.from(groups.values());
    if (searchQuery) {
      const lower = searchQuery.toLowerCase();
      result = result.filter((g) => (g.item?.name || "").toLowerCase().includes(lower));
    }
    return result;
  }, [draftOfferings, catalog, itemMap, variantMap, searchQuery]);

  const existingVariants = useMemo(
    () => catalog?.items?.find((i) => i.id === editingDishId)?.variants || [],
    [catalog, editingDishId]
  );

  // --- Load Context & Ensure Days ---
  const loadContextAndEnsureDays = useCallback(
    async (keepSelection = false) => {
      if (!token) return;
      try {
        if (!keepSelection) setLoading(true);

        const res = await fetch("/api/v2/admin/menu-context", {
          credentials: "include",
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (!json.ok) throw new Error(json.errors?.[0]?.message || "Failed to load context");

        const fetchedDays = json.data.schedule.serviceDays || [];
        const fetchedCatalog = json.data.catalog;

        const existingDates = new Set(fetchedDays.map((d) => d.menuDate.split("T")[0]));
        const missingAny = weekDates.some((date) => !existingDates.has(date));

        if (missingAny) {
          setGenerating(true);
          const startISO = new Date(weekDates[0] + "T12:00:00.000Z").toISOString();
          const endISO = new Date(weekDates[6] + "T12:00:00.000Z").toISOString();

          await fetch("/api/v2/admin/service-days/generate", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            credentials: "include",
            body: JSON.stringify({
              startDate: startISO,
              endDate: endISO,
              serviceOffsetDays: 1,
              daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
            }),
          });

          const retryRes = await fetch("/api/v2/admin/menu-context", {
            credentials: "include",
            headers: { Authorization: `Bearer ${token}` },
          });
          const retryJson = await retryRes.json();
          if (retryJson.ok) {
            setServiceDays(retryJson.data.schedule.serviceDays || []);
            setCatalog(retryJson.data.catalog);
          }
          setGenerating(false);
        } else {
          setServiceDays(fetchedDays);
          setCatalog(fetchedCatalog);
        }
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        if (!keepSelection) setLoading(false);
      }
    },
    [token, weekDates]
  );

  useEffect(() => {
    loadContextAndEnsureDays();
  }, [loadContextAndEnsureDays]);

  // --- Detail Fetch ---
  const fetchDetail = useCallback(async () => {
    if (!token || !currentServiceDay) return;

    try {
      const res = await fetch(`/api/v2/admin/menu-context?serviceDayId=${currentServiceDay.id}`, {
        credentials: "include",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.ok) {
        setActiveContext(json.data.activeContext);

        const everydayMenu = json.data.activeContext?.menus?.find((m) => m.menuType === "EVERYDAY");
        if (everydayMenu && everydayMenu.offerings) {
          setDraftOfferings([...everydayMenu.offerings]);
        } else {
          setDraftOfferings([]);
        }
      }
    } catch (err) {
      console.error("Detail fetch error", err);
    }
  }, [token, currentServiceDay]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  // auto-close add size on date switch
  useEffect(() => {
    setAddingSizeForItemId(null);
    setAddSizeForm({ label: "", priceStr: "", capacity: "" });
    setIsAddingSize(false);
  }, [selectedDate]);

  // --- Persistence Logic ---
  const persistOfferings = async (offeringsToSave) => {
    if (!currentServiceDay) return;
    setSaveLoading(true);

    try {
      let menuId = activeContext?.menus?.find((m) => m.menuType === "EVERYDAY")?.id;

      if (!menuId) {
        const createRes = await fetch(`/api/v2/admin/service-days/${currentServiceDay.id}/menus`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
          body: JSON.stringify({
            menus: [
              {
                menuType: "EVERYDAY",
                title: "Daily Menu",
                displayOrder: 0,
                isPublished: false,
              },
            ],
          }),
        });
        const createJson = await createRes.json();
        if (!createJson.ok) throw new Error("Failed to create menu container");

        const ensuredId = createJson.data?.results?.find((r) => r.menuType === "EVERYDAY")?.menu?.id;
        menuId = ensuredId || menuId;

        if (!menuId) {
          const detailRes = await fetch(`/api/v2/admin/menu-context?serviceDayId=${currentServiceDay.id}`, {
            credentials: "include",
            headers: { Authorization: `Bearer ${token}` },
          });
          const detailJson = await detailRes.json();
          menuId = detailJson.data.activeContext?.menus?.find((m) => m.menuType === "EVERYDAY")?.id;
        }
      }

      if (!menuId) throw new Error("Could not resolve Menu ID");

      const offeringsPayload = offeringsToSave.map((item, index) => ({
        menuVariantId: item.menuVariantId,
        position: index,
        isAvailable: item.isAvailable !== false,
        priceOverrideCents: item.priceOverrideCents ?? null,
        capacityOverride: item.capacityOverride ?? null,
        maxPerOrder: item.maxPerOrder ?? null,
      }));

      const putRes = await fetch(`/api/v2/admin/menus/${menuId}/offerings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({ offerings: offeringsPayload }),
      });

      if (!putRes.ok) throw new Error("Failed to save offerings");

      const shouldPublish = offeringsToSave.length > 0;
      const finalPublishState = currentServiceDay.isClosed ? false : shouldPublish;

      await fetch(`/api/v2/admin/service-days/${currentServiceDay.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({ isPublished: finalPublishState }),
      });

      await fetchDetail();
      await loadContextAndEnsureDays(true);

      return true;
    } catch (err) {
      console.error("Save failed", err);
      setNotification({ open: true, message: `Error: ${err.message}`, severity: "error" });
      return false;
    } finally {
      setSaveLoading(false);
    }
  };

  // --- New Item Creation ---
  const handleCreateItem = async () => {
    if (!newItemForm.name) {
      setNotification({ open: true, message: "Name is required", severity: "error" });
      return;
    }
    if (newItemForm.variants.length === 0) {
      setNotification({ open: true, message: "At least one variant is required", severity: "error" });
      return;
    }
    const invalidVariant = newItemForm.variants.find((v) => !v.priceStr);
    if (invalidVariant) {
      setNotification({ open: true, message: "All variants must have a price", severity: "error" });
      return;
    }

    setCreatingItem(true);
    try {
      const payload = {
        name: newItemForm.name,
        imageUrl: newItemForm.imageUrl || null,
        description: newItemForm.description || null,
        categoryId: newItemForm.categoryId ? parseInt(newItemForm.categoryId, 10) : null,
        nutrition: {},
        contains: newItemForm.contains
          ? newItemForm.contains.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
        variants: newItemForm.variants.map((v) => ({
          label: v.label || "Standard",
          basePriceCents: Math.round(parseFloat(v.priceStr) * 100),
          baseCapacity: v.capacity ? parseInt(v.capacity, 10) : null,
        })),
      };

      ["calories", "fat", "carbs", "protein"].forEach((k) => {
        if (newItemForm.nutrition[k]) payload.nutrition[k] = parseFloat(newItemForm.nutrition[k]);
      });

      const res = await fetch("/api/v2/admin/catalog/menu-items", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!json.ok) throw new Error(json.errors?.[0]?.message || "Creation failed");

      const newItem = json.data;
      const newOfferingsToAdd = (newItem.variants || []).map((v) => ({
        id: `temp-${Date.now()}-${v.id}`,
        menuVariantId: v.id,
        isAvailable: true,
        priceOverrideCents: null,
        capacityOverride: null,
        maxPerOrder: null,
      }));

      const updatedList = [...draftOfferings];
      for (const o of newOfferingsToAdd) {
        if (!updatedList.some((x) => x.menuVariantId === o.menuVariantId)) updatedList.push(o);
      }

      setDraftOfferings(updatedList);
      const saved = await persistOfferings(updatedList);

      if (saved) {
        setNotification({
          open: true,
          message: `Created "${newItem.name}" and added to ${getSelectedDayName()}`,
          severity: "success",
        });
        handleCloseNewItem();
      }
    } catch (err) {
      console.error("Create Item Error", err);
      setNotification({ open: true, message: err.message, severity: "error" });
    } finally {
      setCreatingItem(false);
    }
  };

  const handleCloseNewItem = () => {
    setNewItemOpen(false);
    setNewItemForm({
      name: "",
      imageUrl: "",
      description: "",
      categoryId: "",
      nutrition: { calories: "", fat: "", carbs: "", protein: "" },
      contains: "",
      variants: [{ label: "", priceStr: "", capacity: "" }],
    });
    setShowNutrition(false);
  };

  // --- Inline Editing ---
  const handleRemoveOffering = (id) => {
    const newList = draftOfferings.filter((o) => o.id !== id);
    setDraftOfferings(newList);
    persistOfferings(newList);
  };

  const toggleDishExpand = (itemId) => {
    const next = new Set(expandedDishes);
    if (next.has(itemId)) next.delete(itemId);
    else next.add(itemId);
    setExpandedDishes(next);
  };

  const handleStartEdit = (offering, field) => {
    let val = "";
    if (field === "price") {
      if (offering.priceOverrideCents !== null && offering.priceOverrideCents !== undefined) {
        val = (offering.priceOverrideCents / 100).toFixed(2);
      }
    } else if (field === "capacity") {
      if (offering.capacityOverride !== null && offering.capacityOverride !== undefined) {
        val = offering.capacityOverride.toString();
      }
    }
    setEditingCell({ id: offering.id, field, value: val });
  };

  const handleCommitEdit = () => {
    if (!editingCell) return;
    const { id, field, value } = editingCell;

    const index = draftOfferings.findIndex((o) => o.id === id);
    if (index === -1) {
      setEditingCell(null);
      return;
    }

    const strVal = value.trim();
    const updatedItem = { ...draftOfferings[index] };

    if (field === "price") {
      if (strVal === "") updatedItem.priceOverrideCents = null;
      else {
        const floatVal = parseFloat(strVal);
        if (isNaN(floatVal) || floatVal < 0) {
          setNotification({ open: true, message: "Invalid price", severity: "error" });
          setEditingCell(null);
          return;
        }
        updatedItem.priceOverrideCents = Math.round(floatVal * 100);
      }
    } else if (field === "capacity") {
      if (strVal === "") updatedItem.capacityOverride = null;
      else {
        const intVal = parseInt(strVal, 10);
        if (isNaN(intVal) || intVal < 0) {
          setNotification({ open: true, message: "Invalid capacity", severity: "error" });
          setEditingCell(null);
          return;
        }
        updatedItem.capacityOverride = intVal;
      }
    }

    const newList = [...draftOfferings];
    newList[index] = updatedItem;

    setDraftOfferings(newList);
    setEditingCell(null);
    persistOfferings(newList);
  };

  const handleToggleAvailable = (id) => {
    const index = draftOfferings.findIndex((o) => o.id === id);
    if (index === -1) return;

    const newList = [...draftOfferings];
    newList[index] = { ...newList[index], isAvailable: !newList[index].isAvailable };

    setDraftOfferings(newList);
    persistOfferings(newList);
  };

  const handleStartLabelEdit = (variantId, currentLabel) => {
    setEditingLabel({ variantId, value: currentLabel });
  };

  const handleCommitLabelEdit = async () => {
    if (!editingLabel) return;
    const { variantId, value } = editingLabel;
    const trimmed = value.trim();

    if (!trimmed) {
      setNotification({ open: true, message: "Label cannot be empty", severity: "error" });
      return;
    }

    try {
      const res = await fetch(`/api/v2/admin/catalog/menu-variants/${variantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        credentials: "include",
        body: JSON.stringify({ label: trimmed }),
      });

      const json = await res.json();
      if (!json.ok) throw new Error(json.errors?.[0]?.message || "Update failed");

      setNotification({ open: true, message: "Size updated", severity: "success" });
      setEditingLabel(null);
      await loadContextAndEnsureDays(true);
    } catch (err) {
      console.error("Update Label Error", err);
      setNotification({ open: true, message: err.message, severity: "error" });
      setEditingLabel(null);
    }
  };

  // --- Edit Dish Logic ---
  const handleStartDishEdit = (item) => {
    setEditingDishId(item.id);
    setEditDishForm({
      name: item.name,
      imageUrl: item.imageUrl || "",
      description: item.description || "",
      categoryId: item.categoryId || "",
      nutrition: {
        calories: item.nutrition?.calories || "",
        fat: item.nutrition?.fat || "",
        carbs: item.nutrition?.carbs || "",
        protein: item.nutrition?.protein || "",
      },
      contains: item.allergens?.contains?.join(", ") || "",
    });
    setAddVariantMode(false);
    setEditDishOpen(true);
  };

  const handleCloseDishEdit = () => {
    setEditDishOpen(false);
    setEditingDishId(null);
    setShowNutrition(false);
    setAddVariantMode(false);
  };

  const handleSaveDishEdit = async () => {
    if (!editDishForm.name) {
      setNotification({ open: true, message: "Name is required", severity: "error" });
      return;
    }

    setIsSavingDish(true);
    try {
      const payload = {
        name: editDishForm.name,
        imageUrl: editDishForm.imageUrl || null,
        description: editDishForm.description || null,
        categoryId: editDishForm.categoryId ? parseInt(editDishForm.categoryId, 10) : null,
        contains: editDishForm.contains ? editDishForm.contains.split(",").map((s) => s.trim()).filter(Boolean) : [],
        nutrition: null,
      };

      const n = editDishForm.nutrition;
      if (n.calories || n.fat || n.carbs || n.protein) {
        payload.nutrition = {};
        if (n.calories) payload.nutrition.calories = parseFloat(n.calories);
        if (n.fat) payload.nutrition.fat = parseFloat(n.fat);
        if (n.carbs) payload.nutrition.carbs = parseFloat(n.carbs);
        if (n.protein) payload.nutrition.protein = parseFloat(n.protein);
      }

      const res = await fetch(`/api/v2/admin/catalog/menu-items/${editingDishId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!json.ok) throw new Error(json.errors?.[0]?.message || json.error || "Update failed");

      setNotification({ open: true, message: "Updated dish successfully", severity: "success" });
      handleCloseDishEdit();
      loadContextAndEnsureDays(true);
    } catch (err) {
      console.error("Update Dish Error", err);
      setNotification({ open: true, message: err.message, severity: "error" });
    } finally {
      setIsSavingDish(false);
    }
  };

  // --- Add Size (Modal) ---
  const handleSaveNewVariant = async () => {
    if (!addVariantForm.label) {
      setNotification({ open: true, message: "Label is required", severity: "error" });
      return;
    }
    if (!addVariantForm.priceStr) {
      setNotification({ open: true, message: "Price is required", severity: "error" });
      return;
    }

    const priceVal = parseFloat(addVariantForm.priceStr);
    if (!Number.isFinite(priceVal) || priceVal < 0) {
      setNotification({ open: true, message: "Enter a valid price", severity: "error" });
      return;
    }

    let capVal = null;
    if (addVariantForm.capacity && addVariantForm.capacity.trim() !== "") {
      const parsed = parseInt(addVariantForm.capacity, 10);
      if (!Number.isFinite(parsed) || parsed < 0) {
        setNotification({ open: true, message: "Enter a valid capacity or leave blank", severity: "error" });
        return;
      }
      capVal = parsed;
    }

    setIsSavingVariant(true);
    try {
      const payload = {
        label: addVariantForm.label.trim(),
        basePriceCents: Math.round(priceVal * 100),
        baseCapacity: capVal,
      };

      const res = await fetch(`/api/v2/admin/catalog/menu-items/${editingDishId}/variants`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!json.ok) {
        const isDup = json.errors?.some((e) => e.code === "DUPLICATE_LABEL");
        throw new Error(isDup ? "This size label already exists." : json.errors?.[0]?.message || "Failed to add size");
      }

      setNotification({ open: true, message: "Added size", severity: "success" });

      setAddVariantForm({ label: "", priceStr: "", capacity: "" });
      setAddVariantMode(false);

      await loadContextAndEnsureDays(true);
    } catch (err) {
      console.error("Add Variant Error", err);
      setNotification({ open: true, message: err.message, severity: "error" });
    } finally {
      setIsSavingVariant(false);
    }
  };

  // --- Inline Add Size (Table) ---
  const startAddSize = (itemId) => {
    setAddingSizeForItemId(itemId);
    setAddSizeForm({ label: "", priceStr: "", capacity: "" });
    setExpandedDishes((prev) => {
      const next = new Set(prev);
      next.add(itemId);
      return next;
    });
  };

  const cancelAddSize = () => {
    setAddingSizeForItemId(null);
    setAddSizeForm({ label: "", priceStr: "", capacity: "" });
    setIsAddingSize(false);
  };

  const submitAddSize = async (itemId) => {
    if (!addSizeForm.label.trim()) {
      setNotification({ open: true, message: "Label required", severity: "error" });
      return;
    }
    const priceVal = parseFloat(addSizeForm.priceStr);
    if (!Number.isFinite(priceVal) || priceVal < 0) {
      setNotification({ open: true, message: "Valid price required", severity: "error" });
      return;
    }
    let capVal = null;
    if (addSizeForm.capacity.trim()) {
      const c = parseInt(addSizeForm.capacity, 10);
      if (!Number.isFinite(c) || c < 0) {
        setNotification({ open: true, message: "Valid capacity required", severity: "error" });
        return;
      }
      capVal = c;
    }

    setIsAddingSize(true);
    try {
      const payload = {
        label: addSizeForm.label.trim(),
        basePriceCents: Math.round(priceVal * 100),
        baseCapacity: capVal,
      };

      const res = await fetch(`/api/v2/admin/catalog/menu-items/${itemId}/variants`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!json.ok) {
        const isDup = Array.isArray(json.errors) && json.errors.some((e) => e.code === "DUPLICATE_LABEL");
        throw new Error(isDup ? "Label already exists for this dish." : json.errors?.[0]?.message || "Failed to add size");
      }

      const newVariantId = json.data.id;

      await loadContextAndEnsureDays(true);

      const newOffering = {
        id: `temp-${Date.now()}-${newVariantId}`,
        menuVariantId: newVariantId,
        isAvailable: true,
        priceOverrideCents: null,
        capacityOverride: null,
        maxPerOrder: null,
      };

      const nextOfferings = [...draftOfferings];
      if (!nextOfferings.some((o) => o.menuVariantId === newVariantId)) nextOfferings.push(newOffering);

      setDraftOfferings(nextOfferings);
      await persistOfferings(nextOfferings);

      setNotification({ open: true, message: "Size added and scheduled", severity: "success" });
      cancelAddSize();
    } catch (err) {
      console.error(err);
      setNotification({ open: true, message: err.message, severity: "error" });
    } finally {
      setIsAddingSize(false);
    }
  };

  // --- Render helpers ---
  const getDayStatus = (dateStr) => {
    const day = serviceDays.find((d) => d.menuDate.startsWith(dateStr));
    if (!day) return "missing";
    if (day.isClosed) return "closed";
    if (day.isPublished) return "live";
    return "draft";
  };

  const getSelectedDayName = () => {
    const idx = weekDates.indexOf(selectedDate);
    return idx !== -1 ? WEEKDAYS[idx] : "DAY";
  };

  const dayStatusColors = {
    missing: "border-transparent text-gray-600",
    closed: "border-red-900/50 text-red-400 bg-red-900/10",
    live: "border-green-900/50 text-green-400 bg-green-900/10",
    draft: "border-border text-muted-foreground hover:bg-white/5",
  };

  // --- Render ---
  if (loading || generating) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-muted-foreground gap-3">
        <Loader2 className="h-6 w-6 animate-spin" />
        <div className="text-sm">{generating ? "Initializing weekly schedule..." : "Loading scheduler..."}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-2xl font-bold tracking-tight">Menu Scheduler</div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {saveLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Saving…</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              <span>Auto-saved</span>
            </>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-foreground flex items-start justify-between gap-3">
          <div>{error}</div>
          <button
            className="rounded-md p-1 text-muted-foreground hover:bg-white/5"
            onClick={() => setError(null)}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Tabs + Toolbar */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <div className="px-4 pt-4">
            <TabsList>
              <TabsTrigger value="items">Menu Items</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
              <TabsTrigger value="addons">Add-ons</TabsTrigger>
            </TabsList>
          </div>

          {currentTab === "items" && (
            <div className="px-4 py-4 mt-4 border-t border-border flex items-center gap-3">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Filter items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex-1" />
              <Button onClick={() => setNewItemOpen(true)}>
                <Plus className="h-4 w-4" />
                New Item
              </Button>
            </div>
          )}
        </Tabs>
      </div>

      {/* Weekday Strip */}
      <WeekdayStrip
        weekDates={weekDates}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        getDayStatus={getDayStatus}
        dayStatusColors={dayStatusColors}
        WEEKDAYS={WEEKDAYS}
      />

      {/* Main content */}
      {currentTab === "items" ? (
        <GroupedMenuTable
          groupedOfferings={groupedOfferings}
          expandedDishes={expandedDishes}
          toggleDishExpand={toggleDishExpand}
          searchQuery={searchQuery}
          editingCell={editingCell}
          setEditingCell={setEditingCell}
          handleStartEdit={handleStartEdit}
          handleCommitEdit={handleCommitEdit}
          editingLabel={editingLabel}
          setEditingLabel={setEditingLabel}
          handleStartLabelEdit={handleStartLabelEdit}
          handleCommitLabelEdit={handleCommitLabelEdit}
          handleToggleAvailable={handleToggleAvailable}
          handleRemoveOffering={handleRemoveOffering}
          handleStartDishEdit={handleStartDishEdit}
          formatMoney={formatMoney}
          formatMacrosRow={formatMacrosRow}
          getSelectedDayName={getSelectedDayName}
          onOpenCreateFirst={() => setNewItemOpen(true)}
          addingSizeForItemId={addingSizeForItemId}
          addSizeForm={addSizeForm}
          setAddSizeForm={setAddSizeForm}
          isAddingSize={isAddingSize}
          startAddSize={startAddSize}
          cancelAddSize={cancelAddSize}
          submitAddSize={submitAddSize}
        />
      ) : (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
          Coming soon…
        </div>
      )}

      {/* Modals */}
      <NewItemModal
        open={newItemOpen}
        onClose={handleCloseNewItem}
        categories={categories}
        showNutrition={showNutrition}
        setShowNutrition={setShowNutrition}
        newItemForm={newItemForm}
        setNewItemForm={setNewItemForm}
        creatingItem={creatingItem}
        onCreateItem={handleCreateItem}
        getNutritionPreview={getNutritionPreview}
      />

      <EditDishModal
        open={editDishOpen}
        onClose={handleCloseDishEdit}
        categories={categories}
        showNutrition={showNutrition}
        setShowNutrition={setShowNutrition}
        editDishForm={editDishForm}
        setEditDishForm={setEditDishForm}
        isSavingDish={isSavingDish}
        onSaveDish={handleSaveDishEdit}
        existingVariants={existingVariants}
        addVariantMode={addVariantMode}
        setAddVariantMode={setAddVariantMode}
        addVariantForm={addVariantForm}
        setAddVariantForm={setAddVariantForm}
        isSavingVariant={isSavingVariant}
        onSaveNewVariant={handleSaveNewVariant}
        formatMoney={formatMoney}
        getNutritionPreview={getNutritionPreview}
      />

      <Toast
        notification={notification}
        onClose={() => setNotification((n) => ({ ...n, open: false }))}
      />
    </div>
  );
}
