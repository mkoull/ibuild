import { Outlet } from "react-router-dom";
import _ from "../../theme/tokens.js";
import { useApp } from "../../context/AppContext.jsx";
import Sidebar from "./Sidebar.jsx";
import MobileHeader from "./MobileHeader.jsx";
import MobileBottomTabs from "./MobileBottomTabs.jsx";
import Toast from "../ui/Toast.jsx";

export default function GlobalShell() {
  const { mobile, toast } = useApp();

  return (
    <div style={{ display: "flex", height: "100vh", background: _.bg, color: _.ink, fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,sans-serif" }}>
      <Toast toast={toast} />
      {!mobile && <Sidebar />}
      {mobile && <MobileHeader />}
      <main style={{ flex: 1, overflowY: "auto", padding: mobile ? "72px 16px 88px" : "48px 64px 80px" }}>
        <Outlet />
      </main>
      {mobile && <MobileBottomTabs />}
      <style>{`
        *{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;box-sizing:border-box}
        ::selection{background:${_.ac}20;color:${_.ac}}
        select option{background:#fff;color:${_.ink}}
        input::-webkit-outer-spin-button,input::-webkit-inner-spin-button{-webkit-appearance:none}
        input[type=number]{-moz-appearance:textfield}
        textarea{font-family:inherit}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:${_.line};border-radius:99px}
        ::-webkit-scrollbar-thumb:hover{background:${_.line2}}
        input:focus,textarea:focus,select:focus{border-color:${_.ac}!important;background:#fff!important;box-shadow:0 0 0 2px ${_.ac}18!important;outline:none!important}
        button:active{transform:scale(0.98)!important}
        @keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideDown{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @media print{aside,nav{display:none!important}main{padding:0!important}}
      `}</style>
    </div>
  );
}
