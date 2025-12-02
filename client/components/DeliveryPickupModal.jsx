import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";

export default function DeliveryPickupModal({ isOpen, onClose, onSelect }) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Overlay */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-60"
          leave="ease-in duration-150"
          leaveFrom="opacity-60"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black" aria-hidden="true" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="transition ease-out duration-300 transform"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="transition ease-in duration-200 transform"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl backdrop-blur-md bg-white/10 border border-white/20 p-6 text-left align-middle shadow-xl transition-all text-white">
                <Dialog.Title className="text-xl font-semibold mb-2">
                  Complete Your Order
                </Dialog.Title>
                <p className="text-sm text-white/70 mb-4">
                  Is this order for Pick‑Up or Delivery?
                </p>

                <div className="flex gap-4">
                  <button
                    type="button"
                    className="flex-1 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-dark transition"
                    onClick={() => onSelect("pickup")}
                  >
                    Pick‑Up
                  </button>
                  <button
                    type="button"
                    className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition"
                    onClick={() => onSelect("delivery")}
                  >
                    Delivery
                  </button>
                </div>

                <div className="mt-4 text-right">
                  <button
                    type="button"
                    className="text-xs text-white/60 hover:text-white/90 transition"
                    onClick={onClose}
                  >
                    Cancel
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
