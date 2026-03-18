// FR-205: Transport connection types

export enum TransportType {
  Metro = "metro",
  Bus = "bus",
  Intercambiador = "intercambiador",
  Cercanias = "cercanias",
}

export interface TransportInfo {
  transportType: TransportType;
  lines: string[];
}
