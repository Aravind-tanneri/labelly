import { useCallback, useEffect, useState } from "react";
import { FlatList, View, Text, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { listMyInspections } from "../hooks/useInspection";
import { MobileCard } from "../components/MobileCard";
import { MobileHeader } from "../components/MobileHeader";
import { ScreenContainer } from "../components/ScreenContainer";
import { StatusBadge } from "../components/StatusBadge";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { TabsParamList, RootStackParamList } from "../navigationTypes";
import type { InspectionListItem } from "@labelly/shared";

type Props = BottomTabScreenProps<TabsParamList, "Reports">;

export function ReportsScreen({ navigation }: Props) {
  const [items, setItems] = useState<InspectionListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await listMyInspections());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <ScreenContainer>
      <MobileHeader title="Inspection Reports" subtitle={`${items.length} records available`} />
      <FlatList
        data={items}
        keyExtractor={(item) => item._id}
        refreshing={loading}
        onRefresh={() => void load()}
        contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
        renderItem={({ item }) => (
          <MobileCard
            onPress={() =>
              navigation
                .getParent<NativeStackNavigationProp<RootStackParamList>>()
                ?.navigate("ReportView", { inspectionId: item._id })
            }
          >
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-text text-base font-semibold flex-1 pr-2" numberOfLines={1}>
                {item.product.name || "Packaged Commodity"}
              </Text>
              <StatusBadge status={item.complianceStatus} />
            </View>

            <View className="flex-row items-center gap-3">
              <View className="flex-row items-center">
                <Ionicons name="finger-print-outline" size={13} color="#8A8A8A" />
                <Text className="text-secondaryText text-xs ml-1.5">
                  ID: {item.inspectionId}
                </Text>
              </View>
            </View>

            <View className="h-px bg-white/5 my-3" />

            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Ionicons name="calendar-outline" size={13} color="#8A8A8A" />
                <Text className="text-secondaryText text-xs ml-1.5">
                  {new Date(item.createdAt).toLocaleDateString()}
                </Text>
              </View>

              <View className="bg-primary/20 border border-primary/40 px-3 py-1.5 rounded-lg flex-row items-center">
                <Ionicons name="document-text" size={14} color="#25D366" />
                <Text className="text-primary text-xs font-bold ml-1.5">
                  Get PDF
                </Text>
              </View>
            </View>
          </MobileCard>
        )}
        ListEmptyComponent={
          loading ? (
            <View className="py-8 items-center">
              <ActivityIndicator color="#25D366" />
            </View>
          ) : (
            <View className="py-12 items-center px-6">
              <Ionicons name="document-text-outline" size={48} color="#8A8A8A" />
              <Text className="text-text font-bold text-base mt-4 text-center">
                No Inspection Reports Yet
              </Text>
              <Text className="text-secondaryText text-xs mt-1 text-center">
                Complete a product scan or manual checklist to generate certified PDF reports.
              </Text>
            </View>
          )
        }
      />
    </ScreenContainer>
  );
}
