"use client";

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import type { ActivityLog, Driver, FuelExpenseLog, MaintenanceLog, Trip, UserRole, Vehicle, VehicleStatus } from "@/types";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";

interface AppStateContextValue {
  vehicles: Vehicle[];
  drivers: Driver[];
  trips: Trip[];
  maintenanceLogs: MaintenanceLog[];
  fuelExpenseLogs: FuelExpenseLog[];
  activities: ActivityLog[];
  isLoading: boolean;
  addVehicle: (vehicle: Omit<Vehicle, "id">) => Promise<void>;
  updateVehicle: (vehicle: Vehicle) => Promise<void>;
  addDriver: (driver: Omit<Driver, "id">) => Promise<void>;
  updateDriver: (driver: Driver) => Promise<void>;
  addTrip: (trip: Omit<Trip, "id" | "code" | "status" | "startedAt" | "completedAt">) => Promise<void>;
  updateTrip: (trip: Trip) => Promise<void>;
  dispatchTrip: (tripId: string) => Promise<void>;
  completeTrip: (tripId: string, finalOdometerKm: number, fuelConsumedL: number) => Promise<void>;
  cancelTrip: (tripId: string) => Promise<void>;
  addMaintenance: (entry: Omit<MaintenanceLog, "id" | "status" | "endDate">) => Promise<void>;
  closeMaintenance: (maintenanceId: string) => Promise<void>;
  addFuelExpense: (entry: Omit<FuelExpenseLog, "id">) => Promise<void>;
  addActivity: (activity: Omit<ActivityLog, "id">) => void;
  setVehicleStatus: (vehicleId: string, status: VehicleStatus) => Promise<void>;
  setDriverStatus: (driverId: string, status: Driver["status"]) => Promise<void>;
}

const AppStateContext = createContext<AppStateContextValue | undefined>(undefined);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([]);
  const [fuelExpenseLogs, setFuelExpenseLogs] = useState<FuelExpenseLog[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setIsLoading(true);
      const [vRes, dRes, tRes, mRes, fRes] = await Promise.all([
        apiClient.get("/api/vehicles?limit=100").catch(() => ({ items: [] })),
        apiClient.get("/api/drivers?limit=100").catch(() => ({ items: [] })),
        apiClient.get("/api/trips?limit=100").catch(() => ({ items: [] })),
        apiClient.get("/api/maintenance?limit=100").catch(() => ({ items: [] })),
        apiClient.get("/api/fuel-expenses?limit=100").catch(() => ({ items: [] })),
      ]);

      setVehicles((vRes.items || []).map((v: any) => ({
        ...v,
        maxLoadKg: v.maxLoad ?? 0,
        odometerKm: v.odometer ?? 0,
        region: v.region ?? "Unknown",
        lastServiceDate: v.lastServiceDate ?? v.createdAt,
      })));
      setDrivers((dRes.items || []).map((d: any) => ({
        ...d,
        contact: d.contact ?? d.contactNumber ?? "",
        region: d.region ?? "Unknown",
        licenseExpiry: d.licenseExpiry ? new Date(d.licenseExpiry).toISOString().slice(0, 10) : "2028-01-01",
      })));
      setTrips((tRes.items || []).map((t: any) => ({
        ...t,
        cargoWeightKg: t.cargoWeight ?? 0,
        plannedDistanceKm: t.plannedDistance ?? 0,
        finalOdometerKm: t.finalOdometer,
        fuelConsumedL: t.fuelConsumed,
      })));
      setMaintenanceLogs(mRes.items || []);
      setFuelExpenseLogs((fRes.items || []).map((f: any) => ({
        ...f,
        amount: f.cost ?? 0,
      })));
    } catch (e) {
      console.error("Failed to fetch initial state", e);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addVehicle = async (vehicle: Omit<Vehicle, "id">) => {
    const payload = { ...vehicle, maxLoad: vehicle.maxLoadKg, odometer: vehicle.odometerKm };
    const res = await apiClient.post<any>("/api/vehicles", payload);
    setVehicles((current) => [{ ...res, maxLoadKg: res.maxLoad ?? 0, odometerKm: res.odometer ?? 0, region: res.region ?? "Unknown", lastServiceDate: res.lastServiceDate ?? res.createdAt }, ...current]);
  };

  const updateVehicle = async (vehicle: Vehicle) => {
    const payload = { ...vehicle, maxLoad: vehicle.maxLoadKg, odometer: vehicle.odometerKm };
    const res = await apiClient.put<any>(`/api/vehicles/${vehicle.id}`, payload);
    const mappedRes = { ...res, maxLoadKg: res.maxLoad ?? 0, odometerKm: res.odometer ?? 0, region: res.region ?? "Unknown", lastServiceDate: res.lastServiceDate ?? res.createdAt };
    setVehicles((current) => current.map((item) => (item.id === vehicle.id ? mappedRes : item)));
  };

  const addDriver = async (driver: Omit<Driver, "id">) => {
    const payload = { ...driver, contactNumber: driver.contact };
    const res = await apiClient.post<any>("/api/drivers", payload);
    setDrivers((current) => [{
      ...res,
      contact: res.contact ?? res.contactNumber ?? "",
      region: res.region ?? "Unknown",
      licenseExpiry: res.licenseExpiry ? new Date(res.licenseExpiry).toISOString().slice(0, 10) : "2028-01-01",
    }, ...current]);
  };

  const updateDriver = async (driver: Driver) => {
    const payload = { ...driver, contactNumber: driver.contact };
    const res = await apiClient.put<any>(`/api/drivers/${driver.id}`, payload);
    setDrivers((current) => current.map((item) => (item.id === driver.id ? {
      ...res,
      contact: res.contact ?? res.contactNumber ?? "",
      region: res.region ?? "Unknown",
      licenseExpiry: res.licenseExpiry ? new Date(res.licenseExpiry).toISOString().slice(0, 10) : "2028-01-01",
    } : item)));
  };

  const addTrip = async (trip: Omit<Trip, "id" | "code" | "status" | "startedAt" | "completedAt">) => {
    const payload = { ...trip, cargoWeight: trip.cargoWeightKg, plannedDistance: trip.plannedDistanceKm };
    const res = await apiClient.post<any>("/api/trips", payload);
    setTrips((current) => [{ ...res, cargoWeightKg: res.cargoWeight ?? 0, plannedDistanceKm: res.plannedDistance ?? 0 }, ...current]);
  };

  const updateTrip = async (trip: Trip) => {
    const payload = { ...trip, cargoWeight: trip.cargoWeightKg, plannedDistance: trip.plannedDistanceKm };
    const res = await apiClient.put<any>(`/api/trips/${trip.id}`, payload);
    const mappedRes = { ...res, cargoWeightKg: res.cargoWeight ?? 0, plannedDistanceKm: res.plannedDistance ?? 0 };
    setTrips((current) => current.map((item) => (item.id === trip.id ? mappedRes : item)));
  };

  const dispatchTrip = async (tripId: string) => {
    const res = await apiClient.post<Trip>(`/api/trips/${tripId}/dispatch`, {});
    setTrips((current) => current.map((trip) => (trip.id === tripId ? res : trip)));
    fetchData(); // Refresh all state as dispatch updates vehicles/drivers
  };

  const completeTrip = async (tripId: string, finalOdometerKm: number, fuelConsumedL: number) => {
    const res = await apiClient.post<Trip>(`/api/trips/${tripId}/complete`, { finalOdometer: finalOdometerKm, fuelConsumed: fuelConsumedL });
    setTrips((current) => current.map((trip) => (trip.id === tripId ? res : trip)));
    fetchData();
  };

  const cancelTrip = async (tripId: string) => {
    const res = await apiClient.post<Trip>(`/api/trips/${tripId}/cancel`, {});
    setTrips((current) => current.map((item) => (item.id === tripId ? res : item)));
    fetchData();
  };

  const addMaintenance = async (entry: Omit<MaintenanceLog, "id" | "status" | "endDate">) => {
    const res = await apiClient.post<MaintenanceLog>("/api/maintenance", entry);
    setMaintenanceLogs((current) => [res, ...current]);
    fetchData();
  };

  const closeMaintenance = async (maintenanceId: string) => {
    const res = await apiClient.post<MaintenanceLog>(`/api/maintenance/${maintenanceId}/close`, {});
    setMaintenanceLogs((current) => current.map((entry) => (entry.id === maintenanceId ? res : entry)));
    fetchData();
  };

  const addFuelExpense = async (entry: Omit<FuelExpenseLog, "id">) => {
    const payload = { ...entry, cost: entry.amount };
    const res = await apiClient.post<any>("/api/fuel-expenses", payload);
    setFuelExpenseLogs((current) => [{ ...res, amount: res.cost ?? 0 }, ...current]);
  };

  const addActivity = (activity: Omit<ActivityLog, "id">) => {
    // We don't have an activity endpoint yet, so just store in memory for now
    setActivities((current) => [{ ...activity, id: `act-${Date.now()}` }, ...current]);
  };

  const setVehicleStatus = async (vehicleId: string, status: VehicleStatus) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle) return;
    await updateVehicle({ ...vehicle, status });
  };

  const setDriverStatus = async (driverId: string, status: Driver["status"]) => {
    const driver = drivers.find(d => d.id === driverId);
    if (!driver) return;
    await updateDriver({ ...driver, status });
  };

  const value = useMemo(
    () => ({
      vehicles,
      drivers,
      trips,
      maintenanceLogs,
      fuelExpenseLogs,
      activities,
      isLoading,
      addVehicle,
      updateVehicle,
      addDriver,
      updateDriver,
      addTrip,
      updateTrip,
      dispatchTrip,
      completeTrip,
      cancelTrip,
      addMaintenance,
      closeMaintenance,
      addFuelExpense,
      addActivity,
      setVehicleStatus,
      setDriverStatus,
    }),
    [vehicles, drivers, trips, maintenanceLogs, fuelExpenseLogs, activities, isLoading],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error("useAppState must be used within AppStateProvider");
  }
  return context;
}
