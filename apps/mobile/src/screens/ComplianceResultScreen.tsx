import { useState, useEffect } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert, TextInput, Image } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { deleteInspection, getInspection, updateInspectionData } from "../hooks/useInspection";
import { resolveMediaUrl } from "../services/api";
import { ScreenContainer } from "../components/ScreenContainer";
import { MobileHeader } from "../components/MobileHeader";
import { MobileCard } from "../components/MobileCard";
import type { RootStackParamList } from "../navigationTypes";
import type { Inspection, Violation } from "@labelly/shared";

type Props = NativeStackScreenProps<RootStackParamList, "ComplianceResult">;

export function ComplianceResultScreen({ route, navigation }: Props) {
  const { inspectionId } = route.params;

  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [loading, setLoading] = useState(true);
  const [remarks, setRemarks] = useState("");
  const [savingRemarks, setSavingRemarks] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    let active = true;
    getInspection(inspectionId).then((data) => {
      if (active) {
        setInspection(data);
        setRemarks(data.remarks || "");
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [inspectionId]);

  const handleSaveRemarks = async () => {
    if (!inspection) return;
    setSavingRemarks(true);
    try {
      await updateInspectionData(inspectionId, {
        extractedData: inspection.extractedData,
        remarks: remarks.trim(),
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch {
      Alert.alert("Error", "Could not save inspector notes.");
    } finally {
      setSavingRemarks(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Inspection",
      `Are you sure you want to delete this inspection record?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteInspection(inspectionId);
              navigation.goBack();
            } catch {
              Alert.alert("Error", "Could not delete inspection.");
            }
          },
        },
      ]
    );
  };

  if (loading || !inspection) {
    return (
      <ScreenContainer>
        <MobileHeader title="Compliance Result" onBack={() => navigation.goBack()} />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#25D366" />
        </View>
      </ScreenContainer>
    );
  }

  const { compliance } = inspection;
  if (!compliance) {
    return (
      <ScreenContainer>
        <MobileHeader title="Compliance Result" onBack={() => navigation.goBack()} />
        <View className="flex-1 justify-center items-center">
          <Text className="text-text">Compliance data is missing.</Text>
        </View>
      </ScreenContainer>
    );
  }

  const isPass = compliance.status === "COMPLIANT";
  const isReview = compliance.status === "REVIEW_REQUIRED";
  
  let headerColor = "#25D366";
  let headerTextColor = "text-success";
  let headerBorderColor = "border-success";
  let headerBgColor = "bg-emerald-950/20";
  let headerIcon: keyof typeof Ionicons.glyphMap = "checkmark-circle";
  let headerTitle = "COMPLIANT";
  let headerSub = "All checked declarations satisfy configured compliance rules.";

  if (!isPass) {
    headerColor = isReview ? "#FFA500" : "#E53935";
    headerTextColor = isReview ? "text-warning" : "text-error";
    headerBorderColor = isReview ? "border-warning" : "border-error";
    headerBgColor = isReview ? "bg-amber-950/20" : "bg-red-950/20";
    headerIcon = isReview ? "help-circle" : "warning";
    headerTitle = isReview ? "REVIEW REQUIRED" : "NON-COMPLIANT";
    headerSub = `${compliance.violations.length} violations detected.`;
  }

  const rawImage = inspection.images[inspection.images.length - 1]?.originalUrl;
  const evidenceUrl = rawImage ? resolveMediaUrl(rawImage) : null;

  const renderViolation = (v: Violation, index: number) => {
    const isHigh = v.severity === "HIGH";
    return (
      <Pressable 
        key={`${v.ruleId}-${index}`} 
        className="flex-row items-center py-3.5 border-b border-border active:opacity-70"
        onPress={() => navigation.navigate("ViolationDetails", { inspectionId, field: v.field })}
      >
        <Ionicons name="close-circle" size={24} color={isHigh ? "#E53935" : "#FFA500"} className="mr-3" />
        <View className="flex-1 mr-2">
          <Text className="text-text font-semibold text-sm">{v.ruleId} — {v.field}</Text>
          <Text className="text-secondaryText text-xs mt-0.5" numberOfLines={1}>{v.message}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#8A8A8A" />
      </Pressable>
    );
  };

  const renderPassed = (ruleId: string) => {
    return (
      <View key={ruleId} className="flex-row items-center py-2">
        <Ionicons name="checkmark-circle" size={20} color="#25D366" className="mr-3" />
        <Text className="text-secondaryText text-sm">{ruleId}</Text>
      </View>
    );
  };

  return (
    <ScreenContainer>
      <MobileHeader
        title="Compliance Result"
        onBack={() => navigation.goBack()}
        right={
          <Pressable
            onPress={handleDelete}
            hitSlop={10}
            className="w-9 h-9 items-center justify-center rounded-full bg-red-500/10 active:bg-red-500/25"
          >
            <Ionicons name="trash-outline" size={19} color="#E53935" />
          </Pressable>
        }
      />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>
        {/* Supervisor Official Order Stamp */}
        {inspection.status === "APPROVED" && (
          <View className="bg-emerald-950/40 border border-success p-3.5 rounded-xl mb-4 flex-row items-center">
            <Ionicons name="shield-checkmark" size={24} color="#25D366" className="mr-3" />
            <View className="flex-1">
              <Text className="text-success text-xs font-bold uppercase tracking-wide">
                Approved & Cleared by Supervisor
              </Text>
              <Text className="text-secondaryText text-[11px] mt-0.5">
                Statutory clearance granted under Legal Metrology Act, 2009.
              </Text>
            </View>
          </View>
        )}

        {inspection.status === "ACTION_REQUIRED" && (
          <View className="bg-red-950/40 border border-error p-3.5 rounded-xl mb-4 flex-row items-center">
            <Ionicons name="alert-circle" size={24} color="#E53935" className="mr-3" />
            <View className="flex-1">
              <Text className="text-error text-xs font-bold uppercase tracking-wide">
                Notice Issued (Section 36)
              </Text>
              <Text className="text-secondaryText text-[11px] mt-0.5">
                Supervisor has flagged non-compliance and issued a statutory order.
              </Text>
            </View>
          </View>
        )}

        {inspection.status === "REINSPECTION_REQUESTED" && (
          <View className="bg-amber-950/40 border border-warning p-3.5 rounded-xl mb-4 flex-row items-center">
            <Ionicons name="help-circle" size={24} color="#FFA500" className="mr-3" />
            <View className="flex-1">
              <Text className="text-warning text-xs font-bold uppercase tracking-wide">
                Re-Inspection Requested
              </Text>
              <Text className="text-secondaryText text-[11px] mt-0.5">
                Supervisor has requested field re-verification of declarations.
              </Text>
            </View>
          </View>
        )}

        {/* Status Header */}
        <View className={`${headerBgColor} ${headerBorderColor} border p-6 rounded-2xl items-center mb-6`}>
          <Ionicons name={headerIcon} size={64} color={headerColor} />
          <Text className={`${headerTextColor} text-2xl font-bold mt-2`}>
            {headerTitle}
          </Text>
          <Text className="text-text text-sm text-center mt-1">
            {headerSub}
          </Text>
        </View>

        {/* Evidence Photo Preview */}
        {evidenceUrl && (
          <View className="mb-6">
            <Text className="text-secondaryText text-xs font-semibold mb-2 tracking-wider">
              EVIDENCE IMAGE
            </Text>
            <Image
              source={{ uri: evidenceUrl }}
              className="w-full h-48 rounded-xl bg-surface border border-border"
              resizeMode="contain"
            />
          </View>
        )}

        {/* Violations Breakdown Card */}
        <MobileCard>
          <Text className="text-text text-lg font-bold mb-4">
            Violation Breakdown
          </Text>
          {compliance.violations.length === 0 ? (
            <Text className="text-secondaryText italic py-3">No violations found.</Text>
          ) : (
            compliance.violations.map((v, i) => renderViolation(v, i))
          )}
          
          {compliance.reviewRequired && compliance.reviewRequired.length > 0 && (
            <View className="mt-4">
               <Text className="text-warning font-bold mb-2">Needs Review</Text>
               {compliance.reviewRequired.map((r, i) => (
                  <View key={`review-${i}`} className="flex-row items-center py-1">
                    <Ionicons name="help-circle" size={20} color="#FFA500" className="mr-3" />
                    <Text className="text-secondaryText text-sm flex-1">{r.message}</Text>
                  </View>
               ))}
            </View>
          )}

          <Text className="text-text text-sm font-bold mt-6 mb-2">
            Passed Rules
          </Text>
          {compliance.passedRules.map(pr => renderPassed(typeof pr === 'string' ? pr : pr.ruleId))}
        </MobileCard>

        {/* Inspector Review & Remarks Section */}
        <View className="mt-6">
          <MobileCard>
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-text font-bold text-base">
                Officer Field Review & Remarks
              </Text>
              {savedSuccess && (
                <Text className="text-success text-xs font-semibold">✓ Notes Saved</Text>
              )}
            </View>
            <Text className="text-secondaryText text-xs mb-3">
              Add observations, field findings, or supervisor notes for this inspection.
            </Text>
            <TextInput
              className="bg-surface border border-border rounded-xl text-text p-3 text-sm min-h-[80px]"
              multiline
              textAlignVertical="top"
              placeholder="Enter inspector observations, trader explanation, or seizure notes..."
              placeholderTextColor="#8A8A8A"
              value={remarks}
              onChangeText={setRemarks}
            />
            <Pressable
              onPress={handleSaveRemarks}
              disabled={savingRemarks}
              className="bg-elevatedSurface border border-border rounded-lg py-2.5 items-center mt-3 active:opacity-80"
            >
              {savingRemarks ? (
                <ActivityIndicator size="small" color="#25D366" />
              ) : (
                <Text className="text-primary font-semibold text-xs">
                  Save Review Notes
                </Text>
              )}
            </Pressable>
          </MobileCard>
        </View>

        {/* Action Buttons */}
        <Pressable
          className="bg-primary p-4 rounded-xl items-center mt-6 flex-row justify-center active:opacity-85"
          onPress={() => navigation.navigate("ReportView", { inspectionId })}
        >
          <Ionicons name="document-text-outline" size={20} color="#111B21" className="mr-2" />
          <Text className="text-background font-bold text-base">Generate / View PDF Report</Text>
        </Pressable>

        <Pressable
          className="bg-surface border border-border p-3.5 rounded-xl items-center mt-3 active:opacity-85"
          onPress={() => navigation.navigate("ExtractionReview", { inspectionId })}
        >
          <Text className="text-text font-semibold text-sm">Edit Declarations (Manual Review)</Text>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}

