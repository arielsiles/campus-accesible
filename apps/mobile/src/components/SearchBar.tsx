// FR-206: Destination search bar component
import React, { useState } from "react";
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  Text,
} from "react-native";

interface SearchBarProps {
  onSearch: (query: string) => void;
  onClear: () => void;
}

export default function SearchBar({ onSearch, onClear }: SearchBarProps) {
  const [query, setQuery] = useState("");

  const handleChangeText = (text: string) => {
    setQuery(text);
    if (text.length >= 2) {
      onSearch(text);
    } else if (text.length === 0) {
      onClear();
    }
  };

  const handleClear = () => {
    setQuery("");
    onClear();
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={query}
        onChangeText={handleChangeText}
        placeholder="Buscar destino..."
        placeholderTextColor="#999999"
        accessibilityLabel="Buscar destino"
        accessibilityHint="Escribe al menos 2 caracteres para buscar facultades, edificios o paradas"
        accessibilityRole="search"
        returnKeyType="search"
        autoCorrect={false}
      />
      {query.length > 0 && (
        <TouchableOpacity
          style={styles.clearButton}
          onPress={handleClear}
          accessibilityLabel="Borrar búsqueda"
          accessibilityRole="button"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.clearText}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#333333",
    paddingVertical: 12,
    minHeight: 48, // NFR-202: Minimum touch target
  },
  clearButton: {
    width: 44,
    height: 44, // NFR-202: Minimum touch target
    alignItems: "center",
    justifyContent: "center",
  },
  clearText: {
    fontSize: 18,
    color: "#666666",
  },
});
