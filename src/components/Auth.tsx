import { useEffect, useRef } from "react";
import { useStore } from "@store";
import { useNavigate, useLocation } from "react-router-dom";
import { login } from "zmp-sdk";

const Auth = () => {
    const [token, getToken, getUserInfo, checkUserRole, user, loadingAuth] = useStore(state => [
        state.token,
        state.getAccessToken,
        state.getUserInfo,
        state.checkUserRole,
        state.user,
        state.loadingAuth,
    ]);
    const navigate = useNavigate();
    const location = useLocation();
    const hasInitialized = useRef(false);

    useEffect(() => {
        // Chỉ chạy một lần khi app khởi động
        if (hasInitialized.current || loadingAuth) {
            return;
        }

        const initializeAuth = async () => {
            try {
                hasInitialized.current = true;

                // Lấy token
        if (!token) {
                    await getToken();
        }

                // Lấy thông tin user từ Zalo
                if (!user) {
                    await login();
                    await getUserInfo();
                }

                // Kiểm tra role của user
                const role = await checkUserRole();
                const currentPath = location.pathname;
                
                // Nếu user đã có role
                if (role) {
                    // Nếu đang ở trang chọn role, chuyển đến trang home tương ứng
                    if (currentPath === "/") {
                        if (role === "chu-tro") {
                            navigate("/home-owner", { replace: true });
                        } else if (role === "nguoi-thue") {
                            navigate("/home-tenant", { replace: true });
                        }
                    }
                    // Nếu đang ở trang home không đúng với role, chuyển đến trang đúng
                    else if (role === "chu-tro" && currentPath === "/home-tenant") {
                        navigate("/home-owner", { replace: true });
                    } else if (role === "nguoi-thue" && currentPath === "/home-owner") {
                        navigate("/home-tenant", { replace: true });
                    }
                } 
                // Nếu user chưa có role
                else {
                    // Nếu đang ở trang home hoặc trang khác, chuyển về trang chọn role
                    if (currentPath === "/home-owner" || currentPath === "/home-tenant") {
                        navigate("/", { replace: true });
                    }
                }
            } catch (err) {
                console.error("Lỗi khởi tạo auth:", err);
                hasInitialized.current = false;
                // Nếu có lỗi và đang không ở trang chọn role, chuyển về trang chọn role
                if (location.pathname !== "/") {
                    navigate("/", { replace: true });
                }
            }
        };

        initializeAuth();
    }, [token, user, getToken, getUserInfo, checkUserRole, navigate, location.pathname, loadingAuth]);

    return null;
};

export default Auth;
