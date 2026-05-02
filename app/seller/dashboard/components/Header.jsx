import { Menu, X } from 'lucide-react';

const Header = ({ sidebarOpen, setSidebarOpen, seller }) => {
  return (
    <div className="bg-white border-b border-purple-100 shadow-sm p-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="md:hidden p-2 hover:bg-purple-50 rounded-lg transition-colors"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
        <div>
          <h1 className="text-2xl font-black bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">
            Welcome, {seller?.name}! 🎉
          </h1>
          <p className="text-sm text-gray-500">Manage your Bazrush seller account</p>
        </div>
      </div>
    </div>
  );
};

export default Header;
