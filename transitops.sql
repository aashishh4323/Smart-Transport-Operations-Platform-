--
-- PostgreSQL database dump
--

\restrict yfSNxaV3AnGommR1C7nMv7e1zkmIzXaMPIHjebquhkeGNlgS1NJjUiAcsuOodju

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

-- Started on 2026-07-12 12:11:05

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 8 (class 2615 OID 17158)
-- Name: transitops; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA transitops;


ALTER SCHEMA transitops OWNER TO postgres;

--
-- TOC entry 3 (class 3079 OID 17053)
-- Name: citext; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS citext WITH SCHEMA public;


--
-- TOC entry 5370 (class 0 OID 0)
-- Dependencies: 3
-- Name: EXTENSION citext; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION citext IS 'data type for case-insensitive character strings';


--
-- TOC entry 2 (class 3079 OID 17015)
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- TOC entry 5371 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- TOC entry 966 (class 1247 OID 17182)
-- Name: driver_status; Type: TYPE; Schema: transitops; Owner: postgres
--

CREATE TYPE transitops.driver_status AS ENUM (
    'Available',
    'On Trip',
    'Off Duty',
    'Suspended'
);


ALTER TYPE transitops.driver_status OWNER TO postgres;

--
-- TOC entry 975 (class 1247 OID 17208)
-- Name: expense_type; Type: TYPE; Schema: transitops; Owner: postgres
--

CREATE TYPE transitops.expense_type AS ENUM (
    'Toll',
    'Maintenance',
    'Parking',
    'Fine',
    'Other'
);


ALTER TYPE transitops.expense_type OWNER TO postgres;

--
-- TOC entry 972 (class 1247 OID 17202)
-- Name: maintenance_status; Type: TYPE; Schema: transitops; Owner: postgres
--

CREATE TYPE transitops.maintenance_status AS ENUM (
    'Active',
    'Closed'
);


ALTER TYPE transitops.maintenance_status OWNER TO postgres;

--
-- TOC entry 960 (class 1247 OID 17160)
-- Name: role_name; Type: TYPE; Schema: transitops; Owner: postgres
--

CREATE TYPE transitops.role_name AS ENUM (
    'Fleet Manager',
    'Driver',
    'Safety Officer',
    'Financial Analyst',
    'Admin'
);


ALTER TYPE transitops.role_name OWNER TO postgres;

--
-- TOC entry 969 (class 1247 OID 17192)
-- Name: trip_status; Type: TYPE; Schema: transitops; Owner: postgres
--

CREATE TYPE transitops.trip_status AS ENUM (
    'Draft',
    'Dispatched',
    'Completed',
    'Cancelled'
);


ALTER TYPE transitops.trip_status OWNER TO postgres;

--
-- TOC entry 963 (class 1247 OID 17172)
-- Name: vehicle_status; Type: TYPE; Schema: transitops; Owner: postgres
--

CREATE TYPE transitops.vehicle_status AS ENUM (
    'Available',
    'On Trip',
    'In Shop',
    'Retired'
);


ALTER TYPE transitops.vehicle_status OWNER TO postgres;

--
-- TOC entry 279 (class 1255 OID 17492)
-- Name: fn_audit_trigger(); Type: FUNCTION; Schema: transitops; Owner: postgres
--

CREATE FUNCTION transitops.fn_audit_trigger() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'transitops', 'public'
    AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log(table_name, row_id, action, new_data)
        VALUES (TG_TABLE_NAME, to_jsonb(NEW) ->> TG_ARGV[0], TG_OP, to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log(table_name, row_id, action, old_data, new_data)
        VALUES (TG_TABLE_NAME, to_jsonb(NEW) ->> TG_ARGV[0], TG_OP, to_jsonb(OLD), to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log(table_name, row_id, action, old_data)
        VALUES (TG_TABLE_NAME, to_jsonb(OLD) ->> TG_ARGV[0], TG_OP, to_jsonb(OLD));
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;


ALTER FUNCTION transitops.fn_audit_trigger() OWNER TO postgres;

--
-- TOC entry 286 (class 1255 OID 17504)
-- Name: fn_maintenance_status_guard(); Type: FUNCTION; Schema: transitops; Owner: postgres
--

CREATE FUNCTION transitops.fn_maintenance_status_guard() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'transitops', 'public'
    AS $$
DECLARE
    v_vehicle vehicles%ROWTYPE;
BEGIN
    SELECT * INTO v_vehicle FROM vehicles WHERE vehicle_id = NEW.vehicle_id FOR UPDATE;
    IF v_vehicle IS NULL THEN
        RAISE EXCEPTION 'Vehicle % does not exist', NEW.vehicle_id;
    END IF;
 
    IF TG_OP = 'INSERT' AND NEW.status = 'Active' THEN
        IF v_vehicle.status = 'On Trip' THEN
            RAISE EXCEPTION 'Cannot open maintenance while vehicle % is On Trip', v_vehicle.registration_number;
        END IF;
        UPDATE vehicles SET status = 'In Shop' WHERE vehicle_id = NEW.vehicle_id;
    END IF;
 
    IF TG_OP = 'UPDATE' AND NEW.status = 'Closed' AND OLD.status = 'Active' THEN
        NEW.closed_at := now();
        IF v_vehicle.status <> 'Retired' THEN
            UPDATE vehicles SET status = 'Available' WHERE vehicle_id = NEW.vehicle_id;
        END IF;
    END IF;
 
    RETURN NEW;
END;
$$;


ALTER FUNCTION transitops.fn_maintenance_status_guard() OWNER TO postgres;

--
-- TOC entry 291 (class 1255 OID 17497)
-- Name: fn_touch_updated_at(); Type: FUNCTION; Schema: transitops; Owner: postgres
--

CREATE FUNCTION transitops.fn_touch_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'transitops', 'public'
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION transitops.fn_touch_updated_at() OWNER TO postgres;

--
-- TOC entry 280 (class 1255 OID 17502)
-- Name: fn_trip_status_guard(); Type: FUNCTION; Schema: transitops; Owner: postgres
--

CREATE FUNCTION transitops.fn_trip_status_guard() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'transitops', 'public'
    AS $$
DECLARE
    v_vehicle vehicles%ROWTYPE;
    v_driver  drivers%ROWTYPE;
BEGIN
    SELECT * INTO v_vehicle FROM vehicles WHERE vehicle_id = NEW.vehicle_id FOR UPDATE;
    SELECT * INTO v_driver  FROM drivers  WHERE driver_id  = NEW.driver_id  FOR UPDATE;
 
    IF v_vehicle IS NULL THEN
        RAISE EXCEPTION 'Vehicle % does not exist', NEW.vehicle_id;
    END IF;
    IF v_driver IS NULL THEN
        RAISE EXCEPTION 'Driver % does not exist', NEW.driver_id;
    END IF;
 
    -- Rule: Cargo Weight must not exceed vehicle max load capacity.
    IF NEW.cargo_weight_kg > v_vehicle.max_load_capacity_kg THEN
        RAISE EXCEPTION 'Cargo weight % kg exceeds vehicle max load capacity % kg',
            NEW.cargo_weight_kg, v_vehicle.max_load_capacity_kg;
    END IF;
 
    -- Rule: Retired or In Shop vehicles never appear in dispatch selection.
    -- Rule: Drivers with expired license or Suspended status cannot be assigned.
    -- Rule: A driver/vehicle already On Trip cannot be assigned to another trip.
    IF NEW.status = 'Dispatched' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'Dispatched') THEN
        IF v_vehicle.status NOT IN ('Available') THEN
            RAISE EXCEPTION 'Vehicle % is not available (status=%)', v_vehicle.registration_number, v_vehicle.status;
        END IF;
        IF v_driver.status NOT IN ('Available') THEN
            RAISE EXCEPTION 'Driver % is not available (status=%)', v_driver.name, v_driver.status;
        END IF;
        IF v_driver.license_expiry_date < CURRENT_DATE THEN
            RAISE EXCEPTION 'Driver % license expired on %', v_driver.name, v_driver.license_expiry_date;
        END IF;
 
        -- Dispatching automatically flips both vehicle & driver to On Trip.
        UPDATE vehicles SET status = 'On Trip' WHERE vehicle_id = NEW.vehicle_id;
        UPDATE drivers  SET status = 'On Trip' WHERE driver_id  = NEW.driver_id;
        NEW.dispatched_at := now();
    END IF;
 
    -- Completing a trip -> both back to Available.
    IF NEW.status = 'Completed' AND OLD.status IS DISTINCT FROM 'Completed' THEN
        UPDATE vehicles SET status = 'Available', odometer_km = odometer_km + COALESCE(NEW.actual_distance_km, 0)
            WHERE vehicle_id = NEW.vehicle_id;
        UPDATE drivers SET status = 'Available' WHERE driver_id = NEW.driver_id;
        NEW.completed_at := now();
    END IF;
 
    -- Cancelling a DISPATCHED trip restores both to Available.
    -- (Cancelling a Draft trip never touched their status, so nothing to restore.)
    IF NEW.status = 'Cancelled' AND OLD.status = 'Dispatched' THEN
        UPDATE vehicles SET status = 'Available' WHERE vehicle_id = NEW.vehicle_id;
        UPDATE drivers  SET status = 'Available' WHERE driver_id  = NEW.driver_id;
        NEW.cancelled_at := now();
    END IF;
 
    RETURN NEW;
END;
$$;


ALTER FUNCTION transitops.fn_trip_status_guard() OWNER TO postgres;

--
-- TOC entry 259 (class 1255 OID 17506)
-- Name: fn_vehicle_registration_immutable(); Type: FUNCTION; Schema: transitops; Owner: postgres
--

CREATE FUNCTION transitops.fn_vehicle_registration_immutable() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'transitops', 'public'
    AS $$
BEGIN
    IF NEW.registration_number <> OLD.registration_number THEN
        RAISE EXCEPTION 'Registration number is immutable once created';
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION transitops.fn_vehicle_registration_immutable() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 232 (class 1259 OID 17472)
-- Name: audit_log; Type: TABLE; Schema: transitops; Owner: postgres
--

CREATE TABLE transitops.audit_log (
    audit_id bigint NOT NULL,
    table_name text NOT NULL,
    row_id text NOT NULL,
    action text NOT NULL,
    changed_by uuid,
    changed_at timestamp with time zone DEFAULT now() NOT NULL,
    old_data jsonb,
    new_data jsonb,
    CONSTRAINT audit_log_action_check CHECK ((action = ANY (ARRAY['INSERT'::text, 'UPDATE'::text, 'DELETE'::text])))
);


ALTER TABLE transitops.audit_log OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 17471)
-- Name: audit_log_audit_id_seq; Type: SEQUENCE; Schema: transitops; Owner: postgres
--

CREATE SEQUENCE transitops.audit_log_audit_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE transitops.audit_log_audit_id_seq OWNER TO postgres;

--
-- TOC entry 5373 (class 0 OID 0)
-- Dependencies: 231
-- Name: audit_log_audit_id_seq; Type: SEQUENCE OWNED BY; Schema: transitops; Owner: postgres
--

ALTER SEQUENCE transitops.audit_log_audit_id_seq OWNED BY transitops.audit_log.audit_id;


--
-- TOC entry 226 (class 1259 OID 17291)
-- Name: drivers; Type: TABLE; Schema: transitops; Owner: postgres
--

CREATE TABLE transitops.drivers (
    driver_id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    name text NOT NULL,
    license_number text NOT NULL,
    license_category text NOT NULL,
    license_expiry_date date NOT NULL,
    contact_number text NOT NULL,
    safety_score numeric(5,2) DEFAULT 100 NOT NULL,
    status transitops.driver_status DEFAULT 'Available'::transitops.driver_status NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT drivers_safety_score_check CHECK (((safety_score >= (0)::numeric) AND (safety_score <= (100)::numeric)))
);


ALTER TABLE transitops.drivers OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 17436)
-- Name: expenses; Type: TABLE; Schema: transitops; Owner: postgres
--

CREATE TABLE transitops.expenses (
    expense_id uuid DEFAULT gen_random_uuid() NOT NULL,
    vehicle_id uuid NOT NULL,
    trip_id uuid,
    type transitops.expense_type DEFAULT 'Other'::transitops.expense_type NOT NULL,
    amount numeric(14,2) NOT NULL,
    expense_date date DEFAULT CURRENT_DATE NOT NULL,
    description text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT expenses_amount_check CHECK ((amount >= (0)::numeric))
);


ALTER TABLE transitops.expenses OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 17403)
-- Name: fuel_logs; Type: TABLE; Schema: transitops; Owner: postgres
--

CREATE TABLE transitops.fuel_logs (
    fuel_log_id uuid DEFAULT gen_random_uuid() NOT NULL,
    vehicle_id uuid NOT NULL,
    trip_id uuid,
    liters numeric(10,2) NOT NULL,
    cost numeric(14,2) NOT NULL,
    log_date date DEFAULT CURRENT_DATE NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT fuel_logs_cost_check CHECK ((cost >= (0)::numeric)),
    CONSTRAINT fuel_logs_liters_check CHECK ((liters > (0)::numeric))
);


ALTER TABLE transitops.fuel_logs OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 17371)
-- Name: maintenance_logs; Type: TABLE; Schema: transitops; Owner: postgres
--

CREATE TABLE transitops.maintenance_logs (
    maintenance_id uuid DEFAULT gen_random_uuid() NOT NULL,
    vehicle_id uuid NOT NULL,
    description text NOT NULL,
    cost numeric(14,2) DEFAULT 0 NOT NULL,
    status transitops.maintenance_status DEFAULT 'Active'::transitops.maintenance_status NOT NULL,
    opened_at timestamp with time zone DEFAULT now() NOT NULL,
    closed_at timestamp with time zone,
    created_by uuid,
    CONSTRAINT chk_closed_after_opened CHECK (((closed_at IS NULL) OR (closed_at >= opened_at))),
    CONSTRAINT maintenance_logs_cost_check CHECK ((cost >= (0)::numeric))
);


ALTER TABLE transitops.maintenance_logs OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 17220)
-- Name: roles; Type: TABLE; Schema: transitops; Owner: postgres
--

CREATE TABLE transitops.roles (
    role_id smallint NOT NULL,
    name transitops.role_name NOT NULL,
    description text
);


ALTER TABLE transitops.roles OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 17219)
-- Name: roles_role_id_seq; Type: SEQUENCE; Schema: transitops; Owner: postgres
--

CREATE SEQUENCE transitops.roles_role_id_seq
    AS smallint
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE transitops.roles_role_id_seq OWNER TO postgres;

--
-- TOC entry 5380 (class 0 OID 0)
-- Dependencies: 222
-- Name: roles_role_id_seq; Type: SEQUENCE OWNED BY; Schema: transitops; Owner: postgres
--

ALTER SEQUENCE transitops.roles_role_id_seq OWNED BY transitops.roles.role_id;


--
-- TOC entry 227 (class 1259 OID 17323)
-- Name: trips; Type: TABLE; Schema: transitops; Owner: postgres
--

CREATE TABLE transitops.trips (
    trip_id uuid DEFAULT gen_random_uuid() NOT NULL,
    source text NOT NULL,
    destination text NOT NULL,
    vehicle_id uuid NOT NULL,
    driver_id uuid NOT NULL,
    cargo_weight_kg numeric(10,2) NOT NULL,
    planned_distance_km numeric(10,2) NOT NULL,
    actual_distance_km numeric(10,2),
    fuel_consumed_liters numeric(10,2),
    revenue numeric(14,2) DEFAULT 0,
    status transitops.trip_status DEFAULT 'Draft'::transitops.trip_status NOT NULL,
    created_by uuid,
    dispatched_at timestamp with time zone,
    completed_at timestamp with time zone,
    cancelled_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_cargo_positive CHECK ((cargo_weight_kg > (0)::numeric)),
    CONSTRAINT trips_actual_distance_km_check CHECK ((actual_distance_km >= (0)::numeric)),
    CONSTRAINT trips_cargo_weight_kg_check CHECK ((cargo_weight_kg > (0)::numeric)),
    CONSTRAINT trips_fuel_consumed_liters_check CHECK ((fuel_consumed_liters >= (0)::numeric)),
    CONSTRAINT trips_planned_distance_km_check CHECK ((planned_distance_km > (0)::numeric)),
    CONSTRAINT trips_revenue_check CHECK ((revenue >= (0)::numeric))
);


ALTER TABLE transitops.trips OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 17232)
-- Name: users; Type: TABLE; Schema: transitops; Owner: postgres
--

CREATE TABLE transitops.users (
    user_id uuid DEFAULT gen_random_uuid() NOT NULL,
    email public.citext NOT NULL,
    full_name text NOT NULL,
    password_hash text NOT NULL,
    role_id smallint NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    failed_login_attempts smallint DEFAULT 0 NOT NULL,
    locked_until timestamp with time zone,
    last_login_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT users_email_check CHECK ((email OPERATOR(public.~*) '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::public.citext))
);


ALTER TABLE transitops.users OWNER TO postgres;

--
-- TOC entry 5383 (class 0 OID 0)
-- Dependencies: 224
-- Name: COLUMN users.password_hash; Type: COMMENT; Schema: transitops; Owner: postgres
--

COMMENT ON COLUMN transitops.users.password_hash IS 'bcrypt hash via pgcrypto crypt()/gen_salt(''bf'',12). App layer must never send plaintext to be stored raw.';


--
-- TOC entry 225 (class 1259 OID 17261)
-- Name: vehicles; Type: TABLE; Schema: transitops; Owner: postgres
--

CREATE TABLE transitops.vehicles (
    vehicle_id uuid DEFAULT gen_random_uuid() NOT NULL,
    registration_number text NOT NULL,
    name_model text NOT NULL,
    type text NOT NULL,
    max_load_capacity_kg numeric(10,2) NOT NULL,
    odometer_km numeric(12,2) DEFAULT 0 NOT NULL,
    acquisition_cost numeric(14,2) NOT NULL,
    region text,
    status transitops.vehicle_status DEFAULT 'Available'::transitops.vehicle_status NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT vehicles_acquisition_cost_check CHECK ((acquisition_cost >= (0)::numeric)),
    CONSTRAINT vehicles_max_load_capacity_kg_check CHECK ((max_load_capacity_kg > (0)::numeric)),
    CONSTRAINT vehicles_odometer_km_check CHECK ((odometer_km >= (0)::numeric))
);


ALTER TABLE transitops.vehicles OWNER TO postgres;

--
-- TOC entry 234 (class 1259 OID 17513)
-- Name: vw_fleet_utilization; Type: VIEW; Schema: transitops; Owner: postgres
--

CREATE VIEW transitops.vw_fleet_utilization AS
 SELECT round(((100.0 * (count(*) FILTER (WHERE (status = 'On Trip'::transitops.vehicle_status)))::numeric) / (NULLIF(count(*) FILTER (WHERE (status <> 'Retired'::transitops.vehicle_status)), 0))::numeric), 2) AS fleet_utilization_pct
   FROM transitops.vehicles;


ALTER VIEW transitops.vw_fleet_utilization OWNER TO postgres;

--
-- TOC entry 237 (class 1259 OID 17527)
-- Name: vw_dashboard_kpis; Type: VIEW; Schema: transitops; Owner: postgres
--

CREATE VIEW transitops.vw_dashboard_kpis AS
 SELECT ( SELECT count(*) AS count
           FROM transitops.vehicles
          WHERE (vehicles.status <> 'Retired'::transitops.vehicle_status)) AS active_vehicles,
    ( SELECT count(*) AS count
           FROM transitops.vehicles
          WHERE (vehicles.status = 'Available'::transitops.vehicle_status)) AS available_vehicles,
    ( SELECT count(*) AS count
           FROM transitops.vehicles
          WHERE (vehicles.status = 'In Shop'::transitops.vehicle_status)) AS vehicles_in_maintenance,
    ( SELECT count(*) AS count
           FROM transitops.trips
          WHERE (trips.status = 'Dispatched'::transitops.trip_status)) AS active_trips,
    ( SELECT count(*) AS count
           FROM transitops.trips
          WHERE (trips.status = 'Draft'::transitops.trip_status)) AS pending_trips,
    ( SELECT count(*) AS count
           FROM transitops.drivers
          WHERE (drivers.status = 'On Trip'::transitops.driver_status)) AS drivers_on_duty,
    ( SELECT vw_fleet_utilization.fleet_utilization_pct
           FROM transitops.vw_fleet_utilization) AS fleet_utilization_pct;


ALTER VIEW transitops.vw_dashboard_kpis OWNER TO postgres;

--
-- TOC entry 238 (class 1259 OID 17532)
-- Name: vw_expiring_licenses; Type: VIEW; Schema: transitops; Owner: postgres
--

CREATE VIEW transitops.vw_expiring_licenses AS
 SELECT driver_id,
    name,
    license_number,
    license_expiry_date,
    (license_expiry_date - CURRENT_DATE) AS days_remaining
   FROM transitops.drivers
  WHERE (license_expiry_date <= (CURRENT_DATE + '30 days'::interval))
  ORDER BY license_expiry_date;


ALTER VIEW transitops.vw_expiring_licenses OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 17508)
-- Name: vw_fuel_efficiency; Type: VIEW; Schema: transitops; Owner: postgres
--

CREATE VIEW transitops.vw_fuel_efficiency AS
 SELECT v.vehicle_id,
    v.registration_number,
    COALESCE(sum(t.actual_distance_km), (0)::numeric) AS total_distance_km,
    COALESCE(sum(f.liters), (0)::numeric) AS total_fuel_liters,
    round((COALESCE(sum(t.actual_distance_km), (0)::numeric) / NULLIF(COALESCE(sum(f.liters), (0)::numeric), (0)::numeric)), 2) AS km_per_liter
   FROM ((transitops.vehicles v
     LEFT JOIN transitops.trips t ON (((t.vehicle_id = v.vehicle_id) AND (t.status = 'Completed'::transitops.trip_status))))
     LEFT JOIN transitops.fuel_logs f ON ((f.vehicle_id = v.vehicle_id)))
  GROUP BY v.vehicle_id, v.registration_number;


ALTER VIEW transitops.vw_fuel_efficiency OWNER TO postgres;

--
-- TOC entry 235 (class 1259 OID 17517)
-- Name: vw_operational_cost; Type: VIEW; Schema: transitops; Owner: postgres
--

CREATE VIEW transitops.vw_operational_cost AS
 SELECT vehicle_id,
    registration_number,
    COALESCE(( SELECT sum(f.cost) AS sum
           FROM transitops.fuel_logs f
          WHERE (f.vehicle_id = v.vehicle_id)), (0)::numeric) AS total_fuel_cost,
    COALESCE(( SELECT sum(m.cost) AS sum
           FROM transitops.maintenance_logs m
          WHERE (m.vehicle_id = v.vehicle_id)), (0)::numeric) AS total_maintenance_cost,
    COALESCE(( SELECT sum(e.amount) AS sum
           FROM transitops.expenses e
          WHERE (e.vehicle_id = v.vehicle_id)), (0)::numeric) AS total_other_expenses,
    ((COALESCE(( SELECT sum(f.cost) AS sum
           FROM transitops.fuel_logs f
          WHERE (f.vehicle_id = v.vehicle_id)), (0)::numeric) + COALESCE(( SELECT sum(m.cost) AS sum
           FROM transitops.maintenance_logs m
          WHERE (m.vehicle_id = v.vehicle_id)), (0)::numeric)) + COALESCE(( SELECT sum(e.amount) AS sum
           FROM transitops.expenses e
          WHERE (e.vehicle_id = v.vehicle_id)), (0)::numeric)) AS total_operational_cost
   FROM transitops.vehicles v;


ALTER VIEW transitops.vw_operational_cost OWNER TO postgres;

--
-- TOC entry 236 (class 1259 OID 17522)
-- Name: vw_vehicle_roi; Type: VIEW; Schema: transitops; Owner: postgres
--

CREATE VIEW transitops.vw_vehicle_roi AS
 SELECT v.vehicle_id,
    v.registration_number,
    v.acquisition_cost,
    COALESCE(( SELECT sum(t.revenue) AS sum
           FROM transitops.trips t
          WHERE ((t.vehicle_id = v.vehicle_id) AND (t.status = 'Completed'::transitops.trip_status))), (0)::numeric) AS total_revenue,
    oc.total_fuel_cost,
    oc.total_maintenance_cost,
    round(((COALESCE(( SELECT sum(t.revenue) AS sum
           FROM transitops.trips t
          WHERE ((t.vehicle_id = v.vehicle_id) AND (t.status = 'Completed'::transitops.trip_status))), (0)::numeric) - (oc.total_fuel_cost + oc.total_maintenance_cost)) / NULLIF(v.acquisition_cost, (0)::numeric)), 4) AS roi
   FROM (transitops.vehicles v
     JOIN transitops.vw_operational_cost oc ON ((oc.vehicle_id = v.vehicle_id)));


ALTER VIEW transitops.vw_vehicle_roi OWNER TO postgres;

--
-- TOC entry 5098 (class 2604 OID 17475)
-- Name: audit_log audit_id; Type: DEFAULT; Schema: transitops; Owner: postgres
--

ALTER TABLE ONLY transitops.audit_log ALTER COLUMN audit_id SET DEFAULT nextval('transitops.audit_log_audit_id_seq'::regclass);


--
-- TOC entry 5066 (class 2604 OID 17223)
-- Name: roles role_id; Type: DEFAULT; Schema: transitops; Owner: postgres
--

ALTER TABLE ONLY transitops.roles ALTER COLUMN role_id SET DEFAULT nextval('transitops.roles_role_id_seq'::regclass);


--
-- TOC entry 5363 (class 0 OID 17472)
-- Dependencies: 232
-- Data for Name: audit_log; Type: TABLE DATA; Schema: transitops; Owner: postgres
--

COPY transitops.audit_log (audit_id, table_name, row_id, action, changed_by, changed_at, old_data, new_data) FROM stdin;
1	vehicles	1d114c09-2ccf-4011-80d1-db984100bcf1	INSERT	\N	2026-07-12 11:49:07.740026+05:30	\N	{"type": "Van", "region": "East", "status": "Available", "created_at": "2026-07-12T11:49:07.740026+05:30", "name_model": "Tata Ace", "updated_at": "2026-07-12T11:49:07.740026+05:30", "vehicle_id": "1d114c09-2ccf-4011-80d1-db984100bcf1", "odometer_km": 0.00, "acquisition_cost": 850000.00, "registration_number": "Van-05", "max_load_capacity_kg": 500.00}
2	drivers	d442af83-8c47-4feb-8d77-4921480488fe	INSERT	\N	2026-07-12 11:49:07.787199+05:30	\N	{"name": "Alex", "status": "Available", "user_id": null, "driver_id": "d442af83-8c47-4feb-8d77-4921480488fe", "created_at": "2026-07-12T11:49:07.787199+05:30", "updated_at": "2026-07-12T11:49:07.787199+05:30", "safety_score": 95.00, "contact_number": "+91-9000000000", "license_number": "DL-ODI-2025-00123", "license_category": "LMV", "license_expiry_date": "2028-07-12"}
3	vehicles	1d114c09-2ccf-4011-80d1-db984100bcf1	UPDATE	\N	2026-07-12 11:49:07.808104+05:30	{"type": "Van", "region": "East", "status": "Available", "created_at": "2026-07-12T11:49:07.740026+05:30", "name_model": "Tata Ace", "updated_at": "2026-07-12T11:49:07.740026+05:30", "vehicle_id": "1d114c09-2ccf-4011-80d1-db984100bcf1", "odometer_km": 0.00, "acquisition_cost": 850000.00, "registration_number": "Van-05", "max_load_capacity_kg": 500.00}	{"type": "Van", "region": "East", "status": "On Trip", "created_at": "2026-07-12T11:49:07.740026+05:30", "name_model": "Tata Ace", "updated_at": "2026-07-12T11:49:07.808104+05:30", "vehicle_id": "1d114c09-2ccf-4011-80d1-db984100bcf1", "odometer_km": 0.00, "acquisition_cost": 850000.00, "registration_number": "Van-05", "max_load_capacity_kg": 500.00}
4	drivers	d442af83-8c47-4feb-8d77-4921480488fe	UPDATE	\N	2026-07-12 11:49:07.808104+05:30	{"name": "Alex", "status": "Available", "user_id": null, "driver_id": "d442af83-8c47-4feb-8d77-4921480488fe", "created_at": "2026-07-12T11:49:07.787199+05:30", "updated_at": "2026-07-12T11:49:07.787199+05:30", "safety_score": 95.00, "contact_number": "+91-9000000000", "license_number": "DL-ODI-2025-00123", "license_category": "LMV", "license_expiry_date": "2028-07-12"}	{"name": "Alex", "status": "On Trip", "user_id": null, "driver_id": "d442af83-8c47-4feb-8d77-4921480488fe", "created_at": "2026-07-12T11:49:07.787199+05:30", "updated_at": "2026-07-12T11:49:07.808104+05:30", "safety_score": 95.00, "contact_number": "+91-9000000000", "license_number": "DL-ODI-2025-00123", "license_category": "LMV", "license_expiry_date": "2028-07-12"}
5	trips	8b2d271d-21df-44a5-8902-2f4fd881af1d	INSERT	\N	2026-07-12 11:49:07.808104+05:30	\N	{"source": "Berhampur", "status": "Dispatched", "revenue": 0.00, "trip_id": "8b2d271d-21df-44a5-8902-2f4fd881af1d", "driver_id": "d442af83-8c47-4feb-8d77-4921480488fe", "created_at": "2026-07-12T11:49:07.808104+05:30", "created_by": null, "updated_at": "2026-07-12T11:49:07.808104+05:30", "vehicle_id": "1d114c09-2ccf-4011-80d1-db984100bcf1", "destination": "Bhubaneswar", "cancelled_at": null, "completed_at": null, "dispatched_at": "2026-07-12T11:49:07.808104+05:30", "cargo_weight_kg": 450.00, "actual_distance_km": null, "planned_distance_km": 170.00, "fuel_consumed_liters": null}
\.


--
-- TOC entry 5357 (class 0 OID 17291)
-- Dependencies: 226
-- Data for Name: drivers; Type: TABLE DATA; Schema: transitops; Owner: postgres
--

COPY transitops.drivers (driver_id, user_id, name, license_number, license_category, license_expiry_date, contact_number, safety_score, status, created_at, updated_at) FROM stdin;
d442af83-8c47-4feb-8d77-4921480488fe	\N	Alex	DL-ODI-2025-00123	LMV	2028-07-12	+91-9000000000	95.00	On Trip	2026-07-12 11:49:07.787199+05:30	2026-07-12 11:49:07.808104+05:30
\.


--
-- TOC entry 5361 (class 0 OID 17436)
-- Dependencies: 230
-- Data for Name: expenses; Type: TABLE DATA; Schema: transitops; Owner: postgres
--

COPY transitops.expenses (expense_id, vehicle_id, trip_id, type, amount, expense_date, description, created_by, created_at) FROM stdin;
\.


--
-- TOC entry 5360 (class 0 OID 17403)
-- Dependencies: 229
-- Data for Name: fuel_logs; Type: TABLE DATA; Schema: transitops; Owner: postgres
--

COPY transitops.fuel_logs (fuel_log_id, vehicle_id, trip_id, liters, cost, log_date, created_by, created_at) FROM stdin;
\.


--
-- TOC entry 5359 (class 0 OID 17371)
-- Dependencies: 228
-- Data for Name: maintenance_logs; Type: TABLE DATA; Schema: transitops; Owner: postgres
--

COPY transitops.maintenance_logs (maintenance_id, vehicle_id, description, cost, status, opened_at, closed_at, created_by) FROM stdin;
\.


--
-- TOC entry 5354 (class 0 OID 17220)
-- Dependencies: 223
-- Data for Name: roles; Type: TABLE DATA; Schema: transitops; Owner: postgres
--

COPY transitops.roles (role_id, name, description) FROM stdin;
1	Fleet Manager	Oversees fleet assets, maintenance, vehicle lifecycle, and operational efficiency.
2	Driver	Creates trips, assigns vehicles and drivers, monitors active deliveries.
3	Safety Officer	Ensures driver compliance, tracks license validity, monitors safety scores.
4	Financial Analyst	Reviews operational expenses, fuel consumption, maintenance costs, profitability.
5	Admin	Full system access for user & role administration.
\.


--
-- TOC entry 5358 (class 0 OID 17323)
-- Dependencies: 227
-- Data for Name: trips; Type: TABLE DATA; Schema: transitops; Owner: postgres
--

COPY transitops.trips (trip_id, source, destination, vehicle_id, driver_id, cargo_weight_kg, planned_distance_km, actual_distance_km, fuel_consumed_liters, revenue, status, created_by, dispatched_at, completed_at, cancelled_at, created_at, updated_at) FROM stdin;
8b2d271d-21df-44a5-8902-2f4fd881af1d	Berhampur	Bhubaneswar	1d114c09-2ccf-4011-80d1-db984100bcf1	d442af83-8c47-4feb-8d77-4921480488fe	450.00	170.00	\N	\N	0.00	Dispatched	\N	2026-07-12 11:49:07.808104+05:30	\N	\N	2026-07-12 11:49:07.808104+05:30	2026-07-12 11:49:07.808104+05:30
\.


--
-- TOC entry 5355 (class 0 OID 17232)
-- Dependencies: 224
-- Data for Name: users; Type: TABLE DATA; Schema: transitops; Owner: postgres
--

COPY transitops.users (user_id, email, full_name, password_hash, role_id, is_active, failed_login_attempts, locked_until, last_login_at, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5356 (class 0 OID 17261)
-- Dependencies: 225
-- Data for Name: vehicles; Type: TABLE DATA; Schema: transitops; Owner: postgres
--

COPY transitops.vehicles (vehicle_id, registration_number, name_model, type, max_load_capacity_kg, odometer_km, acquisition_cost, region, status, created_at, updated_at) FROM stdin;
1d114c09-2ccf-4011-80d1-db984100bcf1	Van-05	Tata Ace	Van	500.00	0.00	850000.00	East	On Trip	2026-07-12 11:49:07.740026+05:30	2026-07-12 11:49:07.808104+05:30
\.


--
-- TOC entry 5392 (class 0 OID 0)
-- Dependencies: 231
-- Name: audit_log_audit_id_seq; Type: SEQUENCE SET; Schema: transitops; Owner: postgres
--

SELECT pg_catalog.setval('transitops.audit_log_audit_id_seq', 5, true);


--
-- TOC entry 5393 (class 0 OID 0)
-- Dependencies: 222
-- Name: roles_role_id_seq; Type: SEQUENCE SET; Schema: transitops; Owner: postgres
--

SELECT pg_catalog.setval('transitops.roles_role_id_seq', 5, true);


--
-- TOC entry 5159 (class 2606 OID 17486)
-- Name: audit_log audit_log_pkey; Type: CONSTRAINT; Schema: transitops; Owner: postgres
--

ALTER TABLE ONLY transitops.audit_log
    ADD CONSTRAINT audit_log_pkey PRIMARY KEY (audit_id);


--
-- TOC entry 5133 (class 2606 OID 17315)
-- Name: drivers drivers_license_number_key; Type: CONSTRAINT; Schema: transitops; Owner: postgres
--

ALTER TABLE ONLY transitops.drivers
    ADD CONSTRAINT drivers_license_number_key UNIQUE (license_number);


--
-- TOC entry 5135 (class 2606 OID 17313)
-- Name: drivers drivers_pkey; Type: CONSTRAINT; Schema: transitops; Owner: postgres
--

ALTER TABLE ONLY transitops.drivers
    ADD CONSTRAINT drivers_pkey PRIMARY KEY (driver_id);


--
-- TOC entry 5155 (class 2606 OID 17453)
-- Name: expenses expenses_pkey; Type: CONSTRAINT; Schema: transitops; Owner: postgres
--

ALTER TABLE ONLY transitops.expenses
    ADD CONSTRAINT expenses_pkey PRIMARY KEY (expense_id);


--
-- TOC entry 5151 (class 2606 OID 17418)
-- Name: fuel_logs fuel_logs_pkey; Type: CONSTRAINT; Schema: transitops; Owner: postgres
--

ALTER TABLE ONLY transitops.fuel_logs
    ADD CONSTRAINT fuel_logs_pkey PRIMARY KEY (fuel_log_id);


--
-- TOC entry 5148 (class 2606 OID 17389)
-- Name: maintenance_logs maintenance_logs_pkey; Type: CONSTRAINT; Schema: transitops; Owner: postgres
--

ALTER TABLE ONLY transitops.maintenance_logs
    ADD CONSTRAINT maintenance_logs_pkey PRIMARY KEY (maintenance_id);


--
-- TOC entry 5118 (class 2606 OID 17231)
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: transitops; Owner: postgres
--

ALTER TABLE ONLY transitops.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- TOC entry 5120 (class 2606 OID 17229)
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: transitops; Owner: postgres
--

ALTER TABLE ONLY transitops.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (role_id);


--
-- TOC entry 5142 (class 2606 OID 17350)
-- Name: trips trips_pkey; Type: CONSTRAINT; Schema: transitops; Owner: postgres
--

ALTER TABLE ONLY transitops.trips
    ADD CONSTRAINT trips_pkey PRIMARY KEY (trip_id);


--
-- TOC entry 5122 (class 2606 OID 17255)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: transitops; Owner: postgres
--

ALTER TABLE ONLY transitops.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 5124 (class 2606 OID 17253)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: transitops; Owner: postgres
--

ALTER TABLE ONLY transitops.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- TOC entry 5129 (class 2606 OID 17285)
-- Name: vehicles vehicles_pkey; Type: CONSTRAINT; Schema: transitops; Owner: postgres
--

ALTER TABLE ONLY transitops.vehicles
    ADD CONSTRAINT vehicles_pkey PRIMARY KEY (vehicle_id);


--
-- TOC entry 5131 (class 2606 OID 17287)
-- Name: vehicles vehicles_registration_number_key; Type: CONSTRAINT; Schema: transitops; Owner: postgres
--

ALTER TABLE ONLY transitops.vehicles
    ADD CONSTRAINT vehicles_registration_number_key UNIQUE (registration_number);


--
-- TOC entry 5136 (class 1259 OID 17322)
-- Name: idx_drivers_expiry; Type: INDEX; Schema: transitops; Owner: postgres
--

CREATE INDEX idx_drivers_expiry ON transitops.drivers USING btree (license_expiry_date);


--
-- TOC entry 5137 (class 1259 OID 17321)
-- Name: idx_drivers_status; Type: INDEX; Schema: transitops; Owner: postgres
--

CREATE INDEX idx_drivers_status ON transitops.drivers USING btree (status);


--
-- TOC entry 5156 (class 1259 OID 17470)
-- Name: idx_expenses_date; Type: INDEX; Schema: transitops; Owner: postgres
--

CREATE INDEX idx_expenses_date ON transitops.expenses USING btree (expense_date);


--
-- TOC entry 5157 (class 1259 OID 17469)
-- Name: idx_expenses_vehicle; Type: INDEX; Schema: transitops; Owner: postgres
--

CREATE INDEX idx_expenses_vehicle ON transitops.expenses USING btree (vehicle_id);


--
-- TOC entry 5152 (class 1259 OID 17435)
-- Name: idx_fuel_logs_date; Type: INDEX; Schema: transitops; Owner: postgres
--

CREATE INDEX idx_fuel_logs_date ON transitops.fuel_logs USING btree (log_date);


--
-- TOC entry 5153 (class 1259 OID 17434)
-- Name: idx_fuel_logs_vehicle; Type: INDEX; Schema: transitops; Owner: postgres
--

CREATE INDEX idx_fuel_logs_vehicle ON transitops.fuel_logs USING btree (vehicle_id);


--
-- TOC entry 5145 (class 1259 OID 17401)
-- Name: idx_maintenance_status; Type: INDEX; Schema: transitops; Owner: postgres
--

CREATE INDEX idx_maintenance_status ON transitops.maintenance_logs USING btree (status);


--
-- TOC entry 5146 (class 1259 OID 17400)
-- Name: idx_maintenance_vehicle; Type: INDEX; Schema: transitops; Owner: postgres
--

CREATE INDEX idx_maintenance_vehicle ON transitops.maintenance_logs USING btree (vehicle_id);


--
-- TOC entry 5138 (class 1259 OID 17368)
-- Name: idx_trips_driver; Type: INDEX; Schema: transitops; Owner: postgres
--

CREATE INDEX idx_trips_driver ON transitops.trips USING btree (driver_id);


--
-- TOC entry 5139 (class 1259 OID 17366)
-- Name: idx_trips_status; Type: INDEX; Schema: transitops; Owner: postgres
--

CREATE INDEX idx_trips_status ON transitops.trips USING btree (status);


--
-- TOC entry 5140 (class 1259 OID 17367)
-- Name: idx_trips_vehicle; Type: INDEX; Schema: transitops; Owner: postgres
--

CREATE INDEX idx_trips_vehicle ON transitops.trips USING btree (vehicle_id);


--
-- TOC entry 5125 (class 1259 OID 17290)
-- Name: idx_vehicles_region; Type: INDEX; Schema: transitops; Owner: postgres
--

CREATE INDEX idx_vehicles_region ON transitops.vehicles USING btree (region);


--
-- TOC entry 5126 (class 1259 OID 17288)
-- Name: idx_vehicles_status; Type: INDEX; Schema: transitops; Owner: postgres
--

CREATE INDEX idx_vehicles_status ON transitops.vehicles USING btree (status);


--
-- TOC entry 5127 (class 1259 OID 17289)
-- Name: idx_vehicles_type; Type: INDEX; Schema: transitops; Owner: postgres
--

CREATE INDEX idx_vehicles_type ON transitops.vehicles USING btree (type);


--
-- TOC entry 5149 (class 1259 OID 17402)
-- Name: uq_one_active_maintenance_per_vehicle; Type: INDEX; Schema: transitops; Owner: postgres
--

CREATE UNIQUE INDEX uq_one_active_maintenance_per_vehicle ON transitops.maintenance_logs USING btree (vehicle_id) WHERE (status = 'Active'::transitops.maintenance_status);


--
-- TOC entry 5143 (class 1259 OID 17370)
-- Name: uq_one_active_trip_per_driver; Type: INDEX; Schema: transitops; Owner: postgres
--

CREATE UNIQUE INDEX uq_one_active_trip_per_driver ON transitops.trips USING btree (driver_id) WHERE (status = 'Dispatched'::transitops.trip_status);


--
-- TOC entry 5144 (class 1259 OID 17369)
-- Name: uq_one_active_trip_per_vehicle; Type: INDEX; Schema: transitops; Owner: postgres
--

CREATE UNIQUE INDEX uq_one_active_trip_per_vehicle ON transitops.trips USING btree (vehicle_id) WHERE (status = 'Dispatched'::transitops.trip_status);


--
-- TOC entry 5178 (class 2620 OID 17494)
-- Name: drivers trg_audit_drivers; Type: TRIGGER; Schema: transitops; Owner: postgres
--

CREATE TRIGGER trg_audit_drivers AFTER INSERT OR DELETE OR UPDATE ON transitops.drivers FOR EACH ROW EXECUTE FUNCTION transitops.fn_audit_trigger('driver_id');


--
-- TOC entry 5183 (class 2620 OID 17496)
-- Name: maintenance_logs trg_audit_maintenance; Type: TRIGGER; Schema: transitops; Owner: postgres
--

CREATE TRIGGER trg_audit_maintenance AFTER INSERT OR DELETE OR UPDATE ON transitops.maintenance_logs FOR EACH ROW EXECUTE FUNCTION transitops.fn_audit_trigger('maintenance_id');


--
-- TOC entry 5180 (class 2620 OID 17495)
-- Name: trips trg_audit_trips; Type: TRIGGER; Schema: transitops; Owner: postgres
--

CREATE TRIGGER trg_audit_trips AFTER INSERT OR DELETE OR UPDATE ON transitops.trips FOR EACH ROW EXECUTE FUNCTION transitops.fn_audit_trigger('trip_id');


--
-- TOC entry 5175 (class 2620 OID 17493)
-- Name: vehicles trg_audit_vehicles; Type: TRIGGER; Schema: transitops; Owner: postgres
--

CREATE TRIGGER trg_audit_vehicles AFTER INSERT OR DELETE OR UPDATE ON transitops.vehicles FOR EACH ROW EXECUTE FUNCTION transitops.fn_audit_trigger('vehicle_id');


--
-- TOC entry 5184 (class 2620 OID 17505)
-- Name: maintenance_logs trg_maintenance_status_guard; Type: TRIGGER; Schema: transitops; Owner: postgres
--

CREATE TRIGGER trg_maintenance_status_guard BEFORE INSERT OR UPDATE ON transitops.maintenance_logs FOR EACH ROW EXECUTE FUNCTION transitops.fn_maintenance_status_guard();


--
-- TOC entry 5179 (class 2620 OID 17500)
-- Name: drivers trg_touch_drivers; Type: TRIGGER; Schema: transitops; Owner: postgres
--

CREATE TRIGGER trg_touch_drivers BEFORE UPDATE ON transitops.drivers FOR EACH ROW EXECUTE FUNCTION transitops.fn_touch_updated_at();


--
-- TOC entry 5181 (class 2620 OID 17501)
-- Name: trips trg_touch_trips; Type: TRIGGER; Schema: transitops; Owner: postgres
--

CREATE TRIGGER trg_touch_trips BEFORE UPDATE ON transitops.trips FOR EACH ROW EXECUTE FUNCTION transitops.fn_touch_updated_at();


--
-- TOC entry 5174 (class 2620 OID 17498)
-- Name: users trg_touch_users; Type: TRIGGER; Schema: transitops; Owner: postgres
--

CREATE TRIGGER trg_touch_users BEFORE UPDATE ON transitops.users FOR EACH ROW EXECUTE FUNCTION transitops.fn_touch_updated_at();


--
-- TOC entry 5176 (class 2620 OID 17499)
-- Name: vehicles trg_touch_vehicles; Type: TRIGGER; Schema: transitops; Owner: postgres
--

CREATE TRIGGER trg_touch_vehicles BEFORE UPDATE ON transitops.vehicles FOR EACH ROW EXECUTE FUNCTION transitops.fn_touch_updated_at();


--
-- TOC entry 5182 (class 2620 OID 17503)
-- Name: trips trg_trip_status_guard; Type: TRIGGER; Schema: transitops; Owner: postgres
--

CREATE TRIGGER trg_trip_status_guard BEFORE INSERT OR UPDATE ON transitops.trips FOR EACH ROW EXECUTE FUNCTION transitops.fn_trip_status_guard();


--
-- TOC entry 5177 (class 2620 OID 17507)
-- Name: vehicles trg_vehicle_registration_immutable; Type: TRIGGER; Schema: transitops; Owner: postgres
--

CREATE TRIGGER trg_vehicle_registration_immutable BEFORE UPDATE ON transitops.vehicles FOR EACH ROW EXECUTE FUNCTION transitops.fn_vehicle_registration_immutable();


--
-- TOC entry 5173 (class 2606 OID 17487)
-- Name: audit_log audit_log_changed_by_fkey; Type: FK CONSTRAINT; Schema: transitops; Owner: postgres
--

ALTER TABLE ONLY transitops.audit_log
    ADD CONSTRAINT audit_log_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES transitops.users(user_id);


--
-- TOC entry 5161 (class 2606 OID 17316)
-- Name: drivers drivers_user_id_fkey; Type: FK CONSTRAINT; Schema: transitops; Owner: postgres
--

ALTER TABLE ONLY transitops.drivers
    ADD CONSTRAINT drivers_user_id_fkey FOREIGN KEY (user_id) REFERENCES transitops.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 5170 (class 2606 OID 17464)
-- Name: expenses expenses_created_by_fkey; Type: FK CONSTRAINT; Schema: transitops; Owner: postgres
--

ALTER TABLE ONLY transitops.expenses
    ADD CONSTRAINT expenses_created_by_fkey FOREIGN KEY (created_by) REFERENCES transitops.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 5171 (class 2606 OID 17459)
-- Name: expenses expenses_trip_id_fkey; Type: FK CONSTRAINT; Schema: transitops; Owner: postgres
--

ALTER TABLE ONLY transitops.expenses
    ADD CONSTRAINT expenses_trip_id_fkey FOREIGN KEY (trip_id) REFERENCES transitops.trips(trip_id) ON DELETE SET NULL;


--
-- TOC entry 5172 (class 2606 OID 17454)
-- Name: expenses expenses_vehicle_id_fkey; Type: FK CONSTRAINT; Schema: transitops; Owner: postgres
--

ALTER TABLE ONLY transitops.expenses
    ADD CONSTRAINT expenses_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES transitops.vehicles(vehicle_id) ON DELETE CASCADE;


--
-- TOC entry 5167 (class 2606 OID 17429)
-- Name: fuel_logs fuel_logs_created_by_fkey; Type: FK CONSTRAINT; Schema: transitops; Owner: postgres
--

ALTER TABLE ONLY transitops.fuel_logs
    ADD CONSTRAINT fuel_logs_created_by_fkey FOREIGN KEY (created_by) REFERENCES transitops.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 5168 (class 2606 OID 17424)
-- Name: fuel_logs fuel_logs_trip_id_fkey; Type: FK CONSTRAINT; Schema: transitops; Owner: postgres
--

ALTER TABLE ONLY transitops.fuel_logs
    ADD CONSTRAINT fuel_logs_trip_id_fkey FOREIGN KEY (trip_id) REFERENCES transitops.trips(trip_id) ON DELETE SET NULL;


--
-- TOC entry 5169 (class 2606 OID 17419)
-- Name: fuel_logs fuel_logs_vehicle_id_fkey; Type: FK CONSTRAINT; Schema: transitops; Owner: postgres
--

ALTER TABLE ONLY transitops.fuel_logs
    ADD CONSTRAINT fuel_logs_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES transitops.vehicles(vehicle_id) ON DELETE CASCADE;


--
-- TOC entry 5165 (class 2606 OID 17395)
-- Name: maintenance_logs maintenance_logs_created_by_fkey; Type: FK CONSTRAINT; Schema: transitops; Owner: postgres
--

ALTER TABLE ONLY transitops.maintenance_logs
    ADD CONSTRAINT maintenance_logs_created_by_fkey FOREIGN KEY (created_by) REFERENCES transitops.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 5166 (class 2606 OID 17390)
-- Name: maintenance_logs maintenance_logs_vehicle_id_fkey; Type: FK CONSTRAINT; Schema: transitops; Owner: postgres
--

ALTER TABLE ONLY transitops.maintenance_logs
    ADD CONSTRAINT maintenance_logs_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES transitops.vehicles(vehicle_id) ON DELETE CASCADE;


--
-- TOC entry 5162 (class 2606 OID 17361)
-- Name: trips trips_created_by_fkey; Type: FK CONSTRAINT; Schema: transitops; Owner: postgres
--

ALTER TABLE ONLY transitops.trips
    ADD CONSTRAINT trips_created_by_fkey FOREIGN KEY (created_by) REFERENCES transitops.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 5163 (class 2606 OID 17356)
-- Name: trips trips_driver_id_fkey; Type: FK CONSTRAINT; Schema: transitops; Owner: postgres
--

ALTER TABLE ONLY transitops.trips
    ADD CONSTRAINT trips_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES transitops.drivers(driver_id) ON DELETE RESTRICT;


--
-- TOC entry 5164 (class 2606 OID 17351)
-- Name: trips trips_vehicle_id_fkey; Type: FK CONSTRAINT; Schema: transitops; Owner: postgres
--

ALTER TABLE ONLY transitops.trips
    ADD CONSTRAINT trips_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES transitops.vehicles(vehicle_id) ON DELETE RESTRICT;


--
-- TOC entry 5160 (class 2606 OID 17256)
-- Name: users users_role_id_fkey; Type: FK CONSTRAINT; Schema: transitops; Owner: postgres
--

ALTER TABLE ONLY transitops.users
    ADD CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES transitops.roles(role_id) ON DELETE RESTRICT;


--
-- TOC entry 5339 (class 0 OID 17291)
-- Dependencies: 226
-- Name: drivers; Type: ROW SECURITY; Schema: transitops; Owner: postgres
--

ALTER TABLE transitops.drivers ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5343 (class 0 OID 17436)
-- Dependencies: 230
-- Name: expenses; Type: ROW SECURITY; Schema: transitops; Owner: postgres
--

ALTER TABLE transitops.expenses ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5342 (class 0 OID 17403)
-- Dependencies: 229
-- Name: fuel_logs; Type: ROW SECURITY; Schema: transitops; Owner: postgres
--

ALTER TABLE transitops.fuel_logs ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5341 (class 0 OID 17371)
-- Dependencies: 228
-- Name: maintenance_logs; Type: ROW SECURITY; Schema: transitops; Owner: postgres
--

ALTER TABLE transitops.maintenance_logs ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5344 (class 3256 OID 17537)
-- Name: vehicles pol_financial_read; Type: POLICY; Schema: transitops; Owner: postgres
--

CREATE POLICY pol_financial_read ON transitops.vehicles FOR SELECT USING ((current_setting('app.current_role'::text, true) IS NOT NULL));


--
-- TOC entry 5345 (class 3256 OID 17538)
-- Name: drivers pol_financial_read_drivers; Type: POLICY; Schema: transitops; Owner: postgres
--

CREATE POLICY pol_financial_read_drivers ON transitops.drivers FOR SELECT USING ((current_setting('app.current_role'::text, true) IS NOT NULL));


--
-- TOC entry 5346 (class 3256 OID 17539)
-- Name: trips pol_financial_read_trips; Type: POLICY; Schema: transitops; Owner: postgres
--

CREATE POLICY pol_financial_read_trips ON transitops.trips FOR SELECT USING ((current_setting('app.current_role'::text, true) IS NOT NULL));


--
-- TOC entry 5348 (class 3256 OID 17541)
-- Name: drivers pol_ops_write_drivers; Type: POLICY; Schema: transitops; Owner: postgres
--

CREATE POLICY pol_ops_write_drivers ON transitops.drivers USING ((current_setting('app.current_role'::text, true) = ANY (ARRAY['Fleet Manager'::text, 'Safety Officer'::text, 'Admin'::text]))) WITH CHECK ((current_setting('app.current_role'::text, true) = ANY (ARRAY['Fleet Manager'::text, 'Safety Officer'::text, 'Admin'::text])));


--
-- TOC entry 5352 (class 3256 OID 17545)
-- Name: expenses pol_ops_write_expenses; Type: POLICY; Schema: transitops; Owner: postgres
--

CREATE POLICY pol_ops_write_expenses ON transitops.expenses USING ((current_setting('app.current_role'::text, true) = ANY (ARRAY['Fleet Manager'::text, 'Financial Analyst'::text, 'Admin'::text]))) WITH CHECK ((current_setting('app.current_role'::text, true) = ANY (ARRAY['Fleet Manager'::text, 'Financial Analyst'::text, 'Admin'::text])));


--
-- TOC entry 5351 (class 3256 OID 17544)
-- Name: fuel_logs pol_ops_write_fuel; Type: POLICY; Schema: transitops; Owner: postgres
--

CREATE POLICY pol_ops_write_fuel ON transitops.fuel_logs USING ((current_setting('app.current_role'::text, true) = ANY (ARRAY['Fleet Manager'::text, 'Driver'::text, 'Financial Analyst'::text, 'Admin'::text]))) WITH CHECK ((current_setting('app.current_role'::text, true) = ANY (ARRAY['Fleet Manager'::text, 'Driver'::text, 'Financial Analyst'::text, 'Admin'::text])));


--
-- TOC entry 5350 (class 3256 OID 17543)
-- Name: maintenance_logs pol_ops_write_maintenance; Type: POLICY; Schema: transitops; Owner: postgres
--

CREATE POLICY pol_ops_write_maintenance ON transitops.maintenance_logs USING ((current_setting('app.current_role'::text, true) = ANY (ARRAY['Fleet Manager'::text, 'Admin'::text]))) WITH CHECK ((current_setting('app.current_role'::text, true) = ANY (ARRAY['Fleet Manager'::text, 'Admin'::text])));


--
-- TOC entry 5349 (class 3256 OID 17542)
-- Name: trips pol_ops_write_trips; Type: POLICY; Schema: transitops; Owner: postgres
--

CREATE POLICY pol_ops_write_trips ON transitops.trips USING ((current_setting('app.current_role'::text, true) = ANY (ARRAY['Fleet Manager'::text, 'Driver'::text, 'Admin'::text]))) WITH CHECK ((current_setting('app.current_role'::text, true) = ANY (ARRAY['Fleet Manager'::text, 'Driver'::text, 'Admin'::text])));


--
-- TOC entry 5347 (class 3256 OID 17540)
-- Name: vehicles pol_ops_write_vehicles; Type: POLICY; Schema: transitops; Owner: postgres
--

CREATE POLICY pol_ops_write_vehicles ON transitops.vehicles USING ((current_setting('app.current_role'::text, true) = ANY (ARRAY['Fleet Manager'::text, 'Admin'::text]))) WITH CHECK ((current_setting('app.current_role'::text, true) = ANY (ARRAY['Fleet Manager'::text, 'Admin'::text])));


--
-- TOC entry 5340 (class 0 OID 17323)
-- Dependencies: 227
-- Name: trips; Type: ROW SECURITY; Schema: transitops; Owner: postgres
--

ALTER TABLE transitops.trips ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5338 (class 0 OID 17261)
-- Dependencies: 225
-- Name: vehicles; Type: ROW SECURITY; Schema: transitops; Owner: postgres
--

ALTER TABLE transitops.vehicles ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5369 (class 0 OID 0)
-- Dependencies: 8
-- Name: SCHEMA transitops; Type: ACL; Schema: -; Owner: postgres
--

GRANT USAGE ON SCHEMA transitops TO transitops_app;
GRANT USAGE ON SCHEMA transitops TO transitops_readonly;


--
-- TOC entry 5372 (class 0 OID 0)
-- Dependencies: 232
-- Name: TABLE audit_log; Type: ACL; Schema: transitops; Owner: postgres
--

GRANT SELECT,INSERT ON TABLE transitops.audit_log TO transitops_app;
GRANT SELECT ON TABLE transitops.audit_log TO transitops_readonly;


--
-- TOC entry 5374 (class 0 OID 0)
-- Dependencies: 231
-- Name: SEQUENCE audit_log_audit_id_seq; Type: ACL; Schema: transitops; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE transitops.audit_log_audit_id_seq TO transitops_app;


--
-- TOC entry 5375 (class 0 OID 0)
-- Dependencies: 226
-- Name: TABLE drivers; Type: ACL; Schema: transitops; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE transitops.drivers TO transitops_app;
GRANT SELECT ON TABLE transitops.drivers TO transitops_readonly;


--
-- TOC entry 5376 (class 0 OID 0)
-- Dependencies: 230
-- Name: TABLE expenses; Type: ACL; Schema: transitops; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE transitops.expenses TO transitops_app;
GRANT SELECT ON TABLE transitops.expenses TO transitops_readonly;


--
-- TOC entry 5377 (class 0 OID 0)
-- Dependencies: 229
-- Name: TABLE fuel_logs; Type: ACL; Schema: transitops; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE transitops.fuel_logs TO transitops_app;
GRANT SELECT ON TABLE transitops.fuel_logs TO transitops_readonly;


--
-- TOC entry 5378 (class 0 OID 0)
-- Dependencies: 228
-- Name: TABLE maintenance_logs; Type: ACL; Schema: transitops; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE transitops.maintenance_logs TO transitops_app;
GRANT SELECT ON TABLE transitops.maintenance_logs TO transitops_readonly;


--
-- TOC entry 5379 (class 0 OID 0)
-- Dependencies: 223
-- Name: TABLE roles; Type: ACL; Schema: transitops; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE transitops.roles TO transitops_app;
GRANT SELECT ON TABLE transitops.roles TO transitops_readonly;


--
-- TOC entry 5381 (class 0 OID 0)
-- Dependencies: 222
-- Name: SEQUENCE roles_role_id_seq; Type: ACL; Schema: transitops; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE transitops.roles_role_id_seq TO transitops_app;


--
-- TOC entry 5382 (class 0 OID 0)
-- Dependencies: 227
-- Name: TABLE trips; Type: ACL; Schema: transitops; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE transitops.trips TO transitops_app;
GRANT SELECT ON TABLE transitops.trips TO transitops_readonly;


--
-- TOC entry 5384 (class 0 OID 0)
-- Dependencies: 224
-- Name: TABLE users; Type: ACL; Schema: transitops; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE transitops.users TO transitops_app;
GRANT SELECT ON TABLE transitops.users TO transitops_readonly;


--
-- TOC entry 5385 (class 0 OID 0)
-- Dependencies: 225
-- Name: TABLE vehicles; Type: ACL; Schema: transitops; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE transitops.vehicles TO transitops_app;
GRANT SELECT ON TABLE transitops.vehicles TO transitops_readonly;


--
-- TOC entry 5386 (class 0 OID 0)
-- Dependencies: 234
-- Name: TABLE vw_fleet_utilization; Type: ACL; Schema: transitops; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE transitops.vw_fleet_utilization TO transitops_app;
GRANT SELECT ON TABLE transitops.vw_fleet_utilization TO transitops_readonly;


--
-- TOC entry 5387 (class 0 OID 0)
-- Dependencies: 237
-- Name: TABLE vw_dashboard_kpis; Type: ACL; Schema: transitops; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE transitops.vw_dashboard_kpis TO transitops_app;
GRANT SELECT ON TABLE transitops.vw_dashboard_kpis TO transitops_readonly;


--
-- TOC entry 5388 (class 0 OID 0)
-- Dependencies: 238
-- Name: TABLE vw_expiring_licenses; Type: ACL; Schema: transitops; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE transitops.vw_expiring_licenses TO transitops_app;
GRANT SELECT ON TABLE transitops.vw_expiring_licenses TO transitops_readonly;


--
-- TOC entry 5389 (class 0 OID 0)
-- Dependencies: 233
-- Name: TABLE vw_fuel_efficiency; Type: ACL; Schema: transitops; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE transitops.vw_fuel_efficiency TO transitops_app;
GRANT SELECT ON TABLE transitops.vw_fuel_efficiency TO transitops_readonly;


--
-- TOC entry 5390 (class 0 OID 0)
-- Dependencies: 235
-- Name: TABLE vw_operational_cost; Type: ACL; Schema: transitops; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE transitops.vw_operational_cost TO transitops_app;
GRANT SELECT ON TABLE transitops.vw_operational_cost TO transitops_readonly;


--
-- TOC entry 5391 (class 0 OID 0)
-- Dependencies: 236
-- Name: TABLE vw_vehicle_roi; Type: ACL; Schema: transitops; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE transitops.vw_vehicle_roi TO transitops_app;
GRANT SELECT ON TABLE transitops.vw_vehicle_roi TO transitops_readonly;


--
-- TOC entry 2253 (class 826 OID 17536)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: transitops; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA transitops GRANT SELECT,INSERT,DELETE,UPDATE ON TABLES TO transitops_app;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA transitops GRANT SELECT ON TABLES TO transitops_readonly;


-- Completed on 2026-07-12 12:11:06

--
-- PostgreSQL database dump complete
--

\unrestrict yfSNxaV3AnGommR1C7nMv7e1zkmIzXaMPIHjebquhkeGNlgS1NJjUiAcsuOodju

