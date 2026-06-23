import Header from '../header/Header.jsx'
import Footer from '../footer/Footer.jsx'
import ElectronBanner from "../ElectronBanner/ElectronBanner.jsx";

const MainLayout = ({ children }) => {
    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <Header />
            <main style={{
                flex: 1,
                paddingBottom: '40px'
            }}>
                <ElectronBanner />
                {children}
            </main>
            <Footer />
        </div>
    )
}

export default MainLayout