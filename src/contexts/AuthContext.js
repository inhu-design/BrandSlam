// src/contexts/AuthContext.js
import { createContext, useContext } from 'react';

// 1. Context 생성 (껍데기)
export const AuthContext = createContext(null);

// 2. Hook 분리 (이걸 가져다 씀)
export const useAuth = () => useContext(AuthContext);