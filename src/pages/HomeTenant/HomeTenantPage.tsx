import React, { useEffect, useState } from "react";
import { HomeHeader, Utinities, ListOA, NewsSection } from "@components";
import PageLayout from "@components/layout/PageLayout";
import { APP_UTINITIES } from "@constants/utinities";
import { useStore } from "@store";
import { Button, Box, Text } from "zmp-ui";
import { useNavigate } from "react-router-dom";
import { getTenantUnreadNotificationCount } from "@service/services";

const HomePage: React.FunctionComponent = () => {
    const [organization] = useStore(state => [
        state.organization,
        state.getOrganization,
    ]);
    const user = useStore((state) => state.user);
    const [notificationCount, setNotificationCount] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        loadNotificationCount();

        // Polling để cập nhật số thông báo
        const interval = setInterval(() => {
            loadNotificationCount();
        }, 5000); // Check mỗi 5 giây

        return () => clearInterval(interval);
    }, []);

    const loadNotificationCount = async () => {
        try {
            const userId = user?.idByOA || user?.id;
            if (!userId) return;

            const count = await getTenantUnreadNotificationCount(userId);
            setNotificationCount(count);
        } catch (error) {
            console.error("Lỗi tải số thông báo:", error);
        }
    };

    return (
        <PageLayout
            id="home-tenant-page"
            customHeader={
                <HomeHeader
                    title="QUẢN LÝ TRỌ"
                />
            }
        >
            <Box p={3}>
                {/* Nút thông báo với badge */}
                <Box
                    flex
                    justifyContent="space-between"
                    alignItems="center"
                    style={{ marginBottom: 16 }}
                >
                    <Text style={{ fontSize: 18, fontWeight: "bold" }}>
                        Thông báo
                    </Text>
                    <Box
                        flex
                        alignItems="center"
                        style={{ position: "relative", cursor: "pointer" }}
                        onClick={() => navigate("/tenant-notifications")}
                    >
                        <Button
                            onClick={() => navigate("/tenant-notifications")}
                            type="neutral"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="#007AFF" xmlns="http://www.w3.org/2000/svg" style={{ display: "inline-block", verticalAlign: "middle", margin: "0 4px 2px 0" }}>
                                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
                            </svg>
                            Thông báo
                        </Button>
                        {notificationCount > 0 && (
                            <Box
                                style={{
                                    position: "absolute",
                                    top: -8,
                                    right: -8,
                                    backgroundColor: "#FF3B30",
                                    borderRadius: 10,
                                    minWidth: 20,
                                    height: 20,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    padding: "0 6px",
                                }}
                            >
                                <Text
                                    style={{
                                        color: "#fff",
                                        fontSize: 12,
                                        fontWeight: "bold",
                                    }}
                                >
                                    {notificationCount > 99 ? "99+" : notificationCount}
                                </Text>
                            </Box>
                        )}
                    </Box>
                </Box>

                {/* Nút thanh toán */}
                <Box style={{ marginBottom: 16 }}>
                    <Button
                        onClick={() => navigate("/payment")}
                        type="highlight"
                        style={{ width: "100%" }}
                    >
                        💳 Thanh toán tiền trọ
                    </Button>
                </Box>

                <Utinities utinities={APP_UTINITIES} />
            </Box>
        </PageLayout>
    );
};

export default HomePage;
