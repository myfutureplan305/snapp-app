import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import * as ImagePicker from "expo-image-picker";

const API_BASE_URL = "https://snappybackend.vercel.app";

export default function App() {
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState(null);
  const [product, setProduct] = useState(null);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);

  const resetResults = () => {
    setProduct(null);
    setResults([]);
    setError(null);
  };

  const pickPhoto = async (fromCamera) => {
    resetResults();
    const permission = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setError("Permission needed to access " + (fromCamera ? "camera" : "photos"));
      return;
    }

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.7, base64: false })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.7, base64: false });

    if (!result.canceled && result.assets?.length) {
      setPhoto(result.assets[0]);
    }
  };

  const submitPhoto = async (endpoint) => {
    if (!photo) {
      setError("Take or choose a photo first");
      return;
    }
    setMode(endpoint);
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("photo", {
        uri: photo.uri,
        name: "photo.jpg",
        type: "image/jpeg",
      });

      const res = await fetch(`${API_BASE_URL}/${endpoint}`, {
        method: "POST",
        body: formData,
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();
      setProduct(data.product);
      setResults(data.results || []);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <StatusBar style="auto" />
      <Text style={styles.logo}>Snappy</Text>
      <Text style={styles.tagline}>Snap it. Know it. Find it.</Text>

      <View style={styles.photoBox}>
        {photo ? (
          <Image source={{ uri: photo.uri }} style={styles.photo} />
        ) : (
          <Text style={styles.photoPlaceholder}>No photo yet</Text>
        )}
      </View>

      <View style={styles.captureRow}>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => pickPhoto(true)}>
          <Text style={styles.secondaryButtonText}>Take Photo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => pickPhoto(false)}>
          <Text style={styles.secondaryButtonText}>Choose Photo</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.actionButton, styles.explainButton]}
          onPress={() => submitPhoto("explain")}
          disabled={loading}
        >
          <Text style={styles.actionButtonText}>Explain</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.findButton]}
          onPress={() => submitPhoto("find")}
          disabled={loading}
        >
          <Text style={styles.actionButtonText}>Find</Text>
        </TouchableOpacity>
      </View>

      {loading && <ActivityIndicator size="large" style={{ marginTop: 24 }} />}
      {error && <Text style={styles.error}>{error}</Text>}

      {product && (
        <View style={styles.card}>
          <Text style={styles.productName}>{product.productName}</Text>
          {product.brand && <Text style={styles.meta}>Brand: {product.brand}</Text>}
          {product.category && <Text style={styles.meta}>Category: {product.category}</Text>}
          <Text style={styles.description}>{product.description}</Text>
          <Text style={styles.confidence}>Confidence: {product.confidence}</Text>
        </View>
      )}

      {mode === "find" && results.length > 0 && (
        <View style={styles.resultsSection}>
          <Text style={styles.resultsHeader}>Where to buy</Text>
          {results.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.resultCard}
              onPress={() => Linking.openURL(item.link)}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.retailer}>{item.retailer}</Text>
                <Text style={styles.itemTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                {item.price && <Text style={styles.price}>{item.price}</Text>}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    paddingTop: 70,
    paddingHorizontal: 20,
    paddingBottom: 60,
  },
  logo: { fontSize: 34, fontWeight: "800", color: "#1a1a1a" },
  tagline: { fontSize: 14, color: "#888", marginBottom: 24 },
  photoBox: {
    width: "100%",
    height: 260,
    borderRadius: 16,
    backgroundColor: "#f2f2f2",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginBottom: 16,
  },
  photo: { width: "100%", height: "100%" },
  photoPlaceholder: { color: "#aaa" },
  captureRow: { flexDirection: "row", gap: 12, marginBottom: 16, width: "100%" },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryButtonText: { color: "#333", fontWeight: "600" },
  actionRow: { flexDirection: "row", gap: 12, width: "100%" },
  actionButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  explainButton: { backgroundColor: "#1a1a1a" },
  findButton: { backgroundColor: "#0a84ff" },
  actionButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  error: { color: "#d00", marginTop: 16, textAlign: "center" },
  card: {
    width: "100%",
    marginTop: 24,
    padding: 18,
    borderRadius: 14,
    backgroundColor: "#f7f7f8",
  },
  productName: { fontSize: 20, fontWeight: "700", marginBottom: 6 },
  meta: { fontSize: 13, color: "#555" },
  description: { fontSize: 14, color: "#333", marginTop: 8, lineHeight: 20 },
  confidence: { fontSize: 12, color: "#999", marginTop: 10 },
  resultsSection: { width: "100%", marginTop: 24 },
  resultsHeader: { fontSize: 16, fontWeight: "700", marginBottom: 10 },
  resultCard: {
    width: "100%",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#eee",
    marginBottom: 10,
  },
  retailer: { fontSize: 12, color: "#0a84ff", fontWeight: "700" },
  itemTitle: { fontSize: 14, color: "#222", marginTop: 4 },
  price: { fontSize: 15, fontWeight: "700", marginTop: 6 },
});
