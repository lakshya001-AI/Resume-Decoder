import {BrowserRouter, Routes, Route} from "react-router-dom"
import LoginPage from "./Component/loginPage"
import CreateAccountPage from "./Component/createAccountPage"
const App = () => {
  return (
    <div>
      <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage/>}/>
        <Route path="/createAccount" element={<CreateAccountPage/>}/>
      </Routes>
      </BrowserRouter>
    </div>
  )
}

export default App
