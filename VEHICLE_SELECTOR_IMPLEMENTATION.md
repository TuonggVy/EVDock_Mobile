# Vehicle Selector for Available Deposit

## ✅ Đã Hoàn Thành

Đã triển khai chức năng chọn xe từ danh sách xe có sẵn trong kho cho form đặt cọc xe có sẵn.

---

## 🎯 Features

### **1. Vehicle Selector Modal:**
```javascript
✅ Modal slide up from bottom
✅ Display list of available vehicles
✅ Show vehicle details (Model, Color, VIN, Price)
✅ "Có sẵn" badge for available vehicles
✅ Select vehicle with visual feedback
✅ Auto-fill form fields when selected
✅ Close modal button
```

### **2. Auto-fill Form Fields:**
```javascript
✅ Vehicle Model → Auto-filled
✅ Vehicle Color → Auto-filled & disabled
✅ Vehicle Price → Auto-filled & disabled with currency format
✅ Vehicle ID → Saved for backend integration
```

### **3. UI/UX:**
```javascript
✅ Gray input boxes for disabled fields
✅ Placeholder text for guidance
✅ Selected vehicle indicator
✅ Selected vehicle details (Color • VIN)
✅ Price formatted as VND currency
✅ Visual highlight for selected card
```

---

## 📊 Complete Workflow

```
Staff clicks "Chọn xe từ kho có sẵn"
  ↓
Modal slides up
  ↓
Display list of available vehicles:
  • Tesla Model Y - Đen (VIN: VIN123456789) - 1,250,000,000 VND
  • Tesla Model Y - Trắng (VIN: VIN987654321) - 1,250,000,000 VND
  • Tesla Model X - Đỏ (VIN: VIN456789123) - 1,800,000,000 VND
  • Tesla Model V - Xanh (VIN: VIN789123456) - 1,500,000,000 VND
  • Tesla Model Y - Xám (VIN: VIN321654987) - 1,250,000,000 VND
  ↓
Staff taps a vehicle card
  ↓
✅ Auto-fill form:
  • Model xe: "Tesla Model Y"
  • Màu xe: "Đen" (disabled, gray background)
  • Giá xe: "1.250.000.000 ₫" (disabled, formatted)
  ↓
Modal closes
  ↓
Show selected vehicle details below model field:
  "Đen • VIN: VIN123456789"
  ↓
Real-time calculation updates:
  • Đặt cọc: 250.000.000 ₫ (20%)
  • Còn lại: 1.000.000.000 ₫ (80%)
  ↓
Staff fills customer info & notes
  ↓
Submit
  ↓
✅ Deposit created with vehicleId:
{
  vehicleId: 'V001',
  vehicleModel: 'Tesla Model Y',
  vehicleColor: 'Đen',
  vehiclePrice: 1250000000,
  ...
}
```

---

## 🔧 Technical Implementation

### **1. State Management:**

```javascript
const [showVehicleSelector, setShowVehicleSelector] = useState(false);
const [selectedVehicle, setSelectedVehicle] = useState(null);

// Mock data - Available vehicles in inventory
const availableVehicles = [
  {
    id: 'V001',
    model: 'Tesla Model Y',
    color: 'Đen',
    price: 1250000000,
    vin: 'VIN123456789',
    status: 'available',
    location: 'Showroom EVDock',
  },
  // ... more vehicles
];
```

### **2. Handle Vehicle Selection:**

```javascript
const handleSelectVehicle = (vehicle) => {
  // Save selected vehicle
  setSelectedVehicle(vehicle);
  
  // Auto-fill form fields
  setFormData(prev => ({
    ...prev,
    vehicleModel: vehicle.model,
    vehicleColor: vehicle.color,
    vehiclePrice: vehicle.price.toString(),
  }));
  
  // Close modal
  setShowVehicleSelector(false);
  
  // Clear error if exists
  if (errors.vehicleModel) {
    setErrors(prev => ({ ...prev, vehicleModel: null }));
  }
};
```

### **3. Vehicle Selector Button:**

```javascript
<TouchableOpacity
  style={[styles.selectInput, errors.vehicleModel && styles.inputError]}
  onPress={() => setShowVehicleSelector(true)}
>
  <View style={styles.selectInputContent}>
    <Text style={[styles.selectInputText, !formData.vehicleModel && styles.placeholderText]}>
      {formData.vehicleModel || 'Chọn xe từ kho có sẵn'}
    </Text>
    {selectedVehicle && (
      <Text style={styles.selectInputSubtext}>
        {selectedVehicle.color} • VIN: {selectedVehicle.vin}
      </Text>
    )}
  </View>
  <Text style={styles.selectIcon}>›</Text>
</TouchableOpacity>
```

### **4. Disabled Input Fields:**

```javascript
// Color field - Disabled & gray background
<TextInput
  style={[styles.input, styles.inputDisabled]}
  placeholder="Màu sẽ tự động điền khi chọn xe"
  placeholderTextColor={COLORS.TEXT.SECONDARY}
  value={formData.vehicleColor}
  editable={false} // ✅ Disabled
/>

// Price field - Disabled, gray background, formatted currency
<TextInput
  style={[styles.input, styles.inputDisabled]}
  placeholder="Giá sẽ tự động điền khi chọn xe"
  placeholderTextColor={COLORS.TEXT.SECONDARY}
  value={formData.vehiclePrice ? formatCurrency(parseFloat(formData.vehiclePrice)) : ''}
  editable={false} // ✅ Disabled
/>

// Styles
inputDisabled: {
  backgroundColor: '#FAFAFA', // ✅ Light gray
  opacity: 0.6,              // ✅ Slightly transparent
}
```

### **5. Vehicle Selector Modal:**

```javascript
<Modal
  visible={showVehicleSelector}
  animationType="slide"
  transparent={true}
  onRequestClose={() => setShowVehicleSelector(false)}
>
  <View style={styles.modalOverlay}>
    <View style={styles.vehicleSelectorModal}>
      {/* Header */}
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>Chọn xe có sẵn</Text>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => setShowVehicleSelector(false)}
        >
          <Text style={styles.closeIcon}>×</Text>
        </TouchableOpacity>
      </View>

      {/* Vehicle List */}
      <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
        {availableVehicles.map((vehicle) => (
          <TouchableOpacity
            key={vehicle.id}
            style={[
              styles.vehicleCard,
              selectedVehicle?.id === vehicle.id && styles.vehicleCardSelected
            ]}
            onPress={() => handleSelectVehicle(vehicle)}
          >
            <View style={styles.vehicleCardHeader}>
              {/* Vehicle Info */}
              <View style={styles.vehicleCardInfo}>
                <Text style={styles.vehicleCardModel}>{vehicle.model}</Text>
                <Text style={styles.vehicleCardColor}>Màu: {vehicle.color}</Text>
                <Text style={styles.vehicleCardVin}>VIN: {vehicle.vin}</Text>
              </View>

              {/* Price & Badge */}
              <View style={styles.vehicleCardRight}>
                <Text style={styles.vehicleCardPrice}>
                  {formatCurrency(vehicle.price)}
                </Text>
                <View style={styles.availableBadge}>
                  <Text style={styles.availableBadgeText}>Có sẵn</Text>
                </View>
              </View>
            </View>

            {/* Selected Indicator */}
            {selectedVehicle?.id === vehicle.id && (
              <View style={styles.selectedIndicator}>
                <Text style={styles.selectedIndicatorText}>✓ Đã chọn</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  </View>
</Modal>
```

### **6. Submit with Vehicle ID:**

```javascript
const depositData = {
  type: 'available',
  vehicleId: selectedVehicle?.id, // ✅ Save vehicle ID
  vehicleModel: formData.vehicleModel,
  vehicleColor: formData.vehicleColor,
  vehiclePrice: parseFloat(formData.vehiclePrice),
  // ... other fields
};

const newDeposit = await depositStorageService.createDeposit(depositData);
```

---

## 🎨 Styling

### **1. Modal Overlay:**
```javascript
modalOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0, 0, 0, 0.5)', // ✅ Dark transparent overlay
  justifyContent: 'flex-end',            // ✅ Modal at bottom
}
```

### **2. Modal Container:**
```javascript
vehicleSelectorModal: {
  backgroundColor: COLORS.SURFACE,
  borderTopLeftRadius: SIZES.RADIUS.XXLARGE,  // ✅ Rounded top corners
  borderTopRightRadius: SIZES.RADIUS.XXLARGE,
  maxHeight: '80%',                            // ✅ Max 80% screen height
}
```

### **3. Vehicle Card:**
```javascript
vehicleCard: {
  backgroundColor: COLORS.SURFACE,
  borderRadius: SIZES.RADIUS.MEDIUM,
  padding: SIZES.PADDING.MEDIUM,
  marginBottom: SIZES.PADDING.MEDIUM,
  borderWidth: 1,
  borderColor: '#E9ECEF', // ✅ Light gray border
}

vehicleCardSelected: {
  borderColor: COLORS.PRIMARY,  // ✅ Blue border when selected
  borderWidth: 2,
  backgroundColor: '#E3F2FD',   // ✅ Light blue background
}
```

### **4. Available Badge:**
```javascript
availableBadge: {
  backgroundColor: '#4CAF50', // ✅ Green for available
  paddingHorizontal: 8,
  paddingVertical: 2,
  borderRadius: SIZES.RADIUS.SMALL,
}

availableBadgeText: {
  fontSize: SIZES.FONT.XSMALL,
  color: COLORS.TEXT.WHITE,
  fontWeight: '600',
}
```

### **5. Selected Indicator:**
```javascript
selectedIndicator: {
  marginTop: SIZES.PADDING.SMALL,
  paddingTop: SIZES.PADDING.SMALL,
  borderTopWidth: 1,
  borderTopColor: '#E9ECEF',
  alignItems: 'center',
}

selectedIndicatorText: {
  fontSize: SIZES.FONT.SMALL,
  color: COLORS.PRIMARY, // ✅ Blue checkmark text
  fontWeight: '600',
}
```

---

## 📱 UI Preview

### **Before Selection:**
```
┌─────────────────────────────────────┐
│ Model xe *                           │
│ ┌─────────────────────────────────┐ │
│ │ Chọn xe từ kho có sẵn        › │ │
│ └─────────────────────────────────┘ │
│                                      │
│ Màu xe                               │
│ ┌─────────────────────────────────┐ │
│ │ Màu sẽ tự động điền khi chọn xe│ │ (Gray, disabled)
│ └─────────────────────────────────┘ │
│                                      │
│ Giá xe *                             │
│ ┌─────────────────────────────────┐ │
│ │ Giá sẽ tự động điền khi chọn xe│ │ (Gray, disabled)
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### **After Selection:**
```
┌─────────────────────────────────────┐
│ Model xe *                           │
│ ┌─────────────────────────────────┐ │
│ │ Tesla Model Y                 › │ │
│ │ Đen • VIN: VIN123456789          │ │ (Subtext)
│ └─────────────────────────────────┘ │
│                                      │
│ Màu xe                               │
│ ┌─────────────────────────────────┐ │
│ │ Đen                              │ │ (Gray, disabled)
│ └─────────────────────────────────┘ │
│                                      │
│ Giá xe *                             │
│ ┌─────────────────────────────────┐ │
│ │ 1.250.000.000 ₫                  │ │ (Gray, disabled, formatted)
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### **Modal View:**
```
┌─────────────────────────────────────┐
│ Chọn xe có sẵn                    × │
├─────────────────────────────────────┤
│                                      │
│ ┌─────────────────────────────────┐ │
│ │ Tesla Model Y    1.250.000.000 ₫│ │
│ │ Màu: Đen          [Có sẵn]      │ │ (Green badge)
│ │ VIN: VIN123456789               │ │
│ └─────────────────────────────────┘ │
│                                      │
│ ┌─────────────────────────────────┐ │ (Selected - Blue border & bg)
│ │ Tesla Model X    1.800.000.000 ₫│ │
│ │ Màu: Đỏ           [Có sẵn]      │ │
│ │ VIN: VIN456789123               │ │
│ │ ─────────────────────────────── │ │
│ │         ✓ Đã chọn               │ │ (Blue text)
│ └─────────────────────────────────┘ │
│                                      │
│ ┌─────────────────────────────────┐ │
│ │ Tesla Model V    1.500.000.000 ₫│ │
│ │ Màu: Xanh         [Có sẵn]      │ │
│ │ VIN: VIN789123456               │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

## 🚀 Backend Integration Ready

### **API Endpoints:**

```javascript
// Get available vehicles
GET /api/inventory/available
Response:
[
  {
    id: 'V001',
    model: 'Tesla Model Y',
    color: 'Đen',
    price: 1250000000,
    vin: 'VIN123456789',
    status: 'available',
    location: 'Showroom EVDock',
    stockDate: '2024-10-01',
  },
  // ... more vehicles
]

// Create deposit with vehicle reservation
POST /api/deposits/available
{
  vehicleId: 'V001', // ✅ Vehicle ID to reserve
  customerId: 'C123',
  depositAmount: 250000000,
  // ... other fields
}

Response:
{
  id: 'DEP001',
  vehicleId: 'V001',
  vehicleStatus: 'reserved', // ✅ Vehicle now reserved
  // ... deposit details
}

// Update vehicle status
PUT /api/inventory/V001
{
  status: 'reserved', // ✅ Mark as reserved
  reservedBy: 'DEP001',
  reservedAt: '2024-10-14...',
}
```

---

## ✅ Features Summary

### **Completed:**
```
✅ Vehicle selector modal with slide animation
✅ Display available vehicles from inventory
✅ Vehicle card with details (Model, Color, VIN, Price)
✅ "Có sẵn" badge for available status
✅ Select vehicle with visual feedback (blue border & background)
✅ Auto-fill form fields (Model, Color, Price)
✅ Disabled & gray styling for auto-filled fields
✅ Currency formatting for price display
✅ Show selected vehicle details (Color • VIN)
✅ Selected indicator (✓ Đã chọn)
✅ Save vehicleId for backend integration
✅ Close modal with X button
✅ No linter errors
```

---

## 🧪 Testing

### **Test Scenario:**
```
1. Navigate to: Home → Deposits → + → Xe có sẵn
2. Click "Chọn xe từ kho có sẵn"
3. ✅ Modal slides up from bottom
4. ✅ See 5 available vehicles
5. Click "Tesla Model X - Đỏ"
6. ✅ Card highlights with blue border & background
7. ✅ "✓ Đã chọn" appears
8. ✅ Modal closes automatically
9. ✅ Form fields auto-filled:
   • Model: "Tesla Model X"
   • Color: "Đỏ" (gray, disabled)
   • Price: "1.800.000.000 ₫" (gray, disabled)
10. ✅ Subtext shows: "Đỏ • VIN: VIN456789123"
11. ✅ Calculation updates:
   • Đặt cọc: 360.000.000 ₫
   • Còn lại: 1.440.000.000 ₫
12. Fill customer info & submit
13. ✅ Deposit created with vehicleId: 'V003'
```

---

## 📝 Notes

### **Mock Data:**
- Currently using 5 mock vehicles
- Replace with API call: `GET /api/inventory/available`
- Filter by `status: 'available'`

### **Vehicle Reservation:**
- When deposit is created, vehicle should be marked as 'reserved'
- Backend should prevent double-booking
- If deposit is cancelled, vehicle status returns to 'available'

### **Future Enhancements:**
- Add search/filter in vehicle selector
- Show vehicle images
- Display more details (year, mileage, features)
- Sort by price, model, color
- Group by model

---

## ✨ Summary

**Chức năng chọn xe từ kho có sẵn đã hoàn thành!** 🎯

Staff có thể:
- ✅ Mở modal chọn xe
- ✅ Xem danh sách xe có sẵn
- ✅ Chọn xe với visual feedback
- ✅ Auto-fill form với thông tin xe
- ✅ Tạo deposit với vehicleId để backend reserve xe

**Ready for backend integration!** 🚀
