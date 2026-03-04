import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router";
import { getAuthToken } from "@/lib/request";

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * 认证守卫组件
 * 用于保护需要登录才能访问的页面
 */
function AuthGuard({ children }: AuthGuardProps) {
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // 检查是否存在有效的认证令牌
    const token = getAuthToken();
    setIsAuthenticated(!!token);
    setIsChecking(false);
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
