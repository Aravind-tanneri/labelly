import { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAppAuth } from "../context/AuthContext";
import { getEffectiveApiBaseUrl, setCustomApiBaseUrl } from "../services/api";

export function LoginScreen() {
  const { login, loading, error } = useAppAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const [demoLoading, setDemoLoading] = useState(false);
  const [serverUrl, setServerUrl] = useState<string>("");
  const [isEditingServer, setIsEditingServer] = useState(false);
  const [customServerInput, setCustomServerInput] = useState("");

  useEffect(() => {
    getEffectiveApiBaseUrl().then((url) => {
      setServerUrl(url);
      setCustomServerInput(url);
    });
  }, []);

  const handleSaveServer = async () => {
    if (!customServerInput.trim()) return;
    const updated = await setCustomApiBaseUrl(customServerInput);
    setServerUrl(updated);
    setIsEditingServer(false);
  };

  const shownError = localError ?? error;
  const isBusy = loading || demoLoading;

  const submit = async () => {
    setLocalError(null);
    if (!email.trim() || !password) {
      setLocalError("Enter your email and password.");
      return;
    }
    try {
      await login(email.trim(), password);
    } catch {
      // Error state is surfaced via useAppAuth / localError.
    }
  };

  const handleDemoSignIn = async () => {
    setLocalError(null);
    setDemoLoading(true);
    try {
      await login("inspector@doca.gov.in", "demo123");
    } catch {
      // Error state is surfaced via useAppAuth / localError.
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 32,
          paddingBottom: 40,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Brand */}
        <View className="items-center mb-7">
          <Image
            source={require("../assets/icon.png")}
            style={{ width: 80, height: 80, borderRadius: 18 }}
            resizeMode="contain"
          />
          <Text className="text-text text-2xl font-bold tracking-widest mt-2">
            LABELLY
          </Text>
          <Text className="text-secondaryText text-xs font-semibold tracking-widest mt-1">
            LEGAL METROLOGY ENFORCEMENT
          </Text>
        </View>

        {/* Error */}
        {shownError ? (
          <View className="flex-row items-center bg-red-950/40 border border-error rounded-lg p-3 mb-4">
            <Ionicons name="alert-circle" size={18} color="#E53935" />
            <Text className="text-error ml-2 flex-1 text-xs font-medium">
              {shownError}
            </Text>
          </View>
        ) : null}

        {/* Form Inputs */}
        <Text className="text-secondaryText text-xs font-bold tracking-wider mb-1.5">
          OFFICER EMAIL
        </Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="inspector@doca.gov.in"
          placeholderTextColor="#8A8A8A"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          editable={!isBusy}
          className="h-12 bg-surface border border-border rounded-lg px-3.5 text-text text-base mb-4"
        />

        <Text className="text-secondaryText text-xs font-bold tracking-wider mb-1.5">
          PASSWORD
        </Text>
        <View className="h-12 bg-surface border border-border rounded-lg flex-row items-center px-3.5 mb-5">
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor="#8A8A8A"
            secureTextEntry={!showPassword}
            editable={!isBusy}
            className="flex-1 text-text text-base h-full p-0"
          />
          <Pressable
            onPress={() => setShowPassword((prev) => !prev)}
            hitSlop={8}
            className="p-1"
            accessibilityLabel={showPassword ? "Hide password" : "Show password"}
          >
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={20}
              color="#8A8A8A"
            />
          </Pressable>
        </View>

        {/* Big Visible Submit Button */}
        <Pressable
          onPress={submit}
          disabled={isBusy}
          className={`h-13 bg-primary rounded-lg flex-row items-center justify-center mb-3 py-3.5 ${
            isBusy ? "opacity-70" : "active:opacity-85"
          }`}
        >
          {loading && !demoLoading ? (
            <ActivityIndicator color="#111B21" />
          ) : (
            <>
              <Ionicons
                name="log-in-outline"
                size={20}
                color="#111B21"
                className="mr-2"
              />
              <Text className="text-background text-base font-bold tracking-wide">
                Sign In
              </Text>
            </>
          )}
        </Pressable>

        {/* Demo Sign In Button */}
        <Pressable
          onPress={handleDemoSignIn}
          disabled={isBusy}
          className={`h-12 rounded-lg border border-primary bg-emerald-950/20 flex-row items-center justify-center mb-4 ${
            isBusy ? "opacity-70" : "active:opacity-75"
          }`}
        >
          {demoLoading ? (
            <ActivityIndicator color="#25D366" />
          ) : (
            <>
              <Ionicons
                name="flash-outline"
                size={18}
                color="#25D366"
                className="mr-2"
              />
              <Text className="text-primary text-sm font-bold">
                Demo Sign in
              </Text>
            </>
          )}
        </Pressable>

        {/* Server Target Indicator & In-App Switcher */}
        <View className="mb-6 bg-surface border border-border rounded-lg p-3">
          {!isEditingServer ? (
            <View className="flex-row items-center justify-between">
              <View className="flex-1 mr-2">
                <Text className="text-secondaryText text-[10px] font-bold tracking-wider uppercase">
                  Target Server API
                </Text>
                <Text className="text-text text-xs font-mono mt-0.5" numberOfLines={1}>
                  {serverUrl || "Checking..."}
                </Text>
              </View>
              <Pressable
                onPress={() => setIsEditingServer(true)}
                hitSlop={8}
                className="bg-primary/20 px-2.5 py-1 rounded border border-primary/30 active:opacity-70"
              >
                <Text className="text-primary text-xs font-bold">Change</Text>
              </Pressable>
            </View>
          ) : (
            <View>
              <Text className="text-secondaryText text-[10px] font-bold tracking-wider uppercase mb-1">
                Enter EC2 Host / IP (e.g. 13.233.45.67:5000)
              </Text>
              <TextInput
                value={customServerInput}
                onChangeText={setCustomServerInput}
                placeholder="http://<EC2-IP>:5000"
                placeholderTextColor="#8A8A8A"
                autoCapitalize="none"
                autoCorrect={false}
                className="h-10 bg-background border border-border rounded px-3 text-text text-xs mb-2.5 font-mono"
              />
              <View className="flex-row gap-2 justify-end">
                <Pressable
                  onPress={() => setIsEditingServer(false)}
                  className="px-3 py-1.5 rounded bg-background border border-border active:opacity-70"
                >
                  <Text className="text-secondaryText text-xs font-semibold">Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleSaveServer}
                  className="px-4 py-1.5 rounded bg-primary active:opacity-70"
                >
                  <Text className="text-background text-xs font-bold">Save</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>

        {/* Department Footer */}
        <Text className="text-center text-secondaryText text-xs tracking-wide">
          Department of Consumer Affairs • Government of India
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}