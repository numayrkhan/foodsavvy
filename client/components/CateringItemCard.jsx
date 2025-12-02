export default function CateringItemCard({ item, quantity, onQuantityChange }) {
  return (
    <div className="backdrop-blur-sm bg-white/10 border border-white/20 p-5 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] text-white transition-transform duration-300 hover:scale-[1.02]">
      <img
        src={item.image}
        alt={item.name}
        className="w-full h-48 object-cover rounded-xl mb-4"
      />
      <div>
        <h3 className="font-display text-xl font-semibold mb-2">{item.name}</h3>
        <p className="text-accent font-bold mb-4">${item.price.toFixed(2)}</p>
        <input
          type="number"
          min="0"
          value={quantity}
          onChange={(e) => onQuantityChange(item.id, e.target.value)}
          className="w-full p-3 rounded-lg bg-white/10 text-white border border-white/20 placeholder-gray-400 outline-none transition focus:ring-2 focus:ring-accent"
          placeholder="Quantity"
        />
      </div>
    </div>
  );
}
