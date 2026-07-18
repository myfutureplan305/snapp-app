import { useState, useRef } from "react";
import {
  Dimensions,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width: SW, height: SH } = Dimensions.get("window");

const SLIDES = [
  {
    id: "1",
    emoji: "📸",
    title: "If You Can See It,\nSnappy Can Find It.",
    subtitle: "Point your camera at anything and instantly identify it — then find it online.",
    bg: "#5B4DE8",
    accent: "#A594FF",
  },
  {
    id: "2",
    emoji: "👗",
    title: "Street Style\nOn Demand",
    subtitle: "See someone wearing something cool? Snap it and find exactly where to buy it in seconds.",
    bg: "#3B82C4",
    accent: "#93C5FD",
  },
  {
    id: "3",
    emoji: "🔩",
    title: "Find Any Part,\nAnywhere",
    subtitle: "Broken vintage door hinge? Rare appliance part? Snap it and Snappy finds the exact match online.",
    bg: "#0E7C6A",
    accent: "#6EE7B7",
  },
  {
    id: "4",
    emoji: "🏷️",
    title: "Thrift Smarter,\nSell Better",
    subtitle: "At garage sales or thrift stores? Snap items to instantly see what they are worth and where to resell.",
    bg: "#B45309",
    accent: "#FCD34D",
  },
  {
    id: "5",
    emoji: "🛋️",
    title: "Love It?\nSource It.",
    subtitle: "See a lamp at a friend's place, a chair in a hotel, or furniture in a magazine — snap and find it.",
    bg: "#7C3AED",
    accent: "#C4B5FD",
  },
  {
    id: "6",
    emoji: "⚡",
    title: "Unlimited Finds\nFor $39.99/yr",
    subtitle: "One subscription. Unlimited photo searches. Find anything, anywhere, anytime.\n\nThat is just $3.33/month.",
    bg: "#1A1A2E",
    accent: "#5B8DEF",
    isCTA: true,
  },
];

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

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) setActiveIndex(viewableItems[0].index);
  }).current;

  return (
    <View style={styles.root}>
      <FlatList
        ref={flatRef}
        data={SLIDES}
        keyExtractor={i => i.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        renderItem={({ item }) => (
          <View style={[styles.slide, { backgroundColor: item.bg }]}>
            <View style={[styles.topCircle, { backgroundColor: item.accent + "22" }]} />
            <View style={[styles.topCircle2, { backgroundColor: item.accent + "15" }]} />
            <View style={styles.slideContent}>
              <View style={styles.logoRow}>
                <Text style={styles.logo}>snappy<Text style={[styles.logoDot, { color: item.accent }]}>●</Text></Text>
              </View>
              <View style={[styles.emojiBox, { backgroundColor: item.accent + "25", borderColor: item.accent + "40" }]}>
                <Text style={styles.emoji}>{item.emoji}</Text>
              </View>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.subtitle}>{item.subtitle}</Text>
              {item.isCTA && (
                <View style={styles.featureList}>
                  {[
                    "📷  Unlimited photo searches",
                    "🛍  Find products across all retailers",
                    "♡  Save items to your shopping list",
                    "🕐  Full search history",
                  ].map((f, i) => (
                    <View key={i} style={[styles.featureRow, { borderColor: item.accent + "30" }]}>
                      <Text style={[styles.featureText, { color: item.accent }]}>{f}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
            <View style={styles.bottomCard}>
              <View style={styles.dots}>
                {SLIDES.map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.dot,
                      {
                        backgroundColor: i === activeIndex ? item.accent : "rgba(255,255,255,0.3)",
                        width: i === activeIndex ? 24 : 8,
                      },
                    ]}
                  />
                ))}
              </View>
              {item.isCTA ? (
                <View style={styles.ctaButtons}>
                  <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: item.accent }]} onPress={onComplete} activeOpacity={0.85}>
                    <Text style={styles.primaryBtnText}>Start Free — 5 Searches</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.secondaryBtn, { borderColor: item.accent + "50" }]} onPress={onComplete} activeOpacity={0.75}>
                    <Text style={[styles.secondaryBtnText, { color: item.accent }]}>Subscribe — $39.99/yr</Text>
                  </TouchableOpacity>
                  <Text style={styles.restoreText}>Restore purchase</Text>
                </View>
              ) : (
                <View style={styles.navButtons}>
                  <TouchableOpacity style={styles.skipBtn} onPress={onComplete} activeOpacity={0.7}>
                    <Text style={styles.skipText}>Skip</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.nextBtn, { backgroundColor: item.accent }]} onPress={goNext} activeOpacity={0.85}>
                    <Text style={styles.nextBtnText}>Next  →</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  slide: { width: SW, minHeight: SH, position: "relative", overflow: "hidden" },
  topCircle: { position: "absolute", width: 400, height: 400, borderRadius: 200, top: -160, right: -120 },
  topCircle2: { position: "absolute", width: 300, height: 300, borderRadius: 150, top: -80, left: -100 },
  slideContent: { flex: 1, paddingHorizontal: 28, paddingTop: Platform.OS === "ios" ? 70 : 50, paddingBottom: 20, alignItems: "center" },
  logoRow: { alignSelf: "flex-start", marginBottom: 40 },
  logo: { fontSize: 22, fontWeight: "800", color: "rgba(255,255,255,0.9)", letterSpacing: -0.5 },
  logoDot: { fontSize: 10 },
  emojiBox: { width: 110, height: 110, borderRadius: 30, borderWidth: 1.5, alignItems: "center", justifyContent: "center", marginBottom: 36 },
  emoji: { fontSize: 52 },
  title: { fontSize: 34, fontWeight: "800", color: "#FFFFFF", textAlign: "center", lineHeight: 42, marginBottom: 16, letterSpacing: -0.5 },
  subtitle: { fontSize: 16, color: "rgba(255,255,255,0.75)", textAlign: "center", lineHeight: 24, paddingHorizontal: 8 },
  featureList: { width: "100%", marginTop: 28, gap: 8 },
  featureRow: { borderWidth: 1, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, backgroundColor: "rgba(255,255,255,0.07)" },
  featureText: { fontSize: 14, fontWeight: "600" },
  bottomCard: { backgroundColor: "rgba(0,0,0,0.25)", borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 28, paddingBottom: Platform.OS === "ios" ? 44 : 28, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.12)" },
  dots: { flexDirection: "row", justifyContent: "center", gap: 6, marginBottom: 24 },
  dot: { height: 8, borderRadius: 4 },
  navButtons: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  skipBtn: { paddingVertical: 12, paddingHorizontal: 8 },
  skipText: { fontSize: 15, color: "rgba(255,255,255,0.5)", fontWeight: "500" },
  nextBtn: { borderRadius: 16, paddingVertical: 14, paddingHorizontal: 32 },
  nextBtnText: { fontSize: 16, fontWeight: "700", color: "#fff" },
  ctaButtons: { gap: 12 },
  primaryBtn: { borderRadius: 16, paddingVertical: 16, alignItems: "center" },
  primaryBtnText: { fontSize: 16, fontWeight: "700", color: "#fff" },
  secondaryBtn: { borderRadius: 16, paddingVertical: 15, alignItems: "center", borderWidth: 1.5, backgroundColor: "rgba(255,255,255,0.08)" },
  secondaryBtnText: { fontSize: 16, fontWeight: "600" },
  restoreText: { fontSize: 12, color: "rgba(255,255,255,0.35)", textAlign: "center", marginTop: 4 },
});
