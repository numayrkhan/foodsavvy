import { useState } from 'react';
import CateringItemCard from './CateringItemCard';

const cateringItemsSample = [
  { id: 1, name: "Chicken Biryani", price: 14.99, image: "./public/biryani.png" },
  { id: 2, name: "Butter Chicken", price: 12.99, image: "./public/butter-chicken.png" },
  { id: 3, name: "Gulab Jamun", price: 6.99, image: "./public/gulab-jamun.png" },
];

export default function Catering() {
  const [eventDate, setEventDate] = useState('');
  const [guestCount, setGuestCount] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [selectedItems, setSelectedItems] = useState({});
  const [loading, setLoading] = useState(false);

  const handleItemQuantityChange = (itemId, quantity) => {
    setSelectedItems(prev => ({ ...prev, [itemId]: quantity }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!eventDate || !guestCount || guestCount <= 0) {
      alert('🚨 Please enter a valid event date and guest count.');
      setLoading(false);
      return;
    }

    const itemsToOrder = cateringItemsSample
      .filter(item => selectedItems[item.id] > 0)
      .map(item => ({
        name: item.name,
        quantity: Number(selectedItems[item.id]),
        priceCents: Math.round(item.price * 100),
      }));

    if (itemsToOrder.length === 0) {
      alert('🚨 Please select at least one catering item.');
      setLoading(false);
      return;
    }

    const cateringOrder = {
      eventDate,
      guestCount: Number(guestCount),
      specialRequests,
      items: itemsToOrder,
      user: {
        name: "Guest User",
        email: `guest_${Date.now()}@example.com`,
      },
    };

    try {
      const response = await fetch('/api/catering/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cateringOrder),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit catering order.');
      }

      const result = await response.json();
      console.log('Catering Order created successfully:', result);
      alert('🎉 Catering order submitted successfully!');

      setEventDate('');
      setGuestCount('');
      setSpecialRequests('');
      setSelectedItems({});
      
    } catch (error) {
      console.error('Error:', error);
      alert(`🚨 Error submitting catering order: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-12 md:py-20 bg-black text-white">
      <div className="container mx-auto px-4">
        <h2 className="font-display text-4xl text-center mb-10">Catering Services</h2>

        <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl mx-auto">
          <div>
            <label className="block mb-2 font-sans">Event Date</label>
            <input type="date" required
              value={eventDate} onChange={(e) => setEventDate(e.target.value)}
              className="w-full p-3 rounded-lg bg-gray-800 text-white outline-none"
            />
          </div>

          <div>
            <label className="block mb-2 font-sans">Guest Count</label>
            <input type="number" required placeholder="Number of guests"
              value={guestCount} onChange={(e) => setGuestCount(e.target.value)}
              className="w-full p-3 rounded-lg bg-gray-800 text-white outline-none"
            />
          </div>

          <div>
            <label className="block mb-2 font-sans">Special Requests</label>
            <textarea placeholder="Any special requests..."
              value={specialRequests} onChange={(e) => setSpecialRequests(e.target.value)}
              className="w-full p-3 rounded-lg bg-gray-800 text-white outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {cateringItemsSample.map(item => (
              <CateringItemCard 
                key={item.id} 
                item={item}
                quantity={selectedItems[item.id] || 0}
                onQuantityChange={handleItemQuantityChange}
              />
            ))}
          </div>

          <button 
            type="submit" 
            className={`bg-accent hover:bg-accent-dark text-white px-6 py-3 rounded-lg transition ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Submit Catering Request'}
          </button>
        </form>
      </div>
    </section>
  );
}
