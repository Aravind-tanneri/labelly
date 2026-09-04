import * as ImagePicker from "expo-image-picker";
import type { CameraView } from "expo-camera";
import type { RefObject } from "react";

export async function requestCameraPermission(): Promise<boolean> {
  const existing = await ImagePicker.getCameraPermissionsAsync();
  if (existing.granted) return true;
  if (existing.canAskAgain || !existing.granted) {
    const result = await ImagePicker.requestCameraPermissionsAsync();
    return result.granted;
  }
  return false;
}

export async function pickImagesFromLibrary(): Promise<string[]> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return [];

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    quality: 0.8,
    allowsMultipleSelection: true,
    selectionLimit: 10,
  });

  if (result.canceled || !result.assets) return [];
  return result.assets.map((a) => a.uri).filter(Boolean);
}

export async function pickImageFromLibrary(): Promise<string | null> {
  const images = await pickImagesFromLibrary();
  return images[0] ?? null;
}

export async function captureFromCamera(
  cameraRef: RefObject<CameraView | null>
): Promise<string | null> {
  const camera = cameraRef.current;
  if (!camera) return null;
  const photo = await camera.takePictureAsync({ quality: 0.8 });
  return photo?.uri ?? null;
}