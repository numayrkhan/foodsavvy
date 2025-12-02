import { StarIcon } from '@heroicons/react/24/solid';

export default function Testimonials() {
  const reviews = [
    {
      name: "Ayesha R.",
      comment: "The biryani is absolutely delicious! The weekly deliveries have made dinner easy and enjoyable.",
      rating: 5,
    },
    {
      name: "Michael S.",
      comment: "Fantastic homemade meals. Every dish feels carefully crafted. Highly recommended!",
      rating: 5,
    },
    {
      name: "Priya K.",
      comment: "Great taste, timely delivery, and always fresh! Food Savvy has changed our weekly meals.",
      rating: 4,
    },
  ];

  return (
    <section className="py-12 md:py-20 bg-dark text-white">
      <div className="container mx-auto px-4">
        <h2 className="font-display text-4xl text-center mb-12">What Our Customers Say</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {reviews.map((review, index) => (
            <div key={index} className="bg-black p-6 rounded-xl shadow-lg">
              <div className="flex items-center justify-center mb-4">
                {[...Array(review.rating)].map((_, i) => (
                  <StarIcon key={i} className="h-5 w-5 text-accent" />
                ))}
              </div>
              <p className="font-sans text-lg italic mb-4">"{review.comment}"</p>
              <h3 className="font-display text-xl text-accent">{review.name}</h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
