import { useState, useEffect } from "react";
import { View, Text, TextInput, ScrollView, Pressable, ActivityIndicator, Image, Alert } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { getInspection, updateInspectionData } from "../hooks/useInspection";
import { API_BASE_URL } from "../services/api";

import { ScreenContainer } from "../components/ScreenContainer";
import { MobileHeader } from "../components/MobileHeader";
import { MobileCard } from "../components/MobileCard";
import type { RootStackParamList } from "../navigationTypes";
import type { Inspection } from "@labelly/shared";

type Props = NativeStackScreenProps<RootStackParamList, "ExtractionReview">;

export function ExtractionReviewScreen({ route, navigation }: Props) {
  const { inspectionId } = route.params;

  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [productName, setProductName] = useState("");
  const [brandName, setBrandName] = useState("");
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    let active = true;
    getInspection(inspectionId).then((data) => {
      if (active) {
        setInspection(data);
        setProductName(data.product?.name || "");
        setBrandName(data.product?.brand || "");
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [inspectionId]);

  const handleContinue = async () => {
    if (!inspection) return;
    setSubmitting(true);
    
    try {
      const mergedData = { ...inspection.extractedData };
      for (const [key, val] of Object.entries(edits)) {
        (mergedData as any)[key] = val;
      }

      await updateInspectionData(inspectionId, {
        extractedData: mergedData,
        product: {
          name: productName.trim() || inspection.product?.name || "Packaged Commodity",
          brand: brandName.trim() || inspection.product?.brand || "Unknown",
          category: inspection.product?.category || "General",
        },
      });

      navigation.replace("ComplianceResult", { inspectionId });
    } catch (err: any) {
      console.error("[ExtractionReview] handleContinue error:", err);
      Alert.alert(
        "Submission Failed",
        err?.message || "Could not save extraction data. Please check your connection and try again."
      );
      setSubmitting(false);
    }
  };


  if (loading || !inspection) {
    return (
      <ScreenContainer>
        <MobileHeader title="Review Extraction" onBack={() => navigation.goBack()} />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#25D366" />
        </View>
      </ScreenContainer>
    );
  }

  const decls = inspection.extractedData;
  const confMap = inspection.extractionConfidence;

  const resolveImageUrl = (rawUrl?: string): string | null => {
    if (!rawUrl) return null;
    if (rawUrl.startsWith("http://localhost:5000") || rawUrl.startsWith("http://127.0.0.1:5000")) {
      return rawUrl.replace(/http:\/\/(localhost|127\.0\.0\.1):5000/, API_BASE_URL.replace(/\/$/, ""));
    }
    if (rawUrl.startsWith("http")) return rawUrl;
    return `${API_BASE_URL.replace(/\/$/, "")}/${rawUrl.replace(/^\//, "")}`;
  };

  const images = (inspection.images || [])
    .map((img) => resolveImageUrl(img.originalUrl || img.thumbnailUrl))
    .filter(Boolean) as string[];

  const getDeclValue = (key: string): string => {
    if (!decls) return "";
    if (typeof (decls as any).get === "function") return (decls as any).get(key) ?? "";
    return ((decls as Record<string, any>)[key] as string) ?? "";
  };

  const getConfidence = (key: string): number => {
    if (!confMap) return 0;
    if (typeof (confMap as any).get === "function") return (confMap as any).get(key) ?? 0;
    return ((confMap as Record<string, any>)[key] as number) ?? 0;
  };

  const renderField = (key: string, label: string) => {
    const origVal = getDeclValue(key);
    const val = edits[key] !== undefined ? edits[key] : (origVal || "");
    const conf = getConfidence(key);
    const hasValue = !!val.trim();
    
    let confTextColor = "text-success";
    if (conf < 75) confTextColor = "text-warning";
    if (conf < 50) confTextColor = "text-error";

    return (
      <View key={key} className="mb-4">
        <View className="flex-row justify-between items-center mb-1">
          <Text className="text-secondaryText text-xs font-semibold">{label}</Text>
          {hasValue ? (
            <Text className={`${confTextColor} text-xs font-semibold`}>{conf > 0 ? `${conf}% Conf` : "Declared"}</Text>
          ) : (
            <Text className="text-error text-xs font-semibold">Not Found</Text>
          )}
        </View>
        <TextInput
          className="bg-surface border border-border rounded-lg text-text px-3 py-2 text-base"
          value={val}
          onChangeText={(t) => setEdits((prev) => ({ ...prev, [key]: t }))}
          placeholder="Not declared"
          placeholderTextColor="#8A8A8A"
        />
      </View>
    );
  };


  return (
    <ScreenContainer>
      <MobileHeader title="Review Extraction" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {images.length > 0 && (
          <View className="mb-4">
            <Image
              source={{ uri: images[selectedImageIndex] || images[0] }}
              className="w-full h-56 rounded-xl bg-surface"
              resizeMode="contain"
            />
            {images.length > 1 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="flex-row mt-2"
              >
                {images.map((uri, i) => (
                  <Pressable
                    key={i}
                    onPress={() => setSelectedImageIndex(i)}
                    className={`w-14 h-14 rounded-lg mr-2 overflow-hidden border-2 ${
                      selectedImageIndex === i ? "border-primary" : "border-border"
                    }`}
                  >
                    <Image
                      source={{ uri }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                    <View className="absolute bottom-0 left-0 right-0 bg-black/60 py-0.5 items-center">
                      <Text className="text-white text-[9px] font-bold">#{i + 1}</Text>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </View>
        )}
        {/* Product Identity Card */}
        <View className="mb-4">
          <MobileCard>
            <Text className="text-text text-base font-bold mb-1">
              Product Identity
            </Text>
            <Text className="text-secondaryText text-xs mb-3">
              Commodity description and brand name.
            </Text>
            
            <View className="mb-3">
              <Text className="text-secondaryText text-xs font-semibold mb-1">
                Product Name
              </Text>
              <TextInput
                className="bg-surface border border-border rounded-lg text-text px-3 py-2 text-base"
                value={productName}
                onChangeText={setProductName}
                placeholder="e.g. Atta 5kg, Sunflower Oil 1L"
                placeholderTextColor="#8A8A8A"
              />
            </View>

            <View>
              <Text className="text-secondaryText text-xs font-semibold mb-1">
                Brand / Trade Name
              </Text>
              <TextInput
                className="bg-surface border border-border rounded-lg text-text px-3 py-2 text-base"
                value={brandName}
                onChangeText={setBrandName}
                placeholder="e.g. NatureFresh, Britannia"
                placeholderTextColor="#8A8A8A"
              />
            </View>
          </MobileCard>
        </View>

        {/* Declarations Checklist Card */}
        <MobileCard>
          <Text className="text-text text-lg font-bold mb-1">
            Review Extracted Declarations
          </Text>
          <Text className="text-secondaryText text-xs mb-4">
            Please correct any incorrect values. Corrections will automatically re-evaluate compliance rules.
          </Text>

          {renderField("manufacturer", "Manufacturer")}
          {renderField("packer", "Packer")}
          {renderField("importer", "Importer")}
          {renderField("netQuantity", "Net Quantity")}
          {renderField("mrp", "MRP")}
          {renderField("manufacturingDate", "Manufacturing Date")}
          {renderField("consumerCare", "Consumer Care")}
          {renderField("batchNumber", "Batch Number")}
        </MobileCard>

        
        <Pressable
          className={`bg-primary p-4 rounded-xl items-center mt-4 ${
            submitting ? "opacity-70" : "active:opacity-85"
          }`}
          onPress={handleContinue}
          disabled={submitting}
        >
          {submitting ? (
             <ActivityIndicator color="#111B21" />
          ) : (
            <Text className="text-background font-bold text-base">Continue to Compliance</Text>
          )}
        </Pressable>
        <View className="h-10" />
      </ScrollView>
    </ScreenContainer>
  );
}
