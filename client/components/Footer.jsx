import { EnvelopeIcon, PhoneIcon, MapPinIcon } from '@heroicons/react/24/solid';

export default function Footer() {
  return (
    <footer className="bg-black py-10 text-gray-400">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* About & Navigation */}
        <div>
          <h3 className="font-display text-xl text-white mb-4">Food Savvy</h3>
          <ul className="font-sans space-y-2">
            <li><a href="#about" className="hover:text-white">About Us</a></li>
            <li><a href="#how-it-works" className="hover:text-white">How It Works</a></li>
            <li><a href="#faq" className="hover:text-white">FAQ</a></li>
            <li><a href="#contact" className="hover:text-white">Contact</a></li>
          </ul>
        </div>

        {/* Contact Info */}
        <div>
          <h3 className="font-display text-xl text-white mb-4">Contact</h3>
          <ul className="font-sans space-y-3">
            <li className="flex items-center gap-2">
              <EnvelopeIcon className="w-5 h-5 text-accent" />
              <span>hello@foodsavvy.com</span>
            </li>
            <li className="flex items-center gap-2">
              <PhoneIcon className="w-5 h-5 text-accent" />
              <span>(609) 123-4567</span>
            </li>
            <li className="flex items-center gap-2">
              <MapPinIcon className="w-5 h-5 text-accent" />
              <span>East Windsor, NJ</span>
            </li>
          </ul>
        </div>

        {/* Social Media */}
        <div>
          <h3 className="font-display text-xl text-white mb-4">Follow Us</h3>
          <ul className="font-sans space-y-2">
            <li><a href="#" className="hover:text-white">Instagram</a></li>
            <li><a href="#" className="hover:text-white">Facebook</a></li>
            <li><a href="#" className="hover:text-white">Twitter</a></li>
          </ul>
        </div>

        {/* Newsletter Signup (optional) */}
        <div>
          <h3 className="font-display text-xl text-white mb-4">Newsletter</h3>
          <p className="font-sans mb-4">Get weekly updates on our menus and special offers.</p>
          <form className="flex">
            <input 
              type="email" 
              placeholder="Your email" 
              className="px-3 py-2 rounded-l-lg bg-gray-800 text-white outline-none"
            />
            <button 
              type="submit" 
              className="bg-accent hover:bg-accent-dark text-white px-4 py-2 rounded-r-lg transition"
            >
              Subscribe
            </button>
          </form>
        </div>

      </div>

      {/* Bottom Footer */}
      <div className="container mx-auto px-4 mt-10 border-t border-gray-700 pt-6 text-center">
        <p className="font-sans">&copy; {new Date().getFullYear()} Food Savvy. All rights reserved.</p>
      </div>
    </footer>
  );
}
