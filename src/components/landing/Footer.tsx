import { GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";
import { ScrollReveal, StaggerContainer, StaggerItem } from "./ScrollReveal";

const footerLinks = {
  Product: [
    { label: "Find Tutors", href: "/find-tutors", isRoute: true },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Pricing", href: "#pricing" },
    { label: "Become a Tutor", href: "#become-tutor" },
  ],
  Company: [
    { label: "About", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Contact", href: "#" },
    { label: "Blog", href: "#" },
  ],
  Support: [
    { label: "Help Center", href: "#" },
    { label: "Safety", href: "#" },
    { label: "Community", href: "#" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
    { label: "Cookie Policy", href: "#" },
  ],
};

const Footer = () => {
  return (
    <footer className="border-t bg-card">
      <div className="container py-16">
        <ScrollReveal variant="fadeUp">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-6">
            {/* Brand */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <GraduationCap className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-lg font-bold text-foreground">Tutor Quest</span>
              </div>
              <p className="mt-4 max-w-xs text-body-sm text-muted-foreground leading-relaxed">
                Connecting students with trusted local tutors for personalized,
                high-quality learning experiences.
              </p>
            </div>

            {/* Link Columns */}
            {Object.entries(footerLinks).map(([title, links]) => (
              <div key={title}>
                <h4 className="text-body-sm font-semibold text-foreground">{title}</h4>
                <ul className="mt-4 space-y-3">
                  {links.map((link) => (
                    <li key={link.label}>
                      {"isRoute" in link && link.isRoute ? (
                        <Link to={link.href} className="nav-link-underline text-body-sm text-muted-foreground transition-colors hover:text-foreground">
                          {link.label}
                        </Link>
                      ) : (
                        <a href={link.href} className="nav-link-underline text-body-sm text-muted-foreground transition-colors hover:text-foreground">
                          {link.label}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </div>

      {/* Bottom bar */}
      <div className="border-t">
        <div className="container flex flex-col items-center justify-between gap-4 py-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Tutor Quest. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="nav-link-underline text-xs text-muted-foreground hover:text-foreground transition-colors">Twitter</a>
            <a href="#" className="nav-link-underline text-xs text-muted-foreground hover:text-foreground transition-colors">LinkedIn</a>
            <a href="#" className="nav-link-underline text-xs text-muted-foreground hover:text-foreground transition-colors">Instagram</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
