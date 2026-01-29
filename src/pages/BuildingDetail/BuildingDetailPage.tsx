import React, { useEffect, useState } from "react";
import PageLayout from "@components/layout/PageLayout";
import { HomeHeader } from "@components";
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
              🏢 {building.name}
            </Text>
            {building.address && (
              <Text style={{ fontSize: 14, color: "#666", marginTop: 4 }}>
                📍 {building.address}
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
            type="primary"
            size="small"
          >
            {showAddForm ? "✕" : "+"}
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
                type="primary"
                style={{ flex: 1 }}
              >
                Thêm
              </Button>
              <Button
                onClick={() => {
                  setShowAddForm(false);
                  setNewRoomName("");
                }}
                type="secondary"
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
                  🚪 {room.name}
                </Text>
                <Button
                  type="danger"
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteRoom(room.id);
                  }}
                >
                  🗑️
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

