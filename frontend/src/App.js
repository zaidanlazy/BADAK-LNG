import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import UploadPage from "./pages/UploadPage";
import LinkPage from "./pages/LinkPage";
import PasswordPage from "./pages/PasswordPage";
import ExpirePage from "./pages/ExpirePage";
import DownloadPage from "./pages/downloadpage";
import TestUpload from "./pages/TestUpload";
import TestSecurity from "./pages/TestSecurity";
import TestDownload from "./pages/TestDownload";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<UploadPage />} />
        <Route path="/test" element={<TestUpload />} />
        <Route path="/test-security" element={<TestSecurity />} />
        <Route path="/test-download" element={<TestDownload />} />

        {/* Link success page */}
        <Route path="/link/:id" element={<LinkPage />} />

        {/* Download page - beda path */}
        <Route path="/download/:id" element={<DownloadPage />} />

        {/* Password protected */}
        <Route path="/password/:id" element={<PasswordPage />} />

        {/* Expired page */}
        <Route path="/expired" element={<ExpirePage />} />
      </Routes>
    </Router>
  );
}

export default App;
