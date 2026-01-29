import { useEffect } from "react";
import { useStore } from "@store";

const Auth = () => {
    const [token, getToken, getUserInfo, user] = useStore(state => [
        state.token,
        state.getAccessToken,
        state.getUserInfo,
        state.user,
    ]);

    useEffect(() => {
        const init = async () => {
            try {
                // Chỉ lấy token và user info từ Zalo SDK
                // KHÔNG gọi API backend ở đây để tránh treo splash
                if (!token) {
                    await getToken();
                }
                if (!user) {
                    await getUserInfo();
                }
            } catch (err) {
                console.error("Auth init error:", err);
            }
        };
        init();
    }, []);

    return null;
};

export default Auth;

