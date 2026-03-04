import { useState } from "react";
import "@/App.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authApi, setAuthToken } from "@/lib/request";
import { useNavigate, useLocation } from "react-router";

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [badgeNumber, setBadgeNumber] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 获取登录前的页面路径
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/";

  // 处理登录
  const handleLogin = async () => {
    // 验证输入
    if (!badgeNumber.trim()) {
      setError("请输入警号");
      return;
    }
    if (!password.trim()) {
      setError("请输入密码");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await authApi.login({
        username: badgeNumber.trim(),
        password: password.trim(),
      });

      if (response.success && response.data) {
        // 保存token
        setAuthToken(response.data.token);
        // 保存用户信息
        localStorage.setItem("userInfo", JSON.stringify(response.data.user));
        // 跳转回原页面或首页
        navigate(from, { replace: true });
      } else {
        setError(response.error || "登录失败，请重试");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "登录失败，请检查网络");
    } finally {
      setLoading(false);
    }
  };

  // 处理回车键登录
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) {
      handleLogin();
    }
  };

  return (
    <main className="min-h-screen w-full bg-muted flex flex-col">
      {/* 标题区域 */}
      <div className="pt-20 pb-8 px-6">
        <h1 className="text-3xl font-bold text-foreground">登录</h1>
      </div>

      {/* 表单区域 */}
      <div className="flex-1 flex flex-col">
        {/* 警号输入 */}
        <div className="bg-background border-b border-border">
          <div className="flex items-center px-6 py-4">
            <label className="text-base text-foreground w-16 shrink-0">
              警号
            </label>
            <Input
              type="text"
              placeholder="请输入警号"
              value={badgeNumber}
              onChange={(e) => {
                setBadgeNumber(e.target.value);
                setError("");
              }}
              onKeyDown={handleKeyDown}
              className="flex-1 border-0 shadow-none focus-visible:ring-0 text-right placeholder:text-blue-500 text-base h-auto py-0 px-0"
              disabled={loading}
            />
          </div>
        </div>

        {/* 密码输入 */}
        <div className="bg-background border-b border-border">
          <div className="flex items-center px-6 py-4">
            <label className="text-base text-foreground w-16 shrink-0">
              密码
            </label>
            <Input
              type="password"
              placeholder="请输入密码"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              onKeyDown={handleKeyDown}
              className="flex-1 border-0 shadow-none focus-visible:ring-0 text-right placeholder:text-blue-500 text-base h-auto py-0 px-0"
              disabled={loading}
            />
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="px-6 pt-4">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* 登录按钮 */}
        <div className=" pt-5">
          <Button
            onClick={handleLogin}
            disabled={loading}
            className="w-full h-12 text-base font-medium text-white rounded-none"
          >
            {loading ? "登录中..." : "登录"}
          </Button>
        </div>
      </div>
    </main>
  );
}

export default LoginPage;
