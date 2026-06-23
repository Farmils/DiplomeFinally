import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Card, Form, Button, ProgressBar, Alert, Spinner, Row, Col } from 'react-bootstrap';
import { uploadNFTToIPFS } from '../../../core/serivces/pinata.js';
import { useMintNFT } from '../../../core/serivces/hooks/useMintNFT.js';

export default function CreateNFT() {
    const { address } = useAccount();
    const { mintNFT, isPending, isConfirming, isConfirmed, hash } = useMintNFT();

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [attributes, setAttributes] = useState([{ trait_type: '', value: '' }]);
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(0); // 0: форма, 1: загрузка, 2: минтинг, 3: готово
    const [error, setError] = useState(null);
    const [mintedTokenId, setMintedTokenId] = useState(null);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const addAttribute = () => {
        setAttributes([...attributes, { trait_type: '', value: '' }]);
    };

    const updateAttribute = (index, field, value) => {
        const newAttrs = [...attributes];
        newAttrs[index][field] = value;
        setAttributes(newAttrs);
    };

    const removeAttribute = (index) => {
        setAttributes(attributes.filter((_, i) => i !== index));
    };

    const handleCreate = async (e) => {
        e.preventDefault();

        if (!address) {
            setError('Подключите кошелек!');
            return;
        }

        if (!imageFile) {
            setError('Выберите изображение!');
            return;
        }

        if (!name) {
            setError('Введите название NFT!');
            return;
        }

        setLoading(true);
        setStep(1);
        setError(null);

        try {
            // Фильтруем пустые атрибуты
            const validAttributes = attributes.filter(a => a.trait_type && a.value);

            // Шаг 1: Загружаем на IPFS
            const uploadResult = await uploadNFTToIPFS(imageFile, name, description, validAttributes);

            if (!uploadResult.success) {
                throw new Error(uploadResult.error);
            }

            console.log('IPFS загружен:', uploadResult);
            setStep(2);

            // Шаг 2: Минтим NFT
            await mintNFT(address, uploadResult.metadataUrl);

            setStep(3);
            setError(null);
        } catch (err) {
            console.error('Ошибка создания NFT:', err);
            setError(err.message || 'Ошибка при создании NFT');
            setStep(0);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setName('');
        setDescription('');
        setImageFile(null);
        setImagePreview(null);
        setAttributes([{ trait_type: '', value: '' }]);
        setStep(0);
        setError(null);
        setMintedTokenId(null);
    };

    return (
        <Card className="shadow-sm border-0" style={{ borderRadius: '20px' }}>
            <Card.Body className="p-4">
                <h4 className="fw-bold mb-4">🎨 Создать новый NFT</h4>

                {/* Прогресс */}
                {step > 0 && (
                    <div className="mb-4">
                        <ProgressBar now={step * 33} variant="primary" style={{ height: '8px', borderRadius: '4px' }} />
                        <div className="d-flex justify-content-between mt-2">
                            <small className={step >= 1 ? 'text-primary fw-bold' : 'text-muted'}>📤 Загрузка</small>
                            <small className={step >= 2 ? 'text-primary fw-bold' : 'text-muted'}>⛓️ Минтинг</small>
                            <small className={step >= 3 ? 'text-success fw-bold' : 'text-muted'}>✅ Готово</small>
                        </div>
                    </div>
                )}

                {/* Ошибка */}
                {error && (
                    <Alert variant="danger" dismissible onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                {/* Успех */}
                {step === 3 && (
                    <Alert variant="success">
                        <h5>🎉 NFT успешно создан!</h5>
                        {hash && (
                            <p className="mb-0">
                                <small>TX: <a href={`https://sepolia.etherscan.io/tx/${hash}`} target="_blank" rel="noopener noreferrer">{hash.slice(0, 10)}...{hash.slice(-8)}</a></small>
                            </p>
                        )}
                        <Button variant="outline-success" size="sm" className="mt-2" onClick={resetForm}>
                            Создать еще один
                        </Button>
                    </Alert>
                )}

                {step < 3 && (
                    <Form onSubmit={handleCreate}>
                        <Row>
                            {/* Загрузка изображения */}
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>📷 Изображение</Form.Label>
                                    <div
                                        style={{
                                            border: '2px dashed #e2e8f0',
                                            borderRadius: '12px',
                                            padding: '20px',
                                            textAlign: 'center',
                                            cursor: 'pointer',
                                            minHeight: '250px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            background: imagePreview ? `url(${imagePreview}) center/cover` : '#f8fafc',
                                        }}
                                        onClick={() => document.getElementById('imageInput').click()}
                                    >
                                        {!imagePreview && (
                                            <div>
                                                <span style={{ fontSize: '48px' }}>🖼️</span>
                                                <p className="text-muted mt-2">Нажмите для загрузки</p>
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        id="imageInput"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        style={{ display: 'none' }}
                                        disabled={loading}
                                    />
                                </Form.Group>
                            </Col>

                            {/* Информация */}
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>📝 Название</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Мой NFT"
                                        disabled={loading}
                                        style={{ borderRadius: '10px' }}
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>📄 Описание</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Описание вашего NFT..."
                                        disabled={loading}
                                        style={{ borderRadius: '10px' }}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        {/* Атрибуты */}
                        <div className="mb-3">
                            <Form.Label>🏷️ Атрибуты</Form.Label>
                            {attributes.map((attr, index) => (
                                <div key={index} className="d-flex gap-2 mb-2">
                                    <Form.Control
                                        type="text"
                                        placeholder="Тип"
                                        value={attr.trait_type}
                                        onChange={(e) => updateAttribute(index, 'trait_type', e.target.value)}
                                        disabled={loading}
                                        style={{ borderRadius: '10px', width: '40%' }}
                                    />
                                    <Form.Control
                                        type="text"
                                        placeholder="Значение"
                                        value={attr.value}
                                        onChange={(e) => updateAttribute(index, 'value', e.target.value)}
                                        disabled={loading}
                                        style={{ borderRadius: '10px', width: '40%' }}
                                    />
                                    <Button
                                        variant="outline-danger"
                                        size="sm"
                                        onClick={() => removeAttribute(index)}
                                        disabled={loading || attributes.length === 1}
                                        style={{ borderRadius: '10px' }}
                                    >
                                        ✕
                                    </Button>
                                </div>
                            ))}
                            <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={addAttribute}
                                disabled={loading}
                                style={{ borderRadius: '10px' }}
                            >
                                + Добавить атрибут
                            </Button>
                        </div>

                        {/* Кнопка создания */}
                        <Button
                            type="submit"
                            disabled={loading || !address}
                            style={{
                                width: '100%',
                                padding: '14px',
                                background: loading ? '#94a3b8' : 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                                border: 'none',
                                borderRadius: '12px',
                                fontWeight: '600',
                                fontSize: '16px',
                            }}
                        >
                            {loading ? (
                                <><Spinner size="sm" className="me-2" /> Создание...</>
                            ) : (
                                '🎨 Создать NFT'
                            )}
                        </Button>
                    </Form>
                )}
            </Card.Body>
        </Card>
    );
}