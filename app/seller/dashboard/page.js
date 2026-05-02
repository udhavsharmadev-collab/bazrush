"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSeller } from '../../context/SellerContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardTab from './components/DashboardTab';
import OrdersTab from './components/OrdersTab';
import ShopTab from './components/ShopTab';
import ReviewsTab from './components/ReviewsTab';
import ProfileTab from './components/ProfileTab';
import ProductsTab from './components/ProductsTab';

const SellerDashboard = () => {
  const router = useRouter();
  const { isSellerAuthenticated, seller, logoutSeller, updateSellerProfile } = useSeller();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({ name: seller?.name || '', age: seller?.age || '', email: seller?.email || '' });
  const [editMessage, setEditMessage] = useState('');

  useEffect(() => {
    if (!isSellerAuthenticated) router.push('/seller/login');
  }, [isSellerAuthenticated, router]);

  useEffect(() => {
    if (seller) setEditFormData({ name: seller.name || '', age: seller.age || '', email: seller.email || '' });
  }, [seller]);

  if (!isSellerAuthenticated || !seller) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-purple-50">
      <p className="text-gray-500">Loading...</p>
    </div>
  );

  const handleLogout = () => { if (confirm('Are you sure you want to logout?')) logoutSeller(); };
  const handleEditChange = (e) => { const { name, value } = e.target; setEditFormData(prev => ({ ...prev, [name]: value })); };

  const handleSaveProfile = async () => {
    setEditMessage('');
    if (!editFormData.name.trim()) { setEditMessage('❌ Name cannot be empty'); return; }
    if (editFormData.age < 18) { setEditMessage('❌ Must be 18+ to be a seller'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editFormData.email)) { setEditMessage('❌ Invalid email address'); return; }
    try {
      const result = await updateSellerProfile(editFormData);
      if (result.success) { setEditMessage('✅ Profile updated successfully!'); setTimeout(() => { setIsEditing(false); setEditMessage(''); }, 1000); }
      else setEditMessage(`❌ ${result.error}`);
    } catch (error) { setEditMessage(`❌ Failed to save: ${error.message}`); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 flex">
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        handleLogout={handleLogout}
      />
      <div className="flex-1 flex flex-col pt-14 md:pt-0">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} seller={seller} />
        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'dashboard' && <DashboardTab seller={seller} />}
          {activeTab === 'orders'    && <OrdersTab seller={seller} />}
          {activeTab === 'shop'      && <ShopTab seller={seller} />}
          {activeTab === 'reviews'   && <ReviewsTab seller={seller} />}
          {activeTab === 'products'  && <ProductsTab seller={seller} />}
          {activeTab === 'profile'   && (
            <ProfileTab seller={seller} isEditing={isEditing} editMessage={editMessage} editFormData={editFormData}
              handleEditChange={handleEditChange} handleSaveProfile={handleSaveProfile}
              setIsEditing={setIsEditing} setEditMessage={setEditMessage} />
          )}
        </div>
      </div>
    </div>
  );
};

export default SellerDashboard;