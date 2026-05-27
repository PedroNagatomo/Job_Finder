import axios from "axios";

// URL da API - sempre usa proxy reverso do Nginx
// O Nginx no container do frontend faz proxy para o container da API
const API_BASE_URL = "/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para logging
api.interceptors.request.use((request) => {
  console.log("Starting Request:", request.method, request.url);
  return request;
});

api.interceptors.response.use(
  (response) => {
    console.log("Response:", response.status);
    return response;
  },
  (error) => {
    console.error("API Error:", error.message);
    return Promise.reject(error);
  },
);

export const searchJobs = async (
  query = "",
  location = "",
  source = "",
  limit = 150,
) => {
  try {
    const params = {};

    if (query) params.query = query;
    if (location) params.location = location;
    if (source) params.source = source;
    if (limit) params.limit = limit;

    const response = await api.get("/jobs", { params });

    if (response.data.success) {
      return response.data.jobs;
    } else {
      throw new Error(response.data.error || "Erro ao buscar vagas");
    }
  } catch (error) {
    console.error("Erro ao buscar vagas:", error);

    if (error.response) {
      throw new Error(
        `Erro ${error.response.status}: ${error.response.data.error || "Erro desconhecido"}`,
      );
    } else if (error.request) {
      throw new Error(
        "Não foi possível conectar à API. Verifique se o servidor está rodando.",
      );
    } else {
      throw error;
    }
  }
};

export const getAvailableSources = async () => {
  try {
    const response = await api.get("/jobs/sources");
    return response.data.sources;
  } catch (error) {
    console.error("Erro ao buscar fontes:", error);
    return ["LinkedIn", "Indeed", "Google Jobs", "InfoJobs", "Programathor"];
  }
};

export const checkApiHealth = async () => {
  try {
    const response = await api.get("/health");
    return response.data;
  } catch (error) {
    throw new Error("API não está disponível");
  }
};

export const uploadResume = async (file, onProgress) => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post("/upload-resume", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total,
          );
          onProgress(percentCompleted);
        }
      },
      timeout: 60000,
    });

    if (response.data.success) {
      return response.data;
    } else {
      throw new Error(response.data.error || "Erro ao processar currículo");
    }
  } catch (error) {
    console.error("Erro no upload:", error);
    throw error;
  }
};

export default api;
