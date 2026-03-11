import React, { useEffect, useState } from "react";
import PageLayout from "@components/layout/PageLayout";
import { HomeHeader } from "@components";
import { HomeFillIcon, BuildingFillIcon } from "../../components/icons";
import { Button, Box, Text, Input, Spinner } from "zmp-ui";
import { useNavigate, useParams } from "react-router-dom";
import { useStore } from "@store";
import { Building, Room } from "@dts";
import { API_BASE_URL } from "@constants/common";

const BuildingDetailPage: React.FC = () => {
  const { buildingId } = useParams<{ buildingId: string }>();
  const [building, setBuilding] = useState<Building | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [newRoomName, setNewRoomName] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const user = useStore(state => state.user);

  useEffect(() => {
    if (buildingId) {
      loadBuilding();
      loadRooms();
    }
  }, [buildingId]);

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
        // Chuyển sang trang phòng với edit mode để chủ trọ set giá
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
          </Box>
        )}

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

