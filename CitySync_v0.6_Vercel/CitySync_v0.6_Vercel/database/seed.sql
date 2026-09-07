CREATE EXTENSION IF NOT EXISTS postgis;

INSERT INTO users (name,email,role) VALUES
('Demo Citizen','citizen@citysync.local','citizen'),
('Demo Authority','authority@citysync.local','authority')
ON CONFLICT (email) DO NOTHING;

INSERT INTO roads (name,road_type,status,geometry) VALUES
('Pari Chowk Corridor','arterial','open',ST_GeomFromText('LINESTRING(77.499 28.459,77.506 28.465,77.509 28.472,77.512 28.478)',4326)),
('Knowledge Park Road','arterial','open',ST_GeomFromText('LINESTRING(77.492 28.453,77.499 28.461,77.503 28.470)',4326)),
('Sector 18 Connector','collector','open',ST_GeomFromText('LINESTRING(77.507 28.482,77.515 28.481,77.521 28.477)',4326));

INSERT INTO parking (name,capacity,available,geometry) VALUES
('Pari Chowk Parking',70,18,ST_SetSRID(ST_Point(77.5085,28.4657),4326)),
('Knowledge Park Parking',54,41,ST_SetSRID(ST_Point(77.5005,28.4594),4326)),
('Sector 18 Parking',60,27,ST_SetSRID(ST_Point(77.5105,28.4822),4326));

INSERT INTO logistics_hubs (name,capacity,geometry) VALUES
('Hub A — Surajpur',120,ST_SetSRID(ST_Point(77.4870,28.4930),4326)),
('Hub B — Sector 10',80,ST_SetSRID(ST_Point(77.5200,28.4740),4326)),
('Hub C — Knowledge Park',60,ST_SetSRID(ST_Point(77.4940,28.4570),4326));

INSERT INTO construction (project_name,start_date,end_date,status,geometry) VALUES
('Knowledge Park roadwork','2026-08-01','2026-09-30','Active',
ST_GeomFromText('POLYGON((77.494 28.479,77.503 28.487,77.516 28.481,77.506 28.474,77.494 28.479))',4326));

INSERT INTO delivery_zones (zone_name,restrictions,geometry) VALUES
('Pari Chowk Delivery Zone','Loading allowed 10:00–16:00',
ST_GeomFromText('POLYGON((77.503 28.463,77.510 28.463,77.510 28.469,77.503 28.469,77.503 28.463))',4326));

INSERT INTO traffic (road_id,congestion_level,speed)
SELECT id,'High',14 FROM roads WHERE name='Pari Chowk Corridor';
INSERT INTO traffic (road_id,congestion_level,speed)
SELECT id,'Medium',27 FROM roads WHERE name='Knowledge Park Road';
INSERT INTO traffic (road_id,congestion_level,speed)
SELECT id,'Low',42 FROM roads WHERE name='Sector 18 Connector';

INSERT INTO issues (category,description,severity,status,geometry) VALUES
('Pothole','Deep pothole near main junction.','High','Open',ST_SetSRID(ST_Point(77.5040,28.4744),4326)),
('Garbage','Overflowing collection point.','Medium','In Progress',ST_SetSRID(ST_Point(77.5075,28.4702),4326)),
('Streetlight','Streetlight not functioning.','Low','Open',ST_SetSRID(ST_Point(77.5132,28.4812),4326)),
('Road Blocked','Temporary obstruction cleared.','High','Resolved',ST_SetSRID(ST_Point(77.5015,28.4645),4326)),
('Water Leakage','Water visible beside carriageway.','Medium','Open',ST_SetSRID(ST_Point(77.4980,28.4880),4326));
