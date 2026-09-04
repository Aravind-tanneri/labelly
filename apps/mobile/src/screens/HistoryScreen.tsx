import { useCallback, useEffect, useState } from "react";
import { Alert, FlatList, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { deleteInspection, listMyInspections } from "../hooks/useInspection";
import { MobileCard } from "../components/MobileCard";
import { MobileHeader } from "../components/MobileHeader";
import { ScreenContainer } from "../components/ScreenContainer";
import { StatusBadge } from "../components/StatusBadge";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { TabsParamList, RootStackParamList } from "../navigationTypes";
import type { InspectionListItem } from "@labelly/shared";

type Props = BottomTabScreenProps<TabsParamList, "History">;

export function HistoryScreen({ navigation }: Props) {
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

  const handleDelete = (item: InspectionListItem) => {
    Alert.alert(
      "Delete Inspection",
      `Are you sure you want to delete inspection ${item.inspectionId}? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteInspection(item._id);
              setItems((prev) => prev.filter((i) => i._id !== item._id));
            } catch {
              Alert.alert("Error", "Failed to delete inspection.");
            }
          },
        },
      ]
    );
  };

  return (
    <ScreenContainer>
      <MobileHeader title="Inspection History" subtitle={`${items.length} total inspections`} />
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
                ?.navigate("ComplianceResult", {
                  inspectionId: item._id,
                  readOnly: true,
                })
            }
          >
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-text text-base font-semibold flex-1 pr-2" numberOfLines={1}>
                {item.product.name || "Unknown Product"}
              </Text>
              <View className="flex-row items-center">
                {item.status === "APPROVED" && (
                  <View className="bg-emerald-950/60 border border-success px-2 py-0.5 rounded-md mr-1.5 flex-row items-center">
                    <Ionicons name="checkmark-circle" size={11} color="#25D366" />
                    <Text className="text-success text-[10px] font-bold ml-1">APPROVED</Text>
                  </View>
                )}
                {item.status === "ACTION_REQUIRED" && (
                  <View className="bg-red-950/60 border border-error px-2 py-0.5 rounded-md mr-1.5 flex-row items-center">
                    <Ionicons name="alert-circle" size={11} color="#E53935" />
                    <Text className="text-error text-[10px] font-bold ml-1">NOTICE</Text>
                  </View>
                )}
                {item.status === "REINSPECTION_REQUESTED" && (
                  <View className="bg-amber-950/60 border border-warning px-2 py-0.5 rounded-md mr-1.5 flex-row items-center">
                    <Ionicons name="help-circle" size={11} color="#FFA500" />
                    <Text className="text-warning text-[10px] font-bold ml-1">RE-INSPECT</Text>
                  </View>
                )}
                <StatusBadge status={item.complianceStatus} />
                <Pressable
                  onPress={() => handleDelete(item)}
                  hitSlop={10}
                  className="ml-2.5 p-1 rounded bg-white/5 active:bg-red-500/20"
                >
                  <Ionicons name="trash-outline" size={17} color="#E53935" />
                </Pressable>
              </View>
            </View>
            <View className="flex-row items-center gap-3 mt-1">
              <View className="flex-row items-center">
                <Ionicons name="finger-print-outline" size={13} color="#8A8A8A" />
                <Text className="text-secondaryText text-xs ml-1.5">
                  ID: {item.inspectionId}
                </Text>
              </View>
            </View>
            <View className="h-px bg-white/5 my-3" />
            <View className="flex-row items-center">
              <Ionicons name="calendar-outline" size={13} color="#8A8A8A" />
              <Text className="text-secondaryText text-xs ml-1.5">
                {new Date(item.createdAt).toLocaleString()}
              </Text>
            </View>
          </MobileCard>
        )}
      />
    </ScreenContainer>
  );
}
