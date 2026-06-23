import {createBrowserRouter} from "react-router-dom";
import MainPage from "../../ui/pages/mainPage/MainPage.jsx";
import GalleryPage from "../../ui/pages/galleryPage/GalleryPage.jsx";
import {PersonalyPage} from "../../ui/pages/personalyPage/PersonalyPage.jsx";
import MainLayout from "../../ui/components/mainLayout/MainLayout.jsx";
import CreateNFTPage from "../../ui/pages/CreateNFTPage/CreateNFTPage.jsx";

const routes = [
    {path:"/", element:<MainPage/>},
    {path:"/gallery",element:<GalleryPage/>},
    {path:"/profile", element:<PersonalyPage/>},
    {path:"/create",element: <CreateNFTPage/>},
    {
        path: "*",
        element: (
            <MainLayout>
                <div style={{ textAlign: 'center', padding: '100px 20px' }}>
                    <h1>404</h1>
                    <p>Страница не найдена</p>
                </div>
            </MainLayout>
        ),
    },
]
const router = createBrowserRouter(routes)
export default router