import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { CameraView } from "expo-camera";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { formatDraftId, type DraftInspection } from "@labelly/shared";
import { useCamera } from "../hooks/useCamera";
import { useOffline } from "../hooks/useOffline";
import {
  analyzeInspection,
  createInspection,
  uploadInspectionImages,
} from "../hooks/useInspection";
import { addDraft } from "../services/storage";
import { pickImagesFromLibrary } from "../services/camera";
import { ScreenContainer } from "../components/ScreenContainer";
import { navigateRoot } from "../navigationRef";
import { logger } from "../services/logger";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList, TabsParamList } from "../navigationTypes";

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabsParamList, "Scan">,
  NativeStackScreenProps<RootStackParamList>
>;

const STEPS = [
  { key: "received", label: "Image received" },
  { key: "identified", label: "Product identified" },
  { key: "extracted", label: "Declarations extracted" },
  { key: "compliance", label: "Checking compliance" },
  { key: "report", label: "Preparing report" },
] as const;

type Phase = "camera" | "processing" | "offline-saved" | "error";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function ScannerScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 16);
  const { cameraRef, hasPermission, requestAccess, capture, resume } = useCamera();
  const { isOnline } = useOffline();

  const [phase, setPhase] = useState<Phase>("camera");
  const [activeStep, setActiveStep] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [savedDraftId, setSavedDraftId] = useState<string | null>(null);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);

  const handleManualChecklist = useCallback(async () => {
    logger.info("SCANNER", "Manual checklist initiated");
    try {
      setPhase("processing");
      setActiveStep("received");
      const inspectionId = await createInspection();
      setPhase("camera");
      logger.success("SCANNER", `Manual inspection created: ${inspectionId}`);
      navigateRoot("ExtractionReview", { inspectionId });
    } catch (err) {
      logger.error("SCANNER", "Failed to create manual inspection", err);
      setPhase("error");
      setError(typeof err === "string" ? err : "Failed to create manual inspection.");
    }
  }, []);

  const runPipeline = useCallback(
    async (uris: string[]) => {
      if (uris.length === 0) {
        logger.warn("SCANNER", "runPipeline called with 0 URIs");
        return;
      }
      const totalTimer = logger.time();
      logger.info("SCANNER", `=== PIPELINE STARTED === Processing ${uris.length} photo(s)...`);
      setPhase("processing");
      setError(null);
      setCompletedSteps([]);
      setActiveStep("received");

      if (!isOnline) {
        logger.info("OFFLINE", "Device is offline. Saving draft to local storage...");
        const draft: DraftInspection = {
          inspectionId: formatDraftId(),
          images: uris.map((uri) => ({
            originalUrl: uri,
            thumbnailUrl: uri,
            uploadedAt: new Date().toISOString(),
          })),
          status: "DRAFT",
          syncStatus: "PENDING",
          createdAt: new Date().toISOString(),
        };
        await addDraft(draft);
        setSavedDraftId(draft.inspectionId);
        setCapturedImages([]);
        setPhase("offline-saved");
        logger.success("OFFLINE", `Draft saved successfully: ${draft.inspectionId}`);
        return;
      }

      try {
        const t1 = logger.time();
        logger.info("SCANNER", "[Step 1/3] POST /api/inspections — Creating inspection record...");
        const inspectionId = await createInspection();
        logger.success("SCANNER", `[Step 1/3] Inspection record created (${t1()}): ${inspectionId}`);
        setCompletedSteps((prev) => [...prev, "received"]);
        setActiveStep("identified");

        const t2 = logger.time();
        logger.info("SCANNER", `[Step 2/3] POST /api/inspections/${inspectionId}/images — Uploading ${uris.length} file(s)...`);
        await uploadInspectionImages(inspectionId, uris);
        logger.success("SCANNER", `[Step 2/3] Images uploaded successfully (${t2()})`);
        setCompletedSteps((prev) => [...prev, "identified"]);
        setActiveStep("extracted");

        const t3 = logger.time();
        logger.info("SCANNER", `[Step 3/3] POST /api/inspections/${inspectionId}/analyze — Triggering Gemini Vision extraction...`);
        const result = await analyzeInspection(inspectionId);
        logger.success("SCANNER", `[Step 3/3] Gemini Vision analysis complete (${t3()})`, {
          inspectionId,
          product: result?.extraction?.product?.name || "Unknown",
        });
        setCompletedSteps((prev) => [...prev, "extracted"]);
        setActiveStep("compliance");
        await delay(350);
        setCompletedSteps((prev) => [...prev, "compliance"]);
        setActiveStep("report");
        await delay(350);
        setCompletedSteps((prev) => [...prev, "report"]);

        setCapturedImages([]);
        setPhase("camera");
        logger.success("SCANNER", `=== PIPELINE COMPLETE in ${totalTimer()} === Navigating to ExtractionReview...`);
        navigateRoot("ExtractionReview", { inspectionId });
      } catch (err: any) {
        logger.error("SCANNER", `=== PIPELINE FAILED after ${totalTimer()} ===`, err);
        setPhase("error");
        const message =
          err?.response?.data?.message ||
          err?.message ||
          (typeof err === "string" ? err : "Failed to analyze the label. Please try again.");
        setError(message);
      }
    },
    [isOnline]
  );

  const handleCapture = useCallback(async () => {
    logger.info("SCANNER", "Camera shutter clicked. Capturing frame...");
    const timer = logger.time();
    try {
      const uri = await capture();
      if (uri) {
        logger.success("SCANNER", `Photo captured in ${timer()}: ${uri}`);
        setCapturedImages((prev) => [...prev, uri]);
        logger.info("SCANNER", "Photo added to tray. Ready for additional angles or tap Analyze.");
      } else {
        logger.warn("SCANNER", `Camera capture returned empty/null (${timer()})`);
      }
    } catch (err) {
      logger.error("SCANNER", "Camera capture exception", err);
    }
  }, [capture]);

  const handlePickFromLibrary = useCallback(async () => {
    logger.info("SCANNER", "Gallery picker requested...");
    const timer = logger.time();
    try {
      const uris = await pickImagesFromLibrary();
      if (uris.length > 0) {
        logger.success("SCANNER", `Gallery returned ${uris.length} image(s) in ${timer()}`, uris);
        setCapturedImages((prev) => [...prev, ...uris]);
        logger.info("SCANNER", `Added ${uris.length} image(s) to tray. Ready for analysis.`);
      } else {
        logger.info("SCANNER", `Gallery picker dismissed with 0 images selected (${timer()})`);
      }
    } catch (err) {
      logger.error("SCANNER", "Gallery picker error", err);
    }
  }, []);

  const handleRemoveImage = useCallback((index: number) => {
    logger.info("SCANNER", `Removed photo at index ${index}`);
    setCapturedImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleClearAll = useCallback(() => {
    logger.info("SCANNER", "Cleared all captured photos");
    setCapturedImages([]);
  }, []);

  const handleStartAnalysis = useCallback(() => {
    logger.info("SCANNER", `Analyze / Scan button clicked! Image count: ${capturedImages.length}`);
    if (capturedImages.length > 0) {
      void runPipeline(capturedImages);
    } else {
      logger.warn("SCANNER", "handleStartAnalysis tapped but no images are queued");
    }
  }, [capturedImages, runPipeline]);

  useEffect(() => {
    if (route.params?.fromLibrary) {
      navigation.setParams({ fromLibrary: undefined });
      void handlePickFromLibrary();
    }
  }, [route.params?.fromLibrary, handlePickFromLibrary, navigation]);

  if (phase === "processing") {
    return (
      <ScreenContainer>
        <View className="flex-1 p-6 pt-16">
          <Text className="text-text text-2xl font-bold mb-6">
            Analysis Pipeline
          </Text>
          {STEPS.map((step) => {
            const done = completedSteps.includes(step.key);
            const active = activeStep === step.key;
            return (
              <View key={step.key} className="flex-row items-center mb-5">
                <View
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{
                    backgroundColor: done || active ? "rgba(6, 78, 59, 0.4)" : "#0d1117",
                  }}
                >
                  {done ? (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color="#25D366"
                    />
                  ) : active ? (
                    <ActivityIndicator size="small" color="#25D366" />
                  ) : (
                    <Ionicons
                      name="ellipse-outline"
                      size={22}
                      color="#8A8A8A"
                    />
                  )}
                </View>
                <Text
                  className={`ml-4 text-base ${
                    done || active ? "text-text font-semibold" : "text-secondaryText font-normal"
                  }`}
                >
                  {step.label}
                </Text>
              </View>
            );
          })}
        </View>
      </ScreenContainer>
    );
  }

  if (phase === "offline-saved") {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center p-6">
          <Ionicons name="cloud-offline" size={56} color="#FFA500" />
          <Text className="text-text text-xl font-bold mt-4 text-center">
            Saved for offline sync
          </Text>
          <Text className="text-secondaryText text-sm mt-2 text-center leading-5">
            {savedDraftId}
            {"\n"}
            This inspection will upload automatically when you're back online.
          </Text>
          <Pressable
            onPress={() => setPhase("camera")}
            className="w-full bg-primary rounded-xl py-4 items-center mt-6 active:opacity-85"
          >
            <Text className="text-background font-bold text-base">
              Back to Scanner
            </Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  if (phase === "error") {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center p-6">
          <Ionicons name="alert-circle" size={56} color="#E53935" />
          <Text className="text-text text-xl font-bold mt-4">
            Couldn't read the label
          </Text>
          <Text className="text-secondaryText text-sm mt-2 text-center leading-5">
            {error}
          </Text>
          <Pressable
            onPress={() => void handleManualChecklist()}
            className="w-full bg-primary rounded-xl py-4 items-center mt-6 active:opacity-85"
          >
            <Text className="text-background font-bold text-base">
              Continue with Manual Checklist
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setPhase("camera")}
            className="w-full bg-surface border border-border rounded-xl py-4 items-center mt-3 active:opacity-85"
          >
            <Text className="text-text font-semibold text-base">
              Retake Photo
            </Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  if (!hasPermission) {
    return (
      <ScreenContainer edges={["top", "bottom"]}>
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            paddingHorizontal: 24,
            paddingVertical: 32,
          }}
          showsVerticalScrollIndicator={false}
        >
          <View className="items-center">
            {/* Glowing Aperture Icon Badge */}
            <View className="relative items-center justify-center mb-6">
              <View className="w-28 h-28 rounded-full bg-primary/10 items-center justify-center border border-primary/20">
                <View className="w-20 h-20 rounded-full bg-primary/20 items-center justify-center border border-primary/40">
                  <Ionicons name="camera" size={38} color="#25D366" />
                </View>
              </View>
              <View className="absolute -bottom-2 bg-surface px-3 py-1 rounded-full border border-primary/30 flex-row items-center shadow">
                <Ionicons name="shield-checkmark" size={12} color="#25D366" />
                <Text className="text-primary text-[10px] font-bold ml-1.5 tracking-wider uppercase">
                  DoCA Field App
                </Text>
              </View>
            </View>

            {/* Title & Subtitle */}
            <Text className="text-text text-2xl font-extrabold text-center tracking-tight mb-2">
              Camera Access Required
            </Text>
            <Text className="text-secondaryText text-sm text-center px-2 leading-5 mb-6">
              Labelly requires camera access to capture and inspect packaged commodity labels in real-time.
            </Text>

            {/* Feature Highlights Card */}
            <View className="w-full bg-surface border border-border rounded-2xl p-4 mb-6 shadow-sm">
              <View className="flex-row items-start mb-3.5">
                <View className="w-9 h-9 rounded-xl bg-primary/10 items-center justify-center mr-3 mt-0.5">
                  <Ionicons name="scan-outline" size={18} color="#25D366" />
                </View>
                <View className="flex-1">
                  <Text className="text-text text-sm font-semibold">Multi-Angle Capture</Text>
                  <Text className="text-secondaryText text-xs leading-4 mt-0.5">
                    Capture front, back, and MRP declaration panels in high clarity.
                  </Text>
                </View>
              </View>

              <View className="flex-row items-start mb-3.5">
                <View className="w-9 h-9 rounded-xl bg-primary/10 items-center justify-center mr-3 mt-0.5">
                  <Ionicons name="sparkles-outline" size={18} color="#25D366" />
                </View>
                <View className="flex-1">
                  <Text className="text-text text-sm font-semibold">AI Compliance Engine</Text>
                  <Text className="text-secondaryText text-xs leading-4 mt-0.5">
                    Instant OCR & rule-checking against Legal Metrology Rules, 2011.
                  </Text>
                </View>
              </View>

              <View className="flex-row items-start">
                <View className="w-9 h-9 rounded-xl bg-primary/10 items-center justify-center mr-3 mt-0.5">
                  <Ionicons name="cloud-offline-outline" size={18} color="#25D366" />
                </View>
                <View className="flex-1">
                  <Text className="text-text text-sm font-semibold">Offline Field Support</Text>
                  <Text className="text-secondaryText text-xs leading-4 mt-0.5">
                    Safely stores photos locally when in low or zero network zones.
                  </Text>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View className="w-full">
              {/* Primary: Enable Camera */}
              <Pressable
                onPress={() => void requestAccess()}
                className="w-full bg-primary py-3.5 rounded-xl flex-row items-center justify-center active:opacity-85 shadow-lg mb-3"
              >
                <Ionicons name="camera" size={20} color="#111B21" />
                <Text className="text-background font-bold text-base ml-2">
                  Enable Camera
                </Text>
              </Pressable>

              {/* Secondary: Pick from Gallery */}
              <Pressable
                onPress={() => void handlePickFromLibrary()}
                className="w-full bg-surface border border-border py-3 rounded-xl flex-row items-center justify-center active:opacity-80 mb-3"
              >
                <Ionicons name="images-outline" size={18} color="#ECECEC" />
                <Text className="text-text font-semibold text-sm ml-2">
                  Choose from Gallery
                </Text>
              </Pressable>

              {/* Tertiary: Manual Checklist */}
              <Pressable
                onPress={() => void handleManualChecklist()}
                className="w-full py-2 items-center justify-center active:opacity-70"
              >
                <Text className="text-secondaryText text-xs font-medium underline">
                  Continue with Manual Inspection Checklist
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  return (
    <View className="flex-1 bg-black relative">
      {/* 1. Camera fills background */}
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
      />

      {/* 2. Top Header & Instructions */}
      <SafeAreaView edges={["top"]} className="absolute top-0 left-0 right-0 z-20 items-center px-4" pointerEvents="box-none">
        {isOnline ? null : (
          <View className="flex-row items-center justify-center py-1.5 px-4 bg-warning w-full rounded-lg mb-2">
            <Ionicons name="cloud-offline" size={15} color="#111B21" />
            <Text className="text-background text-xs font-bold ml-1.5">
              Offline — captures saved for sync
            </Text>
          </View>
        )}
        <View className="flex-row items-center justify-between w-full mt-2">
          <View className="bg-black/60 px-4 py-2 rounded-full flex-row items-center border border-white/10">
            <Ionicons name="scan" size={15} color="#25D366" />
            <Text className="text-white text-xs font-semibold ml-1.5">
              Scan Package Label
            </Text>
          </View>

          {capturedImages.length > 0 ? (
            <Pressable
              onPress={handleStartAnalysis}
              style={{
                backgroundColor: "#25D366",
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                flexDirection: "row",
                alignItems: "center",
                elevation: 6,
              }}
            >
              <Ionicons name="sparkles" size={15} color="#FFD700" />
              <Text style={{ color: "#111B21", fontSize: 13, fontWeight: "bold", marginLeft: 6, marginRight: 4 }}>
                Analyze {capturedImages.length} Photo{capturedImages.length > 1 ? "s" : ""}
              </Text>
              <Ionicons name="arrow-forward" size={14} color="#111B21" />
            </Pressable>
          ) : (
            <Pressable
              onPress={() => void handleManualChecklist()}
              className="bg-black/70 border border-primary/60 px-3.5 py-2 rounded-full flex-row items-center active:opacity-75"
            >
              <Ionicons name="create-outline" size={15} color="#25D366" />
              <Text className="text-primary text-xs font-bold ml-1.5">
                Manual Form
              </Text>
            </Pressable>
          )}
        </View>
      </SafeAreaView>

      {/* 3. Center Scanner Target Box */}
      <View className="flex-1 items-center justify-center z-10 px-6" pointerEvents="none">
        <View className="w-72 h-72 relative items-center justify-center">
          {/* Target Box Border */}
          <View className="w-full h-full border-2 border-primary/80 rounded-2xl bg-black/10" />

          {/* Corner Accents */}
          <View className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-xl" />
          <View className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-xl" />
          <View className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-xl" />
          <View className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-xl" />
        </View>

        {/* Status badges under the box */}
        <View className="flex-row items-center justify-center bg-black/60 px-4 py-1.5 rounded-full mt-4 border border-white/10">
          <Ionicons name="checkmark-circle" size={14} color="#25D366" />
          <Text className="text-white/90 text-xs font-medium ml-1.5 mr-3">
            {capturedImages.length > 0 ? `${capturedImages.length} captured • Snap more` : "Auto-focus on"}
          </Text>
          <Ionicons name="sparkles" size={13} color="#25D366" />
          <Text className="text-white/90 text-xs font-medium ml-1.5">
            Gemini Vision Ready
          </Text>
        </View>
      </View>

      {/* 4. Bottom Controls / Multi-Angle Action Bar */}
      <View
        style={{
          position: "absolute",
          bottom: bottomInset,
          left: 0,
          right: 0,
          zIndex: 100,
          elevation: 20,
          paddingHorizontal: 16,
        }}
        pointerEvents="box-none"
      >
        {/* Tray & Big Analyze Button (Shown when 1 or more images are captured) */}
        {capturedImages.length > 0 && (
          <View
            style={{
              backgroundColor: "rgba(13, 17, 23, 0.96)",
              borderRadius: 20,
              padding: 12,
              borderWidth: 1.5,
              borderColor: "#25D366",
              marginBottom: 14,
              elevation: 10,
              shadowColor: "#25D366",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.35,
              shadowRadius: 8,
            }}
          >
            {/* Tray Title Bar */}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#25D366", marginRight: 6 }} />
                <Text style={{ color: "#fff", fontSize: 13, fontWeight: "bold" }}>
                  {capturedImages.length} Angle{capturedImages.length > 1 ? "s" : ""} Captured
                </Text>
                <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, marginLeft: 6 }}>
                  (Snap more angles below)
                </Text>
              </View>
              <Pressable onPress={handleClearAll} hitSlop={12}>
                <Text style={{ color: "#EF4444", fontSize: 12, fontWeight: "bold" }}>Clear all</Text>
              </Pressable>
            </View>

            {/* Captured Photos Thumbnail List */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ alignItems: "center", paddingBottom: 6 }}>
              {capturedImages.map((uri, idx) => (
                <View
                  key={`${uri}-${idx}`}
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: 10,
                    overflow: "hidden",
                    marginRight: 8,
                    borderWidth: 2,
                    borderColor: "#25D366",
                    backgroundColor: "#000",
                    position: "relative",
                  }}
                >
                  <Image source={{ uri }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                  <View
                    style={{
                      position: "absolute",
                      bottom: 1,
                      left: 1,
                      backgroundColor: "rgba(0,0,0,0.75)",
                      paddingHorizontal: 4,
                      borderRadius: 4,
                    }}
                  >
                    <Text style={{ color: "#25D366", fontSize: 9, fontWeight: "bold" }}>#{idx + 1}</Text>
                  </View>
                  <Pressable
                    onPress={() => handleRemoveImage(idx)}
                    style={{
                      position: "absolute",
                      top: 1,
                      right: 1,
                      width: 18,
                      height: 18,
                      borderRadius: 9,
                      backgroundColor: "#EF4444",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    hitSlop={8}
                  >
                    <Ionicons name="close" size={12} color="#fff" />
                  </Pressable>
                </View>
              ))}

              <Pressable
                onPress={() => void handlePickFromLibrary()}
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 10,
                  borderWidth: 1.5,
                  borderStyle: "dashed",
                  borderColor: "rgba(255,255,255,0.4)",
                  backgroundColor: "rgba(255,255,255,0.06)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="images" size={18} color="#ECECEC" />
                <Text style={{ color: "#ECECEC", fontSize: 9, fontWeight: "bold", marginTop: 2 }}>Gallery</Text>
              </Pressable>
            </ScrollView>

            {/* THE BIG UNMISSABLE GREEN ANALYZE BUTTON */}
            <Pressable
              onPress={handleStartAnalysis}
              style={{
                backgroundColor: "#25D366",
                paddingVertical: 14,
                borderRadius: 14,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                elevation: 6,
              }}
            >
              <Ionicons name="sparkles" size={18} color="#FFD700" />
              <Text style={{ color: "#111B21", fontSize: 16, fontWeight: "bold", marginHorizontal: 8 }}>
                Analyze {capturedImages.length} Photo{capturedImages.length > 1 ? "s" : ""} Now
              </Text>
              <Ionicons name="arrow-forward" size={18} color="#111B21" />
            </Pressable>
          </View>
        )}

        {/* Shutter Bar (Always visible & operational!) */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 20,
          }}
          pointerEvents="box-none"
        >
          {/* Gallery Button */}
          <Pressable
            onPress={() => void handlePickFromLibrary()}
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: "rgba(0,0,0,0.65)",
              borderWidth: 1.5,
              borderColor: "rgba(255,255,255,0.25)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="images" size={22} color="#ECECEC" />
            <Text style={{ color: "#fff", fontSize: 9, fontWeight: "600", marginTop: 1 }}>Gallery</Text>
          </Pressable>

          {/* Center Camera Shutter */}
          <Pressable
            onPress={() => void handleCapture()}
            style={{
              width: 74,
              height: 74,
              borderRadius: 37,
              borderWidth: 4,
              borderColor: "#fff",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(37, 211, 102, 0.25)",
            }}
          >
            <View style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: "#25D366", alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="camera" size={26} color="#111B21" />
            </View>
          </Pressable>

          {/* Right Action: If photos ready, quick green Analyze, else Manual Checklist */}
          {capturedImages.length > 0 ? (
            <Pressable
              onPress={handleStartAnalysis}
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: "#25D366",
                alignItems: "center",
                justifyContent: "center",
                elevation: 6,
              }}
            >
              <Ionicons name="sparkles" size={20} color="#FFD700" />
              <Text style={{ color: "#111B21", fontSize: 9, fontWeight: "800", marginTop: 1 }}>
                Run ({capturedImages.length})
              </Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => void handleManualChecklist()}
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: "rgba(0,0,0,0.65)",
                borderWidth: 1.5,
                borderColor: "rgba(255,255,255,0.25)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="list" size={20} color="#25D366" />
              <Text style={{ color: "#25D366", fontSize: 9, fontWeight: "600", marginTop: 1 }}>Checklist</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}