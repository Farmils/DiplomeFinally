import MainLayout from "../../components/mainLayout/MainLayout.jsx";
import CreateNFT from "../../components/CreateNFT/CreateNFT.jsx";
import { Container } from 'react-bootstrap';

export default function CreateNFTPage() {
    return (
        <MainLayout>
            <Container className="py-4">
                <CreateNFT />
            </Container>
        </MainLayout>
    );
}