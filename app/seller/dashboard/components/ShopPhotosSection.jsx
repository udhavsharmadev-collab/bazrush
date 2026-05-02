"use client";

const ShopPhotosSection = ({ shopData, previewPhotos, onMainPhotoChange, onGalleryPhotoChange }) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-8 hover:shadow-xl transition-shadow">
      <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent mb-6">Shop Photos</h3>

      {/* Main Photo */}
      <div className="mb-8">
        <label className="block text-sm font-bold text-gray-700 mb-3 bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">
          Main Shop Photo *
        </label>
        <div className="relative">
          {previewPhotos.mainPhoto ? (
            <div className="w-full h-64 rounded-xl overflow-hidden mb-3 border-2 border-purple-200">
              <img
                src={previewPhotos.mainPhoto}
                alt="Main shop"
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-full h-64 rounded-xl border-2 border-dashed border-purple-300 flex items-center justify-center mb-3 bg-purple-50">
              <span className="text-4xl">📸</span>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={onMainPhotoChange}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          <label className="mt-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg cursor-pointer hover:opacity-90 transition inline-block">
            {previewPhotos.mainPhoto ? 'Change Photo' : 'Upload Photo'}
          </label>
        </div>
      </div>

      {/* Gallery Photos */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-3 bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">
          Gallery Photos (4 photos)
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((index) => (
            <div key={index} className="relative">
              {previewPhotos.photos[index] ? (
                <div className="w-full h-40 rounded-xl overflow-hidden border-2 border-purple-200">
                  <img
                    src={previewPhotos.photos[index]}
                    alt={`Gallery ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-full h-40 rounded-xl border-2 border-dashed border-purple-300 flex items-center justify-center bg-purple-50">
                  <span className="text-2xl">+</span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => onGalleryPhotoChange(index, e)}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <label className="mt-2 px-3 py-1 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg cursor-pointer hover:from-purple-600 hover:to-purple-700 transition inline-block text-sm font-semibold shadow-md">
                {previewPhotos.photos[index] ? 'Change' : 'Add'}
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ShopPhotosSection;

