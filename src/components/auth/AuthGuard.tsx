import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router";
import { getAuthToken, clearAuthToken, authApi } from "@/lib/request";

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * 认证守卫组件
 * 用于保护需要登录才能访问的页面
 * 会向后端验证 token 是否有效
 */
function AuthGuard({ children }: AuthGuardProps) {
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const verifyToken = async () => {
      const token = getAuthToken();
      if (!token) {
        setIsAuthenticated(false);
        setIsChecking(false);
        return;
      }

      try {
        // 向后端验证 token 是否有效
        const response = await authApi.getProfile();
        setIsAuthenticated(response.success);
      } catch {
        // token 无效或后端不可达，清除旧 token
        clearAuthToken();
        setIsAuthenticated(false);
      } finally {
        setIsChecking(false);
      }
    };

    verifyToken();
  }, []);

  // 正在检查认证状态时显示空白（避免闪烁）
  if (isChecking) {
    return null;
  }

  // 未登录时跳转到登录页面，并保存当前路径用于登录后跳转回来
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 已登录，显示子组件
  return <>{children}</>;
}

export default AuthGuard;
