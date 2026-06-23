import axios from 'axios';

const PINATA_API_KEY = 'YOUR_PINATA_API_KEY';
const PINATA_SECRET_KEY = 'YOUR_PINATA_SECRET_KEY';
const PINATA_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJlZDU1OTY1ZS1mMjI4LTQ1MzctYmNiYS0yNjUxYjMyMzgwMmQiLCJlbWFpbCI6ImRpbWF6NzEyNkBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGluX3BvbGljeSI6eyJyZWdpb25zIjpbeyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJGUkExIn0seyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJOWUMxIn1dLCJ2ZXJzaW9uIjoxfSwibWZhX2VuYWJsZWQiOmZhbHNlLCJzdGF0dXMiOiJBQ1RJVkUifSwiYXV0aGVudGljYXRpb25UeXBlIjoic2NvcGVkS2V5Iiwic2NvcGVkS2V5S2V5IjoiY2VjZWVhMDAzYTBhZGMyNzk4YmUiLCJzY29wZWRLZXlTZWNyZXQiOiI5YTk4MTNhNGE3OTdmY2Y2OWFlYTMxNzhiMWI2ODI1OWFlZTBlNWQyODRjMmY3NThlZmNlMzkwMWI0OTQ2NTgwIiwiZXhwIjoxODEzNzYxMDQ4fQ.enBpdi2tSFCIm2HVyQx12YWxDKDFwMW0LhppOYJEMA8'; // Рекомендуется использовать JWT

// Загрузка файла на IPFS
export async function uploadFileToIPFS(file) {
    const formData = new FormData();
    formData.append('file', file);

    const metadata = JSON.stringify({
        name: file.name,
    });
    formData.append('pinataMetadata', metadata);

    const options = JSON.stringify({
        cidVersion: 0,
    });
    formData.append('pinataOptions', options);

    try {
        const res = await axios.post(
            'https://api.pinata.cloud/pinning/pinFileToIPFS',
            formData,
            {
                maxBodyLength: 'Infinity',
                headers: {
                    'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
                    Authorization: `Bearer ${PINATA_JWT}`,
                },
            }
        );

        console.log('Файл загружен:', res.data);
        return {
            success: true,
            ipfsHash: res.data.IpfsHash,
            ipfsUrl: `ipfs://${res.data.IpfsHash}`,
            gatewayUrl: `https://gateway.pinata.cloud/ipfs/${res.data.IpfsHash}`,
        };
    } catch (error) {
        console.error('Ошибка загрузки файла:', error);
        return { success: false, error: error.message };
    }
}

// Загрузка метаданных (JSON) на IPFS
export async function uploadMetadataToIPFS(metadata) {
    try {
        const res = await axios.post(
            'https://api.pinata.cloud/pinning/pinJSONToIPFS',
            metadata,
            {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${PINATA_JWT}`,
                },
            }
        );

        console.log('Метаданные загружены:', res.data);
        return {
            success: true,
            ipfsHash: res.data.IpfsHash,
            ipfsUrl: `ipfs://${res.data.IpfsHash}`,
        };
    } catch (error) {
        console.error('Ошибка загрузки метаданных:', error);
        return { success: false, error: error.message };
    }
}

// Полная загрузка NFT: изображение + метаданные
export async function uploadNFTToIPFS(imageFile, nftName, nftDescription, attributes = []) {
    // 1. Загружаем изображение
    const imageResult = await uploadFileToIPFS(imageFile);

    if (!imageResult.success) {
        return { success: false, error: 'Ошибка загрузки изображения' };
    }

    // 2. Создаем метаданные
    const metadata = {
        name: nftName,
        description: nftDescription,
        image: imageResult.ipfsUrl,
        attributes: attributes,
    };

    // 3. Загружаем метаданные
    const metadataResult = await uploadMetadataToIPFS(metadata);

    if (!metadataResult.success) {
        return { success: false, error: 'Ошибка загрузки метаданных' };
    }

    return {
        success: true,
        imageUrl: imageResult.gatewayUrl,
        metadataUrl: metadataResult.ipfsUrl,
        metadataHash: metadataResult.ipfsHash,
        imageHash: imageResult.ipfsHash,
    };
}