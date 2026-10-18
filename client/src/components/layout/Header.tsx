import { Menu, ShoppingCart } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '../common/Button.js';

interface HeaderProps {
  onOpenMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu }) => {
  const location = useLocation();

  const getPageTitle = (path: string) => {
    switch (path) {
      case '/':
        return 'Dashboard Overview';
      case '/billing':
        return 'Billing & Point of Sale';
      case '/inventory':
        return 'Inventory Management';
      case '/sales':
        return 'Sales & Invoices History';
      case '/reports':
        return 'Business Reports & Analytics';
      case '/settings':
        return 'Shop & Tax Settings';
      default:
        return 'Store Management';
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 sm:px-6 bg-white border-b border-slate-200 no-print">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="p-1.5 -ml-1 text-slate-500 hover:text-slate-700 md:hidden rounded-md hover:bg-slate-100"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h2 className="text-sm sm:text-base font-semibold text-slate-900">
          {getPageTitle(location.pathname)}
        </h2>
      </div>

      <div className="flex items-center gap-2">
        {location.pathname !== '/billing' && (
          <Link to="/billing">
            <Button size="sm" icon={<ShoppingCart className="w-3.5 h-3.5" />}>
              <span className="hidden sm:inline">New Sale (POS)</span>
              <span className="sm:hidden">Sale</span>
            </Button>
          </Link>
        )}
      </div>
    </header>
  );
};
