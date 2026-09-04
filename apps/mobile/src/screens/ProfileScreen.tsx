import { View, Text, Pressable } from "react-native";
import { useAppAuth } from "../context/AuthContext";
import { ScreenContainer } from "../components/ScreenContainer";
import { MobileHeader } from "../components/MobileHeader";

export function ProfileScreen() {
  const { user, logout } = useAppAuth();

  return (
    <ScreenContainer>
      <MobileHeader title="Profile" />
      <View className="p-6 items-center">
        <View className="w-20 h-20 rounded-full bg-primary justify-center items-center mb-4">
          <Text className="text-3xl text-background font-bold">
            {user?.name?.[0]?.toUpperCase() || "U"}
          </Text>
        </View>
        <Text className="text-2xl text-text font-bold mb-1">
          {user?.name || "User"}
        </Text>
        <Text className="text-sm text-secondaryText mb-6">
          {user?.email}
        </Text>
        
        <View className="w-full bg-surface rounded-xl p-4 border border-border">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-secondaryText text-sm">Role</Text>
            <Text className="text-text font-semibold text-sm">{user?.role}</Text>
          </View>
        </View>

        <Pressable
          className="mt-6 bg-error py-3.5 px-6 rounded-xl w-full items-center active:opacity-80"
          onPress={logout}
        >
          <Text className="text-white font-bold text-base">Log Out</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}
