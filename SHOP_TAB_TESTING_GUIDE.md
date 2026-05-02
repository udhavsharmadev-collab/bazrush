# Shop Tab Testing Guide

## What Was Fixed

✅ **Image Upload** - Now properly uploads to Firebase Storage with:
- File validation (must be image, max 5MB)
- Visual feedback ("Uploading..." indicator)
- Success/error messages with clear feedback
- Images persist when saved

✅ **Fetch Address** - Now intelligently fetches from:
- Previously saved shop address (if exists)
- Seller's saved delivery addresses (if available)
- Falls back to manual entry if nothing available

✅ **Save to sellers.json** - Properly saves all shop data:
- Uploads images to Firebase
- Stores image URLs in form
- Saves everything to sellers.json via PATCH API
- Auto-reloads page to show saved data

---

## Testing Steps

### 1. **Test Image Upload**
1. Go to Seller Dashboard → Shop Tab
2. Click on the upload area (or the "Main Image" placeholder)
3. Select an image file from your computer
4. You should see:
   - "Uploading..." indicator while uploading
   - "✅ Main image uploaded successfully!" message
   - Thumbnail preview appears in the upload box
5. Try uploading inside images (same process)
6. Try uploading invalid files (should show error)
7. Try uploading large files (should show "must be less than 5MB" error)

### 2. **Test Fetch Address**
1. Fill in other shop details first (name, owner, category)
2. Click "Fetch Address" button
3. One of these should happen:
   - If you have saved shop address: it auto-fills
   - If you have saved addresses: gets your default address
   - If neither: shows "Please enter your shop address manually"

### 3. **Test Complete Save Flow**
1. Fill in all required fields:
   - [ ] Shop Name
   - [ ] Owner Name
   - [ ] Address (fetch or manual)
   - [ ] Category (dropdown)
   - [ ] Main Image (upload)
   - [ ] Inside Images (optional - up to 4)
2. Set Business Hours:
   - [ ] Toggle days as Open/Closed
   - [ ] Set open/close times for open days
3. Click "Save Shop" button
4. Wait for success message: "✅ Shop information saved successfully to sellers.json!"
5. Page should auto-reload after 1.5 seconds
6. Verify:
   - [ ] Shop info is displayed in the view mode
   - [ ] Images are showing
   - [ ] Business hours match what you set

### 4. **Verify sellers.json is Updated**
1. Check file: `app/data/sellers.json`
2. Find your seller entry by phone number
3. Verify the `shop` object contains:
   - name, address, category, ownerName
   - images.main (URL from Firebase)
   - images.inside (array of Firebase URLs)
   - hours (full schedule)

---

## Troubleshooting

### Image Not Uploading?
- Check browser console (F12) for Firebase errors
- Verify Firebase storage permissions
- Check file size (must be < 5MB)
- Try a different image file

### Fetch Address Not Working?
- Check if seller has `shop.address` in sellers.json
- Check if seller has `addresses` array in profile
- Falls back to manual entry if nothing found

### Save Not Working?
- Check all required fields are filled
- Check main image is uploaded
- Check browser console for PATCH errors
- Verify sellers.json file permissions (must be writable)

### Data Not Persisting?
- Check sellers.json after save (look for shop object)
- Check localStorage shows updated seller data
- Verify SellerContext is pulling fresh data

---

## Success Indicators

✅ All three features work if you see:
1. Image uploads with success message and preview
2. Fetch Address button fills field or shows helpful message
3. Save succeeds and page reloads with updated shop info
4. sellers.json contains the shop data
