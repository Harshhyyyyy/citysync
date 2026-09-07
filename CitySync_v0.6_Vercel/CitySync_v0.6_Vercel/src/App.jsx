import { useEffect, useMemo, useState } from "react";
import {
  Activity, AlertTriangle, BarChart3, Bell, ChevronRight, Construction,
  Home, Layers3, MapPin, Menu, Package, ParkingCircle, Plus, Route,
  Search, Settings, Truck, Users, X, Zap, RefreshCw, Crosshair, SlidersHorizontal
} from "lucide-react";
import {
  MapContainer, TileLayer, CircleMarker, Popup, GeoJSON, Tooltip
} from "react-leaflet";
import { createIssue, getAnalytics, getIssues, getMapData } from "./services/api";

const DEFAULT_LAYERS = {
  traffic: true,
  issues: true,
  parking: false,
  construction: false,
  logistics: false,
  delivery_zones: false,
};

const nav = [
  ["overview", "Overview", Home],
  ["map", "GIS Map", Layers3],
  ["issues", "Report Issues", AlertTriangle],
  ["logistics", "Logistics", Truck],
  ["analytics", "Analytics", BarChart3]
];

const emptyMapData = {
  roads: { type: "FeatureCollection", features: [] },
  parking: { type: "FeatureCollection", features: [] },
  logistics_hubs: { type: "FeatureCollection", features: [] },
  construction: { type: "FeatureCollection", features: [] },
  delivery_zones: { type: "FeatureCollection", features: [] },
  issues: { type: "FeatureCollection", features: [] },
};

function formatTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const mins = Math.max(0, Math.round((Date.now() - date.getTime()) / 60000));
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? "" : "s"} ago`;
  return `${Math.round(hours / 24)} days ago`;
}

function App() {
  const [page, setPage] = useState("overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [layers, setLayers] = useState(DEFAULT_LAYERS);
  const [mapData, setMapData] = useState(emptyMapData);
  const [issues, setIssues] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");

  const loadLiveData = async () => {
    try {
      setApiError("");
      const [map, issueRows, summary] = await Promise.all([
        getMapData(),
        getIssues(),
        getAnalytics(),
      ]);
      setMapData(map);
      setIssues(issueRows);
      setAnalytics(summary);
    } catch (error) {
      console.error(error);
      setApiError(error.message || "Could not connect to CitySync API.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLiveData();
  }, []);

  const title = useMemo(() => nav.find(n => n[0] === page)?.[1] || "Overview", [page]);

  return (
    <div className="app">
      <aside className={`sidebar ${mobileOpen ? "open" : ""}`}>
        <div className="brand">
          <div className="brand-mark"><Zap size={20} /></div>
          <div><strong>CitySync</strong><span>Urban Intelligence</span></div>
          <button className="icon-btn close-mobile" onClick={() => setMobileOpen(false)}><X size={20}/></button>
        </div>
        <div className="workspace"><span>WORKSPACE</span><button className="workspace-btn"><MapPin size={16}/> Greater Noida <ChevronRight size={15}/></button></div>
        <nav>{nav.map(([id,label,Icon]) => <button key={id} className={page===id?"nav-item active":"nav-item"} onClick={()=>{setPage(id);setMobileOpen(false)}}><Icon size={18}/><span>{label}</span></button>)}</nav>
        <div className="sidebar-bottom">
          <button className="nav-item"><Users size={18}/><span>Authority Portal</span></button>
          <button className="nav-item"><Settings size={18}/><span>Settings</span></button>
          <div className="user-card"><div className="avatar">G</div><div><strong>Genix</strong><span>Student Demo</span></div></div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <button className="icon-btn mobile-menu" onClick={()=>setMobileOpen(true)}><Menu/></button>
          <div><div className="eyebrow">CITY OPERATIONS</div><h1>{title}</h1></div>
          <div className="top-actions"><button className="search-box"><Search size={17}/><span>Search infrastructure...</span><kbd>⌘ K</kbd></button><button className="icon-btn notification"><Bell size={19}/><i/></button><div className="profile">G</div></div>
        </header>

        {apiError && <div className="content"><div className="success-box" style={{color:"#b42318", background:"#fff1f0"}}>API connection issue: {apiError} — make sure FastAPI is running on port 8000.</div></div>}

        {page==="overview" && <Overview layers={layers} setLayers={setLayers} setPage={setPage} mapData={mapData} issues={issues} analytics={analytics} loading={loading}/>} 
        {page==="map" && <MapView layers={layers} setLayers={setLayers} mapData={mapData} loading={loading}/>} 
        {page==="issues" && <IssuesPage issues={issues} onCreated={loadLiveData}/>} 
        {page==="logistics" && <LogisticsPage analytics={analytics} mapData={mapData}/>} 
        {page==="analytics" && <AnalyticsPage analytics={analytics} issues={issues}/>} 
      </main>
    </div>
  );
}

function Overview({layers,setLayers,setPage,mapData,issues,analytics,loading}) {
  const activeIssues = analytics?.active_issues ?? 0;
  const congested = analytics?.congested_roads ?? 0;
  const parkingSpaces = analytics?.parking_spaces ?? 0;
  const logisticsHubs = analytics?.logistics_hubs ?? 0;
  const totalParking = mapData.parking.features.reduce((sum, f) => sum + Number(f.properties.capacity || 0), 0);

  const stats = [
    { label: "Active Issues", value: loading ? "—" : activeIssues, delta: `${analytics?.total_issues ?? 0} total reports`, icon: AlertTriangle },
    { label: "Congested Roads", value: loading ? "—" : congested, delta: "High congestion", icon: Activity },
    { label: "Available Parking", value: loading ? "—" : parkingSpaces, delta: `of ${totalParking || "—"} spaces`, icon: ParkingCircle },
    { label: "Logistics Hubs", value: loading ? "—" : logisticsHubs, delta: "Database assets", icon: Package }
  ];

  return <div className="content">
    <section className="hero-row"><div><h2>City overview</h2><p>Live operational view of urban infrastructure and mobility.</p></div><button className="primary" onClick={()=>setPage("issues")}><Plus size={17}/> Report an issue</button></section>
    <section className="stats-grid">{stats.map(({label,value,delta,icon:Icon})=><div className="stat-card" key={label}><div className="stat-icon"><Icon size={19}/></div><div><span>{label}</span><strong>{value}</strong><small>{delta}</small></div></div>)}</section>
    <section className="dashboard-grid">
      <div className="panel map-panel"><div className="panel-head"><div><h3>Infrastructure map</h3><p>Interactive Greater Noida operational area · live PostGIS</p></div><button className="secondary" onClick={()=>setPage("map")}>Open full map <ChevronRight size={15}/></button></div><MiniMap layers={layers} mapData={mapData}/></div>
      <div className="panel"><div className="panel-head"><div><h3>Map layers</h3><p>Toggle live information</p></div><Layers3 size={18}/></div><LayerControls layers={layers} setLayers={setLayers}/></div>
    </section>
    <section className="dashboard-grid lower">
      <div className="panel"><div className="panel-head"><div><h3>Recent citizen reports</h3><p>Latest records from PostgreSQL/PostGIS</p></div></div><IssueTable compact issues={issues}/></div>
      <div className="panel action-panel"><div className="panel-head"><div><h3>Operational snapshot</h3><p>Current database conditions</p></div></div><div className="snapshot"><div><b>{congested}</b><span>High congestion roads</span></div><div><b>{mapData.construction.features.length}</b><span>Construction zones</span></div><div><b>{analytics?.total_issues ?? 0}</b><span>Total reported issues</span></div></div></div>
    </section>
  </div>
}

function LayerControls({layers,setLayers}) {
  const items=[
    ["traffic","Traffic",Activity],
    ["issues","Reported issues",AlertTriangle],
    ["parking","Parking",ParkingCircle],
    ["construction","Construction",Construction],
    ["logistics","Logistics hubs",Truck],
    ["delivery_zones","Delivery zones",Package]
  ];
  return <div className="layer-list">{items.map(([id,label,Icon])=><label className="layer-row" key={id}><span className="layer-name"><Icon size={17}/>{label}</span><input type="checkbox" checked={layers[id]} onChange={e=>setLayers({...layers,[id]:e.target.checked})}/><span className="switch"/></label>)}</div>
}

function LiveMapLayers({layers,mapData, issueSeverity="All", issueStatus="All"}) {
  const roadStyle = feature => {
    const level = String(feature.properties?.congestion_level || "Unknown").toLowerCase();
    return { weight: level === "high" ? 6 : 5, className: `traffic-${level}` };
  };

  const roadPopup = feature => {
    const p = feature.properties || {};
    return <><b>{p.name}</b><br/>Type: {p.road_type}<br/>Status: {p.status}<br/>Congestion: {p.congestion_level}<br/>Avg speed: {p.speed ?? "—"} km/h</>;
  };

  return <>
    {layers.traffic && <GeoJSON data={mapData.roads} style={roadStyle} onEachFeature={(feature, layer) => layer.bindPopup(roadPopup(feature))}/>} 
    {layers.issues && mapData.issues.features.filter(f => {
      const p = f.properties || {};
      return (issueSeverity === "All" || String(p.severity || "").toLowerCase() === issueSeverity.toLowerCase()) &&
        (issueStatus === "All" || String(p.status || "").toLowerCase().replace(" ", "-") === issueStatus.toLowerCase().replace(" ", "-"));
    }).map(f => {
      const p = f.properties || {};
      const [lng, lat] = f.geometry.coordinates;
      return <CircleMarker key={`issue-${p.id}`} center={[lat,lng]} radius={7} pathOptions={{className:`issue-${String(p.severity || "medium").toLowerCase()}`}}>
        <Popup><b>{p.category}</b><br/>Severity: {p.severity}<br/>Status: {p.status}<br/>{p.description}<br/><small>{formatTime(p.reported_at)}</small></Popup>
      </CircleMarker>;
    })}
    {layers.parking && mapData.parking.features.map(f => {
      const p = f.properties || {}; const [lng, lat] = f.geometry.coordinates;
      return <CircleMarker key={`parking-${p.id}`} center={[lat,lng]} radius={9} pathOptions={{className:"parking-marker"}}><Popup><b>{p.name}</b><br/>Available: {p.available}/{p.capacity} spaces<br/>Occupancy: {Math.round((1-p.available/p.capacity)*100)}%</Popup></CircleMarker>;
    })}
    {layers.logistics && mapData.logistics_hubs.features.map(f => {
      const p = f.properties || {}; const [lng, lat] = f.geometry.coordinates;
      return <CircleMarker key={`hub-${p.id}`} center={[lat,lng]} radius={10} pathOptions={{className:"hub-active"}}><Popup><b>{p.name}</b><br/>Capacity: {p.capacity} units<br/>Status: Active database asset</Popup></CircleMarker>;
    })}
    {layers.construction && <GeoJSON data={mapData.construction} style={() => ({className:"construction-zone", weight:2})} onEachFeature={(feature, layer) => { const p=feature.properties||{}; layer.bindPopup(`<b>${p.project_name}</b><br/>Status: ${p.status}<br/>Expected completion: ${p.end_date}`); }}/>} 
    {layers.delivery_zones && <GeoJSON data={mapData.delivery_zones} style={() => ({className:"delivery-zone", weight:2})} onEachFeature={(feature, layer) => { const p=feature.properties||{}; layer.bindPopup(`<b>${p.zone_name}</b><br/>${p.restrictions || "No restrictions listed"}`); }}/>} 
  </>;
}

function MiniMap({layers,mapData}) {
  return <div className="map-wrap"><MapContainer center={[28.4745,77.504]} zoom={13} scrollWheelZoom={false} zoomControl={false}><TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/><LiveMapLayers layers={layers} mapData={mapData}/></MapContainer><div className="map-legend"><span><i className="dot traffic"/>Traffic</span><span><i className="dot issue"/>Issues</span><span><i className="dot parking"/>Parking</span><span><i className="dot zone"/>Construction</span></div></div>
}

function MapView({layers,setLayers,mapData,loading}) {
  const [issueSeverity,setIssueSeverity]=useState("All");
  const [issueStatus,setIssueStatus]=useState("All");
  const [refreshing,setRefreshing]=useState(false);
  const visibleIssues = mapData.issues.features.filter(f => {
    const p=f.properties||{};
    return (issueSeverity === "All" || String(p.severity||"").toLowerCase() === issueSeverity.toLowerCase()) &&
      (issueStatus === "All" || String(p.status||"").toLowerCase().replace(" ","-") === issueStatus.toLowerCase().replace(" ","-"));
  }).length;
  const refresh = async () => {
    setRefreshing(true);
    try { window.location.reload(); } finally { setRefreshing(false); }
  };
  return <div className="content full-map-page"><div className="map-toolbar"><div><h2>GIS command map</h2><p>Explore live infrastructure layers, hotspots and operational constraints.</p></div><div className="map-toolbar-actions"><div className="toolbar-badge"><span className="live-dot"/> {loading ? "LOADING" : "LIVE DATA · POSTGIS"}</div><button className="secondary" onClick={refresh}><RefreshCw size={14}/> {refreshing ? "Refreshing" : "Refresh"}</button></div></div>
    <div className="full-map-layout"><div className="panel layer-panel"><div className="panel-head"><div><h3>Layers</h3><p>Spatial datasets from API</p></div><Layers3 size={17}/></div><LayerControls layers={layers} setLayers={setLayers}/><div className="map-filters"><div className="filter-title"><SlidersHorizontal size={14}/> Issue filters</div><label>Severity<select value={issueSeverity} onChange={e=>setIssueSeverity(e.target.value)}><option>All</option><option>High</option><option>Medium</option><option>Low</option></select></label><label>Status<select value={issueStatus} onChange={e=>setIssueStatus(e.target.value)}><option>All</option><option>Open</option><option>In-Progress</option><option>Resolved</option></select></label><div className="filter-count">Showing <b>{visibleIssues}</b> of {mapData.issues.features.length} reports</div></div><div className="map-info"><b>How to use</b><span>Click markers and road segments for details. Toggle layers independently and filter reported issues by severity or workflow status.</span></div></div><div className="panel big-map"><MapContainer center={[28.4745,77.504]} zoom={13} scrollWheelZoom><TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/><LiveMapLayers layers={layers} mapData={mapData} issueSeverity={issueSeverity} issueStatus={issueStatus}/></MapContainer><div className="map-overlay"><Crosshair size={14}/> Greater Noida · EPSG:4326</div></div></div>
  </div>
}

function IssuesPage({issues,onCreated}) {
  const [category,setCategory]=useState("Pothole");
  const [severity,setSeverity]=useState("Medium");
  const [description,setDescription]=useState("");
  const [submitted,setSubmitted]=useState(false);
  const [submitting,setSubmitting]=useState(false);
  const [error,setError]=useState("");

  const submit = async () => {
    setSubmitting(true); setError(""); setSubmitted(false);
    try {
      const created = await createIssue({
        category,
        severity,
        description,
        latitude: 28.4744,
        longitude: 77.5040,
      });
      setSubmitted(true);
      setDescription("");
      await onCreated();
      console.log("Created issue", created.id);
    } catch (e) {
      setError(e.message || "Could not submit report");
    } finally { setSubmitting(false); }
  };

  return <div className="content"><section className="hero-row"><div><h2>Citizen issue reporting</h2><p>Capture a problem with its location and send it into the authority workflow.</p></div></section>
    <div className="issue-layout"><div className="panel report-form"><div className="form-title"><div className="stat-icon"><MapPin/></div><div><h3>New infrastructure report</h3><p>Location is attached to the report automatically.</p></div></div>
      <label>Issue category</label><select value={category} onChange={e=>setCategory(e.target.value)}>{["Pothole","Road blocked","Streetlight","Garbage","Water leakage","Illegal dumping","Other"].map(x=><option key={x}>{x}</option>)}</select>
      <label>Severity</label><div className="segmented">{["Low","Medium","High"].map(x=><button type="button" key={x} className={severity===x?"selected":""} onClick={()=>setSeverity(x)}>{x}</button>)}</div>
      <label>Description</label><textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Describe what you observed..."/>
      <label>Location</label><div className="location-field"><MapPin size={16}/> Greater Noida · 28.4744, 77.5040 <span>GPS FIXED</span></div>
      <button className="primary wide" disabled={submitting} onClick={submit}><Plus size={17}/> {submitting ? "Submitting..." : "Submit report"}</button>
      {submitted&&<div className="success-box">✓ Report saved to PostgreSQL/PostGIS successfully.</div>}
      {error&&<div className="success-box" style={{color:"#b42318", background:"#fff1f0"}}>✕ {error}</div>}
    </div>
    <div className="panel"><div className="panel-head"><div><h3>Report workflow</h3><p>Live API workflow</p></div></div><div className="workflow">{["Citizen report","GPS location","GIS database","Authority review","Resolution"].map((x,i)=><div className="step" key={x}><b>{i+1}</b><span>{x}</span>{i<4&&<ChevronRight/>}</div>)}</div></div></div>
    <div className="panel table-panel"><div className="panel-head"><div><h3>Recent reports</h3><p>Live database records</p></div></div><IssueTable issues={issues}/></div>
  </div>
}

function IssueTable({compact=false,issues=[]}) {
  const data=compact?issues.slice(0,4):issues;
  return <div className="table-wrap"><table><thead><tr><th>Issue</th><th>Severity</th><th>Status</th><th>Time</th></tr></thead><tbody>{data.map(i=><tr key={i.id}><td><b>{i.category}</b></td><td><span className={`severity ${String(i.severity).toLowerCase()}`}>{i.severity}</span></td><td><span className={`status ${String(i.status).toLowerCase().replace(" ","-")}`}>{i.status}</span></td><td>{formatTime(i.reported_at)}</td></tr>)}</tbody></table></div>
}

function LogisticsPage({analytics,mapData}) {
  const [optimized,setOptimized]=useState(false);
  const hub = mapData.logistics_hubs.features[0]?.properties;
  return <div className="content"><section className="hero-row"><div><h2>Logistics route planner</h2><p>Prototype for delivery routing and restricted-zone awareness.</p></div></section>
    <div className="logistics-grid"><div className="panel"><h3>Plan a route</h3><p>Enter operational parameters.</p><label>Origin</label><div className="fake-input"><MapPin size={16}/> {hub?.name || "Logistics Hub"}</div><label>Destination</label><div className="fake-input"><MapPin size={16}/> Pari Chowk</div><label>Vehicle type</label><select><option>Delivery van</option><option>Light truck</option><option>Heavy truck</option></select><button className="primary wide" onClick={()=>setOptimized(true)}><Route size={17}/> Optimize route</button></div>
      <div className="panel route-result"><div className="route-score"><Zap/><div><span>Recommended route</span><strong>Route A</strong></div><b>{optimized ? "9.1/10" : "8.4/10"}</b></div><div className="route-line"><span>{hub?.name || "Hub"}</span><i/><span>Sector 18</span><i/><span>Pari Chowk</span></div><div className="route-metrics"><div><span>Distance</span><b>14.2 km</b></div><div><span>Estimated time</span><b>31 min</b></div><div><span>Restrictions</span><b>{mapData.delivery_zones.features.length ? "1 zone" : "None"}</b></div></div>{optimized&&<div className="success-box">✓ Route optimized against live congestion and GIS zone data.</div>}</div></div>
    <div className="panel"><div className="panel-head"><div><h3>Logistics infrastructure</h3><p>Database-backed operational assets</p></div></div><div className="zone-cards"><div><Truck/><b>{analytics?.logistics_hubs ?? mapData.logistics_hubs.features.length}</b><span>Logistics hubs</span></div><div><Package/><b>{mapData.delivery_zones.features.length}</b><span>Delivery zones</span></div><div><Construction/><b>{mapData.construction.features.length}</b><span>Construction zones</span></div></div></div>
  </div>
}

function AnalyticsPage({analytics,issues}) {
  const bars=[32,45,39,58,52,71,64,78,61,84,73,90];
  const high = analytics?.congested_roads ?? 0;
  const total = analytics?.total_issues ?? issues.length;
  const hotspots = issues.filter(i => i.status !== "Resolved").slice(0,4);
  return <div className="content"><section className="hero-row"><div><h2>Urban analytics</h2><p>Identify recurring congestion and infrastructure hotspots.</p></div></section>
    <div className="analytics-grid"><div className="panel chart-panel"><div className="panel-head"><div><h3>Congestion trend</h3><p>Visualization layer · live KPI below</p></div><Activity/></div><div className="bars">{bars.map((h,i)=><div className="bar-col" key={i}><div className="bar" style={{height:`${h}%`}}/><small>{i+1}</small></div>)}</div></div>
      <div className="panel hotspot"><div className="panel-head"><div><h3>Current issue hotspots</h3><p>Open/in-progress database records</p></div><AlertTriangle/></div>{(hotspots.length ? hotspots : [{id:0,category:"No open issues",severity:"—"}]).map((x,i)=><div className="hot-row" key={x.id}><span>{i+1}</span><b>{x.category}</b><div className="hot-track"><i style={{width:`${Math.max(20,90-i*17)}%`}}/></div><strong>{x.severity}</strong></div>)}</div></div>
    <div className="analytics-kpis"><div><b>{total}</b><span>Total issue reports</span></div><div><b>{high}</b><span>High-congestion roads</span></div><div><b>{analytics?.parking_spaces ?? 0}</b><span>Available parking</span></div><div><b>{analytics?.logistics_hubs ?? 0}</b><span>Logistics hubs</span></div></div>
    <div className="panel insight"><Zap/><div><h3>Decision-support insight</h3><p>CitySync is now reading live records from PostgreSQL/PostGIS. The next analytics stage can replace the demo trend with spatial hotspot queries and historical traffic features for predictive congestion modelling.</p></div></div>
  </div>
}

export default App;
