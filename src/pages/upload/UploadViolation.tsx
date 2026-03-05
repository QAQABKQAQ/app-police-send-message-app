import "@/App.css";
import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TitleBar } from "@/components/text/title-bar";
import { policeApi } from "@/lib/request";
import { ChevronLeft, Camera, Upload } from "lucide-react";

// 违章类型列表（与后端 mock.service 一致）
const VIOLATION_TAGS = [
    "超载", "无证驾驶", "酒驾", "闯红灯", "逆行",
    "超速", "违规载人", "非法改装", "未悬挂号牌", "号牌污损",
];

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
                // 上传成功，跳转回首页
                navigate("/", { replace: true });
            } else {
                setError(response.error || "上传失败");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "上传失败，请检查网络");
        } finally {
            setUploading(false);
        }
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
        </main>
    );
}

export default UploadViolationPage;
