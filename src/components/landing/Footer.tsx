import { Instagram, Facebook, Twitter, Linkedin } from "lucide-react";
import { Link } from "react-router-dom";

const footerLinks = {
  "For Students": [
    { label: "Find Tutors",   href: "/find-tutors", isRoute: true },
    { label: "How It Works",  href: "#how-it-works" },
    { label: "Pricing",       href: "#pricing" },
    { label: "FAQ",           href: "#" },
  ],
  "For Tutors": [
    { label: "Become a Tutor",href: "#become-tutor" },
    { label: "Tutor Guide",   href: "#" },
    { label: "Pricing",       href: "#pricing" },
    { label: "Help Center",   href: "#" },
  ],
  "Company": [
    { label: "About Us",      href: "#" },
    { label: "Contact Us",    href: "#" },
    { label: "Terms & Conditions", href: "/terms", isRoute: true },
    { label: "Privacy Policy",href: "/privacy", isRoute: true },
  ],
};


const AppStoreButton = () => (
  <a href="#" className="flex items-center gap-3 bg-black text-white px-4 py-1.5 rounded-[8px] hover:bg-gray-800 transition-colors w-[150px] border border-gray-700">
    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
      <path d="M17.05 20.28c-.98.19-2.05.8-3.04.8-1.02 0-2.12-.64-3.08-.64-1.03 0-2.16.66-3.15.66-2.58 0-5.83-2.91-5.83-7.55 0-3.5 1.78-5.59 4.1-5.59 1.15 0 2.21.64 3.03.64.76 0 1.94-.71 3.22-.71 1.48 0 2.87.5 3.86 1.62-3.14 1.69-2.54 6.2.73 7.64-.53 1.25-1.12 2.37-1.84 3.13zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.31 2.22-1.74 4.31-3.74 4.25z"/>
    </svg>
    <div className="flex flex-col items-start">
      <span className="text-[9px] font-sans leading-none opacity-90 mt-0.5">Download on the</span>
      <span className="text-sm font-sans font-medium leading-tight -mt-0.5">App Store</span>
    </div>
  </a>
);

const PlayStoreButton = () => (
  <a href="#" className="flex items-center gap-3 bg-black text-white px-4 py-1.5 rounded-[8px] hover:bg-gray-800 transition-colors w-[150px] border border-gray-700">
    <svg viewBox="0 0 24 24" width="24" height="24">
      <path fill="currentColor" d="M3.6 20.7L15 12L3.6 3.3C3.2 3.6 3 4 3 4.5v15c0 .5.2.9.6 1.2z"/>
      <path fill="currentColor" d="M15 12l4.8 3.6c.7.5 1.2.2 1.2-.6v-6c0-.8-.5-1.1-1.2-.6L15 12z"/>
      <path fill="currentColor" d="M3.6 3.3L15 12l4.8-3.6C19.1 7.9 18.5 7 17.5 7L5 2C4.3 1.6 3.8 1.8 3.6 3.3z"/>
      <path fill="currentColor" d="M3.6 20.7L15 12l4.8 3.6c-.7.5-1.3 1.4-2.3 1.4L5 22c-.7.4-1.2.2-1.4-1.3z"/>
    </svg>
    <div className="flex flex-col items-start">
      <span className="text-[9px] font-sans leading-none opacity-90 mt-0.5">GET IT ON</span>
      <span className="text-sm font-sans font-medium leading-tight -mt-0.5">Google Play</span>
    </div>
  </a>
);

const Footer = () => {
  return (
    <footer className="pt-20 pb-8 bg-transparent">
      <div className="container max-w-[1200px] mx-auto px-6">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-5 xl:grid-cols-6 mb-12">
          
          {/* Brand Col */}
          <div className="lg:col-span-2 flex flex-col items-start">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <img src="/logo.png?v=3" alt="Tutor Quest Logo" className="w-[52px] h-[52px] object-contain drop-shadow-[2px_2px_0px_rgba(45,45,45,0.2)] -ml-2" />
              <span className="font-kalam text-2xl font-bold text-black tracking-tight mt-1">
                Tutor Quest
              </span>
            </Link>
            <p className="font-patrick text-base text-gray-600 mb-6 max-w-[240px] leading-snug">
              Connecting students with verified, <br/>
              trusted tutors in your neighborhood.
            </p>
            <div className="flex items-center gap-4 text-black">
              <a href="#" aria-label="Instagram" className="hover:text-gray-600 transition-colors bg-white p-1.5 rounded-full border border-black shadow-[1px_1px_0px_black]"><Instagram className="h-4 w-4" strokeWidth={2.5} /></a>
              <a href="#" aria-label="Facebook" className="hover:text-gray-600 transition-colors bg-white p-1.5 rounded-full border border-black shadow-[1px_1px_0px_black]"><Facebook className="h-4 w-4" strokeWidth={2.5} /></a>
              <a href="#" aria-label="Twitter" className="hover:text-gray-600 transition-colors bg-white p-1.5 rounded-full border border-black shadow-[1px_1px_0px_black]"><Twitter className="h-4 w-4" strokeWidth={2.5} /></a>
              <a href="#" aria-label="LinkedIn" className="hover:text-gray-600 transition-colors bg-white p-1.5 rounded-full border border-black shadow-[1px_1px_0px_black]"><Linkedin className="h-4 w-4" strokeWidth={2.5} /></a>
            </div>
          </div>

          {/* Links Cols */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title} className="flex flex-col">
              <h3 className="font-kalam font-bold text-black mb-5 text-lg">{title}</h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    {link.isRoute ? (
                      <Link to={link.href} className="font-patrick text-base text-gray-600 hover:text-black transition-colors">
                        {link.label}
                      </Link>
                    ) : (
                      <a href={link.href} className="font-patrick text-base text-gray-600 hover:text-black transition-colors">
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Download App */}
          <div className="flex flex-col xl:col-span-1">
            <h3 className="font-kalam font-bold text-black mb-5 text-lg">Download App</h3>
            <div className="flex flex-col gap-3">
              <PlayStoreButton />
              <AppStoreButton />
            </div>
          </div>
          
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-gray-300 text-center">
          <p className="font-patrick text-sm text-gray-500 font-medium tracking-wide">
            © 2025 Tutor Quest. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
