import "@/App.css";
import { useEffect, useState, useCallback } from "react";
import { BottomNavigationBar, BottomNavigationItem } from "@/components/nav/bottom-navigation";
import { TitleBar } from "@/components/text/title-bar";
import { authApi } from "@/lib/request";

// 用户信息类型
interface UserInfo {
  id: number;
  username: string;
  name: string;
  phone: string;
  role: "police" | "village_chief";
  badgeNumber?: string;
  avatar: string | null;
  villageId: number | null;
  village: {
    id: number;
    name: string;
    area: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

function MinePage() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // 加载用户信息
  const loadUserInfo = useCallback(async () => {
    setLoading(true);
    try {
      const response = await authApi.getProfile();
      if (response.success && response.data) {
        setUserInfo(response.data as UserInfo);
      }
    } catch (error) {
      console.error("加载用户信息失败:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUserInfo();
  }, [loadUserInfo]);

  return (
    <main className="pt-10 w-full h-screen bg-muted-bg flex flex-col">
      <TitleBar>我的</TitleBar>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto pt-19 pb-20">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">加载中...</p>
          </div>
        ) : userInfo ? (
          <div className="space-y-4">
            {/* 用户信息卡片 */}
            <div className="bg-background p-4 flex items-center gap-4">
              {/* 头像 */}
              <div className="w-14 h-14 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden shrink-0">
                {userInfo.avatar ? (
                  <img 
                    src={userInfo.avatar} 
                    alt="头像" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-gray-500 text-2xl">
                    {userInfo.name?.charAt(0) || "U"}
                  </span>
                )}
              </div>
              
              {/* 用户信息 */}
              <div className="flex-1">
                <h2 className="text-lg font-bold text-foreground">
                  {userInfo.name}
                </h2>
                <p className="text-sm text-muted-foreground">
                  警号：{userInfo.badgeNumber || "无"}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">暂无用户信息</p>
          </div>
        )}
      </div>

      {/* 底部导航 */}
      <BottomNavigationBar>
        <BottomNavigationItem label="处理" location="/" />
        <BottomNavigationItem label="管理" location="/record" />
        <BottomNavigationItem label="我的" location="/mine" />
      </BottomNavigationBar>
    </main>
  );
}

export default MinePage;
