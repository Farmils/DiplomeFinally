import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Card, Form, Button, ProgressBar, Alert, Spinner, Row, Col } from 'react-bootstrap';
import { uploadNFTToIPFS } from '../../../core/serivces/pinata.js';
import { useMintNFT } from '../../../core/serivces/hooks/useMintNFT.js';
import { useListNFT } from '../../../core/serivces/hooks/useMarketplace.js';
import { useNFTApproval } from '../../../core/serivces/hooks/useApprovals.js';

export default function CreateNFT() {
    const { address } = useAccount();
    const { mintNFT, isPending: isMinting, isConfirming: isMintingConfirming } = useMintNFT();
    const { listNFT, isPending: isListing, isConfirming: isListingConfirming } = useListNFT();
    const { approveSingle, checkApproval } = useNFTApproval();

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [attributes, setAttributes] = useState([{ trait_type: '', value: '' }]);
    const [price, setPrice] = useState('');
    const [paymentToken, setPaymentToken] = useState('0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(0);
    const [error, setError] = useState(null);
    const [mintedTokenId, setMintedTokenId] = useState(null);
    const [uploadResult, setUploadResult] = useState(null);

    // ПЕРЕМЕЩАЕМ СЮДА (перед использованием)
    const isMinted = step >= 3;
    const isProcessing = loading || isMinting || isMintingConfirming || isListing || isListingConfirming;

    // useEffect ПОСЛЕ объявления переменных
    useEffect(() => {
        if (isMintingConfirming && uploadResult) {
            setStep(3);
            setLoading(false);
        }
    }, [isMintingConfirming]);

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

        if (!address) { setError('Подключите кошелек!'); return; }
        if (!imageFile) { setError('Выберите изображение!'); return; }
        if (!name) { setError('Введите название NFT!'); return; }
        if (!price || parseFloat(price) <= 0) { setError('Укажите цену!'); return; }

        setLoading(true);
        setStep(1);
        setError(null);

        try {
            const validAttributes = attributes.filter(a => a.trait_type && a.value);

            // Шаг 1: IPFS
            const result = await uploadNFTToIPFS(imageFile, name, description, validAttributes);
            if (!result.success) throw new Error(result.error);
            console.log('✅ IPFS:', result);
            setUploadResult(result);

            // Шаг 2: Минт
            setStep(2);
            await mintNFT(address, result.metadataUrl);

        } catch (err) {
            console.error('Ошибка:', err);
            setError(err.shortMessage || err.message || 'Ошибка');
            setStep(0);
            setLoading(false);
        }
    };

    const handleListOnMarketplace = async () => {
        if (!uploadResult) {
            setError('Нет данных для листинга');
            return;
        }

        setStep(4);
        setLoading(true);

        try {
            // Approve
            const approval = await checkApproval(mintedTokenId || 1);
            if (!approval.isApproved) {
                await approveSingle(mintedTokenId || 1);
            }

            // List
            await listNFT(mintedTokenId || 1, price, paymentToken);
            setStep(5);
        } catch (err) {
            console.error('Ошибка листинга:', err);
            setError(err.shortMessage || err.message || 'Ошибка листинга');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setName(''); setDescription(''); setImageFile(null); setImagePreview(null);
        setAttributes([{ trait_type: '', value: '' }]); setPrice('');
        setStep(0); setError(null); setMintedTokenId(null); setUploadResult(null);
    };

    return (
        <Card className="shadow-sm border-0" style={{ borderRadius: '20px' }}>
            <Card.Body className="p-4">
                <h4 className="fw-bold mb-4">🎨 Создать и продать NFT</h4>

                {step > 0 && (
                    <div className="mb-4">
                        <ProgressBar now={step * 20} variant={step >= 5 ? 'success' : 'primary'} style={{ height: '8px', borderRadius: '4px' }} />
                        <div className="d-flex justify-content-between mt-2">
                            <small className={step >= 1 ? 'text-primary fw-bold' : 'text-muted'}>📤 IPFS</small>
                            <small className={step >= 2 ? 'text-primary fw-bold' : 'text-muted'}>⛓️ Минт</small>
                            <small className={step >= 3 ? 'text-primary fw-bold' : 'text-muted'}>✅ Готово</small>
                            <small className={step >= 4 ? 'text-primary fw-bold' : 'text-muted'}>💰 Листинг</small>
                            <small className={step >= 5 ? 'text-success fw-bold' : 'text-muted'}>🛒 Продается</small>
                        </div>
                    </div>
                )}

                {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}

                {step === 3 && (
                    <Alert variant="success">
                        <h5>✅ NFT создан!</h5>
                        <p>Хотите выставить его на маркетплейс?</p>
                        <div className="d-flex gap-2">
                            <Button variant="primary" onClick={handleListOnMarketplace} disabled={isProcessing}>
                                💰 Выставить на продажу за {price} токенов
                            </Button>
                            <Button variant="outline-secondary" onClick={resetForm}>Позже</Button>
                        </div>
                    </Alert>
                )}

                {step === 5 && (
                    <Alert variant="success">
                        <h5>🎉 NFT создан и выставлен на продажу!</h5>
                        <Button variant="outline-success" onClick={resetForm}>Создать еще</Button>
                    </Alert>
                )}

                {step === 0 && (
                    <Form onSubmit={handleCreate}>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>📷 Изображение</Form.Label>
                                    <div
                                        style={{ border: '2px dashed #e2e8f0', borderRadius: '12px', padding: '20px', textAlign: 'center', cursor: 'pointer', minHeight: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: imagePreview ? `url(${imagePreview}) center/cover` : '#f8fafc' }}
                                        onClick={() => document.getElementById('imageInput').click()}
                                    >
                                        {!imagePreview && <div><span style={{ fontSize: '48px' }}>🖼️</span><p className="text-muted mt-2">Нажмите для загрузки</p></div>}
                                    </div>
                                    <input id="imageInput" type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} disabled={isProcessing} />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>📝 Название</Form.Label>
                                    <Form.Control type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Мой NFT" disabled={isProcessing} style={{ borderRadius: '10px' }} />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>📄 Описание</Form.Label>
                                    <Form.Control as="textarea" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Описание..." disabled={isProcessing} style={{ borderRadius: '10px' }} />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>💰 Цена на маркетплейсе</Form.Label>
                                    <Form.Control type="number" step="0.001" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.1" disabled={isProcessing} style={{ borderRadius: '10px' }} />
                                </Form.Group>
                            </Col>
                        </Row>

                        <div className="mb-3">
                            <Form.Label>🏷️ Атрибуты</Form.Label>
                            {attributes.map((attr, index) => (
                                <div key={index} className="d-flex gap-2 mb-2">
                                    <Form.Control type="text" placeholder="Тип" value={attr.trait_type} onChange={(e) => updateAttribute(index, 'trait_type', e.target.value)} disabled={isProcessing} style={{ borderRadius: '10px', width: '40%' }} />
                                    <Form.Control type="text" placeholder="Значение" value={attr.value} onChange={(e) => updateAttribute(index, 'value', e.target.value)} disabled={isProcessing} style={{ borderRadius: '10px', width: '40%' }} />
                                    <Button variant="outline-danger" size="sm" onClick={() => removeAttribute(index)} disabled={isProcessing || attributes.length === 1} style={{ borderRadius: '10px' }}>✕</Button>
                                </div>
                            ))}
                            <Button variant="outline-secondary" size="sm" onClick={addAttribute} disabled={isProcessing} style={{ borderRadius: '10px' }}>+ Добавить атрибут</Button>
                        </div>

                        <Button type="submit" disabled={isProcessing || !address} style={{ width: '100%', padding: '14px', background: isProcessing ? '#94a3b8' : 'linear-gradient(135deg, #8b5cf6, #6366f1)', border: 'none', borderRadius: '12px', fontWeight: '600', fontSize: '16px' }}>
                            {isProcessing ? <><Spinner size="sm" className="me-2" />Создание...</> : '🎨 Создать и продать NFT'}
                        </Button>
                    </Form>
                )}

                {step === 1 && <div className="text-center py-4"><Spinner animation="border" variant="primary" /><p className="mt-3">📤 Загрузка на IPFS...</p></div>}
                {step === 2 && <div className="text-center py-4"><Spinner animation="border" variant="primary" /><p className="mt-3">⛓️ Минтим NFT...</p></div>}
                {step === 4 && <div className="text-center py-4"><Spinner animation="border" variant="primary" /><p className="mt-3">💰 Выставляем на маркетплейс...</p></div>}
            </Card.Body>
        </Card>
    );
}