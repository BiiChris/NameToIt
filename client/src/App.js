import React from "react";
import Header from "./components/header";
import Footer from "./components/footer";
import Home from "./pages/Home";
import Result from "./pages/Result"
import NotFound from "./pages/NotFound";
import './App.css'
import { Route, Routes } from "react-router-dom";

export default function App() {
    return (
        <body>
            <Header />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/result" element={<Result />} />
                <Route path="*" element={<NotFound />} />
            </Routes>
            <Footer />
        </body>
    )
};