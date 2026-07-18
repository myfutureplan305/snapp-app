import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";

const API_BASE_URL = "https://snappybackend.vercel.app";

// ── Tokens ────────────────────────────────────────────────────────────────────
const C = {
  bg: "#FFFFFF",
  surface: "#F5F5F7",
  surfacePressed: "#EBEBED",
  border: "#E5E5EA",
  text: "#111111",
  textSecondary: "#6E6E73",
  textTertiary: "#AEAEB2",
  accent: "#007AFF",
  accentSoft: "#EBF3FF",
  success: "#34C759",
  white: "#FFFFFF",
};

const T = {
  // display
  logoSize: 28,
  logoWeight: "700",
  // body
  bodySize: 15,
  bodyLineHeight: 22,
  // label
  labelSize: 12,
  labelWeight: "600",
  labelTracking: 0.5,
  // price
  priceSize: 20,
  priceWeight: "700",
};

export default function App() {
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeMode, setActiveMode] = useState("find"); // segmented control
  const [product, setProduct] = useState(null);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const [lastMode, setLastMode] = useState(null);

  const reset = () => { setProduct(null); setResults([]); setError(null); setLastMode(null); };

  const pickPhoto = async (fromCamera) => {
    reset();
    const perm = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { setError(fromCamera ? "Camera access needed" : "Photo library access needed"); return; }
    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
    if (!result.canceled && result.assets?.length) setPhoto(result.assets[0]);
  };

  const submit = async () => {
    if (!photo) { setError("Add a photo first"); return; }
    setLoading(true);
    setError(null);
    setLastMode(activeMode);
    setProduct(null);
    setResults([]);
    try {
      const fd = new FormData();
      fd.append("photo", { uri: photo.uri, name: "photo.jpg", type: "image/jpeg" });
      const res = await fetch(`${API_BASE_URL}/${activeMode}`, { method: "POST", body: fd, headers: { "Content-Type": "multipart/form-data" } });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setProduct(data.product);
      setResults(data.results || []);
    } catch (e) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const hasResults = product || results.length > 0;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.logo}>snappy</Text>
          <Text style={styles.logoMark}>●</Text>
        </View>

        {/* ── Photo area ── */}
        <TouchableOpacity
          style={[styles.photoBox, photo && styles.photoBoxFilled]}
          onPress={() => pickPhoto(false)}
          activeOpacity={0.85}
        >
          {photo ? (
            <Image source={{ uri: photo.uri }} style={styles.photo} />
          ) : (
            <View style={styles.photoEmpty}>
              <View style={styles.cameraIcon}>
                <View style={styles.cameraLens} />
              </View>
              <Text style={styles.photoEmptyTitle}>Add a Photo</Text>
              <Text style={styles.photoEmptySubtitle}>Tap to choose or take a photo</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* ── Capture buttons ── */}
        <View style={styles.captureRow}>
          <TouchableOpacity style={styles.captureBtn} onPress={() => pickPhoto(true)} activeOpacity={0.7}>
            <Text style={styles.captureBtnText}>📷  Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.captureBtn} onPress={() => pickPhoto(false)} activeOpacity={0.7}>
            <Text style={styles.captureBtnText}>🖼  Library</Text>
          </TouchableOpacity>
        </View>

        {/* ── Segmented control ── */}
        <View style={styles.segment}>
          <TouchableOpacity
            style={[styles.segTab, activeMode === "explain" && styles.segTabActive]}
            onPress={() => setActiveMode("explain")}
            activeOpacity={0.8}
          >
            <Text style={[styles.segTabText, activeMode === "explain" && styles.segTabTextActive]}>
              Explain
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segTab, activeMode === "find" && styles.segTabActive]}
            onPress={() => setActiveMode("find")}
            activeOpacity={0.8}
          >
            <Text style={[styles.segTabText, activeMode === "find" && styles.segTabTextActive]}>
              Find
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Primary action ── */}
        <TouchableOpacity
          style={[styles.primaryBtn, (!photo || loading) && styles.primaryBtnDisabled]}
          onPress={submit}
          disabled={!photo || loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={C.white} size="small" />
          ) : (
            <Text style={styles.primaryBtnText}>
              {activeMode === "explain" ? "Explain This" : "Find This"}
            </Text>
          )}
        </TouchableOpacity>

        {/* ── Error ── */}
        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* ── Results ── */}
        {hasResults && (
          <View style={styles.results}>
            {/* Product card */}
            {product && (
              <View style={styles.productCard}>
                <View style={styles.productCardTop}>
                  {product.brand && (
                    <Text style={styles.productBrand}>{product.brand.toUpperCase()}</Text>
                  )}
                  <Text style={styles.productName}>{product.productName}</Text>
                  {product.category && (
                    <View style={styles.categoryPill}>
                      <Text style={styles.categoryText}>{product.category}</Text>
                    </View>
                  )}
                </View>
                {product.description && (
                  <Text style={styles.productDesc}>{product.description}</Text>
                )}
                <View style={styles.confidenceRow}>
                  <View style={[
                    styles.confidenceDot,
                    { backgroundColor: product.confidence === "high" ? C.success : product.confidence === "medium" ? "#FF9F0A" : C.textTertiary }
                  ]} />
                  <Text style={styles.confidenceText}>
                    {product.confidence === "high" ? "High confidence match" : product.confidence === "medium" ? "Probable match" : "Low confidence"}
                  </Text>
                </View>
              </View>
            )}

            {/* Retailer results */}
            {lastMode === "find" && results.length > 0 && (
              <View style={styles.retailerSection}>
                <Text style={styles.sectionLabel}>WHERE TO BUY</Text>
                {results.map((item, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.retailerCard}
                    onPress={() => Linking.openURL(item.link)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.retailerCardLeft}>
                      <Text style={styles.retailerName}>{item.retailer}</Text>
                      <Text style={styles.retailerTitle} numberOfLines={2}>{item.title}</Text>
                      {item.rating && (
                        <Text style={styles.retailerRating}>★ {item.rating}{item.reviews ? ` · ${item.reviews} reviews` : ""}</Text>
                      )}
                    </View>
                    <View style={styles.retailerCardRight}>
                      {item.price ? (
                        <Text style={styles.retailerPrice}>{item.price}</Text>
                      ) : null}
                      <Text style={styles.retailerChevron}>›</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  container: { paddingHorizontal: 20, paddingTop: Platform.OS === "android" ? 48 : 16 },

  // Header
  header: { flexDirection: "row", alignItems: "center", marginBottom: 28 },
  logo: { fontSize: T.logoSize, fontWeight: T.logoWeight, color: C.text, letterSpacing: -0.5 },
  logoMark: { fontSize: 10, color: C.accent, marginLeft: 3, marginTop: 4 },

  // Photo
  photoBox: {
    width: "100%", height: 280, borderRadius: 20,
    backgroundColor: C.surface, overflow: "hidden", marginBottom: 12,
  },
  photoBoxFilled: { backgroundColor: "#000" },
  photo: { width: "100%", height: "100%", resizeMode: "cover" },
  photoEmpty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  cameraIcon: {
    width: 52, height: 40, borderRadius: 10, backgroundColor: C.border,
    alignItems: "center", justifyContent: "center", marginBottom: 4,
  },
  cameraLens: { width: 18, height: 18, borderRadius: 9, backgroundColor: C.textTertiary },
  photoEmptyTitle: { fontSize: 17, fontWeight: "600", color: C.text },
  photoEmptySubtitle: { fontSize: 13, color: C.textSecondary },

  // Capture row
  captureRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  captureBtn: {
    flex: 1, paddingVertical: 11, borderRadius: 12,
    backgroundColor: C.surface, alignItems: "center",
  },
  captureBtnText: { fontSize: 14, fontWeight: "600", color: C.text },

  // Segmented control
  segment: {
    flexDirection: "row", backgroundColor: C.surface,
    borderRadius: 12, padding: 3, marginBottom: 12,
  },
  segTab: { flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: "center" },
  segTabActive: { backgroundColor: C.white, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
  segTabText: { fontSize: 14, fontWeight: "600", color: C.textSecondary },
  segTabTextActive: { color: C.text },

  // Primary button
  primaryBtn: {
    backgroundColor: C.accent, borderRadius: 14,
    paddingVertical: 16, alignItems: "center", marginBottom: 20,
  },
  primaryBtnDisabled: { opacity: 0.4 },
  primaryBtnText: { color: C.white, fontSize: 16, fontWeight: "700", letterSpacing: 0.2 },

  // Error
  errorBox: { backgroundColor: "#FFF0F0", borderRadius: 12, padding: 14, marginBottom: 16 },
  errorText: { color: "#D00", fontSize: 14, textAlign: "center" },

  // Results wrapper
  results: { width: "100%" },

  // Product card
  productCard: {
    backgroundColor: C.surface, borderRadius: 18,
    padding: 18, marginBottom: 20,
  },
  productCardTop: { marginBottom: 12 },
  productBrand: {
    fontSize: T.labelSize, fontWeight: T.labelWeight,
    color: C.accent, letterSpacing: T.labelTracking, marginBottom: 4,
  },
  productName: { fontSize: 20, fontWeight: "700", color: C.text, lineHeight: 26 },
  categoryPill: {
    alignSelf: "flex-start", marginTop: 8,
    backgroundColor: C.white, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  categoryText: { fontSize: 12, color: C.textSecondary, fontWeight: "500" },
  productDesc: { fontSize: T.bodySize, color: C.textSecondary, lineHeight: T.bodyLineHeight, marginBottom: 14 },
  confidenceRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  confidenceDot: { width: 7, height: 7, borderRadius: 4 },
  confidenceText: { fontSize: 12, color: C.textTertiary },

  // Retailer section
  retailerSection: { marginBottom: 8 },
  sectionLabel: {
    fontSize: T.labelSize, fontWeight: T.labelWeight,
    color: C.textTertiary, letterSpacing: T.labelTracking, marginBottom: 10,
  },
  retailerCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: C.white, borderRadius: 16,
    borderWidth: 1, borderColor: C.border,
    padding: 14, marginBottom: 8,
  },
  retailerCardLeft: { flex: 1, marginRight: 12 },
  retailerName: { fontSize: T.labelSize, fontWeight: "700", color: C.accent, letterSpacing: 0.3, marginBottom: 3 },
  retailerTitle: { fontSize: 14, color: C.text, lineHeight: 19, marginBottom: 4 },
  retailerRating: { fontSize: 12, color: C.textSecondary },
  retailerCardRight: { alignItems: "flex-end", gap: 4 },
  retailerPrice: { fontSize: T.priceSize, fontWeight: T.priceWeight, color: C.text },
  retailerChevron: { fontSize: 22, color: C.textTertiary, lineHeight: 26 },
});
