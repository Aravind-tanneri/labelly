import { useState, useEffect } from "react";
import { View, Text, ScrollView, ActivityIndicator, Pressable, Linking } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { getInspection } from "../hooks/useInspection";
import { apiClient, API_BASE_URL } from "../services/api";
import { ScreenContainer } from "../components/ScreenContainer";
import { MobileHeader } from "../components/MobileHeader";
import { MobileCard } from "../components/MobileCard";
import type { RootStackParamList } from "../navigationTypes";
import type { Inspection } from "@labelly/shared";

type Props = NativeStackScreenProps<RootStackParamList, "ReportView">;

export function ReportScreen({ route, navigation }: Props) {
  const { inspectionId } = route.params;

  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "info" | "success" | "error" } | null>(null);

  useEffect(() => {
    let active = true;
    getInspection(inspectionId).then((data) => {
      if (active) {
        setInspection(data);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [inspectionId]);

  const showToast = (message: string, type: "info" | "success" | "error" = "info") => {
    setToast({ message, type });
    if (type !== "info") {
      setTimeout(() => setToast(null), 4000);
    }
  };

  const handleGenerateAndShare = async () => {
    if (!inspection) return;
    setGenerating(true);
    showToast("Generating official Legal Metrology report...", "info");

    try {
      // 1. Trigger report generation on server
      const { data } = await apiClient.post<{ reportUrl: string }>(
        `/api/inspections/${inspectionId}/report`
      );

      // 2. Resolve absolute URL and replace any localhost with active phone API_BASE_URL
      let downloadUrl = data.reportUrl;
      if (downloadUrl.startsWith("http://localhost:5000") || downloadUrl.startsWith("http://127.0.0.1:5000")) {
        downloadUrl = downloadUrl.replace(/http:\/\/(localhost|127\.0\.0\.1):5000/, API_BASE_URL.replace(/\/$/, ""));
      } else if (!downloadUrl.startsWith("http")) {
        downloadUrl = `${API_BASE_URL.replace(/\/$/, "")}/${downloadUrl.replace(/^\//, "")}`;
      }

      showToast("Downloading verified PDF certificate...", "info");


      let shareUri: string | null = null;
      try {
        const targetFile = new File(Paths.cache, `${inspection.inspectionId}.pdf`);
        if (targetFile.exists) {
          targetFile.delete();
        }
        const downloaded = await File.downloadFileAsync(downloadUrl, targetFile, { idempotent: true });
        shareUri = downloaded.uri;
      } catch (fileErr) {
        console.warn("Direct File.downloadFileAsync failed, opening URL in browser...", fileErr);
      }

      // 3. Share or open in browser
      if (shareUri && (await Sharing.isAvailableAsync())) {
        showToast("PDF ready! Opening share dialog...", "success");
        await Sharing.shareAsync(shareUri, {
          UTI: ".pdf",
          mimeType: "application/pdf",
          dialogTitle: `Legal Metrology Report - ${inspection.inspectionId}`,
        });
      } else {
        showToast("Opening PDF report in browser...", "success");
        await Linking.openURL(downloadUrl);
      }
    } catch (err) {
      console.error("Failed to generate or share report", err);
      showToast(
        err instanceof Error ? err.message : "Failed to generate report. Please try again.",
        "error"
      );
    } finally {
      setGenerating(false);
    }
  };

  if (!inspection || loading) {
    return (
      <ScreenContainer>
        <MobileHeader title="Inspection Report" onBack={() => navigation.goBack()} />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#25D366" />
        </View>
      </ScreenContainer>
    );
  }

  const isCompliant = inspection.compliance?.status === "COMPLIANT";

  return (
    <ScreenContainer>
      <MobileHeader title="Inspection Report" onBack={() => navigation.goBack()} />

      {/* Floating Toast Notification */}
      {toast && (
        <View className="absolute top-16 left-4 right-4 z-50">
          <View
            className={`flex-row items-center p-3.5 rounded-xl shadow-lg border ${
              toast.type === "success"
                ? "bg-emerald-900/95 border-success"
                : toast.type === "error"
                ? "bg-red-950/95 border-error"
                : "bg-surface/95 border-primary"
            }`}
          >
            {toast.type === "info" ? (
              <ActivityIndicator size="small" color="#25D366" className="mr-3" />
            ) : toast.type === "success" ? (
              <Ionicons name="checkmark-circle" size={20} color="#25D366" className="mr-2.5" />
            ) : (
              <Ionicons name="alert-circle" size={20} color="#E53935" className="mr-2.5" />
            )}
            <Text className="text-white text-xs font-semibold flex-1 leading-4">
              {toast.message}
            </Text>
          </View>
        </View>
      )}

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>
        <MobileCard>
          <View className="items-center py-6">
            <View className="w-16 h-16 rounded-2xl bg-primary/15 items-center justify-center mb-3">
              <Ionicons name="document-text" size={36} color="#25D366" />
            </View>
            <Text className="text-text text-lg font-bold text-center">
              LEGAL METROLOGY
            </Text>
            <Text className="text-secondaryText text-xs text-center mt-0.5 tracking-wider">
              PACKAGED COMMODITY INSPECTION REPORT
            </Text>
          </View>
          
          <View className="mt-2 border-t border-border pt-4">
            <View className="flex-row justify-between items-center py-1.5 border-b border-border/40">
              <Text className="text-secondaryText text-xs">Inspection ID</Text>
              <Text className="text-text font-bold text-xs">{inspection.inspectionId}</Text>
            </View>

            <View className="flex-row justify-between items-center py-1.5 border-b border-border/40">
              <Text className="text-secondaryText text-xs">Product</Text>
              <Text className="text-text font-semibold text-xs" numberOfLines={1}>
                {inspection.product?.name || "Packaged Commodity"}
              </Text>
            </View>

            <View className="flex-row justify-between items-center py-1.5 border-b border-border/40">
              <Text className="text-secondaryText text-xs">Date</Text>
              <Text className="text-text font-semibold text-xs">
                {new Date(inspection.createdAt).toLocaleDateString()}
              </Text>
            </View>

            <View className="flex-row justify-between items-center py-1.5">
              <Text className="text-secondaryText text-xs">Status</Text>
              <Text className={`font-bold text-xs ${isCompliant ? "text-success" : "text-error"}`}>
                {inspection.compliance?.status || "PENDING"}
              </Text>
            </View>
          </View>
        </MobileCard>
        
        <Pressable
          className={`bg-primary p-4 rounded-xl items-center mt-4 flex-row justify-center ${
            generating ? "opacity-70" : "active:opacity-85"
          }`}
          onPress={handleGenerateAndShare}
          disabled={generating}
        >
          {generating ? (
            <>
              <ActivityIndicator color="#111B21" className="mr-2.5" />
              <Text className="text-background font-bold text-base">Generating Report...</Text>
            </>
          ) : (
            <>
              <Ionicons name="download-outline" size={20} color="#111B21" className="mr-2" />
              <Text className="text-background font-bold text-base">Download / Share PDF</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}

