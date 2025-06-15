// src/services/api/client.ts
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import NetInfo from '@react-native-community/netinfo';
import { Alert } from 'react-native';

const BASE_URL = __DEV__ 
  ? 'http://localhost:5000/api' // Your local backend
  : 'https://your-production-api.com/api';

class ApiClient {
  private instance: AxiosInstance;
  private isOnline: boolean = true;

  constructor() {
    this.instance = axios.create({
      baseURL: BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
    this.setupNetworkListener();
  }

  private setupInterceptors() {
    // Request interceptor
    this.instance.interceptors.request.use(
      (config) => {
        if (!this.isOnline) {
          throw new Error('No internet connection');
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error) => {
        if (error.message === 'Network Error' || !this.isOnline) {
          // Handle offline scenario
          return Promise.reject(new Error('offline'));
        }
        return Promise.reject(error);
      }
    );
  }

  private setupNetworkListener() {
    NetInfo.addEventListener(state => {
      this.isOnline = !!state.isConnected;
    });
  }

  async get<T>(url: string, params?: any): Promise<T> {
    const response = await this.instance.get(url, { params });
    return response.data;
  }

  async post<T>(url: string, data?: any): Promise<T> {
    const response = await this.instance.post(url, data);
    return response.data;
  }

  async put<T>(url: string, data?: any): Promise<T> {
    const response = await this.instance.put(url, data);
    return response.data;
  }

  async delete<T>(url: string): Promise<T> {
    const response = await this.instance.delete(url);
    return response.data;
  }

  getNetworkStatus(): boolean {
    return this.isOnline;
  }
}

export const apiClient = new ApiClient();