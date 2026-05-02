import { LogOut, LayoutDashboard, ShoppingBag, Store, MessageCircle, User, X, Menu, ChevronRight, FileText } from 'lucide-react';

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'orders', label: 'Orders', icon: FileText},
  { id: 'shop', label: 'Your Shop', icon: Store },
  { id: 'products', label: 'Products', icon: ShoppingBag },
  { id: 'reviews', label: 'Reviews', icon: MessageCircle },
  { id: 'profile', label: 'Profile', icon: User },
];

const Sidebar = ({ sidebarOpen, setSidebarOpen, activeTab, setActiveTab, handleLogout }) => {
  const handleNavClick = (id) => {
    setActiveTab(id);
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  return (
    <>
      {/* ── Mobile top bar ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-purple-100 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">⚡</span>
          </div>
          <h2 className="font-black text-base bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">
            Bazrush
          </h2>
        </div>
        <button
          onClick={() => setSidebarOpen(true)}
          className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 hover:bg-purple-100 transition-all"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* ── Mobile backdrop ── */}
      <div
        onClick={() => setSidebarOpen(false)}
        className={`md:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-all duration-300 ${
          sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* ── Sidebar panel ── */}
      <div
        className={`
          fixed md:relative top-0 left-0 h-screen z-50
          bg-white border-r border-purple-100 shadow-lg
          flex flex-col flex-shrink-0
          transition-all duration-300 ease-in-out
          ${sidebarOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full md:translate-x-0 md:w-20'}
        `}
      >
        {/* Logo + close/collapse */}
        <div className="p-4 border-b border-purple-100 flex items-center justify-between flex-shrink-0 min-h-[72px]">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-lg">⚡</span>
            </div>
            <div className={`transition-all duration-300 overflow-hidden ${sidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0 md:hidden'}`}>
              <h2 className="font-black text-lg bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent whitespace-nowrap">
                Bazrush
              </h2>
              <p className="text-xs text-gray-500">Seller</p>
            </div>
          </div>

          {/* On mobile: X to close. On desktop: X to collapse (when open) or ChevronRight to expand (when closed) */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-8 h-8 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200 transition-all flex-shrink-0"
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <ChevronRight className="w-4 h-4 hidden md:block" />}
          </button>
        </div>

        {/* Nav */}
        <nav className="p-3 space-y-1 mt-2 flex-1 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                title={!sidebarOpen ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-200'
                    : 'text-gray-600 hover:bg-purple-50 hover:text-purple-700'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className={`font-semibold text-sm whitespace-nowrap transition-all duration-300 overflow-hidden ${sidebarOpen ? 'opacity-100 max-w-xs' : 'opacity-0 max-w-0 md:hidden'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-3 flex-shrink-0">
          <button
            onClick={handleLogout}
            title={!sidebarOpen ? 'Logout' : undefined}
            className="w-full flex items-center gap-3 px-3 py-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-all font-semibold border border-red-100"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className={`text-sm whitespace-nowrap transition-all duration-300 overflow-hidden ${sidebarOpen ? 'opacity-100 max-w-xs' : 'opacity-0 max-w-0 md:hidden'}`}>
              Logout
            </span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;6