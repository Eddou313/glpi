import { BrowserRouter, Routes, Route } from "react-router-dom"
import { Test } from "../pages/Test"

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
          <Route path="/" element={<Test />}></Route>
      </Routes>
    </BrowserRouter>
  )
}

export default AppRouter