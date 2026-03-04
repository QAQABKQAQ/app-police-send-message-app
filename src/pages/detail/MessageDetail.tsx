import "@/App.css";
import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { SelectDistrictDrawer } from "@/components/drawer/SelectDistrictDrawer";
import { policeApi } from "@/lib/request";
import { ChevronLeft, Phone } from "lucide-react";
import { openUrl } from "@tauri-apps/plugin-opener";

// 消息详情数据类型
interface MessageDetail {
  id: number;
  violationId: number;
  policeId: number;
  villageChiefId: number;
  status: string;
  sentAt: string;
  readAt: string | null;
  processedAt: string | null;
  isLocalResident: boolean | null;
  violation: {
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
  };
  police?: {
    id: number;
    name: string;
    phone: string;
    badgeNumber: string;
  };
  villageChief?: {
    id: number;
    name: string;
    phone: string;
    village?: {
      id: number;
      name: string;
      area: string;
    };
  };
}

// 村庄数据类型已移至 SelectDistrictDrawer 组件

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

// 状态标签映射
const statusLabels: Record<string, { text: string; className: string }> = {
  unread: { text: "暂缺人头查看", className: "bg-orange-100 text-orange-600" },
  read: { text: "已查看", className: "bg-gray-100 text-gray-600" },
  confirmed: { text: "已确认", className: "bg-green-100 text-green-600" },
  rejected: { text: "已退回", className: "bg-red-100 text-red-600" },
  timeout: { text: "已超时", className: "bg-red-100 text-red-600" },
};

function MessageDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<MessageDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [phoneDialogOpen, setPhoneDialogOpen] = useState(false);
  
  // 重新分配相关状态
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dispatching, setDispatching] = useState(false);

  // 加载详情数据
  const loadDetail = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const response = await policeApi.getMessageDetail(Number(id));
      if (response.success && response.data) {
        setDetail(response.data as MessageDetail);
      }
    } catch (error) {
      console.error("加载详情失败:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  // 返回上一页
  const handleBack = () => {
    navigate(-1);
  };

  // 获取按钮配置
  const getButtonConfig = (status: string) => {
    switch (status) {
      case "unread":
        return { text: "待查看", disabled: true, action: "none" };
      case "timeout":
        return { text: "联系对方", disabled: false, action: "contact" };
      case "confirmed":
        return { text: "已完成", disabled: true, action: "none" };
      case "rejected":
        return { text: "重新分配", disabled: false, action: "reassign" };
      case "read":
        return { text: "已查看", disabled: true, action: "none" };
      default:
        return { text: "查看", disabled: true, action: "none" };
    }
  };

  // 处理按钮点击
  const handleButtonClick = () => {
    if (detail?.status === "timeout") {
      setPhoneDialogOpen(true);
    } else if (detail?.status === "rejected") {
      // 打开重新分配抽屉
      setDrawerOpen(true);
    }
  };

  // 拨打电话
  const handleCallPhone = async () => {
    const phone = villageChief?.phone;
    if (phone) {
      try {
        // 使用 Tauri opener 插件打开 tel: 链接
        await openUrl(`tel:${phone}`);
      } catch (error) {
        console.error("拨打电话失败:", error);
      }
    }
    setPhoneDialogOpen(false);
  };

  // 重新分配违章
  const handleReassign = async (chiefIds: number[]) => {
    if (!detail || chiefIds.length === 0) return;

    setDispatching(true);
    try {
      const response = await policeApi.dispatchViolation(
        detail.violationId,
        chiefIds
      );

      if (response.success) {
        setDrawerOpen(false);
        // 返回上一页
        navigate(-1);
      }
    } catch (error) {
      console.error("重新分配失败:", error);
    } finally {
      setDispatching(false);
    }
  };

  if (loading) {
    return (
      <main className="w-full h-screen bg-muted flex items-center justify-center">
        <p className="text-muted-foreground">加载中...</p>
      </main>
    );
  }

  if (!detail) {
    return (
      <main className="w-full h-screen bg-muted flex items-center justify-center">
        <p className="text-muted-foreground">数据不存在</p>
      </main>
    );
  }

  const { violation, villageChief } = detail;
  const villageName = villageChief?.village?.name || "未知村";
  const chiefPhone = villageChief?.phone || "未知";
  const statusInfo = statusLabels[detail.status] || { text: detail.status, className: "bg-gray-100 text-gray-600" };
  const buttonConfig = getButtonConfig(detail.status);

  return (
    <main className="w-full min-h-screen bg-muted-bg flex flex-col">
      <div className="h-10 w-full bg-background"/>
      {/* 顶部导航栏 */}
      <div className="bg-background h-14 flex items-center px-4 sticky top-0 z-10">
        <button onClick={handleBack} className="p-2 -ml-2">
          <ChevronLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 className="flex-1 text-center text-lg font-medium text-foreground pr-8">
          {villageName}
        </h1>
      </div>

      {/* 可滚动内容区域 */}
      <div className="flex-1 overflow-y-auto pb-24">
        {/* 相关监控图片 */}
        <div className="bg-background p-4">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-lg font-medium text-foreground">相关监控图片</h2>
            <span className={`text-xs px-2 py-0.5 rounded ${statusInfo.className}`}>
              {statusInfo.text}
            </span>
          </div>
          <img
            src={violation.imageUrl || "https://via.placeholder.com/400x200?text=No+Image"}
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
                <span className="text-2xl font-bold text-foreground">{villageName}</span>
                <span className="text-sm bg-blue-100 text-blue-600 px-2 py-1 rounded">
                  {violation.violationTag}
                </span>
              </div>
              <span className="text-2xl font-bold text-blue-500">
                {violation.plateNumber}
              </span>
            </div>
            <div className="flex items-center justify-between mt-3 text-base text-muted-foreground">
              <span>管理人：{villageChief?.name || "未知"}</span>
              <span>{formatDate(violation.violationTime)}</span>
            </div>
          </div>
        </div>

        {/* 车辆信息 */}
        <div className="bg-background mt-3 p-4">
          <h2 className="text-lg font-medium text-foreground border-b border-border pb-3">车辆信息</h2>
          <div className="pt-3">
            <p className="text-2xl font-bold text-blue-500 mb-2">{violation.plateNumber}</p>
            <div className="flex items-center gap-6">
              <span className="text-lg">
                <span className="font-medium">车主：</span>
                {violation.ownerName}
              </span>
              <span className="text-lg">
                <span className="font-medium">车主手机号：</span>
                {maskPhone(violation.ownerPhone)}
              </span>
            </div>
          </div>
        </div>

        {/* 违规人员信息 */}
        <div className="bg-background mt-3 p-4">
          <h2 className="text-lg font-medium text-foreground border-b border-border pb-3">违规人员信息</h2>
          <div className="pt-3 flex items-center gap-6">
            <span className="text-lg">
              <span className="font-medium">姓名：</span>
              {violation.offenderName}
            </span>
            <span className="text-lg">
              <span className="font-medium">手机号：</span>
              {maskPhone(violation.offenderPhone)}
            </span>
          </div>
        </div>
      </div>

      {/* 底部操作区 - 固定在底部 */}
      <div className="fixed bottom-0 left-0 h-24 right-0 bg-background p-4 flex flex-col justify-center border-t border-border">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-base">
            {formatDate(detail.sentAt)}
          </span>
          <Button
            disabled={buttonConfig.disabled}
            onClick={handleButtonClick}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 text-base disabled:opacity-50"
          >
            {buttonConfig.text}
          </Button>
        </div>
      </div>

      {/* 手机号弹窗 */}
      <Dialog open={phoneDialogOpen} onOpenChange={setPhoneDialogOpen}>
        <DialogContent className="max-w-[85%] rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-center text-lg">联系村长</DialogTitle>
          </DialogHeader>
          <div className="py-6 flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
              <Phone className="w-8 h-8 text-blue-500" />
            </div>
            <p className="text-base text-muted-foreground mb-2">
              {villageChief?.name || "村长"}
            </p>
            <p className="text-2xl font-bold text-foreground tracking-wider">
              {chiefPhone}
            </p>
          </div>
          <DialogFooter className="flex-row gap-3">
            <Button
              variant="outline"
              onClick={() => setPhoneDialogOpen(false)}
              className="flex-1 h-12"
            >
              取消
            </Button>
            <Button
              onClick={handleCallPhone}
              className="flex-1 h-12 bg-blue-500 hover:bg-blue-600 text-white"
            >
              拨打电话
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* 选择管辖区抽屉 */}
      <SelectDistrictDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onConfirm={handleReassign}
        loading={dispatching}
        title="重新分配 - 选择管辖区"
        confirmText="发送通知"
      />
    </main>
  );
}

export default MessageDetailPage;
