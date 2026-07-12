"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { activities as initialActivities, drivers as initialDrivers, fuelExpenseLogs as initialFuelExpenseLogs, maintenanceLogs as initialMaintenanceLogs, trips as initialTrips, vehicles as initialVehicles } from "@/data/mock-data";
import type { ActivityLog, Driver, FuelExpenseLog, MaintenanceLog, Trip, UserRole, Vehicle, VehicleStatus } from "@/types";

interface AppStateContextValue {
  vehicles: Vehicle[];
  drivers: Driver[];
  trips: Trip[];
  maintenanceLogs: MaintenanceLog[];
  fuelExpenseLogs: FuelExpenseLog[];
  activities: ActivityLog[];
  addVehicle: (vehicle: Omit<Vehicle, "id">) => void;
  updateVehicle: (vehicle: Vehicle) => void;
  addDriver: (driver: Omit<Driver, "id">) => void;
  updateDriver: (driver: Driver) => void;
  addTrip: (trip: Omit<Trip, "id" | "code">) => void;
  dispatchTrip: (tripId: string) => void;
  completeTrip: (tripId: string, finalOdometerKm: number, fuelConsumedL: number) => void;
  cancelTrip: (tripId: string) => void;
  addMaintenance: (entry: Omit<MaintenanceLog, "id">) => void;
  closeMaintenance: (maintenanceId: string) => void;
  addFuelExpense: (entry: Omit<FuelExpenseLog, "id">) => void;
  addActivity: (activity: Omit<ActivityLog, "id">) => void;
  setVehicleStatus: (vehicleId: string, status: VehicleStatus) => void;
  setDriverStatus: (driverId: string, status: Driver["status"]) => void;
}

const AppStateContext = createContext<AppStateContextValue | undefined>(undefined);
const STORAGE_KEY = "transitops-demo-app-state";

function buildTripCode(index: number) {
  return `TR-${1009 + index}`;
}

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
  const [drivers, setDrivers] = useState<Driver[]>(initialDrivers);
  const [trips, setTrips] = useState<Trip[]>(initialTrips);
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>(initialMaintenanceLogs);
  const [fuelExpenseLogs, setFuelExpenseLogs] = useState<FuelExpenseLog[]>(initialFuelExpenseLogs);
  const [activities, setActivities] = useState<ActivityLog[]>(initialActivities);

  useEffect(() => {
    const storedValue = window.localStorage.getItem(STORAGE_KEY);
    if (storedValue) {
      try {
        const parsed = JSON.parse(storedValue) as Partial<{
          vehicles: Vehicle[];
          drivers: Driver[];
          trips: Trip[];
          maintenanceLogs: MaintenanceLog[];
          fuelExpenseLogs: FuelExpenseLog[];
          activities: ActivityLog[];
        }>;
        if (parsed.vehicles) setVehicles(parsed.vehicles);
        if (parsed.drivers) setDrivers(parsed.drivers);
        if (parsed.trips) setTrips(parsed.trips);
        if (parsed.maintenanceLogs) setMaintenanceLogs(parsed.maintenanceLogs);
        if (parsed.fuelExpenseLogs) setFuelExpenseLogs(parsed.fuelExpenseLogs);
        if (parsed.activities) setActivities(parsed.activities);
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ vehicles, drivers, trips, maintenanceLogs, fuelExpenseLogs, activities }));
  }, [vehicles, drivers, trips, maintenanceLogs, fuelExpenseLogs, activities]);

  const addVehicle = (vehicle: Omit<Vehicle, "id">) => {
    setVehicles((current) => [...current, { ...vehicle, id: `veh-${Date.now()}` }]);
  };

  const updateVehicle = (vehicle: Vehicle) => {
    setVehicles((current) => current.map((item) => (item.id === vehicle.id ? vehicle : item)));
  };

  const addDriver = (driver: Omit<Driver, "id">) => {
    setDrivers((current) => [...current, { ...driver, id: `drv-${Date.now()}` }]);
  };

  const updateDriver = (driver: Driver) => {
    setDrivers((current) => current.map((item) => (item.id === driver.id ? driver : item)));
  };

  const addTrip = (trip: Omit<Trip, "id" | "code">) => {
    setTrips((current) => [
      ...current,
      {
        ...trip,
        id: `trip-${Date.now()}`,
        code: buildTripCode(current.length),
        status: "Draft",
      },
    ]);
  };

  const dispatchTrip = (tripId: string) => {
    setTrips((current) =>
      current.map((trip) =>
        trip.id === tripId ? { ...trip, status: "Dispatched", startedAt: new Date().toISOString() } : trip,
      ),
    );
    setVehicles((current) => current.map((vehicle) => vehicle.id === trips.find((trip) => trip.id === tripId)?.vehicleId ? { ...vehicle, status: "OnTrip" } : vehicle));
    setDrivers((current) => current.map((driver) => driver.id === trips.find((trip) => trip.id === tripId)?.driverId ? { ...driver, status: "OnTrip" } : driver));
  };

  const completeTrip = (tripId: string, finalOdometerKm: number, fuelConsumedL: number) => {
    const trip = trips.find((item) => item.id === tripId);
    if (!trip) return;
    setTrips((current) =>
      current.map((item) =>
        item.id === tripId
          ? {
              ...item,
              status: "Completed",
              completedAt: new Date().toISOString(),
              finalOdometerKm,
              fuelConsumedL,
            }
          : item,
      ),
    );
    setVehicles((current) => current.map((vehicle) => (vehicle.id === trip.vehicleId ? { ...vehicle, status: "Available", odometerKm: Math.max(vehicle.odometerKm, finalOdometerKm) } : vehicle)));
    setDrivers((current) => current.map((driver) => (driver.id === trip.driverId ? { ...driver, status: "Available" } : driver)));
  };

  const cancelTrip = (tripId: string) => {
    const trip = trips.find((item) => item.id === tripId);
    if (!trip) return;
    setTrips((current) => current.map((item) => (item.id === tripId ? { ...item, status: "Cancelled" } : item)));
    setVehicles((current) => current.map((vehicle) => (vehicle.id === trip.vehicleId ? { ...vehicle, status: "Available" } : vehicle)));
    setDrivers((current) => current.map((driver) => (driver.id === trip.driverId ? { ...driver, status: "Available" } : driver)));
  };

  const addMaintenance = (entry: Omit<MaintenanceLog, "id">) => {
    setMaintenanceLogs((current) => [...current, { ...entry, id: `maint-${Date.now()}` }]);
    setVehicles((current) => current.map((vehicle) => (vehicle.id === entry.vehicleId ? { ...vehicle, status: "InShop" } : vehicle)));
  };

  const closeMaintenance = (maintenanceId: string) => {
    setMaintenanceLogs((current) => current.map((entry) => (entry.id === maintenanceId ? { ...entry, status: "Closed", endDate: new Date().toISOString().slice(0, 10) } : entry)));
    const maintenanceEntry = maintenanceLogs.find((entry) => entry.id === maintenanceId);
    if (maintenanceEntry) {
      setVehicles((current) =>
        current.map((vehicle) => {
          if (vehicle.id !== maintenanceEntry.vehicleId) return vehicle;
          return vehicle.status === "Retired" ? vehicle : { ...vehicle, status: "Available" };
        }),
      );
    }
  };

  const addFuelExpense = (entry: Omit<FuelExpenseLog, "id">) => {
    setFuelExpenseLogs((current) => [...current, { ...entry, id: `exp-${Date.now()}` }]);
  };

  const addActivity = (activity: Omit<ActivityLog, "id">) => {
    setActivities((current) => [{ ...activity, id: `act-${Date.now()}` }, ...current]);
  };

  const setVehicleStatus = (vehicleId: string, status: VehicleStatus) => {
    setVehicles((current) => current.map((vehicle) => (vehicle.id === vehicleId ? { ...vehicle, status } : vehicle)));
  };

  const setDriverStatus = (driverId: string, status: Driver["status"]) => {
    setDrivers((current) => current.map((driver) => (driver.id === driverId ? { ...driver, status } : driver)));
  };

  const value = useMemo(
    () => ({
      vehicles,
      drivers,
      trips,
      maintenanceLogs,
      fuelExpenseLogs,
      activities,
      addVehicle,
      updateVehicle,
      addDriver,
      updateDriver,
      addTrip,
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
    [vehicles, drivers, trips, maintenanceLogs, fuelExpenseLogs, activities],
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
