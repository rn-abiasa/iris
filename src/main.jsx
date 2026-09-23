import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import "./index.css";

import Cover from "./pages/cover";
import Memories from "./pages/memories";
import Message from "./pages/message";
import Reason from "./pages/reason";
import Songs from "./pages/songs";
import Wish from "./pages/wish";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Cover />,
  },
  {
    path: "/memories",
    element: <Memories />,
  },
  {
    path: "/message",
    element: <Message />,
  },
  {
    path: "/reason",
    element: <Reason />,
  },
  {
    path: "/songs",
    element: <Songs />,
  },
  {
    path: "/wish",
    element: <Wish />,
  },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
