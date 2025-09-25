import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { jaJP } from '@mui/x-date-pickers/locales';

// Roboto フォント（MUI推奨）
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

// ▼▼▼ Noto Sans JP フォントを追加 ▼▼▼
import "@fontsource/noto-sans-jp/400.css"; // Regular
import "@fontsource/noto-sans-jp/700.css"; // Bold

const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#1976d2" },
    secondary: { main: "#9c27b0" },
    text: {
      primary: '#4c4c4c', // デフォルトの文字色
    },
  },
  typography: {
    // 日本語の見た目を整えたい場合は後で Noto Sans JP に差し替え可能
    fontFamily: ['"Roboto"',"Noto Sans JP", "Helvetica", "Arial", "sans-serif"].join(","),
    fontSize: 18,
  },
},
  jaJP,
);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>,
);
