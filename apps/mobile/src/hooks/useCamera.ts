import { useRef } from "react";
import { useCameraPermissions, type CameraView } from "expo-camera";

export function useCamera() {
  const cameraRef = useRef<CameraView | null>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const hasPermission = !!permission?.granted;
  const requesting = !permission;

  const requestAccess = async (): Promise<boolean> => {
    if (hasPermission) return true;
    const result = await requestPermission();
    return !!result?.granted;
  };

  const capture = async (): Promise<string | null> => {
    if (!cameraRef.current) return null;
    const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
    try {
      await cameraRef.current.resumePreview();
    } catch {
      // resumePreview may not be needed or supported on all platforms
    }
    return photo?.uri ?? null;
  };

  const resume = async (): Promise<void> => {
    try {
      await cameraRef.current?.resumePreview();
    } catch {
      // Ignore if not supported
    }
  };

  return {
    cameraRef,
    hasPermission,
    requesting,
    requestAccess,
    capture,
    resume,
  };
}