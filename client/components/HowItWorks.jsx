export default function HowItWorks() {
  const steps = [
    {
      title: "Choose Meals",
      description: "Browse our weekly or everyday menus and select your favorite dishes.",
      icon: "🍲"
    },
    {
      title: "We Cook & Deliver",
      description: "Our chefs freshly prepare your meals, packaged carefully, ready for pickup or delivery.",
      icon: "👩‍🍳"
    },
    {
      title: "Enjoy Your Food",
      description: "Heat, serve, and savor delicious home-cooked meals without the hassle.",
      icon: "🍽️"
    },
  ];

  return (
    <section className="py-12 md:py-20 bg-black text-white">
      <div className="container mx-auto px-4">
        <h2 className="font-display text-4xl text-center mb-10">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {steps.map((step, index) => (
            <div key={index} className="p-6 bg-dark rounded-xl shadow-lg">
              <div className="text-5xl mb-4">{step.icon}</div>
              <h3 className="font-display text-2xl mb-3">{step.title}</h3>
              <p className="font-sans text-lg">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
