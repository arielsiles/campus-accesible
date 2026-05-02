// FR-002, FR-901, FR-902: App entry point with auth + campus flow
import React, { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import MapScreen from "./src/screens/MapScreen";
import LoginScreen from "./src/screens/LoginScreen";
import RegisterScreen from "./src/screens/RegisterScreen";
import CampusSelectionScreen from "./src/screens/CampusSelectionScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import CameraScreen from "./src/screens/CameraScreen";
import { useAuthStore } from "./src/store/authStore";
import { useCampusStore } from "./src/store/campusStore";

type Screen = "loading" | "login" | "register" | "campus" | "map" | "profile" | "camera";

export default function App() {
  const [screen, setScreen] = useState<Screen>("loading");
  const [initialized, setInitialized] = useState(false);
  const { user, restoreSession, logout } = useAuthStore();
  const { selectedCampus, restoreSelection } = useCampusStore();

  useEffect(() => {
    const init = async () => {
      await restoreSession();
      await restoreSelection();
      setInitialized(true);
    };
    init();
  }, []);

  // Initial routing — runs ONCE after init completes
  useEffect(() => {
    if (!initialized) return;
    if (screen !== "loading") return;

    if (selectedCampus) {
      setScreen("map");
    } else if (user) {
      setScreen("campus");
    } else {
      setScreen("login");
    }
  }, [initialized]);

  // Handle login/logout transitions
  useEffect(() => {
    if (!initialized) return;

    if (user && (screen === "login" || screen === "register")) {
      // Just logged in or registered — navigate forward
      if (selectedCampus) {
        setScreen("map");
      } else {
        setScreen("campus");
      }
    } else if (!user && screen === "profile") {
      // Just logged out from profile — clear campus and go to login
      useCampusStore.setState({ selectedCampus: null });
      setScreen("login");
    }
  }, [user]);

  if (screen === "loading") {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#2563eb" />
        <StatusBar style="dark" />
      </View>
    );
  }

  if (screen === "login") {
    return (
      <>
        <StatusBar style="dark" />
        <LoginScreen
          onNavigateRegister={() => setScreen("register")}
          onSkip={() => {
            // Skip auth — go to campus selection or map
            if (selectedCampus) {
              setScreen("map");
            } else {
              setScreen("campus");
            }
          }}
        />
      </>
    );
  }

  if (screen === "register") {
    return (
      <>
        <StatusBar style="dark" />
        <RegisterScreen onNavigateLogin={() => setScreen("login")} />
      </>
    );
  }

  if (screen === "campus") {
    return (
      <>
        <StatusBar style="dark" />
        <CampusSelectionScreen onCampusSelected={() => setScreen("map")} />
      </>
    );
  }

  if (screen === "profile") {
    return (
      <>
        <StatusBar style="dark" />
        <ProfileScreen onBack={() => setScreen("map")} />
      </>
    );
  }

  if (screen === "camera") {
    return (
      <>
        <StatusBar style="light" />
        <CameraScreen onClose={() => setScreen("map")} />
      </>
    );
  }

  // Default: map screen
  return (
    <>
      <StatusBar style="dark" />
      <MapScreen
        onNavigateProfile={() => setScreen("profile")}
        onNavigateCampus={() => setScreen("campus")}
        onNavigateCamera={() => setScreen("camera")}
      />
    </>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
});
