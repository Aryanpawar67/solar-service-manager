import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { router, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SERVICE_CATALOG, calcPricing } from "@/constants/catalog";
import { FadeInView } from "@/components/FadeInView";

export default function BookServiceScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: "Book a Service",
          headerStyle: { backgroundColor: "#16a34a" },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "700" },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 4, padding: 4 }}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>

        {/* Header banner */}
        <FadeInView delay={0}>
          <View style={styles.banner}>
            <View>
              <Text style={styles.bannerTitle}>What would you like us to do?</Text>
              <Text style={styles.bannerSub}>Select a service to get started</Text>
            </View>
            <Ionicons name="sunny" size={36} color="rgba(255,255,255,0.25)" />
          </View>
        </FadeInView>

        {/* Service cards */}
        {SERVICE_CATALOG.map((item, index) => {
          const { total } = calcPricing(item);
          return (
            <FadeInView key={item.id} delay={80 + index * 70}>
              <TouchableOpacity
                style={styles.card}
                onPress={() => router.push({ pathname: "/(customer)/book/[id]", params: { id: item.id } })}
                activeOpacity={0.85}
              >
                {/* Popular badge */}
                {item.popular && (
                  <View style={styles.popularBadge}>
                    <Ionicons name="flame" size={10} color="#f59e0b" />
                    <Text style={styles.popularText}>Popular</Text>
                  </View>
                )}

                <View style={styles.cardTop}>
                  {/* Icon */}
                  <View style={[styles.iconBox, { backgroundColor: item.bg }]}>
                    <Ionicons name={item.icon} size={26} color={item.color} />
                  </View>

                  {/* Info */}
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardCategory}>{item.category.toUpperCase()}</Text>
                    <Text style={styles.cardName}>{item.name}</Text>
                    <Text style={styles.cardTagline}>{item.tagline}</Text>
                  </View>

                  {/* Price + chevron */}
                  <View style={styles.cardRight}>
                    <Text style={styles.priceLabel}>From</Text>
                    <Text style={[styles.price, { color: item.color }]}>₹{item.basePrice}</Text>
                    <Ionicons name="chevron-forward" size={16} color="#d1d5db" style={{ marginTop: 4 }} />
                  </View>
                </View>

                {/* Footer row */}
                <View style={styles.cardFooter}>
                  {item.durationMins > 0 ? (
                    <View style={styles.footerChip}>
                      <Ionicons name="time-outline" size={11} color="#9ca3af" />
                      <Text style={styles.footerChipText}>{item.durationMins} min</Text>
                    </View>
                  ) : null}
                  <View style={styles.footerChip}>
                    <Ionicons name="receipt-outline" size={11} color="#9ca3af" />
                    <Text style={styles.footerChipText}>₹{total} incl. GST</Text>
                  </View>
                  <View style={[styles.bookNowBtn, { backgroundColor: item.color + "18", borderColor: item.color + "40" }]}>
                    <Text style={[styles.bookNowText, { color: item.color }]}>Book Now →</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </FadeInView>
          );
        })}

        <FadeInView delay={500}>
          <View style={styles.note}>
            <Ionicons name="information-circle-outline" size={14} color="#9ca3af" />
            <Text style={styles.noteText}>
              All prices include GST. Technician will be assigned after booking confirmation.
            </Text>
          </View>
        </FadeInView>

      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  content: { padding: 16, gap: 12, paddingBottom: 40 },

  banner: {
    backgroundColor: "#16a34a",
    borderRadius: 16,
    padding: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  bannerTitle: { fontSize: 16, fontWeight: "800", color: "#fff" },
  bannerSub: { fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 3 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
    gap: 12,
    overflow: "hidden",
  },
  popularBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#fef3c7",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "#fde68a",
  },
  popularText: { fontSize: 10, fontWeight: "700", color: "#d97706" },

  cardTop: { flexDirection: "row", alignItems: "flex-start", gap: 14 },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  cardInfo: { flex: 1, gap: 2 },
  cardCategory: { fontSize: 9, fontWeight: "800", color: "#9ca3af", letterSpacing: 1 },
  cardName: { fontSize: 15, fontWeight: "800", color: "#111827" },
  cardTagline: { fontSize: 12, color: "#6b7280", marginTop: 1 },
  cardRight: { alignItems: "flex-end", gap: 1 },
  priceLabel: { fontSize: 10, color: "#9ca3af" },
  price: { fontSize: 18, fontWeight: "800" },

  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#f9fafb",
  },
  footerChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#f3f4f6",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  footerChipText: { fontSize: 11, color: "#6b7280", fontWeight: "500" },
  bookNowBtn: {
    marginLeft: "auto",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
  },
  bookNowText: { fontSize: 12, fontWeight: "700" },

  note: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
  },
  noteText: { fontSize: 11, color: "#9ca3af", flex: 1, lineHeight: 16 },
});
