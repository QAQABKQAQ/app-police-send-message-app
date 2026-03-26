import "@/App.css";
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { BottomNavigationBar, BottomNavigationItem } from "@/components/nav/bottom-navigation";
import { TitleBar } from "@/components/text/title-bar";
import { SelectDistrictDrawer } from "@/components/drawer/SelectDistrictDrawer";
import { policeApi, API_SERVER } from "@/lib/request";
import { Plus, Trash2, List } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

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

// 获取图片完整 URL
function getImageUrl(imageUrl: string | null): string {
  if (!imageUrl) return "https://via.placeholder.com/400x200?text=No+Image";
  return imageUrl.startsWith("http") ? imageUrl : `${API_SERVER}${imageUrl}`;
}

function DefaultPage() {
  const navigate = useNavigate();
  // 状态管理
  const [violations, setViolations] = useState<Violation[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dispatching, setDispatching] = useState(false);

  // 删除相关状态
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // 预览列表状态
  const [previewOpen, setPreviewOpen] = useState(false);

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
        setViolations((prev) => prev.filter((_, i) => i !== currentIndex));
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

  // 删除当前违章
  const handleDelete = async () => {
    if (!currentViolation) return;

    setDeleting(true);
    try {
      const response = await policeApi.deleteViolation(currentViolation.id);
      if (response.success) {
        setDeleteDialogOpen(false);
        // 从列表移除
        const newViolations = violations.filter((_, i) => i !== currentIndex);
        setViolations(newViolations);
        // 调整索引
        if (currentIndex >= newViolations.length && currentIndex > 0) {
          setCurrentIndex(currentIndex - 1);
        }
      }
    } catch (error) {
      console.error("删除失败:", error);
    } finally {
      setDeleting(false);
    }
  };

  // 从预览列表选择某条违章
  const handlePreviewSelect = (index: number) => {
    setCurrentIndex(index);
    setPreviewOpen(false);
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
        <TitleBar>
          <div className="flex items-center justify-between w-full pr-4">
            <span>处理</span>
            <button
              onClick={() => navigate("/upload")}
              className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </TitleBar>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] pt-19 gap-4">
          <p className="text-muted-foreground">暂无待分发的违章信息</p>
          <Button
            onClick={() => navigate("/upload")}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6"
          >
            <Plus className="w-4 h-4 mr-1" />
            上传违章
          </Button>
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
          <div className="flex items-center gap-2">
            {/* 预览列表按钮 */}
            <button
              onClick={() => setPreviewOpen(true)}
              className="w-8 h-8 rounded-full bg-gray-500 text-white flex items-center justify-center"
            >
              <List className="w-5 h-5" />
            </button>
            {/* 上传按钮 */}
            <button
              onClick={() => navigate("/upload")}
              className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
      </TitleBar>

      {/* 可滚动内容区域 */}
      <div className="flex-1 overflow-y-auto bg-muted pb-20 pt-19">
        {/* 相关监控图片 */}
        <div className="bg-background p-4">
          <h2 className="text-lg font-medium text-foreground mb-3">相关监控图片</h2>
          <img
            src={getImageUrl(currentViolation.imageUrl)}
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
          <div className="flex items-center gap-2">
            <span className="text-blue-500 text-base">
              {formatDate(currentViolation.createdAt)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setDeleteDialogOpen(true)}
              variant="destructive"
              className="px-4 text-base"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              删除
            </Button>
            <Button
              onClick={handleOpenDrawer}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 text-base"
            >
              选择管辖区
            </Button>
          </div>
        </div>
      </div>

      {/* 删除确认对话框 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除车牌号为 <span className="font-bold text-foreground">{currentViolation.plateNumber}</span> 的违章记录吗？此操作不可恢复。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "删除中..." : "确认删除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 预览列表对话框 */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>待处理列表 ({violations.length})</DialogTitle>
            <DialogDescription>
              点击选择要处理的违章记录
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {violations.map((v, index) => (
              <button
                key={v.id}
                onClick={() => handlePreviewSelect(index)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                  index === currentIndex
                    ? "bg-blue-50 border-2 border-blue-500"
                    : "bg-gray-50 border-2 border-transparent hover:bg-gray-100"
                }`}
              >
                <img
                  src={getImageUrl(v.imageUrl)}
                  alt=""
                  className="w-16 h-12 object-cover rounded shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground truncate">{v.plateNumber}</span>
                    <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded shrink-0">
                      {v.violationTag}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {v.offenderName} · {formatDate(v.violationTime)}
                  </div>
                </div>
                {index === currentIndex && (
                  <span className="text-xs text-blue-500 font-medium shrink-0">当前</span>
                )}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

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
