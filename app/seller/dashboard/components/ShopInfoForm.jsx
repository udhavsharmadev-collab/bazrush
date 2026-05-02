"use client";

const categories = ['Electronics', 'Clothing', 'Food & Beverages', 'Home & Garden', 'Beauty', 'Books', 'Sports', 'Toys', 'Other'];

const ShopInfoForm = ({ shopData, seller, onInputChange, onFetchAddress }) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-8 hover:shadow-xl transition-shadow">
      <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent mb-6">Shop Information</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Shop Name */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2 bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent">
            Shop Name *
          </label>
          <input
            type="text"
            name="shopName"
            value={shopData.shopName}
            onChange={onInputChange}
            placeholder="Enter your shop name"
            className="w-full px-4 py-3 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition"
          />
        </div>

        {/* Owner Name */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2 bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent">
            Owner Name
          </label>
          <input
            type="text"
            name="ownerName"
            value={shopData.ownerName}
            disabled
            className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2 bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent">
            Shop Category *
          </label>
          <select
            name="category"
            value={shopData.category}
            onChange={onInputChange}
            className="w-full px-4 py-3 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition"
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2 bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent">
            Shop Address *
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              name="address"
              value={shopData.address}
              onChange={onInputChange}
              placeholder="Enter shop address"
              className="flex-1 px-4 py-3 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition"
            />
            <button
              onClick={onFetchAddress}
              className="px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg transition font-semibold shadow-md"
            >
              📍 Fetch
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopInfoForm;

