const ProfileTab = ({
  seller,
  isEditing,
  editMessage,
  editFormData,
  handleEditChange,
  handleSaveProfile,
  setIsEditing,
  setEditMessage,
}) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Profile</h2>

      {editMessage && (
        <div className={`p-4 rounded-xl text-center font-medium ${
          editMessage.includes('❌')
            ? 'bg-red-100 text-red-700 border border-red-200'
            : 'bg-green-100 text-green-700 border border-green-200'
        }`}>
          {editMessage}
        </div>
      )}

      {!isEditing ? (
        <div className="bg-white rounded-2xl shadow-lg border border-purple-100 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 h-32"></div>
          <div className="p-8 pt-14 relative">
            <div className="absolute left-1/2 -top-[100px] -translate-x-1/2 w-24 h-24 bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-4xl ">👤</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-2">
                <p className="text-sm text-gray-500 font-medium">Full Name</p>
                <p className="text-xl font-semibold text-gray-900">{seller?.name}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-500 font-medium">Phone Number</p>
                <p className="text-xl font-semibold text-gray-900">{seller?.phoneNumber}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-500 font-medium">Email Address</p>
                <p className="text-xl font-semibold text-gray-900">{seller?.email}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-500 font-medium">Age</p>
                <p className="text-xl font-semibold text-gray-900">{seller?.age} years</p>
              </div>
              <div className="space-y-2 md:col-span-2">
                <p className="text-sm text-gray-500 font-medium">GSTIN</p>
                <p className="text-xl font-semibold text-gray-900 font-mono">{seller?.gstin}</p>
              </div>
              <div className="space-y-2 md:col-span-2">
                <p className="text-sm text-gray-500 font-medium">Registered On</p>
                <p className="text-xl font-semibold text-gray-900">
                  {new Date(seller?.createdAt).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsEditing(true)}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-bold rounded-xl hover:shadow-lg transition-all"
            >
              Edit Profile
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg border border-purple-100 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 h-32"></div>
          <div className="p-8 pt-14 relative">
            <div className="absolute left-1/2 -top-[100px] -translate-x-1/2 w-24 h-24 bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-4xl">✏️</span>
            </div>

            <div className="space-y-5 mb-8">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={editFormData.name}
                  onChange={handleEditChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-600 focus:outline-none transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Age</label>
                <input
                  type="number"
                  name="age"
                  value={editFormData.age}
                  onChange={handleEditChange}
                  min="18"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-600 focus:outline-none transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={editFormData.email}
                  onChange={handleEditChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-600 focus:outline-none transition-colors"
                />
              </div>

              <div className="pt-4 border-t border-gray-200 space-y-3">
                <p className="text-xs text-gray-500 font-medium">These fields cannot be changed</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1">Phone Number</p>
                    <p className="text-lg font-semibold text-gray-900 bg-gray-50 p-3 rounded-lg">{seller?.phoneNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1">GSTIN</p>
                    <p className="text-lg font-semibold text-gray-900 bg-gray-50 p-3 rounded-lg font-mono">{seller?.gstin}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSaveProfile}
                className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-bold rounded-xl hover:shadow-lg transition-all"
              >
                Save Changes
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditMessage('');
                }}
                className="flex-1 py-3 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileTab;
