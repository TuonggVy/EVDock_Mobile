# Time-Based Promotion Filters

## Tổng quan
Đã thêm tính năng filter theo thời gian cho màn hình Promotions của Dealer Staff, cho phép phân loại promotions dựa trên thời gian thực tế: "Đang diễn ra" và "Sắp diễn ra".

## Tính năng mới

### 1. Time-Based Filtering
- ✅ **Đang diễn ra**: Promotions đang trong thời gian hiệu lực (current date >= startDate && current date <= endDate)
- ✅ **Sắp diễn ra**: Promotions có ngày bắt đầu trong tương lai (current date < startDate)
- ✅ **Tất cả thời gian**: Hiển thị tất cả promotions

### 2. Visual Indicators
- ✅ **Time Status Badge**: Hiển thị trạng thái thời gian trên mỗi promotion card
- ✅ **Color Coding**: Màu sắc khác nhau cho từng trạng thái
- ✅ **Real-time Updates**: Cập nhật theo thời gian thực

## Technical Implementation

### 1. useDealerPromotions Hook Updates

#### New Filter State:
```javascript
const [filters, setFilters] = useState({
  status: 'all', // all, active, upcoming, expired
  priority: 'all', // all, high, medium, low
  model: 'all', // all, Model Y, Model V, Model X
  timeStatus: 'all', // all, active, upcoming (based on current date)
});
```

#### Time Status Logic:
```javascript
const getPromotionTimeStatus = useCallback((promotion) => {
  const now = new Date();
  const startDate = new Date(promotion.startDate);
  const endDate = new Date(promotion.endDate);
  
  if (now >= startDate && now <= endDate) {
    return 'active'; // Đang diễn ra
  } else if (now < startDate) {
    return 'upcoming'; // Sắp diễn ra
  } else {
    return 'expired'; // Đã hết hạn
  }
}, []);
```

#### Enhanced Filtering:
```javascript
// Filter by time status (based on current date)
if (filters.timeStatus !== 'all') {
  filtered = filtered.filter(p => {
    const timeStatus = getPromotionTimeStatus(p);
    return timeStatus === filters.timeStatus;
  });
}
```

### 2. Filter Options Update

#### New Time Status Options:
```javascript
const timeStatusOptions = [
  { key: 'all', label: 'Tất cả thời gian' },
  { key: 'active', label: 'Đang diễn ra' },
  { key: 'upcoming', label: 'Sắp diễn ra' },
];
```

### 3. PromotionManagementScreen Updates

#### Filter Modal Enhancement:
```javascript
{/* Time Status Filter */}
<View style={styles.filterSection}>
  <Text style={styles.filterSectionTitle}>Thời gian</Text>
  {filterOptions.timeStatus.map((option) => (
    <TouchableOpacity
      key={option.key}
      style={[styles.filterOption, filters.timeStatus === option.key && styles.filterOptionSelected]}
      onPress={() => updateFilter('timeStatus', option.key)}
    >
      <Text style={[styles.filterOptionText, filters.timeStatus === option.key && styles.filterOptionTextSelected]}>
        {option.label}
      </Text>
    </TouchableOpacity>
  ))}
</View>
```

#### Visual Time Status Indicator:
```javascript
<View style={styles.headerBadges}>
  <View style={[styles.timeStatusBadge, { 
    backgroundColor: getPromotionTimeStatus(item) === 'active' ? COLORS.SUCCESS : 
                    getPromotionTimeStatus(item) === 'upcoming' ? COLORS.WARNING : COLORS.ERROR 
  }]}>
    <Text style={styles.timeStatusText}>
      {getPromotionTimeStatus(item) === 'active' ? 'Đang diễn ra' : 
       getPromotionTimeStatus(item) === 'upcoming' ? 'Sắp diễn ra' : 'Đã hết hạn'}
    </Text>
  </View>
  {/* Priority badge */}
</View>
```

### 4. Storage Service Updates

#### Enhanced Mock Data:
```javascript
// Current promotions (Đang diễn ra)
{
  id: '1',
  name: 'VIP Weekend Special',
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  status: 'active',
  // ... other fields
},

// Future promotions (Sắp diễn ra)
{
  id: '4',
  name: 'Black Friday Customer Event',
  startDate: '2024-12-01', // Future date
  endDate: '2024-12-31',
  status: 'active',
  // ... other fields
},
{
  id: '5',
  name: 'New Year 2025 Promotion',
  startDate: '2025-01-01', // Future date
  endDate: '2025-01-31',
  status: 'active',
  // ... other fields
}
```

## User Experience

### 1. Filter Interface
- **Filter Modal**: Thêm section "Thời gian" với 3 options
- **Visual Feedback**: Selected filter được highlight
- **Easy Access**: Filter button trong header

### 2. Promotion Cards
- **Time Status Badge**: Hiển thị trạng thái thời gian trên mỗi card
- **Color Coding**: 
  - 🟢 **Đang diễn ra**: Green (COLORS.SUCCESS)
  - 🟡 **Sắp diễn ra**: Yellow (COLORS.WARNING)
  - 🔴 **Đã hết hạn**: Red (COLORS.ERROR)

### 3. Real-time Updates
- **Dynamic Calculation**: Time status được tính toán real-time
- **Auto Refresh**: Khi screen focus, data được refresh
- **Consistent Display**: Tất cả cards hiển thị consistent time status

## Data Flow

### 1. Time Status Calculation
```
Current Date → Compare with startDate/endDate → Determine Time Status → Apply Filter
```

### 2. Filter Application
```
User selects filter → Update filters state → Apply filters → Update filteredPromotions → Re-render cards
```

### 3. Visual Updates
```
Time Status calculated → Badge color determined → Card re-rendered with new badge
```

## Filter Logic

### Time Status Determination:
```javascript
const now = new Date();
const startDate = new Date(promotion.startDate);
const endDate = new Date(promotion.endDate);

if (now >= startDate && now <= endDate) {
  return 'active'; // Đang diễn ra
} else if (now < startDate) {
  return 'upcoming'; // Sắp diễn ra
} else {
  return 'expired'; // Đã hết hạn
}
```

### Filter Application:
```javascript
// When timeStatus filter is applied
if (filters.timeStatus !== 'all') {
  filtered = filtered.filter(p => {
    const timeStatus = getPromotionTimeStatus(p);
    return timeStatus === filters.timeStatus;
  });
}
```

## Testing Scenarios

### 1. Current Date Filtering
1. **Select "Đang diễn ra"** → Should show only promotions where current date is between startDate and endDate
2. **Select "Sắp diễn ra"** → Should show only promotions where current date is before startDate
3. **Select "Tất cả thời gian"** → Should show all promotions

### 2. Visual Indicators
1. **Promotion cards** → Should display time status badge with correct color
2. **Badge text** → Should show "Đang diễn ra", "Sắp diễn ra", or "Đã hết hạn"
3. **Color consistency** → Green for active, Yellow for upcoming, Red for expired

### 3. Real-time Updates
1. **Screen refresh** → Time status should update based on current time
2. **Filter changes** → Should immediately filter promotions
3. **Date changes** → Should recalculate time status (simulated by changing system date)

## Mock Data for Testing

### Current Promotions (Đang diễn ra):
- **VIP Weekend Special**: 2024-01-01 to 2024-12-31
- **Summer Customer Campaign**: 2024-06-01 to 2024-08-31

### Future Promotions (Sắp diễn ra):
- **Black Friday Customer Event**: 2024-12-01 to 2024-12-31
- **New Year 2025 Promotion**: 2025-01-01 to 2025-01-31

### Expired Promotions (Đã hết hạn):
- **New Year Customer Promotion**: 2024-01-01 to 2024-01-31 (expired)

## Backend Integration Ready

### Current Implementation (Development):
```javascript
// Time status calculation in frontend
const getPromotionTimeStatus = (promotion) => {
  const now = new Date();
  const startDate = new Date(promotion.startDate);
  const endDate = new Date(promotion.endDate);
  // ... logic
};
```

### Future Backend Integration:
```javascript
// Backend can provide time status
const response = await api.getPromotionsWithTimeStatus();
// Response includes timeStatus field calculated on server
```

## Performance Considerations

### 1. Date Calculations:
- **Client-side**: Date calculations done in JavaScript
- **Efficient**: Simple date comparisons
- **Cached**: Results cached during filter session

### 2. Filter Performance:
- **Optimized**: Filters applied in sequence
- **Memoized**: useCallback for expensive operations
- **Debounced**: Search input debounced

### 3. UI Updates:
- **Selective**: Only affected cards re-render
- **Smooth**: No layout shifts during filtering
- **Responsive**: Immediate visual feedback

## Future Enhancements

### 1. Advanced Time Features:
- **Time Zone Support**: Handle different time zones
- **Relative Time**: Show "Starts in 3 days", "Ends in 2 hours"
- **Recurring Promotions**: Support for recurring time periods

### 2. Enhanced Filtering:
- **Date Range**: Filter by custom date ranges
- **Time Periods**: "This week", "This month", "Next quarter"
- **Expiry Alerts**: Filter promotions expiring soon

### 3. Analytics Integration:
- **Usage Tracking**: Track which time-based filters are used most
- **Performance Metrics**: Monitor filter performance
- **User Behavior**: Analyze user filtering patterns

## Error Handling

### 1. Invalid Dates:
```javascript
try {
  const startDate = new Date(promotion.startDate);
  const endDate = new Date(promotion.endDate);
  
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return 'unknown'; // Handle invalid dates
  }
  
  // ... normal logic
} catch (error) {
  console.error('Error calculating time status:', error);
  return 'unknown';
}
```

### 2. Missing Data:
```javascript
if (!promotion.startDate || !promotion.endDate) {
  return 'unknown'; // Handle missing date fields
}
```

### 3. Fallback Display:
```javascript
// In promotion card
const timeStatus = getPromotionTimeStatus(item);
const displayText = timeStatus === 'unknown' ? 'Không xác định' : 
                   timeStatus === 'active' ? 'Đang diễn ra' :
                   timeStatus === 'upcoming' ? 'Sắp diễn ra' : 'Đã hết hạn';
```

**Time-based promotion filters hoàn thành! Dealer Staff giờ có thể filter promotions theo thời gian thực tế với visual indicators rõ ràng! 🎯**
