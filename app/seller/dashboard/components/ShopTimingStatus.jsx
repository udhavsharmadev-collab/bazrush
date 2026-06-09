"use client";

const ShopTimingStatus = ({ shopData, days, onTimingChange, onClosedToggle, onShopStatusToggle }) => {
  return (
    <>
      {/* Shop Timing Section */}
      <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-4 sm:p-8 hover:shadow-xl transition-shadow">
        <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent mb-5">
          Shop Timing
        </h3>

        <div className="space-y-3">
          {days.map((day) => (
            <div key={day} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 sm:p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-100 hover:shadow-md transition">

              {/* Day name + status row on mobile */}
              <div className="flex items-center justify-between sm:block sm:w-24">
                <p className="font-medium text-gray-900 text-sm sm:text-base">{day}</p>
                {shopData.timing[day].closed && (
                  <span className="sm:hidden px-2.5 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                    Closed
                  </span>
                )}
              </div>

              {shopData.timing[day].closed ? (
                <div className="flex-1 hidden sm:block">
                  <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                    Closed
                  </span>
                </div>
              ) : (
                <div className="flex-1 flex items-center gap-2 sm:gap-3">
                  <input
                    type="time"
                    value={shopData.timing[day].open}
                    onChange={(e) => onTimingChange(day, 'open', e.target.value)}
                    className="flex-1 min-w-0 px-2 sm:px-3 py-2 border border-purple-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition"
                  />
                  <span className="text-gray-500 text-xs sm:text-sm font-medium flex-shrink-0">to</span>
                  <input
                    type="time"
                    value={shopData.timing[day].close}
                    onChange={(e) => onTimingChange(day, 'close', e.target.value)}
                    className="flex-1 min-w-0 px-2 sm:px-3 py-2 border border-purple-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition"
                  />
                </div>
              )}

              <button
                onClick={() => onClosedToggle(day)}
                className={`w-full sm:w-auto px-3 sm:px-4 py-2 rounded-lg font-semibold transition shadow-md text-xs sm:text-sm ${
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
      <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-4 sm:p-8 hover:shadow-xl transition-shadow">
        <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent mb-5">
          Shop Status
        </h3>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
          <div>
            <p className="font-semibold text-gray-900 text-base sm:text-lg">Shop is Currently</p>
            <p className={`text-xl sm:text-2xl font-black mt-1 ${shopData.isOpen ? 'text-green-600' : 'text-red-600'}`}>
              {shopData.isOpen ? '🟢 Open' : '🔴 Closed'}
            </p>
          </div>

          <button
            onClick={onShopStatusToggle}
            className={`w-full sm:w-auto px-6 sm:px-8 py-3 rounded-lg font-bold transition shadow-lg text-sm sm:text-base ${
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