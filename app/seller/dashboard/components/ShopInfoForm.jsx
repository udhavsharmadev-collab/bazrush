"use client";

const categories = ['Electronics', 'Clothing', 'Food & Beverages', 'Home & Garden', 'Beauty', 'Books', 'Sports', 'Toys', 'Other'];

const ShopInfoForm = ({ shopData, seller, onInputChange, onFetchAddress }) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-4 sm:p-8 hover:shadow-xl transition-shadow">
      <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent mb-5">
        Shop Information
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">

        {/* Shop Name */}
        <div>
          <label className="block text-sm font-bold mb-1.5 bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent">
            Shop Name *
          </label>
          <input
            type="text"
            name="shopName"
            value={shopData.shopName}
            onChange={onInputChange}
            placeholder="Enter your shop name"
            className="w-full px-3 py-2.5 sm:px-4 sm:py-3 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition text-sm sm:text-base"
          />
        </div>

        {/* Owner Name */}
        <div>
          <label className="block text-sm font-bold mb-1.5 bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent">
            Owner Name
          </label>
          <input
            type="text"
            name="ownerName"
            value={shopData.ownerName}
            disabled
            className="w-full px-3 py-2.5 sm:px-4 sm:py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed text-sm sm:text-base"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-bold mb-1.5 bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent">
            Shop Category *
          </label>
          <select
            name="category"
            value={shopData.category}
            onChange={onInputChange}
            className="w-full px-3 py-2.5 sm:px-4 sm:py-3 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition text-sm sm:text-base"
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-bold mb-1.5 bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent">
            Shop Address *
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              name="address"
              value={shopData.address}
              onChange={onInputChange}
              placeholder="Enter shop address"
              className="flex-1 min-w-0 px-3 py-2.5 sm:px-4 sm:py-3 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition text-sm sm:text-base"
            />
            <button
              onClick={onFetchAddress}
              className="flex-shrink-0 px-3 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg transition font-semibold shadow-md text-sm sm:text-base"
            >
              📍 <span className="hidden sm:inline">Fetch</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ShopInfoForm;