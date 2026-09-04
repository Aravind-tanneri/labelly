import { useState, useEffect } from "react";
import { View, Text, ScrollView, ActivityIndicator, Image, TextInput, Pressable, Alert } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { getInspection, updateInspectionData } from "../hooks/useInspection";
import { API_BASE_URL } from "../services/api";
import { ScreenContainer } from "../components/ScreenContainer";
import { MobileHeader } from "../components/MobileHeader";
import { MobileCard } from "../components/MobileCard";
import type { RootStackParamList } from "../navigationTypes";
import type { Inspection } from "@labelly/shared";

type Props = NativeStackScreenProps<RootStackParamList, "ViolationDetails">;

export function ViolationDetailsScreen({ route, navigation }: Props) {
  const { inspectionId, field } = route.params;

  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    getInspection(inspectionId).then((data) => {
      if (active) {
        setInspection(data);
        setRemarks(data.remarks || "");
      }
    });
    return () => {
      active = false;
    };
  }, [inspectionId]);

  const handleSaveNotes = async () => {
    if (!inspection) return;
    setSaving(true);
    try {
      await updateInspectionData(inspectionId, {
        extractedData: inspection.extractedData,
        remarks: remarks.trim(),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      Alert.alert("Error", "Failed to save inspector note.");
    } finally {
      setSaving(false);
    }
  };

  if (!inspection) {
    return (
      <ScreenContainer>
        <MobileHeader title="Violation Details" onBack={() => navigation.goBack()} />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#25D366" />
        </View>
      </ScreenContainer>
    );
  }

  const violation = inspection.compliance?.violations.find((v) => v.field === field);
  const rawImage = inspection.images[inspection.images.length - 1]?.originalUrl;
  const lastImage = rawImage
    ? rawImage.startsWith("http://localhost:5000") || rawImage.startsWith("http://127.0.0.1:5000")
      ? rawImage.replace(/http:\/\/(localhost|127\.0\.0\.1):5000/, API_BASE_URL.replace(/\/$/, ""))
      : rawImage.startsWith("http")
      ? rawImage
      : `${API_BASE_URL.replace(/\/$/, "")}/${rawImage.replace(/^\//, "")}`
    : null;

  return (
    <ScreenContainer>
      <MobileHeader title="Violation Details" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>
        <MobileCard>
          <Text className="text-error font-bold mb-2">
            SEVERITY: {violation?.severity || "HIGH"}
          </Text>
          <Text className="text-text text-xl font-bold mb-4">
            {violation?.field || field}
          </Text>
          
          <Text className="text-secondaryText text-xs mb-1">
            Why it was flagged:
          </Text>
          <Text className="text-text text-base mb-6">
            {violation?.message || "Required declaration could not be verified."}
          </Text>
          
          {violation?.expectedValue && (
            <>
              <Text className="text-secondaryText text-xs mb-1">
                Expected by Rule:
              </Text>
              <Text className="text-text text-base mb-6">
                {violation.expectedValue}
              </Text>
            </>
          )}

          <Text className="text-secondaryText text-xs mb-1">
            Statutory Rule:
          </Text>
          <Text className="text-text text-base mb-2 font-bold">
            {violation?.ruleId || "LM-PC-UNKNOWN"}
          </Text>
        </MobileCard>

        {/* Officer Observation & Field Review Note */}
        <View className="mt-4">
          <MobileCard>
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-text font-bold text-sm">
                Inspector Observation / Override Note
              </Text>
              {saved && (
                <Text className="text-success text-xs font-semibold">✓ Saved</Text>
              )}
            </View>
            <TextInput
              className="bg-surface border border-border rounded-xl text-text p-3 text-sm min-h-[70px]"
              multiline
              textAlignVertical="top"
              placeholder="Add observation for this violation (e.g., trader explanation, blurred label note)..."
              placeholderTextColor="#8A8A8A"
              value={remarks}
              onChangeText={setRemarks}
            />
            <Pressable
              onPress={handleSaveNotes}
              disabled={saving}
              className="bg-elevatedSurface border border-border rounded-lg py-2.5 items-center mt-3 active:opacity-80"
            >
              {saving ? (
                <ActivityIndicator size="small" color="#25D366" />
              ) : (
                <Text className="text-primary font-semibold text-xs">
                  Save Observation
                </Text>
              )}
            </Pressable>
          </MobileCard>
        </View>
        
        {lastImage && (
          <View className="mt-4">
            <Text className="text-secondaryText text-base font-bold mb-3">
              Evidence Image
            </Text>
            <Image
              source={{ uri: lastImage }}
              className="w-full h-72 rounded-xl bg-surface border border-border"
              resizeMode="contain"
            />
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

