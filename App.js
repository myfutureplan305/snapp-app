import { useState, useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Image,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Dimensions,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";


const { width: SW } = Dimensions.get("window");
const API_BASE_URL = "https://snappybackend.vercel.app";
const HISTORY_KEY = "snappy_history";
const SAVED_KEY = "snappy_saved";

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  // Gradient bg stops
  grad1: "#E8F4FD",
  grad2: "#F0E8FD",
  grad3: "#FDE8F4",
  // Glass
  glass: "rgba(255,255,255,0.55)",
  glassBorder: "rgba(255,255,255,0.8)",
  glassShadow: "rgba(100,120,200,0.12)",
  // Text
  text: "#1A1A2E",
  textSub: "#4A5568",
  textMuted: "#8896A8",
  // Accent
  accent: "#5B8DEF",
  accentSoft: "rgba(91,141,239,0.12)",
  accentGlow: "rgba(91,141,239,0.25)",
  // Status
  green: "#34C759",
  orange: "#FF9500",
  red: "#FF3B30",
  // Misc
  white: "#FFFFFF",
  border: "rgba(180,190,220,0.3)",
};

async function loadJSON(key, fallback) {
  try { const v = await AsyncStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
async function saveJSON(key, value) {
  try { await AsyncStorage.setItem(key, JSON.stringify(value)); } catch {}
}

// ── Glass card component ──────────────────────────────────────────────────────
const GlassCard = ({ children, style, onPress, activeOpacity = 0.85 }) => {
  if (onPress) {
    return (
      <TouchableOpacity style={[styles.glass, style]} onPress={onPress} activeOpacity={activeOpacity}>
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={[styles.glass, style]}>{children}</View>;
};

export default function App() {
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeMode, setActiveMode] = useState("find");
  const [product, setProduct] = useState(null);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const [lastMode, setLastMode] = useState(null);
  const [screen, setScreen] = useState("home");
  const [history, setHistory] = useState([]);
  const [saved, setSaved] = useState([]);
  const [explainModal, setExplainModal] = useState(false);
  const [manualSearch, setManualSearch] = useState("");
  const [showManualSearch, setShowManualSearch] = useState(false);
  const [manualLoading, setManualLoading] = useState(false);


  // Pulse animation for loading
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (loading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.04, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulse.setValue(1);
    }
  }, [loading]);

  useEffect(() => {
    loadJSON(HISTORY_KEY, []).then(setHistory);
    loadJSON(SAVED_KEY, []).then(setSaved);

  }, []);

  const reset = () => {
    setPhoto(null); setProduct(null); setResults([]);
    setError(null); setLastMode(null);
    setManualSearch(""); setShowManualSearch(false);
  };

  const pickPhoto = async (fromCamera) => {
    const perm = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { setError(fromCamera ? "Camera access needed" : "Photo library access needed"); return; }
    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
    if (!result.canceled && result.assets?.length) {
      setPhoto(result.assets[0]);
      setProduct(null); setResults([]); setError(null); setLastMode(null);
      setManualSearch(""); setShowManualSearch(false);
    }
  };

  const submit = async (overrideQuery = null) => {
    if (!photo) { setError("Add a photo first"); return; }
    setLoading(true); setError(null);
    setLastMode(activeMode); setProduct(null); setResults([]);
    setShowManualSearch(false);
    try {
      const fd = new FormData();
      fd.append("photo", { uri: photo.uri, name: "photo.jpg", type: "image/jpeg" });
      if (overrideQuery) fd.append("manualQuery", overrideQuery);
      const res = await fetch(`${API_BASE_URL}/${activeMode}`, {
        method: "POST", body: fd,
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setProduct(data.product);
      setResults(data.results || []);
      if (activeMode === "explain" && data.product) setExplainModal(true);
      if (data.product?.confidence !== "high") {
        setShowManualSearch(true);
        setManualSearch(data.product?.searchQuery || "");
      }
      const entry = {
        id: Date.now().toString(),
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        photoUri: photo.uri,
        product: data.product,
        results: data.results || [],
        mode: activeMode,
      };
      const updated = [entry, ...history].slice(0, 50);
      setHistory(updated); saveJSON(HISTORY_KEY, updated);
    } catch (e) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const submitManualSearch = async () => {
    if (!manualSearch.trim()) return;
    setManualLoading(true); setError(null);
    try {
      const fd = new FormData();
      fd.append("photo", { uri: photo.uri, name: "photo.jpg", type: "image/jpeg" });
      fd.append("manualQuery", manualSearch.trim());
      const res = await fetch(`${API_BASE_URL}/find`, {
        method: "POST", body: fd,
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setResults(data.results || []);
      setLastMode("find");
    } catch (e) {
      setError(e.message || "Search failed");
    } finally {
      setManualLoading(false);
    }
  };

  const saveItem = (item) => {
    if (saved.find(s => s.link === item.link)) {
      Alert.alert("Already saved", "This item is already in your list."); return;
    }
    const entry = { ...item, id: Date.now().toString(), savedAt: new Date().toLocaleDateString() };
    const updated = [entry, ...saved];
    setSaved(updated); saveJSON(SAVED_KEY, updated);
    Alert.alert("Saved! ♡", "Added to your shopping list.");
  };

  const removeSaved = (id) => {
    const updated = saved.filter(s => s.id !== id);
    setSaved(updated); saveJSON(SAVED_KEY, updated);
  };

  const clearHistory = () => {
    Alert.alert("Clear History", "Remove all search history?", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear", style: "destructive", onPress: () => { setHistory([]); saveJSON(HISTORY_KEY, []); } },
    ]);
  };

  const loadHistoryEntry = (entry) => {
    setPhoto({ uri: entry.photoUri });
    setProduct(entry.product);
    setResults(entry.results);
    setLastMode(entry.mode);
    setScreen("home");
  };

  const renderStars = (rating) => {
    if (!rating) return null;
    const r = parseFloat(rating);
    return "★".repeat(Math.floor(r)) + "☆".repeat(5 - Math.floor(r));
  };

  const confColor = (c) => c === "high" ? C.green : c === "medium" ? C.orange : C.red;
  const confLabel = (c) => c === "high" ? "High confidence" : c === "medium" ? "Probable match" : "Low confidence";

  // ── Explain modal ─────────────────────────────────────────────────────────
  const ExplainModal = () => (
    <Modal visible={explainModal} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalBg}>
        <SafeAreaView style={{ flex: 1, backgroundColor: "#C8C8D8" }}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setExplainModal(false)} style={styles.modalCloseBtn}>
              <Text style={styles.modalCloseText}>✕  Close</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Product Details</Text>
            <View style={{ width: 80 }} />
          </View>

          <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
            {photo && (
              <View style={styles.modalPhotoWrap}>
                <Image source={{ uri: photo.uri }} style={styles.modalPhoto} resizeMode="cover" />
                <View style={styles.modalPhotoOverlay} />
              </View>
            )}

            {product && (
              <>
                <GlassCard style={styles.modalProductCard}>
                  {product.brand && (
                    <View style={styles.brandBadge}>
                      <Text style={styles.brandBadgeText}>{product.brand.toUpperCase()}</Text>
                    </View>
                  )}
                  <Text style={styles.modalProductName}>{product.productName}</Text>
                  {product.category && (
                    <View style={styles.categoryPill}>
                      <Text style={styles.categoryPillText}>{product.category}</Text>
                    </View>
                  )}
                  {product.confidence && (
                    <View style={[styles.confBadge, { backgroundColor: confColor(product.confidence) + "18" }]}>
                      <View style={[styles.confDot, { backgroundColor: confColor(product.confidence) }]} />
                      <Text style={[styles.confText, { color: confColor(product.confidence) }]}>{confLabel(product.confidence)}</Text>
                    </View>
                  )}
                </GlassCard>

                <Text style={styles.modalSection}>PRODUCT DETAILS</Text>
                <GlassCard style={styles.detailCard}>
                  {[
                    { label: "Brand", value: product.brand },
                    { label: "Model", value: product.model },
                    { label: "Category", value: product.category },
                  ].filter(r => r.value).map((row, i, arr) => (
                    <View key={i} style={[styles.detailRow, i < arr.length - 1 && styles.detailRowBorder]}>
                      <Text style={styles.detailLabel}>{row.label}</Text>
                      <Text style={styles.detailValue}>{row.value}</Text>
                    </View>
                  ))}
                </GlassCard>

                <Text style={styles.modalSection}>DESCRIPTION</Text>
                <GlassCard style={{ padding: 16 }}>
                  <Text style={styles.modalDesc}>{product.description}</Text>
                </GlassCard>

                {product.confidence !== "high" && (
                  <>
                    <Text style={styles.modalSection}>NOT RIGHT? SEARCH MANUALLY</Text>
                    <GlassCard style={{ padding: 14 }}>
                      <View style={styles.manualRow}>
                        <TextInput
                          style={styles.manualInput}
                          value={manualSearch}
                          onChangeText={setManualSearch}
                          placeholder="Type the exact product…"
                          placeholderTextColor={C.textMuted}
                          returnKeyType="search"
                          onSubmitEditing={() => { setExplainModal(false); submitManualSearch(); }}
                        />
                        <TouchableOpacity style={styles.manualBtn} onPress={() => { setExplainModal(false); submitManualSearch(); }}>
                          <Text style={styles.manualBtnText}>Search</Text>
                        </TouchableOpacity>
                      </View>
                    </GlassCard>
                  </>
                )}

                <TouchableOpacity
                  style={styles.modalFindBtn}
                  onPress={() => { setExplainModal(false); setActiveMode("find"); setTimeout(() => submit(), 300); }}
                >
                  <Text style={styles.modalFindBtnText}>🛍  Find Where to Buy</Text>
                </TouchableOpacity>
              </>
            )}
            <View style={{ height: 40 }} />
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );

  // ── Result card ───────────────────────────────────────────────────────────
  const ResultCard = ({ item }) => (
    <GlassCard style={styles.resultCard}>
      <TouchableOpacity style={styles.resultCardInner} onPress={() => Linking.openURL(item.link)} activeOpacity={0.75}>
        <View style={styles.resultImgBox}>
          {item.thumbnail
            ? <Image source={{ uri: item.thumbnail }} style={styles.resultImg} resizeMode="contain" />
            : <Text style={{ fontSize: 28 }}>🛍</Text>}
        </View>
        <View style={styles.resultInfo}>
          <Text style={styles.resultRetailer}>{item.retailer}</Text>
          <Text style={styles.resultTitle} numberOfLines={2}>{item.title}</Text>
          {item.rating && (
            <Text style={styles.resultRating}>
              {renderStars(parseFloat(item.rating))} {item.rating}
              {item.reviews ? `  (${item.reviews})` : ""}
            </Text>
          )}
          {item.price && <Text style={styles.resultPrice}>{item.price}</Text>}
        </View>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.saveRow} onPress={() => saveItem(item)}>
        <Text style={styles.saveRowText}>♡  Save to list</Text>
      </TouchableOpacity>
    </GlassCard>
  );

  // ── Home screen ───────────────────────────────────────────────────────────
  const HomeScreen = () => (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.homeContent} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.homeHeader}>
        <View>
          <Text style={styles.homeLogo}>snappy<Text style={styles.homeLogoDot}>●</Text></Text>
          <Text style={styles.homeTagline}>Identify anything. Find it anywhere.</Text>
        </View>
        {(photo || product) && (
          <TouchableOpacity style={styles.startOverPill} onPress={reset}>
            <Text style={styles.startOverText}>✕  Reset</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Photo card */}
      <Animated.View style={[{ transform: [{ scale: loading ? pulse : 1 }] }]}>
        <GlassCard style={styles.photoCard} onPress={() => pickPhoto(false)}>
          {photo ? (
            <Image source={{ uri: photo.uri }} style={styles.photoImg} />
          ) : (
            <View style={styles.photoEmpty}>
              <View style={styles.photoIconRing}>
                <Text style={styles.photoIcon}>📷</Text>
              </View>
              <Text style={styles.photoEmptyTitle}>Tap to add a photo</Text>
              <Text style={styles.photoEmptySubtitle}>Point at any product to identify it</Text>
            </View>
          )}
          {loading && (
            <View style={styles.photoLoadingOverlay}>
              <ActivityIndicator color="#fff" size="large" />
              <Text style={styles.photoLoadingText}>Analyzing…</Text>
            </View>
          )}
        </GlassCard>
      </Animated.View>

      {/* Camera / Library row */}
      <View style={styles.captureRow}>
        <GlassCard style={styles.captureBtn} onPress={() => pickPhoto(true)}>
          <Text style={styles.captureBtnText}>📷  Camera</Text>
        </GlassCard>
        <GlassCard style={styles.captureBtn} onPress={() => pickPhoto(false)}>
          <Text style={styles.captureBtnText}>🖼  Library</Text>
        </GlassCard>
      </View>

      {/* Mode toggle */}
      <GlassCard style={styles.modeToggle}>
        {[{ id: "explain", label: "🔍  Explain" }, { id: "find", label: "🛍  Find" }].map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.modeTab, activeMode === tab.id && styles.modeTabActive]}
            onPress={() => setActiveMode(tab.id)}
            activeOpacity={0.8}
          >
            <Text style={[styles.modeTabText, activeMode === tab.id && styles.modeTabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </GlassCard>

      {/* CTA */}
      <TouchableOpacity
        style={[styles.cta, (!photo || loading) && styles.ctaDisabled]}
        onPress={() => submit()}
        disabled={!photo || loading}
        activeOpacity={0.85}
      >
        <Text style={styles.ctaText}>
          {loading ? "Analyzing…" : activeMode === "explain" ? "Explain This" : "Find Where to Buy"}
        </Text>
      </TouchableOpacity>

      {/* Error */}
      {error && (
        <GlassCard style={styles.errorCard}>
          <Text style={styles.errorText}>⚠️  {error}</Text>
        </GlassCard>
      )}

      {/* Explain preview */}
      {product && lastMode === "explain" && (
        <GlassCard style={styles.explainPreview} onPress={() => setExplainModal(true)}>
          <View style={styles.explainPreviewLeft}>
            {photo && <Image source={{ uri: photo.uri }} style={styles.explainThumb} />}
            <View style={{ flex: 1 }}>
              {product.brand && <Text style={styles.resultRetailer}>{product.brand.toUpperCase()}</Text>}
              <Text style={styles.explainProductName} numberOfLines={2}>{product.productName}</Text>
              {product.category && <Text style={styles.explainCategory}>{product.category}</Text>}
            </View>
          </View>
          <View style={{ alignItems: "flex-end", gap: 4 }}>
            <Text style={styles.tapHint}>Full details</Text>
            <Text style={styles.chevron}>›</Text>
          </View>
        </GlassCard>
      )}

      {/* Manual search */}
      {showManualSearch && photo && (
        <GlassCard style={styles.manualCard}>
          <View style={styles.manualCardTop}>
            <View style={[styles.confDot, { backgroundColor: confColor(product?.confidence || "low") }]} />
            <Text style={[styles.confText, { color: confColor(product?.confidence || "low") }]}>
              {confLabel(product?.confidence || "low")} — edit to improve results
            </Text>
          </View>
          <View style={styles.manualRow}>
            <TextInput
              style={styles.manualInput}
              value={manualSearch}
              onChangeText={setManualSearch}
              placeholder="Type what it actually is…"
              placeholderTextColor={C.textMuted}
              returnKeyType="search"
              onSubmitEditing={submitManualSearch}
            />
            <TouchableOpacity style={styles.manualBtn} onPress={submitManualSearch} disabled={manualLoading}>
              {manualLoading
                ? <ActivityIndicator color={C.white} size="small" />
                : <Text style={styles.manualBtnText}>Search</Text>}
            </TouchableOpacity>
          </View>
        </GlassCard>
      )}

      {/* Find results */}
      {lastMode === "find" && (product || results.length > 0) && (
        <View>
          {product && (
            <GlassCard style={styles.identCard}>
              <View style={{ flexDirection: "row", gap: 12 }}>
                {photo && <Image source={{ uri: photo.uri }} style={styles.identThumb} />}
                <View style={{ flex: 1 }}>
                  {product.brand && <Text style={styles.resultRetailer}>{product.brand.toUpperCase()}</Text>}
                  <Text style={styles.identName}>{product.productName}</Text>
                  {product.category && (
                    <View style={styles.categoryPill}>
                      <Text style={styles.categoryPillText}>{product.category}</Text>
                    </View>
                  )}
                  {product.confidence && (
                    <View style={[styles.confBadge, { backgroundColor: confColor(product.confidence) + "18", marginTop: 6 }]}>
                      <View style={[styles.confDot, { backgroundColor: confColor(product.confidence) }]} />
                      <Text style={[styles.confText, { color: confColor(product.confidence) }]}>{confLabel(product.confidence)}</Text>
                    </View>
                  )}
                </View>
              </View>
            </GlassCard>
          )}

          {results.length > 0 && (
            <>
              <View style={styles.sectionRow}>
                <Text style={styles.sectionLabel}>WHERE TO BUY</Text>
                <Text style={styles.sectionCount}>{results.length} found</Text>
              </View>
              {results.map((item, idx) => <ResultCard key={idx} item={item} />)}
            </>
          )}
        </View>
      )}

      <View style={{ height: 90 }} />
    </ScrollView>
  );

  // ── History screen ────────────────────────────────────────────────────────
  const HistoryScreen = () => (
    <View style={{ flex: 1 }}>
      <View style={styles.screenHeader}>
        <Text style={styles.screenTitle}>History</Text>
        {history.length > 0 && (
          <TouchableOpacity onPress={clearHistory}>
            <Text style={[styles.sectionLabel, { color: C.red }]}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>
      {history.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🕐</Text>
          <Text style={styles.emptyTitle}>No searches yet</Text>
          <Text style={styles.emptySubtitle}>Your search history will appear here</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={i => i.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 90 }}
          renderItem={({ item }) => (
            <GlassCard style={styles.histCard} onPress={() => loadHistoryEntry(item)}>
              <Image source={{ uri: item.photoUri }} style={styles.histThumb} />
              <View style={{ flex: 1 }}>
                <Text style={styles.histMode}>{item.mode === "find" ? "🛍 Find" : "🔍 Explain"}</Text>
                <Text style={styles.histName} numberOfLines={2}>{item.product?.productName || "Unknown"}</Text>
                {item.product?.brand && <Text style={styles.resultRetailer}>{item.product.brand}</Text>}
                <Text style={styles.histDate}>{item.date}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </GlassCard>
          )}
        />
      )}
    </View>
  );

  // ── Saved screen ──────────────────────────────────────────────────────────
  const SavedScreen = () => (
    <View style={{ flex: 1 }}>
      <View style={styles.screenHeader}>
        <Text style={styles.screenTitle}>Saved List</Text>
        {saved.length > 0 && <Text style={styles.sectionCount}>{saved.length} items</Text>}
      </View>
      {saved.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>♡</Text>
          <Text style={styles.emptyTitle}>Nothing saved yet</Text>
          <Text style={styles.emptySubtitle}>Tap ♡ on any result to save it here</Text>
        </View>
      ) : (
        <FlatList
          data={saved}
          keyExtractor={i => i.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 90 }}
          renderItem={({ item }) => (
            <GlassCard style={styles.resultCard}>
              <TouchableOpacity style={styles.resultCardInner} onPress={() => Linking.openURL(item.link)} activeOpacity={0.75}>
                <View style={styles.resultImgBox}>
                  {item.thumbnail
                    ? <Image source={{ uri: item.thumbnail }} style={styles.resultImg} resizeMode="contain" />
                    : <Text style={{ fontSize: 28 }}>🛍</Text>}
                </View>
                <View style={styles.resultInfo}>
                  <Text style={styles.resultRetailer}>{item.retailer}</Text>
                  <Text style={styles.resultTitle} numberOfLines={2}>{item.title}</Text>
                  {item.price && <Text style={styles.resultPrice}>{item.price}</Text>}
                  <Text style={styles.histDate}>Saved {item.savedAt}</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveRow, { borderTopColor: "rgba(255,60,30,0.15)" }]} onPress={() => removeSaved(item.id)}>
                <Text style={[styles.saveRowText, { color: C.red }]}>✕  Remove</Text>
              </TouchableOpacity>
            </GlassCard>
          )}
        />
      )}
    </View>
  );

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#C8C8D8" }}>
        <ExplainModal />
        {screen === "home" && <HomeScreen />}
        {screen === "history" && <HistoryScreen />}
        {screen === "saved" && <SavedScreen />}
        <GlassCard style={styles.tabBar}>
          {[
            { id: "home", icon: "🏠", label: "Search" },
            { id: "history", icon: "🕐", label: "History" },
            { id: "saved", icon: "♡", label: "Saved" },
          ].map(tab => (
            <TouchableOpacity key={tab.id} style={styles.tabItem} onPress={() => setScreen(tab.id)} activeOpacity={0.7}>
              <Text style={[styles.tabIcon, screen === tab.id && styles.tabIconActive]}>{tab.icon}</Text>
              <Text style={[styles.tabLabel, screen === tab.id && styles.tabLabelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </GlassCard>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#C8C8D8" },


  // Glass base
  glass: {
    backgroundColor: "rgba(255,255,255,0.52)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.75)",
    shadowColor: "rgba(60,50,180,0.18)",
    shadowOpacity: 1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },

  // Home
  homeContent: { paddingHorizontal: 16, paddingTop: Platform.OS === "android" ? 48 : 16 },
  homeHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  homeLogo: { fontSize: 28, fontWeight: "800", color: C.text, letterSpacing: -0.5 },
  homeLogoDot: { color: C.accent, fontSize: 12 },
  homeTagline: { fontSize: 13, color: C.textSub, marginTop: 2 },
  startOverPill: { backgroundColor: "rgba(255,255,255,0.6)", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1, borderColor: C.glassBorder },
  startOverText: { fontSize: 13, fontWeight: "600", color: C.textSub },

  // Photo
  photoCard: { width: "100%", height: 250, overflow: "hidden", marginBottom: 10, padding: 0 },
  photoImg: { width: "100%", height: "100%", resizeMode: "cover", borderRadius: 19 },
  photoEmpty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  photoIconRing: { width: 64, height: 64, borderRadius: 32, backgroundColor: "rgba(91,141,239,0.12)", alignItems: "center", justifyContent: "center", marginBottom: 4 },
  photoIcon: { fontSize: 30 },
  photoEmptyTitle: { fontSize: 16, fontWeight: "700", color: C.text },
  photoEmptySubtitle: { fontSize: 13, color: C.textSub },
  photoLoadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center", borderRadius: 19, gap: 10 },
  photoLoadingText: { color: "#fff", fontWeight: "600", fontSize: 14 },

  // Capture
  captureRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  captureBtn: { flex: 1, paddingVertical: 11, alignItems: "center" },
  captureBtnText: { fontSize: 14, fontWeight: "600", color: C.text },

  // Mode toggle
  modeToggle: { flexDirection: "row", padding: 4, marginBottom: 10 },
  modeTab: { flex: 1, paddingVertical: 10, borderRadius: 16, alignItems: "center" },
  modeTabActive: { backgroundColor: C.accent, shadowColor: C.accent, shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 4 },
  modeTabText: { fontSize: 14, fontWeight: "600", color: C.textSub },
  modeTabTextActive: { color: C.white },

  // CTA
  cta: { backgroundColor: C.accent, borderRadius: 18, paddingVertical: 16, alignItems: "center", marginBottom: 14, shadowColor: C.accent, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  ctaDisabled: { opacity: 0.4 },
  ctaText: { color: C.white, fontSize: 16, fontWeight: "700", letterSpacing: 0.2 },

  // Error
  errorCard: { padding: 14, marginBottom: 12 },
  errorText: { color: C.red, fontSize: 14, textAlign: "center" },

  // Explain preview
  explainPreview: { flexDirection: "row", alignItems: "center", padding: 14, marginBottom: 12, justifyContent: "space-between" },
  explainPreviewLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  explainThumb: { width: 60, height: 60, borderRadius: 12, backgroundColor: C.border },
  explainProductName: { fontSize: 15, fontWeight: "700", color: C.text, lineHeight: 20 },
  explainCategory: { fontSize: 12, color: C.textMuted, marginTop: 2 },
  tapHint: { fontSize: 11, color: C.accent, fontWeight: "600" },

  // Manual search
  manualCard: { padding: 14, marginBottom: 12 },
  manualCardTop: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
  manualRow: { flexDirection: "row", gap: 8 },
  manualInput: { flex: 1, backgroundColor: "rgba(255,255,255,0.7)", borderRadius: 12, borderWidth: 1, borderColor: C.border, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: C.text },
  manualBtn: { backgroundColor: C.accent, borderRadius: 12, paddingHorizontal: 16, alignItems: "center", justifyContent: "center", minWidth: 70 },
  manualBtnText: { color: C.white, fontWeight: "700", fontSize: 14 },

  // Ident card
  identCard: { padding: 14, marginBottom: 12 },
  identThumb: { width: 72, height: 72, borderRadius: 12, backgroundColor: C.border },
  identName: { fontSize: 15, fontWeight: "700", color: C.text, lineHeight: 21, marginBottom: 4 },

  // Confidence
  confBadge: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, alignSelf: "flex-start" },
  confDot: { width: 7, height: 7, borderRadius: 4 },
  confText: { fontSize: 12, fontWeight: "600" },

  // Brand / category
  brandBadge: { backgroundColor: C.accentSoft, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignSelf: "flex-start", marginBottom: 8 },
  brandBadgeText: { fontSize: 11, fontWeight: "800", color: C.accent, letterSpacing: 1 },
  categoryPill: { alignSelf: "flex-start", backgroundColor: "rgba(255,255,255,0.6)", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, marginTop: 6, borderWidth: 1, borderColor: C.glassBorder },
  categoryPillText: { fontSize: 11, color: C.textSub, fontWeight: "500" },

  // Section row
  sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  sectionLabel: { fontSize: 11, fontWeight: "700", color: C.textMuted, letterSpacing: 0.8 },
  sectionCount: { fontSize: 12, color: C.textMuted },

  // Result card
  resultCard: { marginBottom: 10, overflow: "hidden", padding: 0 },
  resultCardInner: { flexDirection: "row", alignItems: "center", padding: 12, gap: 10 },
  resultImgBox: { width: 76, height: 76, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.5)", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  resultImg: { width: 76, height: 76 },
  resultInfo: { flex: 1 },
  resultRetailer: { fontSize: 11, fontWeight: "700", color: C.accent, letterSpacing: 0.5, marginBottom: 2 },
  resultTitle: { fontSize: 13, color: C.text, lineHeight: 18, marginBottom: 4 },
  resultRating: { fontSize: 11, color: "#FF9500", marginBottom: 4 },
  resultPrice: { fontSize: 18, fontWeight: "800", color: C.text },
  chevron: { fontSize: 22, color: C.textMuted },
  saveRow: { flexDirection: "row", justifyContent: "center", paddingVertical: 10, borderTopWidth: 1, borderTopColor: "rgba(91,141,239,0.15)" },
  saveRowText: { fontSize: 13, fontWeight: "600", color: C.accent },

  // Tab bar
  tabBar: { position: "absolute", bottom: Platform.OS === "ios" ? 20 : 12, left: 20, right: 20, flexDirection: "row", paddingVertical: 10, paddingHorizontal: 8, borderRadius: 28 },
  tabItem: { flex: 1, alignItems: "center", gap: 3 },
  tabIcon: { fontSize: 22, opacity: 0.5 },
  tabIconActive: { opacity: 1 },
  tabLabel: { fontSize: 11, color: C.textMuted, fontWeight: "500" },
  tabLabelActive: { color: C.accent, fontWeight: "700" },

  // Screen header
  screenHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingTop: Platform.OS === "android" ? 48 : 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  screenTitle: { fontSize: 24, fontWeight: "800", color: C.text },

  // History
  histCard: { flexDirection: "row", alignItems: "center", padding: 12, marginBottom: 10, gap: 12 },
  histThumb: { width: 60, height: 60, borderRadius: 12, backgroundColor: C.border },
  histMode: { fontSize: 11, fontWeight: "600", color: C.textMuted, marginBottom: 3 },
  histName: { fontSize: 14, fontWeight: "700", color: C.text, lineHeight: 19, marginBottom: 2 },
  histDate: { fontSize: 11, color: C.textMuted, marginTop: 2 },

  // Empty
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8, paddingBottom: 80 },
  emptyEmoji: { fontSize: 52, marginBottom: 8 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: C.text },
  emptySubtitle: { fontSize: 14, color: C.textSub, textAlign: "center", paddingHorizontal: 40 },

  // Modal
  modalBg: { flex: 1, backgroundColor: "#C8C8D8" },

  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  modalCloseBtn: { paddingVertical: 4 },
  modalCloseText: { fontSize: 15, color: C.accent, fontWeight: "600" },
  modalTitle: { fontSize: 16, fontWeight: "700", color: C.text },
  modalContent: { padding: 16 },
  modalPhotoWrap: { borderRadius: 20, overflow: "hidden", marginBottom: 16 },
  modalPhoto: { width: "100%", height: 260 },
  modalPhotoOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.06)" },
  modalProductCard: { padding: 16, marginBottom: 12 },
  modalProductName: { fontSize: 22, fontWeight: "800", color: C.text, lineHeight: 28, marginBottom: 8 },
  modalSection: { fontSize: 11, fontWeight: "700", color: C.textMuted, letterSpacing: 0.8, marginBottom: 8, marginTop: 16 },
  detailCard: { padding: 0, overflow: "hidden" },
  detailRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 12, paddingHorizontal: 16 },
  detailRowBorder: { borderBottomWidth: 1, borderBottomColor: C.border },
  detailLabel: { fontSize: 14, color: C.textSub },
  detailValue: { fontSize: 14, color: C.text, fontWeight: "600" },
  modalDesc: { fontSize: 15, color: C.textSub, lineHeight: 22 },
  modalFindBtn: { backgroundColor: C.accent, borderRadius: 16, paddingVertical: 15, alignItems: "center", marginTop: 20, shadowColor: C.accent, shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  modalFindBtnText: { color: C.white, fontSize: 16, fontWeight: "700" },
});
