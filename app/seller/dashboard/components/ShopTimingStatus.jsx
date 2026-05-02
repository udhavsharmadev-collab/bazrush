"use client";

const ShopTimingStatus = ({ shopData, days, onTimingChange, onClosedToggle, onShopStatusToggle }) => {
  return (
    <>
      {/* Shop Timing Section */}
      <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-8 hover:shadow-xl transition-shadow">
        <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent mb-6">Shop Timing</h3>

        <div className="space-y-4">
          {days.map((day) => (
            <div key={day} className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-100 hover:shadow-md transition">
              <div className="w-24">
                <p className="font-medium text-gray-900">{day}</p>
              </div>

              {shopData.timing[day].closed ? (
                <div className="flex-1">
                  <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                    Closed
                  </span>
                </div>
              ) : (
                <div className="flex-1 flex items-center gap-3">
                  <input
                    type="time"
                    value={shopData.timing[day].open}
                    onChange={(e) => onTimingChange(day, 'open', e.target.value)}
                    className="px-3 py-2 border border-purple-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition"
                  />
                  <span className="text-gray-600 font-medium">to</span>
                  <input
                    type="time"
                    value={shopData.timing[day].close}
                    onChange={(e) => onTimingChange(day, 'close', e.target.value)}
                    className="px-3 py-2 border border-purple-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition"
                  />
                </div>
              )}

              <button
                onClick={() => onClosedToggle(day)}
                className={`px-4 py-2 rounded-lg font-semibold transition shadow-md ${
                  shopData.timing[day].closed
                    ? 'bg-gradient-to-r from-purple-300 to-purple-400 text-purple-900 hover:from-purple-400 hover:to-purple-500'
                    : 'bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800'
                }`}
              >
                {shopData.timing[day].closed ? 'Mark Open' : 'Mark Closed'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Shop Status Section */}
      <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-8 hover:shadow-xl transition-shadow">
        <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent mb-6">Shop Status</h3>

        <div className="flex items-center justify-between p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
          <div>
            <p className="font-semibold text-gray-900 text-lg">Shop is Currently</p>
            <p className={`text-2xl font-black mt-1 ${shopData.isOpen ? 'text-green-600' : 'text-red-600'}`} >
              {shopData.isOpen ? '🟢 Open' : '🔴 Closed'}
            </p>
          </div>

          <button
            onClick={onShopStatusToggle}
            className={`px-8 py-3 rounded-lg font-bold transition shadow-lg ${
              shopData.isOpen
                ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white'
                : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white'
            }`}
          >
            {shopData.isOpen ? '🔴 Close Shop' : '🟢 Open Shop'}
          </button>
        </div>
      </div>
    </>
  );
};

export default ShopTimingStatus;

