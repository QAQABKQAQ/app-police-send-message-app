import "@/App.css";
import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TitleBar } from "@/components/text/title-bar";
import { policeApi } from "@/lib/request";
import { ChevronLeft, Camera, Upload } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

// 违章类型列表（与后端 mock.service 一致）
const VIOLATION_TAGS = [
    "超载", "无证驾驶", "酒驾", "闯红灯", "逆行",
    "超速", "违规载人", "非法改装", "未悬挂号牌", "号牌污损",
];

// 生成随机姓名
const generateRandomName = () => {
    const surnames = ["张", "王", "李", "赵", "刘", "陈", "杨", "黄", "周", "吴"];
    const names = ["伟", "芳", "娜", "秀英", "敏", "静", "丽", "强", "磊", "军", "洋", "勇", "艳", "杰", "涛", "明", "超", "秀兰"];
    return surnames[Math.floor(Math.random() * surnames.length)] +
           names[Math.floor(Math.random() * names.length)];
};

// 生成随机手机号
const generateRandomPhone = () => {
    const prefixes = ["130", "131", "132", "133", "135", "136", "137", "138", "139",
                      "150", "151", "152", "153", "155", "156", "157", "158", "159",
                      "180", "181", "182", "183", "185", "186", "187", "188", "189"];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = Math.floor(Math.random() * 100000000).toString().padStart(8, "0");
    return prefix + suffix;
};

// 生成随机车牌号
const generateRandomPlate = () => {
    const provinces = ["京", "津", "冀", "晋", "蒙", "辽", "吉", "黑", "沪", "苏", "浙", "皖", "闽", "赣", "鲁", "豫", "鄂", "湘", "粤", "桂", "琼", "渝", "川", "贵", "云", "藏", "陕", "甘", "青", "宁", "新"];
    const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789";

    const province = provinces[Math.floor(Math.random() * provinces.length)];
    const letter = letters[Math.floor(Math.random() * letters.length)];
    let suffix = "";
    for (let i = 0; i < 5; i++) {
        suffix += chars[Math.floor(Math.random() * chars.length)];
    }
    return province + letter + suffix;
};

function UploadViolationPage() {
    const navigate = useNavigate();

    // 图片状态
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    // 表单数据
    const [violationTag, setViolationTag] = useState("");
    const [plateNumber, setPlateNumber] = useState("");
    const [offenderName, setOffenderName] = useState("");
    const [offenderPhone, setOffenderPhone] = useState("");
    const [ownerName, setOwnerName] = useState("");
    const [ownerPhone, setOwnerPhone] = useState("");

    // 状态
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");
    const [successDialogOpen, setSuccessDialogOpen] = useState(false);
    const [uploadedData, setUploadedData] = useState<any>(null);

    // 处理图片选择
    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImageFile(file);
        setError("");

        // 生成预览
        const reader = new FileReader();
        reader.onload = (ev) => {
            setImagePreview(ev.target?.result as string);
        };
        reader.readAsDataURL(file);

        // 拍照后自动生成并填入随机数据
        setViolationTag(VIOLATION_TAGS[Math.floor(Math.random() * VIOLATION_TAGS.length)]);
        setPlateNumber(generateRandomPlate());
        setOffenderName(generateRandomName());
        setOffenderPhone(generateRandomPhone());
        setOwnerName(generateRandomName());
        setOwnerPhone(generateRandomPhone());
    };

    // 返回上一页
    const handleBack = () => {
        navigate(-1);
    };

    // 提交上传
    const handleSubmit = async () => {
        if (!imageFile) {
            setError("请先选择或拍摄违章图片");
            return;
        }

        setUploading(true);
        setError("");

        try {
            const violationData: Record<string, string> = {};
            if (violationTag) violationData.violationTag = violationTag;
            if (plateNumber) violationData.plateNumber = plateNumber;
            if (offenderName) violationData.offenderName = offenderName;
            if (offenderPhone) violationData.offenderPhone = offenderPhone;
            if (ownerName) violationData.ownerName = ownerName;
            if (ownerPhone) violationData.ownerPhone = ownerPhone;

            const response = await policeApi.uploadViolation(
                imageFile,
                Object.keys(violationData).length > 0 ? violationData : undefined
            );

            if (response.success) {
                // 保存上传成功的数据并显示对话框
                setUploadedData(response.data);
                setSuccessDialogOpen(true);
            } else {
                setError(response.error || "上传失败");
            }
        } catch (err) {
            // 根据不同的HTTP状态码显示不同的错误信息
            if (err instanceof Error) {
                const errorWithStatus = err as Error & { status?: number };
                if (errorWithStatus.status === 401) {
                    setError("请先登录");
                } else if (errorWithStatus.status === 404) {
                    setError("接口不存在，请检查服务器配置");
                } else if (errorWithStatus.status === 403) {
                    setError("没有权限访问该接口");
                } else if (errorWithStatus.status === 500) {
                    setError("服务器错误，请稍后重试");
                } else {
                    setError(err.message || "上传失败，请检查网络");
                }
            } else {
                setError("上传失败，请检查网络");
            }
        } finally {
            setUploading(false);
        }
    };

    // 处理成功对话框确认
    const handleSuccessConfirm = () => {
        setSuccessDialogOpen(false);
        navigate("/", { replace: true });
    };

    return (
        <main className="pt-10 w-full h-screen bg-muted-bg flex flex-col">
            <TitleBar>
                <div className="flex items-center gap-2">
                    <button onClick={handleBack} className="p-1">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    上传违章
                </div>
            </TitleBar>

            {/* 可滚动内容区域 */}
            <div className="flex-1 overflow-y-auto pt-19 pb-6">
                {/* 图片上传区域 */}
                <div className="bg-background p-4">
                    <h2 className="text-lg font-medium text-foreground mb-3">违章图片</h2>
                    <label className="block cursor-pointer">
                        <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handleImageSelect}
                            className="hidden"
                            disabled={uploading}
                        />
                        {imagePreview ? (
                            <div className="relative">
                                <img
                                    src={imagePreview}
                                    alt="违章图片预览"
                                    className="w-full h-56 object-cover rounded-lg"
                                />
                                <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                                    点击更换图片
                                </div>
                            </div>
                        ) : (
                            <div className="w-full h-56 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-3 bg-gray-50">
                                <div className="flex items-center gap-4">
                                    <div className="flex flex-col items-center gap-1">
                                        <Camera className="w-10 h-10 text-gray-400" />
                                        <span className="text-sm text-gray-500">拍照</span>
                                    </div>
                                    <div className="w-px h-12 bg-gray-300" />
                                    <div className="flex flex-col items-center gap-1">
                                        <Upload className="w-10 h-10 text-gray-400" />
                                        <span className="text-sm text-gray-500">相册</span>
                                    </div>
                                </div>
                                <p className="text-gray-400 text-sm">点击此区域选择或拍摄图片</p>
                            </div>
                        )}
                    </label>
                </div>

                {/* 信息表单 — 可选填，不填则后端自动生成伪随机数据 */}
                <div className="bg-background mt-3 p-4">
                    <h2 className="text-lg font-medium text-foreground border-b border-border pb-3">
                        违规信息
                        <span className="text-sm text-muted-foreground font-normal ml-2">（选填，留空自动生成）</span>
                    </h2>

                    {/* 违章类型 */}
                    <div className="flex items-center py-3 border-b border-border">
                        <label className="text-base text-foreground w-24 shrink-0">违章类型</label>
                        <select
                            value={violationTag}
                            onChange={(e) => setViolationTag(e.target.value)}
                            className="flex-1 text-right bg-transparent text-base outline-none appearance-none"
                            disabled={uploading}
                        >
                            <option value="">自动生成</option>
                            {VIOLATION_TAGS.map((tag) => (
                                <option key={tag} value={tag}>{tag}</option>
                            ))}
                        </select>
                    </div>

                    {/* 车牌号 */}
                    <div className="flex items-center py-3 border-b border-border">
                        <label className="text-base text-foreground w-24 shrink-0">车牌号</label>
                        <Input
                            type="text"
                            placeholder="自动生成"
                            value={plateNumber}
                            onChange={(e) => setPlateNumber(e.target.value)}
                            className="flex-1 border-0 shadow-none focus-visible:ring-0 text-right text-base h-auto py-0 px-0"
                            disabled={uploading}
                        />
                    </div>
                </div>

                {/* 违规人员信息 */}
                <div className="bg-background mt-3 p-4">
                    <h2 className="text-lg font-medium text-foreground border-b border-border pb-3">违规人员信息</h2>

                    <div className="flex items-center py-3 border-b border-border">
                        <label className="text-base text-foreground w-24 shrink-0">姓名</label>
                        <Input
                            type="text"
                            placeholder="自动生成"
                            value={offenderName}
                            onChange={(e) => setOffenderName(e.target.value)}
                            className="flex-1 border-0 shadow-none focus-visible:ring-0 text-right text-base h-auto py-0 px-0"
                            disabled={uploading}
                        />
                    </div>

                    <div className="flex items-center py-3">
                        <label className="text-base text-foreground w-24 shrink-0">手机号</label>
                        <Input
                            type="tel"
                            placeholder="自动生成"
                            value={offenderPhone}
                            onChange={(e) => setOffenderPhone(e.target.value)}
                            className="flex-1 border-0 shadow-none focus-visible:ring-0 text-right text-base h-auto py-0 px-0"
                            disabled={uploading}
                        />
                    </div>
                </div>

                {/* 车主信息 */}
                <div className="bg-background mt-3 p-4">
                    <h2 className="text-lg font-medium text-foreground border-b border-border pb-3">车主信息</h2>

                    <div className="flex items-center py-3 border-b border-border">
                        <label className="text-base text-foreground w-24 shrink-0">姓名</label>
                        <Input
                            type="text"
                            placeholder="自动生成"
                            value={ownerName}
                            onChange={(e) => setOwnerName(e.target.value)}
                            className="flex-1 border-0 shadow-none focus-visible:ring-0 text-right text-base h-auto py-0 px-0"
                            disabled={uploading}
                        />
                    </div>

                    <div className="flex items-center py-3">
                        <label className="text-base text-foreground w-24 shrink-0">手机号</label>
                        <Input
                            type="tel"
                            placeholder="自动生成"
                            value={ownerPhone}
                            onChange={(e) => setOwnerPhone(e.target.value)}
                            className="flex-1 border-0 shadow-none focus-visible:ring-0 text-right text-base h-auto py-0 px-0"
                            disabled={uploading}
                        />
                    </div>
                </div>

                {/* 错误提示 */}
                {error && (
                    <div className="px-4 pt-3">
                        <p className="text-sm text-destructive">{error}</p>
                    </div>
                )}

                {/* 提交按钮 */}
                <div className="px-4 pt-5">
                    <Button
                        onClick={handleSubmit}
                        disabled={!imageFile || uploading}
                        className="w-full h-12 text-base font-medium text-white rounded-xl bg-blue-500 hover:bg-blue-600"
                    >
                        {uploading ? "上传中..." : "保存违章记录"}
                    </Button>
                </div>
            </div>

            {/* 成功对话框 */}
            <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>上传成功</DialogTitle>
                        <DialogDescription>
                            违章记录已成功创建，以下是自动生成的信息：
                        </DialogDescription>
                    </DialogHeader>
                    {uploadedData && (
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">违章类型：</span>
                                <span className="font-medium">{uploadedData.violationTag}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">车牌号：</span>
                                <span className="font-medium">{uploadedData.plateNumber}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">违规人员：</span>
                                <span className="font-medium">{uploadedData.offenderName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">违规人员手机：</span>
                                <span className="font-medium">{uploadedData.offenderPhone}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">车主：</span>
                                <span className="font-medium">{uploadedData.ownerName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">车主手机：</span>
                                <span className="font-medium">{uploadedData.ownerPhone}</span>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button onClick={handleSuccessConfirm} className="w-full">
                            确定
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </main>
    );
}

export default UploadViolationPage;
