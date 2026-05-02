// FR-1101: Camera permissions and state management
import { useEffect, useState } from "react";
import { Camera, PermissionStatus } from "expo-camera";

interface UseCameraResult {
  permission: PermissionStatus | null;
  requestPermission: () => Promise<PermissionStatus>;
  isReady: boolean;
}

export function useCamera(): UseCameraResult {
  const [permission, setPermission] = useState<PermissionStatus | null>(null);

  useEffect(() => {
    Camera.getCameraPermissionsAsync().then((status) => {
      setPermission(status.status as PermissionStatus);
    });
  }, []);

  const requestPermission = async (): Promise<PermissionStatus> => {
    const result = await Camera.requestCameraPermissionsAsync();
    const status = result.status as PermissionStatus;
    setPermission(status);
    return status;
  };

  return {
    permission,
    requestPermission,
    isReady: permission === "granted",
  };
}
