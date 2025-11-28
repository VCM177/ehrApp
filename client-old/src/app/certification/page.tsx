'use client';

import { useState } from 'react';
import useWeb3 from '../../../hooks/useWeb3';

export default function Certification() {
    const { contract, account, isConnected } = useWeb3();
    const [fileHash, setFileHash] = useState('');
    const [status, setStatus] = useState('');

    const handleSubmit = async (e:any) => {
        e.preventDefault();
        if (!isConnected || !contract) {
            setStatus('Vui lòng kết nối với MetaMask');
            return;
        }

        try {
            setStatus('Đang ghi hash...');
            await (contract as any).methods.recordHash(fileHash)
                .send({ from: account[0] });
            setStatus('Hash đã được ghi thành công!');
        } catch (error: any) {
            setStatus('Lỗi: ' + error.message);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">Ghi chứng thực hồ sơ</h1>

            <form onSubmit={handleSubmit} className="max-w-md">
                <div className="mb-4">
                    <label className="block text-gray-700 mb-2">
                        Hash của hồ sơ (bytes32):
                    </label>
                    <input
                        type="text"
                        value={fileHash}
                        onChange={(e) => setFileHash(e.target.value)}
                        className="w-full p-2 border rounded"
                        placeholder="0x..."
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={!isConnected}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
                >
                    Ghi hash
                </button>

                {status && (
                    <p className="mt-4 p-3 border rounded">
                        {status}
                    </p>
                )}
            </form>
        </div>
    );
}