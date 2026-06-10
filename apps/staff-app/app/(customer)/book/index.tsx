import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { router, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SERVICE_CATALOG, calcPricing } from "@/constants/catalog";

export default function BookServiceScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: "GreenVolt",
          headerStyle: { backgroundColor: "#fff" },
          headerTintColor: "#00450d",
          headerTitleStyle: { fontWeight: "700", color: "#111827" },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 4, padding: 4 }}>
              <Ionicons name="arrow-back" size={22} color="#00450d" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={styles.stepBadge}>
              <Text style={styles.stepText}>STEP 1 OF 4</Text>
              <Text style={styles.stepLabel}>Select Service</Text>
            </View>
          ),
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>

        {/* Page header */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Our Services</Text>
          <Text style={styles.pageSub}>Select a maintenance package to keep your system at peak performance.</Text>
        </View>

        {/* Service cards */}
        {SERVICE_CATALOG.map((item) => {
          const { total } = calcPricing(item);
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.card, item.popular && styles.cardPopular]}
              onPress={() => router.push({ pathname: "/(customer)/book/[id]", params: { id: item.id } })}
              activeOpacity={0.85}
            >
              {item.popular && (
                <View style={styles.popularBadge}>
                  <Ionicons name="star" size={9} color="#d97706" />
                  <Text style={styles.popularText}>POPULAR</Text>
                </View>
              )}

              <View style={styles.cardTop}>
                <View style={[styles.iconBox, { backgroundColor: item.bg }]}>
                  <Ionicons name={item.icon} size={26} color={item.color} />
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardCategory}>{item.category.toUpperCase()}</Text>
                  <Text style={styles.cardName}>{item.name}</Text>
                </View>
              </View>

              <Text style={styles.cardDesc}>{item.description}</Text>

              <View style={styles.cardChips}>
                {item.durationMins > 0 && (
                  <View style={styles.chip}>
                    <Ionicons name="time-outline" size={11} color="#6b7280" />
                    <Text style={styles.chipText}>
                      {item.durationMins >= 60 ? `${item.durationMins / 60}h` : `${item.durationMins}m`}
                    </Text>
                  </View>
                )}
                <View style={styles.chip}>
                  <Ionicons name="shield-checkmark-outline" size={11} color="#6b7280" />
                  <Text style={styles.chipText}>Certified Pro</Text>
                </View>
              </View>

              <View style={styles.cardBottom}>
                <View>
                  <Text style={styles.price}>₹{total.toLocaleString("en-IN")}</Text>
                  <Text style={styles.priceNote}>Total with GST</Text>
                </View>
                <TouchableOpacity
                  style={styles.bookNowBtn}
                  onPress={() => router.push({ pathname: "/(customer)/book/[id]", params: { id: item.id } })}
                  activeOpacity={0.85}
                >
                  <Text style={styles.bookNowText}>Book Now</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        })}

        <View style={styles.note}>
          <Ionicons name="information-circle-outline" size={14} color="#9ca3af" />
          <Text style={styles.noteText}>
            All prices include GST. Technician will be assigned after booking confirmation.
          </Text>
        </View>

      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafb" },
  content: { padding: 16, gap: 14, paddingBottom: 40 },

  stepBadge: { alignItems: "flex-end", marginRight: 4 },
  stepText: { fontSize: 10, fontWeight: "700", color: "#00450d", letterSpacing: 0.5 },
  stepLabel: { fontSize: 10, color: "#9ca3af" },

  pageHeader: { paddingBottom: 4 },
  pageTitle: { fontSize: 22, fontWeight: "800", color: "#111827" },
  pageSub: { fontSize: 13, color: "#9ca3af", marginTop: 4, lineHeight: 18 },

  card: {
    backgroundColor: "#fff", borderRadius: 16, padding: 18,
    borderWidth: 1, borderColor: "#f0f0f0", gap: 12, overflow: "hidden",
  },
  cardPopular: { borderColor: "#bbf7d0" },
  popularBadge: {
    position: "absolute", top: 14, right: 14,
    flexDirection: "row", alignItems: "center", gap: 3,
    backgroundColor: "#fef3c7", borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: "#fde68a",
  },
  popularText: { fontSize: 9, fontWeight: "800", color: "#d97706", letterSpacing: 0.3 },

  cardTop: { flexDirection: "row", alignItems: "center", gap: 14 },
  iconBox: { width: 52, height: 52, borderRadius: 14, justifyContent: "center", alignItems: "center", flexShrink: 0 },
  cardInfo: { flex: 1 },
  cardCategory: { fontSize: 9, fontWeight: "800", color: "#9ca3af", letterSpacing: 0.8 },
  cardName: { fontSize: 17, fontWeight: "800", color: "#111827", marginTop: 2 },
  cardDesc: { fontSize: 12, color: "#6b7280", lineHeight: 18 },

  cardChips: { flexDirection: "row", gap: 8 },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#f3f4f6", borderRadius: 20,
    paddingHorizontal: 9, paddingVertical: 4,
  },
  chipText: { fontSize: 11, color: "#6b7280", fontWeight: "500" },

  cardBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  price: { fontSize: 20, fontWeight: "800", color: "#111827" },
  priceNote: { fontSize: 10, color: "#9ca3af", marginTop: 1 },
  bookNowBtn: {
    backgroundColor: "#00450d", borderRadius: 10,
    paddingHorizontal: 20, paddingVertical: 11,
  },
  bookNowText: { fontSize: 14, fontWeight: "700", color: "#fff" },

  note: {
    flexDirection: "row", alignItems: "flex-start", gap: 6,
    backgroundColor: "#f3f4f6", borderRadius: 12, padding: 12,
  },
  noteText: { fontSize: 11, color: "#9ca3af", flex: 1, lineHeight: 16 },
});
