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
                // Khởi tạo access token và thông tin người dùng từ Zalo SDK
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

