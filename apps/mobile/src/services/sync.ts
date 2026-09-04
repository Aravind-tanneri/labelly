import { API_ENDPOINTS } from "@labelly/shared";
import { apiClient } from "./api";
import { loadDrafts, removeDraft, updateDraft } from "./storage";

export interface SyncResult {
  synced: number;
  failed: number;
}

export async function syncPendingDrafts(): Promise<SyncResult> {
  const drafts = await loadDrafts();
  const pending = drafts.filter((d) => d.syncStatus === "PENDING");

  let synced = 0;
  let failed = 0;

  for (const draft of pending) {
    try {
      const imageUri = draft.images[0]?.originalUrl;
      if (!imageUri) {
        throw new Error("Draft has no image.");
      }

      const created = await apiClient.post<{ _id: string; inspectionId: string }>(
        API_ENDPOINTS.createInspection,
        {
          productCategory: "Packaged Commodity",
          notes: "Offline draft - auto-synced.",
        }
      );
      const id = created.data._id;

      const form = new FormData();
      form.append("image", {
        uri: imageUri,
        name: `draft-${Date.now()}.jpg`,
        type: "image/jpeg",
      } as unknown as Blob);

      await apiClient.post(API_ENDPOINTS.uploadImage(id), form);
      await apiClient.post(API_ENDPOINTS.analyze(id), {}, { timeout: 90000 });
      await removeDraft(draft.inspectionId);
      synced += 1;
    } catch {
      await updateDraft({ ...draft, syncStatus: "FAILED" });
      failed += 1;
    }
  }

  return { synced, failed };
}