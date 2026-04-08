// FR-002, FR-901, FR-902: App entry point with auth + campus flow
import React, { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import MapScreen from "./src/screens/MapScreen";
import LoginScreen from "./src/screens/LoginScreen";
import RegisterScreen from "./src/screens/RegisterScreen";
import CampusSelectionScreen from "./src/screens/CampusSelectionScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import { useAuthStore } from "./src/store/authStore";
import { useCampusStore } from "./src/store/campusStore";

type Screen = "loading" | "login" | "register" | "campus" | "map" | "profile";

export default function App() {
  const [screen, setScreen] = useState<Screen>("loading");
  const { user, restoreSession } = useAuthStore();
  const { selectedCampus, restoreSelection } = useCampusStore();

  useEffect(() => {
    const init = async () => {
      await restoreSession();
      await restoreSelection();
      setScreen("ready" as Screen); // triggers re-render with resolved state
    };
    init();
  }, []);

  // Determine screen after init
  useEffect(() => {
    if (screen === "loading") return;
    if (screen === "profile") return; // don't override manual navigation
    if (screen === "register") return;

    if (!user && screen !== "login") {
      // Show login but allow skip
    }

    if (selectedCampus) {
      setScreen("map");
    } else if (user) {
      setScreen("campus");
    } else if (screen === ("ready" as Screen)) {
      setScreen("login");
    }
  }, [user, selectedCampus, screen]);

  // Handle logout
  useEffect(() => {
    if (!user && screen === "map") {
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

  // Default: map screen
  return (
    <>
      <StatusBar style="dark" />
      <MapScreen
        onNavigateProfile={() => setScreen("profile")}
        onNavigateCampus={() => setScreen("campus")}
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
