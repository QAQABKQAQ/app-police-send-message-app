import "@/App.css";
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BottomNavigationBar, BottomNavigationItem } from "@/components/nav/bottom-navigation";
import { TitleBar } from "@/components/text/title-bar";
import { ViolationCard, MessageData, CardType } from "@/components/card/ViolationCard";
import { policeApi } from "@/lib/request";

// 分页响应类型
interface PaginatedResponse {
  items: MessageData[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Tab 配置
const tabConfigs = [
  { value: "uncompleted", label: "未完成" },
  { value: "completed", label: "已完成" },
  { value: "unread", label: "未被查看" },
  { value: "timeout", label: "已超时" },
] as const;

// 违章列表组件
interface ViolationListProps {
  data: MessageData[];
  loading: boolean;
  type: CardType;
  onAction: (data: MessageData, action: string) => void;
}

function ViolationList({ data, loading, type, onAction }: ViolationListProps) {
  if (loading) {
    return (
      <div className="flex items-center bg-muted-bg justify-center h-40">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center bg-muted-bg justify-center h-[calc(100vh-10rem-10rem)]">
        <p className="text-muted-foreground">暂无数据</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 h-[calc(100vh-10rem-10rem)]">
      {data.map((item) => (
        <ViolationCard
          key={item.id}
          data={item}
          type={type}
          onAction={onAction}
        />
      ))}
    </div>
  );
}

function RecordPage() {
  const navigate = useNavigate();
  // 当前选中的 tab
  const [activeTab, setActiveTab] = useState<CardType>("uncompleted");

  // 各 tab 的数据
  const [uncompletedData, setUncompletedData] = useState<MessageData[]>([]);
  const [completedData, setCompletedData] = useState<MessageData[]>([]);
  const [unreadData, setUnreadData] = useState<MessageData[]>([]);
  const [timeoutData, setTimeoutData] = useState<MessageData[]>([]);

  // 加载状态
  const [loadingUncompleted, setLoadingUncompleted] = useState(false);
  const [loadingCompleted, setLoadingCompleted] = useState(false);
  const [loadingUnread, setLoadingUnread] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // 加载未完成数据
  const loadUncompleted = useCallback(async () => {
    setLoadingUncompleted(true);
    try {
      const response = await policeApi.getHistory({ status: "uncompleted", page: 1, pageSize: 100 });
      if (response.success && response.data) {
        const data = response.data as PaginatedResponse;
        setUncompletedData(data.items);
      }
    } catch (error) {
      console.error("加载未完成数据失败:", error);
    } finally {
      setLoadingUncompleted(false);
    }
  }, []);

  // 加载已完成数据
  const loadCompleted = useCallback(async () => {
    setLoadingCompleted(true);
    try {
      const response = await policeApi.getHistory({ status: "completed", page: 1, pageSize: 100 });
      if (response.success && response.data) {
        const data = response.data as PaginatedResponse;
        setCompletedData(data.items);
      }
    } catch (error) {
      console.error("加载已完成数据失败:", error);
    } finally {
      setLoadingCompleted(false);
    }
  }, []);

  // 加载未被查看数据
  const loadUnread = useCallback(async () => {
    setLoadingUnread(true);
    try {
      const response = await policeApi.getUnreadMessages({ page: 1, pageSize: 100 });
      if (response.success && response.data) {
        const data = response.data as PaginatedResponse;
        setUnreadData(data.items);
      }
    } catch (error) {
      console.error("加载未被查看数据失败:", error);
    } finally {
      setLoadingUnread(false);
    }
  }, []);

  // 加载已超时数据
  const loadTimeout = useCallback(async () => {
    setLoadingTimeout(true);
    try {
      const response = await policeApi.getTimeoutMessages({ page: 1, pageSize: 100 });
      if (response.success && response.data) {
        const data = response.data as PaginatedResponse;
        setTimeoutData(data.items);
      }
    } catch (error) {
      console.error("加载已超时数据失败:", error);
    } finally {
      setLoadingTimeout(false);
    }
  }, []);

  // 切换 tab 时加载对应数据
  useEffect(() => {
    switch (activeTab) {
      case "uncompleted":
        if (uncompletedData.length === 0) loadUncompleted();
        break;
      case "completed":
        if (completedData.length === 0) loadCompleted();
        break;
      case "unread":
        if (unreadData.length === 0) loadUnread();
        break;
      case "timeout":
        if (timeoutData.length === 0) loadTimeout();
        break;
    }
  }, [activeTab, uncompletedData.length, completedData.length, unreadData.length, timeoutData.length, loadUncompleted, loadCompleted, loadUnread, loadTimeout]);

  // 初始加载
  useEffect(() => {
    loadUncompleted();
  }, [loadUncompleted]);

  // 处理卡片操作
  const handleCardAction = (data: MessageData, action: string) => {
    console.log("Card action:", action, data);
    switch (action) {
      case "process":
        // 处理违章 - 跳转到详情页
        navigate(`/detail/${data.id}`);
        break;
      case "view":
        // 查看详情
        navigate(`/detail/${data.id}`);
        break;
      case "contact":
        // 联系对方 - 跳转到详情页
        navigate(`/detail/${data.id}`);
        break;
    }
  };

  return (
    <main className="pt-10 w-full h-screen bg-muted-bg flex flex-col">
      <TitleBar>管理</TitleBar>

      {/* Tabs 导航 */}
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as CardType)}
        className="flex-1 flex flex-col fixed top-26"
      >
        <TabsList className="w-screen justify-start bg-background h-12! right-0 left-0 rounded-none">
          {tabConfigs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="shadow-none! rounded-none tabItem data-[state=active]:text-primary text-md"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* 可滚动内容区域 */}
        <div className="flex-1 overflow-y-auto bg-muted pb-20">
          <TabsContent value="uncompleted" className="mt-0">
            <ViolationList
              data={uncompletedData}
              loading={loadingUncompleted}
              type="uncompleted"
              onAction={handleCardAction}
            />
          </TabsContent>

          <TabsContent value="completed" className="mt-0">
            <ViolationList
              data={completedData}
              loading={loadingCompleted}
              type="completed"
              onAction={handleCardAction}
            />
          </TabsContent>

          <TabsContent value="unread" className="mt-0">
            <ViolationList
              data={unreadData}
              loading={loadingUnread}
              type="unread"
              onAction={handleCardAction}
            />
          </TabsContent>

          <TabsContent value="timeout" className="mt-0 ">
            <ViolationList
              data={timeoutData}
              loading={loadingTimeout}
              type="timeout"
              onAction={handleCardAction}
            />
          </TabsContent>
        </div>
      </Tabs>

      {/* 底部导航 */}
      <BottomNavigationBar>
        <BottomNavigationItem label="处理" location="/" />
        <BottomNavigationItem label="管理" location="/record" />
        <BottomNavigationItem label="我的" location="/mine" />
      </BottomNavigationBar>
    </main>
  );
}

export default RecordPage;
