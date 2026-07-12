-- Translated SQL Views for Prisma (Based on transitops.sql)
-- Note: Prisma models are PascalCase and fields are camelCase. They are quoted to preserve casing.
-- Enums are string literals that match the Prisma enum definition (e.g. 'OnTrip', 'InShop')

-- 1. Fleet Utilization
CREATE OR REPLACE VIEW "vw_fleet_utilization" AS
SELECT round(((100.0 * (count(*) FILTER (WHERE "status" = 'OnTrip'))::numeric) / (NULLIF(count(*) FILTER (WHERE "status" <> 'Retired'), 0))::numeric), 2) AS fleet_utilization_pct
FROM "Vehicle";

-- 2. Dashboard KPIs
CREATE OR REPLACE VIEW "vw_dashboard_kpis" AS
SELECT 
  (SELECT count(*) FROM "Vehicle" WHERE "status" <> 'Retired') AS active_vehicles,
  (SELECT count(*) FROM "Vehicle" WHERE "status" = 'Available') AS available_vehicles,
  (SELECT count(*) FROM "Vehicle" WHERE "status" = 'InShop') AS vehicles_in_maintenance,
  (SELECT count(*) FROM "Trip" WHERE "status" = 'Dispatched') AS active_trips,
  (SELECT count(*) FROM "Trip" WHERE "status" = 'Draft') AS pending_trips,
  (SELECT count(*) FROM "Driver" WHERE "status" = 'OnTrip') AS drivers_on_duty,
  (SELECT fleet_utilization_pct FROM "vw_fleet_utilization") AS fleet_utilization_pct;

-- 3. Expiring Licenses
CREATE OR REPLACE VIEW "vw_expiring_licenses" AS
SELECT 
  "id",
  "name",
  "licenseNumber",
  "licenseExpiry",
  ("licenseExpiry"::date - CURRENT_DATE) AS days_remaining
FROM "Driver"
WHERE "licenseExpiry"::date <= (CURRENT_DATE + interval '30 days')
ORDER BY "licenseExpiry";

-- 4. Fuel Efficiency
-- Using plannedDistance as proxy for actual distance, and FuelExpenseLog type='Fuel'
CREATE OR REPLACE VIEW "vw_fuel_efficiency" AS
SELECT 
  v."id" AS vehicle_id,
  v."registrationNumber",
  COALESCE(sum(t."plannedDistance"), 0) AS total_distance_km,
  COALESCE(sum(f."liters"), 0) AS total_fuel_liters,
  round((COALESCE(sum(t."plannedDistance"), 0) / NULLIF(COALESCE(sum(f."liters"), 0), 0))::numeric, 2) AS km_per_liter
FROM "Vehicle" v
LEFT JOIN "Trip" t ON t."vehicleId" = v."id" AND t."status" = 'Completed'
LEFT JOIN "FuelExpenseLog" f ON f."vehicleId" = v."id" AND f."type" = 'Fuel'
GROUP BY v."id", v."registrationNumber";

-- 5. Operational Cost
-- Combines MaintenanceLogs and FuelExpenseLogs
CREATE OR REPLACE VIEW "vw_operational_cost" AS
SELECT 
  v."id" AS vehicle_id,
  v."registrationNumber",
  COALESCE((SELECT sum("cost") FROM "FuelExpenseLog" WHERE "vehicleId" = v."id" AND "type" = 'Fuel'), 0) AS total_fuel_cost,
  COALESCE((SELECT sum("cost") FROM "MaintenanceLog" WHERE "vehicleId" = v."id"), 0) AS total_maintenance_cost,
  COALESCE((SELECT sum("cost") FROM "FuelExpenseLog" WHERE "vehicleId" = v."id" AND "type" != 'Fuel'), 0) AS total_other_expenses,
  (
    COALESCE((SELECT sum("cost") FROM "FuelExpenseLog" WHERE "vehicleId" = v."id" AND "type" = 'Fuel'), 0) + 
    COALESCE((SELECT sum("cost") FROM "MaintenanceLog" WHERE "vehicleId" = v."id"), 0) + 
    COALESCE((SELECT sum("cost") FROM "FuelExpenseLog" WHERE "vehicleId" = v."id" AND "type" != 'Fuel'), 0)
  ) AS total_operational_cost
FROM "Vehicle" v;

-- 6. Vehicle ROI
-- Because the Prisma schema doesn't have a specific `revenue` field on Trips, 
-- we use (cargoWeight * plannedDistance * 0.1) as a proxy revenue calculation.
CREATE OR REPLACE VIEW "vw_vehicle_roi" AS
SELECT 
  v."id" AS vehicle_id,
  v."registrationNumber",
  v."acquisitionCost",
  COALESCE((SELECT sum(t."cargoWeight" * t."plannedDistance" * 0.1) FROM "Trip" t WHERE t."vehicleId" = v."id" AND t."status" = 'Completed'), 0) AS total_revenue,
  oc.total_fuel_cost,
  oc.total_maintenance_cost,
  round(((COALESCE((SELECT sum(t."cargoWeight" * t."plannedDistance" * 0.1) FROM "Trip" t WHERE t."vehicleId" = v."id" AND t."status" = 'Completed'), 0) - (oc.total_fuel_cost + oc.total_maintenance_cost)) / NULLIF(v."acquisitionCost", 0))::numeric, 4) AS roi
FROM "Vehicle" v
JOIN "vw_operational_cost" oc ON oc.vehicle_id = v."id";
