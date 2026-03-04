import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import { policeApi } from "@/lib/request";
import { cn } from "@/lib/utils";

// 村庄数据类型
interface Village {
  id: number;
  name: string;
  area: string;
  chiefs: {
    id: number;
    name: string;
    phone: string;
    username: string;
  }[];
}

// 解析后的地区数据
interface ParsedArea {
  city: string;
  town: string;
  village: string;
  villageId: number;
  chiefs: Village["chiefs"];
}

interface SelectDistrictDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (chiefIds: number[]) => void;
  loading?: boolean;
  title?: string;
  confirmText?: string;
}

// iOS风格滚轮选择器组件
interface PickerColumnProps {
  items: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

const ITEM_HEIGHT = 44;

function PickerColumn({ items, selectedIndex, onSelect }: PickerColumnProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isScrollingRef = useRef(false);

  // 滚动到指定索引
  const scrollToIndex = useCallback((index: number, smooth = true) => {
    if (!containerRef.current) return;
    const targetScroll = index * ITEM_HEIGHT;
    containerRef.current.scrollTo({
      top: targetScroll,
      behavior: smooth ? "smooth" : "auto",
    });
  }, []);

  // 初始化滚动位置
  useEffect(() => {
    // 延迟执行确保 DOM 已渲染
    const timer = setTimeout(() => {
      scrollToIndex(selectedIndex, false);
    }, 50);
    return () => clearTimeout(timer);
  }, [selectedIndex, scrollToIndex, items]);

  // 处理滚动结束，对齐到最近的项
  const handleScrollEnd = useCallback(() => {
    if (!containerRef.current) return;
    const scrollTop = containerRef.current.scrollTop;
    const index = Math.round(scrollTop / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(items.length - 1, index));
    
    if (clampedIndex !== selectedIndex) {
      onSelect(clampedIndex);
    }
    scrollToIndex(clampedIndex, true);
  }, [items.length, onSelect, selectedIndex, scrollToIndex]);

  // 滚动事件处理 - 使用防抖
  const handleScroll = useCallback(() => {
    isScrollingRef.current = true;
    
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    scrollTimeoutRef.current = setTimeout(() => {
      isScrollingRef.current = false;
      handleScrollEnd();
    }, 150);
  }, [handleScrollEnd]);

  // 点击选中
  const handleItemClick = useCallback((index: number) => {
    if (isScrollingRef.current) return;
    scrollToIndex(index, true);
    onSelect(index);
  }, [onSelect, scrollToIndex]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="flex-1 relative h-55 overflow-hidden">
      {/* 选中框 */}
      <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-11 border-y border-border pointer-events-none z-10" />
      {/* 渐变遮罩 */}
      <div className="absolute inset-x-0 top-0 h-22 bg-linear-to-b from-background to-transparent pointer-events-none z-20" />
      <div className="absolute inset-x-0 bottom-0 h-22 bg-linear-to-t from-background to-transparent pointer-events-none z-20" />
      
      {/* 滚动容器 - 使用原生滚动 */}
      <div
        ref={containerRef}
        className="h-full overflow-y-auto scrollbar-hide overscroll-contain"
        style={{ 
          paddingTop: ITEM_HEIGHT * 2,
          paddingBottom: ITEM_HEIGHT * 2,
          scrollSnapType: "y mandatory",
          WebkitOverflowScrolling: "touch",
        }}
        onScroll={handleScroll}
      >
        {items.map((item, index) => {
          const isSelected = index === selectedIndex;
          return (
            <div
              key={`${item}-${index}`}
              className={cn(
                "h-11 flex items-center justify-center cursor-pointer select-none",
                isSelected ? "text-foreground font-bold text-lg" : "text-muted-foreground text-base"
              )}
              style={{ scrollSnapAlign: "center" }}
              onClick={() => handleItemClick(index)}
            >
              {item}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function SelectDistrictDrawer({
  open,
  onOpenChange,
  onConfirm,
  loading = false,
  title = "选择管辖区",
  confirmText = "发送通知",
}: SelectDistrictDrawerProps) {
  const [loadingVillages, setLoadingVillages] = useState(false);
  
  // 解析后的地区数据
  const [parsedAreas, setParsedAreas] = useState<ParsedArea[]>([]);
  
  // 三级选择索引
  const [cityIndex, setCityIndex] = useState(0);
  const [townIndex, setTownIndex] = useState(0);
  const [villageIndex, setVillageIndex] = useState(0);

  // 加载村庄列表
  const loadVillages = useCallback(async () => {
    setLoadingVillages(true);
    try {
      const response = await policeApi.getVillages();
      if (response.success && response.data) {
        const data = response.data as Village[];
        
        // 解析地区数据
        const parsed: ParsedArea[] = data.map((v) => {
          // 解析 area 字段，假设格式为 "市镇" 或 "市乡"
          const parts = v.area.split(/[市镇乡县区]/).filter(Boolean);
          return {
            city: parts[0] || v.area,
            town: parts[1] || "",
            village: v.name,
            villageId: v.id,
            chiefs: v.chiefs,
          };
        });
        setParsedAreas(parsed);
      }
    } catch (error) {
      console.error("加载村庄列表失败:", error);
    } finally {
      setLoadingVillages(false);
    }
  }, []);

  // 打开时加载数据并重置选择
  useEffect(() => {
    if (open) {
      loadVillages();
      setCityIndex(0);
      setTownIndex(0);
      setVillageIndex(0);
    }
  }, [open, loadVillages]);

  // 获取去重后的市列表
  const cities = [...new Set(parsedAreas.map((a) => a.city))];
  
  // 根据选中的市获取乡镇列表
  const selectedCity = cities[cityIndex] || "";
  const towns = [...new Set(
    parsedAreas
      .filter((a) => a.city === selectedCity)
      .map((a) => a.town)
  )];
  
  // 根据选中的市和乡获取村列表
  const selectedTown = towns[townIndex] || "";
  const villagesList = parsedAreas.filter(
    (a) => a.city === selectedCity && a.town === selectedTown
  );
  
  // 当前选中的村庄
  const selectedVillage = villagesList[villageIndex];

  // 市变化时重置乡和村
  const handleCityChange = (index: number) => {
    setCityIndex(index);
    setTownIndex(0);
    setVillageIndex(0);
  };

  // 乡变化时重置村
  const handleTownChange = (index: number) => {
    setTownIndex(index);
    setVillageIndex(0);
  };

  // 确认分配
  const handleConfirm = () => {
    if (selectedVillage && selectedVillage.chiefs.length > 0) {
      // 选择该村的所有村长
      const chiefIds = selectedVillage.chiefs.map((c) => c.id);
      onConfirm(chiefIds);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="border-b border-border pb-4">
          <DrawerTitle className="text-xl font-bold text-left">{title}</DrawerTitle>
        </DrawerHeader>

        {/* iOS风格滚轮选择器 */}
        <div className="px-4 py-2">
          {loadingVillages ? (
            <div className="flex items-center justify-center h-[220px]">
              <p className="text-muted-foreground">加载中...</p>
            </div>
          ) : (
            <>
              {/* 标题行 */}
              <div className="flex text-sm text-muted-foreground mb-2">
                <div className="flex-1 text-center">市</div>
                <div className="flex-1 text-center">乡/镇</div>
                <div className="flex-1 text-center">村</div>
              </div>
              
              {/* 三列滚轮 */}
              <div className="flex">
                <PickerColumn
                  items={cities.length > 0 ? cities : ["暂无数据"]}
                  selectedIndex={cityIndex}
                  onSelect={handleCityChange}
                />
                <PickerColumn
                  items={towns.length > 0 ? towns : ["暂无数据"]}
                  selectedIndex={townIndex}
                  onSelect={handleTownChange}
                />
                <PickerColumn
                  items={villagesList.length > 0 ? villagesList.map((v) => v.village) : ["暂无数据"]}
                  selectedIndex={villageIndex}
                  onSelect={setVillageIndex}
                />
              </div>
            </>
          )}
        </div>

        <DrawerFooter className="border-t border-border pt-4">
          <Button
            onClick={handleConfirm}
            disabled={!selectedVillage || selectedVillage.chiefs.length === 0 || loading}
            className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white text-base font-medium rounded-xl"
          >
            {loading ? "处理中..." : confirmText}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

export default SelectDistrictDrawer;
