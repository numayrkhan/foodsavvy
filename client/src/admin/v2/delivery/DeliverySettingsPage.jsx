// client/src/admin/v2/delivery/DeliverySettingsPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { useJsApiLoader, Autocomplete } from "@react-google-maps/api";
import { useAdminAuth } from "../../../auth/useAdminAuth";

const LIBRARIES = ["places"];
const MAPS_KEY = import.meta.env.VITE_Maps_API_KEY || import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

export default function DeliverySettingsPage() {
  const { token } = useAdminAuth();
  
  // --- State ---
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Data State
  // lat/lng stored internally but not shown. "" means invalid/missing.
  const [kitchen, setKitchen] = useState({ address1: "", lat: "", lng: "" });
  const [pricing, setPricing] = useState({ maxMiles: 0, rateDollars: 0 });

  // Maps State
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: MAPS_KEY || "",
    libraries: LIBRARIES,
    preventGoogleFontsLoading: true,
  });
  
  const autocompleteRef = useRef(null);
  const mapsReady = Boolean(MAPS_KEY) && isLoaded && !loadError;

  // --- Actions ---

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v2/admin/delivery/settings", {
        credentials: "include",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      
      if (!json.ok) throw new Error(json.errors?.[0]?.message || "Failed to load settings");

      const k = json.data.kitchen || {};
      const p = json.data.pricing || {};

      setKitchen({
        address1: k.address1 || "",
        lat: k.lat ?? "",
        lng: k.lng ?? "",
      });

      setPricing({
        maxMiles: p.maxMiles || 0,
        rateDollars: (p.rateCentsPerMile || 0) / 100,
      });
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchSettings();
  }, [token]);

  const handleSave = async () => {
    setError(null);
    setSuccessMsg(null);

    // Prepare numbers
    const latNum = kitchen.lat === "" ? null : Number(kitchen.lat);
    const lngNum = kitchen.lng === "" ? null : Number(kitchen.lng);
    const maxMilesNum = Number(pricing.maxMiles);
    const rateDollarsNum = Number(pricing.rateDollars);

    const hasCoords = latNum !== null && lngNum !== null && Number.isFinite(latNum) && Number.isFinite(lngNum);
    const isEnabledAttempt = maxMilesNum > 0 && rateDollarsNum > 0;
    
    // Validation: If enabling delivery, we MUST have valid coords (from Google Places)
    if (isEnabledAttempt && !hasCoords) {
      setError("Select a kitchen address (with coordinates) before enabling delivery.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        kitchen: {
          address1: kitchen.address1 || null,
          lat: latNum,
          lng: lngNum,
        },
        pricing: {
          maxMiles: maxMilesNum,
          rateCentsPerMile: Math.round(rateDollarsNum * 100),
        },
      };

      const res = await fetch("/api/v2/admin/delivery/settings", {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      
      const json = await res.json();
      if (!json.ok) throw new Error(json.errors?.[0]?.message || "Failed to save");

      setSuccessMsg("Delivery settings saved successfully.");
      
      // Sync state
      const k = json.data.kitchen;
      const p = json.data.pricing;
      setKitchen({
        address1: k.address1 || "",
        lat: k.lat ?? "",
        lng: k.lng ?? "",
      });
      setPricing({
        maxMiles: p.maxMiles,
        rateDollars: p.rateCentsPerMile / 100,
      });

    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // --- Handlers ---

  const onPlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place.geometry && place.geometry.location) {
        // Valid selection
        setKitchen((prev) => ({
          ...prev,
          address1: place.formatted_address || prev.address1,
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        }));
        // Clear any previous "select from dropdown" errors
        if (error?.includes("Select a kitchen address")) setError(null);
      }
    }
  };

  const handleAddressType = (e) => {
    // If user types manually, we invalidate the coordinates immediately
    // ensuring they must select a suggestion to get valid lat/lng.
    setKitchen({
      address1: e.target.value,
      lat: "", 
      lng: "" 
    });
  };

  // --- Computed ---

  const latNum = kitchen.lat === "" ? null : Number(kitchen.lat);
  const lngNum = kitchen.lng === "" ? null : Number(kitchen.lng);
  const locationSet = Number.isFinite(latNum) && Number.isFinite(lngNum);

  const isConfigured = 
    locationSet &&
    Number(pricing.maxMiles) > 0 &&
    Number(pricing.rateDollars) > 0;

  const exampleDistance = 6.5;
  const exampleFee = (exampleDistance * pricing.rateDollars).toFixed(2);

  if (loading) {
    return <div className="p-8 text-gray-400 animate-pulse">Loading delivery settings...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 text-gray-100">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Delivery Settings</h1>
          <p className="text-sm text-gray-400 mt-1">
            Configure kitchen location and delivery pricing rules.
          </p>
        </div>
        
        {/* Status Badge */}
        <div className={`px-4 py-2 rounded-full border text-sm font-semibold flex items-center gap-2 ${
          isConfigured 
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
            : "bg-gray-800 border-gray-700 text-gray-400"
        }`}>
          <div className={`w-2 h-2 rounded-full ${isConfigured ? "bg-emerald-400" : "bg-gray-500"}`} />
          {isConfigured ? "Delivery Enabled" : "Delivery Disabled"}
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-500/40 rounded-lg text-red-200 text-sm">
          ⚠️ {error}
        </div>
      )}
      {successMsg && (
        <div className="mb-6 p-4 bg-emerald-900/20 border border-emerald-500/40 rounded-lg text-emerald-200 text-sm">
          ✅ {successMsg}
        </div>
      )}
      
      {/* Maps Failure Warning */}
      {(loadError || (!MAPS_KEY)) && (
        <div className="mb-6 p-4 bg-amber-900/20 border border-amber-500/40 rounded-lg text-amber-200 text-sm">
          Google Maps isn’t loading. Check your API key / Places API settings. 
          <br/>
          <span className="opacity-75 text-xs">You can view settings, but cannot update location without Maps.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Section 1: Kitchen Location */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            📍 Kitchen Location
          </h2>
          
          <div className="space-y-2">
            <label className="block text-xs font-medium text-gray-400">Address</label>
            
            {mapsReady ? (
              <Autocomplete onLoad={(ref) => (autocompleteRef.current = ref)} onPlaceChanged={onPlaceChanged}>
                <input
                  type="text"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder-gray-500"
                  placeholder="Start typing to search..."
                  value={kitchen.address1}
                  onChange={handleAddressType}
                />
              </Autocomplete>
            ) : (
              <input
                type="text"
                disabled
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-gray-400 cursor-not-allowed"
                value={kitchen.address1 || "(No address set)"}
                readOnly
              />
            )}
            
            {/* Status Line */}
            <div className="flex items-center justify-between text-xs mt-2 min-h-[1.25rem]">
              {locationSet ? (
                <span className="text-emerald-400 font-medium">✅ Location set</span>
              ) : (
                <span className="text-amber-400 font-medium">⚠️ Location not set</span>
              )}
              {!locationSet && mapsReady && kitchen.address1.length > 0 && (
                <span className="text-gray-500">Please select an address from the dropdown.</span>
              )}
            </div>
            
            <p className="text-xs text-gray-500 italic mt-2">
              Used to compute delivery distance. Exact coordinates are hidden.
            </p>
          </div>
        </div>

        {/* Section 2: Pricing */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-sm flex flex-col">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            💲 Pricing & Range
          </h2>

          <div className="space-y-4 flex-1">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Max Delivery Radius (Miles)</label>
              <input
                type="number"
                min="0"
                step="0.1"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                value={pricing.maxMiles}
                onChange={(e) => setPricing({ ...pricing, maxMiles: e.target.value })}
              />
              <p className="text-xs text-gray-500 mt-1">Set to 0 to disable delivery.</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Rate per Mile ($)</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-400">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-7 pr-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={pricing.rateDollars}
                  onChange={(e) => setPricing({ ...pricing, rateDollars: e.target.value })}
                />
              </div>
            </div>

            {isConfigured && (
              <div className="mt-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <p className="text-sm text-gray-300 font-medium mb-1">Preview:</p>
                <p className="text-sm text-gray-400">
                  A customer <strong>{exampleDistance} miles</strong> away will be charged <strong className="text-white">${exampleFee}</strong>.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-8 flex justify-end gap-4 border-t border-gray-800 pt-6">
        <button
          type="button"
          onClick={fetchSettings}
          disabled={loading || saving}
          className="px-6 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white transition-colors disabled:opacity-50"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={loading || saving}
          className="px-6 py-2 rounded-lg text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
}