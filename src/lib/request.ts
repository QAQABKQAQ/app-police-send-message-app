interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

const normalizeServerUrl = (server: string) => server.trim().replace(/\/+$/, "");

const resolveApiServer = () => {
  const envServer = normalizeServerUrl(import.meta.env.VITE_API_SERVER || "");
  if (envServer) {
    return envServer;
  }

  if (typeof window !== "undefined") {
    const { protocol, hostname } = window.location;
    if ((protocol === "http:" || protocol === "https:") && hostname) {
      return `${protocol}//${hostname}:3000`;
    }
  }

  return "http://127.0.0.1:3000";
};

const buildApiUrl = (path: string) => `${resolveApiServer()}/api${path}`;

const parseApiResponse = async <T>(response: Response) => {
  const rawBody = await response.text();
  if (!rawBody) {
    return {
      rawBody,
      data: null as ApiResponse<T> | null,
    };
  }

  const contentType = response.headers.get("content-type") || "";
  const looksLikeJson =
    contentType.includes("application/json") ||
    rawBody.startsWith("{") ||
    rawBody.startsWith("[");

  if (!looksLikeJson) {
    return {
      rawBody,
      data: null as ApiResponse<T> | null,
    };
  }

  return {
    rawBody,
    data: JSON.parse(rawBody) as ApiResponse<T>,
  };
};

const toRequestError = (error: unknown) => {
  if (error instanceof TypeError) {
    return new Error(
      `无法连接到服务器 ${resolveApiServer()}，请确认后端已启动，且手机与开发机在同一网络`
    );
  }

  if (error instanceof SyntaxError) {
    return new Error(
      `服务器 ${resolveApiServer()} 返回了无效响应，请检查后端接口或代理配置`
    );
  }

  return error instanceof Error ? error : new Error("网络请求失败");
};

// 存储认证令牌
let authToken: string | null = null;

// 设置认证令牌
export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (token) {
    localStorage.setItem('authToken', token);
  } else {
    localStorage.removeItem('authToken');
  }
};

// 获取认证令牌
export const getAuthToken = () => {
  if (!authToken) {
    authToken = localStorage.getItem('authToken');
  }
  return authToken;
};

// 清除认证令牌
export const clearAuthToken = () => {
  authToken = null;
  localStorage.removeItem('authToken');
};

// 后端服务器地址
export const API_SERVER = resolveApiServer();

// 基础请求函数
const baseRequest = async <T>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  const token = getAuthToken();

  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(buildApiUrl(url), config);
    const { data, rawBody } = await parseApiResponse<T>(response);

    if (!response.ok) {
      throw new Error(data?.error || data?.message || rawBody || `请求失败 (${response.status})`);
    }

    return data || ({ success: true } as ApiResponse<T>);
  } catch (error) {
    console.error(`API请求错误: ${url}`, error);
    throw toRequestError(error);
  }
};

// 认证相关接口
export const authApi = {
  // 用户登录
  login: (credentials: { username: string; password: string }) =>
    baseRequest<{ user: any; token: string }>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify(credentials) }
    ),

  // 获取当前用户信息
  getProfile: () => baseRequest('/auth/profile'),

  // 更新个人信息
  updateProfile: (profileData: { name?: string; phone?: string; avatar?: string }) =>
    baseRequest(
      '/auth/profile',
      { method: 'PUT', body: JSON.stringify(profileData) }
    ),

  // 修改密码
  updatePassword: (passwordData: { oldPassword: string; newPassword: string }) =>
    baseRequest(
      '/auth/password',
      { method: 'PUT', body: JSON.stringify(passwordData) }
    ),

  // 用户登出
  logout: () => baseRequest('/auth/logout', { method: 'POST' })
};

// 警察端相关接口
export const policeApi = {
  // 获取未处理的违章列表
  getPendingViolations: (params?: { page?: number; pageSize?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.pageSize) searchParams.append('pageSize', params.pageSize.toString());
    const queryString = searchParams.toString();
    return baseRequest(`/police/violations/pending${queryString ? `?${queryString}` : ''}`);
  },

  // 获取被退回的违章列表
  getReturnedViolations: (params?: { page?: number; pageSize?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.pageSize) searchParams.append('pageSize', params.pageSize.toString());
    const queryString = searchParams.toString();
    return baseRequest(`/police/violations/returned${queryString ? `?${queryString}` : ''}`);
  },

  // 获取违章详情
  getViolationDetail: (id: number) => baseRequest(`/police/violations/${id}`),

  // 删除违章记录
  deleteViolation: (id: number) =>
    baseRequest(`/police/violations/${id}`, { method: 'DELETE' }),

  // 分发违章给村长
  dispatchViolation: (id: number, villageChiefIds: number[]) =>
    baseRequest(
      `/police/violations/${id}/dispatch`,
      { method: 'POST', body: JSON.stringify({ villageChiefIds }) }
    ),

  // 获取未被村长查看的消息
  getUnreadMessages: (params?: { page?: number; pageSize?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.pageSize) searchParams.append('pageSize', params.pageSize.toString());
    const queryString = searchParams.toString();
    return baseRequest(`/police/messages/unread${queryString ? `?${queryString}` : ''}`);
  },

  // 获取超时未查看的消息
  getTimeoutMessages: (params?: { page?: number; pageSize?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.pageSize) searchParams.append('pageSize', params.pageSize.toString());
    const queryString = searchParams.toString();
    return baseRequest(`/police/messages/timeout${queryString ? `?${queryString}` : ''}`);
  },

  // 获取被退回的消息
  getRejectedMessages: (params?: { page?: number; pageSize?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.pageSize) searchParams.append('pageSize', params.pageSize.toString());
    const queryString = searchParams.toString();
    return baseRequest(`/police/messages/rejected${queryString ? `?${queryString}` : ''}`);
  },

  // 获取消息详情
  getMessageDetail: (id: number) => baseRequest(`/police/messages/${id}`),

  // 获取历史记录
  getHistory: (params?: { status?: 'completed' | 'uncompleted'; page?: number; pageSize?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.pageSize) searchParams.append('pageSize', params.pageSize.toString());
    const queryString = searchParams.toString();
    return baseRequest(`/police/history${queryString ? `?${queryString}` : ''}`);
  },

  // 获取所有村庄列表
  getVillages: () => baseRequest('/police/villages'),

  // 获取村长信息
  getVillageChief: (id: number) => baseRequest(`/police/village-chief/${id}`),

  // 上传违章图片并创建违章记录
  uploadViolation: async (imageFile: File, violationData?: {
    violationTime?: string;
    violationTag?: string;
    offenderName?: string;
    offenderPhone?: string;
    plateNumber?: string;
    ownerName?: string;
    ownerPhone?: string;
  }) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    if (violationData) {
      Object.entries(violationData).forEach(([key, value]) => {
        if (value) formData.append(key, value);
      });
    }
    const token = getAuthToken();

    try {
      const response = await fetch(buildApiUrl('/police/violations/upload'), {
        method: 'POST',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: formData,
      });

      const { data, rawBody } = await parseApiResponse<any>(response);

      if (!response.ok) {
        const error = new Error(data?.error || data?.message || rawBody || '上传失败') as Error & { status: number };
        error.status = response.status;
        throw error;
      }

      return data || ({ success: true } as ApiResponse<any>);
    } catch (error) {
      console.error('API请求错误: /police/violations/upload', error);
      throw toRequestError(error);
    }
  },
};

// 村长端相关接口
export const villageApi = {
  // 获取待处理消息列表
  getPendingMessages: (params?: { page?: number; pageSize?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.pageSize) searchParams.append('pageSize', params.pageSize.toString());
    const queryString = searchParams.toString();
    return baseRequest(`/village/messages/pending${queryString ? `?${queryString}` : ''}`);
  },

  // 获取消息详情
  getMessageDetail: (id: number) => baseRequest(`/village/messages/${id}`),

  // 确认消息（是本村人）
  confirmMessage: (id: number) =>
    baseRequest(
      `/village/messages/${id}/confirm`,
      { method: 'POST' }
    ),

  // 退回消息（非本村人）
  rejectMessage: (id: number) =>
    baseRequest(
      `/village/messages/${id}/reject`,
      { method: 'POST' }
    ),

  // 获取历史记录
  getHistory: (params?: { status?: 'processed' | 'unprocessed'; page?: number; pageSize?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.pageSize) searchParams.append('pageSize', params.pageSize.toString());
    const queryString = searchParams.toString();
    return baseRequest(`/village/history${queryString ? `?${queryString}` : ''}`);
  },

  // 获取管辖警察信息
  getPoliceInfo: (policeId: number) =>
    baseRequest(`/village/police-info?policeId=${policeId}`)
};

// Mock数据相关接口
export const mockApi = {
  // 批量生成违章数据
  generateViolations: (count: number = 10) =>
    baseRequest(
      '/mock/violations/generate',
      { method: 'POST', body: JSON.stringify({ count: Math.min(Math.max(count, 1), 100) }) }
    ),

  // 手动添加违章数据
  addViolation: (violationData: {
    violationTime?: string;
    violationTag: string;
    imageUrl?: string;
    offenderName: string;
    offenderPhone: string;
    plateNumber: string;
    ownerName: string;
    ownerPhone: string;
  }) => baseRequest(
    '/mock/violations',
    { method: 'POST', body: JSON.stringify(violationData) }
  )
};

// 系统相关接口
export const systemApi = {
  // 健康检查
  healthCheck: () => baseRequest('/health')
};

// 导出所有API
export const api = {
  auth: authApi,
  police: policeApi,
  village: villageApi,
  mock: mockApi,
  system: systemApi,
  // 设置认证令牌
  setAuthToken,
  getAuthToken,
  clearAuthToken
};

export default api;
