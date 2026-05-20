import React, { useEffect, useState, useRef } from "react";
import PageLayout from "@components/layout/PageLayout";
import { HomeHeader } from "@components";
import CameraStream from "@components/CameraStream";
import { HomeFillIcon, BuildingFillIcon } from "../../components/icons";
import { Button, Box, Text, Input, Spinner } from "zmp-ui";
import { useNavigate, useParams } from "react-router-dom";
import { useStore } from "@store";
import { Building, Room } from "@dts";
import { API_BASE_URL } from "@constants/common";

interface PlateInfo {
  license_plate: string;
  tenant_name: string;
  room_name: string;
  tenant_id: string;
}

interface ScanStatus {
  running: boolean;
  startedAt?: string;
  frameCount: number;
  lastDetected: string | null;
  lastDetectedAt: string | null;
  lastError: string | null;
  knownPlates: string[];
  unknownPlates: string[];
}

const BuildingDetailPage: React.FC = () => {
  const { buildingId } = useParams<{ buildingId: string }>();
  const [building, setBuilding] = useState<Building | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [newRoomName, setNewRoomName] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const user = useStore(state => state.user);

  // Biển số xe states
  const [plates, setPlates] = useState<PlateInfo[]>([]);
  const [loadingPlates, setLoadingPlates] = useState(false);
  const [showPlates, setShowPlates] = useState(false);

  // Scan states
  const [scanStatus, setScanStatus] = useState<ScanStatus | null>(null);
  const [scanning, setScanning] = useState(false);
  const [togglingScanner, setTogglingScanner] = useState(false);
  const scanPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (buildingId) {
      loadBuilding();
      loadRooms();
      loadPlates();
      checkScanStatus();
    }
    return () => {
      if (scanPollRef.current) clearInterval(scanPollRef.current);
    };
  }, [buildingId]);

  // Polling scan status khi đang quét
  useEffect(() => {
    if (scanning && buildingId) {
      scanPollRef.current = setInterval(() => {
        checkScanStatus();
      }, 3000);
    } else {
      if (scanPollRef.current) {
        clearInterval(scanPollRef.current);
        scanPollRef.current = null;
      }
    }
    return () => {
      if (scanPollRef.current) clearInterval(scanPollRef.current);
    };
  }, [scanning, buildingId]);

  const loadBuilding = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/buildings/${buildingId}`);
      if (res.ok) {
        const data = await res.json();
        setBuilding(data);
      }
    } catch (error) {
      console.error("Lỗi tải thông tin tòa nhà:", error);
    }
  };

  const loadRooms = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `${API_BASE_URL}/api/rooms/building/${buildingId}`
      );
      if (res.ok) {
        const data = await res.json();
        setRooms(data);
      }
    } catch (error) {
      console.error("Lỗi tải danh sách phòng:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadPlates = async () => {
    try {
      setLoadingPlates(true);
      const res = await fetch(`${API_BASE_URL}/api/buildings/${buildingId}/plates`);
      if (res.ok) {
        const data = await res.json();
        setPlates(data);
      }
    } catch (error) {
      console.error("Lỗi tải biển số xe:", error);
    } finally {
      setLoadingPlates(false);
    }
  };

  const checkScanStatus = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/plate-detection/status/${buildingId}`);
      if (res.ok) {
        const data: ScanStatus = await res.json();
        setScanStatus(data);
        setScanning(data.running);
      }
    } catch (error) {
      console.error("Lỗi kiểm tra trạng thái scan:", error);
    }
  };

  const toggleScan = async () => {
    setTogglingScanner(true);
    try {
      const endpoint = scanning ? "stop" : "scan";
      const res = await fetch(`${API_BASE_URL}/api/plate-detection/${endpoint}/${buildingId}`, {
        method: "POST",
      });
      if (res.ok) {
        setScanning(!scanning);
        await checkScanStatus();
      }
    } catch (error) {
      console.error("Lỗi toggle scan:", error);
    } finally {
      setTogglingScanner(false);
    }
  };

  const addRoom = async () => {
    if (!newRoomName.trim()) return;

    try {
      const userId = user?.idByOA || user?.id;
      if (!userId || !buildingId) return;

      const res = await fetch(`${API_BASE_URL}/api/rooms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newRoomName,
          buildingId: buildingId,
          ownerId: userId,
        }),
      });

      if (res.ok) {
        const room = await res.json();
        setRooms([...rooms, room]);
        setNewRoomName("");
        setShowAddForm(false);
        navigate(`/room/${room.id}?edit=1`);
      }
    } catch (error) {
      console.error("Lỗi thêm phòng:", error);
    }
  };

  const deleteRoom = async (roomId: string) => {
    if (!confirm("Bạn có chắc muốn xóa phòng này?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/rooms/${roomId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setRooms(prev => prev.filter(r => r.id !== roomId));
      }
    } catch (error) {
      console.error("Lỗi xóa phòng:", error);
    }
  };

  const handleRoomClick = (roomId: string) => {
    navigate(`/room/${roomId}`);
  };

  if (loading) {
    return (
      <PageLayout
        id="building-detail-page"
        customHeader={<HomeHeader title="Danh sách phòng" />}
      >
        <Box flex justifyContent="center" alignItems="center" p={4}>
          <Spinner />
        </Box>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      id="building-detail-page"
      customHeader={
        <HomeHeader
          title={building?.name || "Danh sách phòng"}
          onBack={() => navigate("/home-owner")}
        />
      }
    >
      <Box p={4} flex flexDirection="column" style={{ gap: 16 }}>
        {building && (
          <Box
            p={3}
            style={{
              backgroundColor: "#f0f7ff",
              borderRadius: 8,
              border: "1px solid #007AFF",
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 4 }}>
              <BuildingFillIcon size={16} color="black" style={{ display: "inline-block", verticalAlign: "middle", margin: "0 4px 2px 0" }} />
              {building.name}
            </Text>
            {building.address && (
              <Text style={{ fontSize: 14, color: "#666", marginTop: 4 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="black" xmlns="http://www.w3.org/2000/svg" style={{ display: "inline-block", verticalAlign: "middle", margin: "0 4px 2px 0" }}>
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
                {building.address}
              </Text>
            )}
            {building.camera_rtsp && (
              <Text style={{ fontSize: 12, color: "#007AFF", marginTop: 4 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#007AFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle", margin: "0 4px 2px 0" }}>
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                  <circle cx="12" cy="13" r="4"></circle>
                </svg>
                Camera đã kết nối
              </Text>
            )}
          </Box>
        )}

        {/* Camera Stream Section */}
        {building?.camera_rtsp && (
          <Box
            p={3}
            style={{
              backgroundColor: "#fff",
              borderRadius: 8,
              border: "1px solid #e0e0e0",
            }}
          >
            <Box flex justifyContent="space-between" alignItems="center" style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 16, fontWeight: "bold" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle", margin: "0 4px 2px 0" }}>
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                  <circle cx="12" cy="13" r="4"></circle>
                </svg>
                Camera giám sát
              </Text>
              <Button
                onClick={toggleScan}
                disabled={togglingScanner}
                size="small"
                style={{
                  backgroundColor: scanning ? "#ff3b30" : "#34c759",
                  color: "#fff",
                  border: "none",
                  borderRadius: 20,
                  padding: "4px 12px",
                  fontSize: 12,
                  fontWeight: "bold",
                }}
              >
                {togglingScanner ? "..." : scanning ? "⏹ Dừng quét" : "🔍 Quét biển số"}
              </Button>
            </Box>
            <CameraStream rtspUrl={building.camera_rtsp} />

            {/* Scan Status */}
            {scanning && scanStatus && (
              <Box
                p={2}
                style={{
                  marginTop: 8,
                  backgroundColor: "#f0fff4",
                  borderRadius: 6,
                  border: "1px solid #34c759",
                }}
              >
                <Box flex alignItems="center" style={{ gap: 6, marginBottom: 4 }}>
                  <Box style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#34c759", animation: "pulse 1.5s infinite" }} />
                  <Text style={{ fontSize: 12, fontWeight: "bold", color: "#34c759" }}>
                    Đang giám sát biển số xe
                  </Text>
                </Box>
                <Text style={{ fontSize: 11, color: "#666" }}>
                  Đã quét: {scanStatus.frameCount} frame
                </Text>
                {scanStatus.lastDetected && (
                  <Text style={{ fontSize: 11, color: "#007AFF", marginTop: 2 }}>
                    Phát hiện gần nhất: {scanStatus.lastDetected}
                  </Text>
                )}
                {scanStatus.unknownPlates.length > 0 && (
                  <Box style={{ marginTop: 4 }}>
                    <Text style={{ fontSize: 11, color: "#ff3b30", fontWeight: "bold" }}>
                      ⚠️ Xe lạ: {scanStatus.unknownPlates.join(", ")}
                    </Text>
                  </Box>
                )}
                {scanStatus.lastError && (
                  <Text style={{ fontSize: 11, color: "#ff3b30", marginTop: 2 }}>
                    Lỗi: {scanStatus.lastError}
                  </Text>
                )}
              </Box>
            )}
          </Box>
        )}

        {/* Danh sách biển số xe đã đăng ký */}
        <Box
          p={3}
          style={{
            backgroundColor: "#fff",
            borderRadius: 8,
            border: "1px solid #e0e0e0",
          }}
        >
          <Box
            flex
            justifyContent="space-between"
            alignItems="center"
            onClick={() => setShowPlates(!showPlates)}
            style={{ cursor: "pointer" }}
          >
            <Text style={{ fontSize: 16, fontWeight: "bold" }}>
              🚗 Biển số xe đã đăng ký ({plates.length})
            </Text>
            <svg
              width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ transform: showPlates ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </Box>

          {showPlates && (
            <Box style={{ marginTop: 12 }}>
              {loadingPlates ? (
                <Box flex justifyContent="center" p={2}>
                  <Spinner />
                </Box>
              ) : plates.length === 0 ? (
                <Text style={{ color: "#999", fontSize: 13, textAlign: "center", padding: 8 }}>
                  Chưa có biển số xe nào được đăng ký
                </Text>
              ) : (
                <Box flex flexDirection="column" style={{ gap: 6 }}>
                  {plates.map((plate, idx) => (
                    <Box
                      key={idx}
                      flex
                      justifyContent="space-between"
                      alignItems="center"
                      p={2}
                      style={{
                        backgroundColor: "#f5f5f5",
                        borderRadius: 6,
                        borderLeft: "3px solid #007AFF",
                      }}
                    >
                      <Box>
                        <Text style={{ fontSize: 14, fontWeight: "bold", fontFamily: "monospace", color: "#007AFF" }}>
                          {plate.license_plate}
                        </Text>
                        <Text style={{ fontSize: 11, color: "#666" }}>
                          {plate.tenant_name} • {plate.room_name}
                        </Text>
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          )}
        </Box>

        <Box flex justifyContent="space-between" alignItems="center">
          <Text style={{ fontSize: 18, fontWeight: "bold" }}>
            Danh sách phòng
          </Text>
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            style={{ background: "transparent", border: "none", boxShadow: "none", padding: 0, minWidth: "auto", height: "auto" }}
            size="small"
          >
            {showAddForm ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                <rect x="3" y="3" width="18" height="18" rx="4" ry="4"></rect>
                <line x1="12" y1="8" x2="12" y2="16"></line>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
            )}
          </Button>
        </Box>

        {showAddForm && (
          <Box
            p={3}
            flex
            flexDirection="column"
            style={{
              border: "1px solid #e0e0e0",
              borderRadius: 8,
              backgroundColor: "#f9f9f9",
              gap: 12,
            }}
          >
            <Input
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value.toString())}
              placeholder="Tên phòng *"
            />
            <Box flex style={{ gap: 8 }}>
              <Button
                onClick={addRoom}
                type="highlight"
                style={{ flex: 1 }}
              >
                Thêm
              </Button>
              <Button
                onClick={() => {
                  setShowAddForm(false);
                  setNewRoomName("");
                }}
                type="neutral"
                style={{ flex: 1 }}
              >
                Hủy
              </Button>
            </Box>
          </Box>
        )}

        {rooms.length === 0 ? (
          <Box
            p={4}
            flex
            flexDirection="column"
            alignItems="center"
            style={{ gap: 8 }}
          >
            <Text style={{ color: "#999", textAlign: "center" }}>
              Chưa có phòng nào. Nhấn nút + để thêm phòng mới.
            </Text>
          </Box>
        ) : (
          rooms.map((room) => (
            <Box
              key={room.id}
              p={3}
              style={{
                border: "1px solid #e0e0e0",
                borderRadius: 8,
                backgroundColor: "#fff",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onClick={() => handleRoomClick(room.id)}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#f5f5f5";
                e.currentTarget.style.borderColor = "#007AFF";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#fff";
                e.currentTarget.style.borderColor = "#e0e0e0";
              }}
            >
              <Box flex justifyContent="space-between" alignItems="center" style={{ gap: 8 }}>
                <Text style={{ fontSize: 16, fontWeight: "bold" }}>
                  <HomeFillIcon size={16} color="currentColor" style={{ display: "inline-block", verticalAlign: "middle", margin: "0 4px 2px 0" }} />
                  {room.name}
                </Text>
                <Button
                  style={{ background: "transparent", border: "none", boxShadow: "none", padding: 0, minWidth: "auto", height: "auto" }}
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteRoom(room.id);
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#d10000" xmlns="http://www.w3.org/2000/svg" style={{ display: "block" }}>
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                  </svg>
                </Button>
              </Box>
            </Box>
          ))
        )}
      </Box>
    </PageLayout>
  );
};

export default BuildingDetailPage;
