interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

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
// export const API_SERVER = 'https://api.police.message.creteper.xyz';
export const API_SERVER = 'http://192.168.35.236:3000';

// 基础请求函数
const baseRequest = async <T>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  // const baseUrl = 'https://api.police.message.creteper.xyz/api';
  const baseUrl = `${API_SERVER}/api`;

  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${baseUrl}${url}`, config);
    const data: ApiResponse<T> = await response.json();

    if (!response.ok) {
      throw new Error(data.error || '请求失败');
    }

    return data;
  } catch (error) {
    console.error(`API请求错误: ${url}`, error);
    throw error instanceof Error ? error : new Error('网络请求失败');
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

    // const response = await fetch('https://api.police.message.creteper.xyz/api/police/violations/upload', {
    const response = await fetch(`${API_SERVER}/api/police/violations/upload`, {
      method: 'POST',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      const error = new Error(data.error || '上传失败') as Error & { status: number };
      error.status = response.status;
      throw error;
    }

    return data as ApiResponse<any>;
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
