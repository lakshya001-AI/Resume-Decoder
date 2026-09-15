import {BrowserRouter, Routes, Route, Navigate} from "react-router-dom"
import LoginPage from "./Component/loginPage"
import CreateAccountPage from "./Component/createAccountPage"
import MainPage from "./Component/mainPage"
import AuthCallback from "./Component/authCallback"
import ForgotPasswordPage from "./Component/forgotPasswordPage"
import ResetPasswordPage from "./Component/resetPasswordPage"
import { ProtectedRoute, PublicOnlyRoute } from "./Component/routeGuards"
import SmallScreenGate from "./Component/smallScreenGate"
import { AuthProvider } from "./context/AuthProvider"
import { ToastProvider } from "./context/ToastProvider"

const App = () => {
  return (
    <div>
      <BrowserRouter>
      {/* Outside AuthProvider so a toast raised on one screen survives the
          navigation to the next one. */}
      <ToastProvider>
      <AuthProvider>
      {/* Above the router, so resizing mid-session swaps to the gate and back
          without unmounting the session or losing form state. */}
      <SmallScreenGate>
      <Routes>
        {/* Signed-out only — a logged-in user typing these lands on /main. */}
        <Route element={<PublicOnlyRoute/>}>
          <Route path="/" element={<LoginPage/>}/>
          <Route path="/createAccount" element={<CreateAccountPage/>}/>
          <Route path="/forgotPassword" element={<ForgotPasswordPage/>}/>
          <Route path="/resetPassword" element={<ResetPasswordPage/>}/>
        </Route>

        {/* Signed-in only — no session means back to the login screen. */}
        <Route element={<ProtectedRoute/>}>
          <Route path="/main" element={<MainPage/>}/>
        </Route>

        {/* Where the social provider sends the browser back to. Ungated: it is what
            turns the returned token into a session. */}
        <Route path="/auth/callback" element={<AuthCallback/>}/>

        {/* Any unknown path goes home, where the guards decide where it ends up. */}
        <Route path="*" element={<Navigate to="/" replace/>}/>
      </Routes>
      </SmallScreenGate>
      </AuthProvider>
      </ToastProvider>
      </BrowserRouter>
    </div>
  )
}

export default App
