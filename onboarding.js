import { useState, useRef } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Purchases from "react-native-purchases";

const { width: SW, height: SH } = Dimensions.get("window");

// ── RevenueCat API Key ─────────────────────────────────────────────────────
const RC_API_KEY = "appl_eEhmmSQhTGRgdQRKfiuUTavFNqu"; // Replace with your real key

// Product IDs matching App Store Connect
const PRODUCT_BASIC = "com.snappyapp.app.basic.monthly";
const PRODUCT_PRO   = "com.snappyapp.app.pro.monthly";

const PRIVACY_URL = "https://letsgetsnappy.com/privacy";
const TERMS_URL   = "https://letsgetsnappy.com/terms";

const C = {
  bg: "#0D0F1A",
  card: "#161827",
  cardBorder: "#1E2235",
  accent: "#4A6FF5",
  yellow: "#F5C842",
  green: "#2ECC71",
  teal: "#2ECC9A",
  white: "#FFFFFF",
  grey: "#8892A4",
  lightGrey: "#C5CDD8",
};

const SLIDES = [
  { id: "0", type: "hero" },
  { id: "1", type: "fashion" },
  { id: "2", type: "features" },
  { id: "3", type: "flip" },
  { id: "4", type: "paywall" },
];

// ── Slide 0: Hero ──────────────────────────────────────────────────────────
const HeroSlide = () => (
  <ScrollView contentContainerStyle={s.slideInner} showsVerticalScrollIndicator={false}>
    <View style={s.heroTag}>
      <Text style={s.heroTagText}>WELCOME TO SNAPPY</Text>
    </View>
    <Text style={s.heroTitle}>{"Identify anything.\nFind it anywhere."}</Text>
    <Text style={s.heroSubtitle}>
      Unlock the power of real-time image search. Snap a photo of any item to instantly discover what it is, find the cheapest retailers, and compare prices instantly.
    </Text>
    <View style={s.heroBadges}>
      <View style={s.heroBadge}>
        <Text style={s.heroBadgeIcon}>📷</Text>
        <Text style={s.heroBadgeText}>Smart Camera Scanner</Text>
      </View>
      <View style={s.heroBadge}>
        <Text style={s.heroBadgeIcon}>⚡</Text>
        <Text style={s.heroBadgeText}>Instant Price Search</Text>
      </View>
    </View>
    <View style={s.mockPhone}>
      <View style={s.mockHeader}>
        <Text style={s.mockLogo}>snappy<Text style={{ color: C.accent }}>●</Text></Text>
        <View style={s.mockScans}>
          <Text style={s.mockScansText}>5 scans left</Text>
        </View>
      </View>
      <View style={s.mockPhotoBox}>
        <View style={s.mockCamIcon}>
          <Text style={{ fontSize: 28 }}>📷</Text>
        </View>
        <Text style={s.mockPhotoTitle}>Tap to add a photo</Text>
        <Text style={s.mockPhotoSub}>Point at any product to identify it</Text>
      </View>
      <View style={s.mockButtons}>
        <View style={s.mockBtn}><Text style={s.mockBtnText}>Camera</Text></View>
        <View style={s.mockBtn}><Text style={s.mockBtnText}>Library</Text></View>
      </View>
      <View style={s.mockButtons}>
        <View style={s.mockBtn}><Text style={s.mockBtnText}>Explain</Text></View>
        <View style={[s.mockBtn, { backgroundColor: C.accent }]}>
          <Text style={[s.mockBtnText, { color: C.white }]}>Find</Text>
        </View>
      </View>
      <View style={[s.mockBtn, { marginTop: 8, backgroundColor: "#E8EDFF" }]}>
        <Text style={[s.mockBtnText, { color: C.accent }]}>Find Where to Buy</Text>
      </View>
    </View>
  </ScrollView>
);

// ── Slide 1: Fashion ───────────────────────────────────────────────────────
const FashionSlide = () => (
  <ScrollView contentContainerStyle={s.slideInner} showsVerticalScrollIndicator={false}>
    <Text style={s.slideNum}><Text style={{ color: C.accent }}>01.</Text> Daily Fashion Scanner</Text>
    <Text style={s.sectionTag}>STYLE & APPAREL</Text>
    <Text style={s.sectionTitle}>Loved an outfit?{"\n"}Snap it instantly.</Text>
    <View style={s.featureList}>
      {[
        { icon: "👕", title: "Detect Everything You Wear", desc: "Scan sneakers, jackets, matching hats, sunglasses, and custom t-shirts in one shot." },
        { icon: "🏬", title: "Match with Trusted Retailers", desc: "No more endless Google searching. Snappy links you directly to stores carrying the exact item." },
        { icon: "💰", title: "Budget Alternatives", desc: "Find visual matches with highly affordable look-alikes to assemble your dream wardrobe on a budget." },
      ].map((f, i) => (
        <View key={i} style={s.featureRow}>
          <View style={s.featureIconBox}>
            <Text style={{ fontSize: 20 }}>{f.icon}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.featureTitle}>{f.title}</Text>
            <Text style={s.featureDesc}>{f.desc}</Text>
          </View>
        </View>
      ))}
    </View>
    <View style={s.mockResultCard}>
      <View style={s.mockResultThumb} />
      <View style={{ flex: 1 }}>
        <Text style={s.mockResultName}>Retro Low Sneakers</Text>
        <Text style={[s.mockResultMatch, { color: C.grey }]}>98% Match</Text>
        <Text style={[s.mockResultPrice, { color: C.yellow }]}>$120.00</Text>
      </View>
      <View style={s.mockFindBtn}>
        <Text style={{ color: C.white, fontWeight: "700", fontSize: 12 }}>FIND</Text>
      </View>
    </View>
  </ScrollView>
);

// ── Slide 2: Pro Features ──────────────────────────────────────────────────
const FeaturesSlide = () => (
  <ScrollView contentContainerStyle={s.slideInner} showsVerticalScrollIndicator={false}>
    <Text style={s.slideNum}><Text style={{ color: C.accent }}>02.</Text> Snappy Pro Features</Text>
    <View style={s.grid}>
      {[
        { icon: "⚡", iconBg: C.accent, title: "More Scanning Power", desc: "Ditch the 5-scan free limit. Keep scanning at garage sales, thrift stores, flea markets, or anywhere you spot something you want to find online." },
        { icon: "🔍", iconBg: "#8B6914", title: "Instant Product Identification", desc: "Point. Snap. Done. Snappy's AI analyzes your photo in seconds and finds the exact product across Amazon, Walmart, eBay, and hundreds of other retailers." },
        { icon: "🛒", iconBg: "#6B4F0A", title: "Find It Anywhere Online", desc: "Don't get stuck on one retailer. Snappy searches the entire web and shows you real prices from multiple stores so you always get the best deal." },
        { icon: "♡", iconBg: "#2A3580", title: "Save & Build Your Shopping List", desc: "Save any product you find to your personal list. Come back anytime to compare prices, check if it's in stock, or share it with someone." },
      ].map((f, i) => (
        <View key={i} style={s.gridCard}>
          <View style={[s.gridIconBox, { backgroundColor: f.iconBg }]}>
            <Text style={{ fontSize: 20 }}>{f.icon}</Text>
          </View>
          <Text style={s.gridCardTitle}>{f.title}</Text>
          <Text style={s.gridCardDesc}>{f.desc}</Text>
        </View>
      ))}
    </View>
  </ScrollView>
);

// ── Slide 3: Flip & Profit ─────────────────────────────────────────────────
const FlipSlide = () => (
  <ScrollView contentContainerStyle={s.slideInner} showsVerticalScrollIndicator={false}>
    <Text style={s.slideNum}><Text style={{ color: C.accent }}>03.</Text> Flip & Profit Assistant</Text>
    <View style={s.threeGrid}>
      {[
        { icon: "🏷", iconBg: "#2A3580", title: "Thrift Store Gold", desc: "Instantly evaluate vintage clothing, premium designer wear, rare toys, or vintage electronics to evaluate accurate listings and potential profits in real-time." },
        { icon: "🏠", iconBg: "#6B4F0A", title: "Garage Sale Finds", desc: "Uncover valuable memorabilia hidden in junk piles. Compare listing prices online instantly to ensure you bargain confidently and avoid missing rare, high-ticket items." },
        { icon: "📈", iconBg: "#1A5C3A", title: "Reseller Intelligence", desc: "Cross-reference prices on major secondary marketplaces (eBay, Grailed, StockX). Perfect for calculating margins and historical demand while on-the-go." },
      ].map((f, i) => (
        <View key={i} style={s.threeCard}>
          <View style={[s.gridIconBox, { backgroundColor: f.iconBg, marginBottom: 14 }]}>
            <Text style={{ fontSize: 20 }}>{f.icon}</Text>
          </View>
          <Text style={s.threeCardTitle}>{f.title}</Text>
          <Text style={s.gridCardDesc}>{f.desc}</Text>
        </View>
      ))}
    </View>
  </ScrollView>
);

// ── Slide 4: Paywall ───────────────────────────────────────────────────────
const PaywallSlide = ({ onComplete }) => {
  const [loading, setLoading] = useState(false);

  Purchases.configure({ apiKey: RC_API_KEY });

  const purchasePlan = async (productId) => {
    try {
      setLoading(true);
      const offerings = await Purchases.getOfferings();
      const packages = offerings.current?.availablePackages ?? [];

      const pkg = packages.find(
        (p) => p.product.identifier === productId
      );

      if (!pkg) {
        Alert.alert("Not Available", "This plan is not available right now. Please try again later.");
        setLoading(false);
        return;
      }

      const { customerInfo } = await Purchases.purchasePackage(pkg);
      const isActive = customerInfo.entitlements.active["premium"] !== undefined ||
                       customerInfo.entitlements.active["basic"] !== undefined ||
                       customerInfo.entitlements.active["pro"] !== undefined;

      if (isActive) {
        onComplete();
      } else {
        Alert.alert("Purchase Issue", "Something went wrong verifying your purchase. Please restore purchases or contact support.");
      }
    } catch (e) {
      if (!e.userCancelled) {
        Alert.alert("Purchase Failed", e.message || "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const restorePurchases = async () => {
    try {
      setLoading(true);
      const customerInfo = await Purchases.restorePurchases();
      const isActive = Object.keys(customerInfo.entitlements.active).length > 0;
      if (isActive) {
        Alert.alert("Restored!", "Your purchases have been restored.", [{ text: "OK", onPress: onComplete }]);
      } else {
        Alert.alert("Nothing to Restore", "No active subscriptions found for this Apple ID.");
      }
    } catch (e) {
      Alert.alert("Restore Failed", e.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.paywallOuter}>
      {loading && (
        <View style={s.loadingOverlay}>
          <ActivityIndicator size="large" color={C.accent} />
          <Text style={{ color: C.white, marginTop: 12, fontSize: 14 }}>Processing...</Text>
        </View>
      )}

      <View>
        <Text style={s.slideNum}><Text style={{ color: C.accent }}>04.</Text> Complete Scanner Freedom</Text>
        <Text style={s.paywallHeadline}>{"Unlock All Limits with\n"}<Text style={{ color: C.accent }}>Snappy Pro</Text></Text>
        <Text style={s.paywallSub}>
          Elevate your shopping and flipping experience. Pro users unlock more scans, faster results, and full price comparison across the web.
        </Text>
        <View style={s.paywallBullets}>
          {[
            "Unlimited visual identifications and searches",
            "Comprehensive multi-store price comparison",
            "Instant online resale valuation",
          ].map((b, i) => (
            <View key={i} style={s.bullet}>
              <View style={s.bulletDot} />
              <Text style={s.bulletText}>{b}</Text>
            </View>
          ))}
        </View>
      </View>

      <View>
        {/* Basic plan */}
        <TouchableOpacity
          style={s.planCard}
          onPress={() => purchasePlan(PRODUCT_BASIC)}
          activeOpacity={0.85}
          disabled={loading}
        >
          <View style={{ flex: 1 }}>
            <Text style={s.planName}>Basic</Text>
            <Text style={s.planDesc}>100 scans per month · $4.99/month</Text>
            {["100 photo scans/month", "Find products anywhere", "Save to shopping list", "Search history"].map((f, i) => (
              <View key={i} style={s.planFeature}>
                <Text style={{ color: C.green, marginRight: 6 }}>✓</Text>
                <Text style={s.planFeatureText}>{f}</Text>
              </View>
            ))}
          </View>
          <View style={{ alignItems: "flex-end", justifyContent: "center" }}>
            <Text style={s.planPrice}>$4.99</Text>
            <Text style={s.planPeriod}>/month</Text>
          </View>
        </TouchableOpacity>

        {/* Pro plan */}
        <TouchableOpacity
          style={[s.planCard, { backgroundColor: C.accent, borderColor: C.accent }]}
          onPress={() => purchasePlan(PRODUCT_PRO)}
          activeOpacity={0.85}
          disabled={loading}
        >
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <View style={s.bestValueBadge}>
                <Text style={s.bestValueText}>BEST VALUE</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={[s.planPrice, { color: C.white }]}>$7.99</Text>
                <Text style={[s.planPeriod, { color: "rgba(255,255,255,0.7)" }]}>/month</Text>
              </View>
            </View>
            <Text style={[s.planName, { color: C.white }]}>Pro</Text>
            <Text style={[s.planDesc, { color: "rgba(255,255,255,0.7)" }]}>150 scans per month · $7.99/month</Text>
            {["150 photo scans/month", "Find products anywhere", "Save to shopping list", "Search history", "Priority support"].map((f, i) => (
              <View key={i} style={s.planFeature}>
                <Text style={{ color: C.white, marginRight: 6 }}>✓</Text>
                <Text style={[s.planFeatureText, { color: "rgba(255,255,255,0.9)" }]}>{f}</Text>
              </View>
            ))}
          </View>
        </TouchableOpacity>
      </View>

      <View>
        {/* Start Free */}
        <TouchableOpacity style={s.ctaBtn} onPress={onComplete} activeOpacity={0.85} disabled={loading}>
          <Text style={s.ctaBtnText}>Start Free - 5 Searches</Text>
        </TouchableOpacity>

        {/* Restore */}
        <TouchableOpacity onPress={restorePurchases} activeOpacity={0.75} disabled={loading}>
          <Text style={s.restoreText}>Restore purchase</Text>
        </TouchableOpacity>

        {/* Legal links — required by Apple for subscription apps */}
        <View style={s.legalRow}>
          <TouchableOpacity onPress={() => Linking.openURL(PRIVACY_URL)}>
            <Text style={s.legalLink}>Privacy Policy</Text>
          </TouchableOpacity>
          <Text style={s.legalDot}>·</Text>
          <TouchableOpacity onPress={() => Linking.openURL(TERMS_URL)}>
            <Text style={s.legalLink}>Terms of Use</Text>
          </TouchableOpacity>
        </View>
        <Text style={s.legalNote}>
          Subscriptions auto-renew monthly. Cancel anytime in your Apple ID settings.
        </Text>
      </View>
    </View>
  );
};

// ── Main Onboarding ────────────────────────────────────────────────────────
export default function Onboarding({ onComplete }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatRef = useRef(null);

  const goNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      const next = activeIndex + 1;
      flatRef.current?.scrollToIndex({ index: next, animated: true });
      setActiveIndex(next);
    }
  };

  const onViewRef = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) setActiveIndex(viewableItems[0].index);
  });

  const isLast = activeIndex === SLIDES.length - 1;

  return (
    <View style={s.root}>
      <FlatList
        ref={flatRef}
        data={SLIDES}
        keyExtractor={i => i.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onViewableItemsChanged={onViewRef.current}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        renderItem={({ item }) => (
          <View style={s.slide}>
            {item.type === "hero" && <HeroSlide />}
            {item.type === "fashion" && <FashionSlide />}
            {item.type === "features" && <FeaturesSlide />}
            {item.type === "flip" && <FlipSlide />}
            {item.type === "paywall" && <PaywallSlide onComplete={onComplete} />}
          </View>
        )}
      />

      {!isLast && (
        <View style={s.nav}>
          <View style={s.dots}>
            {SLIDES.map((_, i) => (
              <View key={i} style={[s.dot, { backgroundColor: i === activeIndex ? C.accent : "#2A2D3E", width: i === activeIndex ? 24 : 8 }]} />
            ))}
          </View>
          <View style={s.navBtns}>
            <TouchableOpacity onPress={() => { flatRef.current?.scrollToIndex({ index: SLIDES.length - 1, animated: true }); setActiveIndex(SLIDES.length - 1); }} style={s.skipBtn}>
              <Text style={s.skipText}>Skip</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={goNext} style={s.nextBtn} activeOpacity={0.85}>
              <Text style={s.nextText}>Next</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  slide: { width: SW, minHeight: SH, backgroundColor: C.bg },
  slideInner: { paddingHorizontal: 22, paddingTop: Platform.OS === "ios" ? 80 : 60, paddingBottom: 130, flexGrow: 1, justifyContent: "center" },

  heroTag: { backgroundColor: "#1E2235", borderRadius: 20, alignSelf: "flex-start", paddingHorizontal: 14, paddingVertical: 6, marginBottom: 20 },
  heroTagText: { color: C.grey, fontSize: 11, fontWeight: "700", letterSpacing: 1 },
  heroTitle: { fontSize: 38, fontWeight: "800", color: C.white, lineHeight: 46, marginBottom: 16 },
  heroSubtitle: { fontSize: 15, color: C.grey, lineHeight: 23, marginBottom: 24 },
  heroBadges: { flexDirection: "row", gap: 10, marginBottom: 28, marginTop: 16 },
  heroBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "#161827", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, gap: 6, flex: 1 },
  heroBadgeIcon: { fontSize: 18 },
  heroBadgeText: { fontSize: 12, fontWeight: "600", color: C.lightGrey, flex: 1, flexWrap: "wrap" },

  mockPhone: { backgroundColor: "#F0F2F8", borderRadius: 20, padding: 14 },
  mockHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  mockLogo: { fontSize: 16, fontWeight: "800", color: "#1A1A2E" },
  mockScans: { backgroundColor: C.accent, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  mockScansText: { color: C.white, fontSize: 11, fontWeight: "700" },
  mockPhotoBox: { backgroundColor: C.white, borderRadius: 14, paddingVertical: 28, alignItems: "center", marginBottom: 10 },
  mockCamIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: "#EEF0FF", alignItems: "center", justifyContent: "center", marginBottom: 8 },
  mockPhotoTitle: { fontSize: 15, fontWeight: "700", color: "#1A1A2E" },
  mockPhotoSub: { fontSize: 12, color: "#8896A4", marginTop: 4 },
  mockButtons: { flexDirection: "row", gap: 8, marginBottom: 8 },
  mockBtn: { flex: 1, backgroundColor: C.white, borderRadius: 10, paddingVertical: 10, alignItems: "center" },
  mockBtnText: { fontSize: 13, fontWeight: "600", color: "#1A1A2E" },

  slideNum: { fontSize: 20, fontWeight: "800", color: C.white, marginBottom: 12 },
  sectionTag: { fontSize: 11, fontWeight: "700", color: C.yellow, letterSpacing: 1, marginBottom: 10 },
  sectionTitle: { fontSize: 30, fontWeight: "800", color: C.white, lineHeight: 38, marginBottom: 22 },

  featureList: { gap: 20, marginBottom: 24 },
  featureRow: { flexDirection: "row", gap: 14, alignItems: "flex-start" },
  featureIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: "#1E2235", alignItems: "center", justifyContent: "center" },
  featureTitle: { fontSize: 15, fontWeight: "700", color: C.white, marginBottom: 4 },
  featureDesc: { fontSize: 13, color: C.grey, lineHeight: 19 },

  mockResultCard: { backgroundColor: C.card, borderRadius: 14, padding: 14, flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderColor: C.cardBorder },
  mockResultThumb: { width: 52, height: 52, borderRadius: 8, backgroundColor: "#2A2D3E" },
  mockResultName: { fontSize: 14, fontWeight: "700", color: C.white },
  mockResultMatch: { fontSize: 12, marginTop: 2 },
  mockResultPrice: { fontSize: 14, fontWeight: "700", marginTop: 2 },
  mockFindBtn: { backgroundColor: C.accent, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  gridCard: { backgroundColor: C.card, borderRadius: 16, padding: 16, width: (SW - 56) / 2, borderWidth: 1, borderColor: C.cardBorder },
  gridIconBox: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  gridCardTitle: { fontSize: 14, fontWeight: "700", color: C.white, marginBottom: 6 },
  gridCardDesc: { fontSize: 12, color: C.grey, lineHeight: 17 },

  threeGrid: { gap: 12 },
  threeCard: { backgroundColor: C.card, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: C.cardBorder },
  threeCardTitle: { fontSize: 16, fontWeight: "700", color: C.white, marginBottom: 8 },

  paywallOuter: { flex: 1, width: SW, paddingHorizontal: 22, paddingTop: Platform.OS === "ios" ? 55 : 40, paddingBottom: Platform.OS === "ios" ? 55 : 40, justifyContent: "space-between" },
  paywallHeadline: { fontSize: 24, fontWeight: "800", color: C.white, lineHeight: 30, marginBottom: 8 },
  paywallSub: { fontSize: 13, color: C.grey, lineHeight: 19, marginBottom: 12 },
  paywallBullets: { marginBottom: 12, gap: 6 },
  bullet: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  bulletDot: { width: 16, height: 16, borderRadius: 8, backgroundColor: C.green, marginTop: 2 },
  bulletText: { fontSize: 13, color: C.lightGrey, flex: 1, lineHeight: 18 },
  planCard: { backgroundColor: C.card, borderRadius: 14, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: C.cardBorder, flexDirection: "row", alignItems: "flex-start", position: "relative", overflow: "hidden" },
  planName: { fontSize: 16, fontWeight: "800", color: C.white, marginBottom: 2 },
  planDesc: { fontSize: 11, color: C.grey, marginBottom: 6 },
  planFeature: { flexDirection: "row", alignItems: "center", marginBottom: 2 },
  planFeatureText: { fontSize: 12, color: C.lightGrey },
  planPrice: { fontSize: 22, fontWeight: "800", color: C.white },
  planPeriod: { fontSize: 12, color: C.grey },
  bestValueBadge: { alignSelf: "flex-start", backgroundColor: C.yellow, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 8 },
  bestValueText: { fontSize: 10, fontWeight: "800", color: "#000" },
  ctaBtn: { backgroundColor: C.accent, borderRadius: 14, paddingVertical: 13, alignItems: "center", marginBottom: 8, marginTop: 6 },
  ctaBtnText: { color: C.white, fontSize: 15, fontWeight: "700" },
  restoreText: { fontSize: 13, color: C.grey, textAlign: "center", marginBottom: 8 },

  legalRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 4 },
  legalLink: { fontSize: 11, color: "rgba(255,255,255,0.4)", textDecorationLine: "underline" },
  legalDot: { fontSize: 11, color: "rgba(255,255,255,0.25)" },
  legalNote: { fontSize: 10, color: "rgba(255,255,255,0.25)", textAlign: "center", marginTop: 6, lineHeight: 14 },

  nav: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: C.bg, paddingHorizontal: 22, paddingTop: 16, paddingBottom: Platform.OS === "ios" ? 36 : 20, borderTopWidth: 1, borderTopColor: "#1E2235" },
  dots: { flexDirection: "row", justifyContent: "center", gap: 6, marginBottom: 16 },
  dot: { height: 8, borderRadius: 4 },
  navBtns: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  skipBtn: { paddingVertical: 12, paddingHorizontal: 8 },
  skipText: { fontSize: 15, color: C.grey, fontWeight: "500" },
  nextBtn: { backgroundColor: C.accent, borderRadius: 14, paddingVertical: 13, paddingHorizontal: 40 },
  nextText: { fontSize: 15, fontWeight: "700", color: C.white },

  loadingOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 99, alignItems: "center", justifyContent: "center" },
});
