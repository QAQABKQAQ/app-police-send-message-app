import { Button } from "@/components/ui/button";
import { API_SERVER } from "@/lib/request";

// 消息数据类型
export interface MessageData {
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

// 卡片类型
export type CardType = "uncompleted" | "completed" | "unread" | "timeout";

// 状态标签映射
const statusLabels: Record<string, { text: string; className: string }> = {
  pending: { text: "待处理", className: "bg-yellow-100 text-yellow-600" },
  processing: { text: "处理中", className: "bg-blue-100 text-blue-600" },
  completed: { text: "已完成", className: "bg-green-100 text-green-600" },
  returned: { text: "已退回", className: "bg-red-100 text-red-600" },
  unread: { text: "未查看", className: "bg-orange-100 text-orange-600" },
  read: { text: "已查看", className: "bg-gray-100 text-gray-600" },
  confirmed: { text: "已确认", className: "bg-green-100 text-green-600" },
  rejected: { text: "已退回", className: "bg-red-100 text-red-600" },
  timeout: { text: "已超时", className: "bg-red-100 text-red-600" },
};

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

interface ViolationCardProps {
  data: MessageData;
  type: CardType;
  onAction?: (data: MessageData, action: string) => void;
}

export function ViolationCard({ data, type, onAction }: ViolationCardProps) {
  const { violation, villageChief } = data;
  const statusInfo = statusLabels[data.status] || { text: data.status, className: "bg-gray-100 text-gray-600" };

  // 获取按钮配置
  const getButtonConfig = () => {
    switch (type) {
      case "uncompleted":
        return { text: "处理", action: "process", className: "bg-blue-500 hover:bg-blue-600" };
      case "completed":
        return { text: "查看详情", action: "view", className: "bg-blue-500 hover:bg-blue-600" };
      case "unread":
        return { text: "查看详情", action: "view", className: "bg-blue-500 hover:bg-blue-600" };
      case "timeout":
        return { text: "联系对方", action: "contact", className: "bg-blue-500 hover:bg-blue-600" };
      default:
        return { text: "查看", action: "view", className: "bg-blue-500 hover:bg-blue-600" };
    }
  };

  const buttonConfig = getButtonConfig();

  return (
    <div className="bg-background overflow-hidden">
      {/* 顶部：日期 + 状态 + 图片 */}
      <div className="flex gap-3 p-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-blue-500 text-base">{formatDate(data.sentAt)}</span>
            <span className={`text-xs px-2 py-0.5 rounded ${statusInfo.className}`}>
              {statusInfo.text}
            </span>
          </div>
          {/* 村名和违规类型 */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl font-bold text-foreground">
              {villageChief?.village?.name || "未知村"}
            </span>
            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded">
              {violation.violationTag}
            </span>
          </div>
          {/* 管理人 */}
          <p className="text-sm text-muted-foreground mb-1">
            管理人：{villageChief?.name || "未知"}
          </p>
          {/* 车牌号 */}
          <p className="text-lg font-bold text-blue-500">{violation.plateNumber}</p>
        </div>
        {/* 图片 */}
        <div className="w-24 h-20 shrink-0">
          <img
            src={violation.imageUrl
              ? (violation.imageUrl.startsWith('http') ? violation.imageUrl : `${API_SERVER}${violation.imageUrl}`)
              : "https://via.placeholder.com/100x80?text=No+Image"}
            alt="违章图片"
            className="w-full h-full object-cover rounded"
          />
        </div>
      </div>

      {/* 违规人员信息 + 车主信息 */}
      <div className="px-4 pb-3 flex gap-6">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-1">违规人员信息</p>
          <p className="text-base">
            <span className="font-medium">姓名：</span>{violation.offenderName}
          </p>
          <p className="text-base">
            <span className="font-medium">手机号：</span>{maskPhone(violation.offenderPhone)}
          </p>
        </div>
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-1">车主信息</p>
          <p className="text-base">
            <span className="font-medium">车主：</span>{violation.ownerName}
          </p>
          <p className="text-base">
            <span className="font-medium">车主手机号：</span>{maskPhone(violation.ownerPhone)}
          </p>
        </div>
      </div>

      {/* 底部按钮 */}
      <div className="px-4 pb-4">
        <Button
          className={`w-full text-white ${buttonConfig.className}`}
          onClick={() => onAction?.(data, buttonConfig.action)}
        >
          {buttonConfig.text}
        </Button>
      </div>
    </div>
  );
}

export default ViolationCard;
