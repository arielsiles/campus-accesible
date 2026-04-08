// FR-906: User profile screen with contribution history
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useAuthStore } from "../store/authStore";
import { useCampusStore } from "../store/campusStore";
import { apiGet } from "../services/apiClient";
import { USER_ROLE_LABELS, ROUTE_STATUS_LABELS } from "@campus-gps/shared-types";
import type { RouteStatus } from "@campus-gps/shared-types";

interface UserRouteItem {
  id: string;
  name: string;
  status: RouteStatus;
  createdAt: string;
}

interface ProfileScreenProps {
  onBack: () => void;
}

export default function ProfileScreen({ onBack }: ProfileScreenProps) {
  const { user, logout } = useAuthStore();
  const { selectedCampus } = useCampusStore();
  const [routes, setRoutes] = useState<UserRouteItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadUserRoutes();
    }
  }, [user]);

  const loadUserRoutes = async () => {
    try {
      const data = await apiGet<UserRouteItem[]>(`/users/${user?.id}/routes`);
      setRoutes(data);
    } catch {
      // Endpoint may not exist yet — ignore
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  if (!user) return null;

  const statusColor = (status: RouteStatus): string => {
    const colors: Record<RouteStatus, string> = {
      draft: "#6b7280",
      pending_review: "#f59e0b",
      changes_requested: "#ef4444",
      published: "#22c55e",
      rejected: "#dc2626",
      archived: "#9ca3af",
    };
    return colors[status];
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backButton}
          accessibilityLabel="Volver al mapa"
          accessibilityRole="button"
        >
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} accessibilityRole="header">
          Mi perfil
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>
              {USER_ROLE_LABELS[user.role]}
            </Text>
          </View>
          {selectedCampus && (
            <Text style={styles.campusText}>
              Campus: {selectedCampus.name}
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mis rutas</Text>
          {isLoading ? (
            <ActivityIndicator color="#2563eb" />
          ) : routes.length === 0 ? (
            <Text style={styles.emptyText}>
              Aún no has creado rutas
            </Text>
          ) : (
            routes.map((route) => (
              <View key={route.id} style={styles.routeItem}>
                <Text style={styles.routeName}>{route.name}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: statusColor(route.status) + "20" },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: statusColor(route.status) },
                    ]}
                  >
                    {ROUTE_STATUS_LABELS[route.status]}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          accessibilityLabel="Cerrar sesión"
          accessibilityRole="button"
        >
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "#1a1a2e",
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backButton: {
    minWidth: 48,
    minHeight: 48,
    justifyContent: "center",
  },
  backText: {
    color: "#fff",
    fontSize: 16,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 8,
  },
  content: {
    padding: 16,
  },
  profileCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    marginBottom: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  avatarText: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
  },
  userName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1a1a2e",
  },
  userEmail: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  roleBadge: {
    backgroundColor: "#2563eb20",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  roleText: {
    color: "#2563eb",
    fontSize: 14,
    fontWeight: "600",
  },
  campusText: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a1a2e",
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
    fontStyle: "italic",
  },
  routeItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  routeName: {
    fontSize: 14,
    color: "#333",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  logoutButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ef4444",
    borderRadius: 8,
    minHeight: 48,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  logoutText: {
    color: "#ef4444",
    fontSize: 16,
    fontWeight: "600",
  },
});
