import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { relativeTime, type InspectionListItem } from "@labelly/shared";
import { useAppAuth } from "../context/AuthContext";
import { deleteInspection, listMyInspections } from "../hooks/useInspection";
import { ScreenContainer } from "../components/ScreenContainer";
import { MobileHeader } from "../components/MobileHeader";
import { MobileCard } from "../components/MobileCard";
import { StatusBadge } from "../components/StatusBadge";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { TabsParamList, RootStackParamList } from "../navigationTypes";

type Props = BottomTabScreenProps<TabsParamList, "Home">;

interface DailyStats {
  total: number;
  compliant: number;
  nonCompliant: number;
  review: number;
}

function useGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function DashboardScreen({ navigation }: Props) {
  const { user } = useAppAuth();
  const [items, setItems] = useState<InspectionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await listMyInspections());
    } catch (err) {
      setError(typeof err === "string" ? err : "Failed to load inspections.");
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
      `Are you sure you want to delete inspection ${item.inspectionId}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteInspection(item._id);
              await load();
            } catch (e) {
              Alert.alert("Error", "Could not delete inspection.");
            }
          },
        },
      ]
    );
  };

  const stats = useMemo<DailyStats>(() => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const todayList = items.filter(
      (item) => new Date(item.createdAt).getTime() >= startOfDay.getTime()
    );
    const compliant = todayList.filter(
      (i) => i.complianceStatus === "COMPLIANT"
    ).length;
    const nonCompliant = todayList.filter(
      (i) => i.complianceStatus === "NON_COMPLIANT"
    ).length;
    const review = todayList.filter(
      (i) => i.complianceStatus === "REVIEW_REQUIRED"
    ).length;
    return {
      total: todayList.length,
      compliant,
      nonCompliant,
      review,
    };
  }, [items]);

  // Extract second name if available (e.g. "Field Inspector" -> "Inspector", "John Doe" -> "Doe")
  const nameParts = user?.name?.trim().split(/\s+/) ?? [];
  const secondName = nameParts.length > 1 ? nameParts[1] : (nameParts[0] || "Inspector");
  const greeting = useGreeting();

  const statCells = [
    {
      key: "compliant",
      label: "Compliant",
      value: stats.compliant,
      textColor: "text-success",
    },
    {
      key: "violations",
      label: "Violations",
      value: stats.nonCompliant,
      textColor: "text-error",
    },
    {
      key: "pending",
      label: "Pending",
      value: stats.review,
      textColor: "text-warning",
    },
  ];

  return (
    <ScreenContainer>
      <MobileHeader title="Dashboard" subtitle={`${greeting}, ${secondName}`} />

      <FlatList
        data={items.slice(0, 5)}
        keyExtractor={(item) => item._id}
        refreshing={loading}
        onRefresh={() => void load()}
        contentContainerStyle={{ padding: 16, paddingBottom: 96 }}
        ListHeaderComponent={
          <View>
            <Text className="text-text text-xl font-bold mb-4">
              {greeting}, {secondName}
            </Text>

            <Pressable
              onPress={() => navigation.navigate("Scan", undefined)}
              className="flex-row items-center justify-center py-5 bg-primary rounded-2xl mb-4 active:opacity-85"
            >
              <Ionicons name="camera" size={26} color="#111B21" />
              <Text className="text-background text-lg font-bold ml-2.5">
                SCAN PRODUCT
              </Text>
            </Pressable>

            <Pressable
              onPress={() => navigation.navigate("Scan", { fromLibrary: true })}
              className="flex-row items-center justify-center py-3.5 bg-elevatedSurface border border-border rounded-lg mb-6 active:opacity-85"
            >
              <Ionicons name="images-outline" size={20} color="#ECECEC" />
              <Text className="text-text text-sm font-medium ml-2">
                Upload Image
              </Text>
            </Pressable>

            <View className="border border-border bg-surface rounded-2xl p-4 mb-6">
              <View className="flex-row justify-between items-center">
                <Text className="text-secondaryText text-xs font-semibold">
                  TODAY'S INSPECTIONS
                </Text>
                <Text className="text-text text-lg font-bold">
                  {stats.total}
                </Text>
              </View>
              <View className="flex-row mt-4">
                {statCells.map((cell) => (
                  <View key={cell.key} className="flex-1 items-center">
                    <Text className={`${cell.textColor} text-2xl font-bold`}>
                      {cell.value}
                    </Text>
                    <Text className="text-secondaryText text-xs mt-1">
                      {cell.label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            <Text className="text-secondaryText text-xs font-semibold mb-2 tracking-wider">
              RECENT INSPECTIONS
            </Text>

            {error ? (
              <Text className="text-error mb-4 text-xs font-medium">
                {error}
              </Text>
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <MobileCard
            title={item.product?.name || item.inspectionId}
            subtitle={relativeTime(item.createdAt)}
            right={
              <View className="flex-row items-center">
                <StatusBadge status={item.complianceStatus} />
                <Pressable
                  onPress={() => handleDelete(item)}
                  hitSlop={10}
                  className="ml-2.5 p-1 rounded bg-white/5 active:bg-red-500/20"
                >
                  <Ionicons name="trash-outline" size={17} color="#E53935" />
                </Pressable>
              </View>
            }
            onPress={() =>
              navigation
                .getParent<NativeStackNavigationProp<RootStackParamList>>()
                ?.navigate("ComplianceResult", {
                  inspectionId: item._id,
                  readOnly: true,
                })
            }
          />
        )}
        ListEmptyComponent={
          loading ? (
            <View className="py-6 items-center">
              <ActivityIndicator color="#25D366" />
            </View>
          ) : (
            <MobileCard
              title="No inspections yet"
              subtitle="Tap SCAN PRODUCT to start your first compliance check."
            />
          )
        }
      />
    </ScreenContainer>
  );
}