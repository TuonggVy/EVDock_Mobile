import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Share,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES } from '../../constants';
import { formatPaymentAmount } from '../../utils/paymentUtils';

const ContractScreen = ({ navigation, route }) => {
  const { quotation } = route.params;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (error) {
      return 'N/A';
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return 'N/A';
    }
  };

  const handleShare = async () => {
    try {
      const contractText = `
HỢP ĐỒNG MUA BÁN XE ĐIỆN

Số hợp đồng: ${quotation.id}
Ngày: ${formatDate(quotation.createdAt)}

BÊN BÁN: Công ty TNHH EVDock
Địa chỉ: 123 Đường ABC, Quận 1, TP.HCM
MST: 0123456789

BÊN MUA: ${quotation.customer?.name || quotation.customerName || 'Khách hàng'}
SĐT: ${quotation.customer?.phone || quotation.customerPhone || 'N/A'}
Email: ${quotation.customer?.email || quotation.customerEmail || 'N/A'}

THÔNG TIN XE:
- Model: ${quotation.vehicle?.name || quotation.vehicleModel || 'N/A'}
- Màu sắc: ${quotation.vehicle?.selectedColor || 'Đen'}
- Giá bán: ${formatPaymentAmount(quotation.pricing?.totalPrice || quotation.totalAmount || 0)}

Điều khoản: Xem chi tiết trong hợp đồng chính thức.
      `;
      
      await Share.share({
        message: contractText,
        title: `Hợp đồng ${quotation.id}`,
      });
    } catch (error) {
      console.error('Error sharing contract:', error);
    }
  };

  const handlePrint = () => {
    Alert.alert('In hợp đồng', 'Tính năng in hợp đồng sẽ được triển khai');
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>←</Text>
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Hợp Đồng Mua Bán</Text>
      <View style={styles.placeholder} />
    </View>
  );

  const renderContractHeader = () => (
    <View style={styles.contractHeader}>
      <Text style={styles.contractTitle}>HỢP ĐỒNG MUA BÁN XE ĐIỆN</Text>
      <Text style={styles.contractSubtitle}>Số hợp đồng: {quotation.id}</Text>
      <Text style={styles.contractDate}>Ngày: {formatDate(quotation.createdAt)}</Text>
      {quotation.paymentCompletedAt && (
        <Text style={styles.paymentDate}>
          Đã thanh toán: {formatDateTime(quotation.paymentCompletedAt)}
        </Text>
      )}
    </View>
  );

  const renderSellerInfo = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>BÊN BÁN (Bên A)</Text>
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Tên công ty:</Text>
          <Text style={styles.infoValue}>Công ty TNHH EVDock</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Địa chỉ:</Text>
          <Text style={styles.infoValue}>123 Đường ABC, Quận 1, TP.HCM</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Mã số thuế:</Text>
          <Text style={styles.infoValue}>0123456789</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Đại diện:</Text>
          <Text style={styles.infoValue}>Nguyễn Văn Manager</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Chức vụ:</Text>
          <Text style={styles.infoValue}>Giám đốc kinh doanh</Text>
        </View>
      </View>
    </View>
  );

  const renderBuyerInfo = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>BÊN MUA (Bên B)</Text>
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Họ và tên:</Text>
          <Text style={styles.infoValue}>{quotation.customer?.name || quotation.customerName || 'Khách hàng'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Số điện thoại:</Text>
          <Text style={styles.infoValue}>{quotation.customer?.phone || quotation.customerPhone || 'N/A'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email:</Text>
          <Text style={styles.infoValue}>{quotation.customer?.email || quotation.customerEmail || 'N/A'}</Text>
        </View>
        {quotation.customer?.address || quotation.customerAddress ? (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Địa chỉ:</Text>
            <Text style={styles.infoValue}>{quotation.customer?.address || quotation.customerAddress}</Text>
          </View>
        ) : null}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>CMND/CCCD:</Text>
          <Text style={styles.infoValue}>[Khách hàng cung cấp]</Text>
        </View>
      </View>
    </View>
  );

  const renderVehicleInfo = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>THÔNG TIN XE MUA BÁN</Text>
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Model xe:</Text>
          <Text style={styles.infoValue}>{quotation.vehicle?.name || quotation.vehicleModel || 'N/A'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Màu sắc:</Text>
          <Text style={styles.infoValue}>{quotation.vehicle?.selectedColor || 'Đen'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Năm sản xuất:</Text>
          <Text style={styles.infoValue}>2024</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Số khung xe:</Text>
          <Text style={styles.infoValue}>[Sẽ cung cấp khi giao xe]</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Số máy:</Text>
          <Text style={styles.infoValue}>[Sẽ cung cấp khi giao xe]</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Giá bán:</Text>
          <Text style={[styles.infoValue, styles.priceValue]}>
            {formatPaymentAmount(quotation.pricing?.totalPrice || quotation.totalAmount || 0)}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderPaymentInfo = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>THÔNG TIN THANH TOÁN</Text>
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Phương thức thanh toán:</Text>
          <Text style={styles.infoValue}>VNPay - Quét mã QR</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Trạng thái:</Text>
          <Text style={[styles.infoValue, styles.paidStatus]}>Đã thanh toán</Text>
        </View>
        {quotation.paymentCompletedAt && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Thời gian thanh toán:</Text>
            <Text style={styles.infoValue}>{formatDateTime(quotation.paymentCompletedAt)}</Text>
          </View>
        )}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Số tiền đã thanh toán:</Text>
          <Text style={[styles.infoValue, styles.priceValue]}>
            {formatPaymentAmount(quotation.pricing?.totalPrice || quotation.totalAmount || 0)}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderTerms = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>ĐIỀU KHOẢN HỢP ĐỒNG</Text>
      <View style={styles.termsCard}>
        <View style={styles.termItem}>
          <Text style={styles.termNumber}>1.</Text>
          <Text style={styles.termText}>
            Bên A cam kết giao xe đúng thời hạn, đầy đủ phụ kiện và giấy tờ theo quy định của pháp luật.
          </Text>
        </View>
        
        <View style={styles.termItem}>
          <Text style={styles.termNumber}>2.</Text>
          <Text style={styles.termText}>
            Bên B cam kết thanh toán đầy đủ số tiền theo hợp đồng và nhận xe đúng thời hạn.
          </Text>
        </View>
        
        <View style={styles.termItem}>
          <Text style={styles.termNumber}>3.</Text>
          <Text style={styles.termText}>
            Xe được bảo hành theo chính sách của nhà sản xuất và các quy định hiện hành.
          </Text>
        </View>
        
        <View style={styles.termItem}>
          <Text style={styles.termNumber}>4.</Text>
          <Text style={styles.termText}>
            Mọi tranh chấp sẽ được giải quyết thông qua thương lượng. Nếu không thỏa thuận được, sẽ đưa ra Tòa án có thẩm quyền.
          </Text>
        </View>
        
        <View style={styles.termItem}>
          <Text style={styles.termNumber}>5.</Text>
          <Text style={styles.termText}>
            Hợp đồng có hiệu lực kể từ ngày ký và thanh toán thành công.
          </Text>
        </View>
      </View>
    </View>
  );

  const renderSignatures = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>CHỮ KÝ</Text>
      <View style={styles.signatureCard}>
        <View style={styles.signatureSection}>
          <Text style={styles.signatureLabel}>BÊN BÁN</Text>
          <Text style={styles.signatureName}>Nguyễn Văn Manager</Text>
          <Text style={styles.signatureTitle}>Giám đốc kinh doanh</Text>
          <Text style={styles.signatureDate}>Ngày: {formatDate(new Date())}</Text>
        </View>
        
        <View style={styles.signatureSection}>
          <Text style={styles.signatureLabel}>BÊN MUA</Text>
          <Text style={styles.signatureName}>{quotation.customer?.name || quotation.customerName || 'Khách hàng'}</Text>
          <Text style={styles.signatureTitle}>Người mua xe</Text>
          <Text style={styles.signatureDate}>Ngày: {formatDate(new Date())}</Text>
        </View>
      </View>
    </View>
  );

  const renderActionButtons = () => (
    <View style={styles.actionButtons}>
      <TouchableOpacity
        style={styles.shareButton}
        onPress={handleShare}
      >
        <Text style={styles.shareButtonText}>Chia Sẻ</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.printButton}
        onPress={handlePrint}
      >
        <Text style={styles.printButtonText}>In Hợp Đồng</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderContractHeader()}
        {renderSellerInfo()}
        {renderBuyerInfo()}
        {renderVehicleInfo()}
        {renderPaymentInfo()}
        {renderTerms()}
        {renderSignatures()}
      </ScrollView>
      {renderActionButtons()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
    paddingTop: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    backgroundColor: COLORS.BACKGROUND.SECONDARY,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 20,
    color: COLORS.TEXT.WHITE,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
  },
  contractHeader: {
    alignItems: 'center',
    marginVertical: SIZES.PADDING.LARGE,
    paddingVertical: SIZES.PADDING.LARGE,
    backgroundColor: COLORS.BACKGROUND.SECONDARY,
    borderRadius: SIZES.RADIUS.MEDIUM,
  },
  contractTitle: {
    fontSize: SIZES.FONT.XLARGE,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    textAlign: 'center',
    marginBottom: SIZES.PADDING.SMALL,
  },
  contractSubtitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: '600',
    color: COLORS.TEXT.WHITE,
    marginBottom: SIZES.PADDING.XSMALL,
  },
  contractDate: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.WHITE,
    marginBottom: SIZES.PADDING.XSMALL,
  },
  paymentDate: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.SUCCESS,
    fontWeight: '600',
  },
  section: {
    marginVertical: SIZES.PADDING.MEDIUM,
  },
  sectionTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    marginBottom: SIZES.PADDING.MEDIUM,
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: COLORS.BACKGROUND.SECONDARY,
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SIZES.PADDING.SMALL,
    paddingVertical: SIZES.PADDING.XSMALL,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER.PRIMARY,
  },
  infoLabel: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: '600',
    color: COLORS.TEXT.WHITE,
    flex: 1,
  },
  infoValue: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.WHITE,
    flex: 2,
    textAlign: 'right',
  },
  priceValue: {
    color: COLORS.PRIMARY,
    fontWeight: 'bold',
  },
  paidStatus: {
    color: COLORS.SUCCESS,
    fontWeight: 'bold',
  },
  termsCard: {
    backgroundColor: COLORS.BACKGROUND.SECONDARY,
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
  },
  termItem: {
    flexDirection: 'row',
    marginBottom: SIZES.PADDING.MEDIUM,
    alignItems: 'flex-start',
  },
  termNumber: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    marginRight: SIZES.PADDING.SMALL,
    width: 20,
  },
  termText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.WHITE,
    flex: 1,
    lineHeight: 22,
  },
  signatureCard: {
    backgroundColor: COLORS.BACKGROUND.SECONDARY,
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.LARGE,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureSection: {
    alignItems: 'center',
    flex: 1,
  },
  signatureLabel: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  signatureName: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: '600',
    color: COLORS.TEXT.WHITE,
    marginBottom: SIZES.PADDING.XSMALL,
  },
  signatureTitle: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.WHITE,
    marginBottom: SIZES.PADDING.SMALL,
  },
  signatureDate: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.MEDIUM,
    backgroundColor: COLORS.BACKGROUND.SECONDARY,
  },
  shareButton: {
    flex: 1,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: SIZES.RADIUS.MEDIUM,
    paddingVertical: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
    marginRight: SIZES.PADDING.SMALL,
  },
  shareButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
  },
  printButton: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY,
    borderRadius: SIZES.RADIUS.MEDIUM,
    paddingVertical: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
    marginLeft: SIZES.PADDING.SMALL,
  },
  printButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
  },
});

export default ContractScreen;
