import "@/App.css";
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { BottomNavigationBar, BottomNavigationItem } from "@/components/nav/bottom-navigation";
import { TitleBar } from "@/components/text/title-bar";
import { SelectDistrictDrawer } from "@/components/drawer/SelectDistrictDrawer";
import { policeApi } from "@/lib/request";
import { Plus } from "lucide-react";

// 违章数据类型
interface Violation {
  id: number;
  violationTime: string;
  violationTag: string;
  imageUrl: string;
  offenderName: string;
  offenderPhone: string;
  plateNumber: string;
  ownerName: string;
  ownerPhone: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// 村庄数据类型已移至 SelectDistrictDrawer 组件

// 分页响应类型
interface PaginatedResponse {
  items: Violation[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 格式化日期
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

// 隐藏手机号中间四位
function maskPhone(phone: string): string {
  if (!phone || phone.length < 7) return phone;
  return phone.slice(0, 3) + "····" + phone.slice(-4);
}

function DefaultPage() {
  const navigate = useNavigate();
  // 状态管理
  const [violations, setViolations] = useState<Violation[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dispatching, setDispatching] = useState(false);

  // 当前显示的违章数据
  const currentViolation = violations[currentIndex];

  // 加载未分发的违章列表
  const loadViolations = useCallback(async () => {
    setLoading(true);
    try {
      const response = await policeApi.getPendingViolations({ page: 1, pageSize: 100 });
      if (response.success && response.data) {
        const data = response.data as PaginatedResponse;
        setViolations(data.items);
        setCurrentIndex(0);
      }
    } catch (error) {
      console.error("加载违章列表失败:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 初始加载
  useEffect(() => {
    loadViolations();
  }, [loadViolations]);

  // 打开选择管辖区抽屉
  const handleOpenDrawer = () => {
    setDrawerOpen(true);
  };

  // 分发违章
  const handleDispatch = async (chiefIds: number[]) => {
    if (!currentViolation || chiefIds.length === 0) return;

    setDispatching(true);
    try {
      const response = await policeApi.dispatchViolation(
        currentViolation.id,
        chiefIds
      );

      if (response.success) {
        setDrawerOpen(false);
        // 移除已分发的违章，自动切换到下一条
        setViolations((prev) => prev.filter((_, i) => i !== currentIndex));
        // 如果当前索引超出范围，调整到最后一条
        if (currentIndex >= violations.length - 1 && currentIndex > 0) {
          setCurrentIndex(currentIndex - 1);
        }
      }
    } catch (error) {
      console.error("分发失败:", error);
    } finally {
      setDispatching(false);
    }
  };

  // 加载中状态
  if (loading) {
    return (
      <main className="pt-10 w-full h-full bg-background">
        <TitleBar>处理</TitleBar>
        <div className="flex items-center justify-center h-[calc(100vh-10rem)] pt-19">
          <p className="text-muted-foreground">加载中...</p>
        </div>
        <BottomNavigationBar>
          <BottomNavigationItem label="处理" location="/" />
          <BottomNavigationItem label="管理" location="/record" />
          <BottomNavigationItem label="我的" location="/mine" />
        </BottomNavigationBar>
      </main>
    );
  }

  // 无数据状态
  if (!currentViolation) {
    return (
      <main className="pt-10 w-full h-full bg-background">
        <TitleBar>处理</TitleBar>
        <div className="flex items-center justify-center h-[calc(100vh-10rem)] pt-19">
          <p className="text-muted-foreground">暂无待分发的违章信息</p>
        </div>
        <BottomNavigationBar>
          <BottomNavigationItem label="处理" location="/" />
          <BottomNavigationItem label="管理" location="/record" />
          <BottomNavigationItem label="我的" location="/mine" />
        </BottomNavigationBar>
      </main>
    );
  }

  return (
    <main className="pt-10 w-full h-full bg-background flex flex-col">
      <TitleBar>
        <div className="flex items-center justify-between w-full pr-4">
          <span>处理 ({currentIndex + 1}/{violations.length})</span>
          <button
            onClick={() => navigate("/upload")}
            className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </TitleBar>

      {/* 可滚动内容区域 */}
      <div className="flex-1 overflow-y-auto bg-muted pb-20 pt-19">
        {/* 相关监控图片 */}
        <div className="bg-background p-4">
          <h2 className="text-lg font-medium text-foreground mb-3">相关监控图片</h2>
          <img
            src={currentViolation.imageUrl || "https://via.placeholder.com/400x200?text=No+Image"}
            alt="违章图片"
            className="w-full h-48 object-cover rounded"
          />
        </div>

        {/* 违规信息 */}
        <div className="bg-background mt-3 p-4">
          <h2 className="text-lg font-medium text-foreground border-b border-border pb-3">违规信息</h2>
          <div className="pt-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-foreground">民兴村</span>
                <span className="text-sm bg-blue-100 text-blue-600 px-2 py-1 rounded">
                  {currentViolation.violationTag}
                </span>
              </div>
              <span className="text-2xl font-bold text-blue-500">
                {currentViolation.plateNumber}
              </span>
            </div>
            <div className="flex items-center justify-between mt-3 text-base text-muted-foreground">
              <span>管理人：{currentViolation.offenderName}</span>
              <span>{formatDate(currentViolation.violationTime)}</span>
            </div>
          </div>
        </div>

        {/* 车辆信息 */}
        <div className="bg-background mt-3 p-4">
          <h2 className="text-lg font-medium text-foreground border-b border-border pb-3">车辆信息</h2>
          <div className="pt-3 flex items-center gap-6">
            <span className="text-lg">
              <span className="font-medium">车主：</span>
              {currentViolation.ownerName}
            </span>
            <span className="text-lg">
              <span className="font-medium">车主手机号：</span>
              {maskPhone(currentViolation.ownerPhone)}
            </span>
          </div>
        </div>

        {/* 违规人员信息 */}
        <div className="bg-background mt-3 p-4">
          <h2 className="text-lg font-medium text-foreground border-b border-border pb-3">违规人员信息</h2>
          <div className="pt-3 flex items-center gap-6">
            <span className="text-lg">
              <span className="font-medium">姓名：</span>
              {currentViolation.offenderName}
            </span>
            <span className="text-lg">
              <span className="font-medium">手机号：</span>
              {maskPhone(currentViolation.offenderPhone)}
            </span>
          </div>
        </div>

        {/* 底部操作区 */}
        <div className="bg-background mt-3 p-4 flex items-center justify-between mb-6">
          <span className="text-blue-500 text-base">
            {formatDate(currentViolation.createdAt)}
          </span>
          <Button
            onClick={handleOpenDrawer}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 text-base"
          >
            选择管辖区
          </Button>
        </div>
      </div>

      {/* 选择管辖区抽屉 */}
      <SelectDistrictDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onConfirm={handleDispatch}
        loading={dispatching}
        title="选择管辖区"
        confirmText="发送通知"
      />

      {/* 底部导航 */}
      <BottomNavigationBar>
        <BottomNavigationItem label="处理" location="/" />
        <BottomNavigationItem label="管理" location="/record" />
        <BottomNavigationItem label="我的" location="/mine" />
      </BottomNavigationBar>
    </main>
  );
}

export default DefaultPage;
