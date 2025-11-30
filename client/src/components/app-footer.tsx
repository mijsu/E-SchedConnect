import { Link } from "wouter";

export function AppFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-8 md:mt-16 lg:mt-20 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-10 py-6 md:py-12 lg:py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 lg:gap-12 mb-6 md:mb-12">
          {/* Brand Section - Full Width on Mobile */}
          <div className="col-span-2 md:col-span-1 space-y-2 md:space-y-3">
            <h3 className="text-base md:text-lg font-semibold tracking-tight text-foreground">E-Sched Connect</h3>
            <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
              Streamline your institution's class scheduling with real-time conflict detection and comprehensive management tools.
            </p>
          </div>

          {/* Product Links */}
          <div className="space-y-2 md:space-y-3">
            <h4 className="text-xs md:text-sm font-semibold text-foreground tracking-wide">PRODUCT</h4>
            <ul className="space-y-1 md:space-y-2">
              <li>
                <a href="#" className="text-xs md:text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#" className="text-xs md:text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Pricing
                </a>
              </li>
              <li>
                <a href="#" className="text-xs md:text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Documentation
                </a>
              </li>
              <li>
                <a href="#" className="text-xs md:text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Support
                </a>
              </li>
            </ul>
          </div>

          {/* Company Links */}
          <div className="space-y-2 md:space-y-3">
            <h4 className="text-xs md:text-sm font-semibold text-foreground tracking-wide">COMPANY</h4>
            <ul className="space-y-1 md:space-y-2">
              <li>
                <a href="#" className="text-xs md:text-sm text-muted-foreground hover:text-foreground transition-colors">
                  About
                </a>
              </li>
              <li>
                <a href="#" className="text-xs md:text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="text-xs md:text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Contact
                </a>
              </li>
              <li>
                <a href="#" className="text-xs md:text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Careers
                </a>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div className="space-y-2 md:space-y-3">
            <h4 className="text-xs md:text-sm font-semibold text-foreground tracking-wide">LEGAL</h4>
            <ul className="space-y-1 md:space-y-2">
              <li>
                <a href="#" className="text-xs md:text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-xs md:text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="text-xs md:text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Security
                </a>
              </li>
              <li>
                <a href="#" className="text-xs md:text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Compliance
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-800 to-transparent mb-6 md:mb-8" />

        {/* Bottom Section */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <p className="text-xs md:text-sm text-muted-foreground">
            © {currentYear} E-Sched Connect. All rights reserved.
          </p>
          <div className="flex gap-4 md:gap-6">
            <a href="#" className="text-xs md:text-sm text-muted-foreground hover:text-foreground transition-colors">
              Status
            </a>
            <a href="#" className="text-xs md:text-sm text-muted-foreground hover:text-foreground transition-colors">
              GitHub
            </a>
            <a href="#" className="text-xs md:text-sm text-muted-foreground hover:text-foreground transition-colors">
              Twitter
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
