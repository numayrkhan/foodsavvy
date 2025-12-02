export default function Hero() {
  return (
    <section className="bg-black py-10 md:py-20">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between bg-dark rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Left Side - Text */}
        <div className="text-white px-8 py-12 md:py-16 md:w-1/2">
          <h2 className="font-sans uppercase text-accent font-bold mb-3 tracking-wide">
            Chef’s Special
          </h2>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl leading-tight mb-5">
            Freshness in Every Bite
          </h1>
          <p className="font-sans text-lg mb-8">
            Authentic Hyderabadi biryani made fresh, with traditional spices, delivered weekly to your door.
          </p>
          <a
            href="#weekly-menu"
            className="bg-accent hover:bg-accent-dark text-white font-sans font-semibold px-6 py-3 rounded-full shadow-lg transition"
          >
            Order Now
          </a>
        </div>

        {/* Right Side - Image with matching dark background */}
        <div className="md:w-1/2 flex justify-center items-center py-10 bg-dark">
          <img
            src="./public/biryani.png"
            alt="Delicious Hyderabadi Biryani"
            className="w-72 h-72 md:w-[400px] md:h-[400px] rounded-full object-cover object-bottom shadow-xl"
          />
        </div>
      </div>
    </section>
  );
}
