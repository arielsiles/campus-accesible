// FR-702: Route editor screen — place and drag waypoints on map
import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
} from "react-native";
import {
  MapView as MLMapView,
  Camera,
} from "@maplibre/maplibre-react-native";
import DraggableWaypoint from "../components/DraggableWaypoint";
import EditableSegment from "../components/EditableSegment";
import { useRouteCreatorStore } from "../store/routeCreatorStore";
import type { DraftWaypoint } from "../store/routeCreatorStore";

const STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";

const WAYPOINT_TYPES = [
  { value: "entrance", label: "Entrada" },
  { value: "building", label: "Edificio" },
  { value: "intersection", label: "Cruce" },
  { value: "transport_stop", label: "Parada" },
  { value: "landmark", label: "Referencia" },
  { value: "rest_area", label: "Descanso" },
  { value: "hazard", label: "Peligro" },
  { value: "information_point", label: "Info" },
];

interface RouteEditorScreenProps {
  onFinish: () => void;
  onCancel: () => void;
  initialCenter?: [number, number];
}

export default function RouteEditorScreen({
  onFinish,
  onCancel,
  initialCenter = [-3.7264, 40.4468],
}: RouteEditorScreenProps) {
  const waypoints = useRouteCreatorStore((s) => s.waypoints);
  const segments = useRouteCreatorStore((s) => s.segments);
  const addWaypoint = useRouteCreatorStore((s) => s.addWaypoint);
  const updateWaypoint = useRouteCreatorStore((s) => s.updateWaypoint);
  const removeWaypoint = useRouteCreatorStore((s) => s.removeWaypoint);
  const reorderWaypoint = useRouteCreatorStore((s) => s.reorderWaypoint);
  const generateSegments = useRouteCreatorStore((s) => s.generateSegments);

  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editType, setEditType] = useState("landmark");

  // FR-702: Long-press on map to add waypoint
  const handleMapLongPress = useCallback(
    (feature: GeoJSON.Feature) => {
      const coords = (feature.geometry as GeoJSON.Point).coordinates;
      addWaypoint({
        id: "",
        name: `Punto ${waypoints.length + 1}`,
        description: "",
        waypointType: "landmark",
        latitude: coords[1],
        longitude: coords[0],
        orderIndex: waypoints.length,
      });
      // Regenerate segments when waypoints change
      setTimeout(() => useRouteCreatorStore.getState().generateSegments(), 0);
    },
    [waypoints.length, addWaypoint]
  );

  // FR-702: Drag waypoint to new position
  const handleDragEnd = useCallback(
    (index: number, longitude: number, latitude: number) => {
      updateWaypoint(index, { latitude, longitude });
      // Regenerate segments with new positions
      setTimeout(() => useRouteCreatorStore.getState().generateSegments(), 0);
    },
    [updateWaypoint]
  );

  // Edit modal
  const handleSelectWaypoint = useCallback(
    (index: number) => {
      const wp = waypoints[index];
      setSelectedIdx(index);
      setEditName(wp.name);
      setEditDescription(wp.description);
      setEditType(wp.waypointType);
      setShowEditModal(true);
    },
    [waypoints]
  );

  const handleSaveEdit = useCallback(() => {
    if (selectedIdx === null) return;
    updateWaypoint(selectedIdx, {
      name: editName.trim() || `Punto ${selectedIdx + 1}`,
      description: editDescription.trim(),
      waypointType: editType,
    });
    setShowEditModal(false);
  }, [selectedIdx, editName, editDescription, editType, updateWaypoint]);

  const handleDeleteWaypoint = useCallback(() => {
    if (selectedIdx === null) return;
    removeWaypoint(selectedIdx);
    setShowEditModal(false);
    setSelectedIdx(null);
    setTimeout(() => useRouteCreatorStore.getState().generateSegments(), 0);
  }, [selectedIdx, removeWaypoint]);

  const handleMoveUp = useCallback(
    (index: number) => {
      if (index <= 0) return;
      reorderWaypoint(index, index - 1);
      setTimeout(() => useRouteCreatorStore.getState().generateSegments(), 0);
    },
    [reorderWaypoint]
  );

  const handleMoveDown = useCallback(
    (index: number) => {
      if (index >= waypoints.length - 1) return;
      reorderWaypoint(index, index + 1);
      setTimeout(() => useRouteCreatorStore.getState().generateSegments(), 0);
    },
    [reorderWaypoint, waypoints.length]
  );

  const handleFinish = useCallback(() => {
    generateSegments();
    onFinish();
  }, [generateSegments, onFinish]);

  return (
    <View
      style={styles.container}
      accessibilityRole="summary"
      accessibilityLabel="Editor visual de ruta en mapa"
    >
      {/* Map with draggable waypoints */}
      <View style={styles.mapContainer}>
        <MLMapView
          style={styles.map}
          mapStyle={STYLE_URL}
          logoEnabled={false}
          onLongPress={handleMapLongPress}
        >
          <Camera
            centerCoordinate={initialCenter}
            zoomLevel={17}
            animationDuration={0}
          />

          {/* Segment lines */}
          <EditableSegment segments={segments} />

          {/* Draggable waypoint markers */}
          {waypoints.map((wp, idx) => (
            <DraggableWaypoint
              key={wp.id}
              waypoint={wp}
              index={idx}
              onDragEnd={handleDragEnd}
              onSelect={handleSelectWaypoint}
            />
          ))}
        </MLMapView>

        {/* Instructions overlay */}
        <View style={styles.instructionBanner}>
          <Text style={styles.instructionText}>
            Manten pulsado el mapa para anadir puntos. Arrastra para mover.
          </Text>
        </View>
      </View>

      {/* Waypoint list panel */}
      <View style={styles.listPanel}>
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>
            Puntos ({waypoints.length})
          </Text>
          <View style={styles.listActions}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onCancel}
              accessibilityLabel="Cancelar edicion"
              accessibilityRole="button"
            >
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.finishBtn, waypoints.length < 2 && styles.finishBtnDisabled]}
              onPress={handleFinish}
              disabled={waypoints.length < 2}
              accessibilityLabel="Continuar a anotacion"
              accessibilityRole="button"
              accessibilityState={{ disabled: waypoints.length < 2 }}
            >
              <Text style={styles.finishBtnText}>Continuar →</Text>
            </TouchableOpacity>
          </View>
        </View>

        {waypoints.length === 0 ? (
          <Text style={styles.emptyText}>
            Manten pulsado el mapa para anadir el primer punto
          </Text>
        ) : (
          <FlatList
            data={waypoints}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <View style={styles.waypointRow}>
                <Text style={styles.wpIndex}>{index + 1}</Text>
                <TouchableOpacity
                  style={styles.wpInfo}
                  onPress={() => handleSelectWaypoint(index)}
                  accessibilityLabel={`Editar punto ${index + 1}: ${item.name}`}
                  accessibilityRole="button"
                >
                  <Text style={styles.wpName}>{item.name}</Text>
                  <Text style={styles.wpType}>{item.waypointType}</Text>
                </TouchableOpacity>
                {/* Accessible reorder buttons */}
                <TouchableOpacity
                  style={[styles.reorderBtn, index === 0 && styles.reorderBtnDisabled]}
                  onPress={() => handleMoveUp(index)}
                  disabled={index === 0}
                  accessibilityLabel={`Mover ${item.name} arriba`}
                  accessibilityRole="button"
                >
                  <Text style={styles.reorderBtnText}>↑</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.reorderBtn, index === waypoints.length - 1 && styles.reorderBtnDisabled]}
                  onPress={() => handleMoveDown(index)}
                  disabled={index === waypoints.length - 1}
                  accessibilityLabel={`Mover ${item.name} abajo`}
                  accessibilityRole="button"
                >
                  <Text style={styles.reorderBtnText}>↓</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        )}
      </View>

      {/* Edit waypoint modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent} accessibilityRole="alert">
            <Text style={styles.modalTitle} accessibilityRole="header">
              Editar punto
            </Text>

            <TextInput
              style={styles.input}
              value={editName}
              onChangeText={setEditName}
              placeholder="Nombre del punto"
              placeholderTextColor="#999"
              accessibilityLabel="Nombre del punto"
            />

            <TextInput
              style={styles.input}
              value={editDescription}
              onChangeText={setEditDescription}
              placeholder="Descripcion (opcional)"
              placeholderTextColor="#999"
              accessibilityLabel="Descripcion"
            />

            <View style={styles.typeGrid}>
              {WAYPOINT_TYPES.map((t) => (
                <TouchableOpacity
                  key={t.value}
                  style={[styles.typeChip, editType === t.value && styles.typeChipSelected]}
                  onPress={() => setEditType(t.value)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: editType === t.value }}
                  accessibilityLabel={t.label}
                >
                  <Text style={[styles.typeChipText, editType === t.value && styles.typeChipTextSelected]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={handleDeleteWaypoint}
                accessibilityLabel="Eliminar punto"
                accessibilityRole="button"
              >
                <Text style={styles.deleteBtnText}>Eliminar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowEditModal(false)}
                accessibilityLabel="Cancelar"
                accessibilityRole="button"
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveEdit}
                accessibilityLabel="Guardar cambios"
                accessibilityRole="button"
              >
                <Text style={styles.saveBtnText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  mapContainer: { flex: 3 },
  map: { flex: 1 },
  instructionBanner: {
    position: "absolute",
    top: 50,
    left: 16,
    right: 16,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  instructionText: { color: "#fff", fontSize: 13, textAlign: "center" },
  listPanel: {
    flex: 2,
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 12,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  listTitle: { fontSize: 16, fontWeight: "600", color: "#333" },
  listActions: { flexDirection: "row", gap: 8 },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#e0e0e0",
    minHeight: 44,
    justifyContent: "center",
  },
  cancelBtnText: { fontSize: 14, color: "#666" },
  finishBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#1a73e8",
    minHeight: 44,
    justifyContent: "center",
  },
  finishBtnDisabled: { backgroundColor: "#b0c4de" },
  finishBtnText: { fontSize: 14, fontWeight: "600", color: "#fff" },
  emptyText: { fontSize: 14, color: "#999", textAlign: "center", marginTop: 20 },
  waypointRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    gap: 8,
  },
  wpIndex: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#1a73e8",
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 24,
  },
  wpInfo: { flex: 1 },
  wpName: { fontSize: 14, fontWeight: "500", color: "#333" },
  wpType: { fontSize: 12, color: "#999" },
  reorderBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
  },
  reorderBtnDisabled: { opacity: 0.3 },
  reorderBtnText: { fontSize: 16, fontWeight: "700", color: "#333" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#333", marginBottom: 14 },
  input: {
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: "#333",
    marginBottom: 10,
    minHeight: 48,
  },
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 14 },
  typeChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#e0e0e0",
    minHeight: 36,
    justifyContent: "center",
  },
  typeChipSelected: { borderColor: "#1a73e8", backgroundColor: "#e8f0fe" },
  typeChipText: { fontSize: 12, color: "#666" },
  typeChipTextSelected: { color: "#1a73e8", fontWeight: "600" },
  modalActions: { flexDirection: "row", gap: 8 },
  deleteBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#fce8e6",
    minHeight: 44,
    justifyContent: "center",
  },
  deleteBtnText: { fontSize: 14, color: "#ea4335", fontWeight: "600" },
  modalCancelBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#f0f0f0",
    minHeight: 44,
    justifyContent: "center",
  },
  modalCancelText: { fontSize: 14, color: "#666" },
  saveBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#1a73e8",
    minHeight: 44,
    justifyContent: "center",
  },
  saveBtnText: { fontSize: 14, color: "#fff", fontWeight: "600" },
});
